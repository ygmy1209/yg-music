import { test } from 'node:test'
import assert from 'node:assert/strict'
import { dbToDisplaySong, dbToDisplaySongs, extractSongInfo } from '../src/renderer/src/utils/songTransform.js'

test('dbToDisplaySong: 字段映射 singer->artist / interval->duration', () => {
  assert.deepEqual(
    dbToDisplaySong({
      id: '/music/a.mp3',
      name: '歌名',
      singer: '歌手',
      album: '专辑',
      interval: '03:45',
      type: 0,
      meta: '{}'
    }),
    {
      id: '/music/a.mp3',
      name: '歌名',
      artist: '歌手',
      album: '专辑',
      duration: '03:45',
      type: 0,
      meta: '{}'
    }
  )
})

test('dbToDisplaySongs: 空值与非数组输入安全', () => {
  assert.deepEqual(dbToDisplaySongs([]), [])
  assert.deepEqual(dbToDisplaySongs(null), [])
  assert.equal(dbToDisplaySong(null), null)
})

test('extractSongInfo: 兼容两种字段命名', () => {
  assert.deepEqual(extractSongInfo({ name: 'a', artist: 'b', duration: '01:00', type: 0 }), {
    name: 'a',
    singer: 'b',
    album: '',
    type: 0,
    interval: '01:00',
    meta: null
  })
})
