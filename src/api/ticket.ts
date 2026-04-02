import request from '@/utils/request'
import type {
  TicketVO,
  TicketDetailVO,
  TicketChatVO,
  TicketQueryParams,
  TicketAssignParams,
  TicketHandleParams,
  TicketDataVO,
} from '@/types/ticket'
import type { PageResult } from '@/types/user'

// 工单池分页查询
export async function getTicketPage(params: TicketQueryParams): Promise<PageResult<TicketVO>> {
  return request.post('/ticket/admin/page', params)
}

// 获取工单详情
export async function getTicketDetail(ticketId: string): Promise<TicketDetailVO> {
  return request.get(`/ticket/detail/${ticketId}`)
}

// 获取工单聊天记录
export async function getTicketChat(ticketId: string): Promise<TicketChatVO[]> {
  return request.get(`/ticket/${ticketId}/chat`)
}

// 认领工单（分配给自己）
export async function claimTicket(ticketId: string): Promise<boolean> {
  return request.post(`/ticket/admin/assign/${ticketId}`)
}

// 分配工单给指定客服
export async function assignTicket(ticketId: string, handlerId: string): Promise<boolean> {
  return request.post(`/ticket/admin/assign/${ticketId}?handlerId=${handlerId}`)
}

// 管理员再分配工单
export async function reassignTicket(
  ticketId: string,
  handlerId?: string | number,
): Promise<boolean> {
  const query = handlerId !== undefined && handlerId !== null ? `?handlerId=${handlerId}` : ''
  return request.post(`/ticket/admin/reassign/${ticketId}${query}`)
}

// 客服处理工单（状态机）
export async function handleTicket(params: TicketHandleParams): Promise<boolean> {
  return request.post('/ticket/admin/process', params)
}

// 客服回复（快捷接口）
export async function replyTicket(ticketId: string, content: string): Promise<boolean> {
  return request.post('/ticket/admin/reply', { ticketId, content })
}

// 转交工单（将工单转回待分配状态，清空 handler）
export async function transferTicket(ticketId: string, content?: string): Promise<boolean> {
  return request.post('/ticket/admin/process', {
    ticketId,
    content: content || '',
    actionType: 'TRANSFER',
  })
}

// 驳回工单
export async function rejectTicket(ticketId: string, reason: string): Promise<boolean> {
  return request.post('/ticket/admin/process', { ticketId, content: reason, actionType: 'REJECT' })
}

// 获取工单统计数据（管理员首页仪表盘）
export async function getTicketStatistics(): Promise<TicketDataVO> {
  return request.get('/ticket/admin/statistics')
}

// 加急工单
export async function escalateTicket(
  ticketId: string,
  targetLevel: number,
  reason: string,
): Promise<boolean> {
  return request.post('/ticket/admin/escalate', { ticketId, targetLevel, reason })
}

// ==================== C端 API ====================

// 提交新工单（C端创建工单）
export async function createTicket(data: {
  orderId?: string | number
  ticketType: number
  priority: number
  title: string
  content: string
}): Promise<string> {
  return request.post('/ticket/submit', data)
}

// 取消/关闭工单
export async function cancelTicket(ticketId: string): Promise<boolean> {
  return request.post(`/ticket/cancel/${ticketId}`)
}

// 用户确认结单并评价
export async function feedbackTicket(data: {
  ticketId: string
  satisfied: boolean
  rating: number
  feedbackContent?: string
}): Promise<boolean> {
  return request.post('/ticket/feedback', data)
}

// C端分页查询我的工单
export async function getMyTicketPage(params: {
  status?: number
  type?: number
  keyword?: string
  current: number
  size: number
}): Promise<PageResult<TicketVO>> {
  return request.post('/ticket/my/page', params)
}

// 用户补充工单信息（回复）
export async function appendTicketMessage(data: {
  ticketId: string
  content: string
}): Promise<boolean> {
  return request.post('/ticket/my/append', data)
}

// 用户升级工单优先级（催办）
export async function escalateTicketByUser(data: {
  ticketId: string
  targetLevel: number
  reason: string
}): Promise<boolean> {
  return request.post('/ticket/my/escalate', data)
}
