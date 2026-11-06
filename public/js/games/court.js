// Mini Game: Pengadilan Asmara Bayu & Ema (Couples Court & Debates)
class CourtGame {
  constructor(socket) {
    this.socket = socket;
    this.currentCase = null;
    this.cases = [
      {
        id: 'terserah-food',
        title: 'Misteri Kata "Terserah" Pas Mau Makan',
        category: '🍕 Kuliner & Perut',
        badge: 'Red Flag Tipis',
        description: 'Pasangan bilang "Terserah mau makan apa", tapi pas ditawari Bakso, Nasi Padang, Mie Ayam, semuanya ditolak dengan alasan "lagi gak pengen".',
        defaultPleaA: 'Aku beneran bingung mau makan apa, harusnya kamu peka pilihin yang cocok di lidahku!',
        defaultPleaB: 'Kalau ditawari 10 pilihan ditolak semua, itu namanya bukan terserah tapi seleksi alam!'
      },
      {
        id: 'sleeping-on-call',
        title: 'Ketiduran Pas Lagi VC / Call Tanpa Pamit',
        category: '📱 LDR & Sleep Call',
        badge: 'Ngorok Gemes',
        description: 'Awalnya janji mau nemenin begadang dan deep talk, 10 menit kemudian hening dan terdengar nafas terlelap tanpa aba-aba.',
        defaultPleaA: 'Suara kamu terlalu adem dan nenangin, jadi aku gak sengaja hanyut ke alam mimpi...',
        defaultPleaB: 'Mending pamit dulu daripada aku ngomong sendiri 15 menit dikira ngobrol sama hantu!'
      },
      {
        id: 'gengsi-kangen',
        title: 'Gengsi Bilang Kangen Duluan',
        category: '💖 Pride & Bucin',
        badge: 'Gengsi Setinggi Langit',
        description: 'Udah seharian overthinking dan kangen berat, tapi gak mau chat duluan atau cuma kirim stiker "p" sok cuek.',
        defaultPleaA: 'Aku mau liat usaha kamu kangenin aku duluan, masa harus aku terus yang mulai!',
        defaultPleaB: 'Kangen kok pakai gengsi, kan kita udah pacaran bukan lagi ujian CPNS!'
      },
      {
        id: 'jajan-mixue',
        title: 'Spill The Tea: Beli Jajan vs Nabung Nikah',
        category: '🧋 Finansial & Hura-hura',
        badge: 'Mixue Addict',
        description: 'Katanya mau komitmen nabung buat masa depan berdua, tapi tiap sore scroll grabfood beli Milky Berry & jajan perintilan lucu.',
        defaultPleaA: 'Jajan minuman segar itu investasi kesehatan mental biar gak stress mikirin hidup!',
        defaultPleaB: 'Investasi kesehatan mental tiap hari lama-lama bisa bikin dompet koma!'
      },
      {
        id: 'overthinking-night',
        title: 'Overthinking Jam 2 Pagi: "Kalau Aku Jadi Cacing..."',
        category: '🌙 Filosofi Jam Malam',
        badge: 'Random Abiez',
        description: 'Mendadak nanya pertanyaan eksistensial yang membahayakan kelangsungan hubungan pas udah jam tidur.',
        defaultPleaA: 'Itu tuh tes pembuktian cinta tanpa syarat, kamu harusnya jawab dengan romantis!',
        defaultPleaB: 'Mana ada orang pacaran sama cacing tanah, realistis dikit dong sayang!'
      },
      {
        id: 'otw-bohong',
        title: 'Bilang "OTW" Padahal Baru Mau Masuk Kamar Mandi',
        category: '⏳ Manajemen Waktu',
        badge: 'Waktu Indonesia Karet',
        description: 'Memberikan status perjalanan palsu seolah-olah sudah di atas motor/mobil padahal handuk aja belum diambil.',
        defaultPleaA: 'Maksudnya OTW dalam hati dan niat, kan energi positifnya udah jalan duluan!',
        defaultPleaB: 'Niat gak bisa bikin kamu tiba-tiba teleportasi ke hadapanku ya!'
      }
    ];

    this.penalties = [
      '🎤 Wajib kirim Voice Note gombalan maut 30 detik tanpa boleh ketawa!',
      '🧋 Wajib traktir jajan Mixue / minuman favorit saat ketemu nanti!',
      '📸 Wajib kirim selfie pose love ter-imut dalam 3 menit ke depan!',
      '📝 Wajib ketik 5 hal yang paling kamu syukuri dan cintai dari pasangan malam ini!',
      '👑 Memberikan hak veto ke pasangan untuk pilih game berikutnya tanpa bantahan!',
      '🫂 Wajib kasih pelukan virtual ter-erat dan bilang "Aku sayang kamu banget" 3x!'
    ];

    this.setupEvents();
  }

