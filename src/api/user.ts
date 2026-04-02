import request from '@/utils/request'
import type {
  AdminUserCreatePayload,
  AdminUserPageQuery,
  AdminUserPageResult,
  AdminUserUpdatePayload,
  UserIdListPayload,
} from '@/types/adminUser'
import type {
  SupportUserVO,
  SupportQueryParams,
  PageResult,
  UserLocation,
  UserCurrentInfo,
  UserCurrentUpdatePayload,
  UserPasswordResetPayload,
} from '@/types/user'

// 分页获取所有客服
export async function getSupportUsers(
  params: SupportQueryParams,
): Promise<PageResult<SupportUserVO>> {
  return request.post('/user/admin/support/page', params)
}

// 管理员创建账号
export async function createAdminUser(payload: AdminUserCreatePayload): Promise<string> {
  return request.post('/user/admin/create', payload)
}

// 管理员分页查询用户
export async function getAdminUserPage(payload: AdminUserPageQuery): Promise<AdminUserPageResult> {
  return request.post('/user/admin/page', payload)
}

// 管理员修改用户
export async function updateAdminUser(payload: AdminUserUpdatePayload): Promise<void> {
  await request.post('/user/admin/update', payload)
}

// 管理员批量激活用户
export async function activateAdminUsers(payload: UserIdListPayload): Promise<number> {
  return request.post('/user/admin/activate', payload)
}

// 管理员批量禁用用户
export async function disableAdminUsers(payload: UserIdListPayload): Promise<number> {
  return request.post('/user/admin/disable', payload)
}

// 管理员批量删除用户
export async function deleteAdminUsers(payload: UserIdListPayload): Promise<number> {
  return request.post('/user/admin/delete', payload)
}

// 获取用户定位（C端）
export async function getUserLocation(): Promise<UserLocation> {
  return request.get('/user/loc')
}

// 保存用户定位（C端）
export async function saveUserLocation(location: UserLocation): Promise<void> {
  await request.post('/user/loc', location)
}

// 获取当前用户信息
export async function getCurrentUserInfo(): Promise<UserCurrentInfo> {
  return request.get('/user/current')
}

// 修改当前用户信息
export async function updateCurrentUserInfo(payload: UserCurrentUpdatePayload): Promise<void> {
  await request.post('/user/current/update', payload)
}

// 重置当前用户密码
export async function resetCurrentUserPassword(payload: UserPasswordResetPayload): Promise<void> {
  await request.post('/user/current/password/reset', payload)
}
