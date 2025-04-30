<script setup lang="ts">
import { ref } from 'vue';
import SidebarMenu from '../components/SidebarMenu.vue';

// 控制侧边栏折叠状态
const isCollapsed = ref(false);

// 切换侧边栏折叠状态
const toggleSidebarCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
};
</script>

<template>
  <div class="app-container h-screen flex">
    <!-- 侧边栏 -->
    <aside class="sidebar" :class="{ 'collapsed': isCollapsed }">
      <SidebarMenu :is-collapse="isCollapsed" @toggle-collapse="toggleSidebarCollapse" />
    </aside>

    <!-- 主内容区 -->
    <main class="content-area flex-1 p-4 bg-gray-50 overflow-auto">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.sidebar {
  width: 200px;
  transition: width 0.3s;
  background-color: #f0f2f5;
  border-right: 1px solid #e6e6e6;
}

.sidebar.collapsed {
  width: 64px;
}

.content-area {
  flex: 1;
  padding: 16px;
  overflow: auto;
}
</style>
