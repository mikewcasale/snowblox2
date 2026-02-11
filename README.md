# Mountain Storm - Downhill Trick Challenge

A trick-based skiing game built with HTML5 Canvas and vanilla JavaScript, featuring procedurally generated terrain, combo tricks, and a beautiful storm-themed aesthetic.

## 🎮 How to Play

### Controls
- **Arrow Left/Right**: Steer your skier
- **Arrow Up or Space**: Jump (when on ground)
- **1**: Backflip (100 points)
- **2**: Frontflip (100 points)
- **3**: 360 Spin (150 points)
- **4**: Method Grab (75 points)
- **Space (while airborne)**: Chain tricks to increase multiplier

### Gameplay
- Navigate down the mountain, avoiding obstacles (trees and rocks)
- Hit ramps to launch into the air
- Perform tricks while airborne
- Chain multiple tricks together for combo multipliers
- Land upright (within 45° of vertical) or crash!
- The longer your air time, the bigger your bonus
- Distance increases difficulty - more obstacles and tighter spacing

### Scoring
- Base points for each trick
- Combo multiplier increases with successful landings (x1.5, x2.0, etc.)
- Multiple tricks in one jump earn bonus points
- Air time bonuses: 20% for 1+ seconds, 50% for 2+ seconds

## 🚀 Getting Started

Simply open `code.html` in a modern web browser. No build process or dependencies required!

```bash
# Option 1: Direct file open
open code.html

# Option 2: Local server (recommended)
python -m http.server 8000
# Then navigate to http://localhost:8000/code.html
```

## 🏗️ Architecture

### File Structure
```
snowblox2/
├── code.html          # Main HTML with UI and styling
├── js/
│   ├── game.js        # Main game loop and state management
│   ├── skier.js       # Player physics and controls
│   ├── terrain.js     # Procedural terrain generation
│   ├── tricks.js      # Trick system and scoring
│   └── renderer.js    # Canvas rendering
└── README.md
```

### Key Systems

**Game Loop** (`game.js`)
- 60 FPS game loop using requestAnimationFrame
- Manages game state, scoring, and UI updates
- Handles collision detection and game over states

**Skier Physics** (`skier.js`)
- Gravity-based downhill movement
- Air/ground state management
- Rotation and momentum
- Particle system for snow effects

**Terrain Generation** (`terrain.js`)
- Procedural generation of ground, ramps, rails, and obstacles
- Dynamic scrolling as player descends
- Difficulty scaling over distance

**Trick System** (`tricks.js`)
- Input handling for trick combos
- Landing validation based on rotation
- Combo multiplier calculation
- Airtime-based bonuses

**Renderer** (`renderer.js`)
- Canvas-based rendering
- Terrain, skier, and particle drawing
- Visual effects for tricks and landings

## 🎨 Design Features

- **Storm Theme**: Dark, atmospheric visuals with lightning and rain effects
- **Smooth Animations**: Rotation, particles, and floating elements
- **Real-time UI**: Live updates of speed, score, multiplier, and distance
- **Responsive Canvas**: Adapts to window size
- **Modern UI**: Tailwind CSS with glassmorphism effects

## 🔧 Technical Details

- **Pure JavaScript**: No frameworks, just ES6 modules
- **HTML5 Canvas**: Hardware-accelerated 2D rendering
- **CSS**: Tailwind CSS via CDN for styling
- **Performance**: 60 FPS target with delta-time physics

## 🎯 Game Tips

1. **Speed Management**: Faster speeds make steering harder but increase air time
2. **Ramp Timing**: Jump right as you hit a ramp for maximum height
3. **Trick Chaining**: Press Space between tricks while airborne to boost multiplier
4. **Landing**: Focus on landing upright - failed tricks lose all points!
5. **Obstacle Avoidance**: Watch ahead for trees and rocks
6. **Rails**: Grind rails for bonus points without the landing risk

## 🚧 Future Enhancements

Potential features for expansion:
- Sound effects and background music
- Additional trick types (inverts, tweaks)
- Power-ups and collectibles
- Multiple mountains/levels
- Local high score persistence
- More obstacle types
- Weather variations

## 📝 License

This project is open source and available for educational and personal use.

---

**Built with ❄️ by the Snowblox team**

Enjoy the slopes and try to beat your high score!
