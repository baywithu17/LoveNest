// Mini Game 3: Love Canvas (Doodle Bersama & Tebak Gambar)
class CanvasGame {
  constructor(socket) {
    this.socket = socket;
    this.canvas = null;
    this.ctx = null;
    this.isDrawing = false;
    this.currentColor = '#f43f5e';
    this.currentBrushSize = 4;
    this.isEraser = false;
    this.lastX = 0;
    this.lastY = 0;

    // Guess mode state
    this.isGuessMode = false;
    this.isDrawer = false;
    this.secretWord = '';
    this.hint = '';
    this.wordList = [
      { word: 'Mixue', hint: 'Tempat jajan minuman Milky Berry & Creamy Blueberry 🧋' },
      { word: 'Bakso Kopang', hint: 'Bakso paling juara yang disukai Ema 🍜' },
      { word: 'Mie Ayam', hint: 'Makanan berkuah gurih kesukaan Ema 🥢' },
      { word: 'Daun Mint', hint: 'Daun wangi yang langsung dicampurkan ke teh 🍃' },
      { word: 'Dragon Ball', hint: 'Anime yang udah ditonton Ema dari zaman SMP 🐉' },
      { word: 'Telur Dadar', hint: 'Lauk rumahan sederhana kesukaan Ema 🍳' },
      { word: 'Kepala Ayam', hint: 'Bagian ayam yang disukai Ema walau makannya ribet 🍗' },
      { word: 'BonCabe 50', hint: 'Snack pedas nampol level ekstrem 🌶️' },
      { word: 'Pantai', hint: 'Tempat liburan seru tapi Ema gak suka panasnya 🏖️' },
      { word: 'Kopi Dingin', hint: 'Minuman dingin dengan aroma kopi ☕' },
      { word: 'Payung', hint: 'Melindungi Bayu & Ema dari kehujanan ☔' },
      { word: 'Surat Cinta', hint: 'Ungkapan perasaan tulus yang romantis 💌' },
      { word: 'Cincin', hint: 'Simbol janji komitmen masa depan 💍' },
      { word: 'Kucing Gemoy', hint: 'Hewan lucu berbulu menggemaskan 🐱' }
    ];

    this.setupEvents();
  }

  setupEvents() {
    this.socket.on('canvas-draw-stroke', (data) => {
      this.drawRemoteStroke(data);
    });

    this.socket.on('canvas-cleared', () => {
      this.clearLocalCanvas();
    });

    this.socket.on('canvas-guess-word-assigned', ({ isDrawer, word, hint, length }) => {
      this.isGuessMode = true;
      this.isDrawer = isDrawer;
      this.secretWord = word || '';
      this.hint = hint || '';
      this.renderGuessModeHeader(length);
    });

    this.socket.on('canvas-guess-result', ({ senderName, guess, isCorrect, word }) => {
      this.handleGuessResult(senderName, guess, isCorrect, word);
    });
  }

