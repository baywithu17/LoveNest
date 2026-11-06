// Mini Game 2: Roda Asmara & Deep Talk (Bayu & Ema Special Edition - No-Repeat Sync Decks)
class DeepTalkGame {
  constructor(socket) {
    this.socket = socket;
    this.activeCategory = 0;
    this.currentCard = '';
    this.isOpen = false;
    this.drawerName = 'Pasangan';
    this.usedCount = 0;
    this.totalCount = 0;

    // Rich curated decks for both Bayu & Ema based on real WhatsApp chat history
    this.categories = [
      {
        id: 'sweet',
        name: 'Romantis & Nostalgia',
        badge: '💖 Romantis & Nostalgia',
        color: 'from-rose-500 to-pink-500',
        bg: 'bg-rose-50 border-rose-200 text-rose-700',
        cards: [
          'Ingat gak momen pertama kali obrolan kita di WhatsApp mulai kerasa spesial dan bikin nunggu-nunggu balasan?',
          'Apa satu hal tentang profil atau pembawaan Bayu yang pertama kali bikin Ema ngerasa tertarik dan nyaman?',
          'Kapan momen ketika Bayu mendengarkan keluh kesah Ema yang paling bikin hati Ema merasa benar-benar tenang dan didengar?',
          'Momen jalan berdua atau kunjungan mana (ke Narmada, Kopang, atau Sembalun) yang paling berkesan dan bikin kangen?',
          'Apa kebiasaan kecil dari Bayu yang diam-diam paling disukai dan disyukuri oleh Ema?',
          'Apa hal tentang kemandirian dan bakat seni Ema yang pertama kali bikin Bayu kagum?',
          'Kalau kita berdua bisa memutar waktu dan mengulang satu hari paling manis di masa lalu kita tanpa beban, hari apa yang ingin kamu ulangi?',
          'Apa panggilan sayang atau kalimat khas kita berdua yang paling bikin tersenyum sendiri kalau lagi kangen?',
          'Lagu atau melodi apa yang kalau didengar pas lagi sendirian, langsung otomatis bikin kamu keinget wajah pasangan?',
          'Apa pujian paling tulus dan sederhana dari pasangan yang masih kamu ingat sampai hari ini?'
        ]
      },
      {
        id: 'deeptalk',
        name: 'Deep Talk & Rasa Aman',
        badge: '🔮 Deep Talk & Rasa Aman',
        color: 'from-purple-500 to-indigo-600',
        bg: 'bg-purple-50 border-purple-200 text-purple-700',
        cards: [
          'Dalam hubungan LDR ini, apa satu hal dari pasangan yang paling membuatmu merasa aman dan yakin kita akan sampai di tujuan bersama?',
          'Kapan terakhir kali kamu merasa lelah atau overthinking tapi ditahan sendiri? Apa yang bisa pasangan lakukan untuk meringankannya?',
          'Menurutmu, apa arti kedewasaan dalam hubungan kita berdua ketika menghadapi jarak dan kesibukan masing-masing?',
          'Bagaimana caramu merasa paling dicintai dan dihargai ketika kita hanya bisa berkomunikasi lewat chat dan suara?',
          'Apa impian masa depan paling sederhana yang ingin segera kita wujudkan bersama saat nanti jarak ini sudah selesai?',
          'Apa ketakutan terbesarmu saat kita sedang terpisah jarak, dan bagaimana cara terbaik agar kita bisa saling menenangkan?',
          'Dalam hal apa kamu merasa pasanganmu sudah banyak berkembang menjadi pribadi yang lebih baik sejak kita kenal?',
          'Apakah ada unek-unek kecil atau hal yang selama ini ragu kamu utarakan, tapi ingin kamu sampaikan dengan jujur malam ini?',
          'Apa hal yang paling kamu banggakan dari pasanganmu di depan teman-teman atau keluargamu?',
          'Saat salah satu dari kita sedang sibuk atau lelah, kalimat seperti apa yang paling kamu butuhkan untuk didengar?'
        ]
      },
      {
        id: 'funny',
        name: 'Kocak & Usil',
        badge: '😂 Kocak & Usil',
        color: 'from-amber-400 to-orange-500',
        bg: 'bg-amber-50 border-amber-200 text-amber-700',
        cards: [
          'Bayangkan kalau Ema dipaksa minum Matcha panas sambil nonton bola 90 menit bareng cowok gondrong beraroma manis. Seberapa tersiksa ekspresinya?',
          'Kalau Bayu dilarang masak selama 1 bulan penuh dan Ema yang harus jadi koki utama di rumah, kira-kira kita bakal makan apa tiap hari?',
          'Kebiasaan Bayu kalau masuk toko kreatif atau Mr. DIY bawa troli dorong dan suka lupa diri, coba ceritakan gimana lucunya!',
          'Coba tirukan ekspresi wajah Ema pas lagi ngambek tapi sebenarnya diam-diam pengen dirayu!',
          'Kalau tiba-tiba ada belut atau lele meluncur di lantai depan kita berdua, siapa yang bakal paling heboh teriak dan loncat?',
          'Siapa di antara kita yang paling sering bilang "terserah" tapi pas dikasih pilihan makanan malah nolak semua?',
          'Kalau kita berdua kehujanan di jalan pas lagi pulang, siapa yang bakal menikmati hujan-hujanan dan siapa yang sibuk ngelindungin barang?',
          'Kalau ada lomba makan pedas BonCabe Level 50 antara Bayu dan Ema, siapa yang bakal nyerah dan minum susu duluan?',
          'Kalau hidup percintaan kita berdua dibikin judul sinetron atau drama komedi, apa judul paling kocak yang cocok?',
          'Siapa yang paling gampang lapar di tengah malam dan ngajak jajan atau ngemil?'
        ]
      },
      {
        id: 'dare',
        name: 'Tantangan Manis (Dare)',
        badge: '🔥 Tantangan Manis',
        color: 'from-red-500 to-rose-600',
        bg: 'bg-red-50 border-red-200 text-red-700',
        cards: [
          'Tantangan: Tatap kamera atau foto pasangan selama 15 detik penuh sambil tersenyum tanpa boleh tertawa atau buang muka!',
          'Tantangan: Kirimkan 1 pesan chat atau voice note gombalan paling maut yang belum pernah kamu katakan sebelumnya sekarang juga!',
          'Tantangan: Sebutkan 3 hal unik dari pasangan yang cuma kamu yang tahu, secara cepat tanpa jeda mikir!',
          'Tantangan: Ucapkan satu kalimat rayuan paling manis untuk pasangan seolah-olah dia sedang ngambek berat di depanmu!',
          'Tantangan: Kirimkan selfie ekspresi wajah paling lucu / gemoy di chat sekarang juga!',
          'Tantangan: Bikin puisi kilat 4 baris yang menggambarkan betapa kangennya kamu sama dia saat LDR ini!',
          'Tantangan: Tirukan cara bicara atau kebiasaan khas pasanganmu selama 15 detik di call suara!',
          'Tantangan: Sebutkan 1 janji manis yang ingin kamu tepati saat nanti kita ketemu langsung!',
          'Tantangan: Buat panggilan sayang baru yang paling absurd tapi lucu khusus untuk malam ini!',
          'Tantangan: Ungkapkan satu hal yang paling bikin kamu bersyukur punya dia dalam hidupmu dengan nada paling tulus!'
        ]
      }
    ];

    this.setupEvents();
  }

