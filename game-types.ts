// Game types and constants for top-down adventure game

export interface Vector2 {
  x: number;
  y: number;
}

export interface GameObject {
  id: string;
  position: Vector2;
  velocity: Vector2;
  width: number;
  height: number;
  rotation: number;
}

export interface Player extends GameObject {
  health: number;
  maxHealth: number;
  lastShotTime: number;
  shootCooldown: number;
}

export interface Enemy extends GameObject {
  health: number;
  maxHealth: number;
  type: 'basic' | 'medium' | 'strong';
  lastShotTime: number;
  shootCooldown: number;
  shootRange: number;
  speed: number;
}

export interface Bullet extends GameObject {
  owner: 'player' | 'enemy';
  damage: number;
  lifespan: number;
  createdAt: number;
}

export interface GameState {
  player: Player;
  enemies: Enemy[];
  bullets: Bullet[];
  score: number;
  wave: number;
  gameOver: boolean;
  gamePaused: boolean;
  difficulty: 'easy' | 'normal' | 'hard';
  elapsedTime: number;
  combo: number;
  lastKillTime: number;
}

export const GAME_CONFIG = {
  SCREEN_WIDTH: 375,
  SCREEN_HEIGHT: 667,
  PLAYER_SIZE: 40,
  PLAYER_SPEED: 200,
  PLAYER_HEALTH: 100,
  PLAYER_SHOOT_COOLDOWN: 300,
  
  ENEMY_SIZES: {
    basic: 30,
    medium: 40,
    strong: 50,
  },
  
  ENEMY_HEALTH: {
    basic: 1,
    medium: 2,
    strong: 3,
  },
  
  ENEMY_SPEED: {
    basic: 80,
    medium: 100,
    strong: 60,
  },
  
  ENEMY_SHOOT_COOLDOWN: {
    basic: 1000,
    medium: 800,
    strong: 600,
  },
  
  ENEMY_SHOOT_RANGE: 300,
  
  BULLET_SIZE: 8,
  BULLET_SPEED: 400,
  BULLET_DAMAGE: 1,
  BULLET_LIFESPAN: 5000,
  
  SPAWN_MARGIN: 20,
  COLLISION_RADIUS_MULTIPLIER: 0.5,
  
  DIFFICULTY_MULTIPLIERS: {
    easy: { enemySpeed: 0.6, playerHealth: 3, enemyHealth: 0.5, shootCooldown: 1.5 },
    normal: { enemySpeed: 1, playerHealth: 1, enemyHealth: 1, shootCooldown: 1 },
    hard: { enemySpeed: 1.4, playerHealth: 0.5, enemyHealth: 1.5, shootCooldown: 0.7 },
  },
  
  WAVE_CONFIG: {
    baseEnemies: 3,
    enemyIncrement: 2,
    spawnDelay: 500,
  },
  
  COMBO_TIMEOUT: 2000,
  
  SCORE_VALUES: {
    basic: 10,
    medium: 25,
    strong: 50,
  },
};

export const COLORS = {
  player: '#4CAF50',
  enemyBasic: '#F44336',
  enemyMedium: '#FF9800',
  enemyStrong: '#9C27B0',
  playerBullet: '#FFC107',
  enemyBullet: '#FF6B6B',
  background: '#1A1A2E',
  healthBarFull: '#4CAF50',
  healthBarLow: '#F44336',
  text: '#FFFFFF',
};
