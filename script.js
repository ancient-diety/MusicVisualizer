class MusicVisualizer {
    constructor() {
        // DOM Elements
        this.canvas = document.getElementById('visualizer');
        this.ctx = this.canvas.getContext('2d');
        this.audio = document.getElementById('audioElement');
        this.fileInput = document.getElementById('fileInput');
        this.fileName = document.getElementById('fileName');
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
        this.source = null;

        // State
        this.isPlaying = false;
        this.vizMode = 'bars';
        this.colorTheme = 'neon';
        this.animationSpeed = 1;
        this.isFullscreen = false;
        this.particleSystem = [];

        // Color Themes
        this.themes = {
            neon: {
                primary: '#16c784',
                secondary: '#ff006e',
                accent: '#00d9ff',
                bars: ['#00d9ff', '#16c784', '#ff006e', '#ffa500'],
                bg: 'rgba(15, 52, 96, 0.1)'
            },
            fire: {
                primary: '#ff4500',
                secondary: '#ff6347',
                accent: '#ffa500',
                bars: ['#ff4500', '#ff6347', '#ff8c00', '#ffa500'],
                bg: 'rgba(255, 69, 0, 0.1)'
            },
            ocean: {
                primary: '#0099ff',
                secondary: '#00d9ff',
                accent: '#00ffff',
                bars: ['#0099ff', '#00d9ff', '#00ffff', '#00eeee'],
                bg: 'rgba(0, 153, 255, 0.1)'
            },
            forest: {
                primary: '#00cc66',
                secondary: '#00ff88',
                accent: '#66ff99',
                bars: ['#00cc66', '#00ff88', '#66ff99', '#88ffaa'],
                bg: 'rgba(0, 204, 102, 0.1)'
            },
            sunset: {
                primary: '#ff6b6b',
                secondary: '#ffa500',
                accent: '#ffff00',
                bars: ['#ff6b6b', '#ffa500', '#ffdd00', '#ffff00'],
                bg: 'rgba(255, 107, 107, 0.1)'
            },
            dark: {
                primary: '#808080',
                secondary: '#b0b0b0',
                accent: '#d0d0d0',
                bars: ['#606060', '#808080', '#a0a0a0', '#c0c0c0'],
                bg: 'rgba(128, 128, 128, 0.1)'
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
                this.analyser.fftSize = 256;
                this.bufferLength = this.analyser.frequencyBinCount;
                this.dataArray = new Uint8Array(this.bufferLength);

                // Connect audio element to analyser
                const source = this.audioContext.createMediaElementAudioSource(this.audio);
                source.connect(this.analyser);
                this.analyser.connect(this.audioContext.destination);
                
                this.updateStatus('Web Audio API initialized');
            } catch (e) {
                this.updateStatus('Error: Web Audio API not supported');
                console.error(e);
            }
        }

        // Resume audio context on user interaction
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
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
            this.updateStatus(`Loaded: ${file.name}`);
        }
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
            this.audio.play();
            this.isPlaying = true;
            this.updateStatus('Playing...');
        }
    }

    pause() {
        this.audio.pause();
        this.isPlaying = false;
        this.updateStatus('Paused');
    }

    stop() {
        this.audio.pause();
        this.audio.currentTime = 0;
        this.isPlaying = false;
        this.updateStatus('Stopped');
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

        this.ctx.fillStyle = theme.bg;
        this.ctx.fillRect(0, 0, width, height);

        this.analyser.getByteFrequencyData(this.dataArray);

        const barWidth = (width / this.bufferLength) * 2.5;
        let x = 0;

        for (let i = 0; i < this.bufferLength; i++) {
            const barHeight = (this.dataArray[i] / 255) * height;
            
            // Color gradient based on frequency
            const hue = (i / this.bufferLength) * 360;
            this.ctx.fillStyle = theme.bars[i % theme.bars.length];
            this.ctx.shadowColor = theme.bars[i % theme.bars.length];
            this.ctx.shadowBlur = 10;

            this.ctx.fillRect(x, height - barHeight, barWidth, barHeight);
            x += barWidth + 1;
        }
    }

    drawWaveform() {
        const theme = this.themes[this.colorTheme];
        const width = this.canvas.width;
        const height = this.canvas.height;

        this.ctx.fillStyle = theme.bg;
        this.ctx.fillRect(0, 0, width, height);

        this.analyser.getByteFrequencyData(this.dataArray);

        this.ctx.strokeStyle = theme.primary;
        this.ctx.shadowColor = theme.primary;
        this.ctx.shadowBlur = 15;
        this.ctx.lineWidth = 3;
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
    }

    drawCircular() {
        const theme = this.themes[this.colorTheme];
        const width = this.canvas.width;
        const height = this.canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 4;

        this.ctx.fillStyle = theme.bg;
        this.ctx.fillRect(0, 0, width, height);

        this.analyser.getByteFrequencyData(this.dataArray);

        // Draw center circle
        this.ctx.fillStyle = theme.accent;
        this.ctx.shadowColor = theme.accent;
        this.ctx.shadowBlur = 20;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius * 0.3, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw frequency rings
        for (let i = 0; i < this.bufferLength; i++) {
            const angle = (i / this.bufferLength) * Math.PI * 2;
            const value = this.dataArray[i] / 255;
            const distance = radius + value * radius;

            const x = centerX + Math.cos(angle) * distance;
            const y = centerY + Math.sin(angle) * distance;

            this.ctx.fillStyle = theme.bars[i % theme.bars.length];
            this.ctx.beginPath();
            this.ctx.arc(x, y, 4, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Draw connecting lines
        this.ctx.strokeStyle = theme.primary;
        this.ctx.globalAlpha = 0.3;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius * 0.8, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.globalAlpha = 1;
    }

    drawParticles() {
        const theme = this.themes[this.colorTheme];
        const width = this.canvas.width;
        const height = this.canvas.height;

        this.ctx.fillStyle = theme.bg;
        this.ctx.fillRect(0, 0, width, height);

        this.analyser.getByteFrequencyData(this.dataArray);

        // Generate particles from frequency data
        if (Math.random() < 0.3) {
            for (let i = 0; i < 5; i++) {
                const freqIndex = Math.floor(Math.random() * this.bufferLength);
                const frequency = this.dataArray[freqIndex] / 255;

                this.particleSystem.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    vx: (Math.random() - 0.5) * 5,
                    vy: (Math.random() - 0.5) * 5,
                    life: 1,
                    size: frequency * 5 + 2,
                    color: theme.bars[freqIndex % theme.bars.length]
                });
            }
        }

        // Update and draw particles
        for (let i = this.particleSystem.length - 1; i >= 0; i--) {
            const p = this.particleSystem[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.01;

            if (p.life <= 0) {
                this.particleSystem.splice(i, 1);
                continue;
            }

            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.life;
            this.ctx.shadowColor = p.color;
            this.ctx.shadowBlur = 10;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.globalAlpha = 1;
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
            const theme = this.themes[this.colorTheme];
            this.ctx.fillStyle = theme.bg;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            // Draw "Ready to play" message
            this.ctx.fillStyle = theme.primary;
            this.ctx.font = '40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('♪ Upload and Play Music ♪', this.canvas.width / 2, this.canvas.height / 2);
        }

        requestAnimationFrame(() => this.animate());
    }
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    new MusicVisualizer();
});
