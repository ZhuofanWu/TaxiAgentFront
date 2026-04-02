import { ref, computed, h, onMounted } from 'vue'
import { useMessage, useDialog, type DataTableColumns, type DataTableRowKey } from 'naive-ui'
import { getRagQaPage, deleteRagQa } from '@/api/rag'
import type { RagQAQueryDTO, RagQAQueryVO, RagQADelDTO } from '@/types/rag'
import QaQuestionsCell from '@/components/business/rag/QaQuestionsCell.vue'
import QaAnswerCell from '@/components/business/rag/QaAnswerCell.vue'

export function useRagQaManagement() {
  const message = useMessage()
  const dialog = useDialog()

  const queryParams = ref<RagQAQueryDTO>({
    page: 1,
    size: 10,
  })
  const qaGroups = ref<RagQAQueryVO[]>([])
  const total = ref(0)
  const loading = ref(false)
  const showAddModal = ref(false)
  const checkedRowKeys = ref<DataTableRowKey[]>([])
  const selectedQuestionIds = ref<string[]>([])

  const pageCount = computed(() => Math.ceil(total.value / queryParams.value.size))

  function clearSelection() {
    checkedRowKeys.value = []
    selectedQuestionIds.value = []
  }

  async function fetchData() {
    loading.value = true
    try {
      const res = await getRagQaPage(queryParams.value)
      qaGroups.value = res.records
      total.value = res.total
      queryParams.value.page = res.page
      queryParams.value.size = res.size
      clearSelection()
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : '加载问答对失败'
      message.error(errMsg)
      qaGroups.value = []
      total.value = 0
    } finally {
      loading.value = false
    }
  }

  function handleSearch() {
    queryParams.value.page = Math.max(1, queryParams.value.page)
    queryParams.value.size = Math.max(1, queryParams.value.size)
    fetchData()
  }

  function handlePageChange(page: number) {
    queryParams.value.page = page
    fetchData()
  }

  function handleCheckedRowKeysChange(keys: DataTableRowKey[]) {
    checkedRowKeys.value = keys
  }

  function handleAddSuccess() {
    showAddModal.value = false
    fetchData()
  }

  function handleDelete() {
    const groupIds = checkedRowKeys.value.map((key) => String(key))
    const questionIds = selectedQuestionIds.value
    if (groupIds.length === 0 && questionIds.length === 0) {
      message.warning('请先选择要删除的分组或问题')
      return
    }

    const parts: string[] = []
    if (groupIds.length > 0) {
      parts.push(`${groupIds.length} 个分组`)
    }
    if (questionIds.length > 0) {
      parts.push(`${questionIds.length} 个问题`)
    }
    dialog.warning({
      title: '确认删除',
      content: `确认删除选中的${parts.join('、')}吗？`,
      positiveText: '删除',
      negativeText: '取消',
      onPositiveClick: async () => {
        const payload: RagQADelDTO = {}
        if (groupIds.length > 0) {
          payload.groupIds = groupIds
        }
        if (questionIds.length > 0) {
          payload.questionIds = questionIds
        }
        try {
          await deleteRagQa(payload)
          message.success('删除成功')
          await fetchData()
        } catch (error) {
          const errMsg = error instanceof Error ? error.message : '删除失败'
          message.error(errMsg)
        }
      },
    })
  }

  const columns: DataTableColumns<RagQAQueryVO> = [
    { type: 'selection' },
    { title: 'groupId', key: 'groupId', width: 180 },
    {
      title: '问题',
      key: 'questionMap',
      render(row) {
        return h(QaQuestionsCell, {
          questionMap: row.questionMap,
          selectedQuestionIds: selectedQuestionIds.value,
          'onUpdate:selectedQuestionIds': (ids: string[]) => {
            selectedQuestionIds.value = ids
          },
        })
      },
    },
    {
      title: '答案',
      key: 'answer',
      render(row) {
        return h(QaAnswerCell, { answer: row.answer })
      },
    },
  ]

  onMounted(() => {
    fetchData()
  })

  return {
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
  }
}
