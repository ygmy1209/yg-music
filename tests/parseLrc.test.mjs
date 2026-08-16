import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseLrc, findLyricIndex } from '../src/renderer/src/utils/parseLrc.js'

test('parseLrc: 解析带时间戳的歌词行', () => {
  const lines = parseLrc('[00:00.00]第一句\n[00:01.50]第二句\n[01:02]第三句')
  assert.deepEqual(lines, [
    { time: 0, text: '第一句' },
    { time: 1.5, text: '第二句' },
    { time: 62, text: '第三句' }
  ])
})

test('parseLrc: 解析并排序多时间标签与元数据', () => {
  const lines = parseLrc('[00:01.00]晚到\n[00:00.00]先到\n[ar:歌手]')
  assert.deepEqual(lines, [
    { time: 0, text: '先到' },
    { time: 0, text: '歌手: 歌手', isMeta: true },
    { time: 1, text: '晚到' }
  ])
})

test('parseLrc: 过滤 awlrc 标记与纯技术标签', () => {
  const lines = parseLrc('[offset:0]\n[00:00.10]awlrc 标记应被过滤\n[00:01.00]正常歌词')
  assert.deepEqual(lines, [{ time: 1, text: '正常歌词' }])
})

test('findLyricIndex: 二分定位当前歌词行', () => {
  const lines = [
    { time: 0, text: 'a' },
    { time: 5, text: 'b' },
    { time: 10, text: 'c' },
    { time: 20, text: 'd' }
  ]
  assert.equal(findLyricIndex(lines, 0), 0)
  assert.equal(findLyricIndex(lines, 4.9), 0)
  assert.equal(findLyricIndex(lines, 5), 1)
  assert.equal(findLyricIndex(lines, 19), 2)
  assert.equal(findLyricIndex(lines, 20), 3)
  assert.equal(findLyricIndex(lines, 30), 3)
  assert.equal(findLyricIndex([], 10), -1)
})
