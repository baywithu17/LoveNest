// Main App Controller
document.addEventListener('DOMContentLoaded', () => {
  // Global State
  window.appState = {
    socket: io(),
    user: {
      name: localStorage.getItem('lovenest_name') || '',
      avatar: localStorage.getItem('lovenest_avatar') || '🧸'
    },
    room: null,
    currentGame: 'lobby'
  };

  const socket = window.appState.socket;

  // Initialize Sub-systems
  window.voiceCall = new VoiceCallManager(socket);
  window.photoboothGame = new PhotoboothGame(socket);
  window.courtGame = new CourtGame(socket);
  window.knowMeGame = new KnowMeGame(socket);
  window.mostLikelyGame = new MostLikelyGame(socket);
  window.telepathyGame = new TelepathyGame(socket);
  window.quizHub = new QuizHub(socket);
  window.deepTalkGame = new DeepTalkGame(socket);
  window.canvasGame = new CanvasGame(socket);
  window.catchGame = new CatchGame(socket);
  window.arcadeHub = new ArcadeHub(socket);
  window.detectiveGame = new DetectiveGame(socket);

  // Setup UI elements
  setupAvatarSelection();
  setupRoomEvents();
  setupChatEvents();
  setupVoiceCallUI();
  setupLoveMomentsAndMood(socket);
  setupGameSwitcher();
  setupConfetti();
  setupLivingBackground();
  setupAngieRoadmap();

  // Check URL param for instant room invite
  const urlParams = new URLSearchParams(window.location.search);
  const inviteCode = urlParams.get('room');
  if (inviteCode) {
    const roomInput = document.getElementById('joinRoomCodeInput');
    if (roomInput) roomInput.value = inviteCode.toUpperCase();
    const nameInput = document.getElementById('userNameInput');
    if (window.appState.user.name && nameInput) nameInput.value = window.appState.user.name;
  } else if (window.appState.user.name) {
    const nameInput = document.getElementById('userNameInput');
    if (nameInput) nameInput.value = window.appState.user.name;
  }
});

// Avatar selection
function setupAvatarSelection() {
  const avatars = ['🧸', '🐰', '🐱', '🐼', '🦊', '🐶', '🦄', '🐣'];
  const container = document.getElementById('avatarPicker');
  if (!container) return;

  container.innerHTML = avatars.map(av => `
    <button type="button" onclick="selectAvatar('${av}')" 
      class="avatar-choice w-10 h-10 rounded-2xl flex items-center justify-center text-xl transition-all hover:scale-110 border-2 ${window.appState.user.avatar === av ? 'border-rose-500 bg-rose-50 scale-105' : 'border-slate-100 bg-white'}"
      data-avatar="${av}">
      ${av}
    </button>
  `).join('');
}

window.selectAvatar = function(av) {
  window.appState.user.avatar = av;
  localStorage.setItem('lovenest_avatar', av);
  document.querySelectorAll('.avatar-choice').forEach(btn => {
    if (btn.dataset.avatar === av) {
      btn.classList.add('border-rose-500', 'bg-rose-50', 'scale-105');
      btn.classList.remove('border-slate-100', 'bg-white');
    } else {
      btn.classList.remove('border-rose-500', 'bg-rose-50', 'scale-105');
      btn.classList.add('border-slate-100', 'bg-white');
    }
  });
};

// Room management
function setupRoomEvents() {
  const socket = window.appState.socket;

  // Create Room Button
  const createBtn = document.getElementById('createRoomBtn');
  if (createBtn) {
    createBtn.addEventListener('click', () => {
      const nameInput = document.getElementById('userNameInput');
      const name = nameInput.value.trim() || 'Ayang';
      window.appState.user.name = name;
      localStorage.setItem('lovenest_name', name);

      socket.emit('create-room', { name, avatar: window.appState.user.avatar }, (res) => {
        if (res.success) {
          enterRoom(res.room);
        }
      });
    });
  }

  // Join Room Button
  const joinBtn = document.getElementById('joinRoomBtn');
  if (joinBtn) {
    joinBtn.addEventListener('click', () => {
      const nameInput = document.getElementById('userNameInput');
      const roomInput = document.getElementById('joinRoomCodeInput');
      const name = nameInput.value.trim() || 'Ayang';
      const code = roomInput.value.trim().toUpperCase();

      if (!code) {
        alert('Silakan masukkan Kode Room!');
        return;
      }

      window.appState.user.name = name;
      localStorage.setItem('lovenest_name', name);

      socket.emit('join-room', { roomCode: code, name, avatar: window.appState.user.avatar }, (res) => {
        if (res.success) {
          enterRoom(res.room);
        } else {
          alert(res.message || 'Gagal masuk ke room!');
        }
      });
    });
  }

  // Socket room updates
  socket.on('room-updated', (room) => {
    window.appState.room = room;
    updateRoomHeaderUI(room);
  });

  socket.on('partner-joined', ({ player, message }) => {
    showNotification(`💕 ${message}`);
    if (window.soundController) window.soundController.playPop();
  });

  socket.on('partner-left', ({ message }) => {
    showNotification(`⚠️ ${message}`);
  });
}

