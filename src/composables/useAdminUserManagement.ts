import { computed, h, onMounted, ref } from 'vue'
import {
  NTag,
  useDialog,
  useMessage,
  type DataTableColumns,
  type DataTableRowKey,
  type SelectOption,
} from 'naive-ui'
import {
  activateAdminUsers,
  createAdminUser,
  deleteAdminUsers,
  disableAdminUsers,
  getAdminUserPage,
  updateAdminUser,
} from '@/api/user'
import type {
  AdminUserCreatePayload,
  AdminUserPageQuery,
  AdminUserRecord,
  AdminUserUpdatePayload,
  UserRole,
} from '@/types/adminUser'
import { formatDateTime } from '@/utils/orderFormat'

const roleLabelMap: Record<string, string> = {
  ADMIN: '管理员',
  SUPPORT: '客服',
  DRIVER: '司机',
  USER: '用户',
}

const roleOptions: SelectOption[] = [
  { label: '管理员', value: 'ADMIN' },
  { label: '客服', value: 'SUPPORT' },
  { label: '司机', value: 'DRIVER' },
  { label: '用户', value: 'USER' },
]

const statusLabelMap: Record<number, string> = {
  1: '激活',
  0: '禁用',
}

const statusTypeMap: Record<number, 'success' | 'warning'> = {
  1: 'success',
  0: 'warning',
}

