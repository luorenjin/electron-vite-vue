# MD-Reader 项目指南

## 项目概述

MD-Reader 是一个基于 Electron + Vue3 + Vite 构建的桌面应用，主要用于读取和显示 Markdown 文件。该项目使用了以下主要技术栈：

- Electron 作为桌面应用框架
- Vue 3 作为前端框架
- Vite 作为构建工具
- TypeScript 作为编程语言
- TailwindCSS 用于样式管理
- Element Plus 作为 UI 组件库

## 项目结构

项目采用标准 Electron + Vue 结构：

```
md-reader/
├── electron/              # Electron 相关代码
│   ├── main/              # 主进程代码
│   │   ├── service/       # 主进程服务
│   │   └── utils/         # 工具函数
│   └── preload/           # 预加载脚本
├── src/                   # 渲染进程代码（Vue 前端）
│   ├── components/        # Vue 组件
│   └── types/             # TypeScript 类型定义
├── shared/                # 主进程和渲染进程共享的代码
└── dist-electron/         # 构建输出目录
```

## 核心功能模块

### 1. 主进程 (Electron Main)

主进程负责应用的生命周期管理、窗口创建和系统API交互。主要文件：

- `electron/main/index.ts`: 主进程入口文件，负责创建窗口和处理应用生命周期
- `electron/main/service/system.ts`: 系统相关功能服务

### 2. 预加载脚本 (Preload)

- `electron/preload/index.ts`: 通过上下文桥接在渲染进程中安全地公开 Electron API

### 3. 渲染进程 (Renderer)

- `src/main.ts`: 渲染进程入口文件
- `src/App.vue`: 主应用组件

### 4. IPC 通信

主进程和渲染进程之间的通信通过 IPC (Inter-Process Communication) 实现：

- `shared/events.ts`: 定义了可用的 IPC 事件常量
- 渲染进程使用 `window.ipcRenderer` 发送请求
- 主进程使用 `ipcMain.handle` 处理请求

## 开发指南

### 添加新功能

1. **添加新的 IPC 事件**

   在 `shared/events.ts` 中添加新的事件常量：

   ```typescript
   export const MY_MODULE = {
     ACTION_NAME: 'action-name',
   }
   ```

2. **在主进程中处理事件**

   在 `electron/main/service` 目录下创建或修改服务文件：

   ```typescript
   import { ipcMain } from 'electron'
   import { MY_MODULE } from '../../../shared/events'

   ipcMain.handle(MY_MODULE.ACTION_NAME, async (event, params) => {
     // 处理逻辑
     return result
   })
   ```

3. **在渲染进程中调用**

   在 Vue 组件中：

   ```typescript
   import { MY_MODULE } from '../shared/events'

   const handleAction = async () => {
     const result = await window.ipcRenderer.invoke(MY_MODULE.ACTION_NAME, params)
     console.log(result)
   }
   ```

### 添加新窗口

使用 `SYSTEM.OPEN_WIN` 事件来创建新窗口：

```typescript
window.ipcRenderer.invoke(SYSTEM.OPEN_WIN, 'window-name')
```

或打开外部链接：

```typescript
window.ipcRenderer.invoke(SYSTEM.OPEN_WIN, 'https://example.com')
```

### 添加新组件

在 `src/components` 目录下创建新的 Vue 组件，然后在需要的地方导入使用。

## 构建与打包

### 开发环境

```bash
npm run dev
```

### 生产构建

```bash
npm run build
```

## 调试技巧

1. 使用 VSCode 调试配置（已在 `.vscode/launch.json` 中设置）
2. 使用 `Debug App` 组合调试主进程和渲染进程
3. 在开发模式下，渲染进程窗口会自动打开开发者工具

## 注意事项

1. 确保在使用第三方 Node.js 模块时，将其添加到 `dependencies` 而非 `devDependencies`
2. 使用 `contextBridge` 公开的 API 进行渲染进程和主进程之间的通信，避免在渲染进程中直接使用 Node.js API
3. 对于需要在渲染进程中使用 Node.js API 的场景，确保在主进程中通过 IPC 实现相应功能