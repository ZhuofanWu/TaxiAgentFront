<script setup lang="ts">
import { NButton, NCard, NInput, NInputNumber, NSelect, NSwitch } from 'naive-ui'
import type { SelectOption } from 'naive-ui'
import type { AdminUserPageQuery, UserRole } from '@/types/adminUser'

defineProps<{
  queryParams: AdminUserPageQuery
  roleOptions: SelectOption[]
  hasSelection: boolean
  updateDisabled: boolean
}>()

const emit = defineEmits<{
  (event: 'update:current', value: number | null): void
  (event: 'update:size', value: number | null): void
  (event: 'update:username', value: string): void
  (event: 'update:role', value: UserRole | null): void
  (event: 'update:deleted', value: boolean): void
  (event: 'search'): void
  (event: 'create'): void
  (event: 'activate'): void
  (event: 'disable'): void
  (event: 'delete'): void
  (event: 'edit'): void
}>()
</script>

<template>
  <NCard class="admin-user-toolbar">
    <div class="toolbar-row">
      <div class="filter-group">
        <div class="control-item">
          <span class="label">页码</span>
          <NInputNumber
            :value="queryParams.current"
            :min="1"
            :precision="0"
            style="width: 110px"
            @update:value="(value) => emit('update:current', value)"
          />
        </div>
        <div class="control-item">
          <span class="label">每页条数</span>
          <NInputNumber
            :value="queryParams.size"
            :min="1"
            :precision="0"
            style="width: 130px"
            @update:value="(value) => emit('update:size', value)"
          />
        </div>
        <div class="control-item">
          <span class="label">用户名</span>
          <NInput
            :value="queryParams.username || ''"
            placeholder="输入用户名"
            clearable
            style="width: 180px"
            @update:value="(value) => emit('update:username', value)"
          />
        </div>
        <div class="control-item">
          <span class="label">角色</span>
          <NSelect
            :value="queryParams.role || null"
            :options="roleOptions"
            clearable
            placeholder="选择角色"
            style="width: 160px"
            @update:value="(value) => emit('update:role', value as UserRole | null)"
          />
        </div>
        <div class="control-item">
          <span class="label">已删除</span>
          <NSwitch
            :value="queryParams.deleted ?? false"
            size="small"
            @update:value="(value) => emit('update:deleted', value)"
          />
        </div>
        <NButton type="primary" @click="emit('search')">查询</NButton>
      </div>

      <div class="action-group">
        <NButton type="primary" @click="emit('create')">新建</NButton>
        <NButton type="success" :disabled="!hasSelection" @click="emit('activate')"> 激活 </NButton>
        <NButton type="warning" :disabled="!hasSelection" @click="emit('disable')"> 禁用 </NButton>
        <NButton type="error" :disabled="!hasSelection" @click="emit('delete')"> 删除 </NButton>
        <NButton type="info" :disabled="updateDisabled" @click="emit('edit')">修改</NButton>
      </div>
    </div>
  </NCard>
</template>

<style scoped>
.admin-user-toolbar {
  flex-shrink: 0;
}

.toolbar-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.control-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.label {
  font-size: 0.875rem;
  color: #64748b;
  white-space: nowrap;
}

.action-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}
</style>
