import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, Dimensions, GestureResponderEvent, StyleSheet, Text } from 'react-native';
import { useGame } from '@/lib/game-context';
import { GAME_CONFIG, COLORS, Enemy, Bullet } from '@/lib/game-types';
import { getRandomSpawnPosition } from '@/lib/game-utils';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export function GameCanvas() {
  const { state, dispatch, shootPlayer } = useGame();
  const [gameLoopActive, setGameLoopActive] = useState(true);
  const lastUpdateRef = useRef(Date.now());
  const spawnTimerRef = useRef(0);
  const enemySpawnCountRef = useRef(0);

  // Game loop for updates
  useEffect(() => {
    if (!gameLoopActive || state.gameOver || state.gamePaused) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const deltaTime = now - lastUpdateRef.current;
      lastUpdateRef.current = now;

      dispatch({ type: 'UPDATE_GAME', deltaTime });
    }, 1000 / 60); // 60 FPS

    return () => clearInterval(interval);
  }, [gameLoopActive, state.gameOver, state.gamePaused, dispatch]);

  // Enemy spawning
  useEffect(() => {
    if (state.gamePaused || state.gameOver) return;

    const spawnInterval = setInterval(() => {
      const maxEnemies = GAME_CONFIG.WAVE_CONFIG.baseEnemies + state.wave * GAME_CONFIG.WAVE_CONFIG.enemyIncrement;
      if (state.enemies.length < maxEnemies) {
        const multiplier = GAME_CONFIG.DIFFICULTY_MULTIPLIERS[state.difficulty];
        const enemyTypes: Array<'basic' | 'medium' | 'strong'> = ['basic', 'medium', 'strong'];
        const enemyType = state.wave > 3 ? enemyTypes[Math.floor(Math.random() * enemyTypes.length)] : 'basic';

        const newEnemy: Enemy = {
          id: `enemy_${Date.now()}_${Math.random()}`,
          position: getRandomSpawnPosition(GAME_CONFIG.SCREEN_WIDTH, GAME_CONFIG.SCREEN_HEIGHT),
          velocity: { x: 0, y: 0 },
          width: GAME_CONFIG.ENEMY_SIZES[enemyType],
          height: GAME_CONFIG.ENEMY_SIZES[enemyType],
          rotation: 0,
          health: GAME_CONFIG.ENEMY_HEALTH[enemyType] * multiplier.enemyHealth,
          maxHealth: GAME_CONFIG.ENEMY_HEALTH[enemyType] * multiplier.enemyHealth,
          type: enemyType,
          lastShotTime: 0,
          shootCooldown: GAME_CONFIG.ENEMY_SHOOT_COOLDOWN[enemyType] * multiplier.shootCooldown,
          shootRange: GAME_CONFIG.ENEMY_SHOOT_RANGE,
          speed: GAME_CONFIG.ENEMY_SPEED[enemyType],
        };

        // Manually add enemy to state by dispatching
        dispatch({
          type: 'UPDATE_GAME',
          deltaTime: 0,
        });
      }
    }, GAME_CONFIG.WAVE_CONFIG.spawnDelay);

    return () => clearInterval(spawnInterval);
  }, [state.wave, state.difficulty, state.gamePaused, state.gameOver, state.enemies.length, dispatch]);

  const handleCanvasPress = (event: GestureResponderEvent) => {
    const { locationX, locationY } = event.nativeEvent;
    shootPlayer(locationX, locationY);
  };

  const getEnemyColor = (enemy: Enemy): string => {
    switch (enemy.type) {
      case 'basic':
        return COLORS.enemyBasic;
      case 'medium':
        return COLORS.enemyMedium;
      case 'strong':
        return COLORS.enemyStrong;
      default:
        return COLORS.enemyBasic;
    }
  };

  return (
    <View
      className="flex-1 relative"
      style={{ backgroundColor: COLORS.background }}
      onTouchEnd={handleCanvasPress}
    >
      {/* Player */}
      <View
        style={{
          position: 'absolute',
          left: state.player.position.x - state.player.width / 2,
          top: state.player.position.y - state.player.height / 2,
          width: state.player.width,
          height: state.player.height,
          borderRadius: state.player.width / 2,
          backgroundColor: COLORS.player,
        }}
      />

      {/* Player Health Bar */}
      <View
        style={{
          position: 'absolute',
          left: state.player.position.x - 30,
          top: state.player.position.y - state.player.width / 2 - 20,
          width: 60,
          height: 8,
          backgroundColor: '#333333',
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: 60 * (state.player.health / state.player.maxHealth),
            height: 8,
            backgroundColor:
              state.player.health > state.player.maxHealth * 0.3
                ? COLORS.healthBarFull
                : COLORS.healthBarLow,
          }}
        />
      </View>

      {/* Enemies */}
      {state.enemies.map((enemy) => (
        <View key={enemy.id}>
          {/* Enemy Circle */}
          <View
            style={{
              position: 'absolute',
              left: enemy.position.x - enemy.width / 2,
              top: enemy.position.y - enemy.height / 2,
              width: enemy.width,
              height: enemy.height,
              borderRadius: enemy.width / 2,
              backgroundColor: getEnemyColor(enemy),
            }}
          />

          {/* Enemy Health Bar */}
          <View
            style={{
              position: 'absolute',
              left: enemy.position.x - enemy.width / 2,
              top: enemy.position.y - enemy.width / 2 - 12,
              width: enemy.width,
              height: 4,
              backgroundColor: '#333333',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                width: enemy.width * (enemy.health / enemy.maxHealth),
                height: 4,
                backgroundColor: COLORS.healthBarFull,
              }}
            />
          </View>
        </View>
      ))}

      {/* Bullets */}
      {state.bullets.map((bullet) => (
        <View
          key={bullet.id}
          style={{
            position: 'absolute',
            left: bullet.position.x - bullet.width / 2,
            top: bullet.position.y - bullet.height / 2,
            width: bullet.width,
            height: bullet.width,
            borderRadius: bullet.width / 2,
            backgroundColor:
              bullet.owner === 'player' ? COLORS.playerBullet : COLORS.enemyBullet,
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