  setupEvents() {
    this.socket.on('court-case-started', (courtState) => {
      this.currentCase = courtState;
      this.renderHearingView();
    });

    this.socket.on('court-argument-submitted', (argData) => {
      this.handleArgumentSubmitted(argData);
    });

    this.socket.on('court-verdict-announced', (verdictData) => {
      this.displayVerdict(verdictData);
    });

    this.socket.on('court-reset-done', () => {
      this.currentCase = null;
      this.render();
    });
  }

  playGavelSound() {
    if (window.soundController) {
      // simulate wooden gavel strikes
      window.soundController.init();
      try {
        const ctx = window.soundController.ctx;
        [0, 0.25, 0.5].forEach(delay => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(140, ctx.currentTime + delay);
          osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + delay + 0.12);
          gain.gain.setValueAtTime(0.3, ctx.currentTime + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.12);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + delay);
          osc.stop(ctx.currentTime + delay + 0.12);
        });
      } catch (e) {
        console.warn(e);
      }
    }
  }

  selectCase(caseId) {
    const found = this.cases.find(c => c.id === caseId);
    if (!found) return;

    this.playGavelSound();
    this.socket.emit('court-select-case', {
      caseTitle: found.title,
      category: found.category,
      plaintiffRole: (window.appState.user.name || '').toLowerCase().includes('ema') ? 'Ema' : 'Bayu'
    });
  }

  createCustomCase() {
    const titleInput = document.getElementById('courtCustomTitle');
    const descInput = document.getElementById('courtCustomDesc');
    const title = (titleInput ? titleInput.value : '').trim();
    const desc = (descInput ? descInput.value : '').trim();

    if (!title) {
      alert('Ketik dulu judul perkara sengketanya ya!');
      return;
    }

    this.playGavelSound();
    this.socket.emit('court-select-case', {
      caseTitle: title,
      category: '⚖️ Sengketa Rahasia Bayu & Ema',
      description: desc || 'Perkara cinta khusus yang diajukan ke meja hijau.'
    });
  }

  submitMyArgument() {
    const input = document.getElementById('courtArgumentInput');
    const statement = (input ? input.value : '').trim();
    if (!statement) {
      alert('Tuliskan pembelaan atau alasanmu dulu!');
      return;
    }

    this.socket.emit('court-submit-argument', {
      role: window.appState.user.name || 'Ayang',
      statement
    });

    if (input) input.disabled = true;
    const btn = document.getElementById('courtSubmitArgBtn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '✅ Pembelaan Terkirim';
      btn.className = 'w-full py-2.5 rounded-xl bg-slate-100 text-slate-400 font-bold text-xs cursor-not-allowed';
    }
  }

  handleArgumentSubmitted(argData) {
    if (!this.currentCase) return;
    if (!this.currentCase.arguments) this.currentCase.arguments = {};
    this.currentCase.arguments[argData.playerId] = argData;

    const list = document.getElementById('courtArgumentsList');
    if (list) {
      list.innerHTML = Object.values(this.currentCase.arguments).map(arg => `
        <div class="p-3.5 rounded-2xl bg-white border border-rose-100 shadow-xs space-y-1 animate-fade-in">
          <div class="flex items-center justify-between text-xs">
            <span class="font-extrabold text-slate-800">${arg.role} (${arg.playerName})</span>
            <span class="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Argumen Masuk ⚖️</span>
          </div>
          <p class="text-xs text-slate-600 italic">"${arg.statement}"</p>
        </div>
      `).join('');
    }

    if (window.soundController) window.soundController.playPop();
  }

  requestVerdict() {
    this.playGavelSound();

    const randomPenalty = this.penalties[Math.floor(Math.random() * this.penalties.length)];
    const decisions = [
      {
        ruling: 'KEDUA BELAH PIHAK DINYATAKAN BUCIN BERAT!',
        reason: 'Setelah menimbang isi chat, tatapan mata, dan tingkat kebucinan yang melanggar batas kewajaran, Majelis Hakim Asmara memutuskan tidak ada yang salah murni, kalian berdua cuma terlalu saling sayang tapi gengsi!'
      },
      {
        ruling: 'TERDAKWA TERBUKTI BERSALAH MENUMPAHKAN KELUCUAN!',
        reason: 'Bukti-bukti yang diajukan sudah valid no debat. Alasan yang disampaikan memang manipulatif tapi gemas, sehingga pengadilan meringankan hukuman menjadi bentuk kasih sayang.'
      },
      {
        ruling: 'PUTUSAN DAMAI DENGAN SYARAT KESEPAKATAN ASMARA!',
        reason: 'Perkara ini resmi ditutup dengan asas kekeluargaan dan kemesraan seumur hidup. Segala tuntutan dimaafkan dengan sanksi wajib!'
      }
    ];

    const pick = decisions[Math.floor(Math.random() * decisions.length)];

    const verdictPayload = {
      caseTitle: this.currentCase ? this.currentCase.caseTitle : 'Sidang Kasus Cinta',
      ruling: pick.ruling,
      reason: pick.reason,
      penalty: randomPenalty,
      issuedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    this.socket.emit('court-issue-verdict', verdictPayload);
  }

  displayVerdict(vData) {
    if (window.soundController) window.soundController.playMatchFanfare();
    const container = document.getElementById('courtStageContainer');
    if (!container) return;

    container.innerHTML = `
      <div class="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-rose-50 via-white to-pink-50 border-2 border-rose-200 shadow-xl text-center space-y-5 animate-fade-in relative overflow-hidden">
        
        <div class="w-20 h-20 mx-auto rounded-3xl overflow-hidden shadow-xl border-2 border-amber-400 ring-4 ring-amber-200/50 animate-bounce">
          <img src="/images/court-chibi.jpg" alt="Hakim Asmara Chibi" class="w-full h-full object-cover">
        </div>

        <div>
          <span class="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-widest bg-rose-500 text-white shadow-xs">
            PUTUSAN RESMI MAJELIS HAKIM ASMARA
          </span>
          <h3 class="text-xl sm:text-2xl font-extrabold text-slate-800 font-serif-elegant mt-2">
            "${vData.caseTitle}"
          </h3>
          <p class="text-xs text-slate-400 font-mono mt-0.5">Sidang Diketok Pada ${vData.issuedAt} WIB</p>
        </div>

        <div class="p-4 rounded-2xl bg-white/90 border border-rose-100 shadow-sm max-w-lg mx-auto text-left space-y-2">
          <div class="font-extrabold text-rose-600 text-sm flex items-center gap-1.5">
            <span>🔨 Amar Putusan:</span>
            <span>${vData.ruling}</span>
          </div>
          <p class="text-xs text-slate-600 leading-relaxed">${vData.reason}</p>
        </div>

        <div class="p-4 rounded-2xl bg-amber-50 border border-amber-200 shadow-sm max-w-lg mx-auto text-left space-y-1">
          <div class="font-bold text-amber-800 text-xs flex items-center gap-1.5">
            <span>🚨 Sanksi & Hukuman Asmara:</span>
          </div>
          <p class="text-xs font-extrabold text-amber-900 leading-relaxed">${vData.penalty}</p>
        </div>

        <div class="flex items-center justify-center gap-3 pt-2">
          <button onclick="window.courtGame.resetCourt()" 
            class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-xs shadow-md hover:from-rose-600 hover:to-pink-600 transition-all flex items-center gap-1.5">
            <span>⚖️ Sidang Perkara Baru</span>
          </button>
        </div>

      </div>
    `;
  }

  resetCourt() {
    this.socket.emit('court-reset');
  }

  renderHearingView() {
    const container = document.getElementById('courtStageContainer');
    if (!container || !this.currentCase) return;

    container.innerHTML = `
      <div class="p-6 rounded-3xl bg-white/90 border border-rose-200 shadow-md space-y-5 animate-fade-in">
        
        <!-- Case Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-rose-100">
          <div>
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 uppercase tracking-wider">
              ${this.currentCase.category || 'Kasus Asmara'}
            </span>
            <h3 class="text-lg font-extrabold text-slate-800 font-serif-elegant mt-1">
              ${this.currentCase.caseTitle}
            </h3>
          </div>
          <button onclick="window.courtGame.resetCourt()" class="text-xs text-slate-400 hover:text-rose-500 transition-colors self-start sm:self-auto">
            ✕ Batalkan Sidang
          </button>
        </div>

        <!-- Arguments Arena -->
        <div class="space-y-3">
          <h4 class="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <span>🗣️ Nota Pembelaan Para Pihak (Realtime):</span>
          </h4>
          <div id="courtArgumentsList" class="space-y-2">
            <div class="p-3 text-center text-xs text-slate-400 italic bg-rose-50/50 rounded-2xl border border-rose-100">
              Menunggu Bayu & Ema menyampaikan pembelaan masing-masing...
            </div>
          </div>
        </div>

        <!-- Input Argument -->
        <div class="p-4 rounded-2xl bg-rose-50/70 border border-rose-100 space-y-3">
          <label class="block text-xs font-bold text-slate-700">Tuliskan Pembelaan / Alasanmu (Bilingual Gen Z Style):</label>
          <textarea id="courtArgumentInput" rows="2" placeholder="Contoh: Aku literally gak bermaksud gitu ya ayang, kan situasinya..." 
            class="w-full p-3 rounded-xl bg-white border border-rose-200 text-xs focus:ring-2 focus:ring-rose-400 outline-none transition-all resize-none shadow-xs"></textarea>
          
          <button id="courtSubmitArgBtn" onclick="window.courtGame.submitMyArgument()" 
            class="w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5">
            <span>Kirim Argumen ke Meja Hakim 📨</span>
          </button>
        </div>

        <!-- Judge Decision Trigger -->
        <div class="pt-2 text-center border-t border-rose-100">
          <button onclick="window.courtGame.requestVerdict()" 
            class="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 text-white font-extrabold text-xs shadow-md hover:from-amber-600 hover:to-rose-600 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 mx-auto">
            <span>🔨 KETOK PALU & MINTA PUTUSAN HAKIM</span>
            <span class="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">Final Verdict</span>
          </button>
        </div>

      </div>
    `;
  }

  render() {
    const container = document.getElementById('courtGameContainer');
    if (!container) return;

    container.innerHTML = `
      <div class="max-w-4xl mx-auto space-y-6">
        
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-3xl bg-white/90 border border-amber-200/80 shadow-xs">
          <div class="flex items-center gap-3">
            <img src="/images/court-chibi.jpg" alt="Couples Court Chibi" 
              class="w-16 h-16 rounded-2xl object-cover shadow-md border-2 border-amber-300 ring-2 ring-amber-100 shrink-0">
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-lg sm:text-xl font-extrabold text-slate-800 font-serif-elegant">Pengadilan Asmara</h3>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wider">Angie Feature 🔥</span>
              </div>
              <p class="text-xs text-slate-500 mt-0.5">Selesaikan perdebatan gemes, debat terserah makanan, sampai overthinking jam 2 pagi dengan vonis Hakim Cinta!</p>
            </div>
          </div>

          <button onclick="switchTab('lobby')" 
            class="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition-colors shrink-0 flex items-center gap-1.5 self-start sm:self-auto">
            <span>← Beranda</span>
          </button>
        </div>

        <!-- Active Court Stage Area -->
        <div id="courtStageContainer">
          
          <!-- Default View: Case Catalog -->
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Pilih Perkara yang Mau Disidang:</h4>
              <span class="text-[11px] text-rose-500 font-semibold">Klik salah satu untuk mulai sidang 🔨</span>
            </div>

            <!-- Pre-made Cases Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              ${this.cases.map(c => `
                <div onclick="window.courtGame.selectCase('${c.id}')" 
                  class="group p-4 rounded-2xl bg-white border border-rose-100 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer transform hover:-translate-y-0.5 flex flex-col justify-between">
                  <div>
                    <div class="flex items-center justify-between mb-2">
                      <span class="text-[10px] font-bold text-slate-400 uppercase">${c.category}</span>
                      <span class="text-[10px] font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">${c.badge}</span>
                    </div>
                    <h5 class="font-extrabold text-slate-800 text-xs mb-1 group-hover:text-amber-600 transition-colors">
                      ${c.title}
                    </h5>
                    <p class="text-[11px] text-slate-500 leading-relaxed mb-3">
                      ${c.description}
                    </p>
                  </div>
                  <div class="text-[11px] font-bold text-rose-500 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Gelar Sidang Sekarang</span> →
                  </div>
                </div>
              `).join('')}
            </div>

            <!-- Custom Case Submission Box -->
            <div class="p-5 rounded-3xl bg-gradient-to-r from-purple-50 via-pink-50 to-rose-50 border border-purple-100 shadow-xs space-y-3">
              <div class="flex items-center gap-2">
                <span class="text-lg">✍️</span>
                <h5 class="text-xs font-bold text-slate-800">Punya Masalah Lain yang Mau Digugat ke Ayang? Bikin Kasus Sendiri:</h5>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input type="text" id="courtCustomTitle" placeholder="Judul Kasus (e.g. Lupa ngabarin 4 jam)" 
                  class="sm:col-span-1 px-3.5 py-2 rounded-xl bg-white border border-purple-200 text-xs focus:ring-2 focus:ring-purple-400 outline-none">
                <input type="text" id="courtCustomDesc" placeholder="Keterangan singkat / unek-unek yang mau dituntut..." 
                  class="sm:col-span-2 px-3.5 py-2 rounded-xl bg-white border border-purple-200 text-xs focus:ring-2 focus:ring-purple-400 outline-none">
              </div>
              <button onclick="window.courtGame.createCustomCase()" 
                class="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs shadow-xs hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center gap-1.5">
                <span>➕ Ajukan Gugatan Khusus ke Ayang</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    `;
  }
}

