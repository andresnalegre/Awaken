/* GlitchText — "FOLLOW THE / WHITE RABBIT" overlay */
const GlitchText = {
    isRunning: false,
    animationFrameId: null,
    _resizeHandler: null,

    calculateFontSize() {
        const w = window.innerWidth;
        if (w < 400) return Math.max(20, Math.floor(w / 16));
        if (w < 600) return Math.max(24, Math.floor(w / 15));
        return 48;
    },

    init(overlayTextElement) {
        if (this.isRunning) this.stop();

        this.isRunning = true;
        overlayTextElement.innerHTML = '';

        const canvas = document.createElement('canvas');
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
        canvas.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:10;pointer-events:none;';
        overlayTextElement.appendChild(canvas);

        const ctx = this._configureCtx(canvas.getContext('2d'), this.calculateFontSize());

        const rabbitLink = this._createRabbitLink(this.calculateFontSize());
        overlayTextElement.appendChild(rabbitLink);

        this._startGlitch(ctx, canvas, 'FOLLOW THE');

        this._resizeHandler = () => {
            canvas.width  = window.innerWidth;
            canvas.height = window.innerHeight;
            const fs = this.calculateFontSize();
            this._configureCtx(ctx, fs);
            rabbitLink.style.fontSize  = `${fs}px`;
            rabbitLink.style.transform = `translateX(-50%) translateY(${Math.round(fs * 0.5)}px)`;
            rabbitLink.style.textShadow = this._dimShadow(fs);
        };
        window.addEventListener('resize', this._resizeHandler);
    },

    _configureCtx(ctx, fontSize) {
        ctx.font         = `bold ${fontSize}px 'Courier New', monospace`;
        ctx.fillStyle    = '#fff';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor  = '#0F0';
        ctx.shadowBlur   = fontSize / 5;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        return ctx;
    },

    _dimShadow(fs)    { return `0 0 ${Math.round(fs/5)}px #0F0, 0 0 ${Math.round(fs/3)}px #0F0`; },
    _brightShadow(fs) { return `0 0 ${Math.round(fs/3)}px #fff, 0 0 ${Math.round(fs/2)}px #0F0, 0 0 ${fs}px #0F0`; },

    _createRabbitLink(fontSize) {
        const a = document.createElement('a');
        a.href   = 'https://whiterabbitclub.ie/';
        a.target = '_blank';
        a.rel    = 'noopener noreferrer';
        a.textContent = 'WHITE RABBIT';
        a.style.cssText = `
            position:absolute;left:50%;top:50%;
            transform:translateX(-50%) translateY(${Math.round(fontSize * 0.5)}px);
            font-family:'Courier New',monospace;
            font-size:${fontSize}px;font-weight:bold;
            color:#fff;text-decoration:none;cursor:pointer;
            z-index:15;letter-spacing:2px;white-space:nowrap;
            display:block;text-align:center;
            text-shadow:${this._dimShadow(fontSize)};
            transition:text-shadow 0.2s ease,color 0.2s ease;
        `;
        a.addEventListener('mouseenter', () => {
            a.style.textShadow = this._brightShadow(this.calculateFontSize());
            a.style.color = '#0F0';
        });
        a.addEventListener('mouseleave', () => {
            a.style.textShadow = this._dimShadow(this.calculateFontSize());
            a.style.color = '#fff';
        });
        return a;
    },

    _startGlitch(ctx, canvas, staticText) {
        let lastTime = 0;
        const interval = 200;

        const tick = (now) => {
            if (!this.isRunning) return;

            if (now - lastTime > interval) {
                const fs  = this.calculateFontSize();
                const x   = canvas.width  / 2;
                const y   = canvas.height / 2 - Math.round(fs * 0.7);

                ctx.clearRect(0, 0, canvas.width, canvas.height);

                if (Math.random() < 0.05) {
                    const offset = Math.random() * 5;
                    ctx.fillStyle = '#0F0';
                    ctx.fillText(staticText, x + offset, y);
                    ctx.fillStyle = '#fff';
                    ctx.fillText(staticText, x - offset, y);
                } else {
                    ctx.fillStyle = '#fff';
                    ctx.fillText(staticText, x, y);
                }

                lastTime = now;
            }

            this.animationFrameId = requestAnimationFrame(tick);
        };

        this.animationFrameId = requestAnimationFrame(tick);
    },

    stop() {
        this.isRunning = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        if (this._resizeHandler) {
            window.removeEventListener('resize', this._resizeHandler);
            this._resizeHandler = null;
        }
    }
};

