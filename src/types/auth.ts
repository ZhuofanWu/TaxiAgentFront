// 验证码场景枚举
export enum EmailCodeScene {
  REGISTER = 'REGISTER',
  LOGIN = 'LOGIN',
  RESET_PASSWORD = 'RESET_PASSWORD',
}

// 用户角色枚举
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  DRIVER = 'DRIVER',
  SUPPORT = 'SUPPORT',
}

// 登录方式
export enum LoginType {
  PASSWORD = 'password',
  EMAIL_CODE = 'email_code',
}

// 发送验证码参数
export interface SendEmailCodeParams {
  email: string
  scene: EmailCodeScene
}

// 注册参数
export interface RegisterParams {
  email: string
  code: string
  password: string
  username?: string
}

// 密码登录参数
export interface LoginByPasswordParams {
  login: string // username 或 email
  password: string
}

// 验证码登录参数
export interface LoginByCodeParams {
  email: string
  code: string
}

// 统一登录参数（联合类型）
export type LoginParams = LoginByPasswordParams | LoginByCodeParams

// 忘记密码重置参数
export interface ResetPasswordParams {
  email: string
  code: string
  newPassword: string
}

// 登录响应数据
export interface LoginResponse {
  token: string
  expiresInSec: number
  role: UserRole
  userId: string
}

// 注册响应数据
export interface RegisterResponse {
  userId: string
}

// 通用API响应结构
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
  total?: number
}

// 用户信息（简化版）
export interface UserInfo {
  userId: string
  username?: string
  email: string
  role: UserRole
}

// Auth状态
export interface AuthState {
  token: string | null
  userInfo: UserInfo | null
  isAuthenticated: boolean
}
