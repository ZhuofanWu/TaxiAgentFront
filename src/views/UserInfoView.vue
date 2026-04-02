<script setup lang="ts">
import {
  NButton,
  NCard,
  NDropdown,
  NForm,
  NFormItem,
  NAvatar,
  NInput,
  NLayout,
  NLayoutSider,
  NMenu,
  NSpin,
  NTabPane,
  NTabs,
  NText,
} from 'naive-ui'
import { useUserInfoView } from '@/composables/useUserInfoView'

const {
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
} = useUserInfoView()
</script>

<template>
  <NLayout has-sider class="userinfo-layout">
    <NLayoutSider
      bordered
      collapse-mode="width"
      :collapsed-width="64"
      :width="220"
      :native-scrollbar="false"
    >
      <div class="logo">
        <span>{{ siderTitle }}</span>
      </div>
      <NMenu
        :options="menuOptions"
        :value="activeMenuKey"
        :collapsed-width="64"
        @update:value="handleMenuSelect"
      />
    </NLayoutSider>

    <NLayout class="content-layout">
      <div class="header">
        <div class="header-right">
          <NDropdown :options="userMenuOptions" @select="handleUserMenuSelect">
            <div class="user-info">
              <NAvatar round size="small">
                {{ profile?.username?.charAt(0)?.toUpperCase() || 'U' }}
              </NAvatar>
              <span class="username">
                {{ profile?.username || '用户' }}
              </span>
            </div>
          </NDropdown>
        </div>
      </div>

      <div class="userinfo-content">
        <div class="page-header">
          <div>
            <div class="page-title">个人中心</div>
            <NText depth="3">在这里管理您的账户信息与密码</NText>
          </div>
        </div>

        <NTabs v-model:value="activeTab" type="line" animated>
          <NTabPane name="profile" tab="个人信息">
            <NSpin :show="loading">
              <div class="tab-panel">
                <NText v-if="errorMessage" depth="3" class="error-text">
                  {{ errorMessage }}
                </NText>

                <NCard class="info-card">
                  <div class="section-title">基础信息</div>
                  <NForm label-placement="left" label-width="96">
                    <NFormItem label="用户ID">
                      <span class="static-value">{{ profile?.userId || '-' }}</span>
                    </NFormItem>
                    <NFormItem label="用户名">
                      <NInput
                        v-model:value="profileForm.username"
                        placeholder="请输入用户名"
                        :maxlength="50"
                        :disabled="loading"
                      />
                    </NFormItem>
                    <NFormItem label="邮箱">
                      <NInput
                        v-model:value="profileForm.email"
                        placeholder="请输入邮箱"
                        :maxlength="100"
                        :disabled="loading"
                      />
                    </NFormItem>
                    <NFormItem label="角色">
                      <span class="static-value">{{ roleLabel }}</span>
                    </NFormItem>
                    <NFormItem label="上次登录">
                      <span class="static-value">{{ formattedLastLogin }}</span>
                    </NFormItem>
                    <NFormItem label="注册时间">
                      <span class="static-value">{{ formattedCreateTime }}</span>
                    </NFormItem>
                  </NForm>
                  <div class="form-actions">
                    <NButton
                      type="primary"
                      :loading="saving"
                      :disabled="loading || saving"
                      @click="handleProfileUpdate"
                    >
                      修改
                    </NButton>
                  </div>
                </NCard>
              </div>
            </NSpin>
          </NTabPane>

          <NTabPane name="password" tab="修改密码">
            <NSpin :show="loading">
              <div class="tab-panel">
                <NCard class="info-card">
                  <div class="section-title">修改密码</div>
                  <NForm label-placement="left" label-width="96">
                    <NFormItem label="新密码">
                      <NInput
                        v-model:value="passwordForm.password"
                        type="password"
                        show-password-on="click"
                        placeholder="请输入新密码（至少6位）"
                        :maxlength="50"
                        :disabled="loading || passwordSaving"
                        @keyup.enter="handlePasswordUpdate"
                      />
                    </NFormItem>
                  </NForm>
                  <div class="form-actions">
                    <NButton
                      type="primary"
                      :loading="passwordSaving"
                      :disabled="loading || passwordSaving"
                      @click="handlePasswordUpdate"
                    >
                      修改密码
                    </NButton>
                  </div>
                </NCard>
              </div>
            </NSpin>
          </NTabPane>
        </NTabs>
      </div>
    </NLayout>
  </NLayout>
</template>

<style scoped>
.userinfo-layout {
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

.content-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
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

.userinfo-content {
  flex: 1;
  overflow: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-title {
  font-size: 1.6rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 4px;
}

.tab-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-top: 1rem;
}

.info-card {
  border-radius: 12px;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 0.75rem;
}

.static-value {
  color: #1f2937;
  font-size: 0.95rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
}

.error-text {
  color: #ef4444;
}

@media (max-width: 900px) {
  .userinfo-layout {
    height: auto;
    min-height: 100vh;
  }

  .userinfo-content {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>
