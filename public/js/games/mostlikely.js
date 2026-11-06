// Mini Game: Siapa Paling Mungkin? (Who's Most Likely To? - Angie Edition)
class MostLikelyGame {
  constructor(socket) {
    this.socket = socket;
    this.currentQuestionIndex = 0;
    this.myChoice = null;
    this.partnerVoted = false;
    this.matchCount = 0;
    this.totalVoted = 0;

    this.questions = [
      {
        question: 'Siapa yang paling sering bilang "Terserah mau makan apa", tapi pas ditawari ditolak semua?',
        category: '🍕 Kuliner & Drama Perut',
        tag: 'Relatable Abiez'
      },
      {
        question: 'Siapa yang paling heboh & panik kalau baterai HP sisa 3% padahal belum kelar urusan?',
        category: '🔋 Baterai & Gadget',
        tag: 'Panik Mode On'
      },
      {
        question: 'Siapa yang paling gampang nangis kalau nonton drakor, anime, atau film sedih?',
        category: '🥺 Sensitif & Melow',
        tag: 'Banjir Air Mata'
      },
      {
        question: 'Siapa yang paling gengsi bilang "Aku kangen kamu" duluan kalau lagi ngambek?',
        category: '💖 Pride & Gengsi',
        tag: 'Gengsi Setinggi Langit'
      },
      {
        question: 'Siapa yang paling sering ketiduran duluan pas lagi vc / call malam-malam?',
        category: '😴 Sleep Call LDR',
        tag: 'Duta Tidur'
      },
      {
        question: 'Siapa yang paling boros kalau liat jajan lucu, snack pedas, atau minuman Mixue?',
        category: '🧋 Jajan & Checkout',
        tag: 'Khilaf Terus'
      },
      {
        question: 'Siapa yang paling bucin dan berubah jadi bayi raksasa manja kalau lagi gak enak badan?',
        category: '🧸 Mode Manja',
        tag: 'Bayi Gemas'
      },
      {
        question: 'Siapa yang paling lama kalau siap-siap atau dandan sebelum jalan kencan?',
        category: '⏳ Waktu Siap-siap',
        tag: 'Ngaca 1 Jam'
      },
      {
        question: 'Siapa yang paling overthinking mikirin hal-hal random pas jam 2 pagi?',
        category: '🌙 Overthinking Malam',
        tag: 'Filosofi Kasur'
      },
      {
        question: 'Siapa yang paling gampang luluh hatinya kalau dirayu pakai kata-kata manis & pelukan?',
        category: '🍯 Hati Lemah Lembut',
        tag: 'Luluh Sekejap'
      },
      {
        question: 'Siapa yang paling cemburuan tapi berusaha keras pasang muka stay cool?',
        category: '👀 Posesif Diam-diam',
        tag: 'Stay Cool Padahal Panas'
      },
      {
        question: 'Siapa yang paling bucin no debat dan gak bisa hidup tanpa ayang?',
        category: '💍 Cinta Mati',
        tag: 'Bucin Maksimal'
      }
    ];

    this.setupEvents();
  }

  setupEvents() {
    this.socket.on('likely-partner-voted', () => {
      this.partnerVoted = true;
      this.updatePartnerPill();
    });

    this.socket.on('likely-reveal', ({ questionIndex, answers, isMatch, consensus }) => {
      this.handleReveal(questionIndex, answers, isMatch, consensus);
    });

    this.socket.on('likely-advance', ({ nextIndex }) => {
      this.currentQuestionIndex = nextIndex;
      this.myChoice = null;
      this.partnerVoted = false;
      this.renderQuestionView();
    });
  }

  vote(person) {
    if (this.myChoice !== null) return;
    this.myChoice = person;

    if (window.soundController) window.soundController.playPop();

    // Visual selection feedback
    const btnBayu = document.getElementById('voteBtn_Bayu');
    const btnEma = document.getElementById('voteBtn_Ema');
    if (person === 'Bayu' && btnBayu) {
      btnBayu.classList.add('ring-4', 'ring-rose-400', 'scale-105');
      if (btnEma) btnEma.classList.add('opacity-40');
    } else if (person === 'Ema' && btnEma) {
      btnEma.classList.add('ring-4', 'ring-purple-400', 'scale-105');
      if (btnBayu) btnBayu.classList.add('opacity-40');
    }

    this.socket.emit('likely-submit-vote', {
      questionIndex: this.currentQuestionIndex,
      chosenPerson: person
    });

    const banner = document.getElementById('likelyStatusBanner');
    if (banner) {
      banner.innerHTML = `
        <div class="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center justify-center gap-2 animate-pulse">
          <span>🔒</span>
          <span>Pilihanmu (${person}) terkunci! Menunggu pilihan ayang...</span>
        </div>
      `;
    }
  }

