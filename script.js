/* =========================================================
   Markdown Editor - Stable Script
   - 顺序播放编辑音效
   - 音效开关（记忆）
   - MP3 音频
   ========================================================= */

/* ================= Markdown 初始化 ================= */

const md = window.markdownit({
  html: true,
  linkify: true,
  typographer: true
});

md.enable('fence');

md.set({
  highlight: function (str, lang) {
    if (!str || !str.trim()) {
      return `<pre class="hljs"><code class="language-${lang || ''}"></code></pre>`;
    }

    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre class="hljs"><code class="language-${lang}">${
          hljs.highlight(str, { language: lang }).value
        }</code></pre>`;
      } catch (e) {
        console.error(e);
      }
    }

    return `<pre class="hljs"><code>${
      md.utils.escapeHtml(str)
    }</code></pre>`;
  }
});

/* ================= 音效系统 ================= */

// 音效文件
const editAudio = new Audio('audio/edit.mp3');
const exportAudio = new Audio('audio/export.mp3');

editAudio.volume = 0.4;
exportAudio.volume = 0.6;

// 浏览器音频解锁
let audioUnlocked = false;
document.addEventListener(
  'click',
  () => {
    audioUnlocked = true;
  },
  { once: true }
);

// 音效开关（持久化）
let soundEnabled = localStorage.getItem('soundEnabled');
soundEnabled = soundEnabled === null ? true : soundEnabled === 'true';

// 编辑音效状态
let isEditSoundPlaying = false;
let editSoundPending = false;

// 播放编辑音效（顺序播放）
function playEditSound() {
  if (!audioUnlocked || !soundEnabled) return;

  // 如果正在播放，标记“有新的编辑发生”
  if (isEditSoundPlaying) {
    editSoundPending = true;
    return;
  }

  isEditSoundPlaying = true;
  editAudio.currentTime = 0;

  editAudio.play().catch(() => {
    isEditSoundPlaying = false;
  });
}

// 编辑音效播放结束
editAudio.addEventListener('ended', () => {
  isEditSoundPlaying = false;

  // 如果播放期间又发生了编辑，再播放一次
  if (editSoundPending) {
    editSoundPending = false;
    playEditSound();
  }
});

// 播放导出音效
function playExportSound() {
  if (!audioUnlocked || !soundEnabled) return;

  exportAudio.currentTime = 0;
  exportAudio.play().catch(() => {});
}

/* ================= DOM ================= */

const editor = document.getElementById('editor');
const preview = document.getElementById('preview');
const fileInput = document.getElementById('fileInput');
const exportBtn = document.getElementById('exportBtn');
const exportPdfBtn = document.getElementById('exportPdfBtn');
const themeToggle = document.getElementById('themeToggle');

// 👉 音效开关按钮（需要在 HTML 中有这个按钮）
const soundToggle = document.getElementById('soundToggle');

/* ================= 实时预览 ================= */

function renderPreview() {
  preview.innerHTML = md.render(editor.value);
}

editor.addEventListener('input', () => {
  renderPreview();
  playEditSound();
});

/* ================= 上传 Markdown ================= */

fileInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    editor.value = reader.result;
    renderPreview();
  };
  reader.readAsText(file);
});

/* ================= 导出 ================= */

exportBtn.addEventListener('click', () => {
  playExportSound();

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Markdown Export</title>
</head>
<body>
${preview.innerHTML}
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'export.html';
  a.click();

  URL.revokeObjectURL(url);
});

exportPdfBtn.addEventListener('click', () => {
  playExportSound();

  html2pdf()
    .from(preview)
    .set({
      margin: 10,
      filename: 'markdown.pdf',
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4' }
    })
    .save();
});

/* ================= 音效开关 ================= */

function updateSoundToggle() {
  soundToggle.textContent = soundEnabled ? '🔊 音效开' : '🔇 音效关';
}

updateSoundToggle();

soundToggle.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  localStorage.setItem('soundEnabled', soundEnabled);
  updateSoundToggle();
});

/* ================= 主题 ================= */

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  themeToggle.textContent =
    theme === 'dark' ? '☀️ 浅色模式' : '🌙 深色模式';
}

setTheme(localStorage.getItem('theme') || 'light');

themeToggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  setTheme(current === 'dark' ? 'light' : 'dark');
});

/* ================= 初始化 ================= */

renderPreview();