function enterRoom(room) {
  window.appState.room = room;
  document.getElementById('authModal').classList.add('hidden');
  document.getElementById('mainAppContainer').classList.remove('hidden');

  // Update room URL in browser history without reload
  const newUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?room=${room.code}`;
  window.history.pushState({ path: newUrl }, '', newUrl);

  updateRoomHeaderUI(room);
  switchTab('lobby');
}

function updateRoomHeaderUI(room) {
  const codeEl = document.getElementById('roomCodeDisplay');
  const partnerStatusEl = document.getElementById('partnerStatusBadge');
  const callBtn = document.getElementById('headerCallBtn');

  if (codeEl) codeEl.textContent = room.code;

  // Update Left Sidebar User Profile
  const leftAvatar = document.getElementById('leftUserAvatar');
  const leftName = document.getElementById('leftUserName');
  if (leftAvatar && window.appState.user.avatar) leftAvatar.textContent = window.appState.user.avatar;
  if (leftName && window.appState.user.name) leftName.textContent = window.appState.user.name;

  // Update Right Sidebar Partner Profile
  const rightPartnerName = document.getElementById('rightPartnerName');
  const rightPartnerStatus = document.getElementById('rightPartnerStatus');

  const partner = room.players.find(p => p.id !== window.appState.socket.id);
  if (partner) {
    if (partnerStatusEl) {
      partnerStatusEl.innerHTML = `
        <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
        <span class="font-bold text-slate-700">${partner.avatar} ${partner.name}</span>
      `;
    }
    if (callBtn) {
      callBtn.disabled = false;
      callBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
    if (rightPartnerName) rightPartnerName.textContent = `${partner.avatar} ${partner.name}`;
    if (rightPartnerStatus) {
      rightPartnerStatus.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Online di Kamar`;
      rightPartnerStatus.className = 'font-bold text-emerald-600 flex items-center gap-1';
    }
  } else {
    if (partnerStatusEl) {
      partnerStatusEl.innerHTML = `
        <span class="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
        <span class="text-slate-400 italic">Menunggu pasangan...</span>
      `;
    }
    if (callBtn) {
      callBtn.disabled = true;
      callBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }
    if (rightPartnerName) rightPartnerName.textContent = 'Menunggu...';
    if (rightPartnerStatus) {
      rightPartnerStatus.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span> Menunggu Pasangan...`;
      rightPartnerStatus.className = 'font-bold text-amber-500 flex items-center gap-1';
    }
  }
}

// Copy Invite Link
window.copyInviteLink = function() {
  if (!window.appState.room) return;
  const link = `${window.location.protocol}//${window.location.host}${window.location.pathname}?room=${window.appState.room.code}`;
  navigator.clipboard.writeText(link).then(() => {
    showNotification('🔗 Tautan undangan berhasil disalin! Kirimkan ke pasanganmu.');
  });
};

// Chat functionality & Sliding Drawer (Angie Style)
function setupChatEvents() {
  const socket = window.appState.socket;
  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');
  const chatMessagesList = document.getElementById('chatMessagesList');
  const typingIndicator = document.getElementById('partnerTypingIndicator');

  window.isChatOpen = false;
  window.unreadChatCount = 0;

  window.toggleChat = function(force) {
    const drawer = document.getElementById('chatDrawer');
    const backdrop = document.getElementById('chatBackdrop');
    if (!drawer) return;

    if (typeof force === 'boolean') window.isChatOpen = force;
    else window.isChatOpen = !window.isChatOpen;

    if (window.isChatOpen) {
      drawer.classList.remove('translate-x-full');
      if (backdrop) backdrop.classList.remove('hidden');
      window.unreadChatCount = 0;
      updateChatBadges();
      if (chatInput) setTimeout(() => chatInput.focus(), 250);
    } else {
      drawer.classList.add('translate-x-full');
      if (backdrop) backdrop.classList.add('hidden');
    }
  };

  function updateChatBadges() {
    const headerBadge = document.getElementById('chatUnreadBadge');
    const floatBadge = document.getElementById('floatingChatBadge');
    if (headerBadge) {
      if (window.unreadChatCount > 0 && !window.isChatOpen) {
        headerBadge.textContent = window.unreadChatCount;
        headerBadge.classList.remove('hidden');
      } else {
        headerBadge.classList.add('hidden');
      }
    }
    if (floatBadge) {
      if (window.unreadChatCount > 0 && !window.isChatOpen) {
        floatBadge.classList.remove('hidden');
      } else {
        floatBadge.classList.add('hidden');
      }
    }
  }

  if (chatForm && chatInput) {
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = chatInput.value.trim();
      if (!text) return;
      socket.emit('send-message', { text, type: 'text' });
      chatInput.value = '';
      socket.emit('typing', { isTyping: false });
    });

    let typingTimeout = null;
    chatInput.addEventListener('input', () => {
      socket.emit('typing', { isTyping: true });
      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => {
        socket.emit('typing', { isTyping: false });
      }, 1500);
    });
  }

  socket.on('new-message', (msg) => {
    appendChatMessage(msg);
    if (!window.isChatOpen && msg.senderId !== window.appState.socket.id) {
      window.unreadChatCount++;
      updateChatBadges();
      showNotification(`💬 ${msg.senderName}: "${msg.text.substring(0, 30)}${msg.text.length > 30 ? '...' : ''}"`);
    }
    if (window.soundController) window.soundController.playPop();
  });

  socket.on('partner-typing', ({ isTyping }) => {
    if (!typingIndicator) return;
    if (isTyping) {
      typingIndicator.classList.remove('hidden');
    } else {
      typingIndicator.classList.add('hidden');
    }
  });
}

