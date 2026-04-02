<script setup lang="ts">
import UserLocationSection from '@/components/business/UserLocationSection.vue'
import AgentChatPanel from '@/components/business/AgentChatPanel.vue'
</script>

<template>
  <div class="user-home">
    <div class="two-col">
      <div class="col">
        <UserLocationSection />
      </div>
      <div class="col">
        <AgentChatPanel class="right-card" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.user-home {
  padding: 1.5rem;
}

.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  align-items: stretch;
}

.col {
  min-width: 0;
}

.right-card {
  height: 600px;
}

@media (max-width: 900px) {
  .two-col {
    grid-template-columns: 1fr;
  }
}
</style>
