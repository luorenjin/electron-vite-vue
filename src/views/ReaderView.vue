<template>
  <div class="reader-container">
    <div class="markdown-content p-4">
      <!-- Markdown 内容显示区域 -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const fileId = route.params.fileId as string
const content = ref('')

onMounted(async () => {
  // 这里可以通过 IPC 获取文件内容
  // 示例：content.value = await window.ipcRenderer.invoke('FILE.GET_CONTENT', fileId)
})
</script>