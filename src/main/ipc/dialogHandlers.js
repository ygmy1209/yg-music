/**
 * 系统对话框相关 IPC 处理器
 * 对应 preload 暴露的 dialogAPI
 */

import { ipcMain, dialog } from 'electron'

/**
 * 注册对话框相关 IPC 处理器
 */
export const registerDialogHandlers = () => {
  // 选择音乐文件
  ipcMain.handle('dialog:selectMusicFiles', async () => {
    const result = await dialog.showOpenDialog({
      title: '选择音乐文件',
      filters: [
        { name: '音频文件', extensions: ['mp3', 'flac', 'wav', 'aac', 'ogg', 'wma', 'm4a', 'ape'] },
        { name: '视频文件', extensions: ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm'] },
        { name: '所有文件', extensions: ['*'] }
      ],
      properties: ['openFile', 'multiSelections']
    })
    return result.filePaths
  })

  // 选择音乐文件夹
  ipcMain.handle('dialog:selectMusicFolder', async () => {
    const result = await dialog.showOpenDialog({
      title: '选择音乐文件夹',
      properties: ['openDirectory']
    })
    return result.filePaths[0] || null
  })
}