export function useAdminUserManagement() {
  const message = useMessage()
  const dialog = useDialog()

  const queryParams = ref<AdminUserPageQuery>({
    current: 1,
    size: 10,
    username: '',
    role: undefined,
    deleted: false,
  })

  const users = ref<AdminUserRecord[]>([])
  const total = ref(0)
  const loading = ref(false)
  const checkedRowKeys = ref<DataTableRowKey[]>([])

  const showCreateModal = ref(false)
  const showUpdateModal = ref(false)
  const createSubmitting = ref(false)
  const updateSubmitting = ref(false)
  const editingUser = ref<AdminUserRecord | null>(null)

  const pageCount = computed(() => Math.max(1, Math.ceil(total.value / queryParams.value.size)))
  const selectedUserIds = computed(() => checkedRowKeys.value.map((key) => String(key)))
  const hasSelection = computed(() => selectedUserIds.value.length > 0)
  const updateDisabled = computed(() => selectedUserIds.value.length !== 1)

  const columns = computed<DataTableColumns<AdminUserRecord>>(() => [
    { type: 'selection' },
    {
      title: '用户ID',
      key: 'userId',
      width: 140,
    },
    {
      title: '用户名',
      key: 'userName',
      width: 140,
    },
    {
      title: '邮件',
      key: 'email',
      minWidth: 200,
      render(row) {
        return row.email || '-'
      },
    },
    {
      title: '角色',
      key: 'role',
      width: 120,
      render(row) {
        return roleLabelMap[row.role] || row.role || '-'
      },
    },
    {
      title: '是否激活',
      key: 'status',
      width: 120,
      render(row) {
        const label = statusLabelMap[row.status] || '未知'
        const type = statusTypeMap[row.status] || 'warning'
        return h(NTag, { size: 'small', type }, { default: () => label })
      },
    },
    {
      title: '创建时间',
      key: 'createTime',
      width: 180,
      render(row) {
        return formatDateTime(row.createTime)
      },
    },
  ])

  function clearSelection() {
    checkedRowKeys.value = []
  }

  function buildQueryPayload(): AdminUserPageQuery {
    const payload: AdminUserPageQuery = {
      current: Math.max(1, queryParams.value.current),
      size: Math.max(1, queryParams.value.size),
      deleted: queryParams.value.deleted ?? false,
    }
    const username = queryParams.value.username?.trim()
    if (username) {
      payload.username = username
    }
    if (queryParams.value.role) {
      payload.role = queryParams.value.role
    }
    return payload
  }

  async function fetchUsers() {
    loading.value = true
    try {
      const payload = buildQueryPayload()
      const res = await getAdminUserPage(payload)
      users.value = res.records
      total.value = res.total
      queryParams.value.current = res.page
      queryParams.value.size = res.size
      clearSelection()
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : '加载用户失败'
      message.error(errMsg)
      users.value = []
      total.value = 0
    } finally {
      loading.value = false
    }
  }

  function handleSearch() {
    queryParams.value.current = Math.max(1, queryParams.value.current)
    queryParams.value.size = Math.max(1, queryParams.value.size)
    fetchUsers()
  }

  function handlePageChange(page: number) {
    queryParams.value.current = page
    fetchUsers()
  }

  function handlePageSizeChange(size: number) {
    queryParams.value.size = size
    queryParams.value.current = 1
    fetchUsers()
  }

  function handleCheckedRowKeysChange(keys: DataTableRowKey[]) {
    checkedRowKeys.value = keys
  }

  function handleOpenCreate() {
    showCreateModal.value = true
  }

  function handleCloseCreate() {
    showCreateModal.value = false
  }

  function handleOpenUpdate() {
    if (selectedUserIds.value.length !== 1) {
      message.warning('请选择一位用户进行修改')
      return
    }
    const selectedId = selectedUserIds.value[0]
    editingUser.value = users.value.find((user) => user.userId === selectedId) || null
    if (!editingUser.value) {
      message.warning('未找到选中的用户信息')
      return
    }
    showUpdateModal.value = true
  }

  function handleCloseUpdate() {
    showUpdateModal.value = false
    editingUser.value = null
  }

  async function handleCreateSubmit(payload: AdminUserCreatePayload) {
    const userName = payload.userName.trim()
    const password = payload.password.trim()
    if (!userName) {
      message.warning('请输入用户名')
      return
    }
    if (!password) {
      message.warning('请输入密码')
      return
    }
    if (!payload.role) {
      message.warning('请选择角色')
      return
    }

    createSubmitting.value = true
    try {
      await createAdminUser({
        userName,
        password,
        role: payload.role,
      })
      message.success('创建成功')
      handleCloseCreate()
      fetchUsers()
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : '创建失败'
      message.error(errMsg)
    } finally {
      createSubmitting.value = false
    }
  }

  async function handleUpdateSubmit(payload: AdminUserUpdatePayload) {
    if (!payload.userId) {
      message.warning('缺少用户ID')
      return
    }
    const updatePayload: AdminUserUpdatePayload = {
      userId: payload.userId,
    }
    const username = payload.username?.trim()
    const email = payload.email?.trim()
    const password = payload.password?.trim()
    const role = payload.role as UserRole | undefined

    if (editingUser.value) {
      if (username && username !== editingUser.value.userName) {
        updatePayload.username = username
      }
      if (email && email !== (editingUser.value.email || '')) {
        updatePayload.email = email
      }
      if (role && role !== editingUser.value.role) {
        updatePayload.role = role
      }
    } else {
      if (username) updatePayload.username = username
      if (email) updatePayload.email = email
      if (role) updatePayload.role = role
    }

    if (password) {
      updatePayload.password = password
    }

    if (Object.keys(updatePayload).length === 1) {
      message.warning('请至少修改一个字段')
      return
    }

    updateSubmitting.value = true
    try {
      await updateAdminUser(updatePayload)
      message.success('更新成功')
      handleCloseUpdate()
      fetchUsers()
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : '更新失败'
      message.error(errMsg)
    } finally {
      updateSubmitting.value = false
    }
  }

  async function handleActivate() {
    if (!hasSelection.value) {
      message.warning('请选择要激活的用户')
      return
    }
    try {
      const count = await activateAdminUsers({ userIds: selectedUserIds.value })
      message.success(`已激活 ${count} 个用户`)
      fetchUsers()
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : '激活失败'
      message.error(errMsg)
    }
  }

  async function handleDisable() {
    if (!hasSelection.value) {
      message.warning('请选择要禁用的用户')
      return
    }
    try {
      const count = await disableAdminUsers({ userIds: selectedUserIds.value })
      message.success(`已禁用 ${count} 个用户`)
      fetchUsers()
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : '禁用失败'
      message.error(errMsg)
    }
  }

  function handleDelete() {
    if (!hasSelection.value) {
      message.warning('请选择要删除的用户')
      return
    }
    const userIds = selectedUserIds.value
    dialog.warning({
      title: '确认删除',
      content: `确认删除选中的 ${userIds.length} 个用户吗？删除后将禁用账号并清理登录信息。`,
      positiveText: '删除',
      negativeText: '取消',
      onPositiveClick: async () => {
        try {
          const count = await deleteAdminUsers({ userIds })
          message.success(`已删除 ${count} 个用户`)
          fetchUsers()
        } catch (error) {
          const errMsg = error instanceof Error ? error.message : '删除失败'
          message.error(errMsg)
        }
      },
    })
  }

  function updateUsername(value: string) {
    queryParams.value.username = value
  }

  function updateRole(value: UserRole | null) {
    queryParams.value.role = value || undefined
  }

  function updateDeleted(value: boolean) {
    queryParams.value.deleted = value
  }

  function updateCurrent(value: number | null) {
    queryParams.value.current = value ? Math.max(1, value) : 1
  }

  function updateSize(value: number | null) {
    queryParams.value.size = value ? Math.max(1, value) : 10
  }

  onMounted(() => {
    fetchUsers()
  })

  return {
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
  }
}
