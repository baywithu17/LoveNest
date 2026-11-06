// Mini Game 1: Sehati Sejiwa (Couple Telepathy Quiz - Bayu & Ema Special Edition)
class TelepathyGame {
  constructor(socket) {
    this.socket = socket;
    this.currentQuestionIndex = 0;
    this.mySelectedAnswer = null;
    this.partnerAnswered = false;
    this.matchCount = 0;
    this.streak = 0;
    this.totalAnswered = 0;

    // 100% relate to BOTH Bayu and Ema's real WhatsApp chat history & personal facts
    // Pure, natural choices without any hints or clues in parentheses!
    this.questions = [
      // 1. Minuman Mixue Ema
      {
        category: "Minuman Mixue Ema 🧋",
        question: "Kalau Ema lagi pengen minuman Mixue yang segar dan manis, varian apa yang dia pilih?",
        options: [
          "Creamy Blueberry",
          "Milky Berry",
          "Strawberry Peach Jasmine",
          "Fresh Lemonade"
        ]
      },
      // 2. Mixue Bayu
      {
        category: "Minuman Mixue Bayu 🧋",
        question: "Varian minuman Mixue apa yang pernah dipesan Bayu?",
        options: [
          "Hazelnut less sugar",
          "Fresh Lemonade",
          "Kiwi Smoothies",
          "Brown Sugar Boba"
        ]
      },
      // 3. Kebiasaan Belanja Bayu
      {
        category: "Kebiasaan Bayu 🛒",
        question: "Kebiasaan Bayu kalau lagi jalan-jalan ke toko kerajinan atau Mr. DIY adalah...",
        options: [
          "Bawa troli dorong belanja sendiri",
          "Langsung keluar dalam 5 menit",
          "Duduk nunggu di parkiran",
          "Cuma titip barang dari luar"
        ]
      },
      // 4. Minuman Mixue Segar Ema
      {
        category: "Minuman Mixue Ema 🧋",
        question: "Kalau Ema lagi pengen minuman Mixue yang segar aja, varian apa yang dia pesan?",
        options: [
          "Milky Berry",
          "Creamy Blueberry",
          "Brown Sugar Boba",
          "Kiwi Fruit Tea"
        ]
      },
      // 5. Bakso Favorit Bayu
      {
        category: "Selera Bakso Bayu 🍜",
        question: "Pentol bakso yang paling disukai Bayu kalau lagi makan bakso adalah...",
        options: [
          "Pentol grenjel urat",
          "Pentol halus kecil",
          "Pentol tahu putih",
          "Pentol telur puyuh"
        ]
      },
      // 6. Bakso Favorit Ema
      {
        category: "Selera Bakso Ema 🍜",
        question: "Di antara pilihan bakso berikut, bakso mana yang paling disukai Ema?",
        options: [
          "Bakso Kopang",
          "Bakso Rembiga",
          "Bakso Solo",
          "Bakso Malang"
        ]
      },
      // 7. Cara Makan Strawberry Bayu
      {
        category: "Cara Makan Unik Bayu 🍓",
        question: "Cara makan buah strawberry yang paling juara menurut Bayu adalah...",
        options: [
          "Dicocol coklat cair",
          "Dijus pake susu kental manis",
          "Dimakan langsung tanpa dicuci",
          "Dicampur es buah kuah santan"
        ]
      },
      // 8. Hobi Kerajinan Bayu
      {
        category: "Bakat & Hobi Bayu 🎨",
        question: "Karya kerajinan tangan apa yang paling disukai dan sering dibikin Bayu?",
        options: [
          "Paper craft",
          "Anyaman bambu",
          "Lukisan cat minyak",
          "Batik tulis"
        ]
      },
      // 9. Pantangan Ema
      {
        category: "Pantangan Ema 🚫",
        question: "Minuman apa yang paling gak disukai Ema bahkan sampai sekarang gak bisa dia minum?",
        options: [
          "Matcha",
          "Es Coklat",
          "Kopi Susu",
          "Teh Mint"
        ]
      },
      // 10. Posisi Keluarga Bayu
      {
        category: "Keluarga Bayu 👨‍👩‍👧‍👦",
        question: "Urutan posisi Bayu dalam saudara kandungnya adalah...",
        options: [
          "Anak paling kecil",
          "Anak sulung pertama",
          "Anak kedua tengah",
          "Anak tunggal"
        ]
      },
      // 11. Urusan Memasak
      {
        category: "Urusan Memasak 🍳",
        question: "Tentang urusan memasak di dapur, siapa di antara kita yang lebih suka memasak?",
        options: [
          "Bayu",
          "Ema",
          "Dua-duanya suka",
          "Dua-duanya gak suka"
        ]
      },
      // 12. Prinsip Bayu
      {
        category: "Prinsip Bayu 💭",
        question: "Pola pikir atau sistem apa yang sangat gak disukai Bayu walau dia seorang cowok?",
        options: [
          "Patriarki",
          "Gotong royong",
          "Musyawarah mufakat",
          "Saling menghargai"
        ]
      },
      // 13. Kopi Favorit Ema
      {
        category: "Kopi Favorit Ema ☕",
        question: "Gimana cara Ema menikmati kopi yang paling dia sukai?",
        options: [
          "Kopi dingin",
          "Kopi hitam panas",
          "Kopi tubruk",
          "Kopi jahe hangat"
        ]
      },
      // 14. Kebiasaan Bayu Kalau Asik Belanja
      {
        category: "Kebiasaan Bayu 🛍️",
        question: "Apa yang sering terjadi kalau Bayu udah masuk ke toko barang kreatif atau DIY?",
        options: [
          "Suka lupa diri saking asiknya",
          "Bosan dalam hitungan menit",
          "Nyuruh orang lain yang belanja",
          "Gak beli apa-apa sama sekali"
        ]
      },
      // 15. Aroma yang Dihindari Ema
      {
        category: "Aroma yang Dihindari 🌸",
        question: "Aroma seperti apa yang paling gak disukai oleh Ema?",
        options: [
          "Aroma manis",
          "Aroma kopi",
          "Aroma daun mint",
          "Aroma vanila lembut"
        ]
      },
      // 16. Penampilan Cowok Ema
      {
        category: "Penampilan Cowok 💇‍♂️",
        question: "Gaya rambut cowok kayak gimana yang paling gak disukai Ema?",
        options: [
          "Rambut gondrong",
          "Rambut cepak rapi",
          "Rambut undercut",
          "Rambut belah tengah"
        ]
      },
      // 17. Warna yang Dihindari Ema
      {
        category: "Warna yang Dihindari 🎨",
        question: "Warna apa yang paling gak disukai Ema?",
        options: [
          "Pink",
          "Biru",
          "Hitam",
          "Sage green"
        ]
      },
      // 18. Aksesori yang Dihindari Ema
      {
        category: "Aksesori Ema ✨",
        question: "Warna perhiasan atau aksesori apa yang paling dihindari Ema?",
        options: [
          "Emas",
          "Silver",
          "Rose gold",
          "Putih"
        ]
      },
      // 19. Anime Ema Sejak SMP
      {
        category: "Anime Sejak SMP 🐉",
        question: "Anime apa yang udah disukai dan ditonton Ema sejak zaman SMP?",
        options: [
          "Dragon Ball",
          "Naruto",
          "One Piece",
          "Doraemon"
        ]
      },
      // 20. Lauk Sederhana Ema
      {
        category: "Lauk Sederhana 🍲",
        question: "Lauk sederhana rumahan apa yang disukai Ema?",
        options: [
          "Telur dadar",
          "Rawon daging",
          "Belut goreng",
          "Sayur kluwek"
        ]
      },
      // 21. Bagian Ayam Ema
      {
        category: "Bagian Ayam 🍗",
        question: "Bagian ayam apa yang disukai Ema meskipun makannya agak ribet?",
        options: [
          "Kepala ayam",
          "Ceker ayam",
          "Paha bawah",
          "Kulit ayam"
        ]
      },
      // 22. Snack Pedas Ema
      {
        category: "Snack Pedas 🌶️",
        question: "Snack pedas apa yang pernah dibeli dan dibahas Ema di chat?",
        options: [
          "BonCabe Level 50",
          "Keripik Maicih",
          "Makaroni Ngehe",
          "Basreng Pedas Daun Jeruk"
        ]
      },
      // 23. Hujan-hujanan Ema
      {
        category: "Hujan-hujanan 🌧️",
        question: "Kapan Ema merasa senang kalau terkena air hujan?",
        options: [
          "Pas perjalanan pulang",
          "Pas baru mau berangkat",
          "Pas nongkrong di luar",
          "Pas lagi pagi hari"
        ]
      },
      // 24. Liburan ke Pantai Ema
      {
        category: "Liburan ke Pantai 🏖️",
        question: "Apa yang membuat Ema berpikir dua kali kalau diajak ke pantai?",
        options: [
          "Panas terik mataharinya",
          "Takut ombak besar",
          "Takut pasir basah",
          "Gak suka bau air laut"
        ]
      },
      // 25. Saat Ema Ngambek
      {
        category: "Saat Ema Ngambek 🥰",
        question: "Kalau Ema lagi marah atau ngambek, apa yang sebenarnya dia sukai dari Bayu?",
        options: [
          "Dirayu dengan sabar",
          "Ditinggal sendirian",
          "Didebat argumennya",
          "Diabaikan seharian"
        ]
      },
      // 26. Minuman Teh Ema
      {
        category: "Minuman Teh 🍃",
        question: "Campuran apa yang disukai Ema saat minum teh?",
        options: [
          "Daun mint asli",
          "Lemon peras",
          "Jahe merah",
          "Susu kental manis"
        ]
      },
      // 27. Makanan Berkuah Ema
      {
        category: "Makanan Berkuah 🍜",
        question: "Makanan berkuah gurih apa yang pernah disebut Ema sebagai makanan kesukaannya?",
        options: [
          "Mie ayam",
          "Rawon",
          "Seblak kencur",
          "Soto babat"
        ]
      },
      // 28. Sifat Bayu
      {
        category: "Sifat Bayu 💖",
        question: "Apa sifat dari Bayu yang paling membuat Ema merasa tenang dan bersyukur?",
        options: [
          "Kedewasaannya",
          "Selalu ngatur",
          "Gampang panik",
          "Suka basa-basi"
        ]
      }
    ];

    this.setupEvents();
  }

