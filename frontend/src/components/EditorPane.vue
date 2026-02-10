<template>
  <div class="editor-container">
    <textarea
      ref="editorRef"
      id="editor"
      :value="modelValue"
      @input="emit('update:modelValue', $event.target.value)"
      @scroll="syncPreviewToEditor"
      placeholder="在此输入 Markdown..."
      spellcheck="false"
    />
    <div ref="previewRef" id="preview" v-html="previewContent" @scroll="syncEditorToPreview"></div>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'

defineProps({
  modelValue: { type: String, default: '' },
  previewContent: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue'])

const editorRef = ref(null)
const previewRef = ref(null)
const syncingFromEditor = ref(false)
const syncingFromPreview = ref(false)

function syncPreviewToEditor() {
  if (syncingFromPreview.value) return
  const ed = editorRef.value
  const pr = previewRef.value
  if (!ed || !pr) return
  const edMax = ed.scrollHeight - ed.clientHeight
  const prMax = pr.scrollHeight - pr.clientHeight
  if (edMax <= 0 || prMax <= 0) return
  const ratio = ed.scrollTop / edMax
  syncingFromEditor.value = true
  pr.scrollTop = ratio * prMax
  syncingFromEditor.value = false
}

function syncEditorToPreview() {
  if (syncingFromEditor.value) return
  const ed = editorRef.value
  const pr = previewRef.value
  if (!ed || !pr) return
  const edMax = ed.scrollHeight - ed.clientHeight
  const prMax = pr.scrollHeight - pr.clientHeight
  if (edMax <= 0 || prMax <= 0) return
  const ratio = pr.scrollTop / prMax
  syncingFromPreview.value = true
  ed.scrollTop = ratio * edMax
  syncingFromPreview.value = false
}

onUnmounted(() => {
  editorRef.value = null
  previewRef.value = null
})
</script>
