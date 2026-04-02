import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { UserRole } from '@/types/auth'
import type { UserInfo, LoginResponse } from '@/types/auth'
import { loginByPassword, loginByCode, logout as logoutApi } from '@/api/auth'
import { getCurrentUserInfo } from '@/api/user'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const token = ref<string | null>(localStorage.getItem('token'))
  const userInfo = ref<UserInfo | null>(loadStoredUserInfo())

  function persistUserInfo(newUserInfo: UserInfo | null) {
    if (!newUserInfo) {
      localStorage.removeItem('userInfo')
      return
    }
    localStorage.setItem('userInfo', JSON.stringify(newUserInfo))
  }

  // 计算属性
  const isAuthenticated = computed(() => !!token.value)
  const userRole = computed(() => userInfo.value?.role)
  const currentUserId = computed<string | undefined>(() => {
    if (userInfo.value?.userId) return String(userInfo.value.userId)
    if (!token.value) return undefined
    return getUserIdFromJwt(token.value)
  })

  // Actions
  async function loginByPasswordAction(login: string, password: string): Promise<LoginResponse> {
    const response = await loginByPassword({ login, password })
    setToken(response.token)
    updateUserInfo(response)
    await syncCurrentUserProfile()
    return response
  }

  async function loginByCodeAction(email: string, code: string): Promise<LoginResponse> {
    const response = await loginByCode({ email, code })
    setToken(response.token)
    updateUserInfo(response)
    await syncCurrentUserProfile()
    return response
  }

  function setToken(newToken: string) {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  function updateUserInfo(response: LoginResponse) {
    userInfo.value = {
      userId: response.userId,
      email: '',
      role: response.role,
    }
    persistUserInfo(userInfo.value)
  }

  function setUserProfile(profile: UserInfo) {
    userInfo.value = {
      userId: profile.userId,
      username: profile.username,
      email: profile.email,
      role: profile.role,
    }
    persistUserInfo(userInfo.value)
  }

  async function syncCurrentUserProfile(): Promise<void> {
    if (!token.value) return
    try {
      const profile = await getCurrentUserInfo()
      setUserProfile({
        userId: profile.userId,
        username: profile.username,
        email: profile.email,
        role: profile.role,
      })
    } catch {
      // 登录成功后，个人信息同步失败时保持现有状态
    }
  }

  function clearToken() {
    token.value = null
    userInfo.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
  }

  async function logout() {
    try {
      await logoutApi()
    } catch {
      // 即使API失败也清除本地状态
    } finally {
      clearToken()
    }
  }

  // 根据角色获取跳转路径
  function getRoleRedirectPath(): string {
    const role = userRole.value
    switch (role) {
      case UserRole.ADMIN:
        return '/admin'
      case UserRole.DRIVER:
        return '/driver'
      case UserRole.SUPPORT:
        return '/support'
      case UserRole.USER:
      default:
        return '/user'
    }
  }

  return {
    token,
    userInfo,
    isAuthenticated,
    userRole,
    currentUserId,
    loginByPasswordAction,
    loginByCodeAction,
    setToken,
    updateUserInfo,
    setUserProfile,
    syncCurrentUserProfile,
    clearToken,
    logout,
    getRoleRedirectPath,
  }
})

function getUserIdFromJwt(rawToken: string): string | undefined {
  // 仅处理形如 header.payload.signature 的 JWT；非 JWT 直接跳过
  const parts = rawToken.split('.')
  if (parts.length < 2) return undefined

  const payload = parts[1]
  if (!payload) return undefined
  try {
    const json = base64UrlDecodeToString(payload)
    const data = JSON.parse(json) as Record<string, unknown>
    const userId = data.userId ?? data.uid
    if (typeof userId === 'string' && userId.trim()) return userId.trim()
    if (typeof userId === 'number' && Number.isFinite(userId)) return String(userId)
    return undefined
  } catch {
    return undefined
  }
}

function base64UrlDecodeToString(input: string): string {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
  // 浏览器环境优先使用 atob
  if (typeof atob === 'function') {
    // atob 返回 latin1 字符串，这里只处理 UTF-8 JSON（常见）
    const binary = atob(padded)
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
    return new TextDecoder().decode(bytes)
  }
  // 兜底：在某些非浏览器环境下使用 Buffer
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buf = (globalThis as any).Buffer
  if (buf) {
    return buf.from(padded, 'base64').toString('utf-8')
  }
  throw new Error('No base64 decoder available')
}

function loadStoredUserInfo(): UserInfo | null {
  const raw = localStorage.getItem('userInfo')
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<UserInfo>
    if (!parsed || !parsed.userId || !parsed.role) return null
    return {
      userId: String(parsed.userId),
      email: typeof parsed.email === 'string' ? parsed.email : '',
      role: parsed.role as UserInfo['role'],
      username: typeof parsed.username === 'string' ? parsed.username : undefined,
    }
  } catch {
    return null
  }
}
