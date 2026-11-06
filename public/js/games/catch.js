// Mini Game 4: Love Catch (Co-op Reflex Game)
class CatchGame {
  constructor(socket) {
    this.socket = socket;
    this.isPlaying = false;
    this.totalScore = 0;
    this.activeItems = new Map();

    this.setupEvents();
  }

  setupEvents() {
    this.socket.on('catch-game-started', () => {
      this.initGameUI();
    });

    this.socket.on('catch-spawn-item', (itemData) => {
      this.spawnItemOnArena(itemData);
    });

    this.socket.on('catch-timer-tick', ({ timeLeft }) => {
      const timeDisplay = document.getElementById('catchTimeDisplay');
      if (timeDisplay) timeDisplay.textContent = `${timeLeft}s`;
    });

    this.socket.on('catch-item-collected', ({ itemId, points, itemType, newTotalScore, collectorName, collectorId }) => {
      this.handleItemCollected(itemId, points, itemType, newTotalScore, collectorName, collectorId);
    });

    this.socket.on('catch-game-ended', ({ totalScore }) => {
      this.showGameOver(totalScore);
    });
  }

  render() {
    const container = document.getElementById('catchGameContainer');
    if (!container) return;

    container.innerHTML = `
      <div class="max-w-2xl mx-auto">
        <!-- Catch Header -->
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-xl font-extrabold text-slate-800 font-serif-elegant">💖 Love Catch: Tangkap Hati</h3>
            <p class="text-xs text-slate-500">Kerjasama tangkap hati & kado jatuh selama 30 detik!</p>
          </div>
          <div class="flex items-center gap-3">
            <div class="px-4 py-2 rounded-xl bg-rose-50 border border-rose-200 text-center">
              <span class="block text-xs text-rose-500 font-bold uppercase">Skor Bersama</span>
              <span class="text-xl font-extrabold text-rose-600" id="catchScoreDisplay">0</span>
            </div>
            <div class="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-center">
              <span class="block text-xs text-slate-500 font-bold uppercase">Waktu</span>
              <span class="text-xl font-extrabold text-slate-700" id="catchTimeDisplay">30s</span>
            </div>
          </div>
        </div>

        <!-- Catch Arena -->
        <div id="catchArena" class="relative w-full h-[400px] rounded-2xl glass-panel border-2 border-rose-200 overflow-hidden bg-gradient-to-b from-rose-50/50 via-pink-50/30 to-purple-50/40 select-none shadow-inner">
          <!-- Start Overlay -->
          <div id="catchStartOverlay" class="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-xs z-20">
            <div class="w-16 h-16 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center text-3xl mb-3 shadow-md">
              💖
            </div>
            <h4 class="text-lg font-bold text-slate-800 mb-1">Siap Uji Kecepatan Jari Kalian?</h4>
            <p class="text-xs text-slate-500 mb-5 max-w-xs text-center">
              Sentuh hati 💖 (+10), bintang 🌟 (+25), kado 🎁 (+50). Awas jebakan hati patah 💔 (-15)!
            </p>
            <button onclick="window.catchGame.requestStart()" 
              class="px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-sm shadow-md hover:from-rose-600 hover:to-pink-600 transform hover:scale-105 transition-all">
              Mulai Permainan 🚀
            </button>
          </div>

          <!-- Game Over Modal (Hidden) -->
          <div id="catchEndOverlay" class="hidden absolute inset-0 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm z-30 p-6 text-center">
            <div class="text-5xl mb-2" id="catchEndIcon">👑</div>
            <h4 class="text-2xl font-extrabold text-slate-800 mb-1 font-serif-elegant">Waktu Habis!</h4>
            <p class="text-xs text-slate-500 mb-3">Total Skor Kebersamaan Kalian:</p>
            <div class="text-4xl font-extrabold text-rose-600 mb-2" id="catchFinalScore">0</div>
            <div class="px-4 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold text-sm mb-6" id="catchCoupleTitle">
              Pasangan Kompak 💕
            </div>
            <button onclick="window.catchGame.requestStart()" 
              class="px-6 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-md transition-all">
              Main Sekali Lagi 🔄
            </button>
          </div>
        </div>
      </div>
    `;
  }

  requestStart() {
    this.socket.emit('catch-start-game');
  }

