import { SYSTEM } from '../../../shared/events'
import { ipcMain } from 'electron'
import { getSystemInfo } from '../utils/system'

ipcMain.handle(SYSTEM.SYSTEM_INFO, async (event) => {
  console.log('[Main-process] SYSTEM_INFO', event.sender.id)
  const systemInfo = await getSystemInfo()
  console.log('[Main-process] SYSTEM_INFO', systemInfo)
  return systemInfo
})

ipcMain.handle(SYSTEM.ECHO, async (event, params) => {
  console.log('[Main-process] ECHO', event.sender.id, params)
  return params
})