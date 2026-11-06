// Merged Module: Studio Kuis & Chemistry (Quiz Hub)
// Menggabungkan: Seberapa Kenal Ayang (Truth & Guess), Sehati Sejiwa (Telepathy), & Siapa Paling Mungkin (Rapid Vote)
class QuizHub {
  constructor(socket) {
    this.socket = socket;
    this.activeMode = 'knowme'; // 'knowme', 'telepathy', 'likely'

    this.modes = [
      { id: 'knowme', name: '🎯 Seberapa Kenal?', desc: 'Satu orang kunci jawaban aslinya, pasangan tebak!' },
      { id: 'telepathy', name: '🧠 Sehati Sejiwa', desc: 'Jawab serentak fakta Bayu & Ema untuk buktikan sehati!' },
      { id: 'likely', name: '⚡ Siapa Paling?', desc: 'Vote kilat serentak: Bayu atau Ema!' }
    ];

    this.setupEvents();
  }

  setupEvents() {
    this.socket.on('quiz-submode-switched', ({ mode }) => {
      this.applySubmode(mode);
    });
  }

  switchMode(modeId) {
    this.socket.emit('quiz-submode-switch', { mode: modeId });
  }

  applySubmode(modeId) {
    this.activeMode = modeId;

    // Update segmented pill UI
    document.querySelectorAll('.quiz-sub-tab').forEach(btn => {
      if (btn.dataset.submode === modeId) {
        btn.classList.add('bg-white', 'text-rose-600', 'shadow-sm', 'font-extrabold');
        btn.classList.remove('text-slate-600', 'hover:text-slate-800');
      } else {
        btn.classList.remove('bg-white', 'text-rose-600', 'shadow-sm', 'font-extrabold');
        btn.classList.add('text-slate-600', 'hover:text-slate-800');
      }
    });

    // Toggle sub-containers
    const subKnowme = document.getElementById('subview_knowme');
    const subTelepathy = document.getElementById('subview_telepathy');
    const subLikely = document.getElementById('subview_likely');

    if (subKnowme) subKnowme.classList.toggle('hidden', modeId !== 'knowme');
    if (subTelepathy) subTelepathy.classList.toggle('hidden', modeId !== 'telepathy');
    if (subLikely) subLikely.classList.toggle('hidden', modeId !== 'likely');

    // Trigger sub-game render
    if (modeId === 'knowme' && window.knowMeGame) {
      window.knowMeGame.render();
    } else if (modeId === 'telepathy' && window.telepathyGame) {
      window.telepathyGame.renderQuestion();
    } else if (modeId === 'likely' && window.mostLikelyGame) {
      window.mostLikelyGame.render();
    }

    if (window.soundController) window.soundController.playPop();
  }

  render() {
    const container = document.getElementById('quizHubGameContainer');
    if (!container) return;

    container.innerHTML = `
      <div class="max-w-4xl mx-auto space-y-6">
        
        <!-- Header Banner with Chibi Art -->
        <div class="p-4 sm:p-5 rounded-3xl bg-white/90 border border-indigo-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div class="flex items-center gap-3.5">
            <img src="/images/quiz-chibi.jpg" alt="Studio Kuis Chibi" 
              class="w-16 h-16 rounded-2xl object-cover shadow-md border-2 border-indigo-300 ring-2 ring-indigo-100 shrink-0">
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-lg sm:text-xl font-extrabold text-slate-800 font-serif-elegant">Studio Kuis & Chemistry</h3>
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-700 uppercase tracking-wider">3 Mode Merger 🎯</span>
              </div>
              <p class="text-xs text-slate-500 mt-0.5">Uji kepekaan rasa cinta, sinkronisasi pikiran, dan kecocokan kalian berdua!</p>
            </div>
          </div>

          <button onclick="switchTab('lobby')" 
            class="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition-colors shrink-0 flex items-center gap-1.5">
            <span>← Beranda</span>
          </button>
        </div>

        <!-- Segmented Mode Control (Pills) -->
        <div class="p-1.5 rounded-2xl bg-rose-50/80 border border-rose-200/60 max-w-lg mx-auto flex items-center gap-1 shadow-inner">
          ${this.modes.map(m => `
            <button onclick="window.quizHub.switchMode('${m.id}')" 
              data-submode="${m.id}" 
              class="quiz-sub-tab flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all text-center ${this.activeMode === m.id ? 'bg-white text-rose-600 shadow-sm font-extrabold' : 'text-slate-600 hover:text-slate-800'}">
              <span>${m.name}</span>
            </button>
          `).join('')}
        </div>

        <!-- Sub-Containers for the 3 Merged Quiz Games -->
        <div id="subview_knowme" class="${this.activeMode === 'knowme' ? '' : 'hidden'}">
          <div id="knowmeGameContainer"></div>
        </div>

        <div id="subview_telepathy" class="${this.activeMode === 'telepathy' ? '' : 'hidden'}">
          <div id="telepathyGameContainer"></div>
        </div>

        <div id="subview_likely" class="${this.activeMode === 'likely' ? '' : 'hidden'}">
          <div id="likelyGameContainer"></div>
        </div>

      </div>
    `;

    this.applySubmode(this.activeMode);
  }
}

