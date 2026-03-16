/**
 * 音乐/视频信息对话框内容组件
 * 参考 MediaInfo 风格设计
 */

<template>
  <div class="media-info-content">
    <!-- 页面切换标签 -->
    <div class="tab-nav">
      <button
        v-for="tab in currentTabs"
        :key="tab.key"
        :class="['tab-item', { active: activeTab === tab.key }]"
        @click="activeTab = tab.key"
      >
        <component :is="tab.icon" class="tab-icon" />
        {{ tab.label }}
      </button>
    </div>

    <!-- 内容区 -->
    <div class="content-area" ref="contentAreaRef">
      <Transition
        name="tab-fade"
        mode="out-in"
        @before-enter="onBeforeEnter"
        @enter="onEnter"
        @after-enter="onAfterEnter"
        @before-leave="onBeforeLeave"
        @leave="onLeave"
        @after-leave="onAfterLeave"
      >
        <!-- 加载中 -->
        <div v-if="loading" key="loading" class="loading-state">
          <div class="loading-spinner"></div>
          <span>正在读取文件信息...</span>
        </div>

        <!-- 错误状态 -->
        <div v-else-if="error" key="error" class="error-state">
          <span>{{ error }}</span>
        </div>

        <!-- 歌曲信息页面 -->
        <div v-else-if="activeTab === 'song'" key="song" class="tab-panel">
        <div class="meta-list">
          <div class="meta-item" @click="startEdit('title')">
            <div class="meta-main">
              <div class="meta-label">歌曲</div>
              <div class="meta-value">{{ info?.tags?.title || '-' }}</div>
            </div>
            <svg class="edit-arrow" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
          <div class="meta-item" @click="startEdit('artist')">
            <div class="meta-main">
              <div class="meta-label">歌手</div>
              <div class="meta-value">{{ info?.tags?.artist || '-' }}</div>
            </div>
            <svg class="edit-arrow" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
          <div class="meta-item" @click="startEdit('album')">
            <div class="meta-main">
              <div class="meta-label">专辑</div>
              <div class="meta-value">{{ info?.tags?.album || '-' }}</div>
            </div>
            <svg class="edit-arrow" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
        </div>

        <div class="meta-grid">
          <div class="meta-item-simple">
            <div class="meta-label">时长</div>
            <div class="meta-value">{{ info?.general?.duration || '-' }}</div>
          </div>
          <div class="meta-item-simple">
            <div class="meta-label">音质</div>
            <div class="meta-value">{{ info?.audio?.commercialName || '-' }}</div>
          </div>
          <div class="meta-item-simple">
            <div class="meta-label">文件大小</div>
            <div class="meta-value">{{ info?.general?.fileSize || '-' }}</div>
          </div>
          <div class="meta-item-simple clickable" @click="openFolder">
            <div class="meta-label">文件路径</div>
            <div class="meta-value path">{{ info?.general?.completeName || '-' }}</div>
          </div>
        </div>
      </div>

      <!-- 音频信息页面 -->
      <div v-else-if="activeTab === 'audio'" key="audio" class="tab-panel">
        <div class="info-cards">
          <div class="info-card">
            <div class="info-row">
              <span class="info-label">音频编码</span>
              <span class="info-value">{{ info?.audio?.format || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">采样率</span>
              <span class="info-value">{{ info?.audio?.samplingRate || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">声道数</span>
              <span class="info-value">{{ info?.audio?.channels || '-' }}</span>
            </div>
          </div>
          <div class="info-card">
            <div class="info-row">
              <span class="info-label">位率</span>
              <span class="info-value">{{ info?.audio?.bitRate || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">采样位数</span>
              <span class="info-value">{{ info?.audio?.bitDepth || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">压缩模式</span>
              <span class="info-value">{{ info?.audio?.compressionMode || '-' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 视频信息页面 -->
      <div v-else-if="activeTab === 'video'" key="video" class="tab-panel">
        <div class="info-cards">
          <div class="info-card">
            <div class="info-row">
              <span class="info-label">视频编码</span>
              <span class="info-value">{{ info?.video?.format || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">分辨率</span>
              <span class="info-value">{{ info?.video?.width }} x {{ info?.video?.height }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">帧率</span>
              <span class="info-value">{{ info?.video?.frameRate || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">码率</span>
              <span class="info-value">{{ info?.video?.bitRate || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">色彩空间</span>
              <span class="info-value">{{ info?.video?.colorSpace || '-' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 文件信息页面 -->
      <div v-else-if="activeTab === 'file'" key="file" class="tab-panel">
        <div class="file-section">
          <div class="section-header">General</div>
          <div class="file-line">
            <span class="file-key">Complete name</span>
            <span class="file-val">: {{ info?.general?.completeName || '-' }}</span>
          </div>
          <div class="file-line">
            <span class="file-key">Format</span>
            <span class="file-val">: {{ info?.general?.format || '-' }}</span>
          </div>
          <div class="file-line">
            <span class="file-key">File size</span>
            <span class="file-val">: {{ info?.general?.fileSize || '-' }}</span>
          </div>
          <div class="file-line">
            <span class="file-key">Duration</span>
            <span class="file-val">: {{ info?.general?.duration || '-' }}</span>
          </div>
          <div class="file-line">
            <span class="file-key">Overall bit rate</span>
            <span class="file-val">: {{ info?.general?.overallBitRate || '-' }}</span>
          </div>
          <template v-if="info?.tags">
            <div class="file-line" v-if="info.tags.album">
              <span class="file-key">Album</span>
              <span class="file-val">: {{ info.tags.album }}</span>
            </div>
            <div class="file-line" v-if="info.tags.title">
              <span class="file-key">Track name</span>
              <span class="file-val">: {{ info.tags.title }}</span>
            </div>
            <div class="file-line" v-if="info.tags.artist">
              <span class="file-key">Performer</span>
              <span class="file-val">: {{ info.tags.artist }}</span>
            </div>
            <div class="file-line" v-if="info.tags.genre && info.tags.genre !== '-'">
              <span class="file-key">Genre</span>
              <span class="file-val">: {{ info.tags.genre }}</span>
            </div>
          </template>
          <div class="file-line" v-if="info?.general?.writingLibrary && info.general.writingLibrary !== '-'">
            <span class="file-key">Writing library</span>
            <span class="file-val">: {{ info.general.writingLibrary }}</span>
          </div>
        </div>

        <div class="section-divider"></div>

        <div class="file-section" v-if="info?.audio">
          <div class="section-header">Audio</div>
          <div class="file-line">
            <span class="file-key">Format</span>
            <span class="file-val">: {{ info.audio.format || '-' }}</span>
          </div>
          <div class="file-line" v-if="info.audio.codecProfile && info.audio.codecProfile !== '-'">
            <span class="file-key">Codec profile</span>
            <span class="file-val">: {{ info.audio.codecProfile }}</span>
          </div>
          <div class="file-line" v-if="info.audio.bitRateMode && info.audio.bitRateMode !== '-'">
            <span class="file-key">Bit rate mode</span>
            <span class="file-val">: {{ info.audio.bitRateMode }}</span>
          </div>
          <div class="file-line">
            <span class="file-key">Bit rate</span>
            <span class="file-val">: {{ info.audio.bitRate || '-' }}</span>
          </div>
          <div class="file-line">
            <span class="file-key">Channel(s)</span>
            <span class="file-val">: {{ info.audio.channels || '-' }}</span>
          </div>
          <div class="file-line">
            <span class="file-key">Sampling rate</span>
            <span class="file-val">: {{ info.audio.samplingRate || '-' }}</span>
          </div>
          <div class="file-line" v-if="info.audio.bitDepth && info.audio.bitDepth !== '-'">
            <span class="file-key">Bit depth</span>
            <span class="file-val">: {{ info.audio.bitDepth }}</span>
          </div>
          <div class="file-line">
            <span class="file-key">Compression mode</span>
            <span class="file-val">: {{ info.audio.compressionMode || '-' }}</span>
          </div>
        </div>

        <template v-if="info?.video">
          <div class="section-divider"></div>
          <div class="file-section">
            <div class="section-header">Video</div>
            <div class="file-line">
              <span class="file-key">Format</span>
              <span class="file-val">: {{ info.video.format || '-' }}</span>
            </div>
            <div class="file-line">
              <span class="file-key">Width</span>
              <span class="file-val">: {{ info.video.width || '-' }}</span>
            </div>
            <div class="file-line">
              <span class="file-key">Height</span>
              <span class="file-val">: {{ info.video.height || '-' }}</span>
            </div>
            <div class="file-line" v-if="info.video.frameRate && info.video.frameRate !== '-'">
              <span class="file-key">Frame rate</span>
              <span class="file-val">: {{ info.video.frameRate }}</span>
            </div>
            <div class="file-line" v-if="info.video.bitRate && info.video.bitRate !== '-'">
              <span class="file-key">Bit rate</span>
              <span class="file-val">: {{ info.video.bitRate }}</span>
            </div>
            <div class="file-line" v-if="info.video.colorSpace && info.video.colorSpace !== '-'">
              <span class="file-key">Color space</span>
              <span class="file-val">: {{ info.video.colorSpace }}</span>
            </div>
          </div>
        </template>
      </div>
      </Transition>
    </div>

    <!-- 编辑对话框 -->
    <Transition name="edit-dialog">
      <div v-if="editing" class="edit-overlay" @click.self="cancelEdit">
        <div class="edit-box">
          <div class="edit-title">{{ editLabel }}</div>
          <div class="edit-body">
            <input
              ref="editInputRef"
              v-model="editValue"
              type="text"
              class="edit-input"
              @keydown.enter="confirmEdit"
              @keydown.escape="cancelEdit"
            />
            <button v-if="editValue" class="clear-btn" @click="editValue = ''">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div class="edit-footer">
            <button class="btn-text" @click="cancelEdit">取消</button>
            <span class="btn-divider">|</span>
            <button class="btn-text primary" @click="confirmEdit">确认</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, h } from 'vue'
import { usePlaylistStore } from '@/stores/playlistStore'
import { usePlayerStore } from '@/stores/playerStore'

const props = defineProps({
  filePath: { type: String, required: true },
  songName: { type: String, default: '' },
  songType: { type: Number, default: 0 }
})

const playlistStore = usePlaylistStore()
const playerStore = usePlayerStore()
const emit = defineEmits(['updated'])

// 图标组件
const IconInfo = () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2 }, [
  h('circle', { cx: 12, cy: 12, r: 10 }),
  h('line', { x1: 12, y1: 16, x2: 12, y2: 12 }),
  h('line', { x1: 12, y1: 8, x2: '12.01', y2: 8 })
])

const IconAudio = () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2 }, [
  h('path', { d: 'M9 18V5l12-2v13' }),
  h('circle', { cx: 6, cy: 18, r: 3 }),
  h('circle', { cx: 18, cy: 16, r: 3 })
])

const IconVideo = () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2 }, [
  h('polygon', { points: '23 7 16 12 23 17 23 7' }),
  h('rect', { x: 1, y: 5, width: 15, height: 14, rx: 2, ry: 2 })
])

const IconFile = () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2 }, [
  h('path', { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' }),
  h('polyline', { points: '14 2 14 8 20 8' })
])

// 状态
const loading = ref(true)
const error = ref('')
const info = ref(null)
const activeTab = ref('song')
const contentAreaRef = ref(null)

// 音频标签页
const audioTabs = [
  { key: 'song', label: '歌曲信息', icon: IconInfo },
  { key: 'audio', label: '音频信息', icon: IconAudio },
  { key: 'file', label: '文件信息', icon: IconFile }
]

// 视频标签页
const videoTabs = [
  { key: 'song', label: '概述', icon: IconInfo },
  { key: 'video', label: '视频流', icon: IconVideo },
  { key: 'audio', label: '音频信息', icon: IconAudio },
  { key: 'file', label: '文件信息', icon: IconFile }
]

const currentTabs = computed(() => {
  return info.value?.hasVideo ? videoTabs : audioTabs
})

// 编辑相关
const editing = ref(false)
const editingField = ref('')
const editValue = ref('')
const editInputRef = ref(null)
const saving = ref(false)

const editLabels = { title: '歌曲', artist: '歌手', album: '专辑' }
const editLabel = ref('')

// 加载信息
const loadInfo = async () => {
  loading.value = true
  error.value = ''
  try {
    const result = await window.musicAPI.getDetailedInfo(props.filePath)
    if (result.success) {
      info.value = result.data
    } else {
      error.value = result.error || '获取信息失败'
    }
  } catch (e) {
    error.value = e.message || '获取信息失败'
  } finally {
    loading.value = false
  }
}

const startEdit = async (field) => {
  editingField.value = field
  editLabel.value = editLabels[field] || field
  editValue.value = info.value?.tags?.[field] || ''
  editing.value = true
  await nextTick()
  editInputRef.value?.focus()
}

const cancelEdit = () => {
  editing.value = false
  editingField.value = ''
  editValue.value = ''
}

// 在文件资源管理器中打开文件所在位置
const openFolder = async () => {
  const filePath = info.value?.general?.completeName
  if (filePath) {
    await window.fileAPI.showInFolder(filePath)
  }
}

const confirmEdit = async () => {
  if (!info.value?.tags || !editingField.value) {
    cancelEdit()
    return
  }

  const newValue = editValue.value.trim()

  // 字段映射：UI 字段名 -> 数据库字段名
  const fieldMap = {
    title: 'name',
    artist: 'singer',
    album: 'album'
  }

  const dbField = fieldMap[editingField.value]
  if (!dbField) {
    cancelEdit()
    return
  }

  saving.value = true
  try {
    // 调用 API 更新（数据库 + 文件元数据）
    const result = await window.dbAPI.updateSongInfo(props.filePath, {
      [dbField]: newValue
    })

    if (result.success) {
      // 更新本地显示
      info.value.tags[editingField.value] = newValue

      // 刷新歌单列表
      await playlistStore.loadSongs()

      // 如果正在播放这首歌，更新播放器状态
      playerStore.updateSongInfo(props.filePath, { [dbField]: newValue })

      // 通知父组件
      emit('updated', { field: editingField.value, value: newValue })
    } else {
      console.error('更新失败:', result.error)
      // TODO: 显示错误提示
    }
  } catch (error) {
    console.error('更新失败:', error)
  } finally {
    saving.value = false
  }

  cancelEdit()
}

// ========== 标签切换高度动画 ==========

const onBeforeLeave = () => {
  if (contentAreaRef.value) {
    contentAreaRef.value.style.maxHeight = contentAreaRef.value.scrollHeight + 'px'
  }
}

const onLeave = () => {
  if (contentAreaRef.value) {
    contentAreaRef.value.style.maxHeight = '0px'
    contentAreaRef.value.style.opacity = '0'
  }
}

const onAfterLeave = () => {
  if (contentAreaRef.value) {
    contentAreaRef.value.style.maxHeight = ''
    contentAreaRef.value.style.opacity = ''
  }
}

const onBeforeEnter = () => {
  if (contentAreaRef.value) {
    contentAreaRef.value.style.maxHeight = '0px'
    contentAreaRef.value.style.opacity = '0'
  }
}

const onEnter = () => {
  if (contentAreaRef.value) {
    const targetHeight = Math.min(contentAreaRef.value.scrollHeight, 400)
    contentAreaRef.value.style.maxHeight = targetHeight + 'px'
    contentAreaRef.value.style.opacity = '1'
  }
}

const onAfterEnter = () => {
  if (contentAreaRef.value) {
    contentAreaRef.value.style.maxHeight = '400px'
    contentAreaRef.value.style.opacity = ''
  }
}

onMounted(() => loadInfo())
</script>

<style lang="scss" scoped>
.media-info-content {
  width: 520px;
  max-height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden; // 防止内容溢出

  // 标签导航
  .tab-nav {
    display: flex;
    gap: 24px;
    padding: 0 20px;
    border-bottom: 1px solid var(--border-color, #e6ecf2);
    flex-shrink: 0;

    .tab-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 12px 4px 10px;
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      font-size: var(--font-size-sm, 14px);
      font-weight: 500;
      color: var(--text-secondary, #5f7392);
      cursor: pointer;
      margin-bottom: -1px;
      transition: all 0.15s ease;

      .tab-icon {
        opacity: 0.7;
      }

      &:hover {
        color: var(--text-primary, #1e293b);
      }

      &.active {
        color: var(--primary-color, #0066cc);
        border-bottom-color: var(--primary-color, #0066cc);

        .tab-icon {
          opacity: 1;
        }
      }
    }
  }

  // 内容区
  .content-area {
    padding: 20px;
    max-height: 400px;
    overflow-y: auto;
    overflow-x: hidden;
    transition: max-height 0.25s ease, opacity 0.2s ease;
  }

  // 标签切换过渡动画
  .tab-fade-enter-active,
  .tab-fade-leave-active {
    transition: opacity 0.2s ease, transform 0.2s ease;
  }

  .tab-fade-enter-from {
    opacity: 0;
    transform: translateX(10px);
  }

  .tab-fade-leave-to {
    opacity: 0;
    transform: translateX(-10px);
  }

  .tab-panel {
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  // 加载/错误状态
  .loading-state, .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    color: var(--text-icon, #8a9bb5);
    gap: 12px;

    .loading-spinner {
      width: 24px;
      height: 24px;
      border: 2px solid var(--border-color, #e6ecf2);
      border-top-color: var(--primary-color, #0066cc);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
  }

  // 歌曲信息列表
  .meta-list {
    display: flex;
    flex-direction: column;
    gap: 2px;

    .meta-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 0;
      border-radius: 8px;
      cursor: pointer;
      transition: background-color 0.15s ease;

      &:hover {
        background-color: rgba(0, 102, 204, 0.06);
      }

      .meta-main {
        flex: 1;
      }

      .meta-label {
        font-size: 15px;
        font-weight: 500;
        color: var(--text-primary, #1e293b);
        margin-bottom: 2px;
      }

      .meta-value {
        font-size: 14px;
        color: var(--text-secondary, #5f6c84);
      }

      .edit-arrow {
        color: var(--primary-color);
        flex-shrink: 0;
      }
    }
  }

  // 网格信息
  .meta-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px 24px;
    margin-top: 12px;
    padding-top: 12px;

    .meta-item-simple {
      padding: 8px 0;

      &.clickable {
        cursor: pointer;
      }

      .meta-label {
        font-size: 15px;
        font-weight: 500;
        color: var(--text-primary, #1e293b);
        margin-bottom: 2px;
      }

      .meta-value {
        font-size: 14px;
        color: var(--text-secondary, #5f6c84);

        &.path {
          font-size: 12px;
          word-break: break-all;
          color: var(--text-icon, #8a9bb5);
        }
      }
    }
  }

  // 音频/视频信息卡片
  .info-cards {
    display: flex;
    flex-direction: column;
    gap: 16px;

    .info-card {
      background: rgba(0, 102, 204, 0.04);
      border-radius: 12px;
      padding: 16px;
      border: 1px solid rgba(0, 102, 204, 0.1);

      .info-row {
        display: flex;
        align-items: baseline;
        padding: 6px 0;

        &:last-child {
          padding-bottom: 0;
        }

        .info-label {
          width: 90px;
          flex-shrink: 0;
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary, #1e293b);
        }

        .info-value {
          font-size: 14px;
          color: var(--text-secondary, #5f6c84);
        }
      }
    }
  }

  // 文件信息区块
  .file-section {
    .section-header {
      font-size: 14px;
      font-weight: 600;
      color: var(--primary-color, #0066cc);
      margin-bottom: 8px;
      padding-left: 12px;
      border-left: 3px solid var(--primary-color, #0066cc);
    }

    .file-line {
      display: flex;
      padding: 3px 0;
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 13px;

      .file-key {
        min-width: 130px;
        color: var(--text-secondary, #5f6c84);
        flex-shrink: 0;
      }

      .file-val {
        color: var(--text-primary, #4a5b73);
        word-break: break-all;
      }
    }
  }

  .section-divider {
    border-top: 1px dashed var(--border-color, #b8cbdf);
    margin: 16px 0;
  }
}

// 编辑对话框
.edit-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.25);
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 12px;
  z-index: 10;
}

.edit-box {
  background: var(--bg-primary, #fff);
  border-radius: 12px;
  padding: 20px;
  min-width: 280px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);

  .edit-title {
    text-align: center;
    font-size: 15px;
    font-weight: 500;
    color: var(--text-primary, #1e293b);
    margin-bottom: 16px;
  }

  .edit-body {
    position: relative;
    margin-bottom: 16px;

    .edit-input {
      width: 100%;
      padding: 10px 28px 10px 0;
      background: transparent;
      border: none;
      border-bottom: 2px solid var(--primary-color, #0066cc);
      font-size: 15px;
      color: var(--text-primary, #1e293b);
      outline: none;
    }

    .clear-btn {
      position: absolute;
      right: 6px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: var(--text-icon, #8a9bb5);
      cursor: pointer;
      padding: 4px;
      display: flex;

      &:hover {
        color: var(--text-secondary, #5f6c84);
      }
    }
  }

  .edit-footer {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 16px;

    .btn-text {
      background: none;
      border: none;
      font-size: 14px;
      color: var(--text-secondary, #5f6c84);
      cursor: pointer;
      padding: 8px 16px;
      transition: color 0.15s ease;

      &:hover {
        color: var(--text-primary, #1e293b);
      }

      &.primary {
        color: var(--primary-color, #0066cc);
      }
    }

    .btn-divider {
      color: var(--text-icon, #d0d7e0);
    }
  }
}

// 编辑动画
.edit-dialog-enter-active,
.edit-dialog-leave-active {
  transition: opacity 0.2s ease;

  .edit-box {
    transition: transform 0.2s ease;
  }
}

.edit-dialog-enter-from,
.edit-dialog-leave-to {
  opacity: 0;

  .edit-box {
    transform: scale(0.95);
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
