import request from '@/utils/request'
import type {
  CreateOrderPayload,
  DriverAcceptPayload,
  DriverArrivePayload,
  DriverFinishPayload,
  DriverOrderPoolItem,
  DriverOrderPoolQuery,
  CancelOrderPayload,
  CancelOrderResult,
  DriverStartPayload,
  OrderBill,
  OrderPageQuery,
  OrderPageRecord,
  OrderPoolPageResult,
  PayOrderPayload,
  PriceEstimate,
  PriceEstimateRequest,
  RideOrderDetail,
} from '@/types/order'
import { requestWithMeta } from '@/utils/request'

export async function estimateOrderPrice(payload: PriceEstimateRequest): Promise<PriceEstimate> {
  return request.post('/order/estimate', payload)
}

export async function createOrder(payload: CreateOrderPayload): Promise<string> {
  return request.post('/order', payload)
}

export async function getOrderDetail(orderId: string): Promise<RideOrderDetail> {
  return request.get(`/order/${orderId}`)
}

export async function getOrderPage(
  payload: OrderPageQuery,
): Promise<OrderPoolPageResult<OrderPageRecord>> {
  return request.post('/order/page', payload)
}

export async function getOngoingOrderIds(): Promise<string[]> {
  return request.get('/order/my/ongoing')
}

export async function getDriverOrderPoolPage(
  params: DriverOrderPoolQuery,
): Promise<OrderPoolPageResult<DriverOrderPoolItem>> {
  return request.get('/order/driver/pool/page', { params })
}

export async function acceptDriverOrder(payload: DriverAcceptPayload): Promise<boolean> {
  return request.post('/order/driver/accept', payload)
}

export async function arriveDriverOrder(orderId: DriverArrivePayload['orderId']): Promise<boolean> {
  return request.post('/order/driver/arrive', { orderId })
}

export async function startDriverOrder(orderId: DriverStartPayload['orderId']): Promise<boolean> {
  return request.post('/order/driver/start', { orderId })
}

export async function finishDriverOrder(payload: DriverFinishPayload): Promise<OrderBill> {
  return request.post('/order/driver/finish', payload)
}

export async function getDriverCurrentOrder(): Promise<RideOrderDetail | null> {
  return request.get('/order/driver/current')
}

export async function payOrder(orderId: string, payload: PayOrderPayload): Promise<boolean> {
  return request.post(`/order/${orderId}/pay`, payload)
}

export async function cancelOrder(
  orderId: string,
  payload: CancelOrderPayload,
): Promise<CancelOrderResult> {
  const { data, message } = await requestWithMeta<boolean>({
    method: 'post',
    url: `/order/${orderId}/cancel`,
    data: payload,
  })
  return {
    success: data,
    penalty: resolvePenalty(message),
  }
}

function resolvePenalty(message: string): number | null {
  const trimmed = message.trim()
  if (!trimmed || trimmed === 'success') return null
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}
