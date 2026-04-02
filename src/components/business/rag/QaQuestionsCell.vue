<script setup lang="ts">
import { computed } from 'vue'
import { NPopover, NCheckbox } from 'naive-ui'

const props = defineProps<{
  questionMap: Record<string, string>
  selectedQuestionIds: string[]
}>()

const emit = defineEmits<{
  'update:selectedQuestionIds': [value: string[]]
}>()

const questionEntries = computed(() => Object.entries(props.questionMap))
const firstQuestion = computed(() => questionEntries.value[0]?.[1] ?? '-')
const selectedSet = computed(() => new Set(props.selectedQuestionIds))

function toggleQuestion(questionId: string, checked: boolean) {
  const next = new Set(props.selectedQuestionIds)
  if (checked) {
    next.add(questionId)
  } else {
    next.delete(questionId)
  }
  emit('update:selectedQuestionIds', Array.from(next))
}
</script>

<template>
  <NPopover trigger="hover" placement="bottom-start">
    <template #trigger>
      <div class="question-cell">
        <span class="question-text">{{ firstQuestion }}</span>
        <span class="question-arrow">↓</span>
      </div>
    </template>
    <div class="question-popover">
      <div v-if="questionEntries.length === 0" class="empty-state">暂无问题</div>
      <div v-else class="question-list">
        <div
          v-for="[questionId, question] in questionEntries"
          :key="questionId"
          class="question-item"
        >
          <NCheckbox
            :checked="selectedSet.has(questionId)"
            @update:checked="(checked) => toggleQuestion(questionId, checked)"
          >
            <span class="question-label">{{ question }}</span>
          </NCheckbox>
        </div>
      </div>
    </div>
  </NPopover>
</template>

<style scoped>
.question-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.question-text {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.question-arrow {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  background: #e2e8f0;
  color: #475569;
  font-size: 12px;
  line-height: 18px;
  text-align: center;
  flex-shrink: 0;
}

.question-popover {
  max-width: 420px;
}

.question-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.question-item {
  display: flex;
}

.question-label {
  display: inline-block;
  white-space: pre-wrap;
  line-height: 1.4;
}

.empty-state {
  color: #94a3b8;
  font-size: 0.875rem;
}
</style>
