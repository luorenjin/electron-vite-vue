import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'home',
    redirect: '/documents'  // 默认重定向到文档列表
  },
  {
    path: '/documents',
    name: 'documents',
    component: () => import('../views/DocumentsView.vue')  // 使用专门的文档列表视图
  },
  {
    path: '/recent',
    name: 'recent',
    component: () => import('../views/RecentView.vue')  // 使用专门的最近打开视图
  },
  {
    path: '/favorites',
    name: 'favorites',
    component: () => import('../views/FavoritesView.vue')  // 使用专门的收藏夹视图
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('../views/SettingsView.vue')
  },
  {
    path: '/reader/:fileId',
    name: 'reader',
    component: () => import('../views/ReaderView.vue'),
    props: true
  }
]

const router = createRouter({
  // 使用 hash 模式，适合 Electron 应用
  history: createWebHashHistory(),
  routes
})

export default router