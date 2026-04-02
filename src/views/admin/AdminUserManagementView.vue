<script setup lang="ts">
import { NCard, NDataTable } from 'naive-ui'
import type { AdminUserRecord } from '@/types/adminUser'
import AdminUserToolbar from '@/components/business/admin/user/AdminUserToolbar.vue'
import AdminUserPagination from '@/components/business/admin/user/AdminUserPagination.vue'
import AdminUserCreateModal from '@/components/business/admin/user/AdminUserCreateModal.vue'
import AdminUserUpdateModal from '@/components/business/admin/user/AdminUserUpdateModal.vue'
import { useAdminUserManagement } from '@/composables/useAdminUserManagement'

const {
  queryParams,
  users,
  total,
  loading,
  checkedRowKeys,
  columns,
  roleOptions,
  showCreateModal,
  showUpdateModal,
  createSubmitting,
  updateSubmitting,
  editingUser,
  pageCount,
  hasSelection,
  updateDisabled,
  updateUsername,
  updateRole,
  updateDeleted,
  updateCurrent,
  updateSize,
  handleSearch,
  handlePageChange,
  handlePageSizeChange,
  handleCheckedRowKeysChange,
  handleOpenCreate,
  handleCloseCreate,
  handleOpenUpdate,
  handleCloseUpdate,
  handleCreateSubmit,
  handleUpdateSubmit,
  handleActivate,
  handleDisable,
  handleDelete,
} = useAdminUserManagement()
</script>

<template>
  <div class="admin-user-management">
    <div class="page-header">
      <h1>用户管理</h1>
      <div class="summary">共 {{ total }} 条</div>
    </div>

    <AdminUserToolbar
      :query-params="queryParams"
      :role-options="roleOptions"
      :has-selection="hasSelection"
      :update-disabled="updateDisabled"
      @update:current="updateCurrent"
      @update:size="updateSize"
      @update:username="updateUsername"
      @update:role="updateRole"
      @update:deleted="updateDeleted"
      @search="handleSearch"
      @create="handleOpenCreate"
      @activate="handleActivate"
      @disable="handleDisable"
      @delete="handleDelete"
      @edit="handleOpenUpdate"
    />

    <NCard class="table-card">
      <NDataTable
        :columns="columns"
        :data="users"
        :loading="loading"
        :bordered="false"
        :pagination="false"
        :row-key="(row: AdminUserRecord) => row.userId"
        :checked-row-keys="checkedRowKeys"
        @update:checked-row-keys="handleCheckedRowKeysChange"
      />
    </NCard>

    <AdminUserPagination
      :page="queryParams.current"
      :page-size="queryParams.size"
      :page-count="pageCount"
      :total="total"
      @update:page="handlePageChange"
      @update:page-size="handlePageSizeChange"
    />

    <AdminUserCreateModal
      :show="showCreateModal"
      :role-options="roleOptions"
      :loading="createSubmitting"
      @close="handleCloseCreate"
      @submit="handleCreateSubmit"
    />

    <AdminUserUpdateModal
      :show="showUpdateModal"
      :user="editingUser"
      :role-options="roleOptions"
      :loading="updateSubmitting"
      @close="handleCloseUpdate"
      @submit="handleUpdateSubmit"
    />
  </div>
</template>

<style scoped>
.admin-user-management {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
}

.summary {
  font-size: 0.875rem;
  color: #64748b;
  background: #f8fafc;
  padding: 0.4rem 0.75rem;
  border-radius: 999px;
}

.table-card {
  flex: 1;
}

@media (max-width: 960px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