  setupEvents() {
    this.socket.on('telepathy-partner-answered', ({ questionIndex }) => {
      if (questionIndex === this.currentQuestionIndex) {
        this.partnerAnswered = true;
        this.updatePartnerAnswerStatus();
      }
    });

    this.socket.on('telepathy-reveal', ({ questionIndex, answers, isMatch }) => {
      this.handleReveal(questionIndex, answers, isMatch);
    });

    this.socket.on('telepathy-change-question', ({ nextIndex }) => {
      this.currentQuestionIndex = nextIndex % this.questions.length;
      this.renderQuestion();
    });
  }

  renderQuestion() {
    const q = this.questions[this.currentQuestionIndex];
    this.mySelectedAnswer = null;
    this.partnerAnswered = false;

    const container = document.getElementById('telepathyGameContainer');
    if (!container) return;

    container.innerHTML = `
      <div class="max-w-2xl mx-auto">
        <!-- Question Header -->
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <span class="px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-600 border border-rose-200">
              ${q.category}
            </span>
            <span class="text-xs font-medium text-slate-400">Pertanyaan ${this.currentQuestionIndex + 1} dari ${this.questions.length}</span>
          </div>
          <div class="flex items-center gap-2 text-xs font-bold text-rose-500 bg-rose-50 px-3 py-1 rounded-full">
            <span>🔥 Streak: ${this.streak}</span>
            <span>•</span>
            <span>❤️ Match: ${this.matchCount}</span>
          </div>
        </div>

        <!-- Question Card -->
        <div class="glass-panel rounded-3xl p-6 sm:p-8 text-center mb-6 shadow-sm border border-rose-100 relative overflow-hidden bg-white/90">
          <div class="text-3xl mb-2 animate-bounce">✨</div>
          <h3 class="text-xl sm:text-2xl font-bold text-slate-800 leading-relaxed font-serif-elegant">
            "${q.question}"
          </h3>
          <p class="text-xs text-rose-500 font-medium mt-2">Buktikan seberapa kenal dan sehati Bayu & Ema!</p>
        </div>

        <!-- Options Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6" id="telepathyOptionsList">
          ${q.options.map((opt, idx) => `
            <button onclick="window.telepathyGame.selectAnswer(${idx})" 
              class="telepathy-opt-btn text-left p-4 rounded-2xl border border-rose-100 bg-white hover:border-rose-400 hover:bg-rose-50/50 hover:shadow-md transition-all duration-200 group flex items-start gap-3"
              id="optBtn_${idx}">
              <span class="w-7 h-7 rounded-xl bg-rose-50 group-hover:bg-rose-500 group-hover:text-white text-rose-600 font-bold text-xs flex items-center justify-center shrink-0 transition-colors shadow-xs">
                ${String.fromCharCode(65 + idx)}
              </span>
              <span class="text-xs sm:text-sm font-semibold text-slate-700 leading-snug group-hover:text-slate-900">${opt}</span>
            </button>
          `).join('')}
        </div>

        <!-- Status & Waiting Indicator -->
        <div id="telepathyStatusBox" class="glass-panel-subtle rounded-2xl p-4 text-center text-xs font-semibold text-slate-500 flex items-center justify-center gap-2">
          <span>Pilih jawaban yang paling tepat menurutmu di atas</span>
        </div>

        <!-- Revealed Answers Modal / Banner (Hidden initially) -->
        <div id="telepathyRevealArea" class="hidden mt-6"></div>
      </div>
    `;
  }

