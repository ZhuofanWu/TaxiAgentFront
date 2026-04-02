import { computed, h, onMounted, reactive, ref, type Component } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NIcon, NInput, useDialog, useMessage, type MenuOption } from 'naive-ui'
import {
  CartOutline,
  DocumentTextOutline,
  HomeOutline,
  LocationOutline,
  PeopleOutline,
  TicketOutline,
} from '@vicons/ionicons5'
import { getCurrentUserInfo, resetCurrentUserPassword, updateCurrentUserInfo } from '@/api/user'
import { useAuthStore } from '@/stores/auth'
import { UserRole } from '@/types/auth'
import type { UserCurrentInfo, UserCurrentUpdatePayload } from '@/types/user'
import { formatDateTime } from '@/utils/orderFormat'

const roleLabelMap: Record<UserRole, string> = {
  [UserRole.ADMIN]: '管理员',
  [UserRole.SUPPORT]: '客服',
  [UserRole.DRIVER]: '司机',
  [UserRole.USER]: '用户',
}

const siderTitleMap: Record<UserRole, string> = {
  [UserRole.ADMIN]: '系统管理员后台',
  [UserRole.SUPPORT]: '客服工作台',
  [UserRole.DRIVER]: '司机端',
  [UserRole.USER]: '用户中心',
}

const menuIcon = (icon: Component) => () => h(NIcon, null, { default: () => h(icon) })

const menuOptionsByRole: Record<UserRole, MenuOption[]> = {
  [UserRole.USER]: [
    {
      label: '首页',
      key: '/user',
      icon: menuIcon(HomeOutline),
    },
    {
      label: '订单管理',
      key: 'orders',
      icon: menuIcon(CartOutline),
      children: [
        {
          label: '新建订单',
          key: '/user/orders/new',
        },
        {
          label: '当前订单',
          key: '/user/orders/current',
        },
        {
          label: '历史订单',
          key: '/user/orders/history',
        },
        {
          label: '订单详情',
          key: '/user/orders/detail',
        },
      ],
    },
    {
      label: '工单与投诉',
      key: 'ticket',
      icon: menuIcon(TicketOutline),
      children: [
        {
          label: '新建工单',
          key: '/user/create-ticket',
        },
        {
          label: '我的工单',
          key: '/user/my-tickets',
        },
      ],
    },
    {
      label: '地址管理',
      key: '/user/addresses',
      icon: menuIcon(LocationOutline),
    },
  ],
  [UserRole.ADMIN]: [
    {
      label: '首页',
      key: '/admin',
      icon: menuIcon(HomeOutline),
    },
    {
      label: '用户管理',
      key: '/admin/user',
      icon: menuIcon(PeopleOutline),
    },
    {
      label: '工单管理',
      key: 'ticket-management',
      icon: menuIcon(TicketOutline),
      children: [
        {
          label: '工单池',
          key: '/admin/tickets',
        },
        {
          label: '我的工单',
          key: '/admin/my-tickets',
        },
      ],
    },
    {
      label: '订单管理',
      key: 'order-management',
      icon: menuIcon(CartOutline),
      children: [
        {
          label: '历史订单',
          key: '/admin/orders/history',
        },
        {
          label: '订单详情',
          key: '/admin/orders/detail',
        },
      ],
    },
    {
      label: 'RAG管理',
      key: 'rag-management',
      icon: menuIcon(DocumentTextOutline),
      children: [
        {
          label: '问答对管理',
          key: '/admin/rag/qa',
        },
        {
          label: '召回测试',
          key: '/admin/rag/recall-test',
        },
      ],
    },
  ],
  [UserRole.DRIVER]: [
    {
      label: '首页',
      key: '/driver',
      icon: menuIcon(HomeOutline),
    },
    {
      label: '订单管理',
      key: '/driver/orders',
      icon: menuIcon(CartOutline),
      children: [
        {
          label: '订单池',
          key: '/driver/orders/pool',
        },
        {
          label: '当前订单',
          key: '/driver/orders/current',
        },
        {
          label: '历史订单',
          key: '/driver/orders/history',
        },
        {
          label: '订单详情',
          key: '/driver/orders/detail',
        },
      ],
    },
    {
      label: '工单与投诉',
      key: 'ticket',
      icon: menuIcon(TicketOutline),
      children: [
        {
          label: '新建工单',
          key: '/driver/create-ticket',
        },
        {
          label: '我的工单',
          key: '/driver/my-tickets',
        },
      ],
    },
  ],
  [UserRole.SUPPORT]: [
    {
      label: '首页',
      key: '/support',
      icon: menuIcon(HomeOutline),
    },
    {
      label: '工单处理',
      key: 'ticket-management',
      icon: menuIcon(TicketOutline),
      children: [
        {
          label: '工单池',
          key: '/support/tickets',
        },
        {
          label: '我的工单',
          key: '/support/my-tickets',
        },
      ],
    },
    {
      label: '订单管理',
      key: 'order-management',
      icon: menuIcon(CartOutline),
      children: [
        {
          label: '历史订单',
          key: '/support/orders/history',
        },
        {
          label: '订单详情',
          key: '/support/orders/detail',
        },
      ],
    },
  ],
}

