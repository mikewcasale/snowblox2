export class Skier {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 30;
        
        // Physics
        this.velocity = { x: 0, y: 0 };
        this.acceleration = { x: 0, y: 0 };
        this.rotation = 0;
        this.rotationVelocity = 0;
        
        // State
        this.isAirborne = false;
        this.isGrounded = true;
        this.isGrinding = false;
        this.airTime = 0;
        this.groundAngle = 0;
        
        // Fixed screen position
        this.targetY = y;
        this.targetX = x;
        
        // Physics constants
        this.gravity = 800;
        this.maxSpeed = 220;
        this.minSpeed = 40;
        this.acceleration_rate = 140;
        this.steering_force = 180;
        this.jump_force = -450;
        this.friction = 0.98;
        this.airResistance = 0.99;
        this.rotationDamping = 0.95;
        
        // Jump state
        this.canJump = true;
        this.jumpCooldown = 0;
        
        // Landing invincibility
        this.landingInvincibility = 0;
        
        // Flip state
        this.isFlipping = false;
        this.flipDirection = 0;
        this.flipProgress = 0;
        this.flipSpeed = 0.7;
        this.flipStartRotation = 0;
        
        // Particles for effects
        this.particles = [];
        
        // Animation state
        this.animationTime = 0;
    }
    
    update(deltaTime, input) {
        this.animationTime += deltaTime;
        
        // Reset acceleration
        this.acceleration.x = 0;
        this.acceleration.y = 0;
        
        if (this.isGrounded) {
            this.updateGrounded(deltaTime, input);
        } else {
            this.updateAirborne(deltaTime, input);
        }
        
        // Apply acceleration to velocity
        this.velocity.x += this.acceleration.x * deltaTime;
        this.velocity.y += this.acceleration.y * deltaTime;
        
        // Clamp speeds
        if (!this.isAirborne) {
            this.velocity.y = Math.min(this.velocity.y, this.maxSpeed);
            this.velocity.y = Math.max(this.velocity.y, this.minSpeed);
        } else {
            this.velocity.y = Math.min(this.velocity.y, this.maxSpeed * 2);
        }
        this.velocity.x = Math.max(-150, Math.min(150, this.velocity.x));
        
        // Update position
        this.x = this.targetX;
        
        if (this.isAirborne) {
            this.y += this.velocity.y * deltaTime;
            
            if (this.y >= this.targetY) {
                this.land(this.targetY);
            }
        } else {
            this.y = this.targetY;
        }
        
        // Update rotation
        if (this.isFlipping && this.isAirborne) {
            this.flipProgress += deltaTime / this.flipSpeed;
            if (this.flipProgress >= 1.0) {
                this.flipProgress = 1.0;
                this.isFlipping = false;
                this.rotation = this.flipStartRotation + (this.flipDirection * Math.PI * 2);
                this.rotationVelocity = 0;
            } else {
                this.rotation = this.flipStartRotation + (this.flipDirection * Math.PI * 2 * this.flipProgress);
            }
        } else {
            this.rotation += this.rotationVelocity * deltaTime;
            this.rotationVelocity *= this.rotationDamping;
        }
        
        // Update cooldowns
        if (this.jumpCooldown > 0) {
            this.jumpCooldown -= deltaTime;
        }
        
        if (this.landingInvincibility > 0) {
            this.landingInvincibility -= deltaTime;
        }
        
        if (this.isAirborne) {
            this.airTime += deltaTime;
        }
        
        // Update particles
        this.updateParticles(deltaTime);
        
        // Generate snow spray when moving fast on ground
        if (this.isGrounded && Math.abs(this.velocity.y) > 150 && Math.random() < 0.3) {
            this.addSnowParticle();
        }
    }
    
    updateGrounded(deltaTime, input) {
        // Constant forward speed
        this.velocity.y = this.maxSpeed * 0.6;
        this.velocity.x = 0;
        
        // Jump
        if (input.jump && this.canJump) {
            this.jump();
        }
        
        // Keep rotation minimal when grounded
        this.rotation *= 0.9;
    }
    
    updateAirborne(deltaTime, input) {
        // Apply gravity
        this.acceleration.y += this.gravity;
        
        // No horizontal control in air
        this.velocity.x = 0;
        
        // Air resistance
        this.velocity.y *= this.airResistance;
    }
    
    jump() {
        this.velocity.y = this.jump_force;
        this.isAirborne = true;
        this.isGrounded = false;
        this.canJump = false;
        this.jumpCooldown = 0.2;
        this.airTime = 0;
        this.landingInvincibility = 1.0;
        
        // Add upward rotation when jumping
        this.rotationVelocity = -1;
        
        // Create jump particles
        for (let i = 0; i < 5; i++) {
            this.addSnowParticle();
        }
    }
    
    land(groundY, groundAngle = 0) {
        this.y = this.targetY;
        this.isAirborne = false;
        this.isGrounded = true;
        this.canJump = true;
        this.airTime = 0;
        this.groundAngle = groundAngle;
        
        // Reset flip state
        this.isFlipping = false;
        this.flipProgress = 0;
        
        // Give invincibility after landing
        this.landingInvincibility = 1.0;
        
        // Landing impact
        this.velocity.y *= 0.95;
        
        // Create landing particles
        for (let i = 0; i < 10; i++) {
            this.addSnowParticle();
        }
        
        // Reset rotation if landing is good
        if (Math.abs(this.rotation) < Math.PI / 4) {
            this.rotation = groundAngle;
            this.rotationVelocity = 0;
        }
    }
    
    hitRamp(rampAngle, boost = 1.5) {
        // Launch off ramp
        this.velocity.y = this.jump_force * boost;
        
        this.isAirborne = true;
        this.isGrounded = false;
        this.canJump = false;
        this.airTime = 0;
        
        // Add rotation based on ramp angle
        this.rotationVelocity = -2;
    }
    
    grindRail(rail) {
        this.isGrinding = true;
        this.y = rail.y;
        this.velocity.y = Math.abs(this.velocity.y);
    }
    
    performFlip(direction) {
        if (this.isAirborne && !this.isFlipping) {
            this.isFlipping = true;
            this.flipDirection = direction;
            this.flipProgress = 0;
            this.flipStartRotation = this.rotation;
            this.rotationVelocity = 0;
        }
    }
    
    performSpin(direction) {
        if (this.isAirborne) {
            this.rotationVelocity += direction * 10;
        }
    }
    
    addSnowParticle() {
        this.particles.push({
            x: this.x,
            y: this.y + this.height / 2,
            vx: (Math.random() - 0.5) * 100,
            vy: Math.random() * 50 - 100,
            life: 1.0,
            size: Math.random() * 3 + 1
        });
    }
    
    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.vy += 300 * deltaTime;
            p.life -= deltaTime * 2;
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    getBounds() {
        return {
            left: this.x - this.width / 2,
            right: this.x + this.width / 2,
            top: this.y - this.height / 2,
            bottom: this.y + this.height / 2,
            centerX: this.x,
            centerY: this.y
        };
    }
}