  updatePartnerPill() {
    const pill = document.getElementById('likelyPartnerPill');
    if (pill) {
      pill.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-500"></span> Ayang sudah vote!';
      pill.className = 'px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center gap-1.5 animate-bounce';
    }
  }

  handleReveal(qIdx, answers, isMatch, consensus) {
    this.totalVoted++;
    if (isMatch) this.matchCount++;

    const currentQ = this.questions[this.currentQuestionIndex];

    if (isMatch) {
      if (window.soundController) window.soundController.playMatchFanfare();
      if (typeof window.triggerConfettiBurst === 'function') window.triggerConfettiBurst();
    } else {
      if (window.soundController) window.soundController.playPop();
    }

    const container = document.getElementById('likelyStageContainer');
    if (!container) return;

    const playerList = window.appState.room ? window.appState.room.players : [];
    const p1 = playerList[0] || { name: 'Player 1' };
    const p2 = playerList[1] || { name: 'Player 2' };
    const ans1 = answers[p1.id] ? answers[p1.id].chosenPerson : 'Bayu';
    const ans2 = answers[p2.id] ? answers[p2.id].chosenPerson : 'Ema';

    container.innerHTML = `
      <div class="p-6 sm:p-8 rounded-3xl bg-white border-2 ${isMatch ? 'border-rose-400' : 'border-amber-300'} shadow-xl space-y-6 animate-fade-in text-center relative overflow-hidden">
        
        <div>
          <div class="w-20 h-20 mx-auto rounded-3xl overflow-hidden shadow-xl border-2 ${isMatch ? 'border-rose-400' : 'border-amber-300'} mb-3 animate-bounce">
            <img src="/images/voting-chibi.jpg" alt="Voting Chibi" class="w-full h-full object-cover">
          </div>
          <span class="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${isMatch ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'}">
            ${isMatch ? `SEPAKAT 100%: ${consensus.toUpperCase()}! 🔥` : 'WADUH SALING TUDUH! 🤣'}
          </span>
          <h4 class="text-base sm:text-lg font-extrabold text-slate-800 font-serif-elegant mt-2">
            "${currentQ.question}"
          </h4>
        </div>

        <!-- Comparison Votes -->
        <div class="grid grid-cols-2 gap-4 max-w-md mx-auto">
          <div class="p-4 rounded-2xl bg-rose-50 border border-rose-200">
            <span class="text-[11px] font-bold text-slate-500 uppercase block">${p1.name} Milih:</span>
            <span class="text-xl font-extrabold text-rose-600 block mt-1">${ans1}</span>
          </div>

          <div class="p-4 rounded-2xl bg-purple-50 border border-purple-200">
            <span class="text-[11px] font-bold text-slate-500 uppercase block">${p2.name} Milih:</span>
            <span class="text-xl font-extrabold text-purple-600 block mt-1">${ans2}</span>
          </div>
        </div>

        <!-- Relatable Punchline -->
        <p class="text-xs font-semibold text-slate-600 italic max-w-sm mx-auto">
          ${isMatch 
            ? `Fix no debat yaa! Kedua belah pihak sama-sama mengakui kalau ${consensus} emang jagonya di bidang ini 😂` 
            : `Hahaha saling lempar tuduhan nih! Wajib klarifikasi di obrolan chat sekarang juga! 📢`}
        </p>

        <!-- Next Button -->
        <div class="pt-2">
          <button onclick="window.mostLikelyGame.advanceToNext()" 
            class="px-8 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-extrabold text-xs shadow-md hover:from-rose-600 hover:to-pink-600 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 mx-auto">
            <span>Pertanyaan Berikutnya ➔</span>
          </button>
        </div>

      </div>
    `;
  }

