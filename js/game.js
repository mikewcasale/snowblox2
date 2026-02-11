import { Skier } from './skier.js?v=11';
import { Terrain } from './terrain.js?v=11';
import { TrickSystem } from './tricks.js?v=11';
import { Renderer } from './renderer.js?v=11';

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
        this.skierColor = '#7dd3fc'; // Default skier color
        
        // Game objects
        // Position skier on left side at ground level (Sneaky Sasquatch style)
        const groundLevel = this.canvas.height * 0.75;
        this.skier = new Skier(this.canvas.width * 0.2, groundLevel);
        this.terrain = new Terrain(this.canvas.width, this.canvas.height);
        this.trickSystem = new TrickSystem(this.skier);
        this.renderer = new Renderer(this.ctx, this.canvas.width, this.canvas.height);
        
        // Input handling
        this.keys = {};
        this.setupInput();
        
        // UI element references
        this.distanceDisplay = document.getElementById('distanceDisplay');
        this.speedDisplay = document.getElementById('speedDisplay');
        this.multiplierDisplay = document.getElementById('multiplierDisplay');
        this.scoreDisplay = document.getElementById('scoreDisplay');
        this.progressBar = document.querySelector('.h-full.bg-primary');
        this.altitudeBar = document.getElementById('altitudeBar');
        
        // Bind pause button
        const pauseButton = document.querySelector('header button:last-child');
        if (pauseButton) {
            pauseButton.addEventListener('click', () => this.togglePause());
        }
        
        // Performance tracking
        this.lastTime = 0;
        this.fps = 60;
        
        // Handle start overlay
        this.setupStartScreen();
    }
    
    setupStartScreen() {
        const startBtn = document.getElementById('startBtn');
        const startOverlay = document.getElementById('startOverlay');
        
        if (startBtn && startOverlay) {
            startBtn.addEventListener('click', () => {
                // Get selected skier color and store it
                this.skierColor = window.selectedSkierColor || '#7dd3fc';
                console.log('Starting game with color:', this.skierColor);
                
                // Apply the color to the renderer
                if (this.renderer && typeof this.renderer.setSkierColor === 'function') {
                    this.renderer.setSkierColor(this.skierColor);
                }
                
                startOverlay.style.transition = 'opacity 0.5s';
                startOverlay.style.opacity = '0';
                setTimeout(() => {
                    startOverlay.remove();
                    this.start();
                }, 500);
            });
        } else {
            // If overlay doesn't exist, start immediately
            this.start();
        }
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
        // Track if spacebar flip is pending (pressed while grounded, should trigger when airborne)
        this.pendingFlip = false;
        
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            
            // Handle trick inputs when airborne (including spacebar for flip)
            if (this.skier.isAirborne && !this.gameOver) {
                this.trickSystem.handleInput(e.key);
            } else if (e.key === ' ' && !this.skier.isAirborne) {
                // Queue up a flip for when we become airborne (jump + flip combo)
                this.pendingFlip = true;
            }
            
            // Prevent default for game keys
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', ' ', '1', '2', '3', '4'].includes(e.key)) {
                e.preventDefault();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
            // Clear pending flip when spacebar is released
            if (e.key === ' ') {
                this.pendingFlip = false;
            }
        });
    }
    
    togglePause() {
        if (this.gameOver) return;
        this.isPaused = !this.isPaused;
    }
    
    start() {
        this.isRunning = true;
        this.gameLoop(0);
    }
    
    reset() {
        this.gameOver = false;
        this.isPaused = false;
        this.score = 0;
        this.distance = 0;
        this.difficulty = 1;
        
        // Spawn skier at same position as initial start (left side at ground level)
        const groundLevel = this.canvas.height * 0.75;
        this.skier = new Skier(this.canvas.width * 0.2, groundLevel);
        this.terrain = new Terrain(this.canvas.width, this.canvas.height);
        this.trickSystem = new TrickSystem(this.skier);
        
        // Keep the skier color
        if (this.renderer && this.skierColor) {
            this.renderer.setSkierColor(this.skierColor);
        }
        
        this.start();
    }
    
    gameLoop(currentTime) {
        if (!this.isRunning) return;
        
        // Calculate delta time
        const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1); // Cap at 100ms
        this.lastTime = currentTime;
        
        if (!this.isPaused && !this.gameOver) {
            this.update(deltaTime);
        }
        
        this.render();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update(deltaTime) {
        // Update difficulty over time
        this.difficulty = 1 + (this.distance / 10000);
        
        // Handle input (Sneaky Sasquatch style - just spacebar for jump)
        const input = {
            left: false, // No left/right control in Sneaky Sasquatch style
            right: false,
            jump: this.keys[' '] || this.keys['ArrowUp'] || false
        };
        
        // Update skier
        this.skier.update(deltaTime, input);
        
        // Check if we should trigger a pending flip (spacebar was pressed, now we're airborne)
        if (this.pendingFlip && this.skier.isAirborne && this.skier.airTime >= this.trickSystem.minAirTimeForTrick) {
            this.trickSystem.handleInput(' ');
            this.pendingFlip = false;
        }
        
        // Update terrain (scroll based on skier speed)
        this.terrain.update(deltaTime, this.skier.velocity.y, this.difficulty);
        
        // Check collisions (only check obstacles if skier is low enough)
        const collision = this.terrain.checkCollision(this.skier, this.skier.isAirborne);
        if (collision) {
            this.handleCollision(collision);
        }
        
        // Update trick system
        const trickScore = this.trickSystem.update(deltaTime);
        if (trickScore > 0) {
            this.score += trickScore;
        }
        
        // Update distance - slower accumulation for realistic meters
        this.distance += Math.abs(this.skier.velocity.y) * deltaTime * 2;
        
        // Update UI
        this.updateUI();
    }
    
    handleCollision(collision) {
        if (collision.type === 'ground') {
            // Check if mid-flip BEFORE landing (less than 50% complete = crash)
            const wasFlipping = this.skier.isFlipping;
            const flipProgress = this.skier.flipProgress;
            const incompletedFlip = wasFlipping && flipProgress < 0.5;
            
            // Land the skier
            this.skier.land(collision.y, collision.angle);
            
            if (incompletedFlip) {
                // Crashed - didn't complete at least half the flip
                this.crash();
            } else {
                // Successful landing - finalize tricks and award points
                const landingScore = this.trickSystem.land();
                if (landingScore > 0) {
                    this.score += landingScore;
                    this.showLandingScore(landingScore);
                }
            }
        } else if (collision.type === 'ramp') {
            this.skier.hitRamp(collision.angle, collision.boost);
            // Give invincibility when hitting ramp too
            this.skier.landingInvincibility = 1.0;
        } else if (collision.type === 'obstacle') {
            // Crash if you hit a tree or rock (only when not invincible)
            if (this.skier.landingInvincibility <= 0) {
                this.crash();
            }
        } else if (collision.type === 'rail') {
            this.skier.grindRail(collision);
            this.score += 10; // Bonus points for rail grinding
        }
    }
    
    crash() {
        this.gameOver = true;
        this.showGameOver();
    }
    
    showGameOver() {
        // Random compliments
        const compliments = [
            "Good Job!",
            "You're a Pro Skier!",
            "Amazing Run!",
            "Awesome Skills!",
            "What a Ride!",
            "Impressive!",
            "You Shredded It!",
            "Sick Moves!",
            "Legend!",
            "That Was Epic!",
            "Snow Champion!",
            "Mountain Master!",
            "Keep It Up!",
            "You're On Fire!",
            "Totally Radical!"
        ];
        const randomCompliment = compliments[Math.floor(Math.random() * compliments.length)];
        
        // Create game over overlay
        const overlay = document.createElement('div');
        overlay.id = 'gameOverOverlay';
        overlay.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md';
        overlay.innerHTML = `
            <div class="bg-storm-base border border-white/20 rounded-2xl p-8 max-w-md text-center space-y-6 animate-float">
                <h2 class="text-4xl font-display font-semibold text-primary">${randomCompliment}</h2>
                <div class="space-y-4">
                    <div>
                        <span class="text-sm text-slate-400 uppercase tracking-wide">Points Earned</span>
                        <div class="text-5xl font-display text-white">${Math.round(this.score).toLocaleString()}</div>
                    </div>
                    <div>
                        <span class="text-sm text-slate-400 uppercase tracking-wide">Distance Traveled</span>
                        <div class="text-4xl font-display text-white">${Math.round(this.distance).toLocaleString()}<span class="text-xl text-slate-400">m</span></div>
                    </div>
                    <div class="grid grid-cols-2 gap-4 pt-2">
                        <div>
                            <span class="text-xs text-slate-400 uppercase tracking-wide">Tricks Landed</span>
                            <div class="text-xl font-display text-amber-500">${this.trickSystem.totalTricksLanded}</div>
                        </div>
                        <div>
                            <span class="text-xs text-slate-400 uppercase tracking-wide">Best Combo</span>
                            <div class="text-xl font-display text-amber-500">x${this.trickSystem.comboMultiplier.toFixed(1)}</div>
                        </div>
                    </div>
                </div>
                <button id="restartBtn" class="w-full py-3 px-6 bg-primary text-slate-900 rounded-xl font-semibold hover:bg-primary/80 transition-colors">
                    Try Again
                </button>
            </div>
        `;
        document.body.appendChild(overlay);
        
        document.getElementById('restartBtn').addEventListener('click', () => {
            overlay.remove();
            this.reset();
        });
    }
    
    showLandingScore(score) {
        // Create a temporary score popup
        const popup = document.createElement('div');
        popup.className = 'fixed z-[90] pointer-events-none';
        popup.style.left = `${this.skier.x}px`;
        popup.style.top = `${this.skier.y - 60}px`;
        popup.style.transform = 'translate(-50%, -50%)';
        popup.innerHTML = `
            <div class="text-2xl font-display text-amber-500 font-bold animate-float" style="text-shadow: 0 0 10px #fbbf24;">
                +${score}
            </div>
        `;
        document.body.appendChild(popup);
        
        // Remove after animation
        setTimeout(() => {
            popup.style.transition = 'opacity 0.5s, transform 0.5s';
            popup.style.opacity = '0';
            popup.style.transform = 'translate(-50%, -100%)';
            setTimeout(() => popup.remove(), 500);
        }, 1000);
    }
    
    updateUI() {
        // Update distance display
        if (this.distanceDisplay) {
            this.distanceDisplay.textContent = Math.round(this.distance).toLocaleString();
        }
        
        // Update speed display
        if (this.speedDisplay) {
            const speed = Math.abs(this.skier.velocity.y) * 3.6; // Convert to km/h (rough approximation)
            this.speedDisplay.innerHTML = `${Math.round(speed)} <span class="text-[10px] font-sans">km/h</span>`;
        }
        
        // Update multiplier display
        if (this.multiplierDisplay) {
            const multiplier = this.trickSystem.comboMultiplier;
            this.multiplierDisplay.textContent = `x${multiplier.toFixed(1)}`;
        }
        
        // Update score display (trick points)
        if (this.scoreDisplay) {
            this.scoreDisplay.textContent = Math.round(this.score).toLocaleString();
        }
        
        // Update progress bar (based on distance milestones)
        if (this.progressBar) {
            const progress = Math.min((this.distance % 1000) / 1000 * 100, 100);
            this.progressBar.style.width = `${progress}%`;
        }
        
        // Update altitude bar (inverted - lower as you go down)
        if (this.altitudeBar) {
            const altitudePercent = Math.max(0, 100 - (this.distance / 100));
            this.altitudeBar.style.height = `${Math.min(100, altitudePercent)}%`;
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render terrain
        this.renderer.renderTerrain(this.terrain);
        
        // Render skier
        this.renderer.renderSkier(this.skier);
        
        // Render trick effects
        if (this.skier.isAirborne && this.trickSystem.currentTricks.length > 0) {
            this.renderer.renderTrickText(
                this.skier.x,
                this.skier.y - 40,
                this.trickSystem.currentTricks
            );
        }
        
        // Render particles
        this.renderer.renderParticles(this.skier);
    }
}

// Initialize the game when page loads
window.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    // Game will start when user clicks start button
});
