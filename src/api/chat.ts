import request from '@/utils/request'
import type { AgentRestorePayload } from '@/types/agentChat'

export async function getRestorableChat(): Promise<boolean> {
  return request.get('/chat/v2/restore')
}

export async function restoreChatSession(): Promise<AgentRestorePayload> {
  return request.post('/chat/v2/restore')
}

export async function lockChatSession(chatId: string): Promise<null> {
  return request.post(`/chat/v2/lock/${chatId}`)
}

export async function requestNewChatUuid(): Promise<string> {
  return request.post('/chat/v2/newuuid')
}
