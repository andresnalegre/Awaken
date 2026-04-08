/* Glitch Effect */
const GlitchText = {
    chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%^&*()",
    isRunning: false,
    animationFrameId: null,
    _resizeHandler: null,

    calculateFontSize() {
        const width = window.innerWidth;
        if (width < 600) {
            return Math.max(24, Math.floor(width / 15));
        }
        return 48;
    },

    init(overlayTextElement) {
        if (this.isRunning) {
            this.stop();
        }

        if (this._resizeHandler) {
            window.removeEventListener('resize', this._resizeHandler);
            this._resizeHandler = null;
        }

        this.isRunning = true;

        const canvas = document.createElement('canvas');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        canvas.style.position = 'absolute';
        canvas.style.top = '50%';
        canvas.style.left = '50%';
        canvas.style.transform = 'translate(-50%, -50%)';
        canvas.style.zIndex = '10';

        overlayTextElement.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        const textX = canvas.width / 2;
        const textY = canvas.height / 2;

        const fontSize = this.calculateFontSize();
        ctx.font = `bold ${fontSize}px 'Courier New'`;
        ctx.fillStyle = "rgba(255, 255, 255, 1)";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const staticText = "FOLLOW THE ";
        const targetText = "WHITE RABBIT";

        const textMetricsStatic = ctx.measureText(staticText);
        const textMetricsTarget = ctx.measureText(targetText);
        const totalTextWidth = ctx.measureText(staticText + targetText).width;

        const boundingBox = {
            x: textX - totalTextWidth / 2 + textMetricsStatic.width,
            y: textY - fontSize / 2,
            width: textMetricsTarget.width,
            height: fontSize
        };

        ctx.shadowColor = '#0F0';
        ctx.shadowBlur = fontSize / 5;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        this.startGlitch(ctx, textX, textY, staticText, targetText, boundingBox, canvas);

        this._resizeHandler = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            const newFontSize = this.calculateFontSize();
            ctx.font = `bold ${newFontSize}px 'Courier New'`;
            ctx.fillStyle = "rgba(255, 255, 255, 1)";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.shadowColor = '#0F0';
            ctx.shadowBlur = newFontSize / 5;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        };

        window.addEventListener('resize', this._resizeHandler);
    },

    startGlitch(ctx, textX, textY, staticText, targetText, boundingBox, canvas) {
        let lastTime = 0;
        const glitchInterval = 200;

        const glitchEffect = (currentTime) => {
            if (currentTime - lastTime > glitchInterval) {
                const glitchedTarget = targetText
                    .split("")
                    .map(char => {
                        if (Math.random() < 0.3) {
                            return this.chars[Math.floor(Math.random() * this.chars.length)];
                        }
                        return char;
                    })
                    .join("");

                ctx.clearRect(0, 0, canvas.width, canvas.height);

                if (Math.random() < 0.05) {
                    ctx.fillStyle = '#0F0';
                    const offset = Math.random() * 5;
                    ctx.fillText(staticText + glitchedTarget, textX + offset, textY);
                    ctx.fillStyle = '#FFF';
                    ctx.fillText(staticText + glitchedTarget, textX - offset, textY);
                } else {
                    ctx.fillStyle = '#FFF';
                    ctx.fillText(staticText + glitchedTarget, textX, textY);
                }

                lastTime = currentTime;
            }

            if (this.isRunning) {
                this.animationFrameId = requestAnimationFrame(glitchEffect);
            }
        };

        this.animationFrameId = requestAnimationFrame(glitchEffect);
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

/* Main Intro & Matrix Flow */
(() => {
    const messages = ["I've been waiting for you...", "let your curiosity guide you..."];
    const typingText = document.getElementById("typingText");

    let matrixAudio = null;
    let canStartAudio = false;

    function initMatrixAudio() {
        if (!matrixAudio) {
            matrixAudio = new Audio('./assets/audio/Clubbed_to_Death.mp3');
            matrixAudio.loop = true;
            matrixAudio.preload = 'auto';
            matrixAudio.volume = 0.3;
        }
    }

    let openingVideoContainer = null;
    let openingVideo = null;
    let openingVideoPlayed = false;

    function createOpeningVideo() {
        openingVideoContainer = document.createElement('div');
        openingVideoContainer.id = 'openingVideoContainer';
        openingVideoContainer.style.position = 'fixed';
        openingVideoContainer.style.top = '0';
        openingVideoContainer.style.left = '0';
        openingVideoContainer.style.width = '100%';
        openingVideoContainer.style.height = '100%';
        openingVideoContainer.style.backgroundColor = '#000';
        openingVideoContainer.style.display = 'flex';
        openingVideoContainer.style.alignItems = 'center';
        openingVideoContainer.style.justifyContent = 'center';
        openingVideoContainer.style.zIndex = '1200';
        openingVideoContainer.style.opacity = '1';
        openingVideoContainer.style.pointerEvents = 'auto';

        openingVideo = document.createElement('video');
        openingVideo.src = './assets/video/Intro.mp4';
        openingVideo.autoplay = false;
        openingVideo.playsInline = true;
        openingVideo.preload = 'auto';
        openingVideo.muted = false;
        openingVideo.volume = 1.0;
        openingVideo.controls = false;

        openingVideo.style.maxWidth = '100%';
        openingVideo.style.maxHeight = '100%';
        openingVideo.style.objectFit = 'cover';

        openingVideoContainer.appendChild(openingVideo);

        openingVideo.load();
    }

    function removeOpeningVideo() {
        if (openingVideoContainer && openingVideoContainer.parentNode) {
            openingVideoContainer.parentNode.removeChild(openingVideoContainer);
        }
    }

    function removeOpeningVideoWithFade() {
        if (!openingVideoContainer) {
            startIntroAfterVideo();
            return;
        }

        openingVideoContainer.style.transition = 'opacity 0.8s';
        openingVideoContainer.style.opacity = '0';

        setTimeout(() => {
            removeOpeningVideo();
            startIntroAfterVideo();
        }, 800);
    }

    function playOpeningVideo() {
        if (openingVideoPlayed) {
            canStartAudio = true;
            initializeAudio();
            startIntroAfterVideo();
            return;
        }

        if (!openingVideoContainer) {
            createOpeningVideo();
        }

        document.body.appendChild(openingVideoContainer);

        const playPromise = openingVideo.play();

        if (playPromise !== undefined) {
            playPromise
                .then(() => {})
                .catch(err => {
                    console.error('Error playing opening video:', err);
                    canStartAudio = true;
                    initializeAudio();
                    removeOpeningVideo();
                    startIntroAfterVideo();
                });
        }

        openingVideo.onended = () => {
            openingVideoPlayed = true;
            canStartAudio = true;
            initializeAudio();
            removeOpeningVideoWithFade();
        };

        openingVideo.onerror = () => {
            console.error('Error loading opening video');
            canStartAudio = true;
            initializeAudio();
            removeOpeningVideo();
            startIntroAfterVideo();
        };
    }

    function startIntroAfterVideo() {
        typingText.style.transition = 'opacity 0.5s';
        typingText.style.opacity = '1';
        startSequence();
    }

    createOpeningVideo();

    const typewriterAudioPool = [];
    const AUDIO_POOL_SIZE = 3;

    for (let i = 0; i < AUDIO_POOL_SIZE; i++) {
        const audio = new Audio('./assets/audio/Type.mp3');
        audio.volume = 0.4;
        typewriterAudioPool.push(audio);
    }

    let audioIndex = 0;
    let charIndex = 0;
    let audioInitialized = false;
    let isMobileDevice = window.innerWidth <= 768;
    let messageSequenceComplete = false;
    let activeTypewriterSounds = [];

    const blackOverlay = document.createElement('div');
    blackOverlay.id = 'blackOverlay';
    blackOverlay.style.position = 'fixed';
    blackOverlay.style.top = '0';
    blackOverlay.style.left = '0';
    blackOverlay.style.width = '100%';
    blackOverlay.style.height = '100%';
    blackOverlay.style.backgroundColor = '#000';
    blackOverlay.style.zIndex = '1000';
    blackOverlay.style.cursor = 'pointer';
    document.body.appendChild(blackOverlay);

    typingText.style.opacity = '0';

    /* Audio init */
    function initializeAudio() {
        if (audioInitialized) return;

        initMatrixAudio();

        const promises = [];

        if (matrixAudio) {
            const prevMuted = matrixAudio.muted;
            matrixAudio.muted = true;

            promises.push(
                matrixAudio.play()
                    .then(() => {
                        matrixAudio.pause();
                        matrixAudio.currentTime = 0;
                        matrixAudio.muted = prevMuted;
                    })
                    .catch(() => {
                        matrixAudio.muted = prevMuted;
                    })
            );
        }

        typewriterAudioPool.forEach(audio => {
            const prevMuted = audio.muted;
            audio.muted = true;

            promises.push(
                audio.play()
                    .then(() => {
                        audio.pause();
                        audio.currentTime = 0;
                        audio.muted = prevMuted;
                    })
                    .catch(() => {
                        audio.muted = prevMuted;
                    })
            );
        });

        Promise.all(promises)
            .then(() => {
                audioInitialized = true;
            })
            .catch(() => {
                audioInitialized = true;
            });
    }

    blackOverlay.addEventListener('click', handleInitialClick);
    blackOverlay.addEventListener('touchstart', handleInitialClick);

    function handleInitialClick() {
        playOpeningVideo();

        blackOverlay.style.transition = 'opacity 0.6s';
        blackOverlay.style.opacity = '0';

        setTimeout(() => {
            if (blackOverlay.parentNode) {
                document.body.removeChild(blackOverlay);
            }
        }, 600);
    }

    /* Message Sequence */
    function startSequence() {
        typeMessage(messages[0], () => {
            document.addEventListener("click", handleFirstClick);
            document.addEventListener("touchstart", handleFirstClick);
            document.addEventListener("keydown", handleFirstKeydown);
        });
    }

    function handleFirstClick() {
        document.removeEventListener("click", handleFirstClick);
        document.removeEventListener("touchstart", handleFirstClick);
        document.removeEventListener("keydown", handleFirstKeydown);

        stopAllTypewriterSounds();

        deleteMessage(() => {
            setTimeout(showSecondMessage, 500);
        });
    }

    function handleFirstKeydown(event) {
        if (event.key === " " || event.key === "Enter") {
            handleFirstClick();
        }
    }

    /* Sound Control */
    function stopAllTypewriterSounds() {
        activeTypewriterSounds.forEach(audio => {
            try {
                audio.pause();
                audio.currentTime = 0;
            } catch {}
        });
        activeTypewriterSounds = [];
    }

    function playTypewriterSound() {
        if (!audioInitialized || !canStartAudio) return null;

        try {
            const audio = typewriterAudioPool[audioIndex];
            audio.currentTime = 0;

            audio.play().catch(() => {});

            activeTypewriterSounds.push(audio);

            setTimeout(() => {
                const idx = activeTypewriterSounds.indexOf(audio);
                if (idx > -1) activeTypewriterSounds.splice(idx, 1);
            }, isMobileDevice ? 200 : 150);

            audioIndex = (audioIndex + 1) % AUDIO_POOL_SIZE;
        } catch {}
    }

    /* Typing & Deleting Text */
    function typeMessage(message, callback) {
        charIndex = 0;
        stopAllTypewriterSounds();

        function type() {
            if (charIndex < message.length) {
                playTypewriterSound();
                typingText.textContent = message.slice(0, charIndex + 1);
                charIndex++;

                const randomDelay = isMobileDevice
                    ? Math.floor(Math.random() * 180) + 70
                    : Math.floor(Math.random() * 150) + 50;

                setTimeout(type, randomDelay);
            } else if (callback) {
                stopAllTypewriterSounds();
                setTimeout(callback, 500);
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

                const randomDelay = isMobileDevice
                    ? Math.floor(Math.random() * 70) + 40
                    : Math.floor(Math.random() * 50) + 30;

                setTimeout(erase, randomDelay);
            } else if (callback) callback();
        }

        erase();
    }

    function showSecondMessage() {
        typeMessage(messages[1], () => {
            typingText.classList.add("blink");
            messageSequenceComplete = true;
            setTimeout(startMatrixExperience, 1000);
        });
    }

    /* Matrix Canvas */
    function startMatrixExperience() {
        const matrixContainer = document.getElementById("matrixContainer");
        const overlayText = document.getElementById("overlayText");

        typingText.classList.add("hidden");
        matrixContainer.classList.remove("hidden");
        overlayText.classList.remove("hidden");

        const matrix = new MatrixRain('matrixContainer');

        setTimeout(() => {
            if (typeof GlitchText !== "undefined") {
                GlitchText.init(overlayText);
            }
        }, 100);

        if (audioInitialized && messageSequenceComplete && matrixAudio && canStartAudio) {
            matrixAudio.play().catch(() => {});
        }

        setTimeout(() => {
            const infoContainer = document.getElementById("infoContainer");
            infoContainer.classList.remove("hidden");
            infoContainer.style.opacity = "0";
            requestAnimationFrame(() => {
                infoContainer.style.transition = "opacity 1s ease-in-out";
                infoContainer.style.opacity = "1";
            });
        }, 2000);
    }

    /* Matrix Rain */
    class MatrixRain {
        constructor(containerId, fontSize = 16) {
            this.container = document.getElementById(containerId);
            this.fontSize = fontSize;
            this.characters =
                "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789@#$%^&*";
            this.columns = [];
            this.drops = [];
            this.animationFrameId = null;
            this._resizeHandler = null;

            this.container.style.overflow = "hidden";
            this.container.style.position = "fixed";
            this.container.style.top = "0";
            this.container.style.left = "0";
            this.container.style.width = "100%";
            this.container.style.height = "100%";

            this.init();
            this.animate();
        }

        init() {
            this.canvas = document.createElement("canvas");
            this.ctx = this.canvas.getContext("2d");
            this.container.appendChild(this.canvas);

            this.canvas.style.pointerEvents = "none";
            this.canvas.style.position = "fixed";
            this.canvas.style.top = "0";
            this.canvas.style.left = "0";
            this.canvas.style.zIndex = "1";
            this.canvas.style.width = "100%";
            this.canvas.style.height = "100%";

            this.resize();

            this._resizeHandler = () => this.resize();
            window.addEventListener("resize", this._resizeHandler);

            this.initDrops();
        }

        resize() {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;

            if (window.innerWidth <= 480) {
                this.fontSize = 12;
            } else if (window.innerWidth <= 768) {
                this.fontSize = 14;
            } else {
                this.fontSize = 16;
            }

            this.columns = Math.ceil(this.canvas.width / this.fontSize) + 1;
            this.ctx.font = `${this.fontSize}px monospace`;

            isMobileDevice = window.innerWidth <= 768;

            this.initDrops();
        }

        initDrops() {
            this.drops = [];
            for (let i = 0; i < this.columns; i++) {
                this.drops[i] = Math.floor(Math.random() * -100);
            }
        }

        animate() {
            this.ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            this.ctx.fillStyle = "#0F0";

            for (let i = 0; i < this.drops.length; i++) {
                const char =
                    this.characters[Math.floor(Math.random() * this.characters.length)];
                const x = i * this.fontSize - 1;
                const y = this.drops[i] * this.fontSize;

                this.ctx.fillText(char, x, y);

                if (y > this.canvas.height && Math.random() > 0.975) {
                    this.drops[i] = 0;
                }

                this.drops[i] += 0.7;
            }

            this.animationFrameId = setTimeout(() => {
                requestAnimationFrame(() => this.animate());
            }, 33);
        }

        destroy() {
            if (this.animationFrameId) {
                clearTimeout(this.animationFrameId);
                this.animationFrameId = null;
            }
            if (this._resizeHandler) {
                window.removeEventListener("resize", this._resizeHandler);
                this._resizeHandler = null;
            }
            if (this.canvas && this.canvas.parentNode) {
                this.canvas.parentNode.removeChild(this.canvas);
            }
        }
    }

    window.addEventListener("resize", () => {
        if (GlitchText.isRunning) {
            const overlayText = document.getElementById("overlayText");
            while (overlayText.firstChild) overlayText.removeChild(overlayText.firstChild);
            GlitchText.init(overlayText);
        }
    });

    document.addEventListener("visibilitychange", () => {
        if (document.hidden) stopAllTypewriterSounds();
    });

    window.addEventListener("orientationchange", () => {
        setTimeout(() => {
            isMobileDevice = window.innerWidth <= 768;
        }, 200);
    });

})();