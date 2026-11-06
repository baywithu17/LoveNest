// Mini Game: Photobooth Berdua (Korean 4-Cut Studio - Bayu & Ema Edition)
class PhotoboothGame {
  constructor(socket) {
    this.socket = socket;
    this.stream = null;
    this.videoEl = null;
    this.cameraActive = false;
    this.currentSlot = 0;
    this.snappedPhotos = [null, null, null, null]; // 4 slots
    this.selectedFrame = 'classic-dark';
    this.selectedSticker = null;
    this.placedStickers = []; // [{ emoji, x, y }]
    this.isCountingDown = false;
    this.countdownTimer = null;

    this.frames = [
      { id: 'classic-dark', name: '🖤 Charcoal 4-Cut', bg: '#1e1e24', text: '#ffffff', subtext: '#fb7185', border: '#33333f' },
      { id: 'pastel-pink', name: '🌸 Pastel Sakura', bg: '#fff0f3', text: '#e11d48', subtext: '#fda4af', border: '#ffe4e6' },
      { id: 'vintage-film', name: '🎞️ Retro Film 90s', bg: '#fbf7ee', text: '#3f3935', subtext: '#92847a', border: '#e8dec8' },
      { id: 'lavender-dream', name: '💜 Lavender Glow', bg: '#f5f3ff', text: '#6d28d9', subtext: '#c4b5fd', border: '#ddd6fe' }
    ];

    this.stickers = ['🧸', '🐰', '💖', '✨', '🎀', '🧋', '👑', '🌸', '💌', '💍', '🔥', '🥰'];

    this.setupEvents();
  }

  setupEvents() {
    this.socket.on('photobooth-countdown-tick', ({ seconds, slotIndex }) => {
      this.runCountdown(seconds, slotIndex);
    });

    this.socket.on('photobooth-snapped', ({ slotIndex }) => {
      this.executeLocalSnap(slotIndex);
    });

    this.socket.on('photobooth-frame-changed', ({ frameId }) => {
      this.selectedFrame = frameId;
      this.updateStripAppearance();
      const select = document.getElementById('photoboothFrameSelect');
      if (select) select.value = frameId;
    });

    this.socket.on('photobooth-strip-shared', ({ stripDataUrl, creatorName, createdAt }) => {
      this.displaySharedStripModal(stripDataUrl, creatorName, createdAt);
    });
  }

