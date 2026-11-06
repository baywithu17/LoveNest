// Detektif Asmara: Misteri Kencan Rahasia (3 Babak / 3 Menit)
class DetectiveGame {
  constructor(socket) {
    this.socket = socket;
    this.container = document.getElementById('detectiveGameContainer');

    this.state = {
      active: false,
      currentAct: 1, // 1: TKP & Gembok, 2: Interogasi Alibi, 3: Kunci Brankas Cinta
      inspectedClues: [],
      padlockDigits: ['', '', '', ''],
      timerSeconds: 180,
      timerInterval: null,
      selectedAlibi: null,
      myKeyPressed: null,
      partnerKeyPressed: null,
      completed: false,
      won: false
    };

    this.cluesData = {
      clue1: {
        id: 'clue1',
        icon: '☕',
        title: 'Cangkir Kopi Latte',
        location: 'Meja Sudut Kafe',
        badge: 'Petunjuk Digit Ke-1',
        summary: 'Terdapat coretan angka rahasia di balik tatakan cangkir.',
        visualBadge: 'DIGIT KE-1',
        visualHtml: `
          <div class="p-5 rounded-2xl bg-amber-50 border-2 border-amber-200 text-center space-y-3 relative overflow-hidden">
            <div class="text-6xl animate-bounce">☕</div>
            <div class="font-extrabold text-sm text-amber-900">Cangkir Latte &amp; Tatakan Kertas</div>
            <p class="text-xs text-slate-600">Di balik tatakan kertas cangkir kopi dingin, kamu menemukan lingkaran spidol pink:</p>
            <div class="inline-block px-6 py-2.5 rounded-2xl bg-white border-2 border-dashed border-rose-400 shadow-sm">
              <span class="text-xs text-rose-500 font-bold block">Digit Pertama:</span>
              <span class="text-3xl font-extrabold font-mono text-rose-600 tracking-wider">7</span>
            </div>
            <p class="text-[11px] text-slate-400 italic">"Pesan rahasia: Jangan lupa senyum hari ini, ayang!"</p>
          </div>
        `
      },
      clue2: {
        id: 'clue2',
        icon: '📜',
        title: 'Struk Kasir Kafe',
        location: 'Dekat Mesin Kasir',
        badge: 'Petunjuk Digit Ke-2',
        summary: 'Struk pembelian kafe dengan stempel nomor meja.',
        visualBadge: 'DIGIT KE-2',
        visualHtml: `
          <div class="p-5 rounded-2xl bg-slate-50 border-2 border-slate-200 text-center space-y-3 relative overflow-hidden font-mono">
            <div class="text-6xl">📜</div>
            <div class="font-extrabold text-sm text-slate-800">STRUK KAFE KENANGAN</div>
            <div class="text-[11px] text-slate-500 border-y border-dashed border-slate-300 py-2 space-y-0.5 text-left max-w-xs mx-auto">
              <div>1x Matcha Latte ........... Rp 28.000</div>
              <div>1x Red Velvet Cake ........ Rp 32.000</div>
              <div>Catatan: Disimpan di brankas</div>
            </div>
            <div class="inline-block px-6 py-2.5 rounded-2xl bg-white border-2 border-rose-400 shadow-sm">
              <span class="text-xs text-rose-500 font-bold block">Digit Kedua (No. Meja):</span>
              <span class="text-3xl font-extrabold font-mono text-rose-600 tracking-wider">2</span>
            </div>
            <p class="text-[11px] text-slate-400 italic">Stempel kasir: "Meja 02 - Lunas"</p>
          </div>
        `
      },
      clue3: {
        id: 'clue3',
        icon: '🎟️',
        title: 'Tiket Bioskop Kenangan',
        location: 'Di Bawah Buku Menu',
        badge: 'Petunjuk Digit Ke-3',
        summary: 'Tiket nonton bioskop dengan nomor baris kursi.',
        visualBadge: 'DIGIT KE-3',
        visualHtml: `
          <div class="p-5 rounded-2xl bg-indigo-50 border-2 border-indigo-200 text-center space-y-3 relative overflow-hidden">
            <div class="text-6xl">🎟️</div>
            <div class="font-extrabold text-sm text-indigo-900">TIKET FILM: KISAH CINTA KITA</div>
            <p class="text-xs text-slate-600">Pada sobekan tiket bioskop kencan pertama, tertera nomor baris kursi:</p>
            <div class="inline-block px-6 py-2.5 rounded-2xl bg-white border-2 border-dashed border-indigo-400 shadow-sm">
              <span class="text-xs text-indigo-600 font-bold block">Digit Ketiga (Baris Kursi):</span>
              <span class="text-3xl font-extrabold font-mono text-indigo-600 tracking-wider">9</span>
            </div>
            <div class="text-[10px] font-mono text-slate-400 tracking-widest">||| | |||| | ||| 90219</div>
          </div>
        `
      },
      clue4: {
        id: 'clue4',
        icon: '🔑',
        title: 'Gantungan Kunci Polaroid',
        location: 'Terselip di Sofa',
        badge: 'Petunjuk Digit Ke-4',
        summary: 'Gantungan kunci foto polaroid dengan nomor loker.',
        visualBadge: 'DIGIT KE-4',
        visualHtml: `
          <div class="p-5 rounded-2xl bg-pink-50 border-2 border-pink-200 text-center space-y-3 relative overflow-hidden">
            <div class="text-6xl">🔑</div>
            <div class="font-extrabold text-sm text-pink-900">Gantungan Kunci Polaroid Bayu &amp; Ema</div>
            <p class="text-xs text-slate-600">Di plat kuningan gantungan kunci foto berdua, terukir nomor loker penitipan kado:</p>
            <div class="inline-block px-6 py-2.5 rounded-2xl bg-white border-2 border-rose-400 shadow-sm">
              <span class="text-xs text-rose-500 font-bold block">Digit Keempat (No. Loker):</span>
              <span class="text-3xl font-extrabold font-mono text-rose-600 tracking-wider">4</span>
            </div>
            <p class="text-[11px] text-slate-400 italic">"Loker penitipan kado kenangan"</p>
          </div>
        `
      }
    };

    this.suspectsData = [
      {
        id: 'suspect1',
        avatar: '🐱',
        name: 'Barista Kucing',
        role: 'Peracik Kopi',
        quote: '"Tadi jam 8 malam aku liat orang mencurigakan taruh kado berbalut pita satin rose gold!"'
      },
      {
        id: 'suspect2',
        avatar: '📸',
        name: 'Fotografer Chibi',
        role: 'Saksi Mata',
        quote: '"Aku sempat jepret siluetnya! Dia memakai sweater rajut krem kesayangan ayang!"'
      },
      {
        id: 'suspect3',
        avatar: '🧁',
        name: 'Pelayan Toko Manis',
        role: 'Kasir Bakery',
        quote: '"Dia membisikkan kata sandi rahasia: \'Bucin Selamanya\' sambil tersenyum manis!"'
      }
    ];

    this.alibiChoices = [
      { id: 0, text: 'Pengirim memakai jaket kulit hitam & kata sandinya "Terserah".' },
      { id: 1, text: 'Pengirim memakai sweater rajut krem dengan pita rose gold & kata sandi "Bucin Selamanya"!' },
      { id: 2, text: 'Barista Kucing menyembunyikan kado di freezer es krim.' }
    ];

    this.keysData = [
      { id: 'heart', icon: '💖', name: 'Kunci Hati Emas', desc: 'Simbol ketulusan cinta' },
      { id: 'ring', icon: '💍', name: 'Kunci Cincin Janji', desc: 'Simbol komitmen bersama' },
      { id: 'future', icon: '🗝️', name: 'Kunci Masa Depan', desc: 'Simbol impian berdua' }
    ];

    this.setupSocketEvents();
  }

