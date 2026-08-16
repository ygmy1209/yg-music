# yg-music（摇光音乐）

本地音视频播放器，基于 Electron + Vue 3 + Pinia + better-sqlite3。

## 技术栈

- Electron（electron-vite：main / preload / renderer 三端构建）
- Vue 3（Composition API）+ Pinia
- SCSS + postcss-pxtorem + animate.css
- better-sqlite3（歌单/歌曲数据）
- music-metadata + fluent-ffmpeg（元数据、写标签、按需转码）

## 目录结构

```
src/
├── main/          # Electron 主进程：窗口/托盘、数据库、IPC handlers、工具
├── preload/       # contextBridge 薄桥接层：只暴露 IPC API
└── renderer/src/  # Vue 渲染进程
    ├── components/   # business / ui 组件
    ├── composables/  # useHotkeys / useSongSelection
    ├── constants/    # 全局常量
    ├── layouts/      # 主布局与播放器
    ├── pages/        # 歌单 / 专辑 / 歌手 / 设置
    ├── stores/       # Pinia stores
    └── utils/        # 纯工具函数
```

## 开发

```bash
npm install        # 安装依赖
npm run dev        # 开发模式
```

## 验证

```bash
npm run lint       # ESLint（应保持 0 error）
npm test           # CLI 逻辑测试（node:test，经 vite 打包后运行）
npm run build      # electron-vite 三端构建
npm start          # 预览打包产物（需要可用的图形环境）
```

## 打包

```bash
npm run build:win
npm run build:mac
npm run build:linux
```

## 说明

- 渲染进程通过 `window.*API`（由 preload 暴露）与主进程通信，不直接访问 Node/Electron。
- 歌曲 ID 使用文件路径；歌单与排序信息分别存储在 SQLite 三张表中。
- 设置、播放信息、快捷键以 JSON 文件形式持久化在用户数据目录。
