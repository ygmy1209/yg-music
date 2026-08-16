import { contextBridge, ipcRenderer } from 'electron'

// ========== 窗口控制 API ==========
const windowAPI = {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  fullscreen: () => ipcRenderer.send('window-fullscreen'),
  close: () => ipcRenderer.send('window-close')
}

// ========== 数据库 API ==========
const dbAPI = {
  getAllPlaylists: () => ipcRenderer.invoke('db:getAllPlaylists'),
  createPlaylist: (id, name) => ipcRenderer.invoke('db:createPlaylist', id, name),
  renamePlaylist: (id, newName) => ipcRenderer.invoke('db:renamePlaylist', id, newName),
  deletePlaylist: (id) => ipcRenderer.invoke('db:deletePlaylist', id),
  getSongsByPlaylist: (listId) => ipcRenderer.invoke('db:getSongsByPlaylist', listId),
  addSongToPlaylist: (songId, listId, songInfo, addLocation) =>
    ipcRenderer.invoke('db:addSongToPlaylist', songId, listId, songInfo, addLocation),
  removeSongFromPlaylist: (songId, listId, isDefault) =>
    ipcRenderer.invoke('db:removeSongFromPlaylist', songId, listId, isDefault),
  updateSongsOrder: (listId, songIds) => ipcRenderer.invoke('db:updateSongsOrder', listId, songIds),
  updateSongInfo: (songId, updates) => ipcRenderer.invoke('db:updateSongInfo', songId, updates),
  getAllAlbums: () => ipcRenderer.invoke('db:getAllAlbums'),
  getSongsByAlbum: (albumName) => ipcRenderer.invoke('db:getSongsByAlbum', albumName),
  getAllSingers: () => ipcRenderer.invoke('db:getAllSingers'),
  getSongsBySinger: (singerName) => ipcRenderer.invoke('db:getSongsBySinger', singerName)
}

// ========== 对话框 API ==========
const dialogAPI = {
  selectMusicFiles: () => ipcRenderer.invoke('dialog:selectMusicFiles'),
  selectMusicFolder: () => ipcRenderer.invoke('dialog:selectMusicFolder')
}

// ========== 音乐元数据 API ==========
const musicAPI = {
  parseMetadata: (filePath) => ipcRenderer.invoke('music:parseMetadata', filePath),
  parseMetadataBatch: (filePaths) => ipcRenderer.invoke('music:parseMetadataBatch', filePaths),
  scanFolder: (folderPath) => ipcRenderer.invoke('music:scanFolder', folderPath),
  getDetailedInfo: (filePath) => ipcRenderer.invoke('music:getDetailedInfo', filePath),
  getCover: (filePath) => ipcRenderer.invoke('music:getCover', filePath)
}

// ========== 文件 API ==========
const fileAPI = {
  showInFolder: (filePath) => ipcRenderer.invoke('file:showInFolder', filePath),
  readTextFile: (filePath) => ipcRenderer.invoke('file:read-text', filePath),
  readAudioFile: (filePath) => ipcRenderer.invoke('file:read-audio', filePath)
}

// ========== 播放信息 API ==========
const playInfoAPI = {
  get: () => ipcRenderer.invoke('playInfo:get'),
  save: (info) => ipcRenderer.invoke('playInfo:save', info)
}

// ========== 字体 API ==========
const fontAPI = {
  getSystemFonts: () => ipcRenderer.invoke('font:getList')
}

// ========== 快捷键 API ==========
const hotKeyAPI = {
  getAll: () => ipcRenderer.invoke('hotKey:getAll'),
  update: (config) => ipcRenderer.invoke('hotKey:update', config)
}

// ========== 设置 API ==========
const settingAPI = {
  getAll: () => ipcRenderer.invoke('setting:getAll'),
  get: (key) => ipcRenderer.invoke('setting:get', key),
  update: (newSetting) => ipcRenderer.invoke('setting:update', newSetting),
  onChanged: (callback) => {
    const handler = (event, newSetting) => callback(newSetting)
    ipcRenderer.on('setting:changed', handler)
    return () => ipcRenderer.removeListener('setting:changed', handler)
  },
  resizeWindow: (sizeIndex) => ipcRenderer.invoke('window:resize', sizeIndex),
  setTaskProgress: (progress) => ipcRenderer.send('taskbar:progress', progress)
}

// ========== 转码 API ==========
const transcodeAPI = {
  probe: (filePath) => ipcRenderer.invoke('transcode:probe', filePath),
  ensurePlayable: (filePath) => ipcRenderer.invoke('transcode:ensurePlayable', filePath),
  onProgress: (callback) => {
    const handler = (event, data) => callback(data)
    ipcRenderer.on('transcode:progress', handler)
    return () => ipcRenderer.removeListener('transcode:progress', handler)
  }
}

// ========== 暴露 API 到渲染进程 ==========
contextBridge.exposeInMainWorld('windowAPI', windowAPI)
contextBridge.exposeInMainWorld('dbAPI', dbAPI)
contextBridge.exposeInMainWorld('dialogAPI', dialogAPI)
contextBridge.exposeInMainWorld('musicAPI', musicAPI)
contextBridge.exposeInMainWorld('settingAPI', settingAPI)
contextBridge.exposeInMainWorld('fileAPI', fileAPI)
contextBridge.exposeInMainWorld('playInfoAPI', playInfoAPI)
contextBridge.exposeInMainWorld('fontAPI', fontAPI)
contextBridge.exposeInMainWorld('hotKeyAPI', hotKeyAPI)
contextBridge.exposeInMainWorld('transcodeAPI', transcodeAPI)