  setupSocketEvents() {
    this.socket.on('detective-game-started', ({ state, serverTime }) => {
      this.state.active = true;
      this.state.currentAct = 1;
      this.state.inspectedClues = [];
      this.state.padlockDigits = ['', '', '', ''];
      this.state.selectedAlibi = null;
      this.state.myKeyPressed = null;
      this.state.partnerKeyPressed = null;
      this.state.completed = false;
      this.state.won = false;

      this.startCountdown(180);
      this.render();
      if (window.soundController) window.soundController.playMatchFanfare();
    });

    this.socket.on('detective-clue-inspected', ({ clueId, playerName, inspectedClues }) => {
      this.state.inspectedClues = inspectedClues || [];
      showNotification(`🔍 ${playerName} memeriksa ${this.cluesData[clueId]?.title || 'petunjuk'}!`);
      this.renderAct1();
      if (window.soundController) window.soundController.playPop();
    });

    this.socket.on('detective-act-completed', ({ completedAct, nextAct, playerName }) => {
      this.state.currentAct = nextAct;
      showNotification(`🎉 Hebat! ${playerName} berhasil memecahkan Babak ${completedAct}! Masuk ke Babak ${nextAct}!`);
      if (window.soundController) window.soundController.playMatchFanfare();
      if (window.triggerConfetti) window.triggerConfetti();
      this.render();
    });

    this.socket.on('detective-padlock-failed', ({ message }) => {
      showNotification(`❌ ${message}`);
    });

    this.socket.on('detective-alibi-failed', ({ playerName }) => {
      showNotification(`❌ Alibi salah! Coba diskusikan lagi bersama pasangan.`);
    });

    this.socket.on('detective-partner-key-pressed', ({ playerName, keyId }) => {
      this.state.partnerKeyPressed = keyId;
      showNotification(`🔑 Pasangan telah memilih salah satu Kunci Cinta! Sekarang giliranmu menekan kuncimu!`);
      this.renderAct3();
    });

    this.socket.on('detective-victory', ({ elapsedSeconds }) => {
      this.stopCountdown();
      this.state.completed = true;
      this.state.won = true;
      this.renderVictory(elapsedSeconds);
      if (window.soundController) window.soundController.playMatchFanfare();
      if (window.triggerConfetti) window.triggerConfetti();
    });

    this.socket.on('detective-game-over', ({ reason }) => {
      this.stopCountdown();
      this.state.completed = true;
      this.state.won = false;
      this.renderGameOver(reason);
    });
  }

