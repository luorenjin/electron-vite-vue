export const SYSTEM = {
    SYSTEM_INFO: 'system-info',
    ECHO: 'echo',
    OPEN_WIN: 'open-win',
}

/**
 * 文档操作相关事件
 */
export const DOCUMENT = {
    // 文档基础操作
    GET_DOCUMENT: 'document-get',            // 获取单个文档
    LIST_DOCUMENTS: 'document-list',         // 获取文档列表
    CREATE_DOCUMENT: 'document-create',      // 创建新文档
    UPDATE_DOCUMENT: 'document-update',      // 更新文档内容
    DELETE_DOCUMENT: 'document-delete',      // 删除文档
    
    // 文档内容操作
    READ_FILE: 'document-read-file',         // 读取文件内容
    SAVE_FILE: 'document-save-file',         // 保存文件内容
    
    // 文档元数据操作
    GET_FILE_META: 'document-get-meta',      // 获取文件元数据
    
    // 收藏夹操作
    ADD_FAVORITE: 'document-add-favorite',   // 添加到收藏夹
    REMOVE_FAVORITE: 'document-remove-favorite', // 从收藏夹移除
    LIST_FAVORITES: 'document-list-favorites', // 获取收藏夹列表
    
    // 历史记录操作
    ADD_HISTORY: 'document-add-history',     // 添加历史记录
    LIST_HISTORY: 'document-list-history',   // 获取历史记录
    CLEAR_HISTORY: 'document-clear-history', // 清除历史记录
    
    // 文件系统操作
    SELECT_FILE: 'document-select-file',     // 选择文件
    SELECT_FOLDER: 'document-select-folder', // 选择文件夹
}