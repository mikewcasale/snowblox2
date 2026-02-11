export class Skier {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 30;
        
        // Physics
        this.velocity = { x: 0, y: 0 };
        this.acceleration = { x: 0, y: 0 };
        this.rotation = 0; // Current rotation angle
        this.rotationVelocity = 0;
        
        // State
        this.isAirborne = false;
        this.isGrounded = true;
        this.isGrinding = false;
        this.airTime = 0;
        this.groundAngle = 0;
        
        // Fixed screen position for skier (Sneaky Sasquatch style - left side of screen)
        this.targetY = y;
        this.targetX = x; // Keep skier on left side
        
        // Constants - adjusted for Sneaky Sasquatch style
        this.gravity = 800; // Strong gravity for snappy jumps
        this.maxSpeed = 220; // max downhill speed
        this.minSpeed = 40; // minimum speed
        this.acceleration_rate = 140; // acceleration
        this.steering_force = 180; // steering
        this.jump_force = -450; // Much stronger jump to clear obstacles
        this.friction = 0.98;
        this.airResistance = 0.99;
        this.rotationDamping = 0.95;
        
        // Jump state
        this.canJump = true;
        this.jumpCooldown = 0;
        
        // Landing invincibility (brief period after landing where you can't crash)
        this.landingInvincibility = 0;
        
        // Flip state - for constant speed flips
        this.isFlipping = false;
        this.flipDirection = 0;
        this.flipProgress = 0; // 0 to 1 (full rotation)
        this.flipSpeed = 0.7; // Time to complete one full flip in seconds
        this.flipStartRotation = 0;
        
        // Particles for effects
        this.particles = [];
    }
    
    update(deltaTime, input) {
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
        
        // Clamp speeds - but allow negative Y velocity for jumping!
        // When airborne, allow full range of Y velocity for jumping/falling
        if (!this.isAirborne) {
            // Only clamp when grounded (forward speed)
            this.velocity.y = Math.min(this.velocity.y, this.maxSpeed);
            this.velocity.y = Math.max(this.velocity.y, this.minSpeed);
        } else {
            // When airborne, just limit max falling speed
            this.velocity.y = Math.min(this.velocity.y, this.maxSpeed * 2);
        }
        this.velocity.x = Math.max(-150, Math.min(150, this.velocity.x));
        
        // Update position
        // In Sneaky Sasquatch style, skier stays at fixed X (left side of screen)
        this.x = this.targetX;
        
        // Update Y position only when airborne
        if (this.isAirborne) {
            this.y += this.velocity.y * deltaTime;
            
            // Check if we've landed (reached or passed ground level)
            if (this.y >= this.targetY) {
                this.land(this.targetY);
            }
        } else {
            // When grounded, maintain fixed Y position
            this.y = this.targetY;
        }
        
        // Update rotation - use constant speed if flipping
        if (this.isFlipping && this.isAirborne) {
            // Constant speed flip
            this.flipProgress += deltaTime / this.flipSpeed;
            if (this.flipProgress >= 1.0) {
                // Flip complete
                this.flipProgress = 1.0;
                this.isFlipping = false;
                this.rotation = this.flipStartRotation + (this.flipDirection * Math.PI * 2);
                this.rotationVelocity = 0;
            } else {
                // Smoothly rotate at constant speed
                this.rotation = this.flipStartRotation + (this.flipDirection * Math.PI * 2 * this.flipProgress);
            }
        } else {
            // Normal rotation with damping when not flipping
            this.rotation += this.rotationVelocity * deltaTime;
            this.rotationVelocity *= this.rotationDamping;
        }
        
        // Update jump cooldown
        if (this.jumpCooldown > 0) {
            this.jumpCooldown -= deltaTime;
        }
        
        // Update landing invincibility
        if (this.landingInvincibility > 0) {
            this.landingInvincibility -= deltaTime;
        }
        
        // Update airtime
        if (this.isAirborne) {
            this.airTime += deltaTime;
        }
        
        // Update particles
        this.updateParticles(deltaTime);
        
        // Generate snow spray particles when moving fast on ground
        if (this.isGrounded && Math.abs(this.velocity.y) > 150 && Math.random() < 0.3) {
            this.addSnowParticle();
        }
    }
    
    updateGrounded(deltaTime, input) {
        // Constant forward speed (Sneaky Sasquatch style - auto-run)
        this.velocity.y = this.maxSpeed * 0.6; // Constant downhill speed
        this.velocity.x = 0; // No horizontal movement
        
        // Jump - more responsive (Sneaky Sasquatch style)
        if (input.jump && this.canJump) {
            this.jump();
        }
        
        // Keep rotation minimal when grounded
        this.rotation *= 0.9;
    }
    
    updateAirborne(deltaTime, input) {
        // Apply gravity
        this.acceleration.y += this.gravity;
        
        // No horizontal control in air (Sneaky Sasquatch style)
        this.velocity.x = 0;
        
        // Air resistance
        this.velocity.y *= this.airResistance;
    }
    
    jump() {
        this.velocity.y = this.jump_force;
        this.isAirborne = true;
        this.isGrounded = false;
        this.canJump = false;
        this.jumpCooldown = 0.2; // Shorter cooldown for more responsive jumping
        this.airTime = 0;
        this.landingInvincibility = 1.0; // Invincible during and after jump
        
        // Add some upward rotation when jumping
        this.rotationVelocity = -1;
        
        // Create jump particles
        for (let i = 0; i < 5; i++) {
            this.addSnowParticle();
        }
    }
    
    land(groundY, groundAngle = 0) {
        // Return to target Y position when landing
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
        this.landingInvincibility = 1.0; // 1 second of invincibility
        
        // Landing impact - reduce speed slightly
        this.velocity.y *= 0.95;
        
        // Create landing particles
        for (let i = 0; i < 10; i++) {
            this.addSnowParticle();
        }
        
        // Reset rotation if landing is good (within tolerance)
        if (Math.abs(this.rotation) < Math.PI / 4) {
            this.rotation = groundAngle;
            this.rotationVelocity = 0;
        }
    }
    
    hitRamp(rampAngle, boost = 1.5) {
        // Launch off ramp - Sneaky Sasquatch style (automatic launch)
        // Give a strong upward velocity when hitting a ramp
        this.velocity.y = this.jump_force * boost; // Strong upward launch
        
        this.isAirborne = true;
        this.isGrounded = false;
        this.canJump = false; // Can't double-jump off ramp
        this.airTime = 0;
        
        // Add rotation based on ramp angle
        this.rotationVelocity = -2;
    }
    
    grindRail(rail) {
        this.isGrinding = true;
        this.y = rail.y;
        // Maintain speed on rail
        this.velocity.y = Math.abs(this.velocity.y);
    }
    
    performFlip(direction) {
        if (this.isAirborne && !this.isFlipping) {
            // direction: 1 for backflip, -1 for frontflip
            this.isFlipping = true;
            this.flipDirection = direction;
            this.flipProgress = 0;
            this.flipStartRotation = this.rotation;
            this.rotationVelocity = 0; // Stop any existing rotation
        }
    }
    
    performSpin(direction) {
        if (this.isAirborne) {
            // direction: 1 for clockwise, -1 for counter-clockwise
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
            p.vy += 300 * deltaTime; // Gravity on particles
            p.life -= deltaTime * 2;
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    getBounds() {
        // Return collision bounds
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
