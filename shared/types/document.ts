/**
 * Markdown 文档类型定义
 */

/**
 * 文档状态枚举
 */
export enum DocumentStatus {
  NORMAL = 'normal',   // 正常
  ARCHIVED = 'archived', // 已归档
  DELETED = 'deleted'  // 已删除
}

/**
 * 文档类型枚举
 */
export enum DocumentType {
  MARKDOWN = 'markdown',  // Markdown 文档
  TEXT = 'text'           // 纯文本文档
}

/**
 * 基础文档接口
 */
export interface IBaseDocument {
  id: number | string;    // 文档ID
  title: string;          // 文档标题
  path: string;           // 文档路径
  type: DocumentType;     // 文档类型
  status: DocumentStatus; // 文档状态
}

/**
 * 文档元数据接口
 */
export interface IDocumentMeta {
  size: number;           // 文件大小 (bytes)
  createdAt: Date | string; // 创建时间
  modifiedAt: Date | string; // 修改时间
  accessedAt: Date | string; // 访问时间
}

/**
 * 完整文档接口 (包含内容和元数据)
 */
export interface IDocument extends IBaseDocument, IDocumentMeta {
  content?: string;       // 文档内容 (可选，按需加载)
  isFavorite: boolean;    // 是否已收藏
  tags: string[];         // 标签列表
}

/**
 * 文档摘要信息 (不包含内容)
 */
export interface IDocumentSummary extends IBaseDocument, IDocumentMeta {
  isFavorite: boolean;    // 是否已收藏
  tags: string[];         // 标签列表
  summary?: string;       // 内容摘要 (可选)
}

/**
 * 文档历史记录项
 */
export interface IDocumentHistory {
  id: number | string;    // 历史记录ID
  documentId: number | string; // 对应的文档ID
  accessTime: Date | string; // 访问时间
}

/**
 * 文档收藏项
 */
export interface IDocumentFavorite {
  id: number | string;    // 收藏记录ID
  documentId: number | string; // 对应的文档ID
  addedTime: Date | string; // 添加时间
}

/**
 * 文档筛选选项
 */
export interface IDocumentFilterOptions {
  status?: DocumentStatus;  // 按状态筛选
  type?: DocumentType;      // 按类型筛选
  tags?: string[];          // 按标签筛选
  favorite?: boolean;       // 是否只看收藏
  query?: string;           // 搜索关键词
  sortBy?: 'title' | 'createdAt' | 'modifiedAt' | 'accessedAt'; // 排序字段
  sortOrder?: 'asc' | 'desc'; // 排序方向
}