  startCountdown(seconds) {
    this.stopCountdown();
    this.state.timerSeconds = seconds;
    this.updateTimerDisplay();

    this.state.timerInterval = setInterval(() => {
      this.state.timerSeconds--;
      this.updateTimerDisplay();

      if (this.state.timerSeconds <= 0) {
        this.stopCountdown();
        this.socket.emit('detective-timeout');
      }
    }, 1000);
  }

  stopCountdown() {
    if (this.state.timerInterval) {
      clearInterval(this.state.timerInterval);
      this.state.timerInterval = null;
    }
  }

  updateTimerDisplay() {
    const timerBadge = document.getElementById('detectiveTimerBadge');
    if (!timerBadge) return;

    const m = Math.floor(this.state.timerSeconds / 60);
    const s = this.state.timerSeconds % 60;
    const str = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    timerBadge.textContent = `⏱️ ${str}`;

    if (this.state.timerSeconds <= 30) {
      timerBadge.className = 'px-3 py-1 rounded-full bg-rose-600 text-white font-mono text-xs font-extrabold animate-pulse shadow-md';
    } else {
      timerBadge.className = 'px-3 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-200 font-mono text-xs font-extrabold shadow-2xs';
    }
  }

  render() {
    if (!this.container) return;

    if (!this.state.active) {
      this.renderLobby();
      return;
    }

    if (this.state.completed) {
      if (this.state.won) this.renderVictory(180 - this.state.timerSeconds);
      else this.renderGameOver('Waktu 3 menit telah habis!');
      return;
    }

    if (this.state.currentAct === 1) this.renderAct1();
    else if (this.state.currentAct === 2) this.renderAct2();
    else if (this.state.currentAct === 3) this.renderAct3();
  }

