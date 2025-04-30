import { ipcMain, dialog, BrowserWindow } from 'electron'
import { DOCUMENT } from '../../../shared/events'
import * as fs from 'fs/promises'
import * as path from 'path'
import { 
  IDocument, 
  IDocumentSummary, 
  IDocumentHistory, 
  IDocumentFavorite, 
  DocumentType, 
  DocumentStatus,
  IDocumentFilterOptions
} from '../../../shared/types/document'

// 模拟数据存储
const documentsStore: Map<string|number, IDocument> = new Map()
const favoritesStore: IDocumentFavorite[] = []
const historyStore: IDocumentHistory[] = []

// 生成唯一ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}

/**
 * 初始化文档服务
 */
export function initDocumentService() {
  // 获取单个文档
  ipcMain.handle(DOCUMENT.GET_DOCUMENT, async (_, id: string|number) => {
    const document = documentsStore.get(id)
    if (!document) {
      throw new Error(`Document with id ${id} not found`)
    }
    return document
  })

  // 获取文档列表
  ipcMain.handle(DOCUMENT.LIST_DOCUMENTS, async (_, filterOptions?: IDocumentFilterOptions) => {
    let documents = Array.from(documentsStore.values())
    
    // 应用过滤条件
    if (filterOptions) {
      if (filterOptions.status) {
        documents = documents.filter(doc => doc.status === filterOptions.status)
      }
      if (filterOptions.type) {
        documents = documents.filter(doc => doc.type === filterOptions.type)
      }
      if (filterOptions.favorite) {
        documents = documents.filter(doc => doc.isFavorite)
      }
      if (filterOptions.tags && filterOptions.tags.length > 0) {
        documents = documents.filter(doc => 
          filterOptions.tags!.some(tag => doc.tags.includes(tag))
        )
      }
      if (filterOptions.query) {
        const query = filterOptions.query.toLowerCase()
        documents = documents.filter(doc => 
          doc.title.toLowerCase().includes(query) || 
          (doc.content && doc.content.toLowerCase().includes(query))
        )
      }
      
      // 排序
      if (filterOptions.sortBy) {
        const sortField = filterOptions.sortBy
        const sortOrder = filterOptions.sortOrder || 'asc'
        documents.sort((a, b) => {
          // @ts-ignore - 处理动态字段访问
          const valueA = a[sortField]
          // @ts-ignore - 处理动态字段访问
          const valueB = b[sortField]
          
          if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1
          if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1
          return 0
        })
      }
    }
    
    // 转换为摘要信息，不包括内容
    return documents.map(doc => {
      const { content, ...summary } = doc
      return summary as IDocumentSummary
    })
  })

  // 创建新文档
  ipcMain.handle(DOCUMENT.CREATE_DOCUMENT, async (_, documentData: Partial<IDocument>) => {
    const id = generateId()
    const now = new Date().toISOString()
    
    const newDocument: IDocument = {
      id,
      title: documentData.title || 'Untitled Document',
      path: documentData.path || '',
      type: documentData.type || DocumentType.MARKDOWN,
      status: DocumentStatus.NORMAL,
      size: 0,
      createdAt: now,
      modifiedAt: now,
      accessedAt: now,
      isFavorite: false,
      tags: documentData.tags || [],
      content: documentData.content || ''
    }
    
    documentsStore.set(id, newDocument)
    return newDocument
  })

  // 更新文档
  ipcMain.handle(DOCUMENT.UPDATE_DOCUMENT, async (_, id: string|number, updates: Partial<IDocument>) => {
    const document = documentsStore.get(id)
    if (!document) {
      throw new Error(`Document with id ${id} not found`)
    }
    
    const updatedDocument = {
      ...document,
      ...updates,
      modifiedAt: new Date().toISOString()
    }
    
    documentsStore.set(id, updatedDocument)
    return updatedDocument
  })

  // 删除文档
  ipcMain.handle(DOCUMENT.DELETE_DOCUMENT, async (_, id: string|number) => {
    const document = documentsStore.get(id)
    if (!document) {
      throw new Error(`Document with id ${id} not found`)
    }
    
    // 软删除 - 将状态标记为已删除
    document.status = DocumentStatus.DELETED
    documentsStore.set(id, document)
    
    // 返回删除操作是否成功
    return true
  })

  // 读取文件内容
  ipcMain.handle(DOCUMENT.READ_FILE, async (_, filePath: string) => {
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      const stats = await fs.stat(filePath)
      
      // 创建或更新文档记录
      const fileName = path.basename(filePath)
      const fileExt = path.extname(filePath).toLowerCase()
      
      const type = fileExt === '.md' ? DocumentType.MARKDOWN : DocumentType.TEXT
      
      // 查找是否已有相同路径的文档
      let existingDoc: IDocument | undefined
      const documents = Array.from(documentsStore.values())
      for (const doc of documents) {
        if (doc.path === filePath) {
          existingDoc = doc
          break
        }
      }
      
      const now = new Date().toISOString()
      
      if (existingDoc) {
        // 更新现有文档
        existingDoc.content = content
        existingDoc.size = stats.size
        existingDoc.accessedAt = now
        existingDoc.modifiedAt = stats.mtime.toISOString()
        
        // 添加到历史记录
        addToHistory(existingDoc.id)
        
        return existingDoc
      } else {
        // 创建新文档记录
        const newDocument: IDocument = {
          id: generateId(),
          title: fileName,
          path: filePath,
          type,
          status: DocumentStatus.NORMAL,
          size: stats.size,
          createdAt: stats.birthtime.toISOString(),
          modifiedAt: stats.mtime.toISOString(),
          accessedAt: now,
          content,
          isFavorite: false,
          tags: []
        }
        
        documentsStore.set(newDocument.id, newDocument)
        
        // 添加到历史记录
        addToHistory(newDocument.id)
        
        return newDocument
      }
    } catch (error) {
      console.error('Error reading file:', error)
      throw new Error(`Failed to read file: ${error.message}`)
    }
  })

  // 保存文件内容
  ipcMain.handle(DOCUMENT.SAVE_FILE, async (_, id: string|number, content: string) => {
    const document = documentsStore.get(id)
    if (!document) {
      throw new Error(`Document with id ${id} not found`)
    }
    
    try {
      await fs.writeFile(document.path, content, 'utf-8')
      
      // 更新文档信息
      const stats = await fs.stat(document.path)
      document.content = content
      document.size = stats.size
      document.modifiedAt = new Date().toISOString()
      
      documentsStore.set(id, document)
      return true
    } catch (error) {
      console.error('Error saving file:', error)
      throw new Error(`Failed to save file: ${error.message}`)
    }
  })

  // 获取文件元数据
  ipcMain.handle(DOCUMENT.GET_FILE_META, async (_, filePath: string) => {
    try {
      const stats = await fs.stat(filePath)
      
      return {
        size: stats.size,
        createdAt: stats.birthtime.toISOString(),
        modifiedAt: stats.mtime.toISOString(),
        accessedAt: stats.atime.toISOString()
      }
    } catch (error) {
      console.error('Error getting file metadata:', error)
      throw new Error(`Failed to get file metadata: ${error.message}`)
    }
  })

  // 添加到收藏夹
  ipcMain.handle(DOCUMENT.ADD_FAVORITE, async (_, id: string|number) => {
    const document = documentsStore.get(id)
    if (!document) {
      throw new Error(`Document with id ${id} not found`)
    }
    
    // 检查是否已收藏
    if (document.isFavorite) {
      return document
    }
    
    // 更新文档收藏状态
    document.isFavorite = true
    documentsStore.set(id, document)
    
    // 添加到收藏夹
    const favorite: IDocumentFavorite = {
      id: generateId(),
      documentId: id,
      addedTime: new Date().toISOString()
    }
    
    favoritesStore.push(favorite)
    return document
  })

  // 从收藏夹移除
  ipcMain.handle(DOCUMENT.REMOVE_FAVORITE, async (_, id: string|number) => {
    const document = documentsStore.get(id)
    if (!document) {
      throw new Error(`Document with id ${id} not found`)
    }
    
    // 更新文档收藏状态
    document.isFavorite = false
    documentsStore.set(id, document)
    
    // 从收藏夹移除
    const index = favoritesStore.findIndex(fav => fav.documentId === id)
    if (index !== -1) {
      favoritesStore.splice(index, 1)
    }
    
    return document
  })

  // 获取收藏夹列表
  ipcMain.handle(DOCUMENT.LIST_FAVORITES, async () => {
    // 获取所有收藏的文档
    return favoritesStore.map(fav => {
      const doc = documentsStore.get(fav.documentId)
      if (!doc) return null
      
      // 移除内容字段，转换为摘要信息
      const { content, ...summary } = doc
      return {
        ...summary as IDocumentSummary,
        favoriteId: fav.id,
        addedTime: fav.addedTime
      }
    }).filter(Boolean) // 过滤掉空项
  })

  // 添加历史记录
  function addToHistory(documentId: string|number) {
    const now = new Date().toISOString()
    
    // 检查是否已有相同文档的历史记录
    const existingIndex = historyStore.findIndex(item => item.documentId === documentId)
    if (existingIndex !== -1) {
      // 更新已有历史记录的访问时间
      historyStore[existingIndex].accessTime = now
    } else {
      // 添加新的历史记录
      const historyItem: IDocumentHistory = {
        id: generateId(),
        documentId,
        accessTime: now
      }
      historyStore.push(historyItem)
    }
    
    // 限制历史记录数量
    while (historyStore.length > 100) {
      historyStore.shift() // 移除最旧的记录
    }
  }
  
  // 添加到历史记录
  ipcMain.handle(DOCUMENT.ADD_HISTORY, async (_, id: string|number) => {
    const document = documentsStore.get(id)
    if (!document) {
      throw new Error(`Document with id ${id} not found`)
    }
    
    // 更新文档访问时间
    document.accessedAt = new Date().toISOString()
    documentsStore.set(id, document)
    
    addToHistory(id)
    return true
  })

  // 获取历史记录
  ipcMain.handle(DOCUMENT.LIST_HISTORY, async () => {
    // 按访问时间倒序排序
    const sortedHistory = [...historyStore].sort((a, b) => {
      return new Date(b.accessTime).getTime() - new Date(a.accessTime).getTime()
    })
    
    // 获取历史记录对应的文档
    return sortedHistory.map(histItem => {
      const doc = documentsStore.get(histItem.documentId)
      if (!doc) return null
      
      // 移除内容字段，转换为摘要信息
      const { content, ...summary } = doc
      return {
        ...summary as IDocumentSummary,
        historyId: histItem.id,
        accessTime: histItem.accessTime
      }
    }).filter(Boolean) // 过滤掉空项
  })

  // 清除历史记录
  ipcMain.handle(DOCUMENT.CLEAR_HISTORY, async () => {
    historyStore.length = 0
    return true
  })

  // 选择文件
  ipcMain.handle(DOCUMENT.SELECT_FILE, async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (!window) {
      throw new Error('无法获取当前窗口')
    }
    
    const result = await dialog.showOpenDialog(window, {
      properties: ['openFile'],
      filters: [
        { name: 'Markdown', extensions: ['md', 'markdown'] },
        { name: 'Text', extensions: ['txt'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })
    
    if (result.canceled || result.filePaths.length === 0) {
      return null
    }
    
    const filePath = result.filePaths[0]
    
    // 自动读取选中的文件并添加到文档列表
    return await fs.readFile(filePath, 'utf-8').then(async (content) => {
      const stats = await fs.stat(filePath)
      
      // 创建或更新文档记录
      const fileName = path.basename(filePath)
      const fileExt = path.extname(filePath).toLowerCase()
      
      const type = fileExt === '.md' ? DocumentType.MARKDOWN : DocumentType.TEXT
      
      // 查找是否已有相同路径的文档
      let existingDoc: IDocument | undefined
      const documents = Array.from(documentsStore.values())
      for (const doc of documents) {
        if (doc.path === filePath) {
          existingDoc = doc
          break
        }
      }
      
      const now = new Date().toISOString()
      
      if (existingDoc) {
        // 更新现有文档
        existingDoc.content = content
        existingDoc.size = stats.size
        existingDoc.accessedAt = now
        existingDoc.modifiedAt = stats.mtime.toISOString()
        
        // 添加到历史记录
        addToHistory(existingDoc.id)
        
        return existingDoc
      } else {
        // 创建新文档记录
        const newDocument: IDocument = {
          id: generateId(),
          title: fileName,
          path: filePath,
          type,
          status: DocumentStatus.NORMAL,
          size: stats.size,
          createdAt: stats.birthtime.toISOString(),
          modifiedAt: stats.mtime.toISOString(),
          accessedAt: now,
          content,
          isFavorite: false,
          tags: []
        }
        
        documentsStore.set(newDocument.id, newDocument)
        
        // 添加到历史记录
        addToHistory(newDocument.id)
        
        return newDocument
      }
    }).catch(error => {
      console.error('Error reading file:', error)
      throw new Error(`Failed to read file: ${error.message}`)
    })
  })

  // 选择文件夹
  ipcMain.handle(DOCUMENT.SELECT_FOLDER, async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (!window) {
      throw new Error('无法获取当前窗口')
    }
    
    const result = await dialog.showOpenDialog(window, {
      properties: ['openDirectory']
    })
    
    if (result.canceled || result.filePaths.length === 0) {
      return null
    }
    
    return result.filePaths[0]
  })
}