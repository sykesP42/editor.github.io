import { ref, watch } from 'vue'

const STORAGE_KEY = 'deepseek_api_key'

const aiEnabled = ref(false)
const apiKey = ref('')
/** 正在调用 AI 续写 API、尚未返回时为 true */
const aiApiLoading = ref(false)

function loadApiKey() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) apiKey.value = saved
  } catch (_) {}
}

function saveApiKey(value) {
  try {
    localStorage.setItem(STORAGE_KEY, (value || '').trim())
  } catch (_) {}
}

loadApiKey()

watch(apiKey, (val) => {
  saveApiKey(val)
}, { immediate: false })

export function useAiContinuationSettings() {
  return {
    aiEnabled,
    apiKey,
    aiApiLoading,
    setApiKey(val) {
      apiKey.value = (val ?? '').trim()
    },
    toggleAiEnabled() {
      aiEnabled.value = !aiEnabled.value
    }
  }
}
