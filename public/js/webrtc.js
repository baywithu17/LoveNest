// WebRTC Audio Call Manager
class VoiceCallManager {
  constructor(socket) {
    this.socket = socket;
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.remoteAudioEl = null;
    this.isMuted = false;
    this.isDeafened = false;
    this.callState = 'idle'; // idle, calling, ringing, connected
    this.callTimerInterval = null;
    this.callSeconds = 0;
    this.audioContext = null;
    this.analyser = null;
    this.visualizerInterval = null;

    this.rtcConfig = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    this.initAudioElement();
    this.setupSocketEvents();
  }

  initAudioElement() {
    this.remoteAudioEl = document.createElement('audio');
    this.remoteAudioEl.autoplay = true;
    this.remoteAudioEl.playsInline = true;
    document.body.appendChild(this.remoteAudioEl);
  }

  setupSocketEvents() {
    this.socket.on('incoming-call', ({ fromId }) => {
      if (this.callState !== 'idle') {
        this.socket.emit('call-reject', { reason: 'busy' });
        return;
      }
      this.callState = 'ringing';
      if (window.soundController) window.soundController.startRingtone();
      this.onIncomingCallUI();
    });

    this.socket.on('call-accepted', async () => {
      if (this.callState !== 'calling') return;
      if (window.soundController) window.soundController.stopRingtone();
      await this.initiateWebRTCOffer();
    });

    this.socket.on('call-rejected', ({ reason }) => {
      if (window.soundController) window.soundController.stopRingtone();
      this.resetCall();
      this.onCallRejectedUI(reason);
    });

    this.socket.on('call-ended', () => {
      this.resetCall();
      this.onCallEndedUI();
    });

    this.socket.on('webrtc-offer', async ({ offer }) => {
      await this.handleWebRTCOffer(offer);
    });

    this.socket.on('webrtc-answer', async ({ answer }) => {
      if (!this.peerConnection) return;
      try {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (err) {
        console.error('Error setting remote answer:', err);
      }
    });

    this.socket.on('webrtc-ice-candidate', async ({ candidate }) => {
      if (!this.peerConnection || !candidate) return;
      try {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error('Error adding ICE candidate:', err);
      }
    });
  }

  isMediaSupported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  showMicNotice(reason = '') {
    const isHttps = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    let modal = document.getElementById('micNoticeModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'micNoticeModal';
      modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="glass-panel w-full max-w-sm rounded-3xl p-6 text-center shadow-2xl border-2 border-rose-300 animate-fade-in bg-white">
        <div class="w-14 h-14 mx-auto rounded-full bg-rose-100 text-rose-500 flex items-center justify-center text-3xl mb-3">
          🎙️
        </div>
        <h3 class="text-base font-bold text-slate-800 mb-2">Izin Mikrofon Dibutuhkan</h3>
        
        <p class="text-xs text-slate-600 leading-relaxed mb-4 text-left">
          ${!isHttps ? `
            <strong>Browser di HP membatasi mikrofon pada koneksi HTTP biasa.</strong><br><br>
            Agar suara bisa aktif di HP:
            <ol class="list-decimal pl-4 mt-1.5 space-y-1 text-slate-500">
              <li>Gunakan link <strong>HTTPS</strong> (misal via tunnel), atau</li>
              <li>Di Chrome HP, buka <code>chrome://flags</code>, cari <code>insecure-origin</code>, tambahkan alamat IP ini lalu restart Chrome.</li>
            </ol>
          ` : `
            Pastikan kamu telah mengizinkan akses mikrofon saat diminta oleh browsermu.
          `}
        </p>

        <p class="text-[11px] text-rose-600 font-semibold mb-4 bg-rose-50 p-2 rounded-xl">
          💡 Catatan: Semua mini game & pesan chat tetap bisa dimainkan dengan lancar!
        </p>

        <button onclick="document.getElementById('micNoticeModal').classList.add('hidden')"
          class="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-xs shadow-md hover:from-rose-600 hover:to-pink-600 transition-all">
          Mengerti & Lanjut Main 💕
        </button>
      </div>
    `;

    modal.classList.remove('hidden');
  }

  async startCall() {
    if (this.callState !== 'idle') return;

    if (!this.isMediaSupported()) {
      this.showMicNotice('not_supported');
      return;
    }

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });
    } catch (err) {
      console.warn('Microphone error:', err);
      this.showMicNotice('denied');
      return;
    }

    this.callState = 'calling';
    if (window.soundController) window.soundController.startRingtone();
    this.onOutgoingCallUI();
    this.socket.emit('call-request');
  }

  async acceptCall() {
    if (this.callState !== 'ringing') return;
    if (window.soundController) window.soundController.stopRingtone();

    if (!this.isMediaSupported()) {
      this.showMicNotice('not_supported');
      this.rejectCall();
      return;
    }

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });
    } catch (err) {
      console.warn('Microphone access denied:', err);
      this.showMicNotice('denied');
      this.rejectCall();
      return;
    }

    this.callState = 'connected';
    this.setupPeerConnection();
    this.socket.emit('call-accept');
    this.startCallTimer();
    this.startAudioVisualizer();
    this.onCallConnectedUI();
  }

  rejectCall() {
    if (window.soundController) window.soundController.stopRingtone();
    this.socket.emit('call-reject', { reason: 'declined' });
    this.resetCall();
    this.onCallEndedUI();
  }

  endCall() {
    this.socket.emit('call-end');
    this.resetCall();
    this.onCallEndedUI();
  }

  setupPeerConnection() {
    this.peerConnection = new RTCPeerConnection(this.rtcConfig);

    // Add local tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
      });
    }

    // Handle remote tracks
    this.peerConnection.ontrack = (event) => {
      this.remoteStream = event.streams[0];
      if (this.remoteAudioEl) {
        this.remoteAudioEl.srcObject = this.remoteStream;
      }
    };

    // ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit('webrtc-ice-candidate', { candidate: event.candidate });
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      if (this.peerConnection && ['disconnected', 'failed', 'closed'].includes(this.peerConnection.connectionState)) {
        this.endCall();
      }
    };
  }

  async initiateWebRTCOffer() {
    this.callState = 'connected';
    this.setupPeerConnection();

    try {
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true
      });
      await this.peerConnection.setLocalDescription(offer);
      this.socket.emit('webrtc-offer', { offer });
      this.startCallTimer();
      this.startAudioVisualizer();
      this.onCallConnectedUI();
    } catch (err) {
      console.error('Error creating offer:', err);
      this.endCall();
    }
  }

  async handleWebRTCOffer(offer) {
    if (!this.peerConnection) {
      this.setupPeerConnection();
    }

    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      this.socket.emit('webrtc-answer', { answer });
      this.callState = 'connected';
      this.startCallTimer();
      this.startAudioVisualizer();
      this.onCallConnectedUI();
    } catch (err) {
      console.error('Error handling offer:', err);
    }
  }

  toggleMute() {
    if (!this.localStream) return false;
    this.isMuted = !this.isMuted;
    this.localStream.getAudioTracks().forEach(track => {
      track.enabled = !this.isMuted;
    });
    return this.isMuted;
  }

  toggleDeafen() {
    this.isDeafened = !this.isDeafened;
    if (this.remoteAudioEl) {
      this.remoteAudioEl.muted = this.isDeafened;
    }
    return this.isDeafened;
  }

  startCallTimer() {
    this.callSeconds = 0;
    if (this.callTimerInterval) clearInterval(this.callTimerInterval);
    this.callTimerInterval = setInterval(() => {
      this.callSeconds++;
      const mins = String(Math.floor(this.callSeconds / 60)).padStart(2, '0');
      const secs = String(this.callSeconds % 60).padStart(2, '0');
      const timeStr = `${mins}:${secs}`;
      const timerEl = document.getElementById('callTimerDisplay');
      if (timerEl) timerEl.textContent = timeStr;
    }, 1000);
  }

  startAudioVisualizer() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!this.audioContext) this.audioContext = new AudioContext();
      if (this.audioContext.state === 'suspended') this.audioContext.resume();

      if (this.localStream) {
        const source = this.audioContext.createMediaStreamSource(this.localStream);
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 32;
        source.connect(this.analyser);

        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        const bars = document.querySelectorAll('.call-wave-bar');

        this.visualizerInterval = setInterval(() => {
          if (!this.analyser || this.callState !== 'connected') return;
          this.analyser.getByteFrequencyData(dataArray);

          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          const average = sum / dataArray.length;

          bars.forEach((bar, idx) => {
            const h = Math.max(4, (dataArray[idx % dataArray.length] / 255) * 24);
            bar.style.height = `${h}px`;
          });
        }, 100);
      }
    } catch (e) {
      console.warn('Audio visualizer error:', e);
    }
  }

  resetCall() {
    if (window.soundController) window.soundController.stopRingtone();
    if (this.callTimerInterval) {
      clearInterval(this.callTimerInterval);
      this.callTimerInterval = null;
    }
    if (this.visualizerInterval) {
      clearInterval(this.visualizerInterval);
      this.visualizerInterval = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach(t => t.stop());
      this.localStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.callState = 'idle';
    this.callSeconds = 0;
    this.isMuted = false;
    this.isDeafened = false;
  }

  // UI callbacks to be set in app.js
  onIncomingCallUI() {}
  onOutgoingCallUI() {}
  onCallConnectedUI() {}
  onCallEndedUI() {}
  onCallRejectedUI(reason) {}
}

window.VoiceCallManager = VoiceCallManager;

