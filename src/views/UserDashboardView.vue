<script setup lang="ts">
import { computed, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NLayout, NLayoutSider, NMenu, NIcon, NAvatar, NDropdown, useMessage } from 'naive-ui'
import { HomeOutline, TicketOutline, CartOutline, LocationOutline } from '@vicons/ionicons5'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const authStore = useAuthStore()

// 菜单配置
const menuOptions = [
  {
    label: '首页',
    key: '/user',
    icon: () => h(NIcon, null, { default: () => h(HomeOutline) }),
  },
  {
    label: '订单管理',
    key: 'orders',
    icon: () => h(NIcon, null, { default: () => h(CartOutline) }),
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
    icon: () => h(NIcon, null, { default: () => h(TicketOutline) }),
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
    icon: () => h(NIcon, null, { default: () => h(LocationOutline) }),
  },
]

// 当前激活菜单
const activeKey = computed(() => route.path)

// 菜单点击处理
function handleMenuKey(key: string) {
  router.push(key)
}

// 用户下拉菜单
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

// 用户菜单处理
function handleUserMenuKey(key: string) {
  if (key === 'logout') {
    authStore.logout()
    message.success('已退出登录')
    router.push('/login')
  } else {
    router.push(key)
  }
}
</script>

<template>
  <NLayout has-sider class="dashboard-layout">
    <!-- 左侧导航栏 -->
    <NLayoutSider
      bordered
      collapse-mode="width"
      :collapsed-width="64"
      :width="220"
      :native-scrollbar="false"
    >
      <div class="logo">
        <span>用户中心</span>
      </div>

      <NMenu
        :options="menuOptions"
        :value="activeKey"
        :collapsed-width="64"
        @update:value="handleMenuKey"
      />
    </NLayoutSider>

    <!-- 右侧内容区 -->
    <NLayout>
      <!-- 顶部栏 -->
      <div class="header">
        <div class="header-right">
          <NDropdown :options="userMenuOptions" @select="handleUserMenuKey">
            <div class="user-info">
              <NAvatar round size="small">
                {{ authStore.userInfo?.username?.charAt(0)?.toUpperCase() || 'U' }}
              </NAvatar>
              <span class="username">
                {{ authStore.userInfo?.username || '用户' }}
              </span>
            </div>
          </NDropdown>
        </div>
      </div>

      <!-- 页面内容 -->
      <div class="content">
        <router-view />
      </div>
    </NLayout>
  </NLayout>
</template>

<style scoped>
.dashboard-layout {
  height: 100vh;
}

.logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  border-bottom: 1px solid #e2e8f0;
}

.header {
  height: 64px;
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  border-bottom: 1px solid #e2e8f0;
  background: white;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.user-info:hover {
  background-color: #f1f5f9;
}

.username {
  font-size: 0.875rem;
  color: #475569;
}

.content {
  height: calc(100vh - 64px);
  overflow: auto;
  background: #f8fafc;
}
</style>
