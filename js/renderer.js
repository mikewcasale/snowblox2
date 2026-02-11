export class Renderer {
    constructor(ctx, width, height) {
        this.ctx = ctx;
        this.width = width;
        this.height = height;
        
        // Time of day cycle (0-1, where 0=sunset, 0.5=night, 1=sunrise)
        this.timeOfDay = 0;
        this.dayCycleSpeed = 0.0005;
        
        // Parallax layers
        this.parallaxOffset = 0;
        this.mountainLayers = [];
        this.generateMountainLayers();
        
        // Particle system
        this.atmosphericParticles = [];
        this.initParticles();
        
        // Colors - Alto's Odyssey inspired palette
        this.colors = {
            sunset: {
                skyTop: '#2D1B4E',
                skyBottom: '#FF6B35',
                mountain1: '#1A0F2E',
                mountain2: '#2D1B4E',
                mountain3: '#4A1942',
                ground: '#0D0221',
                accent: '#F7931E'
            },
            night: {
                skyTop: '#0D0221',
                skyBottom: '#1A0F2E',
                mountain1: '#000000',
                mountain2: '#0D0221',
                mountain3: '#1A0F2E',
                ground: '#000000',
                accent: '#7209B7'
            },
            sunrise: {
                skyTop: '#7209B7',
                skyBottom: '#F7931E',
                mountain1: '#1A0F2E',
                mountain2: '#2D1B4E',
                mountain3: '#4A1942',
                ground: '#0D0221',
                accent: '#FF6B35'
            }
        };
        
        this.riderColor = '#FF6B35';
        this.scarfColor = '#F7931E';
        
        // Wind lines
        this.windLines = [];
        this.initWindLines();
        
        // Stars (for night time)
        this.stars = [];
        this.initStars();
    }
    
    setRiderColors(color, scarf) {
        this.riderColor = color;
        this.scarfColor = scarf;
    }
    
    generateMountainLayers() {
        // Generate procedural mountain silhouettes
        const layers = 3;
        for (let layer = 0; layer < layers; layer++) {
            const points = [];
            const segments = 20 + layer * 10;
            const baseHeight = this.height * (0.3 + layer * 0.15);
            const amplitude = 50 + layer * 30;
            
            for (let i = 0; i <= segments; i++) {
                const x = (i / segments) * this.width * 2;
                const noise = Math.sin(i * 0.5 + layer) * amplitude + 
                             Math.sin(i * 1.3 + layer * 2) * (amplitude * 0.5);
                const y = baseHeight + noise;
                points.push({ x, y });
            }
            
            this.mountainLayers.push({
                points,
                speed: 0.2 + layer * 0.15,
                offset: 0
            });
        }
    }
    
    initParticles() {
        // Snow/atmospheric particles
        for (let i = 0; i < 50; i++) {
            this.atmosphericParticles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random() * 2 + 0.5,
                speedX: Math.random() * 30 + 20,
                speedY: Math.random() * 10 - 5,
                opacity: Math.random() * 0.5 + 0.2
            });
        }
    }
    
    initWindLines() {
        for (let i = 0; i < 8; i++) {
            this.windLines.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height * 0.6,
                length: Math.random() * 100 + 50,
                speed: Math.random() * 200 + 100,
                opacity: Math.random() * 0.3 + 0.1
            });
        }
    }
    
    initStars() {
        for (let i = 0; i < 100; i++) {
            this.stars.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height * 0.5,
                size: Math.random() * 1.5 + 0.5,
                twinkle: Math.random() * Math.PI * 2
            });
        }
    }
    
    resize(width, height) {
        this.width = width;
        this.height = height;
        this.generateMountainLayers();
    }
    
    update(deltaTime, scrollSpeed) {
        // Update time of day
        this.timeOfDay += this.dayCycleSpeed * deltaTime;
        if (this.timeOfDay > 1) this.timeOfDay = 0;
        
        // Update parallax
        this.parallaxOffset += scrollSpeed * deltaTime;
        this.mountainLayers.forEach(layer => {
            layer.offset += scrollSpeed * layer.speed * deltaTime;
            if (layer.offset > this.width) {
                layer.offset -= this.width;
            }
        });
        
        // Update particles
        this.atmosphericParticles.forEach(p => {
            p.x -= p.speedX * deltaTime;
            p.y += p.speedY * deltaTime;
            
            if (p.x < -10) {
                p.x = this.width + 10;
                p.y = Math.random() * this.height;
            }
        });
        
        // Update wind lines
        this.windLines.forEach(w => {
            w.x -= w.speed * deltaTime;
            if (w.x + w.length < 0) {
                w.x = this.width + Math.random() * 200;
                w.y = Math.random() * this.height * 0.6;
            }
        });
        
        // Update stars twinkle
        this.stars.forEach(s => {
            s.twinkle += deltaTime * 2;
        });
    }
    
    getCurrentPalette() {
        if (this.timeOfDay < 0.33) return this.colors.sunset;
        if (this.timeOfDay < 0.66) return this.colors.night;
        return this.colors.sunrise;
    }
    
    interpolateColor(color1, color2, factor) {
        const hex2rgb = (hex) => ({
            r: parseInt(hex.slice(1, 3), 16),
            g: parseInt(hex.slice(3, 5), 16),
            b: parseInt(hex.slice(5, 7), 16)
        });
        
        const c1 = hex2rgb(color1);
        const c2 = hex2rgb(color2);
        
        const r = Math.round(c1.r + (c2.r - c1.r) * factor);
        const g = Math.round(c1.g + (c2.g - c1.g) * factor);
        const b = Math.round(c1.b + (c2.b - c1.b) * factor);
        
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    renderBackground() {
        const palette = this.getCurrentPalette();
        
        // Sky gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, palette.skyTop);
        gradient.addColorStop(1, palette.skyBottom);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Stars (visible during night phase)
        const nightIntensity = this.getNightIntensity();
        if (nightIntensity > 0) {
            this.renderStars(nightIntensity);
        }
        
        // Wind lines
        this.renderWindLines();
    }
    
    getNightIntensity() {
        // Returns 0-1 based on how close to night time
        if (this.timeOfDay >= 0.33 && this.timeOfDay <= 0.66) {
            const mid = 0.495; // Middle of night
            const dist = 1 - Math.abs(this.timeOfDay - mid) / 0.165;
            return Math.max(0, dist);
        }
        return 0;
    }
    
    renderStars(intensity) {
        this.ctx.save();
        this.stars.forEach(star => {
            const twinkle = Math.sin(star.twinkle) * 0.3 + 0.7;
            this.ctx.globalAlpha = intensity * twinkle;
            this.ctx.fillStyle = '#ffffff';
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.restore();
    }
    
    renderWindLines() {
        this.ctx.save();
        this.windLines.forEach(w => {
            this.ctx.globalAlpha = w.opacity;
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(w.x, w.y);
            this.ctx.lineTo(w.x + w.length, w.y);
            this.ctx.stroke();
        });
        this.ctx.restore();
    }
    
    renderMountains() {
        const palette = this.getCurrentPalette();
        const colors = [palette.mountain3, palette.mountain2, palette.mountain1];
        
        this.mountainLayers.forEach((layer, index) => {
            const color = colors[index];
            const alpha = 0.3 + index * 0.35;
            
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = color;
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, this.height);
            
            // Draw mountain silhouette
            const points = layer.points;
            const offsetX = -layer.offset;
            
            for (let i = 0; i < points.length; i++) {
                const point = points[i];
                const x = point.x + offsetX;
                const y = point.y;
                
                if (i === 0) {
                    this.ctx.lineTo(x, y);
                } else {
                    // Smooth curves between points
                    const prev = points[i - 1];
                    const prevX = prev.x + offsetX;
                    const midX = (prevX + x) / 2;
                    this.ctx.quadraticCurveTo(prevX, prev.y, midX, (prev.y + y) / 2);
                    this.ctx.quadraticCurveTo(x, y, x, y);
                }
            }
            
            this.ctx.lineTo(this.width * 2, this.height);
            this.ctx.closePath();
            this.ctx.fill();
            
            this.ctx.restore();
        });
    }
    
    renderTerrain(terrain) {
        const palette = this.getCurrentPalette();
        
        // Render background first
        this.renderBackground();
        this.renderMountains();
        
        // Ground level
        const groundY = this.height * 0.75;
        
        // Render dunes/ground with smooth curves
        this.ctx.save();
        this.ctx.fillStyle = palette.ground;
        
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.height);
        this.ctx.lineTo(0, groundY);
        
        // Create flowing dune shapes
        for (let x = 0; x <= this.width; x += 50) {
            const wave1 = Math.sin(x * 0.01 + this.parallaxOffset * 0.001) * 10;
            const wave2 = Math.sin(x * 0.02 + this.parallaxOffset * 0.002) * 5;
            this.ctx.lineTo(x, groundY + wave1 + wave2);
        }
        
        this.ctx.lineTo(this.width, this.height);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.restore();
        
        // Render game elements
        this.renderRamps(terrain.getRamps());
        this.renderRails(terrain.getRails());
        this.renderObstacles(terrain.getObstacles());
        
        // Atmospheric particles
        this.renderParticles();
    }
    
    renderRamps(ramps) {
        const palette = this.getCurrentPalette();
        
        ramps.forEach(ramp => {
            this.ctx.save();
            
            // Draw ramp as a smooth dune-like shape
            this.ctx.fillStyle = palette.ground;
            this.ctx.strokeStyle = palette.accent;
            this.ctx.lineWidth = 2;
            
            this.ctx.beginPath();
            this.ctx.moveTo(ramp.x, ramp.y);
            
            // Smooth curve up
            this.ctx.quadraticCurveTo(
                ramp.x + ramp.width * 0.3,
                ramp.y - ramp.height * 0.3,
                ramp.x + ramp.width * 0.6,
                ramp.y - ramp.height * 0.8
            );
            
            // Peak
            this.ctx.lineTo(ramp.x + ramp.width, ramp.y - ramp.height);
            
            // Down curve
            this.ctx.quadraticCurveTo(
                ramp.x + ramp.width * 0.7,
                ramp.y - ramp.height * 0.5,
                ramp.x + ramp.width,
                ramp.y
            );
            
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();
            
            // Highlight
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(ramp.x + 5, ramp.y);
            this.ctx.quadraticCurveTo(
                ramp.x + ramp.width * 0.3,
                ramp.y - ramp.height * 0.3,
                ramp.x + ramp.width * 0.5,
                ramp.y - ramp.height * 0.6
            );
            this.ctx.stroke();
            
            this.ctx.restore();
        });
    }
    
    renderRails(rails) {
        const palette = this.getCurrentPalette();
        
        rails.forEach(rail => {
            this.ctx.save();
            
            // Draw ruins/ancient structure style
            this.ctx.fillStyle = 'rgba(60, 40, 60, 0.8)';
            
            // Support pillars
            const numSupports = Math.floor(rail.length / 80);
            for (let i = 0; i <= numSupports; i++) {
                const x = rail.x + (rail.length * i / numSupports);
                const width = 6;
                const height = rail.height;
                
                // Tapered pillar
                this.ctx.beginPath();
                this.ctx.moveTo(x - width/2, rail.y);
                this.ctx.lineTo(x + width/2, rail.y);
                this.ctx.lineTo(x + width/3, rail.y - height);
                this.ctx.lineTo(x - width/3, rail.y - height);
                this.ctx.closePath();
                this.ctx.fill();
            }
            
            // Rail top
            this.ctx.fillStyle = 'rgba(100, 80, 100, 0.9)';
            this.ctx.fillRect(rail.x, rail.y - 4, rail.length, 4);
            
            this.ctx.restore();
        });
    }
    
    renderObstacles(obstacles) {
        const palette = this.getCurrentPalette();
        
        obstacles.forEach(obs => {
            const topY = obs.y - obs.height;
            
            if (obs.type === 'tree') {
                this.renderSilhouetteTree(obs.x, obs.y, obs.width, obs.height);
            } else {
                this.renderSilhouetteRock(obs.x, obs.y, obs.width, obs.height);
            }
        });
    }
    
    renderSilhouetteTree(x, y, width, height) {
        this.ctx.save();
        this.ctx.fillStyle = '#0D0221';
        
        // Multiple layers of foliage for silhouette effect
        const layers = 3;
        for (let i = 0; i < layers; i++) {
            const layerY = y - (height * (i + 1) / layers) * 0.7;
            const layerWidth = width * (1.5 - i * 0.3);
            const layerHeight = height * 0.4;
            
            this.ctx.beginPath();
            this.ctx.moveTo(x + width/2 - layerWidth/2, y - i * height * 0.25);
            this.ctx.quadraticCurveTo(
                x + width/2,
                layerY - layerHeight,
                x + width/2 + layerWidth/2,
                y - i * height * 0.25
            );
            this.ctx.closePath();
            this.ctx.fill();
        }
        
        // Trunk
        this.ctx.fillRect(x + width/2 - 3, y - height * 0.3, 6, height * 0.3);
        
        this.ctx.restore();
    }
    
    renderSilhouetteRock(x, y, width, height) {
        this.ctx.save();
        this.ctx.fillStyle = '#0D0221';
        
        const centerY = y - height/2;
        
        this.ctx.beginPath();
        this.ctx.moveTo(x, centerY + height/4);
        this.ctx.quadraticCurveTo(x + width/4, centerY - height/2, x + width/2, centerY - height/3);
        this.ctx.quadraticCurveTo(x + width*0.75, centerY - height/2, x + width, centerY + height/4);
        this.ctx.quadraticCurveTo(x + width/2, centerY + height/2, x, centerY + height/4);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Highlight
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.beginPath();
        this.ctx.ellipse(x + width/3, centerY - height/4, width/4, height/6, -0.3, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    renderSkier(skier) {
        this.ctx.save();
        this.ctx.translate(skier.x, skier.y);
        this.ctx.rotate(skier.rotation);
        
        // Silhouette style - dark figure with colored scarf
        
        // Shadow
        if (skier.isAirborne) {
            this.ctx.save();
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            this.ctx.globalAlpha = 0.3;
            this.ctx.fillStyle = '#000000';
            this.ctx.beginPath();
            this.ctx.ellipse(skier.x, this.height * 0.75 + 10, 20, 8, 0, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
        
        // Body (silhouette)
        this.ctx.fillStyle = '#0D0221';
        
        // Head
        this.ctx.beginPath();
        this.ctx.arc(0, -18, 7, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Body
        this.ctx.beginPath();
        this.ctx.ellipse(0, -2, 9, 14, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Arms
        this.ctx.strokeStyle = '#0D0221';
        this.ctx.lineWidth = 4;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(-6, -6);
        this.ctx.lineTo(-14, 2);
        this.ctx.moveTo(6, -6);
        this.ctx.lineTo(14, 2);
        this.ctx.stroke();
        
        // Animated scarf (flows behind based on speed)
        const time = Date.now() / 1000;
        this.ctx.strokeStyle = this.scarfColor;
        this.ctx.lineWidth = 5;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(0, -12);
        
        const windForce = skier.isAirborne ? 2 : 1;
        for (let i = 0; i < 5; i++) {
            const scarfX = -8 - i * 6;
            const scarfY = -12 + Math.sin(time * 5 + i * 0.5) * 3 * windForce + i * 2;
            this.ctx.lineTo(scarfX, scarfY);
        }
        this.ctx.stroke();
        
        // Snowboard (silhouette with accent)
        this.ctx.fillStyle = '#0D0221';
        this.ctx.strokeStyle = this.riderColor;
        this.ctx.lineWidth = 2;
        
        this.ctx.beginPath();
        this.ctx.roundRect(-20, 10, 40, 6, 3);
        this.ctx.fill();
        this.ctx.stroke();
        
        // Speed lines when moving fast
        if (Math.abs(skier.velocity.y) > 150) {
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            this.ctx.lineWidth = 1;
            for (let i = 0; i < 3; i++) {
                this.ctx.beginPath();
                this.ctx.moveTo(-25 - i * 8, -5 + i * 3);
                this.ctx.lineTo(-35 - i * 8, -5 + i * 3);
                this.ctx.stroke();
            }
        }
        
        // Trick rotation indicator
        if (skier.isFlipping) {
            this.ctx.strokeStyle = this.scarfColor;
            this.ctx.lineWidth = 2;
            this.ctx.globalAlpha = 0.5;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 35, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
            this.ctx.globalAlpha = 1;
        }
        
        this.ctx.restore();
    }
    
    renderParticles() {
        this.ctx.save();
        
        this.atmosphericParticles.forEach(p => {
            this.ctx.globalAlpha = p.opacity;
            this.ctx.fillStyle = '#ffffff';
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        this.ctx.restore();
    }
    
    renderTrickText(x, y, tricks, comboMultiplier) {
        if (tricks.length === 0) return;
        
        this.ctx.save();
        
        // Draw trick names with glow
        const trickNames = tricks.map(t => t.name).join(' + ');
        
        this.ctx.font = 'bold 28px Cinzel, serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'bottom';
        
        // Glow effect
        this.ctx.shadowColor = this.riderColor;
        this.ctx.shadowBlur = 20;
        
        // Text shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillText(trickNames, x + 2, y + 2);
        
        // Main text
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText(trickNames, x, y);
        
        // Show pending score
        const pendingScore = tricks.reduce((sum, t) => sum + t.points, 0);
        this.ctx.font = 'bold 20px Lato, sans-serif';
        this.ctx.shadowColor = '#F7931E';
        this.ctx.fillStyle = '#F7931E';
        this.ctx.fillText(`+${pendingScore}`, x, y - 35);
        
        // Show combo if active
        if (comboMultiplier > 1) {
            this.ctx.font = 'bold 16px Lato, sans-serif';
            this.ctx.fillStyle = this.scarfColor;
            this.ctx.fillText(`x${comboMultiplier.toFixed(1)}`, x + 60, y - 35);
        }
        
        this.ctx.restore();
    }
    
    renderZenMessage(x, y, message) {
        this.ctx.save();
        this.ctx.font = 'italic 24px Cinzel, serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.fillText(message, x, y);
        this.ctx.restore();
    }
    
    getTimeOfDayInfo() {
        if (this.timeOfDay < 0.33) {
            return { icon: '🌅', name: 'Sunset' };
        } else if (this.timeOfDay < 0.66) {
            return { icon: '🌙', name: 'Night' };
        } else {
            return { icon: '🌄', name: 'Sunrise' };
        }
    }
}
