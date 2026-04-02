<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { NInput, NButton, NForm, NFormItem, useMessage } from 'naive-ui'
import { sendEmailCode, resetPassword } from '@/api/auth'
import { EmailCodeScene } from '@/types/auth'

const router = useRouter()
const message = useMessage()

// 步骤: 1=输入邮箱, 2=重置密码
const step = ref(1)

// 表单数据
const emailForm = reactive({
  email: '',
})

const resetForm = reactive({
  code: '',
  newPassword: '',
  confirmPassword: '',
})

// 加载状态
const sendCodeLoading = ref(false)
const resetLoading = ref(false)

// 验证码倒计时
const countdown = ref(0)
let countdownTimer: ReturnType<typeof setInterval> | null = null

// 验证邮箱格式
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// 发送验证码
async function handleSendCode() {
  if (!emailForm.email) {
    message.error('请输入邮箱')
    return
  }

  if (!isValidEmail(emailForm.email)) {
    message.error('请输入有效的邮箱地址')
    return
  }

  sendCodeLoading.value = true
  try {
    await sendEmailCode({ email: emailForm.email, scene: EmailCodeScene.RESET_PASSWORD })
    message.success('验证码已发送')
    step.value = 2
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

// 重置密码
async function handleResetPassword() {
  if (!resetForm.code) {
    message.error('请输入验证码')
    return
  }
  if (!resetForm.newPassword) {
    message.error('请输入新密码')
    return
  }
  if (resetForm.newPassword.length < 6) {
    message.error('密码至少6位')
    return
  }
  if (resetForm.newPassword !== resetForm.confirmPassword) {
    message.error('两次密码不一致')
    return
  }

  resetLoading.value = true
  try {
    await resetPassword({
      email: emailForm.email,
      code: resetForm.code,
      newPassword: resetForm.newPassword,
    })
    message.success('密码重置成功，请登录')
    router.push('/login')
  } catch (error: unknown) {
    const err = error instanceof Error ? error.message : '重置失败'
    message.error(err)
  } finally {
    resetLoading.value = false
  }
}

function goBack() {
  if (step.value === 2) {
    step.value = 1
    countdownTimer && clearInterval(countdownTimer)
    countdownTimer = null
    countdown.value = 0
  } else {
    router.push('/login')
  }
}

function goToLogin() {
  router.push('/login')
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <button class="back-btn" @click="goBack">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        {{ step === 2 ? '上一步' : '返回' }}
      </button>

      <h1>忘记密码</h1>
      <p class="subtitle">{{ step === 1 ? '输入您的邮箱' : '设置新密码' }}</p>

      <!-- 步骤1: 输入邮箱 -->
      <template v-if="step === 1">
        <NForm>
          <NFormItem label="邮箱">
            <NInput
              v-model:value="emailForm.email"
              placeholder="请输入注册邮箱"
              :maxlength="100"
              @keyup.enter="handleSendCode"
            />
          </NFormItem>
        </NForm>

        <NButton
          type="primary"
          block
          :loading="sendCodeLoading"
          @click="handleSendCode"
        >
          获取验证码
        </NButton>
      </template>

      <!-- 步骤2: 重置密码 -->
      <template v-else>
        <NForm>
          <NFormItem label="验证码">
            <div class="code-input-row">
              <NInput
                v-model:value="resetForm.code"
                placeholder="请输入验证码"
                :maxlength="6"
                @keyup.enter="handleResetPassword"
              />
              <NButton
                type="primary"
                ghost
                :disabled="countdown > 0"
              >
                {{ countdown > 0 ? `${countdown}s` : '' }}
              </NButton>
            </div>
          </NFormItem>
          <NFormItem label="新密码">
            <NInput
              v-model:value="resetForm.newPassword"
              type="password"
              show-password-on="click"
              placeholder="请输入新密码（至少6位）"
              :maxlength="50"
            />
          </NFormItem>
          <NFormItem label="确认密码">
            <NInput
              v-model:value="resetForm.confirmPassword"
              type="password"
              show-password-on="click"
              placeholder="请再次输入新密码"
              :maxlength="50"
              @keyup.enter="handleResetPassword"
            />
          </NFormItem>
        </NForm>

        <NButton
          type="primary"
          block
          :loading="resetLoading"
          @click="handleResetPassword"
        >
          重置密码
        </NButton>
      </template>

      <div class="footer">
        想起密码了？<span class="link" @click="goToLogin">立即登录</span>
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

.link {
  color: #3b82f6;
  cursor: pointer;
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

.code-input-row > *:last-child {
  flex-shrink: 0;
  min-width: 110px;
}
</style>
