<script setup lang="ts">
import { NCard, NInputNumber, NButton, NDataTable, NPagination } from 'naive-ui'
import type { RagQAQueryVO } from '@/types/rag'
import QaAddModal from '@/components/business/rag/QaAddModal.vue'
import { useRagQaManagement } from '@/composables/useRagQaManagement'

const {
  queryParams,
  qaGroups,
  total,
  loading,
  showAddModal,
  checkedRowKeys,
  selectedQuestionIds,
  pageCount,
  columns,
  handleSearch,
  handlePageChange,
  handleCheckedRowKeysChange,
  handleAddSuccess,
  handleDelete,
} = useRagQaManagement()
</script>

<template>
  <div class="rag-qa-management">
    <div class="page-header">
      <h1>问答对管理</h1>
    </div>

    <NCard class="control-card">
      <div class="control-row">
        <div class="control-item">
          <span class="label">页码</span>
          <NInputNumber
            v-model:value="queryParams.page"
            :min="1"
            :precision="0"
            style="width: 120px"
          />
        </div>
        <div class="control-item">
          <span class="label">每页条数</span>
          <NInputNumber
            v-model:value="queryParams.size"
            :min="1"
            :precision="0"
            style="width: 140px"
          />
        </div>
        <div class="control-actions">
          <NButton type="primary" @click="handleSearch">查询</NButton>
          <NButton type="success" @click="showAddModal = true">添加问答对</NButton>
          <NButton
            type="error"
            :disabled="checkedRowKeys.length === 0 && selectedQuestionIds.length === 0"
            @click="handleDelete"
          >
            删除
          </NButton>
        </div>
      </div>
    </NCard>

    <NCard class="table-card">
      <NDataTable
        :columns="columns"
        :data="qaGroups"
        :loading="loading"
        :row-key="(row: RagQAQueryVO) => row.groupId"
        :checked-row-keys="checkedRowKeys"
        :bordered="false"
        size="small"
        @update:checked-row-keys="handleCheckedRowKeysChange"
      />
    </NCard>

    <div class="pagination-wrapper">
      <NPagination
        v-model:page="queryParams.page"
        :page-size="queryParams.size"
        :page-count="pageCount"
        :total="total"
        show-quick-jumper
        :show-total="(count: number) => `共${count}条`"
        @update:page="handlePageChange"
      />
    </div>

    <QaAddModal :show="showAddModal" @close="showAddModal = false" @success="handleAddSuccess" />
  </div>
</template>

<style scoped>
.rag-qa-management {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  gap: 1rem;
}

.page-header {
  display: flex;
  align-items: center;
}

.page-header h1 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.control-card {
  flex-shrink: 0;
}

.control-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: flex-end;
}

.control-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.control-item .label {
  font-size: 0.875rem;
  color: #64748b;
  white-space: nowrap;
}

.control-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.table-card {
  flex: 1;
  overflow: hidden;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  flex-shrink: 0;
}
</style>
