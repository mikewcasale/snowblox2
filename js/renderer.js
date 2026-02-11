export class Renderer {
    constructor(ctx, width, height) {
        this.ctx = ctx;
        this.width = width;
        this.height = height;
        
        // Colors from the theme
        this.colors = {
            primary: '#7dd3fc',
            ground: '#334155',
            ramp: '#475569',
            rail: '#64748b',
            tree: '#15803d',
            rock: '#44403c',
            skier: '#7dd3fc', // Default skier color
            snow: '#ffffff'
        };
        
        this.skierColor = '#7dd3fc'; // Customizable skier color
    }
    
    setSkierColor(color) {
        this.skierColor = color;
        this.colors.skier = color;
    }
    
    resize(width, height) {
        this.width = width;
        this.height = height;
    }
    
    renderTerrain(terrain) {
        // Render background mountains first
        this.renderBackgroundMountains();
        
        // Always render a visible ground - use fixed position at 75% (where skier and terrain are)
        const groundY = this.height * 0.75;
        
        // Fill below ground with bright white snow
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(0, groundY, this.width, this.height - groundY);
        
        // Add subtle shading for depth
        const gradient = this.ctx.createLinearGradient(0, groundY, 0, groundY + 80);
        gradient.addColorStop(0, 'rgba(200, 220, 240, 0)');
        gradient.addColorStop(1, 'rgba(150, 180, 210, 0.4)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, groundY, this.width, 80);
        
        // Draw single clean ground line
        this.ctx.strokeStyle = '#94a3b8';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(0, groundY);
        this.ctx.lineTo(this.width, groundY);
        this.ctx.stroke();
        
        // Render ramps
        const ramps = terrain.getRamps();
        for (const ramp of ramps) {
            this.renderRamp(ramp);
        }
        
        // Render rails
        const rails = terrain.getRails();
        for (const rail of rails) {
            this.renderRail(rail);
        }
        
        // Render obstacles
        const obstacles = terrain.getObstacles();
        for (const obs of obstacles) {
            this.renderObstacle(obs);
        }
    }
    
    renderRamp(ramp) {
        this.ctx.save();
        
        // Draw ramp as a side-view slope (Sneaky Sasquatch style)
        this.ctx.fillStyle = '#64748b';
        this.ctx.strokeStyle = this.colors.primary;
        this.ctx.lineWidth = 2;
        
        // Draw ramp as a triangle slope going up from left to right
        this.ctx.beginPath();
        this.ctx.moveTo(ramp.x, ramp.y); // Bottom left (ground level)
        this.ctx.lineTo(ramp.x + ramp.width, ramp.y - ramp.height); // Top right (peak)
        this.ctx.lineTo(ramp.x + ramp.width, ramp.y); // Bottom right
        this.ctx.closePath();
        
        // Gradient for depth
        const gradient = this.ctx.createLinearGradient(ramp.x, ramp.y, ramp.x + ramp.width, ramp.y - ramp.height);
        gradient.addColorStop(0, '#475569');
        gradient.addColorStop(1, '#94a3b8');
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        this.ctx.stroke();
        
        // Snow highlight on the slope
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(ramp.x, ramp.y);
        this.ctx.lineTo(ramp.x + ramp.width, ramp.y - ramp.height);
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    renderRail(rail) {
        this.ctx.fillStyle = this.colors.rail;
        this.ctx.strokeStyle = '#cbd5e1';
        this.ctx.lineWidth = 1;
        
        // Draw rail supports
        const numSupports = Math.floor(rail.length / 60);
        for (let i = 0; i <= numSupports; i++) {
            const x = rail.x + (rail.length * i / numSupports);
            this.ctx.fillRect(x - 2, rail.y, 4, rail.height);
        }
        
        // Draw rail bar
        this.ctx.fillStyle = '#94a3b8';
        this.ctx.fillRect(rail.x, rail.y - 3, rail.length, 6);
        
        // Highlight
        this.ctx.fillStyle = '#e2e8f0';
        this.ctx.fillRect(rail.x, rail.y - 3, rail.length, 2);
    }
    
    renderObstacle(obs) {
        // obs.y is now the BOTTOM (ground level), draw upward
        const topY = obs.y - obs.height;
        
        if (obs.type === 'tree') {
            // Draw tree trunk (bottom half)
            this.ctx.fillStyle = '#78350f';
            this.ctx.fillRect(obs.x + obs.width/2 - 5, topY + obs.height/2, 10, obs.height/2);
            
            // Foliage (triangle pointing up)
            this.ctx.fillStyle = this.colors.tree;
            this.ctx.beginPath();
            this.ctx.moveTo(obs.x + obs.width/2, topY); // Top point
            this.ctx.lineTo(obs.x, topY + obs.height/2); // Bottom left
            this.ctx.lineTo(obs.x + obs.width, topY + obs.height/2); // Bottom right
            this.ctx.closePath();
            this.ctx.fill();
            
            // Add some depth
            this.ctx.fillStyle = '#166534';
            this.ctx.beginPath();
            this.ctx.moveTo(obs.x + obs.width/2, topY + 10);
            this.ctx.lineTo(obs.x + 5, topY + obs.height/2);
            this.ctx.lineTo(obs.x + obs.width - 5, topY + obs.height/2);
            this.ctx.closePath();
            this.ctx.fill();
        } else {
            // Draw rock (sitting on ground)
            const centerY = obs.y - obs.height/2;
            
            this.ctx.fillStyle = this.colors.rock;
            this.ctx.strokeStyle = '#292524';
            this.ctx.lineWidth = 2;
            
            this.ctx.beginPath();
            this.ctx.ellipse(
                obs.x + obs.width/2,
                centerY,
                obs.width/2,
                obs.height/2,
                0, 0, Math.PI * 2
            );
            this.ctx.fill();
            this.ctx.stroke();
            
            // Add highlight
            this.ctx.fillStyle = '#78716c';
            this.ctx.beginPath();
            this.ctx.ellipse(
                obs.x + obs.width/2 - 5,
                centerY - 5,
                obs.width/4,
                obs.height/4,
                0, 0, Math.PI * 2
            );
            this.ctx.fill();
        }
    }
    
    renderSkier(skier) {
        this.ctx.save();
        this.ctx.translate(skier.x, skier.y);
        this.ctx.rotate(skier.rotation);
        
        // Add prominent shadow so skier is always visible
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        this.ctx.shadowBlur = 15;
        this.ctx.shadowOffsetY = 8;
        
        // Draw skier body - use customizable color (check global variable directly)
        const color = window.selectedSkierColor || this.skierColor || '#7dd3fc';
        this.ctx.fillStyle = color;
        
        // Body (main)
        this.ctx.fillRect(-10, -15, 20, 30);
        
        // Head
        this.ctx.beginPath();
        this.ctx.arc(0, -20, 8, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Arms
        this.ctx.fillRect(-15, -8, 5, 12);
        this.ctx.fillRect(10, -8, 5, 12);
        
        // Skis
        this.ctx.shadowBlur = 5;
        this.ctx.fillStyle = '#1e3a8a';
        this.ctx.fillRect(-22, 12, 44, 4);
        
        // Ski highlights
        this.ctx.fillStyle = '#3b82f6';
        this.ctx.fillRect(-22, 12, 44, 1);
        
        // Add highlight to show movement
        if (skier.isAirborne) {
            this.ctx.shadowBlur = 0;
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 2;
            this.ctx.globalAlpha = 0.6;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 30, 0, Math.PI * 2);
            this.ctx.stroke();
            
            // Speed lines when airborne
            this.ctx.globalAlpha = 0.4;
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 2;
            for (let i = 0; i < 3; i++) {
                this.ctx.beginPath();
                this.ctx.moveTo(-35 - i * 10, -5 + i * 5);
                this.ctx.lineTo(-45 - i * 10, -5 + i * 5);
                this.ctx.stroke();
            }
        }
        
        // Add glow effect on jacket
        this.ctx.shadowBlur = 0;
        this.ctx.globalAlpha = 0.5;
        this.ctx.fillStyle = color;
        this.ctx.fillRect(-10, -8, 20, 4);
        
        this.ctx.restore();
    }
    
    renderTrickText(x, y, tricks) {
        if (tricks.length === 0) return;
        
        this.ctx.save();
        this.ctx.font = 'bold 24px "Outfit", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'bottom';
        
        // Draw trick names
        const trickNames = tricks.map(t => t.name).join(' + ');
        
        // Glowing effect
        this.ctx.shadowColor = this.colors.primary;
        this.ctx.shadowBlur = 10;
        
        // Text shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillText(trickNames, x + 2, y + 2);
        
        // Main text
        this.ctx.shadowBlur = 15;
        this.ctx.fillStyle = this.colors.primary;
        this.ctx.fillText(trickNames, x, y);
        
        // Show pending score
        const pendingScore = tricks.reduce((sum, t) => sum + t.points, 0);
        this.ctx.font = 'bold 18px "Inter", sans-serif';
        this.ctx.shadowColor = '#fbbf24';
        this.ctx.fillStyle = '#fbbf24';
        this.ctx.fillText(`+${pendingScore}`, x, y - 30);
        
        this.ctx.restore();
    }
    
    renderParticles(skier) {
        this.ctx.save();
        
        for (const particle of skier.particles) {
            this.ctx.globalAlpha = particle.life;
            this.ctx.fillStyle = this.colors.snow;
            
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }
    
    renderBackgroundMountains() {
        // Draw distant mountains in the background
        this.ctx.fillStyle = 'rgba(100, 120, 140, 0.3)';
        
        // Mountain 1 (left)
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.height * 0.75);
        this.ctx.lineTo(this.width * 0.3, this.height * 0.35);
        this.ctx.lineTo(this.width * 0.5, this.height * 0.75);
        this.ctx.fill();
        
        // Mountain 2 (center)
        this.ctx.fillStyle = 'rgba(80, 100, 120, 0.4)';
        this.ctx.beginPath();
        this.ctx.moveTo(this.width * 0.3, this.height * 0.75);
        this.ctx.lineTo(this.width * 0.5, this.height * 0.3);
        this.ctx.lineTo(this.width * 0.7, this.height * 0.75);
        this.ctx.fill();
        
        // Mountain 3 (right)
        this.ctx.fillStyle = 'rgba(60, 80, 100, 0.5)';
        this.ctx.beginPath();
        this.ctx.moveTo(this.width * 0.6, this.height * 0.75);
        this.ctx.lineTo(this.width * 0.85, this.height * 0.4);
        this.ctx.lineTo(this.width, this.height * 0.75);
        this.ctx.fill();
    }
    
    renderUI(distance, score, speed, multiplier) {
        // Note: Most UI is handled by HTML, but we can add canvas-based overlays here
        
        // Draw score popup when landing tricks
        // This could be expanded for more visual feedback
    }
}
