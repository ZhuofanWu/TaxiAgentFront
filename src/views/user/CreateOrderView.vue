<script setup lang="ts">
import { NText } from 'naive-ui'
import OrderMapContainer from '@/components/business/order/OrderMapContainer.vue'
import OrderStepItem from '@/components/business/order/OrderStepItem.vue'
import OrderStepPickup from '@/components/business/order/OrderStepPickup.vue'
import OrderStepDestination from '@/components/business/order/OrderStepDestination.vue'
import OrderStepVehicle from '@/components/business/order/OrderStepVehicle.vue'
import OrderStepOptions from '@/components/business/order/OrderStepOptions.vue'
import OrderStepSummary from '@/components/business/order/OrderStepSummary.vue'
import { useCreateOrderView } from '@/composables/useCreateOrderView'

const {
  mapRef,
  destinationQuery,
  confirmPickupLoading,
  searchLoading,
  confirmDestinationLoading,
  estimateLoading,
  submitLoading,
  poiResults,
  selectedPoiId,
  hasSearched,
  stepRefs,
  homePoi,
  workPoi,
  otherPois,
  selectedOtherId,
  pickupSelectedOtherId,
  activeStep,
  pickupPoint,
  pickupDisplay,
  dropoffDisplay,
  selectedVehicleLabel,
  vehicleOptions,
  summaryItems,
  finalPriceText,
  urgentFeeValue,
  orderStore,
  handleConfirmPickup,
  handleDestinationConfirm,
  handlePoiSearch,
  handleSelectCommonPoi,
  handleSelectPickupPoi,
  handleSelectPoi,
  handleVehicleSelect,
  handleOptionsNext,
  handleEditStep,
  handleMapMoveEnd,
  handleSubmitOrder,
  handleSelectCoupon,
  formatDateTime,
} = useCreateOrderView()
</script>

