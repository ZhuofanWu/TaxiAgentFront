import type { UserRole } from '@/types/auth'

// 分页结果
export interface PageResult<T> {
  records: T[]
  total: number
  current: number
  size: number
}

// 客服用户简要信息
export interface SupportUserVO {
  userId: number
  userName: string
}

// 客服查询参数
export interface SupportQueryParams {
  current: number
  size: number
  keyword?: string
}

// 用户定位信息
export interface UserLocation {
  latitude: string
  longitude: string
  address: string
}

export interface UserPoi {
  id: number
  poiTag: string
  poiName: string
  poiAddress: string
  longitude: string
  latitude: string
}

export interface UserPoiOrder {
  home?: UserPoi | null
  work?: UserPoi | null
  other?: UserPoi[]
}

export interface UserCurrentInfo {
  userId: string
  username: string
  email: string
  role: UserRole
  lastLoginTime: string
  createTime: string
}

export interface UserCurrentUpdatePayload {
  username?: string
  email?: string
}

export interface UserPasswordResetPayload {
  password: string
}
