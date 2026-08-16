/**
 * 专辑页面
 * 展示音乐专辑网格视图和专辑详情
 */

<template>
  <div class="album-page">
    <!-- 专辑列表视图 -->
    <template v-if="!albumStore.isInAlbumDetail">
      <div class="page-header">
        <h2>专辑</h2>
        <span class="album-count">{{ albumStore.albums.length }} 个专辑</span>
      </div>

      <div class="album-grid-container">
        <div v-if="albumStore.albums.length === 0" class="empty-tip">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <circle cx="12" cy="12" r="2"/>
          </svg>
          <p>暂无专辑</p>
          <p class="sub-text">添加音乐后将自动识别专辑信息</p>
        </div>

        <div v-else class="album-grid">
          <div
            v-for="album in albumStore.albums"
            :key="album.name"
            class="album-card"
            @click="handleAlbumClick(album)"
          >
            <div class="album-cover">
              <img
                v-if="albumStore.getAlbumCover(album.name)"
                :src="albumStore.getAlbumCover(album.name)"
                class="cover-image"
              />
              <div v-else class="cover-placeholder">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <circle cx="12" cy="12" r="10"/>
                  <circle cx="12" cy="12" r="2"/>
                </svg>
              </div>
            </div>
            <div class="album-info">
              <div class="album-name">{{ album.name }}</div>
              <div class="album-meta">
                <span class="album-artist">{{ album.artist }}</span>
                <span class="album-song-count">{{ album.songCount }} 首</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 专辑详情视图 -->
    <template v-else>
      <div class="album-detail">
        <div class="detail-header">
          <button class="back-btn" @click="handleBack">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div class="album-title">
            <h2>{{ albumStore.currentAlbum?.name }}</h2>
            <span class="song-count">{{ albumStore.currentAlbumSongs.length }} 首</span>
          </div>
        </div>

        <div class="song-list-wrapper">
          <div class="song-list">
            <div
              v-for="(song, index) in albumStore.currentAlbumSongs"
              :key="song.id"
              class="song-item"
              :class="{ selected: albumStore.isSelected(song.id) }"
              @click="handleSongClick($event, song, index)"
              @dblclick="handlePlaySong(song)"
            >
              <div class="song-index">{{ index + 1 }}</div>
              <div class="song-info">
                <div class="song-name">{{ song.name }}</div>
                <div class="song-meta">
                  <span class="song-artist">{{ song.artist }}</span>
                  <span v-if="song.duration" class="song-duration">{{ song.duration }}</span>
                </div>
              </div>
            </div>
          </div>

          <div v-if="albumStore.currentAlbumSongs.length === 0" class="empty-songs">
            暂无歌曲
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useAlbumStore } from '@/stores/albumStore'
import { usePlayerStore } from '@/stores/playerStore'

const albumStore = useAlbumStore()
const playerStore = usePlayerStore()

// 键盘状态
const isCtrlPressed = ref(false)
const isShiftPressed = ref(false)

// 初始化
onMounted(() => {
  albumStore.init()
  document.addEventListener('keydown', handleKeyDown)
  document.addEventListener('keyup', handleKeyUp)
  window.addEventListener('blur', handleWindowBlur)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
  document.removeEventListener('keyup', handleKeyUp)
  window.removeEventListener('blur', handleWindowBlur)
})

// 键盘事件
const handleKeyDown = (e) => {
  if (e.key === 'Control') isCtrlPressed.value = true
  if (e.key === 'Shift') isShiftPressed.value = true

  // Ctrl+A 全选/取消全选
  if (e.key === 'a' && e.ctrlKey && albumStore.isInAlbumDetail) {
    e.preventDefault()
    if (albumStore.selectedSongCount === albumStore.currentAlbumSongs.length) {
      albumStore.clearSelection()
    } else {
      albumStore.selectAll()
    }
  }
}

const handleKeyUp = (e) => {
  if (e.key === 'Control') isCtrlPressed.value = false
  if (e.key === 'Shift') isShiftPressed.value = false
}

// 窗口失焦时重置修饰键状态，避免回来出现“卡 Ctrl/Shift”
const handleWindowBlur = () => {
  isCtrlPressed.value = false
  isShiftPressed.value = false
}

// 点击专辑卡片
const handleAlbumClick = (album) => {
  albumStore.selectAlbum(album)
}

// 返回专辑列表
const handleBack = () => {
  albumStore.backToAlbumList()
}

// 点击歌曲行
const handleSongClick = (event, song, index) => {
  if (event.button !== 0) return

  if (isCtrlPressed.value) {
    albumStore.toggleSelection(song.id)
  } else if (isShiftPressed.value && albumStore.lastSelectedIndex >= 0) {
    albumStore.selectRange(albumStore.lastSelectedIndex, index)
  } else {
    albumStore.selectSingle(song.id)
  }

  albumStore.lastSelectedIndex = index
}

