<script setup lang="ts">
import { ref } from 'vue'
import MainLayout from './layouts/MainLayout.vue';
const size = ref('small')
</script>

<template>
  <el-config-provider :size="size" :z-index="3000">
    <MainLayout>
      <router-view/>
    </MainLayout>
  </el-config-provider>
</template>

<style scoped lang="scss"></style>
