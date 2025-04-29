import process from 'node:process'
import os from 'node:os'
import { promises as fsPromises } from 'node:fs'
import path from 'node:path'

/**
 * 获取当前设备的CPU、内存、磁盘信息
 * @returns {Promise<{ cpu: string; memory: string; disk: string }>} CPU、内存、磁盘信息
 */
export async function getSystemInfo() {
  const cpu = process.arch
  const memory = `${Math.round(process.getSystemMemoryInfo().total / 1024 / 1024)} GB`
  
  // 获取根目录的磁盘信息
  let disk = 'Unknown'
  try {
    const rootPath = os.platform() === 'win32' ? process.cwd().split(path.sep)[0] + '\\' : '/'
    const stats = await fsPromises.statfs(rootPath)
    const totalGB = Math.round(stats.bsize * stats.blocks / 1024 / 1024 / 1024)
    disk = `${totalGB} GB`
  } catch (error) {
    console.error('获取磁盘信息失败:', error)
    disk = '获取失败'
  }

  return { cpu, memory, disk }
}