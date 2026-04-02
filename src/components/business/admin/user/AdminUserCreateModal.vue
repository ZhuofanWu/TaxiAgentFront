<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { NButton, NInput, NModal, NSelect } from 'naive-ui'
import type { SelectOption } from 'naive-ui'
import type { AdminUserCreatePayload, UserRole } from '@/types/adminUser'

const props = defineProps<{
  show: boolean
  roleOptions: SelectOption[]
  loading: boolean
}>()

const emit = defineEmits<{
  (event: 'close'): void
  (event: 'submit', payload: AdminUserCreatePayload): void
}>()

const form = reactive<{ userName: string; password: string; role: UserRole | null }>({
  userName: '',
  password: '',
  role: null,
})

const canSubmit = computed(() => Boolean(form.userName.trim() && form.password.trim() && form.role))

function resetForm() {
  form.userName = ''
  form.password = ''
  form.role = null
}

function handleClose() {
  emit('close')
}

function handleSubmit() {
  emit('submit', {
    userName: form.userName.trim(),
    password: form.password.trim(),
    role: form.role as UserRole,
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
</script>

<template>
  <NModal
    :show="show"
    preset="card"
    title="新建用户"
    style="width: 520px; max-width: 92vw"
    @close="handleClose"
  >
    <div class="modal-body">
      <div class="form-item">
        <span class="label">用户名</span>
        <NInput v-model:value="form.userName" placeholder="请输入用户名" clearable />
      </div>
      <div class="form-item">
        <span class="label">密码</span>
        <NInput v-model:value="form.password" type="password" placeholder="请输入密码" clearable />
      </div>
      <div class="form-item">
        <span class="label">角色</span>
        <NSelect v-model:value="form.role" :options="roleOptions" placeholder="选择角色" />
      </div>
      <div class="action-row">
        <NButton @click="handleClose">取消</NButton>
        <NButton type="primary" :loading="loading" :disabled="!canSubmit" @click="handleSubmit">
          创建
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