<template>
  <div class="order-create-page">
    <div class="page-header">
      <div>
        <div class="page-title">网约车下单</div>
        <NText depth="3">按照步骤填写信息，左侧地图实时响应。</NText>
      </div>
      <div class="page-status">
        <span>当前步骤</span>
        <strong>Step {{ activeStep }}</strong>
      </div>
    </div>

    <div class="order-grid">
      <div class="map-column">
        <OrderMapContainer
          ref="mapRef"
          :pickup="pickupPoint"
          :dropoff="orderStore.draft.dropoff"
          :active-step="activeStep"
          @move-end="handleMapMoveEnd"
          @place-select="handleSelectPoi"
        />
      </div>
      <div class="wizard-column">
        <div class="wizard-stack">
          <div :ref="(el) => (stepRefs[1] = el as HTMLElement)">
            <OrderStepItem
              :step="1"
              title="确认上车点"
              hint="地图定位与拖拽微调"
              :is-active="activeStep === 1"
              :is-completed="activeStep > 1"
              @edit="handleEditStep(1)"
            >
              <OrderStepPickup
                :address="pickupDisplay"
                :loading="confirmPickupLoading"
                :home-poi="homePoi"
                :work-poi="workPoi"
                :other-pois="otherPois"
                v-model:selected-other-id="pickupSelectedOtherId"
                @select-poi="handleSelectPickupPoi"
                @confirm="handleConfirmPickup"
              />
              <template #summary>
                <div class="summary-line">{{ pickupDisplay }}</div>
              </template>
            </OrderStepItem>
          </div>
          <div :ref="(el) => (stepRefs[2] = el as HTMLElement)">
            <OrderStepItem
              :step="2"
              title="您要去哪"
              hint="输入目的地或选择常用地址"
              :is-active="activeStep === 2"
              :is-completed="activeStep > 2"
              @edit="handleEditStep(2)"
            >
              <OrderStepDestination
                v-model:search-text="destinationQuery"
                :search-loading="searchLoading"
                :confirm-loading="confirmDestinationLoading"
                :home-poi="homePoi"
                :work-poi="workPoi"
                :other-pois="otherPois"
                v-model:selected-other-id="selectedOtherId"
                :results="poiResults"
                :selected-id="selectedPoiId"
                :has-searched="hasSearched"
                @search="handlePoiSearch"
                @confirm="handleDestinationConfirm"
                @select-poi="handleSelectCommonPoi"
              />
              <template #summary>
                <div class="summary-line">{{ dropoffDisplay }}</div>
              </template>
            </OrderStepItem>
          </div>
          <div :ref="(el) => (stepRefs[3] = el as HTMLElement)">
            <OrderStepItem
              :step="3"
              title="选择车型"
              hint="实时估价与接驾时间"
              :is-active="activeStep === 3"
              :is-completed="activeStep > 3"
              @edit="handleEditStep(3)"
            >
              <OrderStepVehicle
                :options="vehicleOptions"
                :selected-type="orderStore.draft.vehicleType"
                :loading="estimateLoading"
                @select="handleVehicleSelect"
              />
              <template #summary>
                <div class="summary-line">
                  {{ selectedVehicleLabel }} ·
                  {{
                    orderStore.vehicleBasePrice
                      ? `¥${orderStore.vehicleBasePrice.toFixed(2)}`
                      : '待估价'
                  }}
                </div>
              </template>
            </OrderStepItem>
          </div>
          <div :ref="(el) => (stepRefs[4] = el as HTMLElement)">
            <OrderStepItem
              :step="4"
              title="订单参数"
              hint="预约时间与加急设置"
              :is-active="activeStep === 4"
              :is-completed="activeStep > 4"
              @edit="handleEditStep(4)"
            >
              <OrderStepOptions
                :is-scheduled="orderStore.draft.options.isScheduled"
                :scheduled-time="orderStore.draft.options.scheduledTime"
                :is-urgent="orderStore.draft.options.isUrgent"
                :urgent-fee="urgentFeeValue"
                @update:is-scheduled="orderStore.updateOptions({ isScheduled: $event })"
                @update:scheduled-time="orderStore.updateOptions({ scheduledTime: $event })"
                @update:is-urgent="orderStore.updateOptions({ isUrgent: $event })"
                @next="handleOptionsNext"
              />
              <template #summary>
                <div class="summary-line">
                  {{
                    orderStore.draft.options.isScheduled
                      ? `预约 ${formatDateTime(orderStore.draft.options.scheduledTime)}`
                      : '即时用车'
                  }}
                  · {{ orderStore.draft.options.isUrgent ? '已加急' : '未加急' }}
                </div>
              </template>
            </OrderStepItem>
          </div>
          <div :ref="(el) => (stepRefs[5] = el as HTMLElement)">
            <OrderStepItem
              :step="5"
              title="确认订单"
              hint="检查信息后呼叫车辆"
              :is-active="activeStep === 5"
              :is-completed="false"
            >
              <OrderStepSummary
                :items="summaryItems"
                :price-text="finalPriceText"
                :loading="submitLoading"
                @select-coupon="handleSelectCoupon"
                @submit="handleSubmitOrder"
              />
            </OrderStepItem>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.order-create-page {
  height: 100%;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.page-title {
  font-size: 1.6rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 4px;
}
.page-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 999px;
  background: #e0f2fe;
  color: #0c4a6e;
  font-size: 0.85rem;
}

.order-grid {
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  gap: 24px;
  align-items: start;
  height: 100%;
}

.map-column {
  position: sticky;
  top: 16px;
  height: calc(100vh - 160px);
  min-height: 520px;
}

.wizard-column {
  min-width: 0;
}

.wizard-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.summary-line {
  font-size: 0.9rem;
  color: #475569;
}

@media (max-width: 1200px) {
  .order-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 900px) {
  .order-grid {
    grid-template-columns: 1fr;
  }

  .map-column {
    position: relative;
    height: auto;
    min-height: 360px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