  setupEvents() {
    // Synchronized Server State Handler
    this.socket.on('deeptalk-state-updated', (state) => {
      this.activeCategory = state.categoryIndex !== undefined ? state.categoryIndex : this.activeCategory;
      this.isOpen = !!state.isOpen;
      this.currentCard = state.card || '';
      this.drawerName = state.drawerName || 'Pasangan';
      this.usedCount = state.usedCount || 0;
      this.totalCount = state.totalCount || this.categories[this.activeCategory].cards.length;

      if (state.isReshuffled) {
        this.showToast('🔀 Semua kartu di topik ini sudah selesai dibahas! Mengocok ulang tumpukan kartu...');
      }

      if (state.action === 'card-opened') {
        if (window.soundController) window.soundController.playCardFlip();
      } else if (state.action === 'category-changed') {
        if (window.soundController) window.soundController.playPop();
      }

      this.render();
    });

    // Synchronized Reactions
    this.socket.on('deeptalk-reaction-received', ({ senderName, senderAvatar, reaction }) => {
      this.showReactionBanner(senderName, senderAvatar, reaction);
      if (window.soundController) window.soundController.playPop();
    });
  }

  syncWithServer() {
    this.socket.emit('deeptalk-get-state', (state) => {
      if (state) {
        this.activeCategory = state.categoryIndex !== undefined ? state.categoryIndex : 0;
        this.isOpen = !!state.isOpen;
        this.currentCard = state.card || '';
        this.drawerName = state.drawerName || 'Pasangan';
        this.usedCount = state.usedCount || 0;
        this.totalCount = state.totalCount || this.categories[this.activeCategory].cards.length;
        this.render();
      }
    });
  }

