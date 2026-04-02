import request from '@/utils/request'
import type { UserPoi, UserPoiOrder } from '@/types/user'

export interface CreatePoiPayload {
  poiTag: string
  poiName: string
  poiAddress: string
  longitude: string
  latitude: string
}

export interface UpdatePoiPayload {
  id: number
  poiTag?: string
  poiName?: string
  poiAddress?: string
  longitude?: string
  latitude?: string
}

export async function getUserPois(): Promise<UserPoi[]> {
  return request.get('/user/poi')
}

export async function getUserPoiOrder(): Promise<UserPoiOrder> {
  return request.get('/user/poi/order')
}

export async function getUserPoi(id: number): Promise<UserPoi> {
  return request.get(`/user/poi/${id}`)
}

export async function createUserPoi(payload: CreatePoiPayload): Promise<void> {
  await request.post('/user/poi', payload)
}

export async function updateUserPoi(payload: UpdatePoiPayload): Promise<void> {
  await request.put('/user/poi', payload)
}

export async function deleteUserPoi(id: number): Promise<void> {
  await request.delete(`/user/poi/${id}`)
}