  renderLobby() {
    this.container.innerHTML = `
      <div class="glass-panel rounded-3xl p-6 sm:p-8 border border-white/80 shadow-md space-y-6 text-center">
        <!-- Chibi Banner Header -->
        <div class="relative w-full h-56 sm:h-64 rounded-3xl overflow-hidden shadow-xl border border-rose-100">
          <img src="/images/detective-chibi.jpg" alt="Detektif Bayu & Ema" class="w-full h-full object-cover">
          <div class="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>
          
          <div class="absolute top-4 left-4">
            <span class="px-3 py-1 rounded-full bg-rose-600 text-white text-[10px] font-extrabold shadow-md">
              KASUS #01 • CO-OP ESCAPE
            </span>
          </div>

          <div class="absolute bottom-4 left-4 right-4 text-white text-left">
            <h2 class="text-2xl font-extrabold drop-shadow-md">Detektif Asmara: Misteri Kencan Rahasia</h2>
            <p class="text-xs text-rose-200 font-medium drop-shadow-xs">Pecahkan 3 Babak Misteri dalam 3 Menit Berdua!</p>
          </div>
        </div>

        <!-- Case Synopsis -->
        <div class="max-w-xl mx-auto space-y-3 text-left p-4 rounded-2xl bg-white/70 border border-rose-100 text-xs text-slate-600 leading-relaxed">
          <div class="flex items-center gap-2 font-extrabold text-slate-800 text-sm">
            <span>🕵️‍♂️ Detektif Bayu &amp; 🕵️‍♀️ Detektif Ema</span>
          </div>
          <p>
            Seseorang menyembunyikan <b>Kado Kejutan &amp; Surat Cinta</b> di Brankas Antik Kafe Kenangan. Kafe akan segera tutup dalam <b>3 Menit</b>!
          </p>
          <div class="grid grid-cols-3 gap-2 pt-1 text-center font-bold text-[11px]">
            <div class="p-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
              Babak 1: Olah TKP
            </div>
            <div class="p-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200">
              Babak 2: Interogasi
            </div>
            <div class="p-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
              Babak 3: Buka Brankas
            </div>
          </div>
        </div>

        <!-- Start Button -->
        <div class="pt-2">
          <button onclick="window.detectiveGame.startNewGame()" 
            class="w-full max-w-md mx-auto py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2">
            <span>🔍 Mulai Investigasi Kasus (Timer 3 Menit)</span>
          </button>
        </div>
      </div>
    `;
  }

  startNewGame() {
    this.socket.emit('detective-start-game');
  }

