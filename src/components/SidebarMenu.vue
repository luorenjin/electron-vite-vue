<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Document, Files, Star, Setting, Fold, Expand } from '@element-plus/icons-vue'
import { ElButton } from 'element-plus'

// 接收父组件传递的折叠状态和切换方法
defineProps<{
  isCollapse: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle-collapse'): void
}>()

const router = useRouter()
const route = useRoute()

// 菜单项配置
const menuItems = [
  { 
    path: '/documents', 
    title: '文档列表', 
    icon: Document 
  },
  { 
    path: '/recent', 
    title: '最近打开', 
    icon: Files 
  },
  { 
    path: '/favorites', 
    title: '收藏夹', 
    icon: Star 
  },
  { 
    path: '/settings', 
    title: '设置', 
    icon: Setting 
  }
]

// 当前活跃的菜单项
const activeMenu = computed(() => {
  // 根据当前路由路径确定活跃菜单
  const path = route.path
  if (path === '/') return '/documents'
  
  const matchedItem = menuItems.find(item => path.startsWith(item.path))
  return matchedItem?.path || '/documents'
})

// 处理菜单项点击
const handleMenuSelect = (path: string) => {
  router.push(path)
}

// 切换菜单折叠状态
const toggleCollapse = () => {
  emit('toggle-collapse')
}
</script>

<template>
  <div class="sidebar-container h-full flex flex-col">
    <!-- 菜单折叠切换按钮 -->
    <div class="toggle-btn p-2 flex justify-end">
      <el-button
        @click="toggleCollapse"
        class="toggle-collapse-btn"
      >
        <el-icon>
          <component :is="isCollapse ? Expand : Fold" />
        </el-icon>
      </el-button>
    </div>
    
    <!-- 菜单内容 -->
    <el-menu
      :default-active="activeMenu"
      class="border-r-0 flex-1"
      :collapse="isCollapse"
      background-color="#f0f2f5"
      text-color="#303133"
      active-text-color="#409EFF"
      router
      @select="handleMenuSelect"
    >
      <el-menu-item v-for="item in menuItems" :key="item.path" :index="item.path">
        <el-icon>
          <component :is="item.icon" />
        </el-icon>
        <span>{{ item.title }}</span>
      </el-menu-item>
    </el-menu>
  </div>
</template>

<style scoped>
.sidebar-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.toggle-collapse-btn {
  padding: 8px;
  border-radius: 4px;
}

.el-menu:not(.el-menu--collapse) {
  width: 200px;
}
</style>
