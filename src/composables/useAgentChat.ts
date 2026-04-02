import { computed, ref } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { useMessage } from 'naive-ui'
import { useAuthStore } from '@/stores/auth'
import {
  getRestorableChat,
  lockChatSession,
  requestNewChatUuid,
  restoreChatSession,
} from '@/api/chat'
import type {
  AgentChatMessage,
  AgentChatRole,
  AgentConfirmPayload,
  AgentConfirmPayloadValue,
  AgentEventType,
  AgentHistoryMessage,
  AgentRestorePayload,
  RawAgentEvent,
} from '@/types/agentChat'

const DEFAULT_MODEL = 'DEEPSEEK_R1'
const READY_TEXT = '就绪'
const CONFIRM_TEXT = '等待确认'
const CONNECTING_TEXT = '正在连接...'
const STREAMING_TEXT = '正在接收...'

const EVENT_TYPES: AgentEventType[] = ['message', 'tool_start', 'confirm', 'notify', 'error']

export function useAgentChat() {
  const message = useMessage()
  const authStore = useAuthStore()

  const chatId = ref('')
  const messages = ref<AgentChatMessage[]>([])
  const confirmPayload = ref<AgentConfirmPayload | null>(null)
  const hasRestorable = ref(false)
  const statusText = ref(READY_TEXT)
  const isStreaming = ref(false)
  const receivedEvents = ref(0)
  const isTransitioning = ref(false)
  const serverChatActive = ref(false)
  const streamingAssistantId = ref<string | null>(null)
  const abortController = ref<AbortController | null>(null)

  const waitingForConfirmation = computed(() => confirmPayload.value !== null)
  const inputDisabled = computed(
    () => !chatId.value || isStreaming.value || waitingForConfirmation.value,
  )

  function createMessageId() {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID()
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`
  }

  function appendMessage(role: AgentChatRole, content: string) {
    const id = createMessageId()
    messages.value.push({ id, role, content, createdAt: Date.now() })
    return id
  }

  function normalizeMessageText(text: string) {
    return text.replace(/\n{3,}/g, '\n\n')
  }

  function appendAssistantChunk(content: string) {
    const text = normalizeMessageText(content)
    if (streamingAssistantId.value) {
      const target = messages.value.find((item) => item.id === streamingAssistantId.value)
      if (target) {
        target.content += text
        return
      }
    }
    streamingAssistantId.value = appendMessage('assistant', text)
  }

  function resetMessages(showGreeting = true) {
    messages.value = []
    confirmPayload.value = null
    streamingAssistantId.value = null
    receivedEvents.value = 0
    serverChatActive.value = false
    if (showGreeting) {
      appendMessage('assistant', '您好！我是智能体助手。请告诉我您需要什么帮助？')
    }
  }

  function resolveErrorMessage(error: unknown, fallback: string) {
    return error instanceof Error ? error.message : fallback
  }

  function toPayloadString(payload: unknown) {
    if (payload === null || payload === undefined) return ''
    if (typeof payload === 'string') return payload
    if (typeof payload === 'number' || typeof payload === 'boolean') return String(payload)
    try {
      return JSON.stringify(payload)
    } catch {
      return String(payload)
    }
  }

  function normalizeConfirmValue(value: unknown): AgentConfirmPayloadValue {
    if (value === null || value === undefined) return null
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return value
    }
    try {
      return JSON.stringify(value)
    } catch {
      return String(value)
    }
  }

  function parseConfirmPayload(payload: unknown): AgentConfirmPayload | null {
    if (typeof payload === 'string') {
      try {
        return parseConfirmPayload(JSON.parse(payload) as unknown)
      } catch {
        return null
      }
    }
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null
    const record = payload as Record<string, unknown>
    const parsed: AgentConfirmPayload = {}
    Object.entries(record).forEach(([key, value]) => {
      parsed[key] = normalizeConfirmValue(value)
    })
    return parsed
  }

  function isAgentEventType(value: unknown): value is AgentEventType {
    return typeof value === 'string' && EVENT_TYPES.includes(value as AgentEventType)
  }

  function parseAgentEvent(payloadText: string): RawAgentEvent | null {
    let data: unknown
    try {
      data = JSON.parse(payloadText)
    } catch {
      return null
    }
    if (!data || typeof data !== 'object') return null
    const record = data as Record<string, unknown>
    if (!isAgentEventType(record.type)) return null
    return {
      type: record.type,
      payload: record.payload,
    }
  }

  function handleAgentEvent(event: RawAgentEvent) {
    if (event.type === 'message') {
      appendAssistantChunk(toPayloadString(event.payload))
      return
    }
    if (event.type === 'tool_start') {
      appendMessage('tool', `> [工具]: ${toPayloadString(event.payload)}`)
      streamingAssistantId.value = null
      return
    }
    if (event.type === 'confirm') {
      const parsed = parseConfirmPayload(event.payload)
      if (parsed) {
        confirmPayload.value = parsed
        statusText.value = CONFIRM_TEXT
      } else {
        appendMessage('error', '确认信息解析失败')
      }
      return
    }
    if (event.type === 'notify') {
      appendMessage('notify', toPayloadString(event.payload))
      return
    }
    if (event.type === 'error') {
      appendMessage('error', toPayloadString(event.payload))
    }
  }

  function normalizeLine(line: string) {
    const trimmed = line.trim()
    if (!trimmed) return null
    if (trimmed.startsWith('data:')) {
      const payload = trimmed.slice(5).trim()
      if (!payload || payload === '[DONE]') return null
      return payload
    }
    if (trimmed.startsWith('event:') || trimmed.startsWith(':')) return null
    return trimmed
  }

  function extractFirstJson(text: string) {
    const start = text.indexOf('{')
    if (start < 0) return { jsonText: null, rest: text }

    let inString = false
    let escape = false
    let depth = 0

    for (let i = start; i < text.length; i += 1) {
      const ch = text[i]
      if (escape) {
        escape = false
        continue
      }
      if (inString) {
        if (ch === '\\') {
          escape = true
        } else if (ch === '"') {
          inString = false
        }
        continue
      }
      if (ch === '"') {
        inString = true
        continue
      }
      if (ch === '{') {
        depth += 1
      } else if (ch === '}') {
        depth -= 1
        if (depth === 0) {
          return { jsonText: text.slice(start, i + 1), rest: text.slice(i + 1) }
        }
      }
    }
    return { jsonText: null, rest: text }
  }

  function consumeBuffer(state: { buffer: string }) {
    while (true) {
      const idx = state.buffer.indexOf('\n')
      if (idx === -1) break
      const line = state.buffer.slice(0, idx)
      state.buffer = state.buffer.slice(idx + 1)
      const normalized = normalizeLine(line)
      if (!normalized) continue
      const event = parseAgentEvent(normalized)
      if (!event) {
        state.buffer = `${normalized}\n${state.buffer}`
        break
      }
      handleAgentEvent(event)
      receivedEvents.value += 1
    }

    while (true) {
      const { jsonText, rest } = extractFirstJson(state.buffer)
      if (!jsonText) break
      const event = parseAgentEvent(jsonText)
      if (!event) break
      handleAgentEvent(event)
      receivedEvents.value += 1
      state.buffer = rest
    }
  }

  async function processStream(response: Response) {
    if (!response.body) {
      throw new Error('响应体为空')
    }
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    const state = { buffer: '' }

    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        consumeBuffer(state)
        break
      }
      state.buffer += decoder.decode(value, { stream: true })
      consumeBuffer(state)
    }
  }

  function abortStream() {
    if (abortController.value) {
      abortController.value.abort()
      abortController.value = null
    }
    isStreaming.value = false
  }

  async function streamChat(endpoint: string, prompt: string) {
    if (!chatId.value) {
      message.error('对话尚未初始化')
      return
    }

    abortStream()
    const controller = new AbortController()
    abortController.value = controller

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/stream+json',
    }
    if (authStore.token) {
      headers.Authorization = `Bearer ${authStore.token}`
    }

    const baseUrl = import.meta.env.VITE_API_BASE_URL || ''
    const url = `${baseUrl}${endpoint}`

    isStreaming.value = true
    statusText.value = CONNECTING_TEXT
    receivedEvents.value = 0
    streamingAssistantId.value = null

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ prompt, model: DEFAULT_MODEL }),
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      statusText.value = STREAMING_TEXT
      await processStream(response)
    } catch (error) {
      const isAbortError =
        error instanceof DOMException
          ? error.name === 'AbortError'
          : error instanceof Error && error.name === 'AbortError'
      if (!isAbortError) {
        appendMessage('error', resolveErrorMessage(error, '请求失败'))
      }
    } finally {
      abortController.value = null
      isStreaming.value = false
      statusText.value = confirmPayload.value ? CONFIRM_TEXT : READY_TEXT
    }
  }

  async function sendPrompt(prompt: string) {
    if (!prompt.trim()) return
    if (waitingForConfirmation.value) return
    appendMessage('user', prompt)
    serverChatActive.value = true
    await streamChat(`/chat/v2/c/${chatId.value}`, prompt)
  }

  async function sendResume(prompt: string) {
    if (!prompt.trim()) return
    confirmPayload.value = null
    appendMessage('user', prompt)
    serverChatActive.value = true
    await streamChat(`/chat/v2/r/${chatId.value}`, prompt)
  }

  async function checkRestorable() {
    try {
      hasRestorable.value = await getRestorableChat()
    } catch (error) {
      hasRestorable.value = false
      message.warning(resolveErrorMessage(error, '获取可恢复对话失败'))
    }
  }

  function mapHistoryMessages(items: AgentHistoryMessage[]): AgentChatMessage[] {
    return items.map((item) => {
      const roleKey = item.role?.toUpperCase?.() || ''
      const role: AgentChatRole =
        roleKey === 'USER'
          ? 'user'
          : roleKey === 'SYSTEM'
            ? 'system'
            : roleKey === 'TOOL'
              ? 'tool'
              : 'assistant'
      return {
        id: createMessageId(),
        role,
        content: item.content,
        createdAt: Date.now(),
      }
    })
  }

  async function restorePreviousChat() {
    isTransitioning.value = true
    abortStream()
    try {
      const payload: AgentRestorePayload = await restoreChatSession()
      const restoredId = payload.id || payload.chatId
      if (!restoredId) {
        throw new Error('恢复对话失败：缺少会话ID')
      }
      chatId.value = restoredId
      messages.value = mapHistoryMessages(payload.messages)
      hasRestorable.value = false
      confirmPayload.value = null
      serverChatActive.value = true
      receivedEvents.value = 0
      streamingAssistantId.value = null
      statusText.value = READY_TEXT
    } catch (error) {
      message.error(resolveErrorMessage(error, '恢复对话失败'))
    } finally {
      isTransitioning.value = false
    }
  }

  async function lockCurrentChat(silent = false) {
    if (!chatId.value || !serverChatActive.value) return
    try {
      await lockChatSession(chatId.value)
    } catch (error) {
      if (!silent) {
        message.warning(resolveErrorMessage(error, '锁定对话失败'))
      }
    }
  }

  async function requestNewUuid(silent = false) {
    try {
      chatId.value = await requestNewChatUuid()
    } catch (error) {
      chatId.value = ''
      if (!silent) {
        message.error(resolveErrorMessage(error, '获取新会话失败'))
      }
    }
  }

  async function startNewChat() {
    isTransitioning.value = true
    abortStream()
    try {
      await lockCurrentChat()
      await requestNewUuid()
      resetMessages(true)
      statusText.value = READY_TEXT
    } finally {
      isTransitioning.value = false
    }
  }

  async function initialize() {
    resetMessages(true)
    await requestNewUuid()
    await checkRestorable()
  }

  async function lockAndRenew() {
    abortStream()
    await lockCurrentChat(true)
    await requestNewUuid(true)
  }

  onBeforeRouteLeave(() => {
    void lockAndRenew()
  })

  return {
    chatId,
    messages,
    confirmPayload,
    hasRestorable,
    statusText,
    isStreaming,
    receivedEvents,
    isTransitioning,
    inputDisabled,
    waitingForConfirmation,
    initialize,
    sendPrompt,
    sendResume,
    restorePreviousChat,
    startNewChat,
  }
}