function appendChatMessage(msg) {
  const container = document.getElementById('chatMessagesList');
  if (!container) return;

  const isMe = msg.senderId === window.appState.socket.id;
  const msgEl = document.createElement('div');
  msgEl.className = `flex flex-col ${isMe ? 'items-end' : 'items-start'} mb-2.5`;

  msgEl.innerHTML = `
    <div class="flex items-center gap-1.5 mb-1 text-[11px] text-slate-400">
      <span>${msg.senderAvatar}</span>
      <span class="font-semibold text-slate-600">${isMe ? 'Kamu' : msg.senderName}</span>
      <span>•</span>
      <span>${msg.timestamp}</span>
    </div>
    <div class="px-3.5 py-2 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
      isMe ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-br-xs shadow-sm' : 'bg-white border border-rose-100 text-slate-800 rounded-bl-xs shadow-xs'
    }">
      ${msg.text}
    </div>
  `;

  container.appendChild(msgEl);
  container.scrollTop = container.scrollHeight;
}

window.sendQuickNote = function(text) {
  window.appState.socket.emit('send-message', { text, type: 'quick-love' });
};

// Voice Call UI & Callbacks
function setupVoiceCallUI() {
  const callBtn = document.getElementById('headerCallBtn');
  const incomingModal = document.getElementById('incomingCallModal');
  const callingModal = document.getElementById('callingModal');
  const activeCallBar = document.getElementById('activeCallBar');
  const acceptCallBtn = document.getElementById('acceptCallBtn');
  const declineCallBtn = document.getElementById('declineCallBtn');
  const cancelCallBtn = document.getElementById('cancelCallBtn');
  const endCallBtn = document.getElementById('endCallBtn');
  const muteMicBtn = document.getElementById('muteMicBtn');
  const deafenBtn = document.getElementById('deafenBtn');

  if (callBtn) {
    callBtn.addEventListener('click', () => {
      window.voiceCall.startCall();
    });
  }

  if (acceptCallBtn) {
    acceptCallBtn.addEventListener('click', () => {
      window.voiceCall.acceptCall();
    });
  }

  if (declineCallBtn) {
    declineCallBtn.addEventListener('click', () => {
      window.voiceCall.rejectCall();
    });
  }

  if (cancelCallBtn) {
    cancelCallBtn.addEventListener('click', () => {
      window.voiceCall.endCall();
    });
  }

  if (endCallBtn) {
    endCallBtn.addEventListener('click', () => {
      window.voiceCall.endCall();
    });
  }

  if (muteMicBtn) {
    muteMicBtn.addEventListener('click', () => {
      const isMuted = window.voiceCall.toggleMute();
      muteMicBtn.classList.toggle('bg-red-500', isMuted);
      muteMicBtn.classList.toggle('text-white', isMuted);
      muteMicBtn.title = isMuted ? 'Mikrofon Bisu' : 'Mikrofon Nyala';
    });
  }

  if (deafenBtn) {
    deafenBtn.addEventListener('click', () => {
      const isDeaf = window.voiceCall.toggleDeafen();
      deafenBtn.classList.toggle('bg-amber-500', isDeaf);
      deafenBtn.classList.toggle('text-white', isDeaf);
      deafenBtn.title = isDeaf ? 'Speaker Mati' : 'Speaker Nyala';
    });
  }

  // Voice Call Manager Hook Callbacks
  window.voiceCall.onIncomingCallUI = () => {
    if (incomingModal) incomingModal.classList.remove('hidden');
  };

  window.voiceCall.onOutgoingCallUI = () => {
    if (callingModal) callingModal.classList.remove('hidden');
  };

  window.voiceCall.onCallConnectedUI = () => {
    if (incomingModal) incomingModal.classList.add('hidden');
    if (callingModal) callingModal.classList.add('hidden');
    if (activeCallBar) activeCallBar.classList.remove('hidden');
  };

  window.voiceCall.onCallEndedUI = () => {
    if (incomingModal) incomingModal.classList.add('hidden');
    if (callingModal) callingModal.classList.add('hidden');
    if (activeCallBar) activeCallBar.classList.add('hidden');
  };

  window.voiceCall.onCallRejectedUI = (reason) => {
    if (callingModal) callingModal.classList.add('hidden');
    showNotification(reason === 'busy' ? 'Pasangan sedang sibuk.' : 'Panggilan suara ditolak.');
  };
}

