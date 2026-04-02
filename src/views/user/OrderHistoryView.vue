<script setup lang="ts">
import OrderHistoryPanel from '@/components/business/order/OrderHistoryPanel.vue'
</script>

<template>
  <OrderHistoryPanel
    title="历史订单"
    detail-path="/user/orders/detail"
    :show-complaint="true"
    ticket-path="/user/create-ticket"
  />
</template>
