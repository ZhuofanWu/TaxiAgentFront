import { defineStore } from 'pinia'
import { computed, reactive } from 'vue'
import type { OrderDraft, PriceEstimate, RidePoint, VehicleType } from '@/types/order'

function createDraft(): OrderDraft {
  return {
    currentStep: 1,
    pickup: {
      lat: null,
      lng: null,
      address: '',
      isConfirmed: false,
    },
    dropoff: null,
    vehicleType: null,
    options: {
      isScheduled: false,
      scheduledTime: null,
      isUrgent: false,
    },
    priceEstimate: null,
  }
}

export const useOrderDraftStore = defineStore('orderDraft', () => {
  const draft = reactive<OrderDraft>(createDraft())

  const vehicleEstimatePrices = computed(() => {
    if (!draft.priceEstimate) return null
    const prices = resolveEstimatePrices(draft.priceEstimate)
    if (!prices) return null
    return {
      economy: roundPrice(prices.economy),
      comfort: roundPrice(prices.comfort),
      luxury: roundPrice(prices.luxury),
    }
  })

  const vehicleBasePrice = computed(() => {
    if (!draft.vehicleType) return null
    const prices = vehicleEstimatePrices.value
    if (!prices) return null
    return prices[draft.vehicleType]
  })

  const urgentFee = computed(() => {
    if (!draft.options.isUrgent || !vehicleBasePrice.value) return 0
    return roundPrice(vehicleBasePrice.value * 0.2 + 5)
  })

  const estimatedTotalPrice = computed(() => {
    if (!vehicleBasePrice.value) return null
    return roundPrice(vehicleBasePrice.value + urgentFee.value)
  })

  function resetDraft() {
    Object.assign(draft, createDraft())
  }

  function setCurrentStep(step: OrderDraft['currentStep']) {
    draft.currentStep = step
  }

  function setPickup(point: { lat: number; lng: number; address: string }, confirmed = false) {
    draft.pickup = {
      lat: point.lat,
      lng: point.lng,
      address: point.address,
      isConfirmed: confirmed,
    }
  }

  function confirmPickup(point: { lat: number; lng: number; address: string }) {
    setPickup(point, true)
  }

  function setDropoff(point: RidePoint | null) {
    draft.dropoff = point
  }

  function setVehicleType(type: VehicleType | null) {
    draft.vehicleType = type
  }

  function setPriceEstimate(estimate: PriceEstimate | null) {
    draft.priceEstimate = estimate
  }

  function updateOptions(options: Partial<OrderDraft['options']>) {
    draft.options = {
      ...draft.options,
      ...options,
    }
  }

  function reopenStep(step: OrderDraft['currentStep']) {
    if (step <= 1) {
      draft.dropoff = null
      draft.vehicleType = null
      draft.options = {
        isScheduled: false,
        scheduledTime: null,
        isUrgent: false,
      }
      draft.priceEstimate = null
    }

    if (step <= 2) {
      draft.vehicleType = null
      draft.options = {
        isScheduled: false,
        scheduledTime: null,
        isUrgent: false,
      }
    }

    if (step <= 3) {
      draft.options = {
        isScheduled: false,
        scheduledTime: null,
        isUrgent: false,
      }
    }

    draft.currentStep = step
  }

  return {
    draft,
    vehicleEstimatePrices,
    vehicleBasePrice,
    urgentFee,
    estimatedTotalPrice,
    resetDraft,
    setCurrentStep,
    setPickup,
    confirmPickup,
    setDropoff,
    setVehicleType,
    setPriceEstimate,
    updateOptions,
    reopenStep,
  }
})

function roundPrice(value: number): number {
  return Math.round(value * 100) / 100
}

function resolveEstimatePrices(
  estimate: PriceEstimate,
): { economy: number; comfort: number; luxury: number } | null {
  const base = resolveEstimateNumber(estimate.estPriceBase)
  const time = resolveEstimateNumber(estimate.estPriceTime)
  const distance = resolveEstimateNumber(estimate.estPriceDistance)
  const expedited = resolveEstimateNumber(estimate.estPriceExpedited)
  const radio = resolveEstimateNumber(estimate.estPriceRadio)
  if (base == null || time == null || distance == null || expedited == null || radio == null)
    return null
  const baseTotal = base + time + distance + expedited
  const economy = resolveEstimateNumber(estimate.estPrice) ?? baseTotal * radio
  return {
    economy,
    comfort: baseTotal * (radio + 0.6),
    luxury: baseTotal * (radio + 1.5),
  }
}

function resolveEstimateNumber(value: number | string | null | undefined): number | null {
  if (value == null) return null
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}
