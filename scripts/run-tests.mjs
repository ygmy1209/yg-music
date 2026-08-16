/**
 * 测试运行脚本
 *
 * 项目使用 ESM 源码，但 package.json 未声明 type:module，
 * 系统 Node 无法直接 import 这些 .js 文件。
 * 这里先用项目已有的 vite 把 tests/*.test.mjs 打包成 ESM，再交给 node --test 运行。
 */

import { build } from 'vite'
import { rmSync, mkdirSync, readdirSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const testDir = path.join(root, 'tests')
const outDir = path.join(root, 'out', 'tests')

const testFiles = readdirSync(testDir).filter((file) => file.endsWith('.test.mjs')).sort()
if (testFiles.length === 0) {
  console.error('未找到 tests/*.test.mjs 测试文件')
  process.exit(1)
}

rmSync(outDir, { recursive: true, force: true })
mkdirSync(outDir, { recursive: true })

await build({
  configFile: false,
  root,
  logLevel: 'warn',
  resolve: {
    alias: {
      '@': path.join(root, 'src/renderer/src')
    }
  },
  build: {
    outDir,
    emptyOutDir: false,
    minify: false,
    target: 'node20',
    rollupOptions: {
      input: Object.fromEntries(
        testFiles.map((file) => [file.replace('.test.mjs', ''), path.join(testDir, file)])
      ),
      external: (id) => id.startsWith('node:'),
      output: {
        format: 'es',
        entryFileNames: '[name].mjs'
      }
    }
  }
})

const bundledFiles = testFiles.map((file) => path.join(outDir, `${file.replace('.test.mjs', '')}.mjs`))
const result = spawnSync(process.execPath, ['--test', ...bundledFiles], {
  stdio: 'inherit',
  cwd: root
})

process.exit(result.status ?? 1)