// 双击播放歌曲
const handlePlaySong = (song) => {
  // 设置播放列表
  playerStore.setPlaylist([...albumStore.currentAlbumSongs])

  // 设置专辑播放标识（会自动清除 listId）
  playerStore.setCurrentAlbumName(albumStore.currentAlbum?.name)

  // 设置当前歌曲
  playerStore.setCurrentSong(song)
}
</script>

<style lang="scss" scoped>
.album-page {
  height: 100%;
  display: flex;
  flex-direction: column;

  .page-header {
    padding: 20px 20px 16px;
    display: flex;
    align-items: center;
    gap: 12px;

    h2 {
      margin: 0;
      font-size: var(--font-size-lg);
      color: var(--text-primary);
    }

    .album-count {
      font-size: var(--font-size-sm);
      color: var(--text-icon);
    }
  }

  // 专辑网格容器
  .album-grid-container {
    flex: 1;
    overflow-y: auto;
    padding: 0 20px 20px;
  }

  // 专辑网格
  .album-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 20px;
    padding-top: 4px; // 防止卡片上移时被遮挡
  }

  // 专辑卡片
  .album-card {
    cursor: pointer;
    transition: transform 0.2s ease;

    &:hover {
      transform: translateY(-4px);
    }

    .album-cover {
      aspect-ratio: 1;
      border-radius: 8px;
      overflow: hidden;
      background-color: var(--primary-color-10);
      transition: box-shadow 0.2s ease;

      .cover-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .cover-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        background-color: rgba(0, 0, 0, 0.03);
        color: var(--primary-color);
        opacity: 0.5;
      }
    }

    .album-info {
      padding: 10px 4px 0;

      .album-name {
        font-size: var(--font-size-sm);
        color: var(--text-primary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .album-meta {
        display: flex;
        justify-content: space-between;
        margin-top: 4px;
        font-size: 12px;
        color: var(--text-icon);

        .album-artist {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          margin-right: 8px;
        }

        .album-song-count {
          flex-shrink: 0;
        }
      }
    }
  }

  // 空状态
  .empty-tip {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%; // 占满容器高度
    min-height: 300px;
    color: var(--text-icon);

    svg {
      margin-bottom: 16px;
      opacity: 0.5;
    }

    p {
      margin: 0;
      font-size: var(--font-size-base);
    }

    .sub-text {
      font-size: var(--font-size-sm);
      margin-top: 8px;
    }
  }

  // 专辑详情视图
  .album-detail {
    height: 100%;
    display: flex;
    flex-direction: column;

    .detail-header {
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 12px;

      .back-btn {
        width: 32px;
        height: 32px;
        border: none;
        border-radius: 6px;
        background-color: transparent;
        color: var(--text-primary);
        cursor: pointer;
        display: flex;
        justify-content: center;
        align-items: center;
        transition: background-color 0.2s ease;

        &:hover {
          background-color: rgba(0, 0, 0, 0.05);
        }
      }

      .album-title {
        display: flex;
        align-items: baseline;
        gap: 8px;

        h2 {
          margin: 0;
          font-size: var(--font-size-lg);
          color: var(--text-primary);
        }

        .song-count {
          font-size: var(--font-size-sm);
          color: var(--text-icon);
        }
      }
    }

    .song-list-wrapper {
      flex: 1;
      overflow-y: auto;
      padding: 0 20px 20px;
    }

    .song-list {
      .song-item {
        display: flex;
        align-items: center;
        padding: 10px 12px;
        border-radius: 6px;
        cursor: pointer;
        transition: background-color 0.15s ease;

        &:hover {
          background-color: rgba(0, 0, 0, 0.03);
        }

        &.selected {
          background-color: var(--primary-color-25);
        }

        .song-index {
          width: 32px;
          font-size: var(--font-size-sm);
          color: var(--text-icon);
          text-align: center;
          flex-shrink: 0;
        }

        .song-info {
          flex: 1;
          min-width: 0;

          .song-name {
            font-size: var(--font-size-sm);
            color: var(--text-primary);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .song-meta {
            display: flex;
            justify-content: space-between;
            margin-top: 2px;
            font-size: 12px;
            color: var(--text-icon);

            .song-artist {
              flex: 1;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              margin-right: 12px;
            }

            .song-duration {
              flex-shrink: 0;
            }
          }
        }
      }
    }

    .empty-songs {
      text-align: center;
      color: var(--text-icon);
      padding: 40px 0;
    }
  }
}
</style>