  async startCamera() {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        this.stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false
        });
        if (this.videoEl) {
          this.videoEl.srcObject = this.stream;
          await this.videoEl.play();
          this.cameraActive = true;
          this.updateCameraStatus(true);
        }
      }
    } catch (err) {
      console.warn('Camera not available or permission denied:', err);
      this.cameraActive = false;
      this.updateCameraStatus(false);
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.cameraActive = false;
    this.updateCameraStatus(false);
  }

  updateCameraStatus(active) {
    const badge = document.getElementById('photoboothCamStatus');
    const fallbackBox = document.getElementById('photoboothCamFallback');
    const video = document.getElementById('photoboothVideo');
    if (badge) {
      badge.innerHTML = active
        ? '<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Kamera Aktif'
        : '<span class="w-2 h-2 rounded-full bg-amber-400"></span> Mode Avatar Couple';
    }
    if (fallbackBox && video) {
      if (active) {
        fallbackBox.classList.add('hidden');
        video.classList.remove('hidden');
      } else {
        fallbackBox.classList.remove('hidden');
        video.classList.add('hidden');
      }
    }
  }

  triggerCountdown() {
    if (this.isCountingDown) return;
    // Find next empty slot or overwrite current
    let targetSlot = this.snappedPhotos.findIndex(p => p === null);
    if (targetSlot === -1) targetSlot = 0; // reset to 0 if all full

    this.socket.emit('photobooth-start-countdown', {
      seconds: 3,
      slotIndex: targetSlot
    });
  }

  runCountdown(seconds, slotIndex) {
    this.isCountingDown = true;
    let count = seconds;
    const overlay = document.getElementById('photoboothCountdownOverlay');
    const countText = document.getElementById('photoboothCountdownText');

    if (overlay && countText) {
      overlay.classList.remove('hidden');
      countText.textContent = count;
      countText.className = 'text-7xl font-extrabold text-white animate-bounce drop-shadow-lg';
    }

    if (window.soundController) window.soundController.playPop();

    clearInterval(this.countdownTimer);
    this.countdownTimer = setInterval(() => {
      count--;
      if (count > 0) {
        if (countText) {
          countText.textContent = count;
          countText.className = 'text-7xl font-extrabold text-white animate-bounce drop-shadow-lg';
        }
        if (window.soundController) window.soundController.playPop();
      } else {
        clearInterval(this.countdownTimer);
        if (countText) countText.textContent = 'SMILE! 📸';
        setTimeout(() => {
          if (overlay) overlay.classList.add('hidden');
          this.isCountingDown = false;
          this.executeLocalSnap(slotIndex);
        }, 500);
      }
    }, 1000);
  }

  executeLocalSnap(slotIndex) {
    // Camera flash effect
    const flashEl = document.getElementById('photoboothFlashEffect');
    if (flashEl) {
      flashEl.classList.remove('hidden');
      flashEl.classList.add('animate-flash');
      setTimeout(() => {
        flashEl.classList.add('hidden');
        flashEl.classList.remove('animate-flash');
      }, 400);
    }

    if (window.soundController) window.soundController.playMatchFanfare();

    // Snap to offscreen canvas
    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');

    if (this.cameraActive && this.videoEl && this.videoEl.readyState >= 2) {
      // Mirror horizontal for natural selfie feel
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(this.videoEl, 0, 0, canvas.width, canvas.height);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const dataUrl = canvas.toDataURL('image/png');
      this.snappedPhotos[slotIndex] = dataUrl;
      this.updateSlotUI(slotIndex, dataUrl);
    } else {
      // High-taste chibi illustration snapshot fallback
      const chibiImg = new Image();
      chibiImg.onload = () => {
        ctx.drawImage(chibiImg, 0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, canvas.height - 45, canvas.width, 45);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Bayu & Ema Date Night • Snap #${slotIndex + 1} ✨`, canvas.width / 2, canvas.height - 18);

        const dataUrl = canvas.toDataURL('image/png');
        this.snappedPhotos[slotIndex] = dataUrl;
        this.updateSlotUI(slotIndex, dataUrl);
      };
      chibiImg.src = '/images/photobooth-chibi.jpg';
    }
  }

  updateSlotUI(slotIndex, dataUrl) {
    const slotEl = document.getElementById(`photoboothSlot_${slotIndex}`);
    if (slotEl) {
      slotEl.innerHTML = `
        <img src="${dataUrl}" class="w-full h-full object-cover rounded-lg shadow-inner">
      `;
    }
  }

  resetAllSlots() {
    this.snappedPhotos = [null, null, null, null];
    for (let i = 0; i < 4; i++) {
      const slotEl = document.getElementById(`photoboothSlot_${i}`);
      if (slotEl) {
        slotEl.innerHTML = `
          <div class="w-full h-full flex flex-col items-center justify-center text-slate-300 text-xs font-semibold">
            <span class="text-2xl mb-1">📸</span>
            <span>Frame #${i + 1}</span>
          </div>
        `;
      }
    }
    this.placedStickers = [];
    this.renderStickerOverlays();
  }

  setFrame(frameId) {
    this.selectedFrame = frameId;
    this.socket.emit('photobooth-change-frame', { frameId });
    this.updateStripAppearance();
  }

  updateStripAppearance() {
    const stripEl = document.getElementById('photoboothStripContainer');
    if (!stripEl) return;
    const frameObj = this.frames.find(f => f.id === this.selectedFrame) || this.frames[0];
    stripEl.style.backgroundColor = frameObj.bg;
    stripEl.style.borderColor = frameObj.border;

    const titleEl = document.getElementById('photoboothStripTitle');
    const subEl = document.getElementById('photoboothStripSub');
    if (titleEl) {
      titleEl.style.color = frameObj.text;
    }
    if (subEl) {
      subEl.style.color = frameObj.subtext;
    }
  }

  selectSticker(stk) {
    this.selectedSticker = stk;
    // Add sticker to strip
    const newStk = {
      id: Date.now(),
      emoji: stk,
      x: 20 + Math.random() * 60, // percentage
      y: 20 + Math.random() * 60
    };
    this.placedStickers.push(newStk);
    this.renderStickerOverlays();
  }

  renderStickerOverlays() {
    const container = document.getElementById('photoboothStickersLayer');
    if (!container) return;
    container.innerHTML = this.placedStickers.map((stk, idx) => `
      <div class="absolute cursor-move text-2xl select-none transform hover:scale-125 transition-transform" 
        style="left: ${stk.x}%; top: ${stk.y}%;"
        onclick="window.photoboothGame.removeSticker(${idx})"
        title="Klik untuk hapus stiker">
        ${stk.emoji}
      </div>
    `).join('');
  }

  removeSticker(index) {
    this.placedStickers.splice(index, 1);
    this.renderStickerOverlays();
  }

  // Render high-res composite PNG and trigger download
  downloadStrip() {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 1400;
    const ctx = canvas.getContext('2d');

    const frameObj = this.frames.find(f => f.id === this.selectedFrame) || this.frames[0];

    // Background
    ctx.fillStyle = frameObj.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Decorative top header
    ctx.fillStyle = frameObj.text;
    ctx.font = 'bold 34px "Playfair Display", serif';
    ctx.textAlign = 'center';
    ctx.fillText('BAYU & EMA', canvas.width / 2, 75);

    ctx.fillStyle = frameObj.subtext;
    ctx.font = '600 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('✨ LIFE4CUTS • OUR SPECIAL MOMENTS ✨', canvas.width / 2, 110);

    // 4 Slots
    const slotX = 45;
    const slotW = canvas.width - (slotX * 2);
    const slotH = 260;
    const gap = 24;
    const startY = 140;

    let loadedCount = 0;
    const drawSlot = (i) => {
      const y = startY + i * (slotH + gap);
      const photoData = this.snappedPhotos[i];

      if (photoData) {
        const img = new Image();
        img.onload = () => {
          ctx.save();
          // Clip rounded rectangle
          ctx.beginPath();
          ctx.roundRect(slotX, y, slotW, slotH, 16);
          ctx.clip();
          ctx.drawImage(img, slotX, y, slotW, slotH);
          ctx.restore();

          // Border around slot
          ctx.strokeStyle = frameObj.border;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.roundRect(slotX, y, slotW, slotH, 16);
          ctx.stroke();

          loadedCount++;
          if (loadedCount === 4) finishStrip();
        };
        img.src = photoData;
      } else {
        // Empty slot placeholder
        ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
        ctx.beginPath();
        ctx.roundRect(slotX, y, slotW, slotH, 16);
        ctx.fill();

        ctx.fillStyle = frameObj.subtext;
        ctx.font = '500 20px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(`Momen Berdua #${i + 1} 💕`, canvas.width / 2, y + slotH / 2);
        loadedCount++;
        if (loadedCount === 4) finishStrip();
      }
    };

    for (let i = 0; i < 4; i++) {
      drawSlot(i);
    }

    const finishStrip = () => {
      // Draw stickers
      this.placedStickers.forEach(stk => {
        ctx.font = '42px sans-serif';
        const posX = (stk.x / 100) * canvas.width;
        const posY = (stk.y / 100) * canvas.height;
        ctx.fillText(stk.emoji, posX, posY);
      });

      // Footer
      const now = new Date();
      const dateStr = now.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      ctx.fillStyle = frameObj.subtext;
      ctx.font = '600 15px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`📅 ${dateStr} • ${timeStr} WIB`, canvas.width / 2, canvas.height - 70);

      ctx.font = 'italic 16px "Sacramento", cursive';
      ctx.fillStyle = frameObj.text;
      ctx.fillText('"No distance can stop our sweet connection"', canvas.width / 2, canvas.height - 35);

      const finalUrl = canvas.toDataURL('image/png');

      // Trigger download
      const a = document.createElement('a');
      a.href = finalUrl;
      a.download = `photostrip-bayu-dan-ema-${Date.now()}.png`;
      a.click();

      // Also share with partner!
      this.socket.emit('photobooth-share-strip', {
        stripDataUrl: finalUrl,
        creatorName: window.appState.user.name || 'Ayang'
      });
    };
  }

  displaySharedStripModal(dataUrl, creatorName, time) {
    let modal = document.getElementById('photoboothSharedModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'photoboothSharedModal';
      modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="glass-panel max-w-sm w-full rounded-3xl p-6 text-center border border-white/60 shadow-2xl relative">
        <button onclick="document.getElementById('photoboothSharedModal').classList.add('hidden')" 
          class="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold text-xl">✕</button>
        <div class="text-3xl mb-2">📸✨</div>
        <h3 class="font-extrabold text-slate-800 text-lg">Photostrip Baru Masuk!</h3>
        <p class="text-xs text-rose-500 font-semibold mb-4">Dibuat oleh ${creatorName} pada ${time}</p>
        <div class="max-h-[60vh] overflow-y-auto rounded-2xl border border-rose-100 shadow-inner mb-4">
          <img src="${dataUrl}" class="w-full h-auto rounded-xl">
        </div>
        <div class="flex gap-2">
          <a href="${dataUrl}" download="photostrip-bayu-ema.png" 
            class="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-xs shadow-md hover:from-rose-600 hover:to-pink-600 transition-all flex items-center justify-center gap-1.5">
            <span>📥 Simpan ke HP / PC</span>
          </a>
          <button onclick="document.getElementById('photoboothSharedModal').classList.add('hidden')" 
            class="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200 transition-all">
            Tutup
          </button>
        </div>
      </div>
    `;
    modal.classList.remove('hidden');
    if (window.soundController) window.soundController.playMatchFanfare();
  }

  render() {
    const container = document.getElementById('photoboothGameContainer');
    if (!container) return;

    container.innerHTML = `
      <div class="max-w-4xl mx-auto space-y-6">
        
        <!-- Header Section with Chibi Art -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-3xl bg-white/90 border border-rose-200/80 shadow-xs">
          <div class="flex items-center gap-3.5">
            <img src="/images/photobooth-chibi.jpg" alt="Photobooth Chibi" 
              class="w-16 h-16 rounded-2xl object-cover shadow-md border-2 border-rose-300 ring-2 ring-rose-100 shrink-0">
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-lg sm:text-xl font-extrabold text-slate-800 font-serif-elegant">Photobooth Berdua</h3>
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-600 uppercase tracking-wider">Life4Cuts 📸</span>
              </div>
              <p class="text-xs text-slate-500 mt-0.5">Jepret foto strip 4-cut aesthetic bareng dengan live countdown 3 detik!</p>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <button onclick="window.photoboothGame.startCamera()" 
              class="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5">
              <span>📷 Buka Cam</span>
            </button>
            <button onclick="window.photoboothGame.stopCamera()" 
              class="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition-all">
              Tutup Cam
            </button>
            <button onclick="switchTab('lobby')" 
              class="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition-colors flex items-center gap-1.5">
              <span>← Beranda</span>
            </button>
          </div>
        </div>

        <!-- Main Workspace (Left: Live Camera & Controls, Right: 4-Cut Strip Preview) -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          <!-- Left 7 cols: Live Viewfinder & Action Buttons -->
          <div class="lg:col-span-7 space-y-4">
            
            <!-- Live Camera Frame -->
            <div class="relative w-full aspect-[4/3] rounded-3xl overflow-hidden bg-slate-900 border-2 border-white/80 shadow-lg flex items-center justify-center">
              
              <!-- Video Stream -->
              <video id="photoboothVideo" autoplay playsinline muted 
                class="hidden w-full h-full object-cover transform scale-x-[-1]"></video>

              <!-- Fallback View if camera not open -->
              <div id="photoboothCamFallback" class="p-6 text-center text-white space-y-3">
                <div class="relative w-28 h-28 mx-auto">
                  <img src="/images/photobooth-chibi.jpg" alt="Photobooth Chibi" 
                    class="w-full h-full object-cover rounded-3xl shadow-2xl border-3 border-rose-300 ring-4 ring-rose-500/20 transform -rotate-1">
                  <span class="absolute -bottom-1 -right-1 text-xl animate-bounce">📸</span>
                </div>
                <div>
                  <h4 class="font-extrabold text-sm sm:text-base text-rose-200">Studio Chibi Siap Digunakan!</h4>
                  <p class="text-[11px] text-slate-300 max-w-xs mx-auto mt-1">
                    Klik <b>"Buka Kamera"</b> untuk selfie live, atau langsung klik <b>"Jepret Bersama"</b> untuk capture anime chibi kenangan Bayu & Ema.
                  </p>
                </div>
              </div>

              <!-- Top Status Overlay -->
              <div class="absolute top-3 left-3 px-3 py-1 rounded-full bg-slate-900/60 backdrop-blur-md text-[11px] font-semibold text-white flex items-center gap-2" id="photoboothCamStatus">
                <span class="w-2 h-2 rounded-full bg-amber-400"></span> Mode Avatar Couple
              </div>

              <!-- 3-2-1 Countdown Overlay -->
              <div id="photoboothCountdownOverlay" class="hidden absolute inset-0 z-20 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs">
                <span id="photoboothCountdownText" class="text-7xl font-extrabold text-white animate-bounce drop-shadow-xl">3</span>
              </div>

              <!-- Camera Flash Effect -->
              <div id="photoboothFlashEffect" class="hidden absolute inset-0 z-30 bg-white pointer-events-none transition-opacity duration-300"></div>
            </div>

            <!-- Snap Button (The Hero Trigger) -->
            <button onclick="window.photoboothGame.triggerCountdown()" 
              class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-500 text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2">
              <span class="text-xl">📸</span>
              <span>JEPRET FOTO BERSAMA (3s TIMER)</span>
              <span class="text-xs px-2 py-0.5 rounded-md bg-white/20">Sync Realtime</span>
            </button>

            <!-- Frame Customizer & Stickers -->
            <div class="p-4 rounded-3xl bg-white/80 border border-rose-100 shadow-xs space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-slate-700">Pilih Desain Frame Photostrip:</span>
                <select id="photoboothFrameSelect" onchange="window.photoboothGame.setFrame(this.value)" 
                  class="px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-rose-400">
                  <option value="classic-dark">🖤 Charcoal Life4Cuts</option>
                  <option value="pastel-pink">🌸 Pastel Sakura</option>
                  <option value="vintage-film">🎞️ Retro Film 90s</option>
                  <option value="lavender-dream">💜 Lavender Dream</option>
                </select>
              </div>

              <!-- Sticker Palette -->
              <div>
                <span class="block text-xs font-bold text-slate-600 mb-1.5">Tempel Stiker Lucu (Klik untuk pasang di foto):</span>
                <div class="flex items-center gap-1.5 overflow-x-auto pb-1">
                  ${this.stickers.map(stk => `
                    <button onclick="window.photoboothGame.selectSticker('${stk}')" 
                      class="w-9 h-9 rounded-xl bg-rose-50/60 hover:bg-rose-100 border border-rose-100 flex items-center justify-center text-lg hover:scale-110 transition-transform shrink-0">
                      ${stk}
                    </button>
                  `).join('')}
                </div>
              </div>

              <!-- Reset & Action Row -->
              <div class="flex items-center justify-between pt-2 border-t border-rose-50">
                <button onclick="window.photoboothGame.resetAllSlots()" 
                  class="text-xs font-semibold text-rose-500 hover:text-rose-700 transition-colors flex items-center gap-1">
                  <span>🔄 Reset Ulang 4 Slot</span>
                </button>
                <span class="text-[11px] text-slate-400 italic">Klik stiker di strip untuk hapus</span>
              </div>
            </div>

          </div>

          <!-- Right 5 cols: Live 4-Cut Photostrip Preview -->
          <div class="lg:col-span-5 flex flex-col items-center">
            
            <!-- Photostrip Outer Container -->
            <div id="photoboothStripContainer" 
              class="w-full max-w-[280px] rounded-2xl p-4 shadow-xl border-4 transition-colors relative duration-300"
              style="background-color: #1e1e24; border-color: #33333f;">
              
              <!-- Strip Header -->
              <div class="text-center mb-3">
                <h4 id="photoboothStripTitle" class="font-extrabold text-sm tracking-widest font-serif-elegant" style="color: #ffffff;">
                  BAYU & EMA
                </h4>
                <p id="photoboothStripSub" class="text-[9px] font-semibold tracking-wider uppercase" style="color: #fb7185;">
                  ✨ LIFE4CUTS DATE NIGHT ✨
                </p>
              </div>

              <!-- 4 Photo Slots -->
              <div class="space-y-2.5 relative">
                
                <!-- Stickers floating overlay -->
                <div id="photoboothStickersLayer" class="absolute inset-0 pointer-events-auto z-10"></div>

                <div id="photoboothSlot_0" class="w-full aspect-[4/3] rounded-xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
                  <div class="text-center text-slate-400 text-xs font-semibold">
                    <span class="text-xl block mb-0.5">📸</span> Slot #1
                  </div>
                </div>

                <div id="photoboothSlot_1" class="w-full aspect-[4/3] rounded-xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
                  <div class="text-center text-slate-400 text-xs font-semibold">
                    <span class="text-xl block mb-0.5">📸</span> Slot #2
                  </div>
                </div>

                <div id="photoboothSlot_2" class="w-full aspect-[4/3] rounded-xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
                  <div class="text-center text-slate-400 text-xs font-semibold">
                    <span class="text-xl block mb-0.5">📸</span> Slot #3
                  </div>
                </div>

                <div id="photoboothSlot_3" class="w-full aspect-[4/3] rounded-xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
                  <div class="text-center text-slate-400 text-xs font-semibold">
                    <span class="text-xl block mb-0.5">📸</span> Slot #4
                  </div>
                </div>

              </div>

              <!-- Strip Footer -->
              <div class="text-center mt-3 pt-2 border-t border-white/10">
                <span class="text-[10px] text-slate-400 font-mono block">2026.11.05 • OUR SPECIAL LDR MEMORY</span>
                <span class="text-[11px] font-script text-rose-400">Sweet Love Story</span>
              </div>
            </div>

            <!-- Download Button -->
            <button onclick="window.photoboothGame.downloadStrip()" 
              class="w-full max-w-[280px] mt-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xs shadow-md hover:from-emerald-600 hover:to-teal-600 transition-all flex items-center justify-center gap-2">
              <span>📥 Download & Bagikan Strip PNG</span>
            </button>

          </div>

        </div>

      </div>
    `;

    this.videoEl = document.getElementById('photoboothVideo');
    this.updateStripAppearance();
  }
}

