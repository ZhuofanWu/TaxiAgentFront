<script setup lang="ts">
import { RouterView } from 'vue-router'
import { NMessageProvider, NDialogProvider } from 'naive-ui'
</script>

<template>
  <NMessageProvider>
    <NDialogProvider>
      <RouterView />
    </NDialogProvider>
  </NMessageProvider>
</template>

<style>
/* Global styles */
</style>
