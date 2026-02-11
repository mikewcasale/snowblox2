export class Terrain {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        
        // Terrain elements
        this.groundSegments = [];
        this.ramps = [];
        this.rails = [];
        this.obstacles = [];
        
        // Horizontal scrolling
        this.scrollOffset = 0;
        this.segmentWidth = 600;
        this.lastGeneratedX = 0;
        this.groundLevel = height * 0.75;
        
        // Game mode
        this.gameMode = 'adventure'; // 'zen' or 'adventure'
        
        // Biome progression
        this.biomeDistance = 0;
        this.currentBiome = 'alpine'; // 'alpine', 'forest', 'village', 'temple'
        
        // Initialize with some terrain
        this.generateInitialTerrain();
    }
    
    setGameMode(mode) {
        this.gameMode = mode;
    }
    
    resize(width, height) {
        this.width = width;
        this.height = height;
        this.groundLevel = height * 0.75;
    }
    
    generateInitialTerrain() {
        this.lastGeneratedX = this.width * 0.25;
        
        for (let i = 0; i < 10; i++) {
            if (i < 1) {
                this.generateClearSegment(this.lastGeneratedX);
            } else {
                this.generateTerrainSegment(this.lastGeneratedX);
            }
            this.lastGeneratedX += this.segmentWidth;
        }
    }
    
    generateClearSegment(spawnX) {
        this.groundSegments.push({
            x: spawnX,
            y: this.groundLevel,
            width: this.segmentWidth,
            angle: 0
        });
    }
    
    update(deltaTime, scrollSpeed, difficulty) {
        const speed = Math.abs(scrollSpeed) * deltaTime;
        this.scrollOffset += speed;
        this.biomeDistance += speed;
        
        // Update all terrain elements
        this.groundSegments.forEach(seg => seg.x -= speed);
        this.ramps.forEach(ramp => ramp.x -= speed);
        this.rails.forEach(rail => rail.x -= speed);
        this.obstacles.forEach(obs => obs.x -= speed);
        
        // Remove off-screen terrain
        this.cleanupOffscreenTerrain();
        
        // Generate new terrain
        const rightmostRamp = this.ramps.length > 0 ? Math.max(...this.ramps.map(r => r.x)) : 0;
        const rightmostObstacle = this.obstacles.length > 0 ? Math.max(...this.obstacles.map(o => o.x)) : 0;
        const rightmostItem = Math.max(rightmostRamp, rightmostObstacle, 0);
        
        if (rightmostItem < this.width + 500) {
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
        
        // Generate features based on game mode
        const rand = Math.random();
        
        if (this.gameMode === 'zen') {
            // Zen mode: Only ramps, no obstacles
            if (rand < 0.5) {
                this.generateRamp(spawnX);
            }
        } else {
            // Adventure mode: Full gameplay
            if (rand < 0.6) {
                const featureType = Math.random();
                
                if (featureType < 0.4) {
                    // 40% chance: Ramp with obstacle after it
                    this.generateRampWithObstacle(spawnX);
                } else if (featureType < 0.6) {
                    // 20% chance: Just a ramp
                    this.generateRamp(spawnX);
                } else if (featureType < 0.75) {
                    // 15% chance: Rail grind
                    this.generateRail(spawnX);
                } else if (featureType < 0.9) {
                    // 15% chance: Obstacles to avoid
                    this.generateObstacles(spawnX, difficulty);
                }
                // 10% chance: Empty segment (clear snow)
            }
        }
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
        
        // Place obstacle after the ramp (landing challenge)
        const landingZone = 250 + Math.random() * 150;
        const obstacleX = spawnX + rampWidth + landingZone;
        
        const type = Math.random() < 0.6 ? 'tree' : 'rock';
        const obsHeight = type === 'tree' ? 50 : 25;
        
        this.obstacles.push({
            x: obstacleX,
            y: this.groundLevel,
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
            const offsetX = i * (80 + Math.random() * 40);
            const type = Math.random() < 0.6 ? 'tree' : 'rock';
            const height = type === 'tree' ? 55 : 30;
            
            this.obstacles.push({
                x: spawnX + offsetX,
                y: this.groundLevel,
                width: type === 'tree' ? 20 : 30,
                height: height,
                type: type
            });
        }
    }
    
    cleanupOffscreenTerrain() {
        const threshold = -300;
        
        this.groundSegments = this.groundSegments.filter(seg => seg.x > threshold);
        this.ramps = this.ramps.filter(ramp => ramp.x > threshold);
        this.rails = this.rails.filter(rail => rail.x > threshold);
        this.obstacles = this.obstacles.filter(obs => obs.x > threshold);
    }
    
    checkCollision(skier, isAirborne = false) {
        const bounds = skier.getBounds();
        
        // FIRST: Check ramp collision (priority - launch skier!)
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
        
        // Check obstacle collision - ONLY in adventure mode
        if (this.gameMode === 'adventure' && !isAirborne && skier.landingInvincibility <= 0) {
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
        const horizontalOverlap = bounds.right > ramp.x && bounds.left < ramp.x + ramp.width * 0.3;
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
    
    getCurrentBiome() {
        return this.currentBiome;
    }
}
