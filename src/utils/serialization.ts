/**
 * 序列化辅助工具
 */

/**
 * 深度处理对象，确保所有属性都可被序列化
 * @param obj 待处理的对象
 * @returns 可被序列化的对象副本
 */
export function makeSerializable<T>(obj: T): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // 处理基本类型
  if (typeof obj !== 'object' && typeof obj !== 'function') {
    return obj;
  }

  // 处理数组
  if (Array.isArray(obj)) {
    return obj.map(item => makeSerializable(item));
  }

  // 处理日期
  if (obj instanceof Date) {
    return obj.toISOString();
  }

  // 处理Map、Set等特殊对象
  if (obj instanceof Map) {
    return { _type: 'Map', values: Array.from(obj.entries()).map(([k, v]) => [makeSerializable(k), makeSerializable(v)]) };
  }
  
  if (obj instanceof Set) {
    return { _type: 'Set', values: Array.from(obj).map(v => makeSerializable(v)) };
  }

  // 处理普通对象
  if (typeof obj === 'object') {
    const result: Record<string, any> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        // 跳过值为 undefined 的属性
        if ((obj as any)[key] === undefined) continue;
        
        try {
          result[key] = makeSerializable((obj as any)[key]);
        } catch (e: any) {
          result[key] = `[不可序列化: ${e.message}]`;
        }
      }
    }
    return result;
  }

  // 处理函数等无法序列化的内容
  return `[不可序列化的 ${typeof obj}]`;
}

/**
 * 清除对象中的 undefined 值
 * @param obj 要清理的对象
 * @returns 清理后的对象副本
 */
export function removeUndefined<T>(obj: T): T {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return obj;
  }
  
  const result = { ...obj } as any;
  
  Object.keys(result).forEach(key => {
    if (result[key] === undefined) {
      delete result[key];
    } else if (typeof result[key] === 'object' && result[key] !== null) {
      result[key] = removeUndefined(result[key]);
    }
  });
  
  return result as T;
}

/**
 * 在IPC调用前处理参数
 * 确保参数可序列化并且移除所有 undefined 值
 */
export function prepareIpcArgs(args: any[]): any[] {
  return args.map(arg => {
    // 先移除 undefined 值，再确保可序列化
    const cleanArg = typeof arg === 'object' && arg !== null ? removeUndefined(arg) : arg;
    return makeSerializable(cleanArg);
  });
}