  selectAnswer(answerIndex) {
    if (this.mySelectedAnswer !== null) return;
    this.mySelectedAnswer = answerIndex;

    const q = this.questions[this.currentQuestionIndex];
    const selectedText = q.options[answerIndex];

    // Highlight selected button
    document.querySelectorAll('.telepathy-opt-btn').forEach(b => {
      b.classList.remove('ring-2', 'ring-rose-500', 'bg-rose-50');
      b.disabled = true;
    });
    const btn = document.getElementById(`optBtn_${answerIndex}`);
    if (btn) {
      btn.classList.add('ring-2', 'ring-rose-500', 'bg-rose-100/70');
    }

    if (window.soundController) window.soundController.playPop();

    // Submit to server
    this.socket.emit('telepathy-submit-answer', {
      questionIndex: this.currentQuestionIndex,
      answerIndex,
      answerText: selectedText
    });

    this.updatePartnerAnswerStatus();
  }

  updatePartnerAnswerStatus() {
    const statusBox = document.getElementById('telepathyStatusBox');
    if (!statusBox) return;

    if (this.mySelectedAnswer !== null && this.partnerAnswered) {
      statusBox.innerHTML = `
        <div class="flex items-center gap-2 text-rose-600 font-bold animate-pulse">
          <span>💖 Membuka jawaban kalian berdua...</span>
        </div>
      `;
    } else if (this.mySelectedAnswer !== null) {
      statusBox.innerHTML = `
        <div class="flex items-center gap-2 text-amber-600 font-semibold">
          <span class="animate-spin inline-block">⏳</span>
          <span>Jawabanmu tersimpan! Menunggu pasanganmu memilih...</span>
        </div>
      `;
    } else if (this.partnerAnswered) {
      statusBox.innerHTML = `
        <div class="flex items-center gap-2 text-emerald-600 font-bold animate-bounce">
          <span>💌 Pasanganmu sudah mengunci jawabannya! Sekarang giliranmu!</span>
        </div>
      `;
    }
  }