  render() {
    const container = document.getElementById('deeptalkGameContainer');
    if (!container) return;

    const currentCat = this.categories[this.activeCategory];
    const totalCards = currentCat.cards.length;

    container.innerHTML = `
      <div class="max-w-xl mx-auto space-y-4">
        <!-- Header with Chibi Art -->
        <div class="p-4 sm:p-5 rounded-3xl bg-white/90 border border-pink-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div class="flex items-center gap-3.5">
            <img src="/images/deeptalk-chibi.jpg" alt="Deep Talk Chibi" 
              class="w-16 h-16 rounded-2xl object-cover shadow-md border-2 border-pink-300 ring-2 ring-pink-100 shrink-0">
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-lg sm:text-xl font-extrabold text-slate-800 font-serif-elegant">Roda Asmara & Deep Talk</h3>
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-pink-100 text-pink-700 uppercase tracking-wider">Honest Cards 💌</span>
              </div>
              <p class="text-xs text-slate-500 mt-0.5">Tarik kartu 3D kejujuran, nostalgia manis, obrolan rasa aman & tantangan lucu!</p>
            </div>
          </div>

          <button onclick="switchTab('lobby')" 
            class="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition-colors shrink-0 flex items-center gap-1.5">
            <span>← Beranda</span>
          </button>
        </div>

        <div class="text-center">
          <!-- Category Selector Tabs -->
          <div class="flex flex-wrap items-center justify-center gap-2 mt-1" id="deeptalkCatButtons">
            ${this.categories.map((cat, idx) => `
              <button onclick="window.deepTalkGame.changeCategory(${idx})"
                class="category-tab px-3.5 py-2 rounded-2xl text-xs font-bold transition-all shadow-xs ${
                  this.activeCategory === idx 
                    ? 'bg-gradient-to-r ' + cat.color + ' text-white shadow-md scale-105 ring-2 ring-rose-300' 
                    : 'bg-white border border-rose-100 text-slate-600 hover:bg-rose-50'
                }">
                ${cat.badge}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Main Card Display -->
        <div class="my-5 flex justify-center">
          ${!this.isOpen ? `
            <!-- Card Covered (Tutup) -->
            <div onclick="window.deepTalkGame.openNewCard()" 
              class="w-full max-w-sm h-80 rounded-3xl p-6 glass-panel border-2 border-rose-200 shadow-xl bg-gradient-to-br from-rose-50 via-white to-pink-50 flex flex-col items-center justify-between cursor-pointer transform hover:scale-[1.02] transition-all select-none">
              
              <div class="w-full flex justify-between items-center text-xs font-bold text-rose-400">
                <span>💕 Love Card</span>
                <span>Bayu & Ema</span>
              </div>

              <div class="text-center my-auto">
                <div class="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr ${currentCat.color} text-white flex items-center justify-center text-4xl shadow-lg mb-3 transform -rotate-3 animate-bounce">
                  💌
                </div>
                <h4 class="text-base font-bold text-slate-800">${currentCat.name}</h4>
                <p class="text-xs text-rose-500 font-semibold mt-1">Sentuh kartu untuk membuka pertanyaan!</p>
                <span class="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-rose-100/80 text-rose-600 text-[11px] font-bold">
                  ${this.usedCount > 0 ? `Sudah dibahas: ${this.usedCount}/${totalCards} kartu` : `Tersedia: ${totalCards} kartu`}
                </span>
              </div>

              <button onclick="event.stopPropagation(); window.deepTalkGame.openNewCard()"
                class="w-full py-3 rounded-2xl bg-gradient-to-r ${currentCat.color} text-white font-bold text-xs shadow-md hover:opacity-90 transition-all flex items-center justify-center gap-1.5">
                <span>Buka Kartu Bersama</span> 🎁
              </button>
            </div>
          ` : `
            <!-- Card Opened (Terbuka di Kedua Layar) -->
            <div class="w-full max-w-sm min-h-80 rounded-3xl p-6 glass-panel border-2 border-rose-400 shadow-2xl bg-white flex flex-col justify-between select-none animate-fade-in">
              
              <!-- Card Header -->
              <div class="flex items-center justify-between pb-3 border-b border-rose-100">
                <span class="px-2.5 py-1 rounded-full text-xs font-bold ${currentCat.bg}">
                  ${currentCat.badge}
                </span>
                <div class="text-right">
                  <span class="block text-xs font-bold text-rose-500">
                    Dibuka oleh ${this.drawerName} 💕
                  </span>
                  <span class="text-[10px] text-slate-400 font-semibold">
                    Kartu ke-${this.usedCount} dari ${this.totalCount || totalCards}
                  </span>
                </div>
              </div>

              <!-- Question Body -->
              <div class="text-center my-auto py-6 px-2">
                <p class="text-base sm:text-lg font-bold text-slate-800 leading-relaxed font-serif-elegant">
                  "${this.currentCard}"
                </p>
              </div>

              <!-- Action Controls -->
              <div class="space-y-2 pt-3 border-t border-rose-100">
                <button onclick="window.deepTalkGame.openNewCard()"
                  class="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 transform hover:scale-[1.01] active:scale-95">
                  <span>Ganti Kartu Lain</span> 🔄
                </button>
                <button onclick="window.deepTalkGame.closeCard()"
                  class="w-full py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs transition-colors">
                  Tutup Kartu ↩️
                </button>
              </div>

            </div>
          `}
        </div>

