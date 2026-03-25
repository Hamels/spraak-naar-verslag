document.addEventListener('DOMContentLoaded', () => {
  const uploadCard = document.getElementById('uploadCard');
  const uploadArea = document.getElementById('uploadArea');
  const fileInput = document.getElementById('fileInput');
  const selectBtn = document.getElementById('selectBtn');
  const fileInfo = document.getElementById('fileInfo');
  const fileName = document.getElementById('fileName');
  const fileSize = document.getElementById('fileSize');
  const removeBtn = document.getElementById('removeBtn');
  const transcribeBtn = document.getElementById('transcribeBtn');
  const loadingCard = document.getElementById('loadingCard');
  const resultsWrapper = document.getElementById('resultsWrapper');
  const resultFilename = document.getElementById('resultFilename');
  const reportTitle = document.getElementById('reportTitle');
  const reportText = document.getElementById('reportText');
  const rawText = document.getElementById('rawText');
  const copyReportBtn = document.getElementById('copyReportBtn');
  const downloadReportBtn = document.getElementById('downloadReportBtn');
  const copyRawBtn = document.getElementById('copyRawBtn');
  const downloadRawBtn = document.getElementById('downloadRawBtn');
  const newBtn = document.getElementById('newBtn');
  const errorCard = document.getElementById('errorCard');
  const errorMessage = document.getElementById('errorMessage');
  const retryBtn = document.getElementById('retryBtn');
  const reportTypeSelector = document.getElementById('reportTypeSelector');
  const reportTypeSelect = document.getElementById('reportType');

  let selectedFile = null;

  // --- File Selection ---
  selectBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
  });

  uploadArea.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      handleFile(fileInput.files[0]);
    }
  });

  // --- Drag & Drop ---
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
  });

  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('drag-over');
  });

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    if (e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  });

  function handleFile(file) {
    const allowedTypes = [
      'audio/mpeg', 'audio/mp3', 'video/mp4', 'audio/mp4',
      'audio/wav', 'audio/webm', 'video/webm'
    ];
    const allowedExtensions = ['.mp3', '.mp4', '.wav', '.webm'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(ext)) {
      showError('Alleen MP3, MP4, WAV en WebM bestanden zijn toegestaan.');
      return;
    }

    selectedFile = file;
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    uploadArea.hidden = true;
    fileInfo.hidden = false;
    transcribeBtn.hidden = false;
    reportTypeSelector.hidden = false;
  }

  removeBtn.addEventListener('click', () => {
    resetUpload();
  });

  function resetUpload() {
    selectedFile = null;
    fileInput.value = '';
    uploadArea.hidden = false;
    fileInfo.hidden = true;
    transcribeBtn.hidden = true;
    reportTypeSelector.hidden = true;
  }

  // --- Transcribe ---
  transcribeBtn.addEventListener('click', async () => {
    if (!selectedFile) return;

    // Show loading
    uploadCard.hidden = true;
    errorCard.hidden = true;
    resultsWrapper.hidden = true;
    loadingCard.hidden = false;

    const formData = new FormData();
    formData.append('audioFile', selectedFile);
    formData.append('reportType', reportTypeSelect.value);

    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      loadingCard.hidden = true;

      if (!response.ok) {
        showError(data.error || 'Er is een onbekende fout opgetreden.');
        return;
      }

      // Show results
      resultFilename.textContent = `Bronbestand: ${data.filename}`;
      reportTitle.textContent = data.reportLabel;
      reportText.innerHTML = formatReport(data.report);
      rawText.textContent = data.rawText;
      resultsWrapper.hidden = false;
    } catch (err) {
      loadingCard.hidden = true;
      showError('Kan geen verbinding maken met de server. Probeer het later opnieuw.');
    }
  });

  // --- Report Actions ---
  copyReportBtn.addEventListener('click', () => {
    copyToClipboard(reportText.innerText, copyReportBtn);
  });

  downloadReportBtn.addEventListener('click', () => {
    downloadAsFile(reportText.innerText, 'verslag.txt');
  });

  // --- Raw Text Actions ---
  copyRawBtn.addEventListener('click', () => {
    copyToClipboard(rawText.textContent, copyRawBtn);
  });

  downloadRawBtn.addEventListener('click', () => {
    downloadAsFile(rawText.textContent, 'ruwe-transcriptie.txt');
  });

  // --- New Upload ---
  newBtn.addEventListener('click', () => {
    resultsWrapper.hidden = true;
    uploadCard.hidden = false;
    resetUpload();
  });

  retryBtn.addEventListener('click', () => {
    errorCard.hidden = true;
    uploadCard.hidden = false;
    resetUpload();
  });

  // --- Helpers ---
  function showError(message) {
    loadingCard.hidden = true;
    uploadCard.hidden = true;
    resultsWrapper.hidden = true;
    errorMessage.textContent = message;
    errorCard.hidden = false;
  }

  function copyToClipboard(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
      const original = btn.textContent;
      btn.textContent = 'Gekopieerd!';
      setTimeout(() => { btn.textContent = original; }, 2000);
    });
  }

  function downloadAsFile(text, filename) {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function formatReport(text) {
    return text
      .replace(/^#{1,3}\s+(.+)$/gm, '<h3>$1</h3>')
      .replace(/^\*\*(\d+\.\s+.+?)\*\*$/gm, '<h3>$1</h3>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/^[-•]\s+(.+)$/gm, '<li>$1</li>')
      .replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>')
      .replace(/<p><\/p>/g, '')
      .replace(/<p><h3>/g, '<h3>')
      .replace(/<\/h3><\/p>/g, '</h3>')
      .replace(/<p><ul>/g, '<ul>')
      .replace(/<\/ul><\/p>/g, '</ul>');
  }

  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
});
