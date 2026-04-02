import request from '@/utils/request'
import type {
  SendEmailCodeParams,
  RegisterParams,
  LoginByPasswordParams,
  LoginByCodeParams,
  ResetPasswordParams,
  LoginResponse,
  RegisterResponse,
} from '@/types/auth'

const AUTH_BASE_URL = '/auth'

/**
 * 发送邮件验证码
 */
export function sendEmailCode(params: SendEmailCodeParams): Promise<void> {
  return request.post(`${AUTH_BASE_URL}/email-code`, params)
}

/**
 * 注册账号
 */
export function register(params: RegisterParams): Promise<RegisterResponse> {
  return request.post(`${AUTH_BASE_URL}/register`, params)
}

/**
 * 密码登录
 */
export function loginByPassword(params: LoginByPasswordParams): Promise<LoginResponse> {
  return request.post(`${AUTH_BASE_URL}/login/password`, params)
}

/**
 * 验证码登录
 */
export function loginByCode(params: LoginByCodeParams): Promise<LoginResponse> {
  return request.post(`${AUTH_BASE_URL}/login/email-code`, params)
}

/**
 * 忘记密码重置
 */
export function resetPassword(params: ResetPasswordParams): Promise<void> {
  return request.post(`${AUTH_BASE_URL}/password/reset`, params)
}

/**
 * 登出
 */
export function logout(): Promise<void> {
  return request.post(`${AUTH_BASE_URL}/logout`)
}