  render() {
    const container = document.getElementById('canvasGameContainer');
    if (!container) return;

    container.innerHTML = `
      <div class="max-w-3xl mx-auto">
        <!-- Canvas Mode Switcher & Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 class="text-xl font-extrabold text-slate-800 font-serif-elegant">🎨 Love Canvas & Tebak Gambar</h3>
            <p class="text-xs text-slate-500">Gambar bersama secara realtime atau tantang tebak sketsa pasangan!</p>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="window.canvasGame.startGuessMode()" 
              class="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white shadow-sm flex items-center gap-1.5 transition-colors">
              <span>Mulai Tebak Gambar</span> 🎯
            </button>
            <button onclick="window.canvasGame.downloadCanvas()" 
              class="px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 shadow-sm flex items-center gap-1.5 transition-colors">
              <span>Simpan Gambar</span> 💾
            </button>
          </div>
        </div>

        <!-- Guess Mode Banner (Hidden until started) -->
        <div id="guessModeBanner" class="hidden mb-4 p-4 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md">
          <div class="flex items-center justify-between">
            <div id="guessModeInfo">
              <span class="text-xs uppercase tracking-wider opacity-80 font-bold">Mode Tebak Gambar</span>
              <h4 class="text-lg font-bold" id="guessWordHint">Memuat kata rahasia...</h4>
            </div>
            <div id="guessInputArea" class="flex items-center gap-2">
              <input type="text" id="guessTextInput" placeholder="Tebak kata di sini..." 
                class="px-3 py-1.5 rounded-xl text-xs text-slate-800 bg-white border-none outline-none focus:ring-2 focus:ring-white">
              <button onclick="window.canvasGame.submitGuess()" 
                class="px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-rose-600 hover:bg-rose-50 transition-colors">
                Kirim
              </button>
            </div>
          </div>
        </div>

        <!-- Canvas Card -->
        <div class="glass-panel rounded-2xl p-4 shadow-sm border border-rose-100 mb-4">
          <!-- Toolbar -->
          <div class="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-rose-100">
            <!-- Colors -->
            <div class="flex items-center gap-1.5">
              ${['#f43f5e', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#1e293b', '#ffffff'].map(c => `
                <button onclick="window.canvasGame.setColor('${c}')" 
                  class="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 shadow-xs" 
                  style="background-color: ${c}; border-color: ${c === '#ffffff' ? '#e2e8f0' : 'transparent'};"
                  id="colorBtn_${c.replace('#', '')}">
                </button>
              `).join('')}
            </div>

            <!-- Brush Size -->
            <div class="flex items-center gap-2">
              <span class="text-xs text-slate-400 font-medium">Ukuran:</span>
              <input type="range" min="2" max="24" value="4" 
                onchange="window.canvasGame.setBrushSize(this.value)" 
                class="w-20 accent-rose-500 cursor-pointer">
            </div>

            <!-- Tools: Eraser, Heart Stamp, Clear -->
            <div class="flex items-center gap-2">
              <button onclick="window.canvasGame.toggleEraser()" id="eraserBtn"
                class="px-3 py-1 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-600 hover:bg-rose-50 transition-colors">
                Penghapus 🧼
              </button>
              <button onclick="window.canvasGame.addHeartStamp()" 
                class="px-3 py-1 rounded-xl text-xs font-semibold bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors">
                Cap Hati 💖
              </button>
              <button onclick="window.canvasGame.clearCanvas()" 
                class="px-3 py-1 rounded-xl text-xs font-semibold bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors">
                Hapus Semua 🗑️
              </button>
            </div>
          </div>

          <!-- The Canvas -->
          <div class="relative bg-white rounded-xl overflow-hidden shadow-inner border border-slate-100 w-full" style="height: 380px;">
            <canvas id="drawingCanvas" class="w-full h-full block"></canvas>
          </div>
        </div>
      </div>
    `;

    setTimeout(() => this.initCanvas(), 50);
  }

  initCanvas() {
    this.canvas = document.getElementById('drawingCanvas');
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');

    // Resize canvas to actual display dimensions
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;

    // Fill white background
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Event listeners for drawing (Mouse + Touch)
    const getPos = (e) => {
      const b = this.canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: clientX - b.left,
        y: clientY - b.top
      };
    };

    const startDraw = (e) => {
      if (this.isGuessMode && !this.isDrawer) return; // Only drawer can draw in guess mode
      e.preventDefault();
      this.isDrawing = true;
      const pos = getPos(e);
      this.lastX = pos.x;
      this.lastY = pos.y;
    };

    const draw = (e) => {
      if (!this.isDrawing) return;
      e.preventDefault();
      const pos = getPos(e);

      this.drawLine(this.lastX, this.lastY, pos.x, pos.y, this.currentColor, this.currentBrushSize, this.isEraser);

      // Broadcast stroke to partner (normalized coordinates for responsive canvas)
      this.socket.emit('canvas-draw-stroke', {
        x0: this.lastX / this.canvas.width,
        y0: this.lastY / this.canvas.height,
        x1: pos.x / this.canvas.width,
        y1: pos.y / this.canvas.height,
        color: this.currentColor,
        size: this.currentBrushSize,
        isEraser: this.isEraser
      });

      this.lastX = pos.x;
      this.lastY = pos.y;
    };

    const stopDraw = () => {
      this.isDrawing = false;
    };

    this.canvas.addEventListener('mousedown', startDraw);
    this.canvas.addEventListener('mousemove', draw);
    window.addEventListener('mouseup', stopDraw);

