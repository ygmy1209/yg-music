import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatTime, parseDuration } from '../src/renderer/src/utils/formatTime.js'

test('formatTime: 秒数转 mm:ss', () => {
  assert.equal(formatTime(0), '00:00')
  assert.equal(formatTime(65), '01:05')
  assert.equal(formatTime(600), '10:00')
  assert.equal(formatTime(3599), '59:59')
  assert.equal(formatTime(3600), '60:00')
})

test('formatTime: 非法输入返回 00:00', () => {
  assert.equal(formatTime(-1), '00:00')
  assert.equal(formatTime(NaN), '00:00')
  assert.equal(formatTime(null), '00:00')
})

test('parseDuration: mm:ss 转秒数', () => {
  assert.equal(parseDuration('03:45'), 225)
  assert.equal(parseDuration('00:00'), 0)
  assert.equal(parseDuration('123:45'), 7425)
})

test('parseDuration: 非法输入返回 0', () => {
  assert.equal(parseDuration(''), 0)
  assert.equal(parseDuration('abc'), 0)
  assert.equal(parseDuration(null), 0)
  assert.equal(parseDuration('03:45:00'), 0)
})