/* Main experience */
(() => {
    const MESSAGES = [
        "I've been waiting for you...",
        "Let your curiosity guide you..."
    ];

    const typingText = document.getElementById('typingText');

    let matrixAudio        = null;
    let canStartAudio      = false;
    let audioInitialized   = false;
    let isMobileDevice     = window.innerWidth <= 768;
    let messageSequenceDone = false;
    let charIndex          = 0;
    let activeTypewriterSounds = [];

    /* Audio pool */
    const POOL_SIZE = 3;
    let audioPoolIndex = 0;
    const typewriterPool = Array.from({ length: POOL_SIZE }, () => {
        const a = new Audio('./assets/audio/Type.mp3');
        a.volume = 0.4;
        return a;
    });

    function initMatrixAudio() {
        if (matrixAudio) return;
        matrixAudio = new Audio('./assets/audio/Clubbed_to_Death.mp3');
        matrixAudio.loop    = true;
        matrixAudio.preload = 'auto';
        matrixAudio.volume  = 0.3;
    }

    /* Audio unlock — must be triggered inside a user gesture */
    function initializeAudio() {
        if (audioInitialized) return;

        initMatrixAudio();

        const unlock = (audio) => {
            const prev = audio.muted;
            audio.muted = true;
            return audio.play()
                .then(() => { audio.pause(); audio.currentTime = 0; audio.muted = prev; })
                .catch(() => { audio.muted = prev; });
        };

        const all = [matrixAudio, ...typewriterPool].map(unlock);

        Promise.allSettled(all).then(() => { audioInitialized = true; });
    }

    /* Opening video */
    let videoContainer = null;
    let videoEl        = null;
    let videoPlayed    = false;

    function createOpeningVideo() {
        videoContainer = document.createElement('div');
        videoContainer.id = 'openingVideoContainer';
        Object.assign(videoContainer.style, {
            position: 'fixed', top: '0', left: '0',
            width: '100%', height: '100%',
            backgroundColor: '#000', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            zIndex: '1200', opacity: '1', pointerEvents: 'auto'
        });

        videoEl = document.createElement('video');
        videoEl.src        = './assets/video/Intro.mp4';
        videoEl.autoplay   = false;
        videoEl.playsInline = true;
        videoEl.preload    = 'auto';
        videoEl.muted      = false;
        videoEl.volume     = 1.0;
        videoEl.controls   = false;
        Object.assign(videoEl.style, {
            maxWidth: '100%', maxHeight: '100%', objectFit: 'cover'
        });

        videoContainer.appendChild(videoEl);
        videoEl.load();
    }

    function removeVideo() {
        if (videoContainer && videoContainer.parentNode) {
            videoContainer.parentNode.removeChild(videoContainer);
        }
    }

    function removeVideoWithFade(cb) {
        if (!videoContainer) { cb(); return; }
        videoContainer.style.transition = 'opacity 0.8s';
        videoContainer.style.opacity = '0';
        setTimeout(() => { removeVideo(); cb(); }, 800);
    }

    function playOpeningVideo() {
        if (videoPlayed) {
            canStartAudio = true;
            initializeAudio();
            startIntroAfterVideo();
            return;
        }

        if (!videoContainer) createOpeningVideo();
        document.body.appendChild(videoContainer);

        videoEl.play().catch(() => {
            canStartAudio = true;
            initializeAudio();
            removeVideo();
            startIntroAfterVideo();
        });

        videoEl.onended = () => {
            videoPlayed    = true;
            canStartAudio  = true;
            initializeAudio();
            removeVideoWithFade(startIntroAfterVideo);
        };

        videoEl.onerror = () => {
            canStartAudio = true;
            initializeAudio();
            removeVideo();
            startIntroAfterVideo();
        };
    }

    function startIntroAfterVideo() {
        typingText.style.transition = 'opacity 0.5s';
        typingText.style.opacity    = '1';
        startSequence();
    }

    /* Black "Start" overlay */
    const blackOverlay = document.createElement('div');
    blackOverlay.id = 'blackOverlay';
    Object.assign(blackOverlay.style, {
        position: 'fixed', top: '0', left: '0',
        width: '100%', height: '100%',
        backgroundColor: '#000', zIndex: '1000', cursor: 'pointer'
    });
    document.body.appendChild(blackOverlay);
    typingText.style.opacity = '0';

    createOpeningVideo();

    function handleInitialInteraction() {
        blackOverlay.removeEventListener('click',      handleInitialInteraction);
        blackOverlay.removeEventListener('touchstart', handleInitialInteraction);

        playOpeningVideo();

        blackOverlay.style.transition = 'opacity 0.6s';
        blackOverlay.style.opacity    = '0';
        setTimeout(() => { if (blackOverlay.parentNode) blackOverlay.parentNode.removeChild(blackOverlay); }, 600);
    }

    blackOverlay.addEventListener('click',      handleInitialInteraction);
    blackOverlay.addEventListener('touchstart', handleInitialInteraction, { passive: true });

    /* Sound helpers */
    function stopAllTypewriterSounds() {
        activeTypewriterSounds.forEach(a => { try { a.pause(); a.currentTime = 0; } catch (_) {} });
        activeTypewriterSounds = [];
    }

    function playTypewriterSound() {
        if (!audioInitialized || !canStartAudio) return;
        try {
            const a = typewriterPool[audioPoolIndex];
            a.currentTime = 0;
            a.play().catch(() => {});
            activeTypewriterSounds.push(a);
            setTimeout(() => {
                const i = activeTypewriterSounds.indexOf(a);
                if (i > -1) activeTypewriterSounds.splice(i, 1);
            }, isMobileDevice ? 200 : 150);
            audioPoolIndex = (audioPoolIndex + 1) % POOL_SIZE;
        } catch (_) {}
    }

    /* Typing animation */
    function typeMessage(message, callback) {
        charIndex = 0;
        stopAllTypewriterSounds();

        function type() {
            if (charIndex < message.length) {
                playTypewriterSound();
                typingText.textContent = message.slice(0, charIndex + 1);
                charIndex++;
                const delay = isMobileDevice
                    ? Math.floor(Math.random() * 180) + 70
                    : Math.floor(Math.random() * 150) + 50;
                setTimeout(type, delay);
            } else {
                stopAllTypewriterSounds();
                if (callback) setTimeout(callback, 500);
            }
        }

        type();
    }

    function deleteMessage(callback) {
        stopAllTypewriterSounds();

        function erase() {
            if (charIndex > 0) {
                typingText.textContent = typingText.textContent.slice(0, charIndex - 1);
                charIndex--;
                const delay = isMobileDevice
                    ? Math.floor(Math.random() * 70) + 40
                    : Math.floor(Math.random() * 50) + 30;
                setTimeout(erase, delay);
            } else if (callback) {
                callback();
            }
        }

        erase();
    }

    /* Message sequence */
    function startSequence() {
        typeMessage(MESSAGES[0], () => {
            document.addEventListener('click',      handleFirstInteraction);
            document.addEventListener('touchstart', handleFirstInteraction, { passive: true });
            document.addEventListener('keydown',    handleFirstKeydown);
        });
    }

    function handleFirstInteraction() {
        document.removeEventListener('click',      handleFirstInteraction);
        document.removeEventListener('touchstart', handleFirstInteraction);
        document.removeEventListener('keydown',    handleFirstKeydown);
        stopAllTypewriterSounds();
        deleteMessage(() => setTimeout(showSecondMessage, 500));
    }

    function handleFirstKeydown(e) {
        if (e.key === ' ' || e.key === 'Enter') handleFirstInteraction();
    }

    function showSecondMessage() {
        typeMessage(MESSAGES[1], () => {
            messageSequenceDone = true;
            setTimeout(startMatrixExperience, 1000);
        });
    }

    /* Matrix rain + glitch */
    function startMatrixExperience() {
        const matrixContainer = document.getElementById('matrixContainer');
        const overlayText     = document.getElementById('overlayText');

        typingText.classList.add('hidden');
        matrixContainer.classList.remove('hidden');
        overlayText.classList.remove('hidden');

        new MatrixRain('matrixContainer');

        setTimeout(() => GlitchText.init(overlayText), 100);

        if (audioInitialized && messageSequenceDone && matrixAudio && canStartAudio) {
            matrixAudio.play().catch(() => {});
        }

        /* Portal CTA — shown after a short delay so rain is visible first */
        setTimeout(showPortal, 4000);
    }

    /* Portal CTA */
    function showPortal() {
        const portal = document.createElement('div');
        portal.id = 'portal';
        portal.innerHTML = `
            <div class="portal-inner">
                <div class="portal-ring portal-ring--1"></div>
                <div class="portal-ring portal-ring--2"></div>
                <div class="portal-ring portal-ring--3"></div>
                <a href="https://whiterabbitclub.ie/" target="_blank" rel="noopener noreferrer" class="portal-btn" id="portalBtn">
                    <span class="portal-btn__label">ENTER THE RABBIT HOLE</span>
                    <span class="portal-btn__sub">whiterabbitclub.ie</span>
                </a>
            </div>
        `;
        document.body.appendChild(portal);

        requestAnimationFrame(() => {
            requestAnimationFrame(() => { portal.classList.add('portal--visible'); });
        });
    }

    /* Matrix rain */
    class MatrixRain {
        constructor(containerId) {
            this.container  = document.getElementById(containerId);
            this.fontSize   = 16;
            this.characters = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789@#$%^&*';
            this.columns    = 0;
            this.drops      = [];
            this.rafId      = null;
            this._resizeHandler = null;

            Object.assign(this.container.style, {
                overflow: 'hidden', position: 'fixed',
                top: '0', left: '0', width: '100%', height: '100%'
            });

            this._init();
            this._animate();
        }

        _init() {
            this.canvas = document.createElement('canvas');
            this.ctx    = this.canvas.getContext('2d');
            Object.assign(this.canvas.style, {
                pointerEvents: 'none', position: 'fixed',
                top: '0', left: '0', zIndex: '1', width: '100%', height: '100%'
            });
            this.container.appendChild(this.canvas);

            this._resize();
            this._resizeHandler = () => this._resize();
            window.addEventListener('resize', this._resizeHandler);
        }

        _resize() {
            this.canvas.width  = window.innerWidth;
            this.canvas.height = window.innerHeight;

            this.fontSize = window.innerWidth <= 480 ? 12
                          : window.innerWidth <= 768 ? 14
                          : 16;

            this.ctx.font = `${this.fontSize}px monospace`;

            const newColumns = Math.ceil(this.canvas.width / this.fontSize) + 1;
            if (newColumns !== this.columns) {
                this.columns = newColumns;
                this.drops   = Array.from({ length: this.columns }, () => Math.floor(Math.random() * -100));
            }
        }

        _animate() {
            this.ctx.fillStyle = 'rgba(0,0,0,0.05)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#0F0';
            this.ctx.font      = `${this.fontSize}px monospace`;

            for (let i = 0; i < this.drops.length; i++) {
                const char = this.characters[Math.floor(Math.random() * this.characters.length)];
                const x    = i * this.fontSize - 1;
                const y    = this.drops[i] * this.fontSize;

                this.ctx.fillText(char, x, y);

                if (y > this.canvas.height && Math.random() > 0.975) this.drops[i] = 0;
                this.drops[i] += 0.7;
            }

            this.rafId = requestAnimationFrame(() => this._animate());
        }

        destroy() {
            if (this.rafId) { cancelAnimationFrame(this.rafId); this.rafId = null; }
            if (this._resizeHandler) { window.removeEventListener('resize', this._resizeHandler); this._resizeHandler = null; }
            if (this.canvas && this.canvas.parentNode) this.canvas.parentNode.removeChild(this.canvas);
        }
    }

    /* Misc listeners */
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) stopAllTypewriterSounds();
    });

    window.addEventListener('orientationchange', () => {
        setTimeout(() => { isMobileDevice = window.innerWidth <= 768; }, 300);
    });

})();