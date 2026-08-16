import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()

// 收集主进程注册的 channel（ipcMain.handle / ipcMain.on）
const collectRegisteredChannels = () => {
  const channels = new Set()
  const dir = path.join(root, 'src/main/ipc')
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.js')) continue
    const content = readFileSync(path.join(dir, file), 'utf-8')
    for (const match of content.matchAll(/ipcMain\.(?:handle|on)\(\s*['"]([^'"]+)['"]/g)) {
      channels.add(match[1])
    }
  }
  return channels
}

// 收集主进程向渲染进程发送的 channel（webContents.send / event.sender.send）
const collectSentChannels = () => {
  const channels = new Set()
  const dir = path.join(root, 'src/main/ipc')
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.js')) continue
    const content = readFileSync(path.join(dir, file), 'utf-8')
    for (const match of content.matchAll(/(?:webContents|sender)\.send\(\s*['"]([^'"]+)['"]/g)) {
      channels.add(match[1])
    }
  }
  return channels
}

// 收集 preload 暴露的 channel
const collectPreloadChannels = () => {
  const invoke = new Set()
  const send = new Set()
  const on = new Set()
  const content = readFileSync(path.join(root, 'src/preload/index.js'), 'utf-8')

  for (const match of content.matchAll(/ipcRenderer\.invoke\(\s*['"]([^'"]+)['"]/g)) {
    invoke.add(match[1])
  }
  for (const match of content.matchAll(/ipcRenderer\.send\(\s*['"]([^'"]+)['"]/g)) {
    send.add(match[1])
  }
  for (const match of content.matchAll(/ipcRenderer\.on\(\s*['"]([^'"]+)['"]/g)) {
    on.add(match[1])
  }
  return { invoke, send, on }
}

test('preload 的 invoke/send channel 都在主进程有对应处理器', () => {
  const registered = collectRegisteredChannels()
  const preload = collectPreloadChannels()

  for (const channel of [...preload.invoke, ...preload.send]) {
    assert.ok(registered.has(channel), `preload 使用了未注册的 channel: ${channel}`)
  }
})

test('preload 的事件订阅 channel 在主进程有对应推送', () => {
  const sent = collectSentChannels()
  const preload = collectPreloadChannels()

  for (const channel of preload.on) {
    assert.ok(sent.has(channel), `preload 订阅了主进程不会推送的 channel: ${channel}`)
  }
})

test('主进程不应重复注册同一个 channel', () => {
  const dir = path.join(root, 'src/main/ipc')
  const registrations = []
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.js')) continue
    const content = readFileSync(path.join(dir, file), 'utf-8')
    for (const match of content.matchAll(/ipcMain\.(?:handle|on)\(\s*['"]([^'"]+)['"]/g)) {
      registrations.push({ file, channel: match[1] })
    }
  }
  const seen = new Map()
  for (const { file, channel } of registrations) {
    assert.ok(
      !seen.has(channel) || seen.get(channel) === file,
      `channel ${channel} 在 ${seen.get(channel)} 和 ${file} 中重复注册`
    )
    seen.set(channel, file)
  }
})