        <!-- Reactions Bar -->
        <div class="glass-panel-subtle rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-2 border border-rose-100">
          <span class="text-xs font-semibold text-slate-500">Respon ke pasangan:</span>
          <div class="flex items-center gap-2">
            ${['❤️', '🥺', '🔥', '👏', '😂', '🌹'].map(r => `
              <button onclick="window.deepTalkGame.sendReaction('${r}')" 
                class="w-9 h-9 rounded-2xl bg-white hover:bg-rose-100 border border-rose-100 text-base flex items-center justify-center shadow-xs hover:scale-125 active:scale-95 transition-all"
                title="Kirim ${r}">
                ${r}
              </button>
            `).join('')}
          </div>
        </div>

      </div>
    `;
  }

  changeCategory(idx) {
    if (this.activeCategory === idx && !this.isOpen) return;
    this.socket.emit('deeptalk-select-category', { categoryIndex: idx });
  }

  openNewCard() {
    const cat = this.categories[this.activeCategory];
    this.socket.emit('deeptalk-open-card', {
      categoryIndex: this.activeCategory,
      totalCardsInCat: cat.cards.length,
      cardList: cat.cards
    });
  }

  closeCard() {
    this.socket.emit('deeptalk-close-card');
  }

  sendReaction(emoji) {
    this.socket.emit('deeptalk-reaction', { reaction: emoji });
  }

  showReactionBanner(senderName, senderAvatar, reaction) {
    const banner = document.createElement('div');
    banner.className = 'fixed top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-6 py-3 rounded-3xl glass-panel border-2 border-rose-300 shadow-2xl z-50 flex items-center gap-3 animate-bounce bg-white/95';
    banner.innerHTML = `
      <span class="text-3xl">${reaction}</span>
      <div>
        <p class="text-xs font-bold text-slate-800">${senderAvatar} ${senderName}</p>
        <p class="text-[11px] text-rose-500 font-semibold">memberi respon cinta!</p>
      </div>
    `;
    document.body.appendChild(banner);
    setTimeout(() => banner.remove(), 2200);

    const el = document.createElement('div');
    el.className = 'floating-heart text-4xl';
    el.style.left = `${Math.random() * 50 + 25}%`;
    el.style.bottom = '30%';
    el.textContent = reaction;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2500);
  }

  showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-2xl glass-panel border border-rose-200 text-slate-800 text-xs font-bold shadow-lg z-50 animate-fade-in';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }
}

window.DeepTalkGame = DeepTalkGame;