// Game Switcher Tabs
function setupGameSwitcher() {
  const socket = window.appState.socket;

  socket.on('game-switched', ({ gameId }) => {
    applyGameSwitch(gameId);
  });
}

window.switchTab = function(tabId) {
  // Emit to sync with partner
  window.appState.socket.emit('switch-game', { gameId: tabId });
};

function applyGameSwitch(gameId) {
  window.appState.currentGame = gameId;

  // Track tried activities for YOUR PATH
  if (!window.triedActivities) window.triedActivities = new Set(['photobooth']);
  if (gameId !== 'lobby') {
    window.triedActivities.add(gameId);
  }
  updateLovePathProgress();

  // Breadcrumb bar & Left Nav highlight
  const breadcrumbBar = document.getElementById('gameBreadcrumbBar');
  const badgeTitle = document.getElementById('currentGameTitleBadge');
  const navLinkLobby = document.getElementById('navLinkLobby');

  if (gameId === 'lobby') {
    if (breadcrumbBar) breadcrumbBar.classList.add('hidden');
    if (navLinkLobby) {
      navLinkLobby.classList.add('bg-rose-100/80', 'text-rose-600', 'border-rose-200/80');
      navLinkLobby.classList.remove('text-slate-600');
    }
  } else {
    if (breadcrumbBar) breadcrumbBar.classList.remove('hidden');
    if (navLinkLobby) {
      navLinkLobby.classList.remove('bg-rose-100/80', 'text-rose-600', 'border-rose-200/80');
      navLinkLobby.classList.add('text-slate-600');
    }
    const titles = {
      photobooth: '📸 Online Photobooth Berdua',
      court: '⚖️ Pengadilan Asmara',
      quizhub: '🎯 Studio Kuis & Chemistry',
      deeptalk: '💌 Roda Asmara & Deep Talk',
      arcadehub: '🕹️ Love Arcade & Kanvas',
      detective: '🔍 Detektif Asmara: Kasus Misteri'
    };
    if (badgeTitle) badgeTitle.textContent = titles[gameId] || 'Game Aktif';
  }

  // Update tabs UI
  document.querySelectorAll('.game-nav-tab').forEach(t => {
    if (t.dataset.tab === gameId) {
      t.classList.add('bg-rose-500', 'text-white', 'shadow-sm');
      t.classList.remove('bg-white', 'text-slate-600', 'hover:bg-rose-50');
    } else {
      t.classList.remove('bg-rose-500', 'text-white', 'shadow-sm');
      t.classList.add('bg-white', 'text-slate-600', 'hover:bg-rose-50');
    }
  });

  // Hide all containers
  document.querySelectorAll('.game-panel-section').forEach(sec => sec.classList.add('hidden'));

  const activeSection = document.getElementById(`section_${gameId}`);
  if (activeSection) {
    activeSection.classList.remove('hidden');
  }

  // Trigger specific game renders
  if (gameId === 'photobooth') {
    window.photoboothGame.render();
  } else if (gameId === 'court') {
    window.courtGame.render();
  } else if (gameId === 'quizhub') {
    window.quizHub.render();
  } else if (gameId === 'deeptalk') {
    window.deepTalkGame.syncWithServer();
  } else if (gameId === 'arcadehub') {
    window.arcadeHub.render();
  } else if (gameId === 'detective') {
    window.detectiveGame.render();
  } else if (gameId === 'knowme' || gameId === 'telepathy' || gameId === 'likely') {
    // Redirect merged quiz
    applyGameSwitch('quizhub');
    if (window.quizHub) window.quizHub.switchMode(gameId);
  } else if (gameId === 'canvas' || gameId === 'catch') {
    // Redirect merged arcade
    applyGameSwitch('arcadehub');
    if (window.arcadeHub) window.arcadeHub.switchMode(gameId);
  }
}

