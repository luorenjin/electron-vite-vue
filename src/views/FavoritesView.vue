<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElButton, ElCard, ElEmpty } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'

const router = useRouter()
const favoriteDocuments = ref([
  { id: 2, title: 'API文档.md', path: 'D:/Documents/api.md', dateAdded: '2025-04-25' },
  { id: 1, title: '入门指南.md', path: 'D:/Documents/guide.md', dateAdded: '2025-04-20' }
])

const openDocument = (docId: number) => {
  router.push(`/reader/${docId}`)
}

const removeFromFavorites = (docId: number) => {
  favoriteDocuments.value = favoriteDocuments.value.filter(doc => doc.id !== docId)
}
</script>

<template>
  <div class="favorites-view">
    <h2 class="text-2xl font-bold mb-4">收藏夹</h2>

    <div v-if="favoriteDocuments.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <el-card
        v-for="doc in favoriteDocuments"
        :key="doc.id"
        class="favorite-card"
        shadow="hover"
      >
        <div class="flex flex-col h-full">
          <div class="flex justify-between items-start">
            <h4 class="text-lg font-medium truncate">{{ doc.title }}</h4>
            <el-button 
              type="danger" 
              size="small" 
              circle 
              @click.stop="removeFromFavorites(doc.id)"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
          
          <p class="text-gray-500 text-sm mb-4 truncate">{{ doc.path }}</p>
          
          <p class="text-gray-400 text-xs mt-auto">
            添加日期：{{ doc.dateAdded }}
          </p>
          
          <el-button 
            type="primary" 
            class="w-full mt-4"
            @click="openDocument(doc.id)"
          >
            打开文档
          </el-button>
        </div>
      </el-card>
    </div>

    <el-empty v-else description="暂无收藏文档" />
  </div>
</template>

<style scoped>
.favorites-view {
  padding: 16px;
}

.favorite-card {
  height: 100%;
}
</style>