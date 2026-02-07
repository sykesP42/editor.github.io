<template>
  <div>
    <router-view />
    <DesktopPet />
  </div>
</template>

<script setup>
import DesktopPet from './components/DesktopPet.vue'
</script>

<style>
/* 全局样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}
</style>