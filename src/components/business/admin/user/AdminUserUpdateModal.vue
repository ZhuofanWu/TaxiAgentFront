<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { NButton, NInput, NModal, NSelect } from 'naive-ui'
import type { SelectOption } from 'naive-ui'
import type { AdminUserRecord, AdminUserUpdatePayload, UserRole } from '@/types/adminUser'

const props = defineProps<{
  show: boolean
  user: AdminUserRecord | null
  roleOptions: SelectOption[]
  loading: boolean
}>()

const emit = defineEmits<{
  (event: 'close'): void
  (event: 'submit', payload: AdminUserUpdatePayload): void
}>()

const form = reactive<{
  userId: string
  username: string
  email: string
  password: string
  role: UserRole | null
}>({
  userId: '',
  username: '',
  email: '',
  password: '',
  role: null,
})

const canSubmit = computed(() => Boolean(form.userId))

function resetForm() {
  form.userId = ''
  form.username = ''
  form.email = ''
  form.password = ''
  form.role = null
}

function applyUser(user: AdminUserRecord) {
  form.userId = user.userId
  form.username = user.userName || ''
  form.email = user.email || ''
  form.password = ''
  form.role = (user.role as UserRole) || null
}

function handleClose() {
  emit('close')
}

function handleSubmit() {
  emit('submit', {
    userId: form.userId,
    username: form.username.trim(),
    email: form.email.trim(),
    password: form.password.trim(),
    role: form.role || undefined,
  })
}

watch(
  () => props.show,
  (value) => {
    if (!value) {
      resetForm()
    }
  },
)

watch(
  () => props.user,
  (user) => {
    if (props.show && user) {
      applyUser(user)
    }
  },
  { immediate: true },
)
</script>

<template>
  <NModal
    :show="show"
    preset="card"
    title="修改用户"
    style="width: 560px; max-width: 92vw"
    @close="handleClose"
  >
    <div class="modal-body">
      <div class="form-item">
        <span class="label">用户ID</span>
        <NInput v-model:value="form.userId" disabled />
      </div>
      <div class="form-item">
        <span class="label">用户名</span>
        <NInput v-model:value="form.username" placeholder="请输入用户名" clearable />
      </div>
      <div class="form-item">
        <span class="label">邮件</span>
        <NInput v-model:value="form.email" placeholder="请输入邮箱" clearable />
      </div>
      <div class="form-item">
        <span class="label">密码</span>
        <NInput
          v-model:value="form.password"
          type="password"
          placeholder="如需修改请填写"
          clearable
        />
      </div>
      <div class="form-item">
        <span class="label">角色</span>
        <NSelect v-model:value="form.role" :options="roleOptions" placeholder="选择角色" />
      </div>
      <div class="action-row">
        <NButton @click="handleClose">取消</NButton>
        <NButton type="primary" :loading="loading" :disabled="!canSubmit" @click="handleSubmit">
          保存
        </NButton>
      </div>
    </div>
  </NModal>
</template>

<style scoped>
.modal-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.label {
  font-size: 0.875rem;
  color: #475569;
}

.action-row {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}
</style>
