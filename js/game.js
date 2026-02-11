import { Skier } from './skier.js?v=12';
import { Terrain } from './terrain.js?v=12';
import { TrickSystem } from './tricks.js?v=12';
import { Renderer } from './renderer.js?v=12';

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Game state
        this.isRunning = false;
        this.isPaused = false;
        this.gameOver = false;
        this.score = 0;
        this.distance = 0;
        this.difficulty = 1;
        this.gameMode = 'adventure'; // 'zen' or 'adventure'
        
        // Rider customization
        this.riderColor = '#FF6B35';
        this.scarfColor = '#F7931E';
        
        // Game objects
        const groundLevel = this.canvas.height * 0.75;
        this.skier = new Skier(this.canvas.width * 0.2, groundLevel);
        this.terrain = new Terrain(this.canvas.width, this.canvas.height);
        this.terrain.setGameMode(this.gameMode);
        this.trickSystem = new TrickSystem(this.skier);
        this.renderer = new Renderer(this.ctx, this.canvas.width, this.canvas.height);
        
        // Input handling
        this.keys = {};
        this.setupInput();
        
        // UI element references
        this.distanceDisplay = document.getElementById('distanceDisplay');
        this.speedDisplay = document.getElementById('speedDisplay');
        this.comboDisplay = document.getElementById('comboDisplay');
        this.scoreDisplay = document.getElementById('scoreDisplay');
        this.comboRing = document.getElementById('comboRing');
        this.timeIcon = document.getElementById('timeIcon');
        this.timeDisplay = document.getElementById('timeDisplay');
        this.zenModeIndicator = document.getElementById('zenModeIndicator');
        
        // Tutorial system
        this.tutorialStep = 0;
        this.tutorialShown = {
            jump: false,
            trick: false,
            ramp: false
        };
        this.tutorialTimer = 0;
        
        // Performance tracking
        this.lastTime = 0;
        this.fps = 60;
        
        // Combo display
        this.comboOverlay = document.getElementById('comboOverlay');
        this.comboText = document.getElementById('comboText');
        this.comboDisplayTimer = 0;
        
        // Setup UI
        this.setupStartScreen();
        this.setupPauseMenu();
        this.setupGameOverScreen();
        
        // Zen messages
        this.zenMessages = [
            "Breathe in...", "Flow like water", "Find your rhythm", 
            "The mountain calls", "Peace in motion", "Embrace the silence",
            "Ride the wind", "Infinite descent", "One with the snow"
        ];
        this.currentZenMessage = '';
        this.zenMessageTimer = 0;
    }
    
    setupStartScreen() {
        const startBtn = document.getElementById('startBtn');
        const startOverlay = document.getElementById('startOverlay');
        const zenModeBtn = document.getElementById('zenModeBtn');
        const adventureModeBtn = document.getElementById('adventureModeBtn');
        const riderSelects = document.querySelectorAll('.rider-select');
        
        // Game mode selection
        zenModeBtn?.addEventListener('click', () => {
            this.gameMode = 'zen';
            zenModeBtn.classList.add('border-aurora-teal');
            zenModeBtn.classList.remove('border-transparent');
            adventureModeBtn?.classList.remove('border-sunset-orange');
            adventureModeBtn?.classList.add('border-transparent');
        });
        
        adventureModeBtn?.addEventListener('click', () => {
            this.gameMode = 'adventure';
            adventureModeBtn.classList.add('border-sunset-orange');
            adventureModeBtn.classList.remove('border-transparent');
            zenModeBtn?.classList.remove('border-aurora-teal');
            zenModeBtn?.classList.add('border-transparent');
        });
        
        // Rider color selection
        riderSelects.forEach(btn => {
            btn.addEventListener('click', () => {
                riderSelects.forEach(b => {
                    b.classList.remove('border-white', 'border-4', 'scale-110', 'shadow-lg');
                    b.classList.add('border-transparent', 'border-2');
                });
                btn.classList.remove('border-transparent', 'border-2');
                btn.classList.add('border-white', 'border-4', 'scale-110', 'shadow-lg');
                
                this.riderColor = btn.dataset.color;
                this.scarfColor = btn.dataset.scarf;
            });
        });
        
        // Start game
        startBtn?.addEventListener('click', () => {
            this.renderer.setRiderColors(this.riderColor, this.scarfColor);
            this.terrain.setGameMode(this.gameMode);
            
            // Show/hide zen mode indicator in header
            if (this.zenModeIndicator) {
                if (this.gameMode === 'zen') {
                    this.zenModeIndicator.classList.remove('hidden');
                } else {
                    this.zenModeIndicator.classList.add('hidden');
                }
            }
            
            startOverlay.style.transition = 'opacity 0.5s';
            startOverlay.style.opacity = '0';
            setTimeout(() => {
                startOverlay.classList.add('hidden');
                this.start();
            }, 500);
        });
        
        // Select adventure mode by default
        adventureModeBtn?.click();
    }
    
    setupPauseMenu() {
        const pauseOverlay = document.getElementById('pauseOverlay');
        const resumeBtn = document.getElementById('resumeBtn');
        const restartBtn = document.getElementById('restartBtnPause');
        const quitBtn = document.getElementById('quitBtn');
        
        // Pause with P key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'p' || e.key === 'P') {
                this.togglePause();
            }
            if (e.key === 'Escape' && this.isRunning) {
                this.togglePause();
            }
        });
        
        resumeBtn?.addEventListener('click', () => {
            this.togglePause();
        });
        
        restartBtn?.addEventListener('click', () => {
            pauseOverlay.classList.add('hidden');
            this.reset();
        });
        
        quitBtn?.addEventListener('click', () => {
            location.reload();
        });
    }
    
    setupGameOverScreen() {
        const playAgainBtn = document.getElementById('playAgainBtn');
        const menuBtn = document.getElementById('menuBtn');
        
        playAgainBtn?.addEventListener('click', () => {
            document.getElementById('gameOverOverlay').classList.add('hidden');
            this.reset();
        });
        
        menuBtn?.addEventListener('click', () => {
            location.reload();
        });
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        if (this.renderer) {
            this.renderer.resize(this.canvas.width, this.canvas.height);
        }
        if (this.terrain) {
            this.terrain.resize(this.canvas.width, this.canvas.height);
        }
    }
    
    setupInput() {
        this.pendingFlip = false;
        
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            
            // Handle trick inputs when airborne
            if (this.skier.isAirborne && !this.gameOver) {
                this.trickSystem.handleInput(e.key);
                
                // Mark trick tutorial as shown
                if (!this.tutorialShown.trick && ['1', '2', '3', '4'].includes(e.key)) {
                    this.tutorialShown.trick = true;
                    this.hideHint('hintTrick');
                }
            } else if ((e.key === ' ' || e.key === 'ArrowUp') && !this.skier.isAirborne) {
                this.pendingFlip = true;
                
                // Mark jump tutorial as shown
                if (!this.tutorialShown.jump) {
                    this.tutorialShown.jump = true;
                    this.hideHint('hintJump');
                }
            }
            
            // Prevent default for game keys
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', ' ', '1', '2', '3', '4'].includes(e.key)) {
                e.preventDefault();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
            if (e.key === ' ') {
                this.pendingFlip = false;
            }
        });
    }
    
    togglePause() {
        if (this.gameOver) return;
        this.isPaused = !this.isPaused;
        
        const pauseOverlay = document.getElementById('pauseOverlay');
        if (this.isPaused) {
            pauseOverlay.classList.remove('hidden');
        } else {
            pauseOverlay.classList.add('hidden');
        }
    }
    
    showHint(hintId) {
        const hint = document.getElementById(hintId);
        if (hint && !this.tutorialShown[hintId.replace('hint', '').toLowerCase()]) {
            hint.style.opacity = '1';
        }
    }
    
    hideHint(hintId) {
        const hint = document.getElementById(hintId);
        if (hint) {
            hint.style.opacity = '0';
        }
    }
    
    start() {
        this.isRunning = true;
        this.lastTime = performance.now();
        
        // Show initial tutorial hints
        setTimeout(() => this.showHint('hintJump'), 1000);
        setTimeout(() => {
            if (!this.tutorialShown.jump) {
                this.hideHint('hintJump');
                this.showHint('hintTrick');
            }
        }, 6000);
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    reset() {
        this.gameOver = false;
        this.isPaused = false;
        this.score = 0;
        this.distance = 0;
        this.difficulty = 1;
        this.tutorialStep = 0;
        
        const groundLevel = this.canvas.height * 0.75;
        this.skier = new Skier(this.canvas.width * 0.2, groundLevel);
        this.terrain = new Terrain(this.canvas.width, this.canvas.height);
        this.terrain.setGameMode(this.gameMode);
        this.trickSystem = new TrickSystem(this.skier);
        
        this.renderer.setRiderColors(this.riderColor, this.scarfColor);
        
        // Reset tutorials
        this.tutorialShown = { jump: false, trick: false, ramp: false };
        
        this.start();
    }
    
    gameLoop(currentTime) {
        if (!this.isRunning) return;
        
        const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
        this.lastTime = currentTime;
        
        if (!this.isPaused && !this.gameOver) {
            this.update(deltaTime);
        }
        
        this.render();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update(deltaTime) {
        // Update difficulty
        this.difficulty = 1 + (this.distance / 10000);
        
        // Handle input
        const input = {
            left: false,
            right: false,
            jump: this.keys[' '] || this.keys['ArrowUp'] || false
        };
        
        // Update skier
        this.skier.update(deltaTime, input);
        
        // Check pending flip
        if (this.pendingFlip && this.skier.isAirborne && this.skier.airTime >= this.trickSystem.minAirTimeForTrick) {
            this.trickSystem.handleInput(' ');
            this.pendingFlip = false;
        }
        
        // Update terrain
        this.terrain.update(deltaTime, this.skier.velocity.y, this.difficulty);
        
        // Check collisions
        const collision = this.terrain.checkCollision(this.skier, this.skier.isAirborne);
        if (collision) {
            this.handleCollision(collision);
        }
        
        // Check for upcoming ramp (tutorial)
        if (!this.tutorialShown.ramp) {
            const ramps = this.terrain.getRamps();
            const upcomingRamp = ramps.find(r => r.x > this.skier.x && r.x < this.skier.x + 300);
            if (upcomingRamp) {
                this.showHint('hintRamp');
            }
        }
        
        // Update trick system
        const trickScore = this.trickSystem.update(deltaTime);
        if (trickScore > 0) {
            this.score += trickScore;
        }
        
        // Update distance
        this.distance += Math.abs(this.skier.velocity.y) * deltaTime * 2;
        
        // Update renderer (parallax, particles, time of day)
        this.renderer.update(deltaTime, this.skier.velocity.y);
        
        // Update combo display timer
        if (this.comboDisplayTimer > 0) {
            this.comboDisplayTimer -= deltaTime;
            if (this.comboDisplayTimer <= 0) {
                this.comboOverlay.style.opacity = '0';
            }
        }
        
        // Zen mode messages
        if (this.gameMode === 'zen') {
            this.zenMessageTimer -= deltaTime;
            if (this.zenMessageTimer <= 0) {
                this.currentZenMessage = this.zenMessages[Math.floor(Math.random() * this.zenMessages.length)];
                this.zenMessageTimer = 8;
            }
        }
        
        // Update UI
        this.updateUI();
    }
    
    handleCollision(collision) {
        if (collision.type === 'ground') {
            const wasFlipping = this.skier.isFlipping;
            const flipProgress = this.skier.flipProgress;
            const incompletedFlip = wasFlipping && flipProgress < 0.5;
            
            this.skier.land(collision.y, collision.angle);
            
            if (incompletedFlip && this.gameMode === 'adventure') {
                this.crash();
            } else {
                const landingScore = this.trickSystem.land();
                if (landingScore > 0) {
                    this.score += landingScore;
                    this.showTrickNotification(landingScore);
                }
            }
        } else if (collision.type === 'ramp') {
            this.skier.hitRamp(collision.angle, collision.boost);
            this.skier.landingInvincibility = 1.0;
            
            // Mark ramp tutorial as shown
            if (!this.tutorialShown.ramp) {
                this.tutorialShown.ramp = true;
                this.hideHint('hintRamp');
            }
        } else if (collision.type === 'obstacle') {
            if (this.skier.landingInvincibility <= 0 && this.gameMode === 'adventure') {
                this.crash();
            }
        } else if (collision.type === 'rail') {
            this.skier.grindRail(collision);
            if (this.gameMode === 'adventure') {
                this.score += 10;
            }
        }
    }
    
    crash() {
        this.gameOver = true;
        this.showGameOver();
    }
    
    showGameOver() {
        const compliments = [
            "Beautiful Run!", "Flow State Achieved!", "Mountain Master!",
            "Epic Descent!", "Pure Poetry!", "Legendary!",
            "The Mountain Whispers Your Name!", "Infinite Style!"
        ];
        
        const randomCompliment = compliments[Math.floor(Math.random() * compliments.length)];
        
        document.getElementById('endMessage').textContent = randomCompliment;
        document.getElementById('endDistance').textContent = Math.round(this.distance).toLocaleString() + 'm';
        document.getElementById('endScore').textContent = Math.round(this.score).toLocaleString();
        document.getElementById('endCombo').textContent = 'x' + this.trickSystem.maxCombo.toFixed(1);
        document.getElementById('endTricks').textContent = this.trickSystem.totalTricksLanded;
        
        document.getElementById('gameOverOverlay').classList.remove('hidden');
    }
    
    showTrickNotification(score) {
        // Update combo ring
        const maxCombo = 5;
        const comboPercent = Math.min(this.trickSystem.comboMultiplier / maxCombo, 1);
        const circumference = 125.6;
        const offset = circumference - (comboPercent * circumference);
        this.comboRing.style.strokeDashoffset = offset;
        
        // Show big combo text for high multipliers
        if (this.trickSystem.comboMultiplier >= 2 && this.comboDisplayTimer <= 0) {
            this.comboText.textContent = `x${this.trickSystem.comboMultiplier.toFixed(1)}`;
            this.comboOverlay.style.opacity = '1';
            this.comboDisplayTimer = 2;
        }
        
        // Create floating score popup
        const popup = document.createElement('div');
        popup.className = 'trick-popup fixed z-[90] pointer-events-none text-4xl font-display font-bold text-sunset-pink';
        popup.style.left = `${this.skier.x}px`;
        popup.style.top = `${this.skier.y - 80}px`;
        popup.style.textShadow = '0 0 20px rgba(247, 147, 30, 0.8)';
        popup.textContent = `+${score}`;
        document.body.appendChild(popup);
        
        setTimeout(() => popup.remove(), 1000);
    }
    
    updateUI() {
        // Distance
        if (this.distanceDisplay) {
            this.distanceDisplay.textContent = Math.round(this.distance).toLocaleString();
        }
        
        // Speed
        if (this.speedDisplay) {
            const speed = Math.abs(this.skier.velocity.y) * 3.6;
            this.speedDisplay.textContent = Math.round(speed);
        }
        
        // Combo
        if (this.comboDisplay) {
            this.comboDisplay.textContent = `x${this.trickSystem.comboMultiplier.toFixed(1)}`;
        }
        
        // Score
        if (this.scoreDisplay) {
            this.scoreDisplay.textContent = Math.round(this.score).toLocaleString();
        }
        
        // Time of day
        const timeInfo = this.renderer.getTimeOfDayInfo();
        if (this.timeIcon) this.timeIcon.textContent = timeInfo.icon;
        if (this.timeDisplay) this.timeDisplay.textContent = timeInfo.name;
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render terrain (includes background, mountains, ground)
        this.renderer.renderTerrain(this.terrain);
        
        // Render skier
        this.renderer.renderSkier(this.skier);
        
        // Render trick effects
        if (this.skier.isAirborne && this.trickSystem.currentTricks.length > 0) {
            this.renderer.renderTrickText(
                this.skier.x,
                this.skier.y - 50,
                this.trickSystem.currentTricks,
                this.trickSystem.comboMultiplier
            );
        }
        
        // Zen mode message
        if (this.gameMode === 'zen' && this.currentZenMessage && this.zenMessageTimer > 0) {
            this.renderer.renderZenMessage(
                this.canvas.width / 2,
                this.canvas.height * 0.3,
                this.currentZenMessage
            );
        }
    }
}

// Initialize the game when page loads
window.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
});