  advanceToNext() {
    const nextIdx = (this.currentQuestionIndex + 1) % this.questions.length;
    this.socket.emit('likely-next-question', { nextIndex: nextIdx });
  }

  renderQuestionView() {
    const container = document.getElementById('likelyStageContainer');
    if (!container) return;

    const currentQ = this.questions[this.currentQuestionIndex];

    container.innerHTML = `
      <div class="p-6 sm:p-8 rounded-3xl bg-white border border-rose-100 shadow-md space-y-6 animate-fade-in text-center">
        
        <!-- Header -->
        <div class="flex items-center justify-between pb-3 border-b border-rose-100">
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-700 uppercase tracking-wider">
              ${currentQ.category}
            </span>
            <span class="text-xs text-slate-400 font-semibold">#${this.currentQuestionIndex + 1} / ${this.questions.length}</span>
          </div>

          <div id="likelyPartnerPill" class="px-3 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500 flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-slate-300"></span> Ayang belum memilih
          </div>
        </div>

        <!-- Question Prompt -->
        <div class="py-2">
          <span class="text-[11px] font-bold text-rose-500 uppercase tracking-widest block mb-1">SIAPA PALING MUNGKIN...</span>
          <h4 class="text-lg sm:text-xl font-extrabold text-slate-800 font-serif-elegant max-w-lg mx-auto leading-relaxed">
            "${currentQ.question}"
          </h4>
        </div>

        <!-- The 2 Big Choices: BAYU vs EMA -->
        <div class="grid grid-cols-2 gap-4 max-w-md mx-auto pt-2">
          
          <!-- Bayu Option -->
          <button id="voteBtn_Bayu" onclick="window.mostLikelyGame.vote('Bayu')" 
            class="group p-6 rounded-3xl bg-gradient-to-b from-blue-50 to-indigo-50/60 border-2 border-indigo-200 hover:border-indigo-500 hover:shadow-lg transition-all transform hover:-translate-y-1 flex flex-col items-center">
            <div class="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-3xl mb-2 group-hover:scale-110 transition-transform">
              🧸
            </div>
            <span class="font-extrabold text-slate-800 text-base">BAYU</span>
            <span class="text-[11px] text-indigo-600 font-semibold mt-0.5">Pilih Bayu</span>
          </button>

          <!-- Ema Option -->
          <button id="voteBtn_Ema" onclick="window.mostLikelyGame.vote('Ema')" 
            class="group p-6 rounded-3xl bg-gradient-to-b from-rose-50 to-pink-50/60 border-2 border-rose-200 hover:border-rose-500 hover:shadow-lg transition-all transform hover:-translate-y-1 flex flex-col items-center">
            <div class="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-3xl mb-2 group-hover:scale-110 transition-transform">
              🐰
            </div>
            <span class="font-extrabold text-slate-800 text-base">EMA</span>
            <span class="text-[11px] text-rose-600 font-semibold mt-0.5">Pilih Ema</span>
          </button>

        </div>

        <!-- Status Banner -->
        <div id="likelyStatusBanner"></div>

      </div>
    `;
  }

  render() {
    const container = document.getElementById('likelyGameContainer');
    if (!container) return;

    container.innerHTML = `
      <div class="max-w-4xl mx-auto space-y-6">
        
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-3xl bg-white/90 border border-purple-200/80 shadow-xs">
          <div class="flex items-center gap-3">
            <img src="/images/voting-chibi.jpg" alt="Siapa Paling Mungkin Chibi" 
              class="w-14 h-14 rounded-2xl object-cover shadow-md border-2 border-purple-300 ring-2 ring-purple-100 shrink-0">
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-lg sm:text-xl font-extrabold text-slate-800 font-serif-elegant">Siapa Paling Mungkin?</h3>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wider">Angie Feature 🔥</span>
              </div>
              <p class="text-xs text-slate-500 mt-0.5">Vote serentak Bayu atau Ema dalam sekejap! Liat apakah kalian sependapat atau saling tuduh 😜</p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-slate-600">Kompak:</span>
            <span class="px-3 py-1 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 font-extrabold text-xs" id="likelyScoreTop">
              ${this.matchCount} / ${this.totalVoted}
            </span>
          </div>
        </div>

        <!-- Stage Container -->
        <div id="likelyStageContainer"></div>

      </div>
    `;

    this.renderQuestionView();
  }
}

