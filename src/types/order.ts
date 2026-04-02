export type VehicleType = 'economy' | 'comfort' | 'luxury'

export type VehicleTypeValue = 1 | 2 | 3

export interface RidePoint {
  lat: number
  lng: number
  address: string
  placeId?: string
}

export interface OrderDraft {
  currentStep: 1 | 2 | 3 | 4 | 5
  pickup: {
    lat: number | null
    lng: number | null
    address: string
    isConfirmed: boolean
  }
  dropoff: RidePoint | null
  vehicleType: VehicleType | null
  options: {
    isScheduled: boolean
    scheduledTime: Date | null
    isUrgent: boolean
  }
  priceEstimate: PriceEstimate | null
}

export interface PriceEstimateRequest {
  startLat: number
  startLng: number
  endLat: number
  endLng: number
  vehicleType: VehicleTypeValue
  isExpedited: 0 | 1
}

export interface PriceEstimate {
  estPrice: number | string
  estPriceRadio: number | string
  estPriceBase: number | string
  estPriceTime: number | string
  estPriceDistance: number | string
  estPriceExpedited: number | string
}

export interface CreateOrderPayload {
  startAddress: string
  startLat: number
  startLng: number
  endAddress: string
  endLat: number
  endLng: number
  vehicleType: VehicleTypeValue
  isExpedited: 0 | 1
  remark?: string
}

export interface RideOrderDetail {
  orderId: string
  userId: string
  driverId: string | null
  estRoute?: string | null
  realRoute?: string | null
  vehicleType: VehicleTypeValue | number | string
  isReservation: 0 | 1 | number | string
  isExpedited: 0 | 1 | number | string
  safetyCode?: string | null
  orderStatus: number | string
  cancelRole?: number | string | null
  cancelReason?: string | null
  createTime?: string | null
  startAddress?: string | null
  startLat?: number | string | null
  startLng?: number | string | null
  endAddress?: string | null
  endLat?: number | string | null
  endLng?: number | string | null
  estDistance?: number | string | null
  realDistance?: number | string | null
  estPrice?: number | string | null
  realPrice?: number | string | null
  priceBase?: number | string | null
  priceTime?: number | string | null
  priceDistance?: number | string | null
  priceExpedited?: number | string | null
  priceRadio?: number | string | null
  updateTime?: string | null
  isDeleted?: number | null
}

export interface DriverOrderPoolQuery {
  page: number
  size: number
}

export interface DriverOrderPoolItem {
  orderId: string
  startAddress?: string | null
  endAddress?: string | null
  estDistance?: number | string | null
  estPrice?: number | string | null
  createTime?: string | null
}

export interface OrderPoolPageResult<T> {
  records: T[]
  total: number
  page: number
  size: number
}

export interface OrderPageQuery {
  page: number
  size: number
  statusList?: number[]
}

export interface OrderPageRecord {
  orderId: string
  orderStatus?: number | string | null
  status?: number | string | null
  statusName?: string | null
  startAddress?: string | null
  endAddress?: string | null
  totalPrice?: number | string | null
  createTime?: string | null
  estDistance?: number | string | null
  realDistance?: number | string | null
  estPrice?: number | string | null
  realPrice?: number | string | null
  distance?: number | string | null
}

export interface DriverAcceptPayload {
  orderId: string
  currentLat: number
  currentLng: number
}

export interface DriverArrivePayload {
  orderId: string
}

export interface DriverStartPayload {
  orderId: string
}

export interface DriverFinishPayload {
  orderId: string
  endLat: number
  endLng: number
  endAddress: string
  realPolyline: string
  arriveTime: string
}

export interface OrderBill {
  orderId: string
  realPrice?: number | string | null
  priceBase?: number | string | null
  priceTime?: number | string | null
  priceDistance?: number | string | null
  priceExpedited?: number | string | null
  priceRadio?: number | string | null
}

export type PayChannel = 1 | 2 | 3

export interface PayOrderPayload {
  payChannel: PayChannel
  tradeNo: string
}

export interface CancelOrderPayload {
  cancelRole: 1 | 2
  cancelReason: string
}

export interface CancelOrderResult {
  success: boolean
  penalty: number | null
}