  // ==================== BABAK 1: OLAH TKP & KODE GEMBOK ====================
  renderAct1() {
    const inspectedCount = this.state.inspectedClues.length;
    const allInspected = inspectedCount >= 4;

    this.container.innerHTML = `
      <div class="glass-panel rounded-3xl p-5 sm:p-7 border border-white/80 shadow-md space-y-6">
        
        <!-- Header with Progress and Timer -->
        <div class="flex items-center justify-between pb-3 border-b border-rose-100">
          <div>
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold">BABAK 1/3</span>
              <span class="text-xs font-extrabold text-slate-800">Olah TKP &amp; Kombinasi Gembok</span>
            </div>
            <p class="text-[11px] text-slate-400 mt-0.5">Periksa 4 barang bukti di TKP untuk menemukan angka gembok!</p>
          </div>
          <div id="detectiveTimerBadge" class="px-3 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-200 font-mono text-xs font-extrabold">
            ⏱️ 03:00
          </div>
        </div>

        <!-- Papan Barang Bukti Visual TKP -->
        <div class="relative w-full rounded-2xl overflow-hidden border-2 border-rose-200/80 shadow-md">
          <img src="/images/evidence-clues.jpg" alt="Papan Bukti TKP" class="w-full h-44 sm:h-56 object-cover">
          <div class="absolute inset-0 bg-gradient-to-t from-slate-900/85 via-slate-900/30 to-transparent"></div>
          <div class="absolute bottom-3 left-4 right-4 text-white flex items-center justify-between">
            <div>
              <span class="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-rose-600 text-white shadow-xs">
                TKP KAFE KENANGAN
              </span>
              <h4 class="font-extrabold text-sm sm:text-base drop-shadow-sm mt-0.5">
                Meja Bukti Detektif Bayu &amp; Ema
              </h4>
            </div>
            <span class="text-[11px] font-bold text-rose-200 bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/30">
              🔍 ${inspectedCount}/4 Diperiksa
            </span>
          </div>
        </div>

        <!-- TKP Interactive Clues Grid -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-extrabold text-slate-700">Barang Bukti di TKP (Tap untuk Memeriksa)</span>
            <span class="text-[10px] text-rose-500 font-bold">${allInspected ? '✅ Semua 4 Bukti Sudah Diperiksa!' : 'Cari 4 angka tersembunyi'}</span>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            ${Object.values(this.cluesData).map(clue => {
              const isInspected = this.state.inspectedClues.includes(clue.id);
              return `
                <div onclick="window.detectiveGame.openClueModal('${clue.id}')" 
                  class="p-4 rounded-2xl border text-left cursor-pointer transition-all transform hover:-translate-y-1 hover:shadow-md ${
                    isInspected 
                      ? 'bg-rose-50/90 border-rose-300 ring-2 ring-rose-200 shadow-xs' 
                      : 'bg-white border-slate-200 hover:border-rose-300 shadow-2xs'
                  }">
                  <div class="flex items-center justify-between mb-1.5">
                    <span class="text-3xl">${clue.icon}</span>
                    <span class="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${isInspected ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-500'}">
                      ${clue.visualBadge}
                    </span>
                  </div>
                  <div class="font-extrabold text-xs text-slate-800 truncate">${clue.title}</div>
                  <div class="text-[10px] text-slate-400 truncate mb-2">📍 ${clue.location}</div>
                  <div class="pt-1.5 border-t border-rose-100/60 flex items-center justify-between text-[10px] font-bold ${isInspected ? 'text-rose-600' : 'text-slate-500'}">
                    <span>${isInspected ? '✅ Sudah Dicek' : '🔍 Periksa'}</span>
                    <span>→</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Clue Revealed Notepad -->
        <div class="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs space-y-2">
          <div class="font-extrabold text-amber-900 flex items-center justify-between">
            <span class="flex items-center gap-1.5">
              <span>📝 Buku Catatan Detektif (Petunjuk yang Terbuka)</span>
            </span>
            <span class="text-[10px] text-amber-700 font-semibold">Klik kartu di atas untuk melihat detail barang</span>
          </div>
          <div class="space-y-1.5 font-mono text-slate-700">
            ${this.state.inspectedClues.length === 0 ? '<p class="text-slate-400 italic">Belum ada barang bukti yang diperiksa. Klik salah satu barang di atas untuk memeriksa fisiknya!</p>' : ''}
            ${this.state.inspectedClues.map(cId => {
              const c = this.cluesData[cId];
              return `
                <div class="flex items-start gap-2 bg-white/80 p-2 rounded-xl border border-amber-200/60">
                  <span class="text-rose-500 font-bold shrink-0">▶</span>
                  <div class="flex-1 min-w-0">
                    <span class="font-bold text-slate-800">[${c.visualBadge}]: ${c.title}</span> — 
                    <span class="text-slate-600">${c.summary}</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Padlock Keypad (No clue in input, completely empty placeholder) -->
        <div class="p-5 rounded-2xl bg-white border border-rose-200 shadow-sm max-w-sm mx-auto text-center space-y-3">
          <div class="text-xs font-extrabold text-slate-800">🔒 Masukkan 4 Digit Kombinasi Gembok</div>
          <p class="text-[11px] text-slate-400">
            Kombinasikan 4 angka yang kalian temukan dari memeriksa 4 barang bukti di atas:
          </p>
          <div class="flex items-center justify-center gap-2">
            <input type="text" id="padlockCodeInput" maxlength="4" placeholder="• • • •" autocomplete="off"
              class="w-48 text-center py-2.5 px-3 rounded-xl bg-slate-50 border-2 border-rose-300 font-mono font-extrabold text-2xl tracking-widest text-slate-800 outline-none focus:ring-2 focus:ring-rose-400 shadow-inner">
          </div>
          <button onclick="window.detectiveGame.submitPadlock()" 
            class="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-extrabold text-xs shadow-xs hover:from-rose-600 hover:to-pink-600 transition-all">
            Buka Gembok 🔓
          </button>
        </div>

      </div>

      <!-- Visual Clue Inspection Modal Container -->
      <div id="detectiveClueModal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
        <div class="glass-panel w-full max-w-md rounded-3xl p-6 border border-white/80 shadow-2xl relative space-y-4">
          <button onclick="window.detectiveGame.closeClueModal()" 
            class="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center text-sm transition-colors">
            ✕
          </button>
          
          <div class="text-left">
            <span id="clueModalBadge" class="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-600 font-extrabold text-[10px] uppercase">
              BARANG BUKTI
            </span>
            <h3 id="clueModalTitle" class="text-lg font-extrabold text-slate-800 mt-1">Pemeriksaan Barang Bukti</h3>
            <p id="clueModalLocation" class="text-xs text-slate-400">Lokasi: TKP Kafe</p>
          </div>

          <!-- Dynamic Visual Content -->
          <div id="clueModalVisualArea" class="py-2"></div>

          <button onclick="window.detectiveGame.closeClueModal()" 
            class="w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs transition-colors shadow-xs">
            Catat Petunjuk &amp; Tutup Pemeriksaan
          </button>
        </div>
      </div>
    `;
    this.updateTimerDisplay();
  }

  openClueModal(clueId) {
    const clue = this.cluesData[clueId];
    if (!clue) return;

    // Inspect clue on server
    this.inspectClue(clueId);

    const modal = document.getElementById('detectiveClueModal');
    const badge = document.getElementById('clueModalBadge');
    const title = document.getElementById('clueModalTitle');
    const location = document.getElementById('clueModalLocation');
    const visualArea = document.getElementById('clueModalVisualArea');

    if (badge) badge.textContent = clue.visualBadge;
    if (title) title.textContent = clue.title;
    if (location) location.textContent = `📍 Ditemukan di: ${clue.location}`;
    if (visualArea) visualArea.innerHTML = clue.visualHtml;

    if (modal) modal.classList.remove('hidden');
    if (window.soundController) window.soundController.playPop();
  }

  closeClueModal() {
    const modal = document.getElementById('detectiveClueModal');
    if (modal) modal.classList.add('hidden');
  }

  inspectClue(clueId) {
    const playerName = window.appState.user.name || 'Detektif';
    this.socket.emit('detective-inspect-clue', { clueId, playerName });
  }

  submitPadlock() {
    const input = document.getElementById('padlockCodeInput');
    const code = input ? input.value.trim() : '';
    const playerName = window.appState.user.name || 'Detektif';
    if (!code) {
      alert('Masukkan 4 digit kode gembok!');
      return;
    }
    this.socket.emit('detective-submit-padlock', { code, playerName });
  }

  // ==================== BABAK 2: INTEROGASI 3 SAKSI & ALIBI ====================
  renderAct2() {
    this.container.innerHTML = `
      <div class="glass-panel rounded-3xl p-5 sm:p-7 border border-white/80 shadow-md space-y-6">
        
        <!-- Header -->
        <div class="flex items-center justify-between pb-3 border-b border-rose-100">
          <div>
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-extrabold">BABAK 2/3</span>
              <span class="text-xs font-extrabold text-slate-800">Interogasi 3 Saksi &amp; Verifikasi Alibi</span>
            </div>
            <p class="text-[11px] text-slate-400 mt-0.5">Baca kesaksian saksi kafe, lalu pilih kesimpulan alibi yang valid!</p>
          </div>
          <div id="detectiveTimerBadge" class="px-3 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-200 font-mono text-xs font-extrabold">
            ⏱️ 02:00
          </div>
        </div>

        <!-- 3 Suspect Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          ${this.suspectsData.map(s => `
            <div class="p-4 rounded-2xl bg-white border border-indigo-100 shadow-2xs space-y-2">
              <div class="flex items-center gap-2">
                <span class="text-3xl">${s.avatar}</span>
                <div>
                  <h4 class="font-extrabold text-xs text-slate-800">${s.name}</h4>
                  <span class="text-[10px] text-indigo-500 font-semibold">${s.role}</span>
                </div>
              </div>
              <p class="text-[11px] text-slate-600 italic bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100/60 leading-relaxed">
                ${s.quote}
              </p>
            </div>
          `).join('')}
        </div>

        <!-- Alibi Question & Choice Selector -->
        <div class="p-5 rounded-2xl bg-white/90 border border-indigo-200 shadow-xs space-y-3">
          <div class="font-extrabold text-xs text-slate-800 flex items-center gap-2">
            <span>❓ Pertanyaan Investigasi:</span>
            <span class="text-indigo-600">Siapakah pengirim kado dan apa kata sandi alibinya?</span>
          </div>

          <div class="space-y-2">
            ${this.alibiChoices.map(c => `
              <button onclick="window.detectiveGame.selectAlibi(${c.id})" 
                class="w-full text-left p-3 rounded-xl border text-xs font-medium transition-all ${
                  this.state.selectedAlibi === c.id 
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs font-bold' 
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-indigo-50'
                }">
                ${c.text}
              </button>
            `).join('')}
          </div>

          <button onclick="window.detectiveGame.submitAlibi()" 
            class="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-extrabold text-xs shadow-xs hover:from-indigo-600 hover:to-purple-700 transition-all">
            Kirim Kesimpulan Alibi ⚖️
          </button>
        </div>

      </div>
    `;
    this.updateTimerDisplay();
  }

  selectAlibi(choiceId) {
    this.state.selectedAlibi = choiceId;
    this.renderAct2();
  }

  submitAlibi() {
    if (this.state.selectedAlibi === null) {
      alert('Pilih salah satu kesimpulan alibi terlebih dahulu!');
      return;
    }
    const playerName = window.appState.user.name || 'Detektif';
    this.socket.emit('detective-submit-alibi', { choiceIndex: this.state.selectedAlibi, playerName });
  }

  // ==================== BABAK 3: PECAHKAN BRANKAS CINTA ====================
  renderAct3() {
    const hasMyKey = !!this.state.myKeyPressed;
    const hasPartnerKey = !!this.state.partnerKeyPressed;

    this.container.innerHTML = `
      <div class="glass-panel rounded-3xl p-5 sm:p-7 border border-white/80 shadow-md space-y-6 text-center">
        
        <!-- Header -->
        <div class="flex items-center justify-between pb-3 border-b border-rose-100 text-left">
          <div>
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-extrabold">BABAK FINAL 3/3</span>
              <span class="text-xs font-extrabold text-slate-800">Dekripsi Brankas Cinta Kencan</span>
            </div>
            <p class="text-[11px] text-slate-400 mt-0.5">Kalian berdua harus menekan Kunci Chemistry secara bersamaan sebelum waktu habis!</p>
          </div>
          <div id="detectiveTimerBadge" class="px-3 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-200 font-mono text-xs font-extrabold">
            ⏱️ 01:00
          </div>
        </div>

        <!-- The Safe Illustration -->
        <div class="p-6 rounded-3xl bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white max-w-md mx-auto shadow-xl border-4 border-amber-300 relative overflow-hidden">
          <div class="text-4xl mb-2 animate-bounce">🔐</div>
          <h3 class="text-lg font-extrabold text-amber-300">Brankas Kado Rahasia</h3>
          <p class="text-[11px] text-slate-300">Status Kunci Sinkronisasi Pasangan:</p>
          
          <div class="flex items-center justify-center gap-4 my-4">
            <div class="px-3 py-1.5 rounded-xl border ${hasMyKey ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300' : 'bg-slate-800 border-slate-700 text-slate-500'} text-xs font-bold">
              ${hasMyKey ? '✅ Kuncimu Siap' : '⏳ Kuncimu Belum'}
            </div>
            <div class="px-3 py-1.5 rounded-xl border ${hasPartnerKey ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300' : 'bg-slate-800 border-slate-700 text-slate-500'} text-xs font-bold">
              ${hasPartnerKey ? '✅ Kunci Ayang Siap' : '⏳ Kunci Ayang Belum'}
            </div>
          </div>
        </div>

        <!-- 3 Interactive Keys -->
        <div class="max-w-md mx-auto space-y-2">
          <p class="text-xs font-extrabold text-slate-700">Pilih Kunci Chemistry Kamu:</p>
          <div class="grid grid-cols-3 gap-2">
            ${this.keysData.map(k => `
              <button onclick="window.detectiveGame.pressKey('${k.id}')" 
                class="p-3.5 rounded-2xl border text-center transition-all transform hover:scale-105 active:scale-95 ${
                  this.state.myKeyPressed === k.id 
                    ? 'bg-amber-100 border-amber-400 shadow-md ring-2 ring-amber-400' 
                    : 'bg-white border-rose-200 hover:border-amber-300 shadow-2xs'
                }">
                <div class="text-2xl mb-1">${k.icon}</div>
                <div class="text-[11px] font-extrabold text-slate-800 leading-tight">${k.name}</div>
              </button>
            `).join('')}
          </div>
        </div>

      </div>
    `;
    this.updateTimerDisplay();
  }