  handleReveal(questionIndex, answers, isMatch) {
    this.totalAnswered++;
    const q = this.questions[questionIndex];

    const currentRoom = window.appState.room;
    const p1 = currentRoom && currentRoom.players[0] ? currentRoom.players[0] : { name: 'Bayu', avatar: '🧸' };
    const p2 = currentRoom && currentRoom.players[1] ? currentRoom.players[1] : { name: 'Ema', avatar: '🐰' };

    const a1 = answers[p1.id] || { answerIndex: 0, answerText: '-' };
    const a2 = answers[p2.id] || { answerIndex: 0, answerText: '-' };

    if (isMatch) {
      this.matchCount++;
      this.streak++;
      if (window.soundController) window.soundController.playMatchFanfare();
      if (window.triggerConfetti) window.triggerConfetti();
    } else {
      this.streak = 0;
      if (window.soundController) window.soundController.playMissSound();
    }

    const revealArea = document.getElementById('telepathyRevealArea');
    const statusBox = document.getElementById('telepathyStatusBox');
    if (statusBox) statusBox.classList.add('hidden');

    if (revealArea) {
      revealArea.classList.remove('hidden');
      revealArea.innerHTML = `
        <div class="rounded-3xl p-6 ${isMatch ? 'bg-gradient-to-br from-rose-50 to-pink-100 border-2 border-rose-300' : 'bg-gradient-to-br from-slate-50 to-amber-50 border border-slate-200'} text-center shadow-md animate-fade-in">
          <div class="text-4xl mb-2">${isMatch ? '💖 BINGO! SEHATI SEJIWA! 💖' : '✨ BEDA TAPI TETAP SALING MELENGKAPI ✨'}</div>
          <p class="text-xs sm:text-sm font-bold ${isMatch ? 'text-rose-600' : 'text-amber-700'} mb-5">
            ${isMatch ? 'Hebat banget! Pikiran dan ingatan kalian berdua bener-bener sinkron!' : 'Jawaban berbeda bikin obrolan nostalgia kita makin seru dan berkesan!'}
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left mb-6">
            <div class="p-4 rounded-2xl bg-white shadow-xs border border-rose-100 flex items-start gap-3">
              <span class="text-3xl">${p1.avatar}</span>
              <div>
                <p class="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">${p1.name}</p>
                <p class="text-xs sm:text-sm font-bold text-slate-800">${a1.answerText}</p>
              </div>
            </div>
            <div class="p-4 rounded-2xl bg-white shadow-xs border border-rose-100 flex items-start gap-3">
              <span class="text-3xl">${p2.avatar}</span>
              <div>
                <p class="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">${p2.name}</p>
                <p class="text-xs sm:text-sm font-bold text-slate-800">${a2.answerText}</p>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-center gap-3">
            <button onclick="window.telepathyGame.nextQuestion()" 
              class="px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-xs sm:text-sm shadow-md hover:from-rose-600 hover:to-pink-600 hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0">
              Lanjut Pertanyaan Berikutnya ➡️
            </button>
          </div>
        </div>
      `;
    }
  }

  nextQuestion() {
    const nextIdx = (this.currentQuestionIndex + 1) % this.questions.length;
    this.socket.emit('telepathy-next-question', { nextIndex: nextIdx });
  }
}

window.TelepathyGame = TelepathyGame;
