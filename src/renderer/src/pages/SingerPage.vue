/**
 * 歌手页面
 * 采用文字主导的简约设计，去除了不准确的歌曲封面头像
 */

<template>
  <div class="singer-page">
    <!-- 歌手列表视图 -->
    <template v-if="!singerStore.isInSingerDetail">
      <div class="page-header">
        <h2>歌手</h2>
        <span class="singer-count">{{ singerStore.singers.length }} 位歌手</span>
      </div>

      <div class="singer-grid-container">
        <div v-if="singerStore.singers.length === 0" class="empty-tip">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
            <path d="m11 7.601-5.994 8.19a1 1 0 0 0 .1 1.298l.817.818a1 1 0 0 0 1.314.087L15.09 12"/>
            <path d="M16.5 21.174C15.5 20.5 14.372 20 13 20c-2.058 0-3.928 2.356-6 2-2.072-.356-2.775-3.369-1.5-4.5"/>
            <circle cx="16" cy="7" r="5"/>
          </svg>
          <p>暂无歌手</p>
          <p class="sub-text">添加音乐后将自动识别歌手信息</p>
        </div>

        <div v-else class="singer-list">
          <div
            v-for="singer in singerStore.singers"
            :key="singer.name"
            class="singer-card"
            @click="handleSingerClick(singer)"
          >
            <div class="singer-icon-box">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m11 7.601-5.994 8.19a1 1 0 0 0 .1 1.298l.817.818a1 1 0 0 0 1.314.087L15.09 12"/>
                <path d="M16.5 21.174C15.5 20.5 14.372 20 13 20c-2.058 0-3.928 2.356-6 2-2.072-.356-2.775-3.369-1.5-4.5"/>
                <circle cx="16" cy="7" r="5"/>
              </svg>
            </div>
            <div class="singer-info">
              <div class="singer-name">{{ singer.name }}</div>
              <div class="singer-meta">{{ singer.songCount }} 首歌曲</div>
            </div>
            <div class="arrow-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 歌手详情视图 -->
    <template v-else>
      <div class="singer-detail">
        <div class="detail-header">
          <button class="back-btn" @click="handleBack">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div class="singer-title">
            <h2>{{ singerStore.currentSinger?.name }}</h2>
            <span class="song-count">{{ singerStore.currentSingerSongs.length }} 首歌曲</span>
          </div>
        </div>

        <div class="song-list-wrapper">
          <div class="song-list">
            <div
              v-for="(song, index) in singerStore.currentSingerSongs"
              :key="song.id"
              class="song-item"
              :class="{ selected: singerStore.isSelected(song.id) }"
              @click="handleSongClick($event, song, index)"
              @dblclick="handlePlaySong(song)"
            >
              <div class="song-index">{{ index + 1 }}</div>
              <div class="song-info">
                <div class="song-name">{{ song.name }}</div>
                <div class="song-meta">
                  <span class="song-album">{{ song.album }}</span>
                  <span v-if="song.duration" class="song-duration">{{ song.duration }}</span>
                </div>
              </div>
            </div>
          </div>

          <div v-if="singerStore.currentSingerSongs.length === 0" class="empty-songs">
            暂无歌曲
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useSingerStore } from '@/stores/singerStore'
import { usePlayerStore } from '@/stores/playerStore'

const singerStore = useSingerStore()
const playerStore = usePlayerStore()

// 键盘状态
const isCtrlPressed = ref(false)
const isShiftPressed = ref(false)

// 初始化
onMounted(() => {
  singerStore.init()
  document.addEventListener('keydown', handleKeyDown)
  document.addEventListener('keyup', handleKeyUp)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
  document.removeEventListener('keyup', handleKeyUp)
})

// 键盘事件
const handleKeyDown = (e) => {
  if (e.key === 'Control') isCtrlPressed.value = true
  if (e.key === 'Shift') isShiftPressed.value = true

  if (e.key === 'a' && e.ctrlKey && singerStore.isInSingerDetail) {
    e.preventDefault()
    if (singerStore.selectedSongCount === singerStore.currentSingerSongs.length) {
      singerStore.clearSelection()
    } else {
      singerStore.selectAll()
    }
  }
}

const handleKeyUp = (e) => {
  if (e.key === 'Control') isCtrlPressed.value = false
  if (e.key === 'Shift') isShiftPressed.value = false
}

const handleSingerClick = (singer) => {
  singerStore.selectSinger(singer)
}

const handleBack = () => {
  singerStore.backToSingerList()
}

const handleSongClick = (event, song, index) => {
  if (event.button !== 0) return

  if (isCtrlPressed.value) {
    singerStore.toggleSelection(song.id)
  } else if (isShiftPressed.value && singerStore.lastSelectedIndex >= 0) {
    singerStore.selectRange(singerStore.lastSelectedIndex, index)
  } else {
    singerStore.selectSingle(song.id)
  }

  singerStore.lastSelectedIndex = index
}

const handlePlaySong = (song) => {
  playerStore.setPlaylist([...singerStore.currentSingerSongs])
  playerStore.setCurrentSingerName(singerStore.currentSinger?.name)
  playerStore.setCurrentSong(song)
}
</script>

<style lang="scss" scoped>
.singer-page {
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

    .singer-count {
      font-size: var(--font-size-sm);
      color: var(--text-icon);
    }
  }

  .singer-grid-container {
    flex: 1;
    overflow-y: auto;
    padding: 0 20px 20px;
  }

  .singer-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }

  .singer-card {
    display: flex;
    align-items: center;
    padding: 16px 20px;
    background: var(--glass);
    border: 1px solid var(--glass-border);
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.2s ease;
    gap: 16px;

    &:hover {
      background: var(--primary-color-10);
      border-color: var(--primary-color-30);
      transform: translateY(-2px);

      .singer-icon-box {
        background: var(--primary-color);
        color: #fff;
      }

      .arrow-icon {
        transform: translateX(4px);
        color: var(--primary-color);
      }
    }

    .singer-icon-box {
      width: 48px;
      height: 48px;
      display: flex;
      justify-content: center;
      align-items: center;
      background: var(--glass-border);
      color: var(--text-icon);
      border-radius: 12px;
      transition: all 0.3s ease;
      flex-shrink: 0;

      svg {
        width: 24px;
        height: 24px;
      }
    }

    .singer-info {
      flex: 1;
      min-width: 0;

      .singer-name {
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-primary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        margin-bottom: 4px;
      }

      .singer-meta {
        font-size: 13px;
        color: var(--text-icon);
      }
    }

    .arrow-icon {
      color: var(--text-icon);
      opacity: 0.5;
      transition: all 0.2s ease;
    }
  }

  .empty-tip {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
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

  .singer-detail {
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

      .singer-title {
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

            .song-album {
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
