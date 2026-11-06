const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory room management
// roomCode -> { code, createdAt, players: [{id, name, avatar, isHost}], currentGame: 'lobby', gameState: {} }
const rooms = new Map();
const roomTimers = new Map();

function generateRoomCode() {
  const words = ['LOVE', 'DEAR', 'SOUL', 'SWEET', 'HONEY', 'HEART', 'KITA', 'DUA'];
  const prefix = words[Math.floor(Math.random() * words.length)];
  const num = Math.floor(10 + Math.random() * 90);
  return `${prefix}-${num}`;
}

function getPublicRoomData(room) {
  if (!room) return null;
  return {
    code: room.code,
    createdAt: room.createdAt,
    players: room.players.map(p => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      score: p.score,
      isHost: p.isHost
    })),
    currentGame: room.currentGame
  };
}

function clearRoomTimers(roomCode) {
  const timers = roomTimers.get(roomCode);
  if (timers) {
    if (timers.catchInterval) clearInterval(timers.catchInterval);
    if (timers.catchTimerInterval) clearInterval(timers.catchTimerInterval);
    roomTimers.delete(roomCode);
  }
}

io.on('connection', (socket) => {
  let currentRoom = null;

  // 1. CREATE ROOM
  socket.on('create-room', ({ name, avatar }, callback) => {
    let roomCode = generateRoomCode();
    while (rooms.has(roomCode)) {
      roomCode = generateRoomCode();
    }

    const room = {
      code: roomCode,
      createdAt: Date.now(),
      players: [
        {
          id: socket.id,
          name: name || 'Kamu',
          avatar: avatar || '🧸',
          score: 0,
          isHost: true
        }
      ],
      currentGame: 'lobby',
      gameState: {}
    };

    rooms.set(roomCode, room);
    socket.join(roomCode);
    currentRoom = roomCode;

    if (callback) callback({ success: true, roomCode, room: getPublicRoomData(room) });
    socket.emit('room-updated', getPublicRoomData(room));
  });

  // 2. JOIN ROOM
  socket.on('join-room', ({ roomCode, name, avatar }, callback) => {
    const code = (roomCode || '').trim().toUpperCase();
    const room = rooms.get(code);

    if (!room) {
      if (callback) callback({ success: false, message: 'Kode Room tidak ditemukan!' });
      return;
    }

    if (room.players.length >= 2) {
      if (callback) callback({ success: false, message: 'Room sudah penuh (khusus 2 orang pasangan)!' });
      return;
    }

    const newPlayer = {
      id: socket.id,
      name: name || 'Pasangan',
      avatar: avatar || '🐰',
      score: 0,
      isHost: false
    };

    room.players.push(newPlayer);
    socket.join(code);
    currentRoom = code;

    const publicRoom = getPublicRoomData(room);
    if (callback) callback({ success: true, roomCode: code, room: publicRoom });
    io.to(code).emit('room-updated', publicRoom);
    io.to(code).emit('partner-joined', {
      player: newPlayer,
      message: `${newPlayer.name} ${newPlayer.avatar} telah bergabung di kamar cinta kalian!`
    });
  });

  // 3. LEAVE / DISCONNECT
  const handleLeave = () => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room) return;

    clearRoomTimers(currentRoom);

    const departingPlayer = room.players.find(p => p.id === socket.id);
    room.players = room.players.filter(p => p.id !== socket.id);

    if (room.players.length === 0) {
      rooms.delete(currentRoom);
    } else {
      // Reassign host if needed
      room.players[0].isHost = true;
      const publicRoom = getPublicRoomData(room);
      io.to(currentRoom).emit('partner-left', {
        player: departingPlayer,
        message: departingPlayer ? `${departingPlayer.name} telah meninggalkan ruangan.` : 'Pasanganmu keluar.'
      });
      io.to(currentRoom).emit('room-updated', publicRoom);
    }

    socket.leave(currentRoom);
    currentRoom = null;
  };

  socket.on('leave-room', handleLeave);
  socket.on('disconnect', handleLeave);

  // 4. CHAT & QUICK REACTIONS
  socket.on('send-message', (data) => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room) return;

    const sender = room.players.find(p => p.id === socket.id);
    const messagePayload = {
      id: Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      senderId: socket.id,
      senderName: sender ? sender.name : 'Pasangan',
      senderAvatar: sender ? sender.avatar : '❤️',
      text: data.text,
      type: data.type || 'text', // text, reaction, quick-love, sticker
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    io.to(currentRoom).emit('new-message', messagePayload);
  });

  socket.on('typing', ({ isTyping }) => {
    if (!currentRoom) return;
    socket.to(currentRoom).emit('partner-typing', { isTyping });
  });

  // 5. WEBRTC AUDIO CALL SIGNALING
  socket.on('call-request', () => {
    if (!currentRoom) return;
    socket.to(currentRoom).emit('incoming-call', { fromId: socket.id });
  });

  socket.on('call-accept', () => {
    if (!currentRoom) return;
    socket.to(currentRoom).emit('call-accepted', { fromId: socket.id });
  });

  socket.on('call-reject', ({ reason }) => {
    if (!currentRoom) return;
    socket.to(currentRoom).emit('call-rejected', { reason });
  });

  socket.on('call-end', () => {
    if (!currentRoom) return;
    socket.to(currentRoom).emit('call-ended');
  });

  socket.on('webrtc-offer', ({ offer }) => {
    if (!currentRoom) return;
    socket.to(currentRoom).emit('webrtc-offer', { offer });
  });

  socket.on('webrtc-answer', ({ answer }) => {
    if (!currentRoom) return;
    socket.to(currentRoom).emit('webrtc-answer', { answer });
  });

  socket.on('webrtc-ice-candidate', ({ candidate }) => {
    if (!currentRoom) return;
    socket.to(currentRoom).emit('webrtc-ice-candidate', { candidate });
  });

  // 6. GAME SELECTION & SWITCHING
  socket.on('switch-game', ({ gameId }) => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room) return;

    clearRoomTimers(currentRoom);

    room.currentGame = gameId;
    room.gameState = {}; // reset game-specific state
    io.to(currentRoom).emit('game-switched', { gameId, room: getPublicRoomData(room) });
  });

  // 7. MINI GAME 1: TELEPATHY QUIZ
  socket.on('telepathy-submit-answer', ({ questionIndex, answerIndex, answerText }) => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room) return;

    if (!room.gameState.telepathy) {
      room.gameState.telepathy = { answers: {}, scores: {} };
    }

    const tState = room.gameState.telepathy;
    if (!tState.answers[questionIndex]) {
      tState.answers[questionIndex] = {};
    }

    tState.answers[questionIndex][socket.id] = { answerIndex, answerText };

    // Check if both answered
    const currentQuestionAnswers = tState.answers[questionIndex];
    const answeredPlayerIds = Object.keys(currentQuestionAnswers);

    if (answeredPlayerIds.length >= room.players.length && room.players.length >= 2) {
      // Compare answers
      const p1 = room.players[0].id;
      const p2 = room.players[1].id;
      const a1 = currentQuestionAnswers[p1];
      const a2 = currentQuestionAnswers[p2];

      const isMatch = a1 && a2 && (a1.answerIndex === a2.answerIndex);

      io.to(currentRoom).emit('telepathy-reveal', {
        questionIndex,
        answers: currentQuestionAnswers,
        isMatch
      });
    } else {
      // Notify partner has submitted answer (without revealing what it is)
      socket.to(currentRoom).emit('telepathy-partner-answered', { questionIndex });
    }
  });

  socket.on('telepathy-next-question', ({ nextIndex }) => {
    if (!currentRoom) return;
    io.to(currentRoom).emit('telepathy-change-question', { nextIndex });
  });

  // 8. MINI GAME 2: DEEP TALK & DARE (Fully Synchronized Server State with No-Repeat Decks)
  socket.on('deeptalk-select-category', ({ categoryIndex }) => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room) return;

    const selector = room.players.find(p => p.id === socket.id);
    if (!room.gameState.deeptalk) {
      room.gameState.deeptalk = { categoryIndex: 0, card: '', isOpen: false, drawerName: '', usedCards: {} };
    }

    room.gameState.deeptalk.categoryIndex = categoryIndex;
    room.gameState.deeptalk.isOpen = false;
    room.gameState.deeptalk.card = '';
    room.gameState.deeptalk.drawerName = selector ? selector.name : 'Pasangan';

    io.to(currentRoom).emit('deeptalk-state-updated', {
      ...room.gameState.deeptalk,
      action: 'category-changed'
    });
  });

  socket.on('deeptalk-open-card', ({ categoryIndex, totalCardsInCat, cardList }) => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room) return;

    const drawer = room.players.find(p => p.id === socket.id);
    if (!room.gameState.deeptalk) {
      room.gameState.deeptalk = { categoryIndex: 0, card: '', isOpen: false, drawerName: '', usedCards: {} };
    }

    const catIdx = categoryIndex !== undefined ? categoryIndex : room.gameState.deeptalk.categoryIndex;
    if (!room.gameState.deeptalk.usedCards) {
      room.gameState.deeptalk.usedCards = {};
    }
    if (!room.gameState.deeptalk.usedCards[catIdx]) {
      room.gameState.deeptalk.usedCards[catIdx] = [];
    }

    let used = room.gameState.deeptalk.usedCards[catIdx];
    let cards = Array.isArray(cardList) ? cardList : [];
    let total = cards.length || totalCardsInCat || 10;

    // Check if all cards in this category have been used
    let isReshuffled = false;
    if (used.length >= total) {
      used = [];
      room.gameState.deeptalk.usedCards[catIdx] = [];
      isReshuffled = true;
    }

    // Find available indices
    const availableIndices = [];
    for (let i = 0; i < total; i++) {
      if (!used.includes(i)) availableIndices.push(i);
    }

    const randomPick = availableIndices[Math.floor(Math.random() * availableIndices.length)] || 0;
    used.push(randomPick);

    const selectedCard = cards[randomPick] || 'Kartu Cinta Bayu & Ema';

    room.gameState.deeptalk = {
      ...room.gameState.deeptalk,
      categoryIndex: catIdx,
      card: selectedCard,
      cardIndex: randomPick,
      usedCount: used.length,
      totalCount: total,
      isOpen: true,
      isReshuffled,
      drawerName: drawer ? drawer.name : 'Pasangan'
    };

    io.to(currentRoom).emit('deeptalk-state-updated', {
      ...room.gameState.deeptalk,
      action: 'card-opened'
    });
  });

  socket.on('deeptalk-close-card', () => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room || !room.gameState.deeptalk) return;

    room.gameState.deeptalk.isOpen = false;
    io.to(currentRoom).emit('deeptalk-state-updated', {
      ...room.gameState.deeptalk,
      action: 'card-closed'
    });
  });

  socket.on('deeptalk-get-state', (callback) => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room) return;

    if (!room.gameState.deeptalk) {
      room.gameState.deeptalk = { categoryIndex: 0, card: '', isOpen: false, drawerName: '', usedCards: {} };
    }
    if (callback) callback(room.gameState.deeptalk);
    else socket.emit('deeptalk-state-updated', room.gameState.deeptalk);
  });

  socket.on('deeptalk-reaction', ({ reaction }) => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    const sender = room ? room.players.find(p => p.id === socket.id) : null;
    io.to(currentRoom).emit('deeptalk-reaction-received', {
      senderId: socket.id,
      senderName: sender ? sender.name : 'Pasangan',
      senderAvatar: sender ? sender.avatar : '❤️',
      reaction
    });
  });

  // 9. MINI GAME 3: LOVE CANVAS (DRAW & GUESS / SHARED DOODLE)
  socket.on('canvas-draw-stroke', (strokeData) => {
    if (!currentRoom) return;
    socket.to(currentRoom).emit('canvas-draw-stroke', strokeData);
  });

  socket.on('canvas-clear', () => {
    if (!currentRoom) return;
    io.to(currentRoom).emit('canvas-cleared');
  });

  socket.on('canvas-start-guess', ({ drawerId, word, hint }) => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room) return;

    room.gameState.canvasGuess = {
      drawerId,
      word,
      hint,
      guessed: false
    };

    // Send word to drawer, hint to guesser
    socket.emit('canvas-guess-word-assigned', { isDrawer: true, word, hint });
    socket.to(currentRoom).emit('canvas-guess-word-assigned', { isDrawer: false, hint, length: word.length });
  });

  socket.on('canvas-submit-guess', ({ guess }) => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room || !room.gameState.canvasGuess) return;

    const state = room.gameState.canvasGuess;
    const cleanedGuess = (guess || '').trim().toLowerCase();
    const cleanedWord = (state.word || '').trim().toLowerCase();

    const isCorrect = cleanedGuess === cleanedWord;
    const sender = room.players.find(p => p.id === socket.id);

    io.to(currentRoom).emit('canvas-guess-result', {
      senderName: sender ? sender.name : 'Pasangan',
      guess,
      isCorrect,
      word: isCorrect ? state.word : null
    });
  });

  // 10. MINI GAME 4: LOVE CATCH (CO-OP REFLEX GAME)
  socket.on('catch-start-game', () => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room) return;

    // Reset catch timers
    clearRoomTimers(currentRoom);

    room.catchState = {
      score: 0,
      timeLeft: 30
    };

    io.to(currentRoom).emit('catch-game-started', {
      duration: 30
    });

    const types = [
      { emoji: '💖', points: 10, weight: 60 },
      { emoji: '🌟', points: 25, weight: 20 },
      { emoji: '🎁', points: 50, weight: 10 },
      { emoji: '💔', points: -15, weight: 10 }
    ];

    // Spawner
    const catchInterval = setInterval(() => {
      if (!rooms.has(currentRoom)) {
        clearRoomTimers(currentRoom);
        return;
      }

      const rand = Math.random() * 100;
      let selected = types[0];
      let cumulative = 0;
      for (const t of types) {
        cumulative += t.weight;
        if (rand <= cumulative) {
          selected = t;
          break;
        }
      }

      const itemId = 'item_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
      const posX = Math.floor(Math.random() * 88); // percentage 0 - 88%
      const duration = (Math.random() * 1.5 + 2.5).toFixed(2); // 2.5s - 4.0s

      io.to(currentRoom).emit('catch-spawn-item', {
        itemId,
        posX,
        duration: parseFloat(duration),
        emoji: selected.emoji,
        points: selected.points
      });
    }, 650);

    // Timer
    const catchTimerInterval = setInterval(() => {
      if (!rooms.has(currentRoom) || !room.catchState) {
        clearRoomTimers(currentRoom);
        return;
      }

      room.catchState.timeLeft--;
      io.to(currentRoom).emit('catch-timer-tick', { timeLeft: room.catchState.timeLeft });

      if (room.catchState.timeLeft <= 0) {
        clearRoomTimers(currentRoom);
        io.to(currentRoom).emit('catch-game-ended', { totalScore: room.catchState.score });
      }
    }, 1000);

    roomTimers.set(currentRoom, { catchInterval, catchTimerInterval });
  });

  socket.on('catch-item-collected', ({ itemId, points, itemType }) => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room || !room.catchState) return;

    room.catchState.score = Math.max(0, room.catchState.score + points);
    const collector = room.players.find(p => p.id === socket.id);

    io.to(currentRoom).emit('catch-item-collected', {
      itemId,
      points,
      itemType,
      newTotalScore: room.catchState.score,
      collectorName: collector ? collector.name : 'Pasangan',
      collectorId: socket.id
    });
  });

  // ==========================================
  // 11. ANGIE ACTIVITY 1: LOVE MOMENTS & MOOD PINGS
  // ==========================================
  socket.on('send-love-moment', ({ type, message }) => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    const sender = room ? room.players.find(p => p.id === socket.id) : null;
    io.to(currentRoom).emit('love-moment-received', {
      senderId: socket.id,
      senderName: sender ? sender.name : 'Ayang',
      senderAvatar: sender ? sender.avatar : '💖',
      type: type || 'kiss', // kiss, hug, pinch, pat, love-burst
      message: message || ''
    });
  });

  socket.on('set-couple-mood', ({ mood, note }) => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    const sender = room ? room.players.find(p => p.id === socket.id) : null;
    if (room) {
      if (!room.moods) room.moods = {};
      room.moods[socket.id] = { mood, note, updatedAt: Date.now() };
    }
    io.to(currentRoom).emit('couple-mood-updated', {
      playerId: socket.id,
      playerName: sender ? sender.name : 'Ayang',
      playerAvatar: sender ? sender.avatar : '❤️',
      mood,
      note: note || ''
    });
  });

  // Relay for Merged Quiz Submodes
  socket.on('quiz-submode-switch', ({ mode }) => {
    if (!currentRoom) return;
    io.to(currentRoom).emit('quiz-submode-switched', { mode });
  });

  // Relay for Merged Arcade Submodes
  socket.on('arcade-submode-switch', ({ mode }) => {
    if (!currentRoom) return;
    io.to(currentRoom).emit('arcade-submode-switched', { mode });
  });

  // ==========================================
  // 12. ANGIE ACTIVITY 2: VIRTUAL PHOTOBOOTH
  // ==========================================
  socket.on('photobooth-start-countdown', ({ seconds, slotIndex }) => {
    if (!currentRoom) return;
    io.to(currentRoom).emit('photobooth-countdown-tick', {
      seconds: seconds || 3,
      slotIndex: slotIndex !== undefined ? slotIndex : 0,
      triggeredBy: socket.id
    });
  });

  socket.on('photobooth-snap-now', ({ slotIndex }) => {
    if (!currentRoom) return;
    io.to(currentRoom).emit('photobooth-snapped', {
      slotIndex,
      timestamp: Date.now()
    });
  });

  socket.on('photobooth-change-frame', ({ frameId }) => {
    if (!currentRoom) return;
    io.to(currentRoom).emit('photobooth-frame-changed', { frameId });
  });

  socket.on('photobooth-share-strip', ({ stripDataUrl, creatorName }) => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    const sender = room ? room.players.find(p => p.id === socket.id) : null;
    io.to(currentRoom).emit('photobooth-strip-shared', {
      stripDataUrl,
      creatorName: sender ? sender.name : (creatorName || 'Ayang'),
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  });

  // ==========================================
  // 13. ANGIE ACTIVITY 3: COUPLES COURT (PENGADILAN ASMARA)
  // ==========================================
  socket.on('court-select-case', ({ caseTitle, category, plaintiffRole }) => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room) return;

    const sender = room.players.find(p => p.id === socket.id);
    room.gameState.court = {
      caseTitle,
      category,
      plaintiffId: socket.id,
      plaintiffName: sender ? sender.name : 'Penuntut',
      plaintiffRole: plaintiffRole || 'bayu',
      arguments: {},
      verdict: null,
      status: 'hearing' // selecting, hearing, verdict
    };

    io.to(currentRoom).emit('court-case-started', room.gameState.court);
  });

  socket.on('court-submit-argument', ({ role, statement }) => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room || !room.gameState.court) return;

    const sender = room.players.find(p => p.id === socket.id);
    room.gameState.court.arguments[socket.id] = {
      playerId: socket.id,
      playerName: sender ? sender.name : 'Terdakwa/Penuntut',
      role,
      statement
    };

    io.to(currentRoom).emit('court-argument-submitted', {
      playerId: socket.id,
      playerName: sender ? sender.name : 'Terdakwa/Penuntut',
      role,
      statement,
      totalArguments: Object.keys(room.gameState.court.arguments).length
    });
  });

  socket.on('court-issue-verdict', (verdictData) => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room || !room.gameState.court) return;

    room.gameState.court.verdict = verdictData;
    room.gameState.court.status = 'verdict';

    io.to(currentRoom).emit('court-verdict-announced', verdictData);
  });

  socket.on('court-reset', () => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (room) room.gameState.court = null;
    io.to(currentRoom).emit('court-reset-done');
  });

  // ==========================================
  // 14. ANGIE ACTIVITY 4: HOW WELL DO YOU KNOW ME? (SEBERAPA KENAL AYANG)
  // ==========================================
  socket.on('knowme-start-round', ({ questionIndex, targetPerson }) => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room) return;

    room.gameState.knowme = {
      questionIndex,
      targetPerson, // 'bayu' or 'ema'
      truth: null,
      guess: null,
      revealed: false
    };

    io.to(currentRoom).emit('knowme-round-started', {
      questionIndex,
      targetPerson
    });
  });

  socket.on('knowme-submit-truth', ({ answerIndex, answerText }) => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room || !room.gameState.knowme) return;

    room.gameState.knowme.truth = { answerIndex, answerText, playerId: socket.id };
    socket.to(currentRoom).emit('knowme-partner-submitted-truth');

    // If guess already in, check and reveal
    if (room.gameState.knowme.guess) {
      const isMatch = room.gameState.knowme.guess.guessIndex === answerIndex;
      room.gameState.knowme.revealed = true;
      io.to(currentRoom).emit('knowme-revealed', {
        truth: room.gameState.knowme.truth,
        guess: room.gameState.knowme.guess,
        isMatch
      });
    }
  });

  socket.on('knowme-submit-guess', ({ guessIndex, guessText }) => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room || !room.gameState.knowme) return;

    room.gameState.knowme.guess = { guessIndex, guessText, playerId: socket.id };
    socket.to(currentRoom).emit('knowme-partner-submitted-guess');

    // If truth already in, check and reveal
    if (room.gameState.knowme.truth) {
      const isMatch = room.gameState.knowme.truth.answerIndex === guessIndex;
      room.gameState.knowme.revealed = true;
      io.to(currentRoom).emit('knowme-revealed', {
        truth: room.gameState.knowme.truth,
        guess: room.gameState.knowme.guess,
        isMatch
      });
    }
  });

  socket.on('knowme-next-question', ({ nextIndex, nextTarget }) => {
    if (!currentRoom) return;
    io.to(currentRoom).emit('knowme-advance-question', {
      nextIndex,
      nextTarget
    });
  });

  // ==========================================
  // 15. ANGIE ACTIVITY 5: WHO'S MOST LIKELY TO? (SIAPA PALING MUNGKIN)
  // ==========================================
  socket.on('likely-submit-vote', ({ questionIndex, chosenPerson }) => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room) return;

    if (!room.gameState.likely) {
      room.gameState.likely = { answers: {} };
    }

    if (!room.gameState.likely.answers[questionIndex]) {
      room.gameState.likely.answers[questionIndex] = {};
    }

    const currentAnswers = room.gameState.likely.answers[questionIndex];
    currentAnswers[socket.id] = { chosenPerson }; // 'Bayu' or 'Ema'

    const answeredIds = Object.keys(currentAnswers);
    if (answeredIds.length >= room.players.length && room.players.length >= 2) {
      const p1 = room.players[0].id;
      const p2 = room.players[1].id;
      const a1 = currentAnswers[p1];
      const a2 = currentAnswers[p2];

      const isMatch = a1 && a2 && (a1.chosenPerson.toLowerCase() === a2.chosenPerson.toLowerCase());

      io.to(currentRoom).emit('likely-reveal', {
        questionIndex,
        answers: currentAnswers,
        isMatch,
        consensus: isMatch ? a1.chosenPerson : null
      });
    } else {
      socket.to(currentRoom).emit('likely-partner-voted', { questionIndex });
    }
  });

  socket.on('likely-next-question', ({ nextIndex }) => {
    if (!currentRoom) return;
    io.to(currentRoom).emit('likely-advance', { nextIndex });
  });

  // ==========================================
  // 16. DETEKTIF ASMARA: MISTERI KENCAN RAHASIA (3 BABAK / 3 MENIT)
  // ==========================================
  socket.on('detective-start-game', () => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room) return;

    room.gameState.detective = {
      startTime: Date.now(),
      durationSeconds: 180, // 3 Minutes
      currentAct: 1, // 1, 2, or 3
      act1: {
        inspectedClues: [],
        padlockCode: '7294',
        solved: false
      },
      act2: {
        inspectedSuspects: [],
        correctAlibiIndex: 1,
        solved: false
      },
      act3: {
        keysPressed: {},
        solved: false
      },
      completed: false,
      won: false
    };

    io.to(currentRoom).emit('detective-game-started', {
      state: room.gameState.detective,
      serverTime: Date.now()
    });
  });

  socket.on('detective-inspect-clue', ({ clueId, playerName }) => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room || !room.gameState.detective) return;

    if (!room.gameState.detective.act1.inspectedClues.includes(clueId)) {
      room.gameState.detective.act1.inspectedClues.push(clueId);
    }

    io.to(currentRoom).emit('detective-clue-inspected', {
      clueId,
      playerName,
      inspectedClues: room.gameState.detective.act1.inspectedClues
    });
  });

  socket.on('detective-submit-padlock', ({ code, playerName }) => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room || !room.gameState.detective) return;

    const isCorrect = String(code).trim() === room.gameState.detective.act1.padlockCode;
    if (isCorrect) {
      room.gameState.detective.act1.solved = true;
      room.gameState.detective.currentAct = 2;
      io.to(currentRoom).emit('detective-act-completed', {
        completedAct: 1,
        nextAct: 2,
        playerName
      });
    } else {
      socket.emit('detective-padlock-failed', { message: 'Kombinasi salah! Coba periksa petunjuk lagi.' });
    }
  });

  socket.on('detective-submit-alibi', ({ choiceIndex, playerName }) => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room || !room.gameState.detective) return;

    const isCorrect = choiceIndex === room.gameState.detective.act2.correctAlibiIndex;
    if (isCorrect) {
      room.gameState.detective.act2.solved = true;
      room.gameState.detective.currentAct = 3;
      io.to(currentRoom).emit('detective-act-completed', {
        completedAct: 2,
        nextAct: 3,
        playerName
      });
    } else {
      io.to(currentRoom).emit('detective-alibi-failed', { playerName });
    }
  });

  socket.on('detective-press-key', ({ keyId, playerName }) => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room || !room.gameState.detective) return;

    room.gameState.detective.act3.keysPressed[socket.id] = keyId;

    const keysCount = Object.keys(room.gameState.detective.act3.keysPressed).length;
    if (keysCount >= Math.min(2, room.players.length)) {
      room.gameState.detective.act3.solved = true;
      room.gameState.detective.completed = true;
      room.gameState.detective.won = true;

      const elapsedSeconds = Math.round((Date.now() - room.gameState.detective.startTime) / 1000);
      io.to(currentRoom).emit('detective-victory', {
        elapsedSeconds,
        message: 'Kalian berhasil memecahkan seluruh misteri dalam 3 babak!'
      });
    } else {
      socket.to(currentRoom).emit('detective-partner-key-pressed', { playerName, keyId });
    }
  });

  socket.on('detective-timeout', () => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room || !room.gameState.detective) return;

    room.gameState.detective.completed = true;
    room.gameState.detective.won = false;
    io.to(currentRoom).emit('detective-game-over', {
      reason: 'Waktu 3 menit telah habis!'
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`💖 LoveNest server berjalan di http://localhost:${PORT}`);
});