  initGameUI() {
    this.isPlaying = true;
    this.totalScore = 0;
    this.activeItems.clear();

    const startOverlay = document.getElementById('catchStartOverlay');
    const endOverlay = document.getElementById('catchEndOverlay');
    const scoreDisplay = document.getElementById('catchScoreDisplay');
    const timeDisplay = document.getElementById('catchTimeDisplay');
    const arena = document.getElementById('catchArena');

    if (startOverlay) startOverlay.classList.add('hidden');
    if (endOverlay) endOverlay.classList.add('hidden');
    if (scoreDisplay) scoreDisplay.textContent = '0';
    if (timeDisplay) timeDisplay.textContent = '30s';

    if (arena) {
      arena.querySelectorAll('.falling-game-item').forEach(el => el.remove());
    }
  }

  spawnItemOnArena(itemData) {
    if (!this.isPlaying) return;
    const arena = document.getElementById('catchArena');
    if (!arena) return;

    const itemEl = document.createElement('div');
    itemEl.id = itemData.itemId;
    itemEl.className = 'falling-game-item absolute text-3xl cursor-pointer select-none transition-transform hover:scale-125 z-10';
    itemEl.style.left = `${itemData.posX}%`;
    itemEl.style.top = `-40px`;
    itemEl.style.transition = `top ${itemData.duration}s linear`;
    itemEl.textContent = itemData.emoji;

    itemEl.onpointerdown = (e) => {
      e.stopPropagation();
      this.collectItem(itemData.itemId, itemData.points, itemData.emoji);
    };

    arena.appendChild(itemEl);
    this.activeItems.set(itemData.itemId, itemEl);

    // Trigger fall animation
    setTimeout(() => {
      if (itemEl.parentElement) {
        itemEl.style.top = `${arena.clientHeight + 20}px`;
      }
    }, 20);

    // Clean up if not clicked
    setTimeout(() => {
      if (this.activeItems.has(itemData.itemId)) {
        this.activeItems.delete(itemData.itemId);
        itemEl.remove();
      }
    }, itemData.duration * 1000 + 200);
  }

  collectItem(itemId, points, itemType) {
    if (!this.isPlaying) return;
    this.socket.emit('catch-item-collected', { itemId, points, itemType });
  }

  handleItemCollected(itemId, points, itemType, newTotalScore, collectorName, collectorId) {
    const itemEl = this.activeItems.get(itemId);
    if (itemEl && itemEl.parentElement) {
      const floatEl = document.createElement('div');
      floatEl.className = `absolute text-xs font-bold pointer-events-none animate-bounce ${points > 0 ? 'text-rose-600' : 'text-slate-600'}`;
      floatEl.style.left = itemEl.style.left;
      floatEl.style.top = itemEl.style.top;
      floatEl.textContent = `${points > 0 ? '+' : ''}${points} (${collectorName})`;
      itemEl.parentElement.appendChild(floatEl);
      setTimeout(() => floatEl.remove(), 800);

      itemEl.remove();
      this.activeItems.delete(itemId);
    }

    this.totalScore = newTotalScore;
    const scoreDisplay = document.getElementById('catchScoreDisplay');
    if (scoreDisplay) scoreDisplay.textContent = this.totalScore;

    if (points > 0 && window.soundController) {
      window.soundController.playCatchDing();
    } else if (points < 0 && window.soundController) {
      window.soundController.playMissSound();
    }
  }

  showGameOver(finalScore) {
    this.isPlaying = false;
    const endOverlay = document.getElementById('catchEndOverlay');
    const finalScoreEl = document.getElementById('catchFinalScore');
    const titleEl = document.getElementById('catchCoupleTitle');
    const iconEl = document.getElementById('catchEndIcon');

    if (finalScoreEl) finalScoreEl.textContent = finalScore;

    let title = 'Pasangan Gemoy 🐣';
    let icon = '🐣';

    if (finalScore >= 500) {
      title = '👑 Pasangan Idaman Abadi: Chemistry Sempurna!';
      icon = '💖';
    } else if (finalScore >= 350) {
      title = '🔥 Duo Kompak Maksimal: Soulmate Sejati!';
      icon = '🥰';
    } else if (finalScore >= 180) {
      title = '✨ Pasangan Harmonis & Saling Mendukung!';
      icon = '💑';
    }

    if (titleEl) titleEl.textContent = title;
    if (iconEl) iconEl.textContent = icon;
    if (endOverlay) endOverlay.classList.remove('hidden');

    if (window.soundController) window.soundController.playMatchFanfare();
    if (window.triggerConfetti) window.triggerConfetti();
  }
}

window.CatchGame = CatchGame;
