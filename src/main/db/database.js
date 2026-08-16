/**
 * 数据库模块
 * 使用 better-sqlite3 管理歌单和歌曲数据
 */

import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { app } from 'electron'

// 数据库实例
let db = null

/**
 * 获取数据库文件路径
 * 存储在用户数据目录下
 */
const getDbPath = () => {
  const userDataPath = app.getPath('userData')
  return path.join(userDataPath, 'yg-music.db')
}

/**
 * 初始化数据库
 * 创建表结构（如果不存在）
 */
export const initDatabase = () => {
  const dbPath = getDbPath()

  // 检测旧结构（PRIMARY KEY(id) + 逗号分隔 listId），删除重建
  if (fs.existsSync(dbPath)) {
    const tempDb = new Database(dbPath)
    try {
      const tableInfo = tempDb.prepare(
        "SELECT sql FROM sqlite_master WHERE type='table' AND name='my_list_music_info'"
      ).get()

      // 旧结构特征：使用 PRIMARY KEY(id)，不包含 UNIQUE 约束
      if (tableInfo && tableInfo.sql && !tableInfo.sql.includes('UNIQUE')) {
        tempDb.close()
        fs.unlinkSync(dbPath)
        console.log('数据库：检测到旧结构，已删除旧数据库文件')
      } else {
        tempDb.close()
      }
    } catch {
      tempDb.close()
    }
  }

  db = new Database(dbPath)

  // 启用 WAL 模式
  db.pragma('journal_mode = WAL')

  // ========== 创建歌单表 ==========
  db.exec(`
    CREATE TABLE IF NOT EXISTS my_list (
      id TEXT NOT NULL,
      name TEXT NOT NULL,
      position INTEGER NOT NULL,
      PRIMARY KEY(id)
    )
  `)

  // ========== 创建歌曲信息表 ==========
  // listId 存储单个歌单ID，一首歌属于多个歌单时有多行记录，UNIQUE(id, listId) 保证不重复
  db.exec(`
    CREATE TABLE IF NOT EXISTS my_list_music_info (
      id TEXT NOT NULL,
      listId TEXT NOT NULL,
      name TEXT NOT NULL,
      singer TEXT NOT NULL,
      album TEXT,
      type INTEGER NOT NULL,
      interval TEXT,
      meta TEXT NOT NULL,
      UNIQUE(id, listId)
    )
  `)

  // ========== 创建歌曲排序表 ==========
  db.exec(`
    CREATE TABLE IF NOT EXISTS my_list_music_info_order (
      listId TEXT NOT NULL,
      musicInfoId TEXT NOT NULL,
      \`order\` INTEGER NOT NULL
    )
  `)

  // ========== 创建索引 ==========
  db.exec(`
    CREATE INDEX IF NOT EXISTS index_my_list_music_info
    ON my_list_music_info(id, listId)
  `)

  db.exec(`
    CREATE INDEX IF NOT EXISTS index_my_list_music_info_order
    ON my_list_music_info_order(listId, musicInfoId)
  `)

  // ========== 初始化默认歌单 ==========
  const defaultList = db.prepare('SELECT * FROM my_list WHERE id = ?').get('default')
  if (!defaultList) {
    db.prepare('INSERT INTO my_list (id, name, position) VALUES (?, ?, ?)').run('default', '全部歌曲', 0)
  }

  console.log('数据库初始化完成:', dbPath)
  return db
}

/**
 * 获取数据库实例
 */
export const getDatabase = () => {
  if (!db) {
    return initDatabase()
  }
  return db
}

/**
 * 关闭数据库连接
 */
export const closeDatabase = () => {
  if (db) {
    db.close()
    db = null
    console.log('数据库连接已关闭')
  }
}

// ========== 歌单操作 ==========

/**
 * 获取所有歌单
 */
export const getAllPlaylists = () => {
  const stmt = getDatabase().prepare('SELECT * FROM my_list ORDER BY position')
  return stmt.all()
}

/**
 * 创建歌单
 */
export const createPlaylist = (id, name) => {
  const database = getDatabase()
  // 获取最大 position
  const maxPos = database.prepare('SELECT MAX(position) as max FROM my_list').get()
  const position = (maxPos.max || 0) + 1

  const stmt = database.prepare('INSERT INTO my_list (id, name, position) VALUES (?, ?, ?)')
  stmt.run(id, name, position)
  return { id, name, position }
}

