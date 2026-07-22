import { GameObject, Vector2, GAME_CONFIG } from './game-types';

let idCounter = 0;

export function generateId(): string {
  return `obj_${++idCounter}`;
}

export function calculateDistance(p1: Vector2, p2: Vector2): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function checkCircleCollision(obj1: GameObject, obj2: GameObject): boolean {
  const dx = obj2.position.x - obj1.position.x;
  const dy = obj2.position.y - obj1.position.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  const radius1 = (obj1.width / 2) * GAME_CONFIG.COLLISION_RADIUS_MULTIPLIER;
  const radius2 = (obj2.width / 2) * GAME_CONFIG.COLLISION_RADIUS_MULTIPLIER;

  return distance < radius1 + radius2;
}

export function normalizeVector(v: Vector2): Vector2 {
  const length = Math.sqrt(v.x * v.x + v.y * v.y);
  if (length === 0) return { x: 0, y: 0 };
  return { x: v.x / length, y: v.y / length };
}

export function clampPosition(
  position: Vector2,
  size: number,
  screenWidth: number,
  screenHeight: number
): Vector2 {
  return {
    x: Math.max(size / 2, Math.min(screenWidth - size / 2, position.x)),
    y: Math.max(size / 2, Math.min(screenHeight - size / 2, position.y)),
  };
}

export function getRandomSpawnPosition(
  screenWidth: number,
  screenHeight: number,
  margin: number = GAME_CONFIG.SPAWN_MARGIN
): Vector2 {
  const side = Math.floor(Math.random() * 4);
  let x, y;

  switch (side) {
    case 0: // top
      x = Math.random() * screenWidth;
      y = -margin;
      break;
    case 1: // right
      x = screenWidth + margin;
      y = Math.random() * screenHeight;
      break;
    case 2: // bottom
      x = Math.random() * screenWidth;
      y = screenHeight + margin;
      break;
    case 3: // left
      x = -margin;
      y = Math.random() * screenHeight;
      break;
    default:
      x = screenWidth / 2;
      y = screenHeight / 2;
  }

  return { x, y };
}

export function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function radiansToDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}
