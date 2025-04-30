<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, RefreshRight, Star, DocumentRemove } from '@element-plus/icons-vue'
import { DOCUMENT } from '../../shared/events'
import { useIpc } from '@/composables/useIpc'
const ipc =  useIpc()

import type { 
  IDocumentSummary,
  DocumentType,
  IDocumentFilterOptions 
} from '../../shared/types/document'

// 路由导航
const router = useRouter()

// 文档列表数据
const documents = ref<IDocumentSummary[]>([])
const loading = ref(false)
const searchQuery = ref('')

// 筛选选项
const filterOptions = ref<IDocumentFilterOptions>({
  status: undefined,
  type: undefined,
  favorite: undefined,
  query: '',
  sortBy: 'modifiedAt',
  sortOrder: 'desc'
})

// 获取文档列表
const fetchDocuments = async () => {
  try {
    loading.value = true
    filterOptions.value.query = searchQuery.value
    
    // 调用主进程获取文档列表
    const result = await ipc.invoke(DOCUMENT.LIST_DOCUMENTS, filterOptions.value)
    if (!Array.isArray(result)) {
      throw new Error('获取文档列表失败')
    }
    console.log('获取文档列表成功:', result)
    // 更新文档列表
    documents.value = result
  } catch (error:any) {
    ElMessage.error(`获取文档列表失败: ${error.message || '未知错误'}`)
    console.error('获取文档列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 打开文档
const openDocument = async (document: IDocumentSummary) => {
  try {
    // 添加到历史记录
    await window.ipcRenderer.invoke(DOCUMENT.ADD_HISTORY, document.id)
    
    // 导航到阅读器页面
    router.push(`/reader/${document.id}`)
  } catch (error:any) {
    ElMessage.error(`打开文档失败: ${error.message || '未知错误'}`)
    console.error('打开文档失败:', error)
  }
}

// 添加文档
const addDocument = async () => {
  try {
    // 调用文件选择对话框
    const result = await window.ipcRenderer.invoke(DOCUMENT.SELECT_FILE, {
      title: '选择要添加的文档',
      filters: [
        { name: 'Markdown 文件', extensions: ['md', 'markdown'] },
        { name: '文本文件', extensions: ['txt'] }
      ],
      properties: ['openFile', 'multiSelections']
    })
    
    if (result && Array.isArray(result) && result.length > 0) {
      // 创建文档 (主进程会处理文件读取和元数据提取)
      await window.ipcRenderer.invoke(DOCUMENT.CREATE_DOCUMENT, result)
      ElMessage.success(`成功添加 ${result.length} 个文档`)
      // 刷新文档列表
      fetchDocuments()
    }
  } catch (error:any) {
    ElMessage.error(`添加文档失败: ${error.message || '未知错误'}`)
    console.error('添加文档失败:', error)
  }
}

// 删除文档
const deleteDocument = async (document: IDocumentSummary, event?: Event) => {
  // 阻止事件冒泡，防止触发行点击事件
  if (event) {
    event.stopPropagation()
  }
  
  try {
    // 弹出确认对话框
    await ElMessageBox.confirm(
      `确定要删除文档 "${document.title}" 吗？`,
      '删除确认',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 调用主进程删除文档
    await window.ipcRenderer.invoke(DOCUMENT.DELETE_DOCUMENT, document.id)
    ElMessage.success('文档已删除')
    // 刷新文档列表
    fetchDocuments()
  } catch (error:any) {
    if (error !== 'cancel') {
      ElMessage.error(`删除文档失败: ${error.message || '未知错误'}`)
      console.error('删除文档失败:', error)
    }
  }
}

// 切换收藏状态
const toggleFavorite = async (document: IDocumentSummary, event?: Event) => {
  // 阻止事件冒泡，防止触发行点击事件
  if (event) {
    event.stopPropagation()
  }
  
  try {
    if (document.isFavorite) {
      await window.ipcRenderer.invoke(DOCUMENT.REMOVE_FAVORITE, document.id)
      ElMessage.success('已从收藏夹中移除')
    } else {
      await window.ipcRenderer.invoke(DOCUMENT.ADD_FAVORITE, document.id)
      ElMessage.success('已添加到收藏夹')
    }
    
    // 更新文档的收藏状态
    document.isFavorite = !document.isFavorite
  } catch (error:any) {
    ElMessage.error(`操作失败: ${error.message || '未知错误'}`)
    console.error('切换收藏状态失败:', error)
  }
}

// 格式化文档类型
const formatDocumentType = (type: DocumentType) => {
  const typeMap = {
    'markdown': 'Markdown',
    'text': '纯文本'
  }
  return typeMap[type] || '未知'
}

// 格式化文件大小
const formatFileSize = (size: number) => {
  if (size < 1024) {
    return `${size} B`
  } else if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(2)} KB`
  } else {
    return `${(size / (1024 * 1024)).toFixed(2)} MB`
  }
}

// 格式化日期时间
const formatDateTime = (dateTime: Date | string) => {
  if (!dateTime) return '未知'
  
  const date = dateTime instanceof Date ? dateTime : new Date(dateTime)
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

// 计算标签列表
const tagsList = computed(() => {
  // 从所有文档中提取并去重标签
  const tags = new Set<string>()
  documents.value.forEach(doc => {
    doc.tags?.forEach(tag => tags.add(tag))
  })
  return Array.from(tags)
})

// 初始加载
onMounted(async () => {
  await fetchDocuments()
})
</script>

<template>
  <div class="documents-view">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-2xl font-bold">文档列表</h2>
      
      <div class="flex space-x-2">
        <el-tooltip content="刷新列表" placement="top">
          <el-button :icon="RefreshRight" circle @click="fetchDocuments" />
        </el-tooltip>
        
        <el-button type="primary" @click="addDocument">
          <el-icon class="mr-1"><Plus /></el-icon>
          添加文档
        </el-button>
      </div>
    </div>
    
    <el-card class="mb-4">
      <!-- 搜索和过滤区 -->
      <div class="flex flex-wrap gap-4 mb-4">
        <el-input
          v-model="searchQuery"
          placeholder="搜索文档..."
          class="w-64"
          clearable
          @keyup.enter="fetchDocuments"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
          <template #append>
            <el-button @click="fetchDocuments">搜索</el-button>
          </template>
        </el-input>
        
        <el-select 
          v-model="filterOptions.sortBy" 
          placeholder="排序方式"
          class="w-36"
          @change="fetchDocuments"
        >
          <el-option label="标题" value="title" />
          <el-option label="创建时间" value="createdAt" />
          <el-option label="修改时间" value="modifiedAt" />
          <el-option label="访问时间" value="accessedAt" />
        </el-select>
        
        <el-select 
          v-model="filterOptions.sortOrder" 
          placeholder="排序方向"
          class="w-28"
          @change="fetchDocuments"
        >
          <el-option label="升序" value="asc" />
          <el-option label="降序" value="desc" />
        </el-select>
        
        <el-select 
          v-if="tagsList.length > 0"
          v-model="filterOptions.tags" 
          placeholder="按标签筛选"
          multiple
          collapse-tags
          collapse-tags-tooltip
          class="w-48"
          clearable
          @change="fetchDocuments"
        >
          <el-option 
            v-for="tag in tagsList" 
            :key="tag" 
            :label="tag" 
            :value="tag" 
          />
        </el-select>
        
        <el-checkbox
          v-model="filterOptions.favorite"
          label="仅显示收藏"
          @change="fetchDocuments"
        />
      </div>
    
      <!-- 文档表格 -->
      <el-table
        v-loading="loading"
        :data="documents"
        style="width: 100%"
        @row-click="openDocument"
        row-key="id"
        empty-text="暂无文档"
      >
        <el-table-column prop="title" label="文档名" min-width="200">
          <template #default="{ row }">
            <div class="flex items-center">
              <el-icon class="mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
                  <path fill-rule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625zM7.5 15a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 017.5 15zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H8.25z" clip-rule="evenodd" />
                  <path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 013.434 1.279 9.768 9.768 0 00-6.963-6.963z" />
                </svg>
              </el-icon>
              <span>{{ row.title }}</span>
              <el-tag v-if="row.isFavorite" size="small" type="warning" class="ml-2">收藏</el-tag>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="path" label="路径" min-width="250" />
        
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ formatDocumentType(row.type) }}</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="size" label="大小" width="100">
          <template #default="{ row }">
            {{ formatFileSize(row.size) }}
          </template>
        </el-table-column>
        
        <el-table-column prop="modifiedAt" label="修改时间" width="150">
          <template #default="{ row }">
            {{ formatDateTime(row.modifiedAt) }}
          </template>
        </el-table-column>
        
        <el-table-column prop="tags" label="标签" width="150">
          <template #default="{ row }">
            <div class="flex flex-wrap gap-1">
              <el-tag 
                v-for="tag in row.tags" 
                :key="tag" 
                size="small"
                type="info"
              >
                {{ tag }}
              </el-tag>
              <span v-if="!row.tags?.length" class="text-gray-400">无</span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <div class="flex space-x-1">
              <el-button 
                size="small" 
                :type="row.isFavorite ? 'warning' : 'default'"
                circle
                @click="(e:Event) => toggleFavorite(row, e)"
              >
                <el-icon><star /></el-icon>
              </el-button>
              
              <el-button 
                size="small" 
                type="danger" 
                circle
                @click="(e:Event) => deleteDocument(row, e)"
              >
                <el-icon><document-remove /></el-icon>
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<style scoped>
.documents-view {
  padding: 16px;
}

/* 增强表格行的可点击感觉 */
:deep(.el-table__row) {
  cursor: pointer;
}

:deep(.el-table__row:hover) {
  background-color: #f5f7fa;
}
</style>