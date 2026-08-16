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

## 给初学者的阅读路线

按下面顺序阅读，基本能顺着一条请求链路看懂整个项目：

1. `package.json` 与 `electron.vite.config.mjs`：先看脚本和构建入口。
2. `src/main/index.js`：窗口、托盘、应用生命周期。
3. `src/preload/index.js`：它只是把 IPC 通道包成 `window.*API`，没有业务逻辑。
4. `src/main/ipc/index.js`：所有 IPC handler 的注册入口，再挑 `musicHandlers.js` 看主进程怎么干活。
5. `src/renderer/src/main.js` → `App.vue` → `layouts/MainLayout.vue`：界面怎么搭起来。
6. `stores/playlistStore.js` → `pages/playlist/`：数据怎么从数据库到界面。
7. `stores/playerStore.js` → `layouts/parts/MusicPlayer.vue`：最核心也最复杂的播放链路（切歌令牌、歌词定位、转码都在这里）。

阅读时重点体会三个词：**分层**（main / preload / renderer）、**单向数据流**（UI → store → preload → IPC → main）、**状态归一**（一个状态只在一个地方是“真相”）。

## 说明

- 渲染进程通过 `window.*API`（由 preload 暴露）与主进程通信，不直接访问 Node/Electron。
- 歌曲 ID 使用文件路径；歌单与排序信息分别存储在 SQLite 三张表中。
- 设置、播放信息、快捷键以 JSON 文件形式持久化在用户数据目录。

## 已知的后续可优化点（暂不影响使用）

- `MusicPlayer.vue` 仍然偏大（约 2200 行），是项目里最需要耐心读的文件。
- `settingsStore.js` 内部有“简化 ref + 完整 settings”两套状态互相同步，能跑通但不是最优雅的写法。
- 全局还有不少 Prettier 格式警告（主要是历史换行符/缩进），`lint` 保持 0 error，不影响构建。
- 没有 TypeScript（这是项目早期刻意选择的），也没有界面自动化测试。
