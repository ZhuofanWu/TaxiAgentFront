<script setup lang="ts">
import { ref } from 'vue'
import { NModal, NInput, NButton, useMessage } from 'naive-ui'
import { addRagQa } from '@/api/rag'

defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  close: []
  success: []
}>()

const message = useMessage()
const questions = ref<string[]>([''])
const answer = ref('')
const submitting = ref(false)

function addQuestion() {
  questions.value.push('')
}

function removeQuestion(index: number) {
  if (questions.value.length > 2) {
    questions.value.splice(index, 1)
  }
}

function resetForm() {
  questions.value = ['']
  answer.value = ''
}

function handleClose() {
  emit('close')
  resetForm()
}

async function handleSubmit() {
  const cleanedQuestions = questions.value
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
  const cleanedAnswer = answer.value.trim()

  if (cleanedQuestions.length === 0) {
    message.warning('请至少填写一个问题')
    return
  }
  if (!cleanedAnswer) {
    message.warning('请填写答案')
    return
  }

  submitting.value = true
  try {
    await addRagQa({ questions: cleanedQuestions, answer: cleanedAnswer })
    message.success('新增成功')
    emit('success')
    handleClose()
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : '新增失败'
    message.error(errMsg)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <NModal
    :show="show"
    preset="card"
    title="新增问答对"
    style="width: 640px; max-width: 92vw"
    @close="handleClose"
  >
    <div class="qa-add-modal">
      <div class="form-section">
        <div class="section-title">问题</div>
        <div class="question-list">
          <div v-for="(question, index) in questions" :key="index" class="question-row">
            <NInput v-model:value="questions[index]" placeholder="请输入问题" clearable />
            <div class="question-actions">
              <NButton size="small" type="primary" @click="addQuestion"> + </NButton>
              <NButton
                v-if="questions.length > 2"
                size="small"
                type="error"
                @click="removeQuestion(index)"
              >
                -
              </NButton>
            </div>
          </div>
        </div>
      </div>

      <div class="form-section">
        <div class="section-title">答案</div>
        <NInput
          v-model:value="answer"
          type="textarea"
          placeholder="请输入答案"
          :autosize="{ minRows: 4, maxRows: 8 }"
        />
      </div>

      <div class="action-row">
        <NButton @click="handleClose">取消</NButton>
        <NButton type="primary" :loading="submitting" @click="handleSubmit"> 提交 </NButton>
      </div>
    </div>
  </NModal>
</template>

<style scoped>
.qa-add-modal {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.section-title {
  font-size: 0.875rem;
  color: #475569;
}

.question-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.question-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.question-actions {
  display: flex;
  gap: 0.35rem;
}

.action-row {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}
</style>
