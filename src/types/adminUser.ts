export type UserRole = 'ADMIN' | 'SUPPORT' | 'DRIVER' | 'USER'

export interface AdminUserRecord {
  userId: string
  userName: string
  email?: string | null
  role: UserRole | string
  status: 0 | 1
  createTime: string
}

export interface AdminUserPageResult {
  records: AdminUserRecord[]
  total: number
  page: number
  size: number
}

export interface AdminUserPageQuery {
  current: number
  size: number
  username?: string
  role?: UserRole
  deleted?: boolean
}

export interface AdminUserCreatePayload {
  userName: string
  password: string
  role: UserRole
}

export interface AdminUserUpdatePayload {
  userId: string
  username?: string
  email?: string
  password?: string
  role?: UserRole
}

export interface UserIdListPayload {
  userIds: string[]
}
