/**
 * 接受主进程的消息，主要用于全局加载，前端使用
 * @param _event 事件对象
 */

window.ipcRenderer.on('main-process-message', (_event, ...args) => {
  console.log('[Receive Main-process message]:', ...args)
})