// Love Moments & Couple Moods (Angie Feature)
function setupLoveMomentsAndMood(socket) {
  // Trigger love moment
  window.triggerLoveMoment = function(type) {
    socket.emit('send-love-moment', { type });
    showNotification(`Sent ${type} to Ayang! 💕`);
  };

  // Receive love moment
  socket.on('love-moment-received', ({ senderName, type }) => {
    displayLoveMomentReaction(senderName, type);
  });

  // Mood Picker
  window.openMoodModal = function() {
    const modal = document.getElementById('moodModal');
    if (modal) modal.classList.remove('hidden');
  };

  window.closeMoodModal = function() {
    const modal = document.getElementById('moodModal');
    if (modal) modal.classList.add('hidden');
  };

  window.setMyMood = function(emoji, text) {
    socket.emit('set-couple-mood', { mood: `${emoji} ${text}`, note: '' });
    const emojiEl = document.getElementById('currentMoodEmoji');
    const textEl = document.getElementById('currentMoodText');
    if (emojiEl) emojiEl.textContent = emoji;
    if (textEl) textEl.textContent = text;
    window.closeMoodModal();
    showNotification(`Mood kamu diperbarui: ${emoji} ${text}`);
  };

  socket.on('couple-mood-updated', ({ playerName, mood }) => {
    showNotification(`${playerName} ganti mood: ${mood}`);
    const badge = document.getElementById('myMoodBadge');
    if (badge) {
      badge.title = `Mood Pasangan: ${mood}`;
    }
  });
}

function displayLoveMomentReaction(senderName, type) {
  const overlay = document.getElementById('loveMomentOverlay');
  if (!overlay) return;

  overlay.classList.remove('hidden');
  if (window.soundController) {
    if (type === 'kiss' || type === 'burst') window.soundController.playMatchFanfare();
    else window.soundController.playPop();
  }

  let innerHTML = '';
  if (type === 'kiss') {
    innerHTML = `
      <div class="animate-kiss flex flex-col items-center">
        <span class="text-9xl drop-shadow-2xl">💋</span>
        <span class="mt-4 px-5 py-2 rounded-2xl glass-panel text-rose-600 font-extrabold text-lg shadow-xl">
          Ciuman Manis dari ${senderName}! 💋
        </span>
      </div>
    `;
  } else if (type === 'hug') {
    innerHTML = `
      <div class="animate-hug flex flex-col items-center">
        <span class="text-9xl drop-shadow-2xl">🫂</span>
        <span class="mt-4 px-5 py-2 rounded-2xl glass-panel text-pink-600 font-extrabold text-lg shadow-xl">
          Pelukan Hangat dari ${senderName} 🫂
        </span>
      </div>
    `;
  } else if (type === 'pinch') {
    innerHTML = `
      <div class="animate-pinch flex flex-col items-center">
        <span class="text-9xl drop-shadow-2xl">🤏</span>
        <span class="mt-4 px-5 py-2 rounded-2xl glass-panel text-amber-600 font-extrabold text-lg shadow-xl">
          Pipi kamu dicubit gemes sama ${senderName}! 🤏
        </span>
      </div>
    `;
  } else if (type === 'pat') {
    innerHTML = `
      <div class="animate-hug flex flex-col items-center">
        <span class="text-9xl drop-shadow-2xl">💆‍♂️✨</span>
        <span class="mt-4 px-5 py-2 rounded-2xl glass-panel text-purple-600 font-extrabold text-lg shadow-xl">
          Puk-puk kepala lembut dari ${senderName} 💆‍♂️
        </span>
      </div>
    `;
  } else {
    // burst
    if (typeof window.triggerConfetti === 'function') {
      window.triggerConfetti();
      setTimeout(window.triggerConfetti, 400);
    }
    innerHTML = `
      <div class="animate-kiss flex flex-col items-center">
        <span class="text-9xl drop-shadow-2xl">💖✨</span>
        <span class="mt-4 px-5 py-2 rounded-2xl glass-panel text-rose-600 font-extrabold text-lg shadow-xl">
          Hujan Cinta Spesial dari ${senderName}! 🥰
        </span>
      </div>
    `;
  }

  overlay.innerHTML = innerHTML;
  setTimeout(() => {
    overlay.classList.add('hidden');
    overlay.innerHTML = '';
  }, 2200);
}

