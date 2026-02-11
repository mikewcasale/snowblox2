export class Terrain {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        
        // Terrain elements
        this.groundSegments = [];
        this.ramps = [];
        this.rails = [];
        this.obstacles = [];
        
        // Horizontal scrolling (Sneaky Sasquatch style)
        this.scrollOffset = 0;
        this.segmentWidth = 600; // Horizontal spacing between features
        this.lastGeneratedX = 0;
        this.groundLevel = height * 0.75; // Ground at 75% down the screen
        
        // Initialize with some terrain
        this.generateInitialTerrain();
    }
    
    resize(width, height) {
        this.width = width;
        this.height = height;
        this.groundLevel = height * 0.75;
    }
    
    generateInitialTerrain() {
        // Start generating terrain right after the skier's position (skier is at 20% of width)
        this.lastGeneratedX = this.width * 0.25; // Start just ahead of skier
        
        // Generate terrain that will be visible immediately
        for (let i = 0; i < 10; i++) {
            if (i < 1) {
                // First segment clear for safe start
                this.generateClearSegment(this.lastGeneratedX);
            } else {
                // Then normal terrain with obstacles/ramps
                this.generateTerrainSegment(this.lastGeneratedX);
            }
            this.lastGeneratedX += this.segmentWidth;
        }
    }
    
    generateClearSegment(spawnX) {
        // Just ground, no obstacles - for safe start
        this.groundSegments.push({
            x: spawnX,
            y: this.groundLevel,
            width: this.segmentWidth,
            angle: 0
        });
    }
    
    update(deltaTime, scrollSpeed, difficulty) {
        // Scroll terrain LEFT (right to left like Sneaky Sasquatch)
        const speed = Math.abs(scrollSpeed) * deltaTime;
        this.scrollOffset += speed;
        
        // Update all terrain elements - move LEFT (negative X)
        this.groundSegments.forEach(seg => seg.x -= speed);
        this.ramps.forEach(ramp => ramp.x -= speed);
        this.rails.forEach(rail => rail.x -= speed);
        this.obstacles.forEach(obs => obs.x -= speed);
        
        // Remove off-screen terrain
        this.cleanupOffscreenTerrain();
        
        // Generate new terrain on the right when needed
        const rightmostRamp = this.ramps.length > 0 ? Math.max(...this.ramps.map(r => r.x)) : 0;
        const rightmostObstacle = this.obstacles.length > 0 ? Math.max(...this.obstacles.map(o => o.x)) : 0;
        const rightmostItem = Math.max(rightmostRamp, rightmostObstacle, 0);
        
        if (rightmostItem < this.width + 500) {
            // Generate new terrain to the right
            const newX = this.width + 600;
            this.generateTerrainSegment(newX, difficulty);
        }
    }
    
    generateTerrainSegment(spawnX, difficulty = 1) {
        // Always create a ground segment
        this.groundSegments.push({
            x: spawnX,
            y: this.groundLevel,
            width: this.segmentWidth,
            angle: 0
        });
        
        // Generate features with strategic placement (60% chance)
        const rand = Math.random();
        
        if (rand < 0.6) {
            const featureType = Math.random();
            
            if (featureType < 0.5) {
                // 50% chance: Ramp with obstacle after it
                this.generateRampWithObstacle(spawnX);
            } else if (featureType < 0.75) {
                // 25% chance: Just a ramp (easier)
                this.generateRamp(spawnX);
            } else {
                // 25% chance: Just obstacles to avoid (jump over them)
                this.generateObstacles(spawnX, difficulty);
            }
        }
        // 40% of segments will be empty - clear snow
    }
    
    generateRampWithObstacle(spawnX) {
        // Place a ramp
        const rampWidth = 100 + Math.random() * 60;
        const rampHeight = 50 + Math.random() * 40;
        
        this.ramps.push({
            x: spawnX,
            y: this.groundLevel,
            width: rampWidth,
            height: rampHeight,
            boost: 1.2 + Math.random() * 0.3
        });
        
        // Place obstacle well after the ramp - give lots of landing room
        // The skier needs space to land safely after the jump
        const landingZone = 300; // Clear landing zone after ramp
        const obstacleX = spawnX + rampWidth + landingZone + Math.random() * 100;
        
        const type = Math.random() < 0.6 ? 'tree' : 'rock';
        const obsHeight = type === 'tree' ? 50 : 25; // Slightly smaller obstacles
        
        this.obstacles.push({
            x: obstacleX,
            y: this.groundLevel, // Bottom of obstacle at ground level
            width: type === 'tree' ? 20 : 25,
            height: obsHeight,
            type: type
        });
    }
    
    generateRamp(spawnX) {
        const width = 100 + Math.random() * 60;
        const height = 50 + Math.random() * 40;
        
        this.ramps.push({
            x: spawnX,
            y: this.groundLevel,
            width: width,
            height: height,
            boost: 1.2 + Math.random() * 0.3
        });
    }
    
    generateRail(spawnX) {
        const length = 120 + Math.random() * 150;
        const height = 20 + Math.random() * 25;
        
        this.rails.push({
            x: spawnX,
            y: this.groundLevel - height,
            length: length,
            width: 8,
            height: height
        });
    }
    
    generateObstacles(spawnX, difficulty) {
        const numObstacles = Math.random() < 0.5 ? 1 : 2;
        
        for (let i = 0; i < numObstacles; i++) {
            const offsetX = i * 80;
            const type = Math.random() < 0.6 ? 'tree' : 'rock';
            const height = type === 'tree' ? 60 : 30;
            
            this.obstacles.push({
                x: spawnX + offsetX,
                y: this.groundLevel, // Bottom of obstacle at ground level
                width: type === 'tree' ? 20 : 30,
                height: height,
                type: type
            });
        }
    }
    
    cleanupOffscreenTerrain() {
        // Remove terrain that's scrolled off the LEFT of the screen
        const threshold = -300;
        
        this.groundSegments = this.groundSegments.filter(seg => seg.x > threshold);
        this.ramps = this.ramps.filter(ramp => ramp.x > threshold);
        this.rails = this.rails.filter(rail => rail.x > threshold);
        this.obstacles = this.obstacles.filter(obs => obs.x > threshold);
    }
    
    checkCollision(skier, isAirborne = false) {
        const bounds = skier.getBounds();
        
        // FIRST: Check ramp collision (priority - launch skier!)
        // Only check when grounded and not already airborne
        if (!isAirborne && skier.isGrounded) {
            for (const ramp of this.ramps) {
                if (this.checkRampCollision(bounds, ramp)) {
                    return {
                        type: 'ramp',
                        angle: 0,
                        boost: ramp.boost
                    };
                }
            }
        }
        
        // Check ground collision (when falling from air)
        if (isAirborne && skier.velocity.y > 0) {
            const groundY = this.getGroundYAt(bounds.centerX);
            if (bounds.bottom >= groundY) {
                return {
                    type: 'ground',
                    y: groundY,
                    angle: 0
                };
            }
        }
        
        // Check rail collision
        for (const rail of this.rails) {
            if (this.checkRailCollision(bounds, rail)) {
                return {
                    type: 'rail',
                    y: rail.y,
                    x: rail.x,
                    length: rail.length
                };
            }
        }
        
        // Check obstacle collision - ONLY when on the ground AND not invincible
        // When airborne or recently landed, skip obstacle collision
        if (!isAirborne && skier.landingInvincibility <= 0) {
            for (const obs of this.obstacles) {
                if (this.checkObstacleCollision(bounds, obs)) {
                    return {
                        type: 'obstacle',
                        obstacle: obs
                    };
                }
            }
        }
        
        return null;
    }
    
    checkRampCollision(bounds, ramp) {
        // For side-scrolling: ramp comes from right, skier is on left
        // Check if skier overlaps with the ramp's left edge (where they would hit it)
        // ramp.y is the ground level, ramp extends upward from there
        
        // Check horizontal overlap - skier should be touching the ramp's left portion
        const horizontalOverlap = bounds.right > ramp.x && bounds.left < ramp.x + ramp.width * 0.3;
        
        // Check if skier is at ground level (within tolerance)
        const atGroundLevel = bounds.bottom >= this.groundLevel - 20 && bounds.bottom <= this.groundLevel + 20;
        
        return horizontalOverlap && atGroundLevel;
    }
    
    checkRailCollision(bounds, rail) {
        const railTop = rail.y;
        const railBottom = rail.y + 10;
        
        return bounds.right > rail.x &&
               bounds.left < rail.x + rail.length &&
               bounds.bottom > railTop &&
               bounds.top < railBottom;
    }
    
    checkObstacleCollision(bounds, obs) {
        // obs.y is the bottom (ground level), so top is obs.y - obs.height
        const obsTop = obs.y - obs.height;
        const obsBottom = obs.y;
        
        return bounds.right > obs.x &&
               bounds.left < obs.x + obs.width &&
               bounds.bottom > obsTop &&
               bounds.top < obsBottom;
    }
    
    getGroundYAt(x) {
        return this.groundLevel;
    }
    
    getRamps() {
        return this.ramps;
    }
    
    getRails() {
        return this.rails;
    }
    
    getObstacles() {
        return this.obstacles;
    }
    
    getGroundSegments() {
        return this.groundSegments;
    }
}
