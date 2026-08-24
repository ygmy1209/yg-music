# yg-music · 摇光音乐

基于 Electron + Vue 3 + Pinia + better-sqlite3 的本地音视频播放器。

## 项目简介

摇光音乐是一款面向本地音乐与视频文件的桌面播放器，支持音视频导入、歌单/专辑/歌手管理、歌词显示、元数据编辑与视频按需转码。应用采用 Electron 多进程架构，渲染进程通过 preload 安全桥接层与主进程通信，不直接访问 Node.js 与系统能力。

## 功能特性

- **本地媒体管理**：支持文件/文件夹批量导入，自动识别音频与视频元数据、封面和内嵌歌词
- **歌单体系**：支持自定义歌单、歌曲排序、搜索、批量添加与移除
- **专辑与歌手**：基于本地曲库自动聚合专辑与歌手视图
- **播放器**：播放/暂停、上下曲、多种播放模式、进度拖拽、音量控制、音视频筛选
- **歌词**：支持内嵌歌词与外置 `.lrc` 文件解析、同步滚动与点击跳转
- **视频转码**：对 Chromium 不支持的音频编码进行自动转码并缓存，保证可播放性
- **个性化设置**：主题色、字体大小、字体、窗口尺寸、全局快捷键、系统托盘、任务栏进度
- **数据持久化**：SQLite 存储歌单与歌曲数据，JSON 文件持久化设置、播放信息与快捷键配置

## 技术栈

- Electron / electron-vite
- Vue 3（Composition API）+ Pinia
- better-sqlite3
- music-metadata / fluent-ffmpeg
- SCSS / postcss-pxtorem / animate.css

## 环境要求

- Node.js 18+
- npm

## 安装与运行

```bash
npm install
npm run dev
```

## 质量检查

```bash
npm run lint
npm test
npm run build
```

## 打包

```bash
npm run build:win
npm run build:mac
npm run build:linux
```

## 数据存储

- 数据库文件：`yg-music.db`（用户数据目录）
- 设置、播放信息、快捷键：`data/*.json`（用户数据目录，原子写入并带备份恢复）
- 转码缓存：`transcode-cache/`（用户数据目录，按文件大小与修改时间作为缓存键）

## License

Apache-2.0
