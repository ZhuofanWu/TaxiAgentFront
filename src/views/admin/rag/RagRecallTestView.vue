<script setup lang="ts">
import { ref, h } from 'vue'
import { NCard, NInput, NButton, NDataTable, useMessage, type DataTableColumns } from 'naive-ui'
import { searchRag } from '@/api/rag'
import type { QaDocument } from '@/types/rag'

const message = useMessage()

const question = ref('')
const loading = ref(false)
const results = ref<QaDocument[]>([])

async function handleSearch() {
  const query = question.value.trim()
  if (!query) {
    message.warning('请输入问题')
    return
  }

  loading.value = true
  try {
    results.value = await searchRag(query)
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : '召回失败'
    message.error(errMsg)
  } finally {
    loading.value = false
  }
}

const columns: DataTableColumns<QaDocument> = [
  {
    title: '序号',
    key: 'index',
    width: 80,
    render: (_row, index) => index + 1,
  },
  {
    title: 'groupId',
    key: 'groupId',
    width: 180,
  },
  {
    title: 'questionId',
    key: 'questionId',
    width: 160,
  },
  {
    title: 'question',
    key: 'question',
    minWidth: 220,
  },
  {
    title: 'answer',
    key: 'answer',
    render(row) {
      return h('div', { class: 'answer-cell' }, row.answer)
    },
  },
]
</script>

<template>
  <div class="rag-recall-test">
    <div class="page-header">
      <h1>召回测试</h1>
    </div>

    <NCard class="input-card">
      <div class="input-row">
        <NInput
          v-model:value="question"
          placeholder="请输入要召回的问题"
          clearable
          @keyup.enter="handleSearch"
        />
        <NButton type="primary" :loading="loading" @click="handleSearch"> 召回 </NButton>
      </div>
    </NCard>

    <NCard class="table-card">
      <NDataTable
        :columns="columns"
        :data="results"
        :loading="loading"
        :row-key="(row: QaDocument) => row.questionId"
        :bordered="false"
        size="small"
      />
    </NCard>
  </div>
</template>

<style scoped>
.rag-recall-test {
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

.input-card {
  flex-shrink: 0;
}

.input-row {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.input-row > :first-child {
  flex: 1;
}

.table-card {
  flex: 1;
  overflow: hidden;
}

.answer-cell {
  white-space: pre-wrap;
  line-height: 1.5;
}
</style>
