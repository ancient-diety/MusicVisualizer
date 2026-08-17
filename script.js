class MusicVisualizer {
    constructor() {
        // DOM Elements
        this.canvas = document.getElementById('visualizer');
        this.ctx = this.canvas.getContext('2d');
        this.audio = document.getElementById('audioElement');
        this.fileInput = document.getElementById('fileInput');
        this.fileName = document.getElementById('fileName');
        this.albumArt = document.getElementById('albumArt');
        this.playBtn = document.getElementById('playBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.volumeValue = document.getElementById('volumeValue');
        this.progressSlider = document.getElementById('progressSlider');
        this.currentTimeEl = document.getElementById('currentTime');
        this.durationEl = document.getElementById('duration');
        this.vizModeSelect = document.getElementById('vizMode');
        this.colorThemeSelect = document.getElementById('colorTheme');
        this.animSpeedSelect = document.getElementById('animSpeed');
        this.fullscreenBtn = document.getElementById('fullscreenBtn');
        this.statusEl = document.getElementById('status');
        this.app = document.getElementById('app');

        // Web Audio API Setup
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.bufferLength = 0;

        // State
        this.isPlaying = false;
        this.vizMode = 'bars';
        this.colorTheme = 'neon';
        this.animationSpeed = 1;
        this.isFullscreen = false;
        this.particleSystem = [];

        // Color Themes - Dark Cyberpunk vibes
        this.themes = {
            neon: {
                primary: '#00d4ff',
                secondary: '#ff0080',
                accent: '#00ff80',
                bars: ['#00d4ff', '#00ff80', '#ff0080', '#ff6600'],
                bg: 'rgba(10, 15, 25, 0.3)',
                glow: 'rgba(0, 212, 255, 0.4)'
            },
            fire: {
                primary: '#ff2200',
                secondary: '#ff6600',
                accent: '#ffaa00',
                bars: ['#ff1100', '#ff3300', '#ff5500', '#ff7700'],
                bg: 'rgba(30, 10, 5, 0.3)',
                glow: 'rgba(255, 34, 0, 0.4)'
            },
            ocean: {
                primary: '#0088ff',
                secondary: '#00ccff',
                accent: '#00ffff',
                bars: ['#0066ff', '#0088ff', '#00aaff', '#00ccff'],
                bg: 'rgba(5, 15, 30, 0.3)',
                glow: 'rgba(0, 136, 255, 0.4)'
            },
            forest: {
                primary: '#00dd66',
                secondary: '#00ff88',
                accent: '#66ff99',
                bars: ['#00aa44', '#00dd66', '#00ff88', '#55ffaa'],
                bg: 'rgba(5, 20, 10, 0.3)',
                glow: 'rgba(0, 221, 102, 0.4)'
            },
            sunset: {
                primary: '#ff3366',
                secondary: '#ff8833',
                accent: '#ffdd00',
                bars: ['#ff1144', '#ff3366', '#ff8833', '#ffbb00'],
                bg: 'rgba(30, 10, 5, 0.3)',
                glow: 'rgba(255, 51, 102, 0.4)'
            },
            dark: {
                primary: '#666699',
                secondary: '#9999dd',
                accent: '#ccccff',
                bars: ['#444466', '#666699', '#8888cc', '#aaaaddff'],
                bg: 'rgba(15, 15, 25, 0.3)',
                glow: 'rgba(102, 102, 153, 0.3)'
            }
        };

        // Initialization
        this.setupCanvas();
        this.initWebAudio();
        this.attachEventListeners();
        this.animate();
    }

    setupCanvas() {
        const resizeCanvas = () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight - 300; // Account for player height
            
            if (this.isFullscreen) {
                this.canvas.height = window.innerHeight;
            }
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
    }

    initWebAudio() {
        if (!this.audioContext) {
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                this.audioContext = new AudioContext();
                this.analyser = this.audioContext.createAnalyser();
                this.analyser.fftSize = 512;
                this.bufferLength = this.analyser.frequencyBinCount;
                this.dataArray = new Uint8Array(this.bufferLength);

                // Connect audio element to analyser - only if not already connected
                if (!this.audio.captureStream) {
                    try {
                        const source = this.audioContext.createMediaElementAudioSource(this.audio);
                        source.connect(this.analyser);
                        this.analyser.connect(this.audioContext.destination);
                    } catch (e) {
                        // Audio already connected or other error
                    }
                }
                
                this.updateStatus('Audio initialized');
            } catch (e) {
                this.updateStatus('Audio unavailable');
                console.error(e);
            }
        }

        // Resume audio context if suspended
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume().catch(e => console.log('Audio resume:', e));
        }
    }

    attachEventListeners() {
        // File Upload
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // Playback Controls
        this.playBtn.addEventListener('click', () => this.play());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.stopBtn.addEventListener('click', () => this.stop());

        // Volume Control
        this.volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value));

        // Progress Bar
        this.progressSlider.addEventListener('input', (e) => this.seek(e.target.value));

        // Audio Events
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
        this.audio.addEventListener('ended', () => this.stop());

        // Settings
        this.vizModeSelect.addEventListener('change', (e) => this.setVizMode(e.target.value));
        this.colorThemeSelect.addEventListener('change', (e) => this.setColorTheme(e.target.value));
        this.animSpeedSelect.addEventListener('change', (e) => this.setAnimationSpeed(e.target.value));

        // Fullscreen
        this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());

        // Keyboard Shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // Drag and Drop
        this.canvas.addEventListener('dragover', (e) => e.preventDefault());
        this.canvas.addEventListener('drop', (e) => this.handleDrop(e));
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            this.audio.src = url;
            this.fileName.textContent = file.name;
            
            // Try to extract cover art from file metadata
            this.extractCoverArt(file);
            
            this.updateStatus(`Loaded: ${file.name}`);
        }
    }

    extractCoverArt(file) {
        // For now, set a default album art
        // In a real app, you'd parse ID3 tags or use a music API
        const defaultArt = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 200%22%3E%3Crect fill=%22%23222%22 width=%22200%22 height=%22200%22/%3E%3Ccircle cx=%22100%22 cy=%22100%22 r=%2280%22 fill=%22%23333%22/%3E%3Ccircle cx=%22100%22 cy=%22100%22 r=%2260%22 fill=%22%231a1a1a%22/%3E%3Ccircle cx=%22100%22 cy=%22100%22 r=%2210%22 fill=%22%23555%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22 fill=%22%2300d4ff%22 font-size=%2260%22 font-family=%22Arial%22%3E♪%3C/text%3E%3C/svg%3E';
        this.albumArt.src = defaultArt;
    }

    handleDrop(e) {
        e.preventDefault();
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.fileInput.files = files;
            this.handleFileSelect({ target: { files } });
        }
    }

    play() {
        if (this.audio.src) {
            this.initWebAudio();
            // Resume audio context
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume().then(() => {
                    this.audio.play().catch(e => console.error('Play error:', e));
                });
            } else {
                this.audio.play().catch(e => console.error('Play error:', e));
            }
            this.isPlaying = true;
            this.updateStatus('▶ Playing');
        } else {
            this.updateStatus('No file loaded');
        }
    }

    pause() {
        this.audio.pause();
        this.isPlaying = false;
        this.updateStatus('⏸ Paused');
    }

    stop() {
        this.audio.pause();
        this.audio.currentTime = 0;
        this.isPlaying = false;
        this.updateStatus('⏹ Stopped');
    }

    setVolume(value) {
        this.audio.volume = value / 100;
        this.volumeValue.textContent = value + '%';
    }

    seek(value) {
        if (this.audio.duration) {
            this.audio.currentTime = (value / 100) * this.audio.duration;
        }
    }

    updateProgress() {
        if (this.audio.duration) {
            this.progressSlider.value = (this.audio.currentTime / this.audio.duration) * 100;
            this.currentTimeEl.textContent = this.formatTime(this.audio.currentTime);
        }
    }

    updateDuration() {
        this.durationEl.textContent = this.formatTime(this.audio.duration);
    }

    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    setVizMode(mode) {
        this.vizMode = mode;
        this.updateStatus(`Visualization: ${mode}`);
    }

    setColorTheme(theme) {
        this.colorTheme = theme;
        this.app.className = `app theme-${theme}`;
        this.updateStatus(`Theme: ${theme}`);
    }

    setAnimationSpeed(speed) {
        const speedMap = { slow: 0.5, normal: 1, fast: 1.5 };
        this.animationSpeed = speedMap[speed];
    }

    toggleFullscreen() {
        this.isFullscreen = !this.isFullscreen;
        this.app.classList.toggle('fullscreen');
        
        // Resize canvas on fullscreen toggle
        setTimeout(() => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = this.isFullscreen ? window.innerHeight : window.innerHeight - 300;
        }, 100);

        this.updateStatus(this.isFullscreen ? 'Fullscreen On' : 'Fullscreen Off');
    }

    handleKeyboard(e) {
        if (e.code === 'Space') {
            e.preventDefault();
            this.isPlaying ? this.pause() : this.play();
        } else if (e.code === 'ArrowUp') {
            e.preventDefault();
            this.volumeSlider.value = Math.min(100, parseInt(this.volumeSlider.value) + 5);
            this.setVolume(this.volumeSlider.value);
        } else if (e.code === 'ArrowDown') {
            e.preventDefault();
            this.volumeSlider.value = Math.max(0, parseInt(this.volumeSlider.value) - 5);
            this.setVolume(this.volumeSlider.value);
        } else if (e.code === 'ArrowRight') {
            e.preventDefault();
            this.seek(Math.min(100, parseInt(this.progressSlider.value) + 5));
        } else if (e.code === 'ArrowLeft') {
            e.preventDefault();
            this.seek(Math.max(0, parseInt(this.progressSlider.value) - 5));
        } else if (e.code === 'KeyF') {
            e.preventDefault();
            this.toggleFullscreen();
        }
    }

    updateStatus(message) {
        this.statusEl.textContent = message;
    }

    // Visualization Methods
    drawBars() {
        const theme = this.themes[this.colorTheme];
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Clear canvas with gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#0f0f15');
        gradient.addColorStop(1, '#1a1a25');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, width, height);

        if (!this.analyser) return;

        this.analyser.getByteFrequencyData(this.dataArray);

        const barWidth = width / this.bufferLength;
        let x = 0;

        for (let i = 0; i < this.bufferLength; i++) {
            const barHeight = (this.dataArray[i] / 255) * height * 0.8;
            
            this.ctx.fillStyle = theme.bars[i % theme.bars.length];
            this.ctx.shadowColor = theme.bars[i % theme.bars.length];
            this.ctx.shadowBlur = 15;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 0;

            this.ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
            x += barWidth;
        }

        this.ctx.shadowBlur = 0;
    }

    drawWaveform() {
        const theme = this.themes[this.colorTheme];
        const width = this.canvas.width;
        const height = this.canvas.height;

        const gradient = this.ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#0f0f15');
        gradient.addColorStop(1, '#1a1a25');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, width, height);

        if (!this.analyser) return;

        this.analyser.getByteFrequencyData(this.dataArray);

        this.ctx.strokeStyle = theme.primary;
        this.ctx.shadowColor = theme.primary;
        this.ctx.shadowBlur = 20;
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.beginPath();

        const sliceWidth = width / this.bufferLength;
        let x = 0;

        for (let i = 0; i < this.bufferLength; i++) {
            const v = this.dataArray[i] / 128.0;
            const y = (v * height) / 2;

            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
            x += sliceWidth;
        }

        this.ctx.lineTo(width, height / 2);
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
    }

    drawCircular() {
        const theme = this.themes[this.colorTheme];
        const width = this.canvas.width;
        const height = this.canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 3;

        const gradient = this.ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#0f0f15');
        gradient.addColorStop(1, '#1a1a25');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, width, height);

        if (!this.analyser) return;

        this.analyser.getByteFrequencyData(this.dataArray);

        // Draw center glow
        this.ctx.fillStyle = theme.accent;
        this.ctx.shadowColor = theme.accent;
        this.ctx.shadowBlur = 30;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius * 0.25, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw frequency bars in circle
        for (let i = 0; i < this.bufferLength; i++) {
            const angle = (i / this.bufferLength) * Math.PI * 2;
            const value = this.dataArray[i] / 255;
            const barHeight = value * radius * 0.7;
            const distance = radius * 0.5;

            const x1 = centerX + Math.cos(angle) * distance;
            const y1 = centerY + Math.sin(angle) * distance;
            const x2 = centerX + Math.cos(angle) * (distance + barHeight);
            const y2 = centerY + Math.sin(angle) * (distance + barHeight);

            this.ctx.strokeStyle = theme.bars[i % theme.bars.length];
            this.ctx.shadowColor = theme.bars[i % theme.bars.length];
            this.ctx.shadowBlur = 10;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.stroke();
        }

        // Draw outer ring
        this.ctx.strokeStyle = theme.primary;
        this.ctx.globalAlpha = 0.2;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.globalAlpha = 1;
        this.ctx.shadowBlur = 0;
    }

    drawParticles() {
        const theme = this.themes[this.colorTheme];
        const width = this.canvas.width;
        const height = this.canvas.height;

        const gradient = this.ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#0f0f15');
        gradient.addColorStop(1, '#1a1a25');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, width, height);

        if (!this.analyser) return;

        this.analyser.getByteFrequencyData(this.dataArray);

        // Generate particles from frequency data
        if (Math.random() < 0.4) {
            for (let i = 0; i < 8; i++) {
                const freqIndex = Math.floor(Math.random() * this.bufferLength);
                const frequency = this.dataArray[freqIndex] / 255;

                this.particleSystem.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    vx: (Math.random() - 0.5) * 6,
                    vy: (Math.random() - 0.5) * 6,
                    life: 1,
                    size: frequency * 8 + 2,
                    color: theme.bars[freqIndex % theme.bars.length]
                });
            }
        }

        // Update and draw particles
        for (let i = this.particleSystem.length - 1; i >= 0; i--) {
            const p = this.particleSystem[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.008;

            if (p.life <= 0) {
                this.particleSystem.splice(i, 1);
                continue;
            }

            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.life * 0.8;
            this.ctx.shadowColor = p.color;
            this.ctx.shadowBlur = 12;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.globalAlpha = 1;
        this.ctx.shadowBlur = 0;
    }

    animate() {
        if (this.analyser && this.isPlaying) {
            switch (this.vizMode) {
                case 'bars':
                    this.drawBars();
                    break;
                case 'waveform':
                    this.drawWaveform();
                    break;
                case 'circular':
                    this.drawCircular();
                    break;
                case 'particles':
                    this.drawParticles();
                    break;
            }
        } else {
            // Draw idle state
            const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
            gradient.addColorStop(0, '#0f0f15');
            gradient.addColorStop(1, '#1a1a25');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            // Draw idle message
            const theme = this.themes[this.colorTheme];
            this.ctx.fillStyle = theme.primary;
            this.ctx.font = 'bold 36px \"Courier New\", monospace';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.shadowColor = theme.primary;
            this.ctx.shadowBlur = 20;
            this.ctx.fillText('♪ Select Audio ♪', this.canvas.width / 2, this.canvas.height / 2 - 30);
            this.ctx.font = '14px \"Courier New\", monospace';
            this.ctx.fillStyle = theme.accent;
            this.ctx.fillText('or drag a file', this.canvas.width / 2, this.canvas.height / 2 + 20);
            this.ctx.shadowBlur = 0;
        }

        requestAnimationFrame(() => this.animate());
    }
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    new MusicVisualizer();
});
