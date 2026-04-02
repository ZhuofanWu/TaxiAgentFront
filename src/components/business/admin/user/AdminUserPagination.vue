<script setup lang="ts">
import { NPagination } from 'naive-ui'

defineProps<{
  page: number
  pageSize: number
  pageCount: number
  total: number
}>()

const emit = defineEmits<{
  (event: 'update:page', value: number): void
  (event: 'update:page-size', value: number): void
}>()
</script>

<template>
  <div class="admin-user-pagination">
    <NPagination
      :page="page"
      :page-size="pageSize"
      :page-count="pageCount"
      :total="total"
      show-quick-jumper
      show-size-picker
      :show-total="(count: number) => `共${count}条`"
      @update:page="(value) => emit('update:page', value)"
      @update:page-size="(value) => emit('update:page-size', value)"
    />
  </div>
</template>

<style scoped>
.admin-user-pagination {
  display: flex;
  justify-content: flex-end;
  flex-shrink: 0;
}
</style>
