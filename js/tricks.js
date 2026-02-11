export class TrickSystem {
    constructor(skier) {
        this.skier = skier;
        
        // Trick definitions with varied point values and descriptions
        this.tricks = {
            'backflip': { 
                name: 'Backflip', 
                points: 150, 
                difficulty: 'Medium', 
                key: '1',
                description: 'Flip backward in the air'
            },
            'frontflip': { 
                name: 'Frontflip', 
                points: 150, 
                difficulty: 'Medium', 
                key: '2',
                description: 'Flip forward in the air'
            },
            'spin360': { 
                name: '360° Spin', 
                points: 200, 
                difficulty: 'Hard', 
                key: '3',
                description: 'Complete rotation'
            },
            'grab': { 
                name: 'Method Grab', 
                points: 100, 
                difficulty: 'Easy', 
                key: '4',
                description: 'Grab your board'
            }
        };
        
        // Current state
        this.currentTricks = [];
        this.comboMultiplier = 1.0;
        this.maxCombo = 1.0; // Track best combo
        this.isPerformingTrick = false;
        this.trickStartRotation = 0;
        this.minAirTimeForTrick = 0.05;
        
        // Scoring
        this.pendingScore = 0;
        this.lastLandingScore = 0;
        this.totalTricksLanded = 0;
        
        // Landing feedback
        this.landingQuality = 'good'; // 'perfect', 'good', 'sloppy', 'crash'
        
        // Trick history for statistics
        this.trickHistory = [];
    }
    
    handleInput(key) {
        // Only allow tricks when airborne and after minimum air time
        if (!this.skier.isAirborne || this.skier.airTime < this.minAirTimeForTrick) {
            return false;
        }
        
        let trickPerformed = false;
        
        switch(key) {
            case '1':
                this.performTrick('backflip');
                this.skier.performFlip(1);
                trickPerformed = true;
                break;
            case '2':
                this.performTrick('frontflip');
                this.skier.performFlip(-1);
                trickPerformed = true;
                break;
            case '3':
                this.performTrick('spin360');
                this.skier.performSpin(1);
                trickPerformed = true;
                break;
            case '4':
                this.performTrick('grab');
                trickPerformed = true;
                break;
            case ' ':
                // Space bar performs a flip when airborne
                this.performTrick('backflip');
                this.skier.performFlip(1);
                trickPerformed = true;
                break;
        }
        
        return trickPerformed;
    }
    
    performTrick(trickId) {
        const trick = this.tricks[trickId];
        if (!trick) return;
        
        // Check if this trick is already in the current combo (prevent spam)
        const alreadyInCombo = this.currentTricks.some(t => t.id === trickId);
        if (alreadyInCombo) {
            // Still allow but with reduced points
            this.currentTricks.push({
                id: trickId,
                name: trick.name,
                points: Math.floor(trick.points * 0.5), // Reduced points for repeat
                timestamp: Date.now(),
                isRepeat: true
            });
        } else {
            this.currentTricks.push({
                id: trickId,
                name: trick.name,
                points: trick.points,
                timestamp: Date.now(),
                isRepeat: false
            });
        }
        
        this.isPerformingTrick = true;
        
        // Store rotation at trick start for validation
        if (this.currentTricks.length === 1) {
            this.trickStartRotation = this.skier.rotation;
        }
    }
    
    update(deltaTime) {
        // Reset multiplier gradually when not in air
        if (!this.skier.isAirborne && this.comboMultiplier > 1.0) {
            this.comboMultiplier = Math.max(1.0, this.comboMultiplier - deltaTime * 0.5);
        }
        
        return 0;
    }
    
    land() {
        // Calculate score when landing
        if (this.currentTricks.length === 0) {
            // No tricks performed - give small bonus for clean landing
            const cleanJumpBonus = Math.round(this.skier.airTime * 25);
            this.landingQuality = 'good';
            this.resetCombo();
            return cleanJumpBonus;
        }
        
        // Check landing quality based on rotation
        const rotationNormalized = this.normalizeAngle(this.skier.rotation);
        const rotationDeviation = Math.abs(rotationNormalized);
        
        let landingMultiplier = 1.0;
        
        if (rotationDeviation < Math.PI / 8) {
            this.landingQuality = 'perfect';
            landingMultiplier = 1.5;
        } else if (rotationDeviation < Math.PI / 4) {
            this.landingQuality = 'good';
            landingMultiplier = 1.2;
        } else if (rotationDeviation < Math.PI / 2) {
            this.landingQuality = 'sloppy';
            landingMultiplier = 0.8;
        } else {
            this.landingQuality = 'crash';
            landingMultiplier = 0;
        }
        
        if (this.landingQuality === 'crash') {
            this.resetCombo();
            return 0;
        }
        
        // Calculate total score
        let totalScore = 0;
        
        // Sum up trick points
        for (const trick of this.currentTricks) {
            totalScore += trick.points;
        }
        
        // Apply combo multiplier
        totalScore *= this.comboMultiplier;
        
        // Bonus for multiple tricks in one jump
        if (this.currentTricks.length > 1) {
            const comboBonus = 1 + (this.currentTricks.length - 1) * 0.5;
            totalScore *= comboBonus;
        }
        
        // Bonus for air time
        if (this.skier.airTime > 2.5) {
            totalScore *= 2.0; // Huge air bonus
        } else if (this.skier.airTime > 1.5) {
            totalScore *= 1.5;
        } else if (this.skier.airTime > 0.8) {
            totalScore *= 1.2;
        }
        
        // Apply landing quality
        totalScore *= landingMultiplier;
        
        // Round to nearest integer
        totalScore = Math.round(totalScore);
        
        this.lastLandingScore = totalScore;
        this.totalTricksLanded += this.currentTricks.length;
        
        // Track trick history
        this.trickHistory.push({
            tricks: [...this.currentTricks],
            score: totalScore,
            airTime: this.skier.airTime,
            landingQuality: this.landingQuality,
            timestamp: Date.now()
        });
        
        // Increase multiplier for next combo
        const previousMultiplier = this.comboMultiplier;
        this.comboMultiplier = Math.min(5.0, this.comboMultiplier + 0.3 + (this.currentTricks.length * 0.1));
        
        // Track max combo
        if (this.comboMultiplier > this.maxCombo) {
            this.maxCombo = this.comboMultiplier;
        }
        
        // Clear current tricks but keep multiplier
        this.currentTricks = [];
        this.isPerformingTrick = false;
        
        return totalScore;
    }
    
    resetCombo() {
        this.currentTricks = [];
        this.comboMultiplier = 1.0;
        this.isPerformingTrick = false;
        this.lastLandingScore = 0;
    }
    
    normalizeAngle(angle) {
        // Normalize angle to -PI to PI range
        while (angle > Math.PI) angle -= 2 * Math.PI;
        while (angle < -Math.PI) angle += 2 * Math.PI;
        return angle;
    }
    
    getCurrentTrickNames() {
        return this.currentTricks.map(t => t.name).join(' + ');
    }
    
    getPendingScore() {
        if (this.currentTricks.length === 0) return 0;
        
        let total = 0;
        for (const trick of this.currentTricks) {
            total += trick.points;
        }
        return Math.round(total * this.comboMultiplier);
    }
    
    getLandingQuality() {
        return this.landingQuality;
    }
    
    getStats() {
        return {
            totalTricks: this.totalTricksLanded,
            maxCombo: this.maxCombo,
            currentCombo: this.comboMultiplier,
            trickHistory: this.trickHistory.slice(-10) // Last 10 tricks
        };
    }
}
