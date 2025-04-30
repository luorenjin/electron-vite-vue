import { inject } from 'vue'
import type { IpcRenderer } from 'electron'

/**
 * 检查对象是否可以被序列化
 */
function isSerializable(obj: any): boolean {
  if (obj === undefined || obj === null) return true;
  if (typeof obj === 'function') return false;
  if (typeof obj === 'symbol') return false;
  if (obj instanceof Map || obj instanceof Set || obj instanceof WeakMap || obj instanceof WeakSet) return false;
  if (obj instanceof Error || obj instanceof Promise || obj instanceof Date || obj instanceof RegExp) return true;
  
  if (typeof obj === 'object') {
    try {
      JSON.stringify(obj);
      return true;
    } catch (e) {
      return false;
    }
  }
  
  return true;
}

/**
 * 安全处理参数，确保可以被序列化
 */
function safeArgs(args: any[]): any[] {
  return args.map(arg => {
    if (!isSerializable(arg)) {
      console.warn('检测到不可序列化的对象，已转换为字符串描述:', arg);
      return `[不可序列化的 ${typeof arg}]`;
    }
    return arg;
  });
}

export function useIpc() {
  const ipcRenderer = inject<IpcRenderer>('ipcRenderer')
  
  if (!ipcRenderer) {
    throw new Error('找不到 ipcRenderer，请确保它已被正确提供')
  }
  
  return {
    invoke: <T = any>(channel: string, ...args: any[]): Promise<T> => {
      try {
        const safeParameters = safeArgs(args);
        console.log('IPC invoke 参数:', safeParameters);
        return ipcRenderer.invoke(channel, ...safeParameters);
      } catch (error) {
        console.error('IPC invoke 错误:', error);
        return Promise.reject(error);
      }
    },
    on: (channel: string, listener: (...args: any[]) => void) => {
      // 包装原始监听器，在接收数据时进行处理
      const wrappedListener = (event: Electron.IpcRendererEvent, ...args: any[]) => {
        listener(event, ...args);
      };
      
      ipcRenderer.on(channel, wrappedListener);
      return () => {
        ipcRenderer.removeListener(channel, wrappedListener);
      };
    },
    once: (channel: string, listener: (...args: any[]) => void) => {
      // 包装单次监听器
      const wrappedListener = (event: Electron.IpcRendererEvent, ...args: any[]) => {
        listener(event, ...args);
      };
      
      ipcRenderer.once(channel, wrappedListener);
    },
    send: (channel: string, ...args: any[]) => {
      try {
        const safeParameters = safeArgs(args);
        ipcRenderer.send(channel, ...safeParameters);
      } catch (error) {
        console.error('IPC send 错误:', error);
        throw error;
      }
    }
  }
}