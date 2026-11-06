// Mini Game: Seberapa Kenal Ayang? (How Well Do You Know Me? - Angie Edition)
class KnowMeGame {
  constructor(socket) {
    this.socket = socket;
    this.currentQuestionIndex = 0;
    this.targetPerson = 'Ema'; // 'Ema' or 'Bayu'
    this.mySelectedAnswer = null;
    this.myRoleInRound = 'guesser'; // 'subject' or 'guesser'
    this.matchCount = 0;
    this.totalAnswered = 0;
    this.partnerStatus = { truthSubmitted: false, guessSubmitted: false };

    this.questions = [
      {
        target: 'Ema',
        badge: 'Tentang Ema 🐰',
        question: 'Kalau mood Ema lagi down atau bad mood seharian, obat paling mujarab yang bikin dia luluh adalah...',
        options: [
          'Minuman Mixue segar / boba dingin + camilan enak 🧋',
          'Didengerin curhatnya tanpa didebat & dipeluk virtual 🥺',
          'Dikasih waktu me-time tenang sambil nonton anime kesukaan 🐉',
          'Digombalin receh sampai gak bisa nahan ketawa 😂'
        ],
        reactionMatch: 'Bener banget! Bayu emang hafal luar dalam apa yang dibutuhin Ema 💕',
        reactionMismatch: 'Waduh salah tebak! Catat di notes ya Bayu, biar gak salah penanganan 😜'
      },
      {
        target: 'Bayu',
        badge: 'Tentang Bayu 🧸',
        question: 'Toxic trait paling lucu dari Bayu kalau lagi kecapekan atau ngantuk berat adalah...',
        options: [
          'Ngomong meracau gak jelas tapi tetep ngotot belum mau tidur 😴',
          'Jadi super manja dan pengen diperhatiin terus 🥰',
          'Gampang ketawa receh sama hal-hal random yang gak lucu 🤣',
          'Tiba-tiba ngilang ketiduran pas lagi pegang HP 📱'
        ],
        reactionMatch: 'Kompak! Ema udah khatam kelakuan Bayu pas low-battery 🔋',
        reactionMismatch: 'Hahaha tebakannya meleset! Bayu punya trik rahasia lain ternyata 🤭'
      },
      {
        target: 'Ema',
        badge: 'Tentang Ema 🐰',
        question: 'Love Language utama yang bikin hati Ema paling melting dan berbunga-bunga:',
        options: [
          'Words of Affirmation (Pujian tulus & kata-kata manis dari Bayu) 💌',
          'Quality Time (Waktu fokus berdua tanpa diganggu hal lain) ⏳',
          'Acts of Service (Tindakan nyata & perhatian peka dari Bayu) 🤝',
          'Receiving Gifts (Kejutan kecil atau hadiah perintilan gemoy) 🎁'
        ],
        reactionMatch: 'Tepat 100%! Hati Ema memang bergetar di frekuensi itu 💖',
        reactionMismatch: 'Kurang tepat tipis! Yuk deep talk lagi soal cara mencintai ayang 😉'
      },
      {
        target: 'Bayu',
        badge: 'Tentang Bayu 🧸',
        question: 'Hal apa tentang Ema yang pertama kali bikin Bayu naksir berat dan gak bisa lupa?',
        options: [
          'Senyum manis dan tatapan matanya yang teduh ✨',
          'Kepribadiannya yang mandiri, kreatif, dan punya jiwa seni 🎨',
          'Cara bicaranya yang asik dan nyambung dari awal chat 💬',
          'Tingkah gemas dan sifat aslinya yang bikin nagih 🥰'
        ],
        reactionMatch: 'Luar biasa! Ema tau betul titik lemah pesonanya di mata Bayu 🔥',
        reactionMismatch: 'Meleset! Yang bener adalah Bayu naksir SEMUANYA tanpa terkecuali 💘'
      },
      {
        target: 'Ema',
        badge: 'Tentang Ema 🐰',
        question: 'Kalau kita punya liburan weekend bareng seharian penuh, vibe yang paling diinginkan Ema:',
        options: [
          'Staycation adem, nonton film seharian sambil ngemil berdua 🛋️',
          'Wisata kuliner nyobain makanan enak & hunting spot aesthetic 🍜',
          'Jalan-jalan santai ke alam yang sejuk (pegunungan / taman) 🌿',
          'Belanja perintilan lucu & jajan pasar malam 🛍️'
        ],
        reactionMatch: 'Match sempurna! Siap-siap agendakan kencan impian ini ya! ✈️',
        reactionMismatch: 'Ema punya rencana tersembunyi lain nih, Bayu musti dengerin lagi! 🗺️'
      },
      {
        target: 'Bayu',
        badge: 'Tentang Bayu 🧸',
        question: 'Reaksi pertama Bayu kalau Ema tiba-tiba ngambek lucu atau manja:',
        options: [
          'Langsung minta maaf dan nanya lembut "Ayang kenapaa?" 🥺',
          'Kirim stiker lucu atau meme biar Ema senyum lagi 🤣',
          'Telepon langsung buat dengerin suaranya sampai tenang 📞',
          'Nawarin jajan atau makanan kesukaan Ema 🛵'
        ],
        reactionMatch: 'Akurat 100%! Bayu emang cowok siaga kalau urusan ayang 🛡️',
        reactionMismatch: 'Ternyata Bayu punya taktik rahasia lain buat bujuk Ema 🤭'
      },
      {
        target: 'Ema',
        badge: 'Tentang Ema 🐰',
        question: 'Topik obrolan malam apa yang paling bikin Ema betah melek berjam-jam bareng Bayu:',
        options: [
          'Rencana & impian masa depan berdua saat udah nikah nanti 🏡',
          'Nostalgia awal-awal kenal dan momen lucu pas jalan berdua 🕰️',
          'Spill the tea & cerita random tentang keseharian masing-masing ☕',
          'Membahas karakter fiksi / anime / serial yang lagi disukai 🐉'
        ],
        reactionMatch: 'Satu frekuensi parah! Chemistry kalian gak ada obatnya! 🧬',
        reactionMismatch: 'Tebakan beda tipis, tapi intinya Ema selalu nyaman ngobrol sama Bayu 💖'
      },
      {
        target: 'Bayu',
        badge: 'Tentang Bayu 🧸',
        question: 'Kapan momen Bayu ngerasa paling bangga dan beruntung punya Ema di sisinya?',
        options: [
          'Pas liat Ema semangat dan berhasil nyelesaiin karyanya 🌟',
          'Pas Ema ngasih perhatian tulus saat Bayu lagi capek kerja 💆‍♂️',
          'Pas ngeliat senyum bahagia Ema waktu diajak jajan makanan enak 🥰',
          'Setiap hari tanpa perlu alasan khusus, literally all the time! 💍'
        ],
        reactionMatch: 'BOOM! Tebakan tepat, kebucinan Bayu terverifikasi resmi! 💯',
        reactionMismatch: 'Hahaha, padahal jawaban Bayu adalah bucin sepanjang waktu! 🚀'
      }
    ];

    this.setupEvents();
  }

  setupEvents() {
    this.socket.on('knowme-round-started', ({ questionIndex, targetPerson }) => {
      this.currentQuestionIndex = questionIndex;
      this.targetPerson = targetPerson;
      this.mySelectedAnswer = null;
      this.partnerStatus = { truthSubmitted: false, guessSubmitted: false };
      this.determineMyRole();
      this.renderQuestionView();
    });

    this.socket.on('knowme-partner-submitted-truth', () => {
      this.partnerStatus.truthSubmitted = true;
      this.updatePartnerStatusIndicator();
    });

    this.socket.on('knowme-partner-submitted-guess', () => {
      this.partnerStatus.guessSubmitted = true;
      this.updatePartnerStatusIndicator();
    });

    this.socket.on('knowme-revealed', ({ truth, guess, isMatch }) => {
      this.handleReveal(truth, guess, isMatch);
    });

    this.socket.on('knowme-advance-question', ({ nextIndex, nextTarget }) => {
      this.currentQuestionIndex = nextIndex;
      this.targetPerson = nextTarget;
      this.mySelectedAnswer = null;
      this.partnerStatus = { truthSubmitted: false, guessSubmitted: false };
      this.determineMyRole();
      this.renderQuestionView();
    });
  }

  determineMyRole() {
    const myName = (window.appState.user.name || '').toLowerCase();
    const isTargetBayu = this.targetPerson.toLowerCase() === 'bayu';
    const isMeBayu = myName.includes('bayu') || !myName.includes('ema'); // host defaults to Bayu if not Ema

    if (isTargetBayu) {
      this.myRoleInRound = isMeBayu ? 'subject' : 'guesser';
    } else {
      this.myRoleInRound = isMeBayu ? 'guesser' : 'subject';
    }
  }