    this.canvas.addEventListener('touchstart', startDraw, { passive: false });
    this.canvas.addEventListener('touchmove', draw, { passive: false });
    window.addEventListener('touchend', stopDraw);
  }

  drawLine(x0, y0, x1, y1, color, size, isEraser) {
    if (!this.ctx) return;
    this.ctx.beginPath();
    this.ctx.moveTo(x0, y0);
    this.ctx.lineTo(x1, y1);
    this.ctx.strokeStyle = isEraser ? '#ffffff' : color;
    this.ctx.lineWidth = size;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.stroke();
  }

  drawRemoteStroke(data) {
    if (!this.ctx || !this.canvas) return;
    if (data.isStamp) {
      const cx = data.x0 * this.canvas.width;
      const cy = data.y0 * this.canvas.height;
      this.ctx.font = '36px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText('💖', cx, cy);
      return;
    }
    const x0 = data.x0 * this.canvas.width;
    const y0 = data.y0 * this.canvas.height;
    const x1 = data.x1 * this.canvas.width;
    const y1 = data.y1 * this.canvas.height;
    this.drawLine(x0, y0, x1, y1, data.color, data.size, data.isEraser);
  }

  setColor(c) {
    this.currentColor = c;
    this.isEraser = false;
    const eraserBtn = document.getElementById('eraserBtn');
    if (eraserBtn) eraserBtn.classList.remove('bg-rose-500', 'text-white');
  }

  setBrushSize(s) {
    this.currentBrushSize = parseInt(s, 10);
  }

  toggleEraser() {
    this.isEraser = !this.isEraser;
    const eraserBtn = document.getElementById('eraserBtn');
    if (eraserBtn) {
      if (this.isEraser) {
        eraserBtn.classList.add('bg-rose-500', 'text-white');
      } else {
        eraserBtn.classList.remove('bg-rose-500', 'text-white');
      }
    }
  }

  addHeartStamp() {
    if (!this.ctx || !this.canvas) return;
    const cx = this.canvas.width / 2 + (Math.random() * 80 - 40);
    const cy = this.canvas.height / 2 + (Math.random() * 80 - 40);

    this.ctx.font = '36px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('💖', cx, cy);

    // Broadcast stamp
    this.socket.emit('canvas-draw-stroke', {
      x0: cx / this.canvas.width,
      y0: cy / this.canvas.height,
      x1: cx / this.canvas.width,
      y1: cy / this.canvas.height,
      color: '#f43f5e',
      size: 36,
      isStamp: true
    });

    if (window.soundController) window.soundController.playPop();
  }

  clearCanvas() {
    this.clearLocalCanvas();
    this.socket.emit('canvas-clear');
  }

  clearLocalCanvas() {
    if (!this.ctx || !this.canvas) return;
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  downloadCanvas() {
    if (!this.canvas) return;
    const link = document.createElement('a');
    link.download = `karya-cinta-kita-${Date.now()}.png`;
    link.href = this.canvas.toDataURL('image/png');
    link.click();
  }

  startGuessMode() {
    const randomItem = this.wordList[Math.floor(Math.random() * this.wordList.length)];
    this.clearCanvas();
    this.socket.emit('canvas-start-guess', {
      drawerId: this.socket.id,
      word: randomItem.word,
      hint: randomItem.hint
    });
  }

  renderGuessModeHeader(wordLength) {
    const banner = document.getElementById('guessModeBanner');
    const wordHint = document.getElementById('guessWordHint');
    const inputArea = document.getElementById('guessInputArea');

    if (!banner || !wordHint) return;
    banner.classList.remove('hidden');

    if (this.isDrawer) {
      wordHint.innerHTML = `Kamu Menggambar: <span class="underline decoration-wavy decoration-white">${this.secretWord}</span> <span class="text-xs font-normal opacity-90">(${this.hint})</span>`;
      if (inputArea) inputArea.classList.add('hidden');
    } else {
      const blanks = '_ '.repeat(wordLength).trim();
      wordHint.innerHTML = `Tebak Objek (${wordLength} huruf): <span class="tracking-widest font-mono text-xl">${blanks}</span> <span class="text-xs font-normal opacity-90">Petunjuk: ${this.hint}</span>`;
      if (inputArea) inputArea.classList.remove('hidden');
    }
  }

  submitGuess() {
    const input = document.getElementById('guessTextInput');
    if (!input || !input.value.trim()) return;
    const guess = input.value.trim();
    input.value = '';
    this.socket.emit('canvas-submit-guess', { guess });
  }

  handleGuessResult(senderName, guess, isCorrect, word) {
    if (isCorrect) {
      if (window.soundController) window.soundController.playMatchFanfare();
      if (window.triggerConfetti) window.triggerConfetti();

      alert(`🎉 HEBAT! ${senderName} berhasil menebak kata: "${word}" dengan tepat! 💕`);
      const banner = document.getElementById('guessModeBanner');
      if (banner) banner.classList.add('hidden');
      this.isGuessMode = false;
    } else {
      if (window.soundController) window.soundController.playMissSound();
      // Inform in chat or notification
      const input = document.getElementById('guessTextInput');
      if (input) input.placeholder = `"${guess}" salah, coba lagi!`;
    }
  }
}

window.CanvasGame = CanvasGame;
