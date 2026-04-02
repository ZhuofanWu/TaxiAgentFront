<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { NButton, useMessage } from 'naive-ui'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const message = useMessage()
const authStore = useAuthStore()

const isLoggedIn = computed(() => authStore.isAuthenticated)
const userRole = computed(() => authStore.userRole)

const goToLogin = () => {
  router.push('/login')
}

const goToRegister = () => {
  router.push('/register')
}

const goToDashboard = (path: string) => {
  router.push(path)
}

const handleLogout = async () => {
  await authStore.logout()
  message.success('已退出登录')
  router.push('/login')
}
</script>

<template>
  <div class="home-page">
    <div class="hero">
      <div class="brand">
        <div class="logo">
          <img src="/icon.png" alt="迅达出行" class="logo-image" />
        </div>
        <h1 class="brand-name">迅达出行</h1>
      </div>
      <p class="slogan">快捷出行，舒适体验</p>

      <!-- 未登录时显示登录/注册按钮 -->
      <div v-if="!isLoggedIn" class="buttons">
        <NButton type="primary" size="large" @click="goToLogin"> 登录 </NButton>
        <NButton size="large" @click="goToRegister"> 注册 </NButton>
      </div>

      <!-- 已登录时显示角色入口和登出 -->
      <div v-else class="user-panel">
        <p class="welcome">欢迎回来！</p>
        <div class="role-buttons">
          <NButton v-if="userRole === 'USER'" type="primary" @click="goToDashboard('/user')">
            进入用户中心
          </NButton>
          <NButton v-if="userRole === 'ADMIN'" type="primary" @click="goToDashboard('/admin')">
            进入管理后台
          </NButton>
          <NButton v-if="userRole === 'DRIVER'" type="primary" @click="goToDashboard('/driver')">
            进入司机端
          </NButton>
          <NButton v-if="userRole === 'SUPPORT'" type="primary" @click="goToDashboard('/support')">
            进入客服中心
          </NButton>
        </div>
        <NButton @click="handleLogout"> 退出登录 </NButton>
      </div>
    </div>

    <div class="features">
      <div class="feature-item">
        <div class="feature-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12,6 12,12 16,14" />
          </svg>
        </div>
        <h3>快速响应</h3>
        <p>平均3分钟内接单</p>
      </div>
      <div class="feature-item">
        <div class="feature-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </div>
        <h3>安全出行</h3>
        <p>多重安全保障机制</p>
      </div>
      <div class="feature-item">
        <div class="feature-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="1" y="3" width="15" height="13" />
            <polygon points="16,8 20,8 23,11 23,16 16,16" />
            <circle cx="5.5" cy="18.5" r="2.5" />
            <circle cx="18.5" cy="18.5" r="2.5" />
          </svg>
        </div>
        <h3>舒适乘车</h3>
        <p>专业司机服务</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.hero {
  text-align: center;
  margin-bottom: 4rem;
}

.brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.logo {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
}

.logo-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.brand-name {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.slogan {
  font-size: 1.125rem;
  color: #64748b;
  margin-bottom: 2.5rem;
}

.buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.buttons .n-button {
  min-width: 120px;
}

.user-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
}

.welcome {
  font-size: 1.125rem;
  color: #1e293b;
  margin: 0;
}

.role-buttons {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}

.features {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
  justify-content: center;
}

.feature-item {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  width: 180px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.feature-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 1rem;
  color: #3b82f6;
}

.feature-icon svg {
  width: 100%;
  height: 100%;
}

.feature-item h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.5rem;
}

.feature-item p {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
}

@media (max-width: 640px) {
  .brand-name {
    font-size: 2rem;
  }

  .features {
    gap: 1rem;
  }

  .feature-item {
    width: 100%;
    max-width: 200px;
  }
}
</style>