  selectOption(idx) {
    if (this.mySelectedAnswer !== null) return;
    this.mySelectedAnswer = idx;

    const currentQ = this.questions[this.currentQuestionIndex];
    const optionText = currentQ.options[idx];

    // Highlight selected card
    const btn = document.getElementById(`knowmeOpt_${idx}`);
    if (btn) {
      btn.classList.add('border-rose-500', 'bg-rose-50', 'ring-2', 'ring-rose-400');
    }

    if (window.soundController) window.soundController.playPop();

    if (this.myRoleInRound === 'subject') {
      // Locking the genuine truth
      this.socket.emit('knowme-submit-truth', {
        answerIndex: idx,
        answerText: optionText
      });
      this.showWaitingPartner('Jawaban jujurmu terkunci 🔒 Menunggu ayang menebak...');
    } else {
      // Submitting the guess
      this.socket.emit('knowme-submit-guess', {
        guessIndex: idx,
        guessText: optionText
      });
      this.showWaitingPartner('Tebakanmu sudah dikirim 🎯 Menunggu hasil buka kartu...');
    }
  }

  showWaitingPartner(msg) {
    const statusEl = document.getElementById('knowmeStatusBanner');
    if (statusEl) {
      statusEl.innerHTML = `
        <div class="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center justify-center gap-2 animate-pulse">
          <span>⏳</span>
          <span>${msg}</span>
        </div>
      `;
    }
  }

  updatePartnerStatusIndicator() {
    const indicator = document.getElementById('knowmePartnerPill');
    if (indicator) {
      indicator.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-500"></span> Ayang sudah memilih!';
      indicator.className = 'px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center gap-1.5 animate-bounce';
    }
  }

  handleReveal(truth, guess, isMatch) {
    this.totalAnswered++;
    if (isMatch) this.matchCount++;

    const currentQ = this.questions[this.currentQuestionIndex];
    const scorePct = Math.round((this.matchCount / this.totalAnswered) * 100);

    if (isMatch) {
      if (window.soundController) window.soundController.playMatchFanfare();
      if (typeof window.triggerConfettiBurst === 'function') window.triggerConfettiBurst();
    } else {
      if (window.soundController) window.soundController.playPop();
    }

    const container = document.getElementById('knowmeStageContainer');
    if (!container) return;

    container.innerHTML = `
      <div class="p-6 sm:p-8 rounded-3xl bg-white border-2 ${isMatch ? 'border-rose-400' : 'border-purple-200'} shadow-xl space-y-6 animate-fade-in text-center relative overflow-hidden">
        
        <!-- Result Badge -->
        <div>
          <div class="w-18 h-18 mx-auto rounded-3xl overflow-hidden shadow-lg border-2 ${isMatch ? 'border-rose-400' : 'border-purple-300'} mb-3 animate-bounce">
            <img src="/images/quiz-chibi.jpg" alt="Chibi Quiz" class="w-full h-full object-cover">
          </div>
          <span class="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${isMatch ? 'bg-rose-100 text-rose-700' : 'bg-purple-100 text-purple-700'}">
            ${isMatch ? 'TEBAKAN 100% COCOK! ✨' : 'YAH BELUM COCOK! 😜'}
          </span>
          <h4 class="text-lg font-extrabold text-slate-800 font-serif-elegant mt-2">
            ${currentQ.question}
          </h4>
        </div>

        <!-- Answers Comparison -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto text-left">
          
          <div class="p-4 rounded-2xl bg-rose-50 border border-rose-200 shadow-xs">
            <span class="block text-[11px] font-bold text-rose-500 uppercase">Jawaban Asli ${this.targetPerson}:</span>
            <p class="text-xs font-extrabold text-slate-800 mt-1">${truth.answerText}</p>
          </div>

          <div class="p-4 rounded-2xl ${isMatch ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'} shadow-xs">
            <span class="block text-[11px] font-bold ${isMatch ? 'text-emerald-600' : 'text-amber-700'} uppercase">Tebakan Pasangan:</span>
            <p class="text-xs font-extrabold text-slate-800 mt-1">${guess.guessText}</p>
          </div>

        </div>

        <!-- Gen Z Feedback Note -->
        <div class="p-3.5 rounded-2xl ${isMatch ? 'bg-rose-50/70 border-rose-100 text-rose-800' : 'bg-purple-50/70 border-purple-100 text-purple-800'} text-xs font-semibold max-w-lg mx-auto leading-relaxed">
          ${isMatch ? currentQ.reactionMatch : currentQ.reactionMismatch}
        </div>

        <!-- Compatibility Score Bar -->
        <div class="max-w-xs mx-auto space-y-1.5 pt-2">
          <div class="flex items-center justify-between text-xs font-bold text-slate-600">
            <span>Chemistry Meter:</span>
            <span class="text-rose-600">${scorePct}% Cocok</span>
          </div>
          <div class="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
            <div class="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full transition-all duration-700" style="width: ${scorePct}%"></div>
          </div>
        </div>

        <!-- Next Question Action -->
        <div class="pt-2">
          <button onclick="window.knowMeGame.advanceToNext()" 
            class="px-8 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-extrabold text-xs shadow-md hover:from-rose-600 hover:to-pink-600 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 mx-auto">
            <span>Lanjut ke Pertanyaan Berikutnya ➔</span>
          </button>
        </div>

      </div>
    `;
  }

