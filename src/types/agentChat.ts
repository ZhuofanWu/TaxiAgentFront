export type AgentEventType = 'message' | 'tool_start' | 'confirm' | 'notify' | 'error'

export type AgentConfirmPayloadValue = string | number | boolean | null

export type AgentConfirmPayload = Record<string, AgentConfirmPayloadValue>

export interface RawAgentEvent {
  type: AgentEventType
  payload: unknown
}

export type AgentChatRole = 'user' | 'assistant' | 'tool' | 'notify' | 'error' | 'system'

export interface AgentChatMessage {
  id: string
  role: AgentChatRole
  content: string
  createdAt: number
}

export type AgentHistoryRole = 'USER' | 'ASSISTANT' | 'SYSTEM' | 'TOOL'

export interface AgentHistoryMessage {
  role: AgentHistoryRole
  content: string
}

export interface AgentRestorePayload {
  id?: string
  chatId?: string
  messages: AgentHistoryMessage[]
}
