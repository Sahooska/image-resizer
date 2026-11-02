/* ========================================================
   1. PROCEDURAL SOUND SYNTHESIZER (Pure Web Audio API)
   ======================================================== */
const AudioSynth = {
  enabled: true,
  ctx: null,

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
  },

  play(type) {
    if (!this.enabled) return;
    this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    if (type === 'hover') {
      // Soft high tick
      osc.type = 'sine';
      osc.frequency.setValueAtTime(620, t);
      osc.frequency.exponentialRampToValueAtTime(740, t + 0.03);
      gain.gain.setValueAtTime(0.02, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
      osc.start(t);
      osc.stop(t + 0.03);
    } 
    else if (type === 'click') {
      // Clean modern pop
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(420, t);
      osc.frequency.exponentialRampToValueAtTime(160, t + 0.06);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
      osc.start(t);
      osc.stop(t + 0.06);
    } 
    else if (type === 'process') {
      // Sleek ascending confirmation hum
      osc.type = 'sine';
      osc.frequency.setValueAtTime(280, t);
      osc.frequency.exponentialRampToValueAtTime(560, t + 0.18);
      gain.gain.setValueAtTime(0.06, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
      osc.start(t);
      osc.stop(t + 0.2);
    } 
    else if (type === 'download') {
      // Pleasant twin-chime chord
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const chordOsc = this.ctx.createOscillator();
        const chordGain = this.ctx.createGain();
        chordOsc.type = 'sine';
        chordOsc.frequency.setValueAtTime(freq, t + idx * 0.07);
        chordGain.gain.setValueAtTime(0.05, t + idx * 0.07);
        chordGain.gain.exponentialRampToValueAtTime(0.0001, t + idx * 0.07 + 0.25);
        chordOsc.connect(chordGain);
        chordGain.connect(this.ctx.destination);
        chordOsc.start(t + idx * 0.07);
        chordOsc.stop(t + idx * 0.07 + 0.25);
      });
    }
  }
};

// Sound toggle button
const soundToggle = document.getElementById('soundToggle');
const soundStatus = document.getElementById('soundStatus');
soundToggle.addEventListener('click', () => {
  AudioSynth.enabled = !AudioSynth.enabled;
  soundStatus.innerText = AudioSynth.enabled ? 'ACTIVE' : 'MUTED';
  soundStatus.parentElement.style.opacity = AudioSynth.enabled ? '1' : '0.6';
});

/* ========================================================
   2. INTERACTIVE CLICK BUBBLE BURST PARTICLES
   ======================================================== */
const colors = ['#6366f1', '#3b82f6', '#06b6d4', '#10b981', '#a855f7'];

function spawnClickBubbles(x, y) {
  const particleCount = 8;
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'click-particle';
    
    const size = Math.floor(Math.random() * 9 + 6);
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.background = colors[Math.floor(Math.random() * colors.length)];
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;

    const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5);
    const distance = Math.random() * 45 + 25;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance;

    particle.style.setProperty('--dx', `${dx}px`);
    particle.style.setProperty('--dy', `${dy}px`);

    document.body.appendChild(particle);
    setTimeout(() => particle.remove(), 650);
  }
}

// Global click & hover binders
window.addEventListener('click', (e) => {
  spawnClickBubbles(e.clientX, e.clientY);
  AudioSynth.play('click');
});

document.querySelectorAll('[data-hover]').forEach((el) => {
  el.addEventListener('mouseenter', () => AudioSynth.play('hover'));
});

/* ========================================================
   3. DOM HOOKS & IMAGE WORKFLOW
   ======================================================== */
const dropArea = document.getElementById('dropArea');
const fileInput = document.getElementById('fileInput');
const uploadPrompt = document.getElementById('uploadPrompt');
const imageFrame = document.getElementById('imageFrame');
const previewImg = document.getElementById('previewImg');

const metricsPanel = document.getElementById('metricsPanel');
const origSizeText = document.getElementById('origSize');
const origDimText = document.getElementById('origDim');
const outputStatusText = document.getElementById('outputStatus');

const presetSelect = document.getElementById('presetSelect');
const imgWidth = document.getElementById('imgWidth');
const imgHeight = document.getElementById('imgHeight');
const aspectRatio = document.getElementById('aspectRatio');
const targetKB = document.getElementById('targetKB');

const brightnessSlider = document.getElementById('brightness');
const contrastSlider = document.getElementById('contrast');
const brightVal = document.getElementById('brightVal');
const contrastVal = document.getElementById('contrastVal');
const cleanSignBtn = document.getElementById('cleanSignBtn');
const rotateBtn = document.getElementById('rotateBtn');
const resetAdjustBtn = document.getElementById('resetAdjustBtn');

const processBtn = document.getElementById('processBtn');
const downloadBtn = document.getElementById('downloadBtn');

let originalImage = new Image();
let originalRatio = 1;
let rotation = 0;
let processedBlob = null;

// Trigger upload file picker
dropArea.addEventListener('click', (e) => {
  if (e.target.tagName !== 'INPUT') fileInput.click();
});

// Drag & drop interactions
['dragenter', 'dragover'].forEach((eventName) => {
  dropArea.addEventListener(eventName, (e) => {
    e.preventDefault();
    dropArea.style.borderColor = '#6366f1';
    dropArea.style.background = '#e0e7ff';
  });
});

['dragleave', 'drop'].forEach((eventName) => {
  dropArea.addEventListener(eventName, (e) => {
    e.preventDefault();
    dropArea.style.borderColor = '#cbd5e1';
    dropArea.style.background = '';
  });
});

dropArea.addEventListener('drop', (e) => {
  const file = e.dataTransfer.files[0];
  if (file) handleIncomingFile(file);
});

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) handleIncomingFile(file);
});

