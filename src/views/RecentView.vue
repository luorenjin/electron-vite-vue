<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElButton, ElCard, ElTimeline, ElTimelineItem, ElEmpty } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'

const router = useRouter()
const recentDocuments = ref([
  { id: 1, title: '入门指南.md', path: 'D:/Documents/guide.md', lastOpened: '2025-04-30 14:25' },
  { id: 3, title: '项目笔记.md', path: 'D:/Documents/notes.md', lastOpened: '2025-04-29 16:40' },
  { id: 2, title: 'API文档.md', path: 'D:/Documents/api.md', lastOpened: '2025-04-28 09:15' }
])

const openDocument = (docId: number) => {
  router.push(`/reader/${docId}`)
}

const clearHistory = () => {
  if (confirm('确定要清除历史记录吗？')) {
    recentDocuments.value = []
  }
}
</script>

<template>
  <div class="recent-view">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-2xl font-bold">最近打开</h2>
      <el-button type="danger" @click="clearHistory" :disabled="recentDocuments.length === 0">
        <el-icon class="mr-1"><delete /></el-icon>
        清除历史
      </el-button>
    </div>

    <el-card v-if="recentDocuments.length > 0" class="mb-4">
      <el-timeline>
        <el-timeline-item
          v-for="doc in recentDocuments"
          :key="doc.id"
          :timestamp="doc.lastOpened"
          placement="top"
        >
          <el-card class="cursor-pointer" @click="openDocument(doc.id)">
            <h4>{{ doc.title }}</h4>
            <p class="text-gray-500 text-sm">{{ doc.path }}</p>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </el-card>

    <el-empty v-else description="暂无最近打开的文档" />
  </div>
</template>

<style scoped>
.recent-view {
  padding: 16px;
}
</style>