// 工单类型枚举
export enum TicketType {
  LOST = 1, // 物品遗失
  FEE = 2, // 费用争议
  COMPLAINT = 3, // 服务投诉
  SAFETY = 4, // 安全问题
  OTHER = 5, // 其他
}

// 工单状态枚举
export enum TicketStatus {
  PENDING = 0, // 待分配
  PROCESSING = 1, // 处理中
  CONFIRM = 2, // 待用户确认
  DONE = 3, // 已完成
  CLOSED = 4, // 已关闭
}

// 优先级枚举
export enum TicketPriority {
  NORMAL = 1, // 普通
  URGENT = 2, // 紧急
  EMERGENCY = 3, // 特急
}

// 发送者角色枚举
export enum SenderRole {
  SYSTEM = 0, // 系统自动
  PASSENGER = 1, // 乘客
  DRIVER = 2, // 司机
  SUPPORT = 3, // 客服
}

// 工单处理动作枚举
export enum ActionType {
  REPLY = 'REPLY', // 仅回复（不改变状态）
  RESOLVE = 'RESOLVE', // 处理完成（流转到"待用户确认"）
  TRANSFER = 'TRANSFER', // 转交（回到"待分配"，清空 handler）
  REJECT = 'REJECT', // 驳回并关闭
}

// 用户类型枚举
export enum UserType {
  PASSENGER = 1, // 乘客
  DRIVER = 2, // 司机
}

// 工单简要信息（列表展示用）
export interface TicketVO {
  id: number
  ticketId: string
  userId: string // 改为string避免精度丢失
  userType: UserType
  userTypeDesc: string
  orderId?: string | number
  ticketType: TicketType
  ticketTypeDesc: string
  priority: TicketPriority
  priorityDesc: string
  ticketStatus: TicketStatus
  ticketStatusDesc: string
  handlerId?: string // 改为string避免精度丢失
  title: string
  contentSummary?: string
  createdAt: string
  updatedAt: string
}

// 工单详情（包含完整信息）
export interface TicketDetailVO {
  id: number
  ticketId: string
  userId: string // 改为string避免精度丢失
  userType: UserType
  userTypeDesc: string
  orderId?: string | number
  ticketType: TicketType
  ticketTypeDesc: string
  priority: TicketPriority
  priorityDesc: string
  ticketStatus: TicketStatus
  ticketStatusDesc: string
  handlerId?: string // 改为string避免精度丢失
  title: string
  content: string
  processResult?: string
  createdAt: string
  updatedAt: string
  chatHistory?: TicketChatVO[]
}

// 聊天记录
export interface TicketChatVO {
  id: number
  ticketId: string
  senderId: string // 改为string避免精度丢失
  senderRole: SenderRole
  senderRoleDesc: string
  content: string
  createdAt: string
}

// 工单简要信息
export interface TicketSimpleVO {
  ticketId: string
  createdAt: string
  ticketType: TicketType
  ticketTypeDesc: string
  title: string
  ticketStatus: TicketStatus
  ticketStatusDesc: string
}

// 工单查询参数
export interface TicketQueryParams {
  status?: number
  handlerId?: string // 改为string避免精度丢失
  keyword?: string
  current: number
  size: number
}

// 分配工单参数
export interface TicketAssignParams {
  ticketId: string
  handlerId: string
}

// 客服处理工单参数
export interface TicketHandleParams {
  ticketId: string
  content: string
  actionType: ActionType
}

// 工单统计数据（管理员首页仪表盘）
export interface TicketDataVO {
  pendingAssignCount: number // 待分配工单数量（status=0）
  processingCount: number // 处理中工单数量（status=1 且 handlerId不为空）
  todayCreatedCount: number // 今日创建工单数量
  todayCompletedCount: number // 今日完成工单数量（今日update且status=3）
}

// 工单统计信息（首页用）- 兼容组件使用
export interface TicketStats {
  pendingCount: number // 待分配数量
  processingCount: number // 处理中数量
  todayCount: number // 今日工单数
  completedCount: number // 今日完成数量
}
