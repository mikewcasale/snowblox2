export class TrickSystem {
    constructor(skier) {
        this.skier = skier;
        
        // Trick definitions with varied point values
        this.tricks = {
            'backflip': { name: 'Backflip', points: 150, difficulty: 'Medium', key: '1' },
            'frontflip': { name: 'Frontflip', points: 150, difficulty: 'Medium', key: '2' },
            'spin360': { name: '360 Spin', points: 200, difficulty: 'Hard', key: '3' },
            'grab': { name: 'Method Grab', points: 100, difficulty: 'Easy', key: '4' }
        };
        
        // Current state
        this.currentTricks = [];
        this.comboMultiplier = 1.0;
        this.isPerformingTrick = false;
        this.trickStartRotation = 0;
        this.minAirTimeForTrick = 0.05; // Minimum air time to perform tricks (seconds) - very short for responsive flips
        
        // Scoring
        this.pendingScore = 0;
        this.lastLandingScore = 0;
        this.totalTricksLanded = 0;
    }
    
    handleInput(key) {
        // Only allow tricks when airborne and after minimum air time
        if (!this.skier.isAirborne || this.skier.airTime < this.minAirTimeForTrick) {
            return;
        }
        
        switch(key) {
            case '1':
                this.performTrick('backflip');
                this.skier.performFlip(1); // Backflip
                break;
            case '2':
                this.performTrick('frontflip');
                this.skier.performFlip(-1); // Frontflip
                break;
            case '3':
                this.performTrick('spin360');
                this.skier.performSpin(1); // 360 spin
                break;
            case '4':
                this.performTrick('grab');
                break;
            case ' ':
                // Space bar performs a flip when airborne
                this.performTrick('backflip');
                this.skier.performFlip(1); // Backflip
                break;
        }
    }
    
    performTrick(trickId) {
        const trick = this.tricks[trickId];
        if (!trick) return;
        
        // Add trick to current combo
        this.currentTricks.push({
            name: trick.name,
            points: trick.points,
            timestamp: Date.now()
        });
        
        this.isPerformingTrick = true;
        
        // Store rotation at trick start for validation
        if (this.currentTricks.length === 1) {
            this.trickStartRotation = this.skier.rotation;
        }
    }
    
    update(deltaTime) {
        // Reset multiplier gradually when not in air
        if (!this.skier.isAirborne && this.comboMultiplier > 1.0) {
            this.comboMultiplier = Math.max(1.0, this.comboMultiplier - deltaTime * 2);
        }
        
        return 0; // No score added during flight
    }
    
    land() {
        // Calculate score when landing
        if (this.currentTricks.length === 0) {
            // No tricks performed - just a clean jump
            // Still give small bonus for clean landing
            const cleanJumpBonus = Math.round(this.skier.airTime * 25); // 25 points per second of air time
            this.resetCombo();
            return cleanJumpBonus;
        }
        
        // Check if landing is valid (rotation should be reasonably close to upright)
        const rotationNormalized = this.normalizeAngle(this.skier.rotation);
        const isCleanLanding = Math.abs(rotationNormalized) < Math.PI / 2; // Within 90 degrees - very forgiving
        
        if (!isCleanLanding) {
            // Bad landing - lose pending score but don't crash
            this.resetCombo();
            return 0;
        }
        
        // Valid landing - calculate score
        let totalScore = 0;
        
        // Sum up trick points
        for (const trick of this.currentTricks) {
            totalScore += trick.points;
        }
        
        // Apply combo multiplier
        totalScore *= this.comboMultiplier;
        
        // Bonus for multiple tricks in one jump (combo bonus)
        if (this.currentTricks.length > 1) {
            totalScore *= (1 + (this.currentTricks.length - 1) * 0.5); // 50% bonus per extra trick
        }
        
        // Bonus for air time
        if (this.skier.airTime > 2) {
            totalScore *= 1.5; // Big air bonus
        } else if (this.skier.airTime > 1) {
            totalScore *= 1.25;
        }
        
        // Perfect landing bonus (very upright)
        if (Math.abs(rotationNormalized) < Math.PI / 8) {
            totalScore *= 1.2; // 20% bonus for perfect landing
        }
        
        this.lastLandingScore = Math.round(totalScore);
        this.totalTricksLanded += this.currentTricks.length;
        
        // Increase multiplier for next combo
        this.comboMultiplier = Math.min(5.0, this.comboMultiplier + 0.5); // Cap at 5x
        
        // Clear current tricks but keep multiplier
        this.currentTricks = [];
        this.isPerformingTrick = false;
        
        return this.lastLandingScore;
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
}
