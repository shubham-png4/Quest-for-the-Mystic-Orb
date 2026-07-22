import React, { createContext, useContext, useReducer, useCallback, useRef, useEffect } from 'react';
import { GameState, Player, Enemy, Bullet, GAME_CONFIG, Vector2 } from './game-types';
import { generateId, calculateDistance, checkCircleCollision } from './game-utils';

type GameAction =
  | { type: 'INIT_GAME'; difficulty: 'easy' | 'normal' | 'hard' }
  | { type: 'UPDATE_GAME'; deltaTime: number }
  | { type: 'MOVE_PLAYER'; direction: Vector2 }
  | { type: 'SHOOT_PLAYER'; targetX: number; targetY: number }
  | { type: 'PAUSE_GAME' }
  | { type: 'RESUME_GAME' }
  | { type: 'GAME_OVER' }
  | { type: 'NEXT_WAVE' }
  | { type: 'RESET_GAME' };

interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  movePlayer: (direction: Vector2) => void;
  shootPlayer: (targetX: number, targetY: number) => void;
  pauseGame: () => void;
  resumeGame: () => void;
  resetGame: () => void;
  setDifficulty: (difficulty: 'easy' | 'normal' | 'hard') => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const initialGameState: GameState = {
  player: {
    id: 'player',
    position: { x: GAME_CONFIG.SCREEN_WIDTH / 2, y: GAME_CONFIG.SCREEN_HEIGHT - 80 },
    velocity: { x: 0, y: 0 },
    width: GAME_CONFIG.PLAYER_SIZE,
    height: GAME_CONFIG.PLAYER_SIZE,
    rotation: 0,
    health: GAME_CONFIG.PLAYER_HEALTH,
    maxHealth: GAME_CONFIG.PLAYER_HEALTH,
    lastShotTime: 0,
    shootCooldown: GAME_CONFIG.PLAYER_SHOOT_COOLDOWN,
  },
  enemies: [],
  bullets: [],
  score: 0,
  wave: 1,
  gameOver: false,
  gamePaused: false,
  difficulty: 'normal',
  elapsedTime: 0,
  combo: 0,
  lastKillTime: 0,
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'INIT_GAME': {
      const newState = { ...initialGameState, difficulty: action.difficulty };
      const multiplier = GAME_CONFIG.DIFFICULTY_MULTIPLIERS[action.difficulty];
      newState.player.maxHealth = GAME_CONFIG.PLAYER_HEALTH * multiplier.playerHealth;
      newState.player.health = newState.player.maxHealth;
      return newState;
    }

    case 'PAUSE_GAME':
      return { ...state, gamePaused: true };

    case 'RESUME_GAME':
      return { ...state, gamePaused: false };

    case 'GAME_OVER':
      return { ...state, gameOver: true, gamePaused: true };

    case 'RESET_GAME':
      return initialGameState;

    case 'MOVE_PLAYER': {
      const newPlayer = { ...state.player };
      const speed = GAME_CONFIG.PLAYER_SPEED;
      newPlayer.velocity = {
        x: action.direction.x * speed,
        y: action.direction.y * speed,
      };
      return { ...state, player: newPlayer };
    }

    case 'SHOOT_PLAYER': {
      const now = Date.now();
      if (now - state.player.lastShotTime < state.player.shootCooldown) {
        return state;
      }

      const dx = action.targetX - state.player.position.x;
      const dy = action.targetY - state.player.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const dirX = distance > 0 ? dx / distance : 0;
      const dirY = distance > 0 ? dy / distance : 0;

      const newBullet: Bullet = {
        id: generateId(),
        position: {
          x: state.player.position.x + dirX * 20,
          y: state.player.position.y + dirY * 20,
        },
        velocity: {
          x: dirX * GAME_CONFIG.BULLET_SPEED,
          y: dirY * GAME_CONFIG.BULLET_SPEED,
        },
        width: GAME_CONFIG.BULLET_SIZE,
        height: GAME_CONFIG.BULLET_SIZE,
        rotation: Math.atan2(dirY, dirX),
        owner: 'player',
        damage: GAME_CONFIG.BULLET_DAMAGE,
        lifespan: GAME_CONFIG.BULLET_LIFESPAN,
        createdAt: now,
      };

      const newPlayer = { ...state.player, lastShotTime: now };
      return {
        ...state,
        player: newPlayer,
        bullets: [...state.bullets, newBullet],
      };
    }

    case 'UPDATE_GAME': {
      if (state.gamePaused || state.gameOver) {
        return state;
      }

      const deltaTime = action.deltaTime;
      let newState = { ...state, elapsedTime: state.elapsedTime + deltaTime };

      // Update player position
      const newPlayer = { ...newState.player };
      newPlayer.position.x += newPlayer.velocity.x * (deltaTime / 1000);
      newPlayer.position.y += newPlayer.velocity.y * (deltaTime / 1000);

      // Clamp player position
      newPlayer.position.x = Math.max(
        newPlayer.width / 2,
        Math.min(GAME_CONFIG.SCREEN_WIDTH - newPlayer.width / 2, newPlayer.position.x)
      );
      newPlayer.position.y = Math.max(
        newPlayer.height / 2,
        Math.min(GAME_CONFIG.SCREEN_HEIGHT - newPlayer.height / 2, newPlayer.position.y)
      );

      newState.player = newPlayer;

      // Update bullets
      let newBullets = newState.bullets
        .map((bullet) => ({
          ...bullet,
          position: {
            x: bullet.position.x + bullet.velocity.x * (deltaTime / 1000),
            y: bullet.position.y + bullet.velocity.y * (deltaTime / 1000),
          },
        }))
        .filter((bullet) => {
          const age = Date.now() - bullet.createdAt;
          return (
            age < bullet.lifespan &&
            bullet.position.x > -50 &&
            bullet.position.x < GAME_CONFIG.SCREEN_WIDTH + 50 &&
            bullet.position.y > -50 &&
            bullet.position.y < GAME_CONFIG.SCREEN_HEIGHT + 50
          );
        });

      // Update enemies
      let newEnemies = newState.enemies.map((enemy) => {
        const dx = newState.player.position.x - enemy.position.x;
        const dy = newState.player.position.y - enemy.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const multiplier = GAME_CONFIG.DIFFICULTY_MULTIPLIERS[newState.difficulty];
        const speed = enemy.speed * multiplier.enemySpeed;

        return {
          ...enemy,
          position: {
            x: enemy.position.x + (dx / distance) * speed * (deltaTime / 1000),
            y: enemy.position.y + (dy / distance) * speed * (deltaTime / 1000),
          },
        };
      });

      // Check collisions: bullets vs enemies
      let score = newState.score;
      let combo = newState.combo;
      let lastKillTime = newState.lastKillTime;

      newEnemies = newEnemies.filter((enemy) => {
        let enemyHealth = enemy.health;
        newBullets = newBullets.filter((bullet) => {
          if (bullet.owner === 'player' && checkCircleCollision(bullet, enemy)) {
            enemyHealth -= bullet.damage;
            return false;
          }
          return true;
        });

        if (enemyHealth < enemy.health) {
          enemy.health = enemyHealth;
        }

        if (enemy.health <= 0) {
          const now = Date.now();
          if (now - lastKillTime < GAME_CONFIG.COMBO_TIMEOUT) {
            combo += 1;
          } else {
            combo = 1;
          }
          lastKillTime = now;
          score += GAME_CONFIG.SCORE_VALUES[enemy.type] * combo;
          return false;
        }

        return true;
      });

      // Check collisions: enemy bullets vs player
      let playerHealth = newState.player.health;
      newBullets = newBullets.filter((bullet) => {
        if (bullet.owner === 'enemy' && checkCircleCollision(bullet, newState.player)) {
          playerHealth -= bullet.damage;
          return false;
        }
        return true;
      });

      // Check collisions: enemies vs player
      newEnemies.forEach((enemy) => {
        if (checkCircleCollision(enemy, newState.player)) {
          playerHealth -= 10;
        }
      });

      newState.player.health = playerHealth;
      newState.bullets = newBullets;
      newState.enemies = newEnemies;
      newState.score = score;
      newState.combo = combo;
      newState.lastKillTime = lastKillTime;

      // Check game over
      if (newState.player.health <= 0) {
        newState.gameOver = true;
        newState.gamePaused = true;
      }

      // Spawn next wave if all enemies defeated
      if (newState.enemies.length === 0 && newState.elapsedTime > 0) {
        newState.wave += 1;
      }

      return newState;
    }

    default:
      return state;
  }
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);

  const movePlayer = useCallback((direction: Vector2) => {
    dispatch({ type: 'MOVE_PLAYER', direction });
  }, []);

  const shootPlayer = useCallback((targetX: number, targetY: number) => {
    dispatch({ type: 'SHOOT_PLAYER', targetX, targetY });
  }, []);

  const pauseGame = useCallback(() => {
    dispatch({ type: 'PAUSE_GAME' });
  }, []);

  const resumeGame = useCallback(() => {
    dispatch({ type: 'RESUME_GAME' });
  }, []);

  const resetGame = useCallback(() => {
    dispatch({ type: 'RESET_GAME' });
  }, []);

  const setDifficulty = useCallback((difficulty: 'easy' | 'normal' | 'hard') => {
    dispatch({ type: 'INIT_GAME', difficulty });
  }, []);

  const value: GameContextType = {
    state,
    dispatch,
    movePlayer,
    shootPlayer,
    pauseGame,
    resumeGame,
    resetGame,
    setDifficulty,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