  pressKey(keyId) {
    this.state.myKeyPressed = keyId;
    const playerName = window.appState.user.name || 'Detektif';
    this.socket.emit('detective-press-key', { keyId, playerName });
    this.renderAct3();
    if (window.soundController) window.soundController.playPop();
  }

  // ==================== VICTORY SCREEN ====================
  renderVictory(elapsedSeconds) {
    const m = Math.floor(elapsedSeconds / 60);
    const s = elapsedSeconds % 60;
    const timeStr = `${m} menit ${s} detik`;

    this.container.innerHTML = `
      <div class="glass-panel rounded-3xl p-6 sm:p-8 border border-white/80 shadow-xl space-y-6 text-center animate-fade-in">
        <div class="relative w-36 h-36 mx-auto">
          <img src="/images/detective-chibi.jpg" alt="Detektif Bayu & Ema Menang" 
            class="w-full h-full object-cover rounded-3xl shadow-xl border-4 border-amber-300 ring-4 ring-amber-200 animate-bounce">
          <span class="absolute -bottom-2 -right-2 text-3xl">🏆</span>
        </div>

        <div class="space-y-2">
          <span class="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-xs border border-emerald-200 uppercase tracking-wider">
            🎉 KASUS TERPECAHKAN DENGAN SEMPURNA!
          </span>
          <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-800 font-serif-elegant">
            Sherlock Bayu &amp; Watson Ema Menang! 🏆
          </h2>
          <p class="text-xs sm:text-sm text-slate-500">
            Kalian berhasil menyelesaikan 3 Babak Misteri dalam waktu <b class="text-rose-600">${timeStr}</b>!
          </p>
        </div>

        <!-- Revealed Secret Love Letter -->
        <div class="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-rose-50 via-pink-50 to-purple-50 border border-rose-200 shadow-xs max-w-lg mx-auto text-left space-y-3 font-serif-elegant">
          <div class="text-center font-bold text-sm text-rose-600 uppercase tracking-wider">
            💌 Surat Cinta &amp; Kado Rahasia yang Terbuka 💌
          </div>
          <p class="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
            "Kado terindah bukanlah barang antik atau permata, melainkan setiap detik yang kita lalui bersama—dari memecahkan teka-teki lucu sampai tertawa berdua. Bayu &amp; Ema, kalian adalah pasangan paling kompak selamanya! 💕"
          </p>
          <div class="text-right text-xs font-bold text-rose-500 font-script text-xl">
            — Cinta Tanpa Akhir
          </div>
        </div>

        <div>
          <button onclick="window.detectiveGame.startNewGame()" 
            class="py-3 px-6 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-extrabold text-xs shadow-md transition-all">
            🔄 Mainkan Ulang Kasus Detektif
          </button>
        </div>
      </div>
    `;
  }

  // ==================== GAME OVER SCREEN ====================
  renderGameOver(reason) {
    this.container.innerHTML = `
      <div class="glass-panel rounded-3xl p-6 sm:p-8 border border-white/80 shadow-xl space-y-5 text-center animate-fade-in">
        <div class="text-5xl animate-pulse">⏰</div>
        <div class="space-y-1">
          <h3 class="text-xl font-extrabold text-slate-800">Waktu 3 Menit Habis!</h3>
          <p class="text-xs text-rose-500 font-semibold">${reason || 'Kafe sudah tutup, kado belum sempat terbuka!'}</p>
        </div>
        <p class="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
          Jangan sedih! Menjadi detektif butuh latihan kekompakan. Coba lagi bersama ayang dan bergerak lebih cepat!
        </p>
        <button onclick="window.detectiveGame.startNewGame()" 
          class="py-3 px-6 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-extrabold text-xs shadow-md transition-all">
          🔄 Coba Lagi Berdua
        </button>
      </div>
    `;
  }
}

// Global hook
window.DetectiveGame = DetectiveGame;