// Global Notification Toast
function showNotification(msg) {
  const toast = document.createElement('div');
  toast.className = 'fixed bottom-5 left-1/2 transform -translate-x-1/2 px-5 py-2.5 rounded-2xl glass-panel border border-rose-200 text-slate-800 text-xs font-semibold shadow-lg z-50 animate-bounce flex items-center gap-2';
  toast.innerHTML = `<span>✨</span><span>${msg}</span>`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// Confetti Particle System
function setupConfetti() {
  const canvas = document.getElementById('confettiCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let particles = [];

  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  window.addEventListener('resize', resize);
  resize();

  window.triggerConfetti = () => {
    const colors = ['#f43f5e', '#fb7185', '#fda4af', '#fcd34d', '#8b5cf6', '#ec4899'];
    for (let i = 0; i < 75; i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() * 200 - 100),
        y: canvas.height * 0.4,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 1.2) * 14,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rSpeed: (Math.random() - 0.5) * 10,
        life: 1
      });
    }
  };
  window.triggerConfettiBurst = window.triggerConfetti;

  const loop = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35; // gravity
      p.rotation += p.rSpeed;
      p.life -= 0.012;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();

      if (p.life <= 0 || p.y > canvas.height) {
        particles.splice(i, 1);
      }
    }
    requestAnimationFrame(loop);
  };
  loop();
}

function setupLivingBackground() {
  const sakuraContainer = document.getElementById('sakuraParticles');
  const heartsContainer = document.getElementById('ambientHearts');

  // Spawn drifting sakura petals
  if (sakuraContainer) {
    const petalCount = 18;
    for (let i = 0; i < petalCount; i++) {
      const petal = document.createElement('div');
      petal.className = 'sakura-petal';
      const sizeW = Math.floor(Math.random() * 8) + 10;
      const sizeH = Math.floor(Math.random() * 10) + 14;
      const leftPos = Math.random() * 100;
      const duration = (Math.random() * 8 + 10).toFixed(1);
      const delay = (Math.random() * 12).toFixed(1);
      const initialOpacity = (Math.random() * 0.35 + 0.5).toFixed(2);

      petal.style.width = `${sizeW}px`;
      petal.style.height = `${sizeH}px`;
      petal.style.left = `${leftPos}%`;
      petal.style.animationDuration = `${duration}s`;
      petal.style.animationDelay = `-${delay}s`;
      petal.style.opacity = initialOpacity;

      sakuraContainer.appendChild(petal);
    }
  }

  // Spawn ambient rising floating hearts & love symbols
  if (heartsContainer) {
    const heartSymbols = ['💖', '💕', '🌸', '✨', '🫧', '💗', '🥰'];
    const heartCount = 10;
    for (let i = 0; i < heartCount; i++) {
      const heart = document.createElement('div');
      heart.className = 'ambient-heart-item';
      heart.textContent = heartSymbols[Math.floor(Math.random() * heartSymbols.length)];
      
      const leftPos = Math.random() * 92 + 4;
      const fontSize = Math.floor(Math.random() * 12) + 16;
      const duration = (Math.random() * 10 + 16).toFixed(1);
      const delay = (Math.random() * 16).toFixed(1);

      heart.style.left = `${leftPos}%`;
      heart.style.fontSize = `${fontSize}px`;
      heart.style.animationDuration = `${duration}s`;
      heart.style.animationDelay = `-${delay}s`;

      heartsContainer.appendChild(heart);
    }
  }
}