/**
 * 重命名歌单
 */
export const renamePlaylist = (id, newName) => {
  const stmt = getDatabase().prepare('UPDATE my_list SET name = ? WHERE id = ?')
  stmt.run(newName, id)
}

/**
 * 删除歌单
 * 注意：只能删除用户创建的歌单，不能删除 default
 */
export const deletePlaylist = (id) => {
  if (id === 'default') {
    throw new Error('不能删除默认歌单')
  }

  const database = getDatabase()

  const transaction = database.transaction(() => {
    // 删除该歌单的排序记录
    database.prepare('DELETE FROM my_list_music_info_order WHERE listId = ?').run(id)
    // 删除该歌单中的歌曲记录
    database.prepare('DELETE FROM my_list_music_info WHERE listId = ?').run(id)
    // 删除歌单
    database.prepare('DELETE FROM my_list WHERE id = ?').run(id)
  })

  transaction()
}

// ========== 歌曲操作 ==========

/**
 * 获取歌单中的所有歌曲（带排序）
 */
export const getSongsByPlaylist = (listId) => {
  const database = getDatabase()

  const stmt = database.prepare(`
    SELECT m.*, o.\`order\`
    FROM my_list_music_info m
    LEFT JOIN my_list_music_info_order o
      ON m.id = o.musicInfoId AND o.listId = ?
    WHERE m.listId = ?
    ORDER BY o.\`order\`
  `)

  return stmt.all(listId, listId)
}

/**
 * 压缩歌单中歌曲的排序值
 * 使排序值连续：0, 1, 2, 3, ...
 * @param {string} listId - 歌单ID
 * @returns {number} 压缩后的歌曲数量
 */
export const compactSongsOrder = (listId) => {
  const database = getDatabase()

  // 获取当前歌曲列表（按 order 排序）
  const songs = database.prepare(`
    SELECT musicInfoId, \`order\`
    FROM my_list_music_info_order
    WHERE listId = ?
    ORDER BY \`order\`
  `).all(listId)

  if (songs.length === 0) return 0

  // 删除所有排序记录
  database.prepare('DELETE FROM my_list_music_info_order WHERE listId = ?').run(listId)

  // 重新插入连续的排序值
  const insertOrder = database.prepare(`
    INSERT INTO my_list_music_info_order (listId, musicInfoId, \`order\`)
    VALUES (?, ?, ?)
  `)

  const transaction = database.transaction((songList) => {
    songList.forEach((song, index) => {
      insertOrder.run(listId, song.musicInfoId, index)
    })
  })

  transaction(songs)

  console.log(`[压缩排序] 歌单 ${listId} 共 ${songs.length} 首歌曲排序已压缩`)
  return songs.length
}

/**
 * 添加歌曲到歌单
 * @param {string} songId - 歌曲ID（文件路径）
 * @param {string} listId - 歌单ID
 * @param {object} songInfo - 歌曲信息
 * @param {string} addLocation - 添加位置：'top' 顶部，'bottom' 底部
 */
