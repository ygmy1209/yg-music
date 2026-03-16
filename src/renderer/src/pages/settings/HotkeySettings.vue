/**
 * 快捷键设置组件
 */

<template>
  <dt class="settings-dt">软件内快捷键</dt>
  <dd class="settings-dd">
    <SettingItem :model-value="hotkeys.config.enabled" @update:model-value="hotkeys.setEnabled">
      启用
    </SettingItem>

    <div class="setting-item">
      <button class="setting-btn" style="margin-top: 10px" @click="hotkeys.resetToDefaults()">
        恢复默认快捷键
      </button>
    </div>

    <div v-if="hotkeys.isLoaded" class="hotkey-list">
      <div v-for="action in hotkeys.actionDefs" :key="action.id" class="hotkey-item">
        <span class="hotkey-name">{{ action.name }}</span>

        <div
          class="hotkey-recorder"
          :class="{ recording: recordingAction === action.id }"
          tabindex="0"
          @keydown.prevent="handleRecordKey($event, action.id)"
          @blur="cancelRecord"
          @click="startRecord(action.id)"
        >
          <template v-if="recordingAction === action.id">
            <span class="recording-tip">请按快捷键 (Esc 取消)</span>
          </template>
          <template v-else>
            <span v-if="hotkeys.config.keys[action.id]" class="hotkey-value">
              <kbd
                v-for="(part, index) in hotkeys.formatKeyCombo(hotkeys.config.keys[action.id]).split(' + ')"
                :key="index"
              >{{ part }}</kbd>
            </span>
            <span v-else class="hotkey-value empty">未设置</span>
          </template>
        </div>

        <button
          v-if="hotkeys.config.keys[action.id] && recordingAction !== action.id"
          class="hotkey-btn clear"
          @click.stop="hotkeys.clearKey(action.id)"
        >
          清除
        </button>
      </div>
    </div>
    <div v-else class="hotkey-list">
      <span>加载中...</span>
    </div>
  </dd>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useHotkeys } from '@/composables/useHotkeys'
import SettingItem from '@/components/ui/SettingItem.vue'

const hotkeys = useHotkeys()
const recordingAction = ref(null)

const startRecord = (actionId) => {
  if (recordingAction.value) return
  recordingAction.value = actionId
  hotkeys.setRecording(true)
}

const cancelRecord = () => {
  recordingAction.value = null
  hotkeys.setRecording(false)
}

const handleRecordKey = (e, actionId) => {
  e.preventDefault()

  if (e.code === 'Escape') {
    cancelRecord()
    return
  }

  const keyConfig = hotkeys.eventToKeyConfig(e)
  if (keyConfig) {
    const conflictAction = hotkeys.findConflict(actionId, keyConfig)
    if (conflictAction) {
      console.warn(`快捷键与动作 [${conflictAction}] 冲突`)
    } else {
      hotkeys.updateKey(actionId, keyConfig)
    }
    cancelRecord()
  }
}

onMounted(() => {
  hotkeys.loadConfig()
})
</script>

<style lang="scss" scoped>
.setting-item {
  padding: 6px 0;
  line-height: 1.5;
}

.setting-btn {
  padding: 4px 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: var(--bg-primary);
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--primary-color);
    color: var(--primary-color);
  }
}

.hotkey-list {
  margin-top: 15px;
}

.hotkey-item {
  display: flex;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--border-color);

  &:last-child {
    border-bottom: none;
  }
}

.hotkey-name {
  flex: 1;
  color: var(--text-primary);
}

.hotkey-recorder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 120px;
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: var(--bg-primary);
  cursor: pointer;
  outline: none;
  transition: all 0.2s ease;
  margin-right: 10px;

  &:hover {
    border-color: var(--primary-color);
  }

  &.recording {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px var(--primary-color-20);
    background-color: var(--bg-tertiary);
  }

  .recording-tip {
    font-size: 12px;
    color: var(--primary-color);
  }
}

.hotkey-value {
  display: flex;
  gap: 4px;
  align-items: center;
  pointer-events: none;

  &.empty {
    color: var(--text-icon);
    font-size: 12px;
  }

  kbd {
    display: inline-block;
    padding: 3px 6px;
    font-family: inherit;
    font-size: 12px;
    color: var(--text-primary);
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 3px;
    box-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);
  }
}

.hotkey-btn {
  padding: 2px 8px;
  border: 1px solid var(--border-color);
  border-radius: 3px;
  background-color: transparent;
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--primary-color);
    color: var(--primary-color);
  }

  &.clear {
    border-color: #ff4d4f;
    color: #ff4d4f;

    &:hover {
      background-color: #fff1f0;
    }
  }
}
</style>