function handleIncomingFile(file) {
  const kb = (file.size / 1024).toFixed(1);
  origSizeText.innerText = `${kb} KB`;

  const reader = new FileReader();
  reader.onload = (e) => {
    originalImage.src = e.target.result;
    originalImage.onload = () => {
      previewImg.src = originalImage.src;
      uploadPrompt.style.display = 'none';
      imageFrame.style.display = 'flex';
      metricsPanel.style.display = 'grid';

      imgWidth.value = originalImage.naturalWidth;
      imgHeight.value = originalImage.naturalHeight;
      originalRatio = originalImage.naturalWidth / originalImage.naturalHeight;
      origDimText.innerText = `${originalImage.naturalWidth} x ${originalImage.naturalHeight} px`;

      outputStatusText.innerText = 'Ready to Process';
      outputStatusText.parentElement.classList.remove('accent');
      downloadBtn.disabled = true;
      resetAdjustments();
    };
  };
  reader.readAsDataURL(file);
}

/* ========================================================
   4. RATIO PRESERVATION & PRESET HANDLING
   ======================================================== */
imgWidth.addEventListener('input', () => {
  if (aspectRatio.checked && originalRatio) {
    imgHeight.value = Math.round(imgWidth.value / originalRatio);
  }
});

imgHeight.addEventListener('input', () => {
  if (aspectRatio.checked && originalRatio) {
    imgWidth.value = Math.round(imgHeight.value * originalRatio);
  }
});

presetSelect.addEventListener('change', (e) => {
  const val = e.target.value;
  if (val === 'ssc_photo' || val === 'ibps_photo') {
    imgWidth.value = 200;
    imgHeight.value = 230;
    targetKB.value = 45;
    aspectRatio.checked = false;
  } else if (val === 'ssc_sign' || val === 'ibps_sign') {
    imgWidth.value = 140;
    imgHeight.value = 60;
    targetKB.value = 18;
    aspectRatio.checked = false;
  } else if (val === 'upsc_photo') {
    imgWidth.value = 350;
    imgHeight.value = 350;
    targetKB.value = 90;
    aspectRatio.checked = true;
  } else if (val === 'rrb_photo') {
    imgWidth.value = 240;
    imgHeight.value = 320;
    targetKB.value = 45;
    aspectRatio.checked = false;
  }
});

/* ========================================================
   5. VISUAL TUNER (FILTERS & ROTATION)
   ======================================================== */
function applyLiveFilters() {
  previewImg.style.transform = `rotate(${rotation}deg)`;
  previewImg.style.filter = `brightness(${brightnessSlider.value}%) contrast(${contrastSlider.value}%)`;
  brightVal.innerText = `${brightnessSlider.value}%`;
  contrastVal.innerText = `${contrastSlider.value}%`;
}

brightnessSlider.addEventListener('input', applyLiveFilters);
contrastSlider.addEventListener('input', applyLiveFilters);

rotateBtn.addEventListener('click', () => {
  rotation = (rotation + 90) % 360;
  applyLiveFilters();
});

cleanSignBtn.addEventListener('click', () => {
  brightnessSlider.value = 125;
  contrastSlider.value = 165;
  applyLiveFilters();
});

function resetAdjustments() {
  rotation = 0;
  brightnessSlider.value = 100;
  contrastSlider.value = 100;
  applyLiveFilters();
}
resetAdjustBtn.addEventListener('click', resetAdjustments);

/* ========================================================
   6. BINARY-SEARCH COMPRESSION ENGINE
   ======================================================== */
processBtn.addEventListener('click', async () => {
  if (!originalImage.src) return alert('Please upload an image first!');

  AudioSynth.play('process');
  outputStatusText.innerText = 'Compressing...';
  downloadBtn.disabled = true;

  const targetW = parseInt(imgWidth.value) || originalImage.naturalWidth;
  const targetH = parseInt(imgHeight.value) || originalImage.naturalHeight;
  const maxKB = parseFloat(targetKB.value) || 50;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (rotation % 180 !== 0) {
    canvas.width = targetH;
    canvas.height = targetW;
  } else {
    canvas.width = targetW;
    canvas.height = targetH;
  }

  ctx.filter = `brightness(${brightnessSlider.value}%) contrast(${contrastSlider.value}%)`;
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.drawImage(originalImage, -targetW / 2, -targetH / 2, targetW, targetH);

  // Binary search for exact target KB
  let minQ = 0.02, maxQ = 0.98, bestBlob = null;
  for (let i = 0; i < 9; i++) {
    const midQ = (minQ + maxQ) / 2;
    const blob = await new Promise((res) => canvas.toBlob((b) => res(b), 'image/jpeg', midQ));
    bestBlob = blob;
    if (blob.size / 1024 > maxKB) {
      maxQ = midQ;
    } else {
      minQ = midQ;
    }
  }

  processedBlob = bestBlob;
  const finalKB = (processedBlob.size / 1024).toFixed(1);
  outputStatusText.innerText = `${finalKB} KB (≤ ${maxKB} KB)`;
  outputStatusText.parentElement.classList.add('accent');

  previewImg.src = URL.createObjectURL(processedBlob);
  downloadBtn.disabled = false;
});

/* ========================================================
   7. DOWNLOAD PROCESSOR
   ======================================================== */
downloadBtn.addEventListener('click', () => {
  if (!processedBlob) return;
  AudioSynth.play('download');

  const link = document.createElement('a');
  link.href = URL.createObjectURL(processedBlob);
  link.download = `Exam_${imgWidth.value}x${imgHeight.value}.jpg`;
  link.click();
});
