export const PHYSICS = {
  // Virtual canvas reference dimensions (height is constant 720, width expands to fill screen)
  VIRTUAL_HEIGHT: 720,
  GROUND_HEIGHT: 76,

  // Bird parameters
  BIRD_RADIUS: 19,
  GRAVITY: 0.13, // px/frame^2 (tuned for push-up exercise tempo)
  FLAP_IMPULSE: -8.8, // px/frame (high initial boost)
  TERMINAL_VELOCITY: 4.8, // px/frame
  GLIDE_FLOAT_DAMPING: 0.985, // Velocity drag at apex

  // Obstacle parameters
  PIPE_SPEED: 1.6, // px/frame
  PIPE_GAP: 180, // px (generous opening for exergaming cadence)
  PIPE_SPACING: 420, // px between consecutive pipes
  PIPE_WIDTH: 74, // px
  MIN_PIPE_HEIGHT: 80, // px minimum pipe protrusion
} as const;

export interface BirdState {
  y: number;
  vy: number;
  rotation: number;
  flapTime: number;
  targetY?: number;
}

export function updateBirdPhysics(bird: BirdState): BirdState {
  let { y, vy, rotation, flapTime } = bird;

  // Apply gravity
  vy += PHYSICS.GRAVITY;

  // Glide float damping near apex (when vertical velocity is between -1.2 and +1.2)
  if (Math.abs(vy) < 1.2) {
    vy *= PHYSICS.GLIDE_FLOAT_DAMPING;
  }

  // Cap at terminal velocity
  if (vy > PHYSICS.TERMINAL_VELOCITY) {
    vy = PHYSICS.TERMINAL_VELOCITY;
  }

  // Update position
  y += vy;

  // Compute realistic bird rotation based on velocity
  // Flapping tilts up (-25 deg), falling glides down to (+65 deg)
  const targetRotation = Math.max(
    -0.45,
    Math.min(1.1, (vy / PHYSICS.TERMINAL_VELOCITY) * 1.0)
  );
  rotation += (targetRotation - rotation) * 0.15;

  return {
    y,
    vy,
    rotation,
    flapTime: flapTime + 1,
  };
}

export function checkCircleRectCollision(
  circleX: number,
  circleY: number,
  radius: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number
): boolean {
  // Find closest point on rectangle to circle
  const closestX = Math.max(rx, Math.min(circleX, rx + rw));
  const closestY = Math.max(ry, Math.min(circleY, ry + rh));

  const distanceX = circleX - closestX;
  const distanceY = circleY - closestY;

  return distanceX * distanceX + distanceY * distanceY < (radius - 2) * (radius - 2);
}