export function useUserInfoView() {
  const message = useMessage()
  const dialog = useDialog()
  const router = useRouter()
  const route = useRoute()
  const authStore = useAuthStore()

  const activeTab = ref<'profile' | 'password'>('profile')
  const loading = ref(false)
  const saving = ref(false)
  const passwordSaving = ref(false)
  const errorMessage = ref<string | null>(null)

  const profile = ref<UserCurrentInfo | null>(null)
  const profileForm = reactive({
    username: '',
    email: '',
  })
  const passwordForm = reactive({
    password: '',
  })
  const confirmPassword = ref('')

  const currentRole = computed(() => authStore.userRole ?? UserRole.USER)
  const userMenuOptions = [
    {
      label: '个人中心',
      key: '/userinfo',
    },
    {
      type: 'divider',
      key: 'd1',
    },
    {
      label: '退出登录',
      key: 'logout',
    },
  ]
  const menuOptions = computed<MenuOption[]>(() => {
    return menuOptionsByRole[currentRole.value] ?? menuOptionsByRole[UserRole.USER]
  })
  const siderTitle = computed(() => siderTitleMap[currentRole.value] || '个人中心')
  const activeMenuKey = computed(() => route.path)

  const roleLabel = computed(() => {
    if (!profile.value?.role) return '-'
    return roleLabelMap[profile.value.role] || profile.value.role
  })
  const formattedLastLogin = computed(() => formatDateTime(profile.value?.lastLoginTime))
  const formattedCreateTime = computed(() => formatDateTime(profile.value?.createTime))

  onMounted(() => {
    fetchProfile()
  })

  function handleMenuSelect(key: string) {
    if (!key || !key.startsWith('/')) return
    router.push(key)
  }

  function handleUserMenuSelect(key: string | number) {
    if (key === 'logout') {
      authStore.logout()
      message.success('已退出登录')
      router.push('/login')
      return
    }
    if (typeof key === 'string') {
      router.push(key)
    }
  }

  async function fetchProfile() {
    loading.value = true
    errorMessage.value = null
    try {
      const result = await getCurrentUserInfo()
      profile.value = result
      profileForm.username = result.username || ''
      profileForm.email = result.email || ''
      authStore.setUserProfile({
        userId: result.userId,
        username: result.username,
        email: result.email,
        role: result.role,
      })
    } catch (error) {
      const msg = error instanceof Error ? error.message : '加载个人信息失败'
      errorMessage.value = msg
    } finally {
      loading.value = false
    }
  }

  function buildProfilePayload(): UserCurrentUpdatePayload | null {
    if (!profile.value) return null
    const payload: UserCurrentUpdatePayload = {}
    const nextUsername = profileForm.username.trim()
    const nextEmail = profileForm.email.trim()

    if (nextUsername !== profile.value.username) {
      if (!nextUsername) {
        message.warning('用户名不能为空')
        return null
      }
      payload.username = nextUsername
    }

    if (nextEmail !== profile.value.email) {
      if (!nextEmail) {
        message.warning('邮箱不能为空')
        return null
      }
      payload.email = nextEmail
    }

    if (!payload.username && !payload.email) {
      message.warning('未修改任何信息')
      return null
    }
    return payload
  }

  function handleProfileUpdate() {
    const payload = buildProfilePayload()
    if (!payload) return
    dialog.warning({
      title: '修改个人信息',
      content: '确认保存修改吗？',
      positiveText: '确认修改',
      negativeText: '取消',
      onPositiveClick: () => submitProfileUpdate(payload),
    })
  }

  async function submitProfileUpdate(payload: UserCurrentUpdatePayload): Promise<boolean> {
    saving.value = true
    try {
      await updateCurrentUserInfo(payload)
      message.success('个人信息已更新')
      await fetchProfile()
      return true
    } catch (error) {
      message.error(error instanceof Error ? error.message : '修改失败')
      return false
    } finally {
      saving.value = false
    }
  }

  function handlePasswordUpdate() {
    const password = passwordForm.password.trim()
    if (!password) {
      message.warning('请输入新密码')
      return
    }
    if (password.length < 6) {
      message.warning('密码至少6位')
      return
    }
    confirmPassword.value = ''
    dialog.warning({
      title: '再次输入新密码',
      content: () =>
        h(NInput, {
          type: 'password',
          showPasswordOn: 'click',
          value: confirmPassword.value,
          placeholder: '请再次输入新密码',
          onUpdateValue: (value: string) => {
            confirmPassword.value = value
          },
        }),
      positiveText: '继续',
      negativeText: '取消',
      onPositiveClick: () => {
        if (confirmPassword.value.trim() !== password) {
          message.error('两次密码不一致')
          return false
        }
        dialog.warning({
          title: '修改密码',
          content: '确认修改密码吗？',
          positiveText: '确认修改',
          negativeText: '取消',
          onPositiveClick: () => submitPasswordUpdate(password),
        })
        return true
      },
    })
  }

  async function submitPasswordUpdate(password: string): Promise<boolean> {
    passwordSaving.value = true
    try {
      await resetCurrentUserPassword({ password })
      message.success('密码修改成功')
      passwordForm.password = ''
      return true
    } catch (error) {
      message.error(error instanceof Error ? error.message : '修改失败')
      return false
    } finally {
      passwordSaving.value = false
    }
  }

  return {
    activeTab,
    loading,
    saving,
    passwordSaving,
    errorMessage,
    profile,
    profileForm,
    passwordForm,
    menuOptions,
    userMenuOptions,
    siderTitle,
    activeMenuKey,
    roleLabel,
    formattedLastLogin,
    formattedCreateTime,
    handleMenuSelect,
    handleUserMenuSelect,
    handleProfileUpdate,
    handlePasswordUpdate,
  }
}
