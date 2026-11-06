// Merged Module: Arcade & Kreativitas (Playground Hub)
// Menggabungkan: Love Canvas (Doodle Bersama & Tebak Gambar) & Love Catch (Reflex Co-op 30s)
class ArcadeHub {
  constructor(socket) {
    this.socket = socket;
    this.activeMode = 'canvas'; // 'canvas', 'catch'

    this.modes = [
      { id: 'canvas', name: '🎨 Love Canvas & Tebak Gambar', desc: 'Corat-coret realtime atau tebak sketsa rahasia!' },
      { id: 'catch', name: '💖 Love Catch (Reflex 30s)', desc: 'Kerjasama tangkap hati & kado jatuh selama 30 detik!' }
    ];

    this.setupEvents();
  }

  setupEvents() {
    this.socket.on('arcade-submode-switched', ({ mode }) => {
      this.applySubmode(mode);
    });
  }

  switchMode(modeId) {
    this.socket.emit('arcade-submode-switch', { mode: modeId });
  }

  applySubmode(modeId) {
    this.activeMode = modeId;

    // Update segmented pill UI
    document.querySelectorAll('.arcade-sub-tab').forEach(btn => {
      if (btn.dataset.submode === modeId) {
        btn.classList.add('bg-white', 'text-rose-600', 'shadow-sm', 'font-extrabold');
        btn.classList.remove('text-slate-600', 'hover:text-slate-800');
      } else {
        btn.classList.remove('bg-white', 'text-rose-600', 'shadow-sm', 'font-extrabold');
        btn.classList.add('text-slate-600', 'hover:text-slate-800');
      }
    });

    // Toggle sub-containers
    const subCanvas = document.getElementById('subview_canvas');
    const subCatch = document.getElementById('subview_catch');

    if (subCanvas) subCanvas.classList.toggle('hidden', modeId !== 'canvas');
    if (subCatch) subCatch.classList.toggle('hidden', modeId !== 'catch');

    // Trigger sub-game render
    if (modeId === 'canvas' && window.canvasGame) {
      window.canvasGame.render();
    } else if (modeId === 'catch' && window.catchGame) {
      window.catchGame.render();
    }

    if (window.soundController) window.soundController.playPop();
  }

  render() {
    const container = document.getElementById('arcadeHubGameContainer');
    if (!container) return;

    container.innerHTML = `
      <div class="max-w-4xl mx-auto space-y-6">
        
        <!-- Header Banner with Chibi Art -->
        <div class="p-4 sm:p-5 rounded-3xl bg-white/90 border border-emerald-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div class="flex items-center gap-3.5">
            <img src="/images/arcade-chibi.jpg" alt="Arcade Chibi" 
              class="w-16 h-16 rounded-2xl object-cover shadow-md border-2 border-emerald-300 ring-2 ring-emerald-100 shrink-0">
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-lg sm:text-xl font-extrabold text-slate-800 font-serif-elegant">Arcade & Kreativitas</h3>
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-700 uppercase tracking-wider">2 Mode Merger 🕹️</span>
              </div>
              <p class="text-xs text-slate-500 mt-0.5">Asah kreativitas menggambar berdua dan kekompakan refleks cepat 30 detik!</p>
            </div>
          </div>

          <button onclick="switchTab('lobby')" 
            class="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition-colors shrink-0 flex items-center gap-1.5">
            <span>← Beranda</span>
          </button>
        </div>

        <!-- Segmented Mode Control (Pills) -->
        <div class="p-1.5 rounded-2xl bg-rose-50/80 border border-rose-200/60 max-w-md mx-auto flex items-center gap-1 shadow-inner">
          ${this.modes.map(m => `
            <button onclick="window.arcadeHub.switchMode('${m.id}')" 
              data-submode="${m.id}" 
              class="arcade-sub-tab flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all text-center ${this.activeMode === m.id ? 'bg-white text-rose-600 shadow-sm font-extrabold' : 'text-slate-600 hover:text-slate-800'}">
              <span>${m.name}</span>
            </button>
          `).join('')}
        </div>

        <!-- Sub-Containers for the 2 Merged Arcade Games -->
        <div id="subview_canvas" class="${this.activeMode === 'canvas' ? '' : 'hidden'}">
          <div id="canvasGameContainer"></div>
        </div>

        <div id="subview_catch" class="${this.activeMode === 'catch' ? '' : 'hidden'}">
          <div id="catchGameContainer"></div>
        </div>

      </div>
    `;

    this.applySubmode(this.activeMode);
  }
}