// ==================== ANGIE LOVE PATH & ACTIVITY MODAL SYSTEM ====================
const ACTIVITIES_INFO = {
  photobooth: {
    id: 'photobooth',
    title: 'Online Photobooth Berdua',
    subtitle: 'Korean 4-Cut Life4Cuts Studio',
    tag: 'FREE TO PLAY',
    image: '/images/photobooth-chibi.jpg',
    duration: '~3 Menit',
    players: '2 Pemain (Live Sync)',
    vibe: 'Bucin & Aesthetic 📸',
    description: 'Jepret 4 foto kolase photostrip ala Korea bareng ayang! Dilengkapi countdown sync 3 detik, pilihan frame warna pastel, stiker gemes, dan bisa langsung didownload format PNG resolusi tinggi.',
    tip: 'Tips: Pasang pose serasi bareng ayang pas countdown bunyi "3... 2... 1... Jepret!"'
  },
  knowme: {
    id: 'quizhub',
    submode: 'knowme',
    title: 'How Well Do You Know Me?',
    subtitle: 'Studio Kuis: Seberapa Kenal Ayang',
    tag: '★ 1 MOST PLAYED',
    image: '/images/quiz-chibi.jpg',
    duration: '~4 Menit',
    players: '2 Pemain (Tebak-tebakan)',
    vibe: 'Tes Chemistry & Rahasia 🎯',
    description: 'Satu orang jawab pertanyaan rahasia, dan pasangannya harus nebak apa jawabannya! Tes seberapa dalam kamu hafal kebiasaan, makanan favorit, dan red flags lucu ayangmu.',
    tip: 'Tips: Jangan ngambek ya kalau ayang salah nebak makanan favoritmu!'
  },
  court: {
    id: 'court',
    title: 'Pengadilan Asmara',
    subtitle: 'Couples Court & AI Love Judge',
    tag: 'HOT DEBATE ⚖️',
    image: '/images/court-chibi.jpg',
    duration: '~5 Menit',
    players: '2 Pemain + 1 Hakim Cinta',
    vibe: 'Drama Lucu & Bikin Ngakak 😂',
    description: 'Ada unek-unek yang belum tuntas? Bawa ke meja hijau cinta! Gugat perkara kocak seperti "kebiasaan bilang terserah", "lama bales chat", atau "ketiduran pas call". Hakim Cinta AI bakal ketuk palu dan beri vonis romantis!',
    tip: 'Tips: Siapkan nota pembelaan paling beralasan agar tidak divonis hukuman bucin!'
  },
  deeptalk: {
    id: 'deeptalk',
    title: 'Roda Asmara & Deep Talk',
    subtitle: 'Kartu Kejujuran 3D (Honest Cards)',
    tag: 'DEEP CONNECT 💌',
    image: '/images/deeptalk-chibi.jpg',
    duration: 'Santai (~10 Menit)',
    players: '2 Pemain (Bergantian)',
    vibe: 'Bikin Baper & Hangat 💖',
    description: 'Buka percakapan hati-ke-hati yang jarang terucap. Pilih dari 4 kategori kartu: Masa Depan Kita, Rahasia Lucu, Apresiasi Hangat, dan Pertanyaan Random. Kartu 3D interaktif yang berputar sinkron di layar berdua.',
    tip: 'Tips: Cocok banget dimainkan larut malam sambil dengerin BGM santai dan voice call.'
  },
  arcadehub: {
    id: 'arcadehub',
    title: 'Love Arcade & Seni',
    subtitle: 'Kanvas Gambar Bersama & Catch Reflex',
    tag: 'ARCADE FUN 🕹️',
    image: '/images/arcade-chibi.jpg',
    duration: '~3 Menit',
    players: '2 Pemain (Realtime)',
    vibe: 'Kreatif & Seru 🎨',
    description: 'Dua game seru dalam satu studio: Gambar bareng di satu kanvas sinkron secara live (tebak gambar atau lukis wajah pasangan), atau adu refleks cepat 30 detik menangkap hati cinta yang beterbangan!',
    tip: 'Tips: Coba gambar potret wajah ayang dalam 30 detik tanpa ngapus!'
  },
  detective: {
    id: 'detective',
    title: 'Detektif Asmara: Kasus Misteri',
    subtitle: 'Misteri Kado Kenangan (3 Babak / 3 Menit)',
    tag: 'GAME BARU 🔍',
    image: '/images/detective-chibi.jpg',
    duration: '3 Menit (180 Detik)',
    players: '2 Pemain (Co-op Escape)',
    vibe: 'Kompak & Menegangkan 🕵️‍♂️🕵️‍♀️',
    description: 'Kalian berdua menjadi Detektif Bayu & Detektif Ema! Seseorang menyembunyikan kado rahasia di dalam brankas kafe yang akan tutup dalam 3 menit. Selesaikan 3 Babak: Olah TKP & Kombinasi Gembok, Interogasi 3 Saksi Lucu, dan Tekan Kunci Cinta Sinkron untuk membuka brankas!',
    tip: 'Tips: Bayu & Ema harus bagi tugas memeriksa petunjuk barang bukti agar gembok terbuka lebih cepat!'
  }
};

