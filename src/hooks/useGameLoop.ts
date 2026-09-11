import { useEffect, useRef, type RefObject } from 'react';
import { useGameStore } from '../store/useGameStore';
import { PHYSICS, updateBirdPhysics, checkCircleRectCollision, BirdState } from '../lib/physics';
import { Particle, PipePair } from '../types';

interface UseGameLoopProps {
  canvasRef: RefObject<HTMLCanvasElement | null>;
}

export function useGameLoop({ canvasRef }: UseGameLoopProps) {
  const {
    status,
    flapEvent,
    incrementScore,
    endGame,
  } = useGameStore();

  const birdRef = useRef<BirdState>({
    y: PHYSICS.VIRTUAL_HEIGHT / 2 - 30,
    vy: 0,
    rotation: 0,
    flapTime: 0,
  });

  const pipesRef = useRef<PipePair[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const groundOffsetRef = useRef<number>(0);
  const cloudOffsetRef = useRef<number>(0);
  const lastFlapEventRef = useRef<number>(flapEvent);
  const animationFrameIdRef = useRef<number | null>(null);
  const nextPipeIdRef = useRef<number>(1);
  const virtualWidthRef = useRef<number>(1280);

  function createPipe(xPos: number, vHeight: number = PHYSICS.VIRTUAL_HEIGHT): PipePair {
    const playArea = vHeight - PHYSICS.GROUND_HEIGHT;
    const maxTop = playArea - PHYSICS.PIPE_GAP - PHYSICS.MIN_PIPE_HEIGHT;
    const minTop = PHYSICS.MIN_PIPE_HEIGHT;
    const topHeight = Math.floor(Math.random() * (maxTop - minTop + 1)) + minTop;
    const bottomHeight = playArea - topHeight - PHYSICS.PIPE_GAP;

    return {
      id: nextPipeIdRef.current++,
      x: xPos,
      topHeight,
      bottomHeight,
      passed: false,
    };
  }

  // Initialize bird position when transitioning state
  useEffect(() => {
    if (status === 'countdown' || status === 'idle') {
      birdRef.current = {
        y: PHYSICS.VIRTUAL_HEIGHT / 2 - 30,
        vy: 0,
        rotation: 0,
        flapTime: 0,
      };
      pipesRef.current = [];
      particlesRef.current = [];
    } else if (status === 'playing') {
      birdRef.current = {
        y: PHYSICS.VIRTUAL_HEIGHT / 2 - 30,
        vy: -3.8, // gentle initial lift
        rotation: -0.2,
        flapTime: 0,
      };
      const vWidth = virtualWidthRef.current;
      // Spawn initial pipe pair after safe run-up distance
      pipesRef.current = [
        createPipe(vWidth + 80),
        createPipe(vWidth + 80 + PHYSICS.PIPE_SPACING),
      ];
      particlesRef.current = [];
    }
  }, [status]);

  // Handle flap impulse triggered from vision detector, spacebar, or tap
  useEffect(() => {
    if (flapEvent > lastFlapEventRef.current) {
      lastFlapEventRef.current = flapEvent;
      if (status === 'playing') {
        birdRef.current.vy = PHYSICS.FLAP_IMPULSE;
        birdRef.current.rotation = -0.42;

        const vWidth = virtualWidthRef.current;
        const birdX = Math.max(120, Math.min(260, Math.round(vWidth * 0.20)));

        // Spawn sweat / energy burst particles
        for (let i = 0; i < 10; i++) {
          particlesRef.current.push({
            x: birdX - 10 + (Math.random() * 8 - 4),
            y: birdRef.current.y + (Math.random() * 14 - 7),
            vx: -Math.random() * 2.8 - 1.4,
            vy: (Math.random() - 0.5) * 3,
            size: Math.random() * 4.5 + 2,
            color: Math.random() > 0.4 ? '#38bdf8' : '#fed7aa', // sweat cyan or feather gold
            alpha: 1,
            life: 0,
            maxLife: 24,
          });
        }
      }
    }
  }, [flapEvent, status]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isLoopRunning = true;

    const loop = (timestamp: number) => {
      if (!isLoopRunning) return;

      // Calculate dynamic high-DPI full-screen dimensions
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const displayWidth = Math.max(320, Math.round(canvas.clientWidth * dpr));
      const displayHeight = Math.max(320, Math.round(canvas.clientHeight * dpr));

      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
      }

      const virtualHeight = PHYSICS.VIRTUAL_HEIGHT;
      const scale = displayHeight / virtualHeight;
      const virtualWidth = displayWidth / scale;
      virtualWidthRef.current = virtualWidth;
      const birdX = Math.max(120, Math.min(260, Math.round(virtualWidth * 0.20)));

      // 1. UPDATE SIMULATION
      if (status === 'playing') {
        // Update bird physics
        birdRef.current = updateBirdPhysics(birdRef.current);

        // Ground collision
        const groundLevel = virtualHeight - PHYSICS.GROUND_HEIGHT;
        if (birdRef.current.y + PHYSICS.BIRD_RADIUS >= groundLevel) {
          birdRef.current.y = groundLevel - PHYSICS.BIRD_RADIUS;
          endGame();
        }

        // Ceiling collision
        if (birdRef.current.y - PHYSICS.BIRD_RADIUS <= 6) {
          birdRef.current.y = PHYSICS.BIRD_RADIUS + 6;
          birdRef.current.vy = 0;
        }

        // Update ground & cloud scroll
        groundOffsetRef.current = (groundOffsetRef.current + PHYSICS.PIPE_SPEED) % 24;
        cloudOffsetRef.current = (cloudOffsetRef.current + 0.35) % (virtualWidth * 2);

        // Update pipes
        const pipes = pipesRef.current;
        for (let i = 0; i < pipes.length; i++) {
          const pipe = pipes[i];
          pipe.x -= PHYSICS.PIPE_SPEED;

          // Score detection
          if (!pipe.passed && pipe.x + PHYSICS.PIPE_WIDTH < birdX) {
            pipe.passed = true;
            incrementScore();
          }

          // Collision detection: Top pipe
          const hitTop = checkCircleRectCollision(
            birdX,
            birdRef.current.y,
            PHYSICS.BIRD_RADIUS,
            pipe.x,
            0,
            PHYSICS.PIPE_WIDTH,
            pipe.topHeight
          );

          // Collision detection: Bottom pipe
          const bottomPipeY = virtualHeight - PHYSICS.GROUND_HEIGHT - pipe.bottomHeight;
          const hitBottom = checkCircleRectCollision(
            birdX,
            birdRef.current.y,
            PHYSICS.BIRD_RADIUS,
            pipe.x,
            bottomPipeY,
            PHYSICS.PIPE_WIDTH,
            pipe.bottomHeight
          );

          if (hitTop || hitBottom) {
            endGame();
          }
        }

        // Remove off-screen pipes
        while (pipes.length > 0 && pipes[0].x + PHYSICS.PIPE_WIDTH < -100) {
          pipes.shift();
        }

        // Spawn new pipes to maintain obstacle pacing
        const lastPipe = pipes[pipes.length - 1];
        if (!lastPipe || lastPipe.x <= virtualWidth - PHYSICS.PIPE_SPACING) {
          pipes.push(createPipe(virtualWidth + 30, virtualHeight));
        }

        // Update particles
        const particles = particlesRef.current;
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.06; // subtle gravity
          p.life++;
          p.alpha = 1 - p.life / p.maxLife;
          if (p.life >= p.maxLife) {
            particles.splice(i, 1);
          }
        }
      } else if (status === 'paused') {
        // Paused: do not update physics, keep exact freeze frame
      } else {
        // Idle/countdown floating wave
        const idleFloat = Math.sin(timestamp * 0.005) * 8;
        birdRef.current.y = virtualHeight / 2 - 30 + idleFloat;
        birdRef.current.rotation = Math.sin(timestamp * 0.005) * 0.08;
        groundOffsetRef.current = (groundOffsetRef.current + 0.8) % 24;
        cloudOffsetRef.current = (cloudOffsetRef.current + 0.2) % (virtualWidth * 2);
      }

      // 2. RENDER SCENE (Scaled to Screen Resolution)
      ctx.save();
      ctx.scale(scale, scale);
      renderScene(ctx, timestamp, virtualWidth, virtualHeight, birdX);
      ctx.restore();

      animationFrameIdRef.current = requestAnimationFrame(loop);
    };

    animationFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      isLoopRunning = false;
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [status, incrementScore, endGame]);

  // Full-screen arcade scene rendering pipeline
  const renderScene = (
    ctx: CanvasRenderingContext2D,
    timestamp: number,
    vWidth: number,
    vHeight: number,
    birdX: number
  ) => {
    const { GROUND_HEIGHT, BIRD_RADIUS } = PHYSICS;

    // A. Sky Background Gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, vHeight - GROUND_HEIGHT);
    skyGradient.addColorStop(0, '#0284c7'); // Rich Sky Blue
    skyGradient.addColorStop(0.6, '#38bdf8'); // Bright Cyan
    skyGradient.addColorStop(0.9, '#7dd3fc'); // Soft Blue
    skyGradient.addColorStop(1, '#bae6fd'); // Horizon glow
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, vWidth, vHeight);

    // Subtle sun in upper right sky
    const sunX = vWidth - 140;
    const sunY = 90;
    const sunGrad = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 90);
    sunGrad.addColorStop(0, 'rgba(254, 240, 138, 0.9)');
    sunGrad.addColorStop(0.4, 'rgba(253, 224, 71, 0.35)');
    sunGrad.addColorStop(1, 'rgba(253, 224, 71, 0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 90, 0, Math.PI * 2);
    ctx.fill();

    // B. Clouds (Multi-layer Parallax)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    const cloudLoop = Math.max(vWidth + 200, 1200);
    for (let cx = 40; cx < vWidth + 400; cx += 320) {
      const renderCx = (cx - (cloudOffsetRef.current * 0.6)) % cloudLoop;
      drawCloud(ctx, renderCx, 70 + ((cx * 13) % 80), 55);
    }

    // C. Distant City / Calisthenics Arena Skyline
    ctx.fillStyle = 'rgba(224, 242, 254, 0.55)';
    const skylineY = vHeight - GROUND_HEIGHT - 65;
    for (let bx = -40; bx < vWidth + 80; bx += 48) {
      const bh = 24 + ((Math.abs(bx) * 37) % 45);
      ctx.fillRect(bx, skylineY - bh, 38, bh + 65);
    }

    // D. Render Pipes
    const pipes = pipesRef.current;
    for (let i = 0; i < pipes.length; i++) {
      const p = pipes[i];
      drawPipe(ctx, p.x, 0, PHYSICS.PIPE_WIDTH, p.topHeight, true);
      const bottomY = vHeight - GROUND_HEIGHT - p.bottomHeight;
      drawPipe(ctx, p.x, bottomY, PHYSICS.PIPE_WIDTH, p.bottomHeight, false);
    }

    // E. Render Ground
    const groundY = vHeight - GROUND_HEIGHT;
    // Ground Base (rich turf)
    ctx.fillStyle = '#15803d';
    ctx.fillRect(0, groundY, vWidth, 16);

    // Underground soil
    ctx.fillStyle = '#9a3412';
    ctx.fillRect(0, groundY + 16, vWidth, GROUND_HEIGHT - 16);

    // Ground grass blade highlights (scrolling)
    ctx.fillStyle = '#22c55e';
    for (let x = -24; x < vWidth + 48; x += 24) {
      const renderX = x - groundOffsetRef.current;
      ctx.beginPath();
      ctx.moveTo(renderX, groundY);
      ctx.lineTo(renderX + 12, groundY + 13);
      ctx.lineTo(renderX + 24, groundY);
      ctx.fill();
    }

    // F. Render Particles
    const particles = particlesRef.current;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // G. Render Athletic Flappy Bird
    ctx.save();
    ctx.translate(birdX, birdRef.current.y);
    ctx.rotate(birdRef.current.rotation);

    // Subtle drop shadow underneath
    ctx.beginPath();
    ctx.arc(0, 4, BIRD_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.14)';
    ctx.fill();

    // Main Body (Vibrant Gold)
    ctx.beginPath();
    ctx.arc(0, 0, BIRD_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = '#f59e0b'; // Amber 500
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#78350f';
    ctx.stroke();

    // Belly Highlight
    ctx.beginPath();
    ctx.arc(-2, 4, BIRD_RADIUS - 6, 0, Math.PI);
    ctx.fillStyle = '#fef08a';
    ctx.fill();

    // Athletic Red Sweatband across forehead
    ctx.fillStyle = '#ef4444'; // Bright Red
    ctx.fillRect(-BIRD_RADIUS + 2, -BIRD_RADIUS + 3, BIRD_RADIUS * 2 - 4, 8);
    ctx.strokeStyle = '#991b1b';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(-BIRD_RADIUS + 2, -BIRD_RADIUS + 3, BIRD_RADIUS * 2 - 4, 8);
    // Sweatband knot detail
    ctx.beginPath();
    ctx.arc(-BIRD_RADIUS + 2, -BIRD_RADIUS + 7, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = '#dc2626';
    ctx.fill();

    // Big Cartoon Eye
    ctx.beginPath();
    ctx.arc(7, -4, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Pupil
    ctx.beginPath();
    ctx.arc(9, -4, 3.2, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();

    // Eye catchlight
    ctx.beginPath();
    ctx.arc(8.5, -5.5, 1.3, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Beak
    ctx.beginPath();
    ctx.moveTo(12, -1.5);
    ctx.lineTo(25, 2);
    ctx.lineTo(12, 7.5);
    ctx.closePath();
    ctx.fillStyle = '#ea580c'; // Vibrant Orange
    ctx.fill();
    ctx.strokeStyle = '#7c2d12';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Beak crease
    ctx.beginPath();
    ctx.moveTo(12, 2.5);
    ctx.lineTo(21, 2.5);
    ctx.stroke();

    // Wing flapping animation
    const wingAngle = Math.sin(timestamp * 0.015 + birdRef.current.flapTime) * 0.55;
    ctx.save();
    ctx.translate(-7, 2);
    ctx.rotate(wingAngle);
    ctx.beginPath();
    ctx.ellipse(0, 0, 10, 6.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  };

  // Draw retro arcade pipes with collar rim & 3D gradient highlight
  const drawPipe = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    isTop: boolean
  ) => {
    if (h <= 0) return;

    const rimHeight = 26;
    const rimOverhang = 6;

    // 1. Pipe Body
    const bodyY = isTop ? y : y + rimHeight;
    const bodyH = Math.max(0, isTop ? h - rimHeight : h - rimHeight);

    if (bodyH > 0) {
      const bodyGrad = ctx.createLinearGradient(x, 0, x + w, 0);
      bodyGrad.addColorStop(0, '#15803d');
      bodyGrad.addColorStop(0.2, '#4ade80'); // Gloss highlight
      bodyGrad.addColorStop(0.5, '#22c55e');
      bodyGrad.addColorStop(0.85, '#166534');
      bodyGrad.addColorStop(1, '#14532d');

      ctx.fillStyle = bodyGrad;
      ctx.fillRect(x, bodyY, w, bodyH);

      ctx.strokeStyle = '#052e16';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(x, bodyY, w, bodyH);
    }

    // 2. Pipe Collar / Rim
    const rimX = x - rimOverhang;
    const rimW = w + rimOverhang * 2;
    const rimY = isTop ? y + h - rimHeight : y;

    const rimGrad = ctx.createLinearGradient(rimX, 0, rimX + rimW, 0);
    rimGrad.addColorStop(0, '#15803d');
    rimGrad.addColorStop(0.2, '#86efac'); // bright rim reflection
    rimGrad.addColorStop(0.5, '#22c55e');
    rimGrad.addColorStop(0.85, '#166534');
    rimGrad.addColorStop(1, '#052e16');

    ctx.fillStyle = rimGrad;
    ctx.fillRect(rimX, rimY, rimW, rimHeight);

    ctx.strokeStyle = '#052e16';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(rimX, rimY, rimW, rimHeight);
  };

  const drawCloud = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number) => {
    ctx.beginPath();
    ctx.arc(x, y, r * 0.5, 0, Math.PI * 2);
    ctx.arc(x + r * 0.4, y - r * 0.2, r * 0.6, 0, Math.PI * 2);
    ctx.arc(x + r * 0.9, y, r * 0.45, 0, Math.PI * 2);
    ctx.fill();
  };

  return { bird: birdRef.current };
}