  advanceToNext() {
    const nextIdx = (this.currentQuestionIndex + 1) % this.questions.length;
    const nextQ = this.questions[nextIdx];
    this.socket.emit('knowme-next-question', {
      nextIndex: nextIdx,
      nextTarget: nextQ.target
    });
  }

  renderQuestionView() {
    const container = document.getElementById('knowmeStageContainer');
    if (!container) return;

    const currentQ = this.questions[this.currentQuestionIndex];
    const isSubject = this.myRoleInRound === 'subject';

    container.innerHTML = `
      <div class="p-6 sm:p-8 rounded-3xl bg-white border border-rose-100 shadow-md space-y-6 animate-fade-in">
        
        <!-- Header / Role Banner -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-rose-100">
          <div>
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-700 uppercase tracking-wider">
                ${currentQ.badge}
              </span>
              <span class="text-xs text-slate-400 font-semibold">Pertanyaan #${this.currentQuestionIndex + 1} / ${this.questions.length}</span>
            </div>
            <h4 class="text-base sm:text-lg font-extrabold text-slate-800 font-serif-elegant mt-1">
              ${currentQ.question}
            </h4>
          </div>

          <div id="knowmePartnerPill" class="px-3 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500 flex items-center gap-1.5 self-start sm:self-auto">
            <span class="w-2 h-2 rounded-full bg-slate-300"></span> Ayang belum memilih
          </div>
        </div>

        <!-- Role Directive Box -->
        <div class="p-3.5 rounded-2xl ${isSubject ? 'bg-purple-50 border border-purple-100 text-purple-900' : 'bg-rose-50 border border-rose-100 text-rose-900'} text-xs font-semibold flex items-center gap-2">
          <span class="text-base">${isSubject ? '🎯' : '🔮'}</span>
          <span>
            ${isSubject 
              ? `<b>Giliranmu!</b> Pilih opsi yang <b>paling jujur</b> menggambarkan dirimu. Jawabanmu akan dikunci rahasia untuk ditebak ayang.` 
              : `<b>Tebak Ayang!</b> Pilih jawaban yang menurutmu <b>paling mewakili ${this.targetPerson}</b>.`}
          </span>
        </div>

        <!-- Options Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          ${currentQ.options.map((opt, idx) => `
            <button id="knowmeOpt_${idx}" onclick="window.knowMeGame.selectOption(${idx})" 
              class="group p-4 rounded-2xl text-left bg-white border border-rose-100 hover:border-rose-400 hover:bg-rose-50/50 hover:shadow-md transition-all text-xs font-semibold text-slate-700 flex items-start gap-2.5">
              <span class="w-6 h-6 rounded-xl bg-rose-100 text-rose-600 font-bold flex items-center justify-center shrink-0 text-[11px] group-hover:scale-110 transition-transform">
                ${String.fromCharCode(65 + idx)}
              </span>
              <span class="mt-0.5 leading-relaxed">${opt}</span>
            </button>
          `).join('')}
        </div>

        <!-- Status Banner -->
        <div id="knowmeStatusBanner"></div>

      </div>
    `;
  }

  render() {
    const container = document.getElementById('knowmeGameContainer');
    if (!container) return;

    this.determineMyRole();

    container.innerHTML = `
      <div class="max-w-4xl mx-auto space-y-6">
        
        <!-- Header Section -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-3xl bg-white/90 border border-indigo-200/80 shadow-xs">
          <div class="flex items-center gap-3">
            <img src="/images/quiz-chibi.jpg" alt="Seberapa Kenal Ayang Chibi" 
              class="w-14 h-14 rounded-2xl object-cover shadow-md border-2 border-indigo-300 ring-2 ring-indigo-100 shrink-0">
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-lg sm:text-xl font-extrabold text-slate-800 font-serif-elegant">Seberapa Kenal Ayang?</h3>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 uppercase tracking-wider">Angie Feature 🔥</span>
              </div>
              <p class="text-xs text-slate-500 mt-0.5">Satu orang kunci jawaban aslinya, pasangan tebak pilihannya! Uji kepekaan rasa cinta kalian 💕</p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-slate-600">Skor Cocok:</span>
            <span class="px-3 py-1 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 font-extrabold text-xs" id="knowmeScoreTop">
              ${this.matchCount} / ${this.totalAnswered}
            </span>
          </div>
        </div>

        <!-- Stage Container -->
        <div id="knowmeStageContainer"></div>

      </div>
    `;

    this.renderQuestionView();
  }
}