export const addSongToPlaylist = (songId, listId, songInfo, addLocation = 'top') => {
  const database = getDatabase()

  // 检查是否已在该歌单中
  const existing = database.prepare(
    'SELECT * FROM my_list_music_info WHERE id = ? AND listId = ?'
  ).get(songId, listId)

  if (existing) {
    // 已在该歌单中，检查排序记录
    const orderExists = database.prepare(
      'SELECT * FROM my_list_music_info_order WHERE musicInfoId = ? AND listId = ?'
    ).get(songId, listId)
    if (orderExists) return existing
  } else {
    // 不在该歌单中，获取歌曲信息（优先从其他歌单的已有记录中获取）
    const existingInOtherList = database.prepare(
      'SELECT * FROM my_list_music_info WHERE id = ? LIMIT 1'
    ).get(songId)

    const info = existingInOtherList || songInfo

    database.prepare(`
      INSERT INTO my_list_music_info (id, listId, name, singer, album, type, interval, meta)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      songId, listId,
      info.name || '未知歌曲', info.singer || '未知艺术家',
      info.album || '', info.type || 0, info.interval || info.duration || '',
      info.meta || '{}'
    )
  }

  // 检查排序记录是否已存在
  const orderExists = database.prepare(
    'SELECT * FROM my_list_music_info_order WHERE musicInfoId = ? AND listId = ?'
  ).get(songId, listId)

  if (orderExists) {
    return { id: songId, listId, ...songInfo, order: orderExists.order }
  }

  // 插入排序记录
  const countRes = database.prepare(
    'SELECT COUNT(*) as count FROM my_list_music_info_order WHERE listId = ?'
  ).get(listId)
  const hasItems = countRes.count > 0

  if (hasItems) {
    compactSongsOrder(listId)
  }

  let order = 0
  if (addLocation === 'top') {
    if (hasItems) {
      database.prepare(
        'UPDATE my_list_music_info_order SET `order` = `order` + 1 WHERE listId = ?'
      ).run(listId)
    }
  } else {
    const newCount = database.prepare(
      'SELECT COUNT(*) as count FROM my_list_music_info_order WHERE listId = ?'
    ).get(listId)
    order = newCount.count
  }

  database.prepare(`
    INSERT INTO my_list_music_info_order (listId, musicInfoId, \`order\`)
    VALUES (?, ?, ?)
  `).run(listId, songId, order)

  console.log(`添加歌曲到歌单 ${listId}: order=${order}, location=${addLocation}`)

  return { id: songId, listId, ...songInfo, order }
}

/**
 * 从歌单中移除歌曲
 * @param {string} songId - 歌曲ID
 * @param {string} listId - 歌单ID
 * @param {boolean} isDefault - 是否从 default 歌单删除（彻底删除）
 */
export const removeSongFromPlaylist = (songId, listId, isDefault = false) => {
  const database = getDatabase()

  if (isDefault || listId === 'default') {
    // 从 default 删除 = 彻底删除歌曲（所有歌单中的记录）
    database.prepare('DELETE FROM my_list_music_info_order WHERE musicInfoId = ?').run(songId)
    database.prepare('DELETE FROM my_list_music_info WHERE id = ?').run(songId)
    return
  }

  // 只从指定歌单移除
  database.prepare(
    'DELETE FROM my_list_music_info_order WHERE musicInfoId = ? AND listId = ?'
  ).run(songId, listId)
  database.prepare(
    'DELETE FROM my_list_music_info WHERE id = ? AND listId = ?'
  ).run(songId, listId)
}

/**
 * 更新歌曲排序
 * @param {string} listId - 歌单ID
 * @param {Array} songIds - 排序后的歌曲ID数组
 */
export const updateSongsOrder = (listId, songIds) => {
  const database = getDatabase()

  // 使用事务批量更新
  const updateOrder = database.prepare(
    'UPDATE my_list_music_info_order SET `order` = ? WHERE listId = ? AND musicInfoId = ?'
  )

  const transaction = database.transaction((songs) => {
    songs.forEach((songId, index) => {
      updateOrder.run(index, listId, songId)
    })
  })

  transaction(songIds)
}

/**
 * 更新歌曲信息
 * @param {string} songId - 歌曲ID（文件路径）
 * @param {object} updates - 更新的字段 { name?, singer?, album? }
 * @returns {boolean} 是否更新成功
 */
export const updateSongInfo = (songId, updates) => {
  const database = getDatabase()
  const allowedFields = ['name', 'singer', 'album']
  const setClauses = []
  const params = []

  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key) && value !== undefined) {
      setClauses.push(`${key} = ?`)
      params.push(value)
    }
  }

  if (setClauses.length === 0) return false

  params.push(songId)
  const stmt = database.prepare(
    `UPDATE my_list_music_info SET ${setClauses.join(', ')} WHERE id = ?`
  )
  const result = stmt.run(...params)
  return result.changes > 0
}

// ========== 专辑操作 ==========

/**
 * 获取所有专辑（从 default 歌单中提取）
 * @returns {Array} 专辑列表，每项包含 name, artist, songCount, songs
 */
