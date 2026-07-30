import React, { useState, useRef, useEffect } from 'react';
import { View, Pressable, StyleSheet, Dimensions } from 'react-native';
import { useGame } from '@/lib/game-context';
import { COLORS } from '@/lib/game-types';

const { width: screenWidth } = Dimensions.get('window');

interface JoystickState {
  x: number;
  y: number;
  isActive: boolean;
}

export function GameControls() {
  const { movePlayer } = useGame();
  const [joystickState, setJoystickState] = useState<JoystickState>({
    x: 0,
    y: 0,
    isActive: false,
  });

  const joystickCenterRef = useRef({ x: 0, y: 0 });
  const joystickRadiusRef = useRef(50);

  const handleJoystickStart = (event: any) => {
    const { locationX, locationY } = event.nativeEvent;
    joystickCenterRef.current = { x: locationX, y: locationY };
    setJoystickState({ x: 0, y: 0, isActive: true });
  };

  const handleJoystickMove = (event: any) => {
    if (!joystickState.isActive) return;

    const { locationX, locationY } = event.nativeEvent;
    const dx = locationX - joystickCenterRef.current.x;
    const dy = locationY - joystickCenterRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const radius = joystickRadiusRef.current;

    let normalizedX = 0;
    let normalizedY = 0;

    if (distance > 0) {
      const ratio = Math.min(distance, radius) / radius;
      normalizedX = (dx / distance) * ratio;
      normalizedY = (dy / distance) * ratio;
    }

    setJoystickState({
      x: normalizedX,
      y: normalizedY,
      isActive: true,
    });

    movePlayer({ x: normalizedX, y: normalizedY });
  };

  const handleJoystickEnd = () => {
    setJoystickState({ x: 0, y: 0, isActive: false });
    movePlayer({ x: 0, y: 0 });
  };

  const joystickThumbX = joystickCenterRef.current.x + joystickState.x * joystickRadiusRef.current;
  const joystickThumbY = joystickCenterRef.current.y + joystickState.y * joystickRadiusRef.current;

  return (
    <View style={styles.container}>
      {/* Joystick */}
      <Pressable
        style={styles.joystickBase}
        onTouchStart={handleJoystickStart}
        onTouchMove={handleJoystickMove}
        onTouchEnd={handleJoystickEnd}
      >
        {/* Joystick Background */}
        <View
          style={[
            styles.joystickCircle,
            {
              opacity: joystickState.isActive ? 0.3 : 0.1,
            },
          ]}
        />

        {/* Joystick Thumb */}
        <View
          style={[
            styles.joystickThumb,
            {
              left: joystickThumbX - 25,
              top: joystickThumbY - 25,
              opacity: joystickState.isActive ? 1 : 0.5,
            },
          ]}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    width: 120,
    height: 120,
  },
  joystickBase: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  joystickCircle: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#0a7ea4',
    borderWidth: 2,
    borderColor: '#0a7ea4',
  },
  joystickThumb: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0a7ea4',
  },
});
