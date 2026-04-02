import { createRouter, createWebHistory } from 'vue-router'
import type { RouteLocationNormalized } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { useAuthStore } from '@/stores/auth'
import { UserRole } from '@/types/auth'

const APP_TITLE = '迅达出行'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { title: '首页' },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { title: '登录' },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterView.vue'),
      meta: { title: '注册' },
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: () => import('../views/ResetPasswordView.vue'),
      meta: { title: '忘记密码' },
    },
    {
      path: '/userinfo',
      name: 'user-info',
      component: () => import('../views/UserInfoView.vue'),
      meta: { title: '个人中心', requiresAuth: true },
    },
    {
      path: '/user',
      name: 'user',
      component: () => import('../views/UserDashboardView.vue'),
      meta: { title: '用户中心', requiresAuth: true, roles: [UserRole.USER] },
      children: [
        {
          path: '',
          name: 'user-home',
          component: () => import('../views/user/UserHomeView.vue'),
          meta: { title: '用户首页' },
        },
        {
          path: 'create-ticket',
          name: 'user-create-ticket',
          component: () => import('../views/user/CreateTicketView.vue'),
          meta: { title: '新建工单' },
        },
        {
          path: 'my-tickets',
          name: 'user-my-tickets',
          component: () => import('../views/user/MyTicketsView.vue'),
          meta: { title: '我的工单' },
        },
        {
          path: 'tickets/:id',
          name: 'user-ticket-detail',
          component: () => import('../views/user/TicketDetailView.vue'),
          meta: { title: '工单详情' },
        },
        {
          path: 'orders',
          name: 'user-orders',
          redirect: { name: 'user-orders-current' },
        },
        {
          path: 'orders/new',
          name: 'user-orders-new',
          component: () => import('../views/user/CreateOrderView.vue'),
          meta: { title: '网约车下单' },
        },
        {
          path: 'orders/current',
          name: 'user-orders-current',
          component: () => import('../views/user/CurrentOrdersView.vue'),
          meta: { title: '当前订单' },
        },
        {
          path: 'orders/current/:orderId',
          name: 'user-orders-current-detail',
          component: () => import('../views/user/CurrentOrdersView.vue'),
          meta: { title: '当前订单详情' },
        },
        {
          path: 'orders/history',
          name: 'user-orders-history',
          component: () => import('../views/user/OrderHistoryView.vue'),
          meta: { title: '历史订单' },
        },
        {
          path: 'orders/detail',
          name: 'user-orders-detail',
          component: () => import('../views/user/OrderDetailView.vue'),
          meta: { title: '订单详情' },
        },
        {
          path: 'addresses',
          name: 'user-addresses',
          component: () => import('../views/user/AddressesView.vue'),
          meta: { title: '地址管理' },
        },
      ],
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('../views/AdminDashboardView.vue'),
      meta: { title: '管理后台', requiresAuth: true, roles: [UserRole.ADMIN] },
      children: [
        {
          path: '',
          name: 'admin-home',
          component: () => import('../views/admin/AdminHomeView.vue'),
          meta: { title: '工作台' },
        },
        {
          path: 'user',
          name: 'admin-user',
          component: () => import('../views/admin/AdminUserManagementView.vue'),
          meta: { title: '用户管理' },
        },
        {
          path: 'tickets',
          name: 'admin-tickets',
          component: () => import('../views/admin/AdminTicketPoolView.vue'),
          meta: { title: '工单管理' },
        },
        {
          path: 'my-tickets',
          name: 'admin-my-tickets',
          component: () => import('../views/admin/AdminMyTicketsView.vue'),
          meta: { title: '我的工单' },
        },
        {
          path: 'tickets/:id',
          name: 'admin-ticket-detail',
          component: () => import('../views/admin/AdminTicketDetailView.vue'),
          meta: { title: '工单详情' },
        },
        {
          path: 'rag',
          name: 'admin-rag',
          component: () => import('../views/admin/AdminRagView.vue'),
          redirect: '/admin/rag/qa',
          meta: { title: 'RAG 管理' },
          children: [
            {
              path: 'qa',
              name: 'admin-rag-qa',
              component: () => import('../views/admin/rag/RagQaManagementView.vue'),
              meta: { title: '问答对管理' },
            },
            {
              path: 'recall-test',
              name: 'admin-rag-recall-test',
              component: () => import('../views/admin/rag/RagRecallTestView.vue'),
              meta: { title: '召回测试' },
            },
          ],
        },
        {
          path: 'orders/history',
          name: 'admin-orders-history',
          component: () => import('../views/admin/orders/OrderHistoryView.vue'),
          meta: { title: '历史订单' },
        },
        {
          path: 'orders/detail',
          name: 'admin-orders-detail',
          component: () => import('../views/admin/orders/OrderDetailView.vue'),
          meta: { title: '订单详情' },
        },
      ],
    },
    {
      path: '/driver',
      name: 'driver',
      component: () => import('../views/DriverDashboardView.vue'),
      meta: { title: '司机端', requiresAuth: true, roles: [UserRole.DRIVER] },
      children: [
        {
          path: '',
          name: 'driver-home',
          component: () => import('../views/driver/DriverHomeView.vue'),
          meta: { title: '司机工作台' },
        },
        {
          path: 'create-ticket',
          name: 'driver-create-ticket',
          component: () => import('../views/user/CreateTicketView.vue'),
          meta: { title: '新建工单' },
        },
        {
          path: 'my-tickets',
          name: 'driver-my-tickets',
          component: () => import('../views/driver/MyTicketsView.vue'),
          meta: { title: '我的工单' },
        },
        {
          path: 'tickets/:id',
          name: 'driver-ticket-detail',
          component: () => import('../views/driver/TicketDetailView.vue'),
          meta: { title: '工单详情' },
        },
        {
          path: 'orders',
          name: 'driver-orders',
          component: () => import('../views/driver/OrdersView.vue'),
          redirect: { name: 'driver-orders-pool' },
          meta: { title: '订单管理' },
          children: [
            {
              path: 'pool',
              name: 'driver-orders-pool',
              component: () => import('../views/driver/orders/OrderPoolView.vue'),
              meta: { title: '订单池' },
            },
            {
              path: 'current',
              name: 'driver-orders-current',
              component: () => import('../views/driver/orders/CurrentOrderView.vue'),
              meta: { title: '当前订单' },
            },
            {
              path: 'history',
              name: 'driver-orders-history',
              component: () => import('../views/driver/orders/OrderHistoryView.vue'),
              meta: { title: '历史订单' },
            },
            {
              path: 'detail',
              name: 'driver-orders-detail',
              component: () => import('../views/driver/orders/OrderDetailView.vue'),
              meta: { title: '订单详情' },
            },
          ],
        },
      ],
    },
    {
      path: '/support',
      name: 'support',
      component: () => import('../views/SupportDashboardView.vue'),
      meta: { title: '客服中心', requiresAuth: true, roles: [UserRole.SUPPORT] },
      children: [
        {
          path: '',
          name: 'support-home',
          component: () => import('../views/support/SupportHomeView.vue'),
          meta: { title: '客服工作台' },
        },
        {
          path: 'tickets',
          name: 'support-tickets',
          component: () => import('../views/support/TicketPoolView.vue'),
          meta: { title: '工单池' },
        },
        {
          path: 'my-tickets',
          name: 'support-my-tickets',
          component: () => import('../views/support/MyTicketsView.vue'),
          meta: { title: '我的工单' },
        },
        {
          path: 'tickets/:id',
          name: 'support-ticket-detail',
          component: () => import('../views/support/TicketDetailView.vue'),
          meta: { title: '工单详情' },
        },
        {
          path: 'orders/history',
          name: 'support-orders-history',
          component: () => import('../views/support/orders/OrderHistoryView.vue'),
          meta: { title: '历史订单' },
        },
        {
          path: 'orders/detail',
          name: 'support-orders-detail',
          component: () => import('../views/support/orders/OrderDetailView.vue'),
          meta: { title: '订单详情' },
        },
      ],
    },
  ],
})

router.beforeEach(async (to: RouteLocationNormalized) => {
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
  if (!requiresAuth) return true

  const authStore = useAuthStore()
  if (!authStore.isAuthenticated) {
    return '/login'
  }

  if (!authStore.userRole) {
    await authStore.syncCurrentUserProfile()
  }

  const hasRoleAccess = to.matched.every((record) => {
    const roles = record.meta.roles
    return !roles || (authStore.userRole ? roles.includes(authStore.userRole) : false)
  })

  if (!hasRoleAccess) {
    return authStore.getRoleRedirectPath()
  }

  return true
})

router.afterEach((to: RouteLocationNormalized) => {
  const titleMatch = [...to.matched]
    .reverse()
    .find((record) => typeof record.meta.title === 'string')
  const routeTitle = typeof titleMatch?.meta.title === 'string' ? titleMatch.meta.title : undefined
  document.title = routeTitle ? `${routeTitle} - ${APP_TITLE}` : APP_TITLE
})

export default router
