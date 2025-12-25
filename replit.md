# Habbo Games - Multi-Game Arcade Platform

## Overview
A full-stack JavaScript application hosting multiple games from the Habbo universe with leaderboards and ranking systems. Game rankings are saved to a public PostgreSQL database on Railway.

## Project Structure
- **Frontend**: React + Vite (client/src)
- **Backend**: Express.js server
- **Database**: PostgreSQL on Railway (Public proxy URL)
- **Games**:
  1. **Habbo Catcher** - Catch falling rare furniture items with 21+ boost mechanics
  2. **Beat 'Em Up** - Action fighting game
  3. **Habbo Tekken** - Advanced multiplayer fighting game with intelligent AI

## Database Configuration
- **Provider**: Railway (Public PostgreSQL Database)
- **Connection URL**: `postgresql://postgres:BMYIUPUTJPZzwpAJLEUwkXIzEttjbiRF@mainline.proxy.rlwy.net:54620/railway`
- **Environment Variable**: `RAILWAY_DATABASE_URL` (in shared environment)

### Database Tables
1. **users** - Player profiles and rankings
   - `id`: Primary key (serial)
   - `username`: Player name (unique)
   - `highScore`: Best score from Habbo Catcher (updated only if new score > current)
   - `figureString`: Habbo avatar appearance string
   - `updatedAt`: Last update timestamp

2. **tekkenSessions** - Multiplayer match data
   - `id`: Primary key (serial)
   - `sessionId`: Unique session identifier
   - `player1`: First player username
   - `player2`: Second player username
   - `player1Hp`/`player2Hp`: Health points during match
   - `winner`: Winner username (if game finished)
   - `createdAt`: Match creation time

## Habbo Catcher - Rankings System
**How Rankings Work:**
1. Player enters Habbo username
2. Game fetches user's figure/avatar from Habbo API (with multi-server fallback)
3. Player plays the game and accumulates score
4. **Game Over**: Frontend calls `POST /api/scores`
5. Backend compares new score with existing `highScore` in database
6. **Only updates if**: `newScore > oldScore`
7. Leaderboard displays top 10 players from database

**Ranking Storage:**
- Field: `users.highScore`
- Automatically persisted to Railway PostgreSQL
- Real-time global leaderboard for all players

## Habbo Tekken - Improved AI System
**Advanced AI Opponent Features:**
- **Intelligent Hunting**: IA continuamente busca y persigue al jugador
- **Item Collection**: IA automáticamente detecta y recolecta items/vidas que caen
- **Jump Mechanics**: IA salta para alcanzar items en el aire y esquivar ataques
- **Aggressive Combat**: Ataca cada 1.2 segundos con 75% de probabilidad
- **Evasion**: IA salta aleatoriamente para esquivar ataques del jugador
- **Priority System**:
  1. Recoger items cercanos (máxima prioridad)
  2. Perseguir al jugador si está lejos
  3. Atacar cuando está cerca
- **Damage**: 30-55 HP por ataque

## API Endpoints

### Score Management
- `POST /api/scores` - Save game score (updates if new high score)
  - Body: `{ username, score, figureString? }`
  - Returns: Updated user record
- `GET /api/scores` - Get global leaderboard (top 10)
  - Returns: Array of top scoring users

### User Data
- `GET /api/users/:username/figure` - Get user's Habbo figure
  - Fetches from official Habbo API
  - Caches results for 1 hour
  - Tries multiple Habbo servers (ES, BR, FR, DE)

### Multiplayer (Tekken)
- `WebSocket /ws/tekken` - Real-time multiplayer fighting
- `POST /api/tekken/start` - Create match session
- `POST /api/tekken/join` - Join existing match
- `GET /api/tekken/status/:sessionId` - Check match status
- `POST /api/tekken/update` - Update match state

## Game Features

### Habbo Catcher
- **Rare Items**: 20+ collectable furniture with varying point values
- **Boost System** (21 boost types):
  - Point Multipliers: 2x, 3x, 5x, 10x Points
  - Size Effects: Size Up, Mega Size, Shrink Foe
  - Movement: Speed, Slow Time, Weak Gravity, Drift, Dash Boost
  - Special: Shield, Magnet, Mega Magnet, Invincible
  - Effects: Freeze, Bomb, Extra Life, Heal, Split, Chaos

- **Game Mechanics**:
  - Progressive difficulty (spawning gets faster)
  - Magnet attraction physics
  - Chaos random movement
  - Freeze time pause
  - Shield/Invincible protect from losing lives
  - Split boost duplicates all non-boost items

- **Rankings**: Persistent global leaderboard in Railway database

### Beat 'Em Up
- Action-based combat gameplay

### Habbo Tekken
- Real-time 1v1 multiplayer fighting
- **Intelligent AI** with hunting and item collection
- HP-based combat system (200 HP starting)
- Dynamic item drops for healing (+50 HP)
- Skill-based combat with attack and block mechanics
- WebSocket-powered matchmaking system

## Technology Stack
- **Frontend**: React 18, Vite, TailwindCSS, Shadcn UI
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time**: WebSockets for Tekken multiplayer
- **API Integration**: Habbo Origins API (multi-server fallback)

## Installation & Running

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Push database schema (if needed)
DATABASE_URL="postgresql://..." npm run db:push

# Build for production
npm run build
```

## Environment Variables
- `RAILWAY_DATABASE_URL`: Public PostgreSQL connection URL
- `DATABASE_URL`: Used by Drizzle ORM for database operations
- `SESSION_SECRET`: Session encryption key
- `NODE_ENV`: development or production

## Recent Updates (2025-12-22)
- ✅ Integrated Habbo Catcher rankings with Railway PostgreSQL database
- ✅ Fixed database connection to use public proxy URL
- ✅ Deployed 21 boost types with full visual feedback
- ✅ Replaced all emoji icons with proper lucide-react icons
- ✅ Corrected fetch timeout handling (LSP error fix)
- ✅ **Improved Habbo Tekken AI** with intelligent hunting and item collection
- ✅ All systems operational and live