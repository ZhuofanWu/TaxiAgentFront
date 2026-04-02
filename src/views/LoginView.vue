<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { NInput, NButton, NTabs, NTabPane, NForm, NFormItem, useMessage } from 'naive-ui'
import { useAuthStore } from '@/stores/auth'
import { sendEmailCode } from '@/api/auth'
import { EmailCodeScene } from '@/types/auth'

const router = useRouter()
const message = useMessage()
const authStore = useAuthStore()

// 登录方式: 'password' | 'email_code'
const loginType = ref<'password' | 'email_code'>('password')

// 表单数据
const passwordForm = reactive({
  login: '',
  password: '',
})

const emailCodeForm = reactive({
  email: '',
  code: '',
})

// 加载状态
const sendCodeLoading = ref(false)
const passwordLoginLoading = ref(false)
const emailCodeLoginLoading = ref(false)

// 验证码倒计时
const countdown = ref(0)

// 验证码倒计时定时器
let countdownTimer: ReturnType<typeof setInterval> | null = null

// 发送验证码
async function handleSendCode() {
  if (!emailCodeForm.email) {
    message.error('请输入邮箱')
    return
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(emailCodeForm.email)) {
    message.error('请输入有效的邮箱地址')
    return
  }

  sendCodeLoading.value = true
  try {
    await sendEmailCode({ email: emailCodeForm.email, scene: EmailCodeScene.LOGIN })
    message.success('验证码已发送')
    // 开始倒计时
    countdown.value = 60
    countdownTimer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        countdownTimer && clearInterval(countdownTimer)
        countdownTimer = null
      }
    }, 1000)
  } catch (error: unknown) {
    const err = error instanceof Error ? error.message : '发送失败'
    message.error(err)
  } finally {
    sendCodeLoading.value = false
  }
}

// 密码登录
async function handlePasswordLogin() {
  if (!passwordForm.login || !passwordForm.password) {
    message.error('请填写完整信息')
    return
  }

  passwordLoginLoading.value = true
  try {
    await authStore.loginByPasswordAction(passwordForm.login, passwordForm.password)
    message.success('登录成功')
    router.push(authStore.getRoleRedirectPath())
  } catch (error: unknown) {
    const err = error instanceof Error ? error.message : '登录失败'
    message.error(err)
  } finally {
    passwordLoginLoading.value = false
  }
}

// 验证码登录
async function handleEmailCodeLogin() {
  if (!emailCodeForm.email || !emailCodeForm.code) {
    message.error('请填写完整信息')
    return
  }

  emailCodeLoginLoading.value = true
  try {
    await authStore.loginByCodeAction(emailCodeForm.email, emailCodeForm.code)
    message.success('登录成功')
    router.push(authStore.getRoleRedirectPath())
  } catch (error: unknown) {
    const err = error instanceof Error ? error.message : '登录失败'
    message.error(err)
  } finally {
    emailCodeLoginLoading.value = false
  }
}

function goBack() {
  router.push('/')
}

function goToRegister() {
  router.push('/register')
}

function goToResetPassword() {
  router.push('/reset-password')
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <button class="back-btn" @click="goBack">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        返回
      </button>

      <h1>登录</h1>
      <p class="subtitle">欢迎回来</p>

      <NTabs v-model:value="loginType" type="segment" animated>
        <!-- 密码登录 -->
        <NTabPane name="password" tab="密码登录">
          <NForm>
            <NFormItem label="账号">
              <NInput
                v-model:value="passwordForm.login"
                placeholder="请输入邮箱或用户名"
                :maxlength="100"
              />
            </NFormItem>
            <NFormItem label="密码">
              <NInput
                v-model:value="passwordForm.password"
                type="password"
                show-password-on="click"
                placeholder="请输入密码"
                :maxlength="50"
                @keyup.enter="handlePasswordLogin"
              />
            </NFormItem>
          </NForm>

          <div class="action-row">
            <span class="link" @click="goToResetPassword">忘记密码？</span>
          </div>

          <NButton
            type="primary"
            block
            :loading="passwordLoginLoading"
            @click="handlePasswordLogin"
          >
            登录
          </NButton>
        </NTabPane>

        <!-- 验证码登录 -->
        <NTabPane name="email_code" tab="验证码登录">
          <NForm>
            <NFormItem label="邮箱">
              <NInput
                v-model:value="emailCodeForm.email"
                placeholder="请输入邮箱"
                :maxlength="100"
              />
            </NFormItem>
            <NFormItem label="验证码">
              <div class="code-input-row">
                <NInput
                  v-model:value="emailCodeForm.code"
                  placeholder="请输入验证码"
                  :maxlength="6"
                  @keyup.enter="handleEmailCodeLogin"
                />
                <NButton
                  type="primary"
                  ghost
                  :loading="sendCodeLoading"
                  :disabled="countdown > 0"
                  @click="handleSendCode"
                >
                  {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
                </NButton>
              </div>
            </NFormItem>
          </NForm>

          <div class="action-row">
            <span class="link" @click="goToResetPassword">忘记密码？</span>
          </div>

          <NButton
            type="primary"
            block
            :loading="emailCodeLoginLoading"
            @click="handleEmailCodeLogin"
          >
            登录
          </NButton>
        </NTabPane>
      </NTabs>

      <div class="footer">
        还没有账号？<span class="link" @click="goToRegister">立即注册</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.auth-card {
  background: white;
  border-radius: 16px;
  padding: 2.5rem;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  color: #64748b;
  font-size: 0.875rem;
  cursor: pointer;
  margin-bottom: 1.5rem;
  padding: 0;
}

.back-btn svg {
  width: 20px;
  height: 20px;
}

.back-btn:hover {
  color: #3b82f6;
}

h1 {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.5rem;
}

.subtitle {
  color: #64748b;
  margin: 0 0 2rem;
}

.action-row {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1.5rem;
}

.link {
  color: #3b82f6;
  cursor: pointer;
  font-size: 0.875rem;
}

.link:hover {
  text-decoration: underline;
}

.footer {
  margin-top: 1.5rem;
  text-align: center;
  color: #64748b;
  font-size: 0.875rem;
}

.code-input-row {
  display: flex;
  gap: 0.75rem;
}

.code-input-row > *:first-child {
  flex: 1;
  min-width: 0;
}

.code-input-row .n-button {
  flex-shrink: 0;
  min-width: 110px;
}
</style>