export const getAllAlbums = () => {
  const database = getDatabase()

  const songs = database.prepare(`
    SELECT m.*, o.\`order\`
    FROM my_list_music_info m
    LEFT JOIN my_list_music_info_order o
      ON m.id = o.musicInfoId AND o.listId = 'default'
    WHERE m.listId = 'default'
    ORDER BY o.\`order\`
  `).all()

  // 按专辑分组
  const albumMap = new Map()

  for (const song of songs) {
    const albumName = song.album || '未知专辑'

    if (!albumMap.has(albumName)) {
      albumMap.set(albumName, {
        name: albumName,
        artist: song.singer || '未知艺术家',
        songCount: 0,
        songs: []
      })
    }

    const album = albumMap.get(albumName)
    album.songCount++
    album.songs.push({
      id: song.id,
      name: song.name,
      artist: song.singer,
      album: song.album,
      duration: song.interval,
      type: song.type,
      meta: song.meta
    })
  }

  // 转换为数组并按名称排序
  const albums = Array.from(albumMap.values())
  albums.sort((a, b) => {
    // "未知专辑" 排在最后
    if (a.name === '未知专辑') return 1
    if (b.name === '未知专辑') return -1
    return a.name.localeCompare(b.name, 'zh-CN')
  })

  return albums
}

/**
 * 获取专辑中的歌曲
 * @param {string} albumName - 专辑名称
 * @returns {Array} 歌曲列表
 */
export const getSongsByAlbum = (albumName) => {
  const database = getDatabase()
  const actualAlbumName = albumName || '未知专辑'

  const songs = database.prepare(`
    SELECT m.*, o.\`order\`
    FROM my_list_music_info m
    LEFT JOIN my_list_music_info_order o
      ON m.id = o.musicInfoId AND o.listId = 'default'
    WHERE m.listId = 'default'
      AND (m.album = ? OR ((m.album IS NULL OR m.album = '') AND ? = '未知专辑'))
    ORDER BY o.\`order\`
  `).all(actualAlbumName, actualAlbumName)

  return songs.map(song => ({
    id: song.id,
    name: song.name,
    artist: song.singer,
    album: song.album || '未知专辑',
    duration: song.interval,
    type: song.type,
    meta: song.meta
  }))
}

/**
 * 获取所有歌手（从 default 歌单中提取）
 * @returns {Array} 歌手列表，每项包含 name, songCount, songs
 */
export const getAllSingers = () => {
  const database = getDatabase()

  const songs = database.prepare(`
    SELECT m.*, o.\`order\`
    FROM my_list_music_info m
    LEFT JOIN my_list_music_info_order o
      ON m.id = o.musicInfoId AND o.listId = 'default'
    WHERE m.listId = 'default'
    ORDER BY o.\`order\`
  `).all()

  const singerMap = new Map()

  for (const song of songs) {
    const singerName = song.singer || '未知艺术家'

    if (!singerMap.has(singerName)) {
      singerMap.set(singerName, {
        name: singerName,
        songCount: 0,
        songs: []
      })
    }

    const singer = singerMap.get(singerName)
    singer.songCount++
    singer.songs.push({
      id: song.id,
      name: song.name,
      artist: song.singer,
      album: song.album,
      duration: song.interval,
      type: song.type,
      meta: song.meta
    })
  }

  const singers = Array.from(singerMap.values())
  singers.sort((a, b) => {
    if (a.name === '未知艺术家') return 1
    if (b.name === '未知艺术家') return -1
    return a.name.localeCompare(b.name, 'zh-CN')
  })

  return singers
}

/**
 * 获取歌手的所有歌曲
 * @param {string} singerName - 歌手名称
 * @returns {Array} 歌曲列表
 */
export const getSongsBySinger = (singerName) => {
  const database = getDatabase()
  const actualSingerName = singerName || '未知艺术家'

  const songs = database.prepare(`
    SELECT m.*, o.\`order\`
    FROM my_list_music_info m
    LEFT JOIN my_list_music_info_order o
      ON m.id = o.musicInfoId AND o.listId = 'default'
    WHERE m.listId = 'default'
      AND (m.singer = ? OR ((m.singer IS NULL OR m.singer = '') AND ? = '未知艺术家'))
    ORDER BY o.\`order\`
  `).all(actualSingerName, actualSingerName)

  return songs.map(song => ({
    id: song.id,
    name: song.name,
    artist: song.singer,
    album: song.album || '未知专辑',
    duration: song.interval,
    type: song.type,
    meta: song.meta
  }))
}

export default {
  initDatabase,
  getDatabase,
  closeDatabase,
  getAllPlaylists,
  createPlaylist,
  renamePlaylist,
  deletePlaylist,
  getSongsByPlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist,
  updateSongsOrder,
  updateSongInfo,
  getAllAlbums,
  getSongsByAlbum,
  getAllSingers,
  getSongsBySinger
}