window.openActivityModal = function(key) {
  const info = ACTIVITIES_INFO[key];
  if (!info) return;

  const modal = document.getElementById('activityPreviewModal');
  const imgEl = document.getElementById('modalActivityImage');
  const tagEl = document.getElementById('modalActivityTag');
  const titleEl = document.getElementById('modalActivityTitle');
  const subEl = document.getElementById('modalActivitySubtitle');
  const durEl = document.getElementById('modalDuration');
  const playEl = document.getElementById('modalPlayers');
  const vibeEl = document.getElementById('modalVibe');
  const descEl = document.getElementById('modalDescription');
  const tipEl = document.getElementById('modalTip');
  const startBtn = document.getElementById('modalStartBtn');

  if (imgEl) imgEl.src = info.image;
  if (tagEl) tagEl.textContent = info.tag;
  if (titleEl) titleEl.textContent = info.title;
  if (subEl) subEl.textContent = info.subtitle;
  if (durEl) durEl.textContent = `⏱️ ${info.duration}`;
  if (playEl) playEl.textContent = `👥 ${info.players}`;
  if (vibeEl) vibeEl.textContent = info.vibe;
  if (descEl) descEl.textContent = info.description;
  if (tipEl) tipEl.textContent = info.tip;

  if (startBtn) {
    startBtn.onclick = () => {
      window.closeActivityModal();
      if (info.submode && window.quizHub) {
        window.quizHub.switchMode(info.submode);
      }
      switchTab(info.id);
    };
  }

  if (modal) modal.classList.remove('hidden');
  if (window.soundController) window.soundController.playPop();
};

window.closeActivityModal = function() {
  const modal = document.getElementById('activityPreviewModal');
  if (modal) modal.classList.add('hidden');
};

function updateLovePathProgress() {
  if (!window.triedActivities) window.triedActivities = new Set(['photobooth']);
  const total = 6;
  const triedCount = Math.min(total, window.triedActivities.size);
  const percent = Math.round((triedCount / total) * 100);

  const countEl = document.getElementById('pathProgressCount');
  const barEl = document.getElementById('pathProgressBar');
  const upNextEl = document.getElementById('pathUpNext');

  if (countEl) countEl.textContent = `${triedCount} of ${total} tried`;
  if (barEl) barEl.style.width = `${percent}%`;

  const order = [
    { id: 'photobooth', name: 'Online Photobooth' },
    { id: 'quizhub', name: 'How Well Do You Know Me' },
    { id: 'court', name: 'Pengadilan Asmara' },
    { id: 'deeptalk', name: 'Roda Asmara & Deep Talk' },
    { id: 'arcadehub', name: 'Love Arcade & Seni' },
    { id: 'detective', name: 'Detektif Asmara' }
  ];
  const next = order.find(item => !window.triedActivities.has(item.id)) || order[0];
  if (upNextEl) upNextEl.textContent = next.name;
}

function setupRoadmapSearch() {
  const searchInput = document.getElementById('roadmapSearchInput');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    document.querySelectorAll('.roadmap-station').forEach(station => {
      const key = station.dataset.activityKey || '';
      const info = ACTIVITIES_INFO[key];
      if (!info) return;

      const match = !q || 
        info.title.toLowerCase().includes(q) || 
        info.subtitle.toLowerCase().includes(q) ||
        info.description.toLowerCase().includes(q) ||
        info.vibe.toLowerCase().includes(q);

      if (match) {
        station.style.opacity = '1';
        station.style.filter = 'none';
        station.classList.remove('pointer-events-none');
      } else {
        station.style.opacity = '0.25';
        station.style.filter = 'grayscale(80%)';
        station.classList.add('pointer-events-none');
      }
    });
  });
}

function setupAngieRoadmap() {
  window.triedActivities = new Set(['photobooth']);
  updateLovePathProgress();
  setupRoadmapSearch();

  // Escape key closes modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      window.closeActivityModal();
    }
  });

  // Direct voice call helper for right sidebar
  window.triggerVoiceCallDirect = function() {
    const headerBtn = document.getElementById('headerCallBtn');
    if (headerBtn && !headerBtn.disabled) {
      headerBtn.click();
    } else {
      showNotification('Pasangan belum terhubung ke kamar.');
    }
  };
}



