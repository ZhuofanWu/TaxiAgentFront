<script setup lang="ts">
import { computed } from 'vue'
import { NPopover } from 'naive-ui'

const props = defineProps<{
  answer: string
}>()

const displayAnswer = computed(() => props.answer || '-')
</script>

<template>
  <NPopover trigger="hover" placement="bottom-start">
    <template #trigger>
      <div class="answer-cell">
        <span class="answer-text">{{ displayAnswer }}</span>
        <span class="answer-arrow">↓</span>
      </div>
    </template>
    <div class="answer-popover">{{ displayAnswer }}</div>
  </NPopover>
</template>

<style scoped>
.answer-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.answer-text {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.answer-arrow {
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

.answer-popover {
  max-width: 420px;
  white-space: pre-wrap;
  line-height: 1.5;
}
</style>
