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
    y: PHYSICS.CANVAS_HEIGHT / 2 - 40,
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

  // Initialize bird position when transitioning to playing or idle
  useEffect(() => {
    if (status === 'countdown' || status === 'idle') {
      birdRef.current = {
        y: PHYSICS.CANVAS_HEIGHT / 2 - 30,
        vy: 0,
        rotation: 0,
        flapTime: 0,
      };
      pipesRef.current = [];
      particlesRef.current = [];
    } else if (status === 'playing') {
      birdRef.current = {
        y: PHYSICS.CANVAS_HEIGHT / 2 - 30,
        vy: -3.5, // gentle initial lift
        rotation: -0.2,
        flapTime: 0,
      };
      // Spawn initial pipe pair after safe distance
      pipesRef.current = [
        createPipe(PHYSICS.CANVAS_WIDTH + 140),
        createPipe(PHYSICS.CANVAS_WIDTH + 140 + PHYSICS.PIPE_SPACING),
      ];
      particlesRef.current = [];
    }
  }, [status]);

  // Handle flap impulse triggered from vision detector or spacebar
  useEffect(() => {
    if (flapEvent > lastFlapEventRef.current) {
      lastFlapEventRef.current = flapEvent;
      if (status === 'playing') {
        birdRef.current.vy = PHYSICS.FLAP_IMPULSE;
        birdRef.current.rotation = -0.42;

        // Spawn sweat / energy burst particles
        for (let i = 0; i < 9; i++) {
          particlesRef.current.push({
            x: PHYSICS.BIRD_X - 10 + (Math.random() * 8 - 4),
            y: birdRef.current.y + (Math.random() * 12 - 6),
            vx: -Math.random() * 2.5 - 1.2,
            vy: (Math.random() - 0.5) * 2.5,
            size: Math.random() * 4 + 2,
            color: Math.random() > 0.4 ? '#38bdf8' : '#fed7aa', // sweat blue or feather gold
            alpha: 1,
            life: 0,
            maxLife: 24,
          });
        }
      }
    }
  }, [flapEvent, status]);

  function createPipe(xPos: number): PipePair {
    const playArea = PHYSICS.CANVAS_HEIGHT - PHYSICS.GROUND_HEIGHT;
    const maxTop = playArea - PHYSICS.PIPE_GAP - PHYSICS.MIN_PIPE_HEIGHT;
    const minTop = PHYSICS.MIN_PIPE_HEIGHT;
    const topHeight = Math.floor(Math.random() * (maxTop - minTop + 1)) + minTop;
    const bottomHeight = playArea - topHeight - PHYSICS.PIPE_GAP;

    const pipe: PipePair = {
      id: nextPipeIdRef.current++,
      x: xPos,
      topHeight,
      bottomHeight,
      passed: false,
    };
    return pipe;
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isLoopRunning = true;

    const loop = (timestamp: number) => {
      if (!isLoopRunning) return;

      // 1. UPDATE STATE
      if (status === 'playing') {
        // Update bird physics
        birdRef.current = updateBirdPhysics(birdRef.current);

        // Ground collision
        const groundLevel = PHYSICS.CANVAS_HEIGHT - PHYSICS.GROUND_HEIGHT;
        if (birdRef.current.y + PHYSICS.BIRD_RADIUS >= groundLevel) {
          birdRef.current.y = groundLevel - PHYSICS.BIRD_RADIUS;
          endGame();
        }

        // Ceiling collision
        if (birdRef.current.y - PHYSICS.BIRD_RADIUS <= 4) {
          birdRef.current.y = PHYSICS.BIRD_RADIUS + 4;
          birdRef.current.vy = 0;
        }

        // Update ground & cloud scroll
        groundOffsetRef.current = (groundOffsetRef.current + PHYSICS.PIPE_SPEED) % 24;
        cloudOffsetRef.current = (cloudOffsetRef.current + 0.35) % PHYSICS.CANVAS_WIDTH;

        // Update pipes
        const pipes = pipesRef.current;
        for (let i = 0; i < pipes.length; i++) {
          const pipe = pipes[i];
          pipe.x -= PHYSICS.PIPE_SPEED;

          // Score detection
          if (!pipe.passed && pipe.x + PHYSICS.PIPE_WIDTH < PHYSICS.BIRD_X) {
            pipe.passed = true;
            incrementScore();
          }

          // Collision detection: Top pipe
          const hitTop = checkCircleRectCollision(
            PHYSICS.BIRD_X,
            birdRef.current.y,
            PHYSICS.BIRD_RADIUS,
            pipe.x,
            0,
            PHYSICS.PIPE_WIDTH,
            pipe.topHeight
          );

          // Collision detection: Bottom pipe
          const bottomPipeY = PHYSICS.CANVAS_HEIGHT - PHYSICS.GROUND_HEIGHT - pipe.bottomHeight;
          const hitBottom = checkCircleRectCollision(
            PHYSICS.BIRD_X,
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
        while (pipes.length > 0 && pipes[0].x + PHYSICS.PIPE_WIDTH < -50) {
          pipes.shift();
        }

        // Spawn new pipes to maintain spacing
        const lastPipe = pipes[pipes.length - 1];
        if (lastPipe && lastPipe.x <= PHYSICS.CANVAS_WIDTH - PHYSICS.PIPE_SPACING) {
          pipes.push(createPipe(PHYSICS.CANVAS_WIDTH + 20));
        }

        // Update particles
        const particles = particlesRef.current;
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.05; // gravity
          p.life++;
          p.alpha = 1 - p.life / p.maxLife;
          if (p.life >= p.maxLife) {
            particles.splice(i, 1);
          }
        }
      } else {
        // Idle/countdown floating wave
        const idleFloat = Math.sin(timestamp * 0.005) * 7;
        birdRef.current.y = PHYSICS.CANVAS_HEIGHT / 2 - 30 + idleFloat;
        birdRef.current.rotation = Math.sin(timestamp * 0.005) * 0.08;
        groundOffsetRef.current = (groundOffsetRef.current + 0.8) % 24;
        cloudOffsetRef.current = (cloudOffsetRef.current + 0.2) % PHYSICS.CANVAS_WIDTH;
      }

      // 2. RENDER STAGE
      renderScene(ctx, timestamp);

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

  // Scene rendering pipeline
  const renderScene = (ctx: CanvasRenderingContext2D, timestamp: number) => {
    const { CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_HEIGHT, BIRD_X, BIRD_RADIUS } = PHYSICS;

    // A. Sky Background Gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT - GROUND_HEIGHT);
    skyGradient.addColorStop(0, '#0284c7'); // Rich Sky Blue
    skyGradient.addColorStop(0.65, '#38bdf8'); // Bright Cyan
    skyGradient.addColorStop(1, '#bae6fd'); // Soft Pale Blue
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // B. Clouds (Slow Parallax)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    drawCloud(ctx, 60 - (cloudOffsetRef.current * 0.6) % CANVAS_WIDTH, 70, 48);
    drawCloud(ctx, 280 - (cloudOffsetRef.current * 0.6) % CANVAS_WIDTH, 110, 60);
    drawCloud(ctx, 490 - (cloudOffsetRef.current * 0.6) % CANVAS_WIDTH, 60, 52);

    // C. Distant City / Calisthenics Arena Skyline
    ctx.fillStyle = 'rgba(224, 242, 254, 0.6)';
    const skylineY = CANVAS_HEIGHT - GROUND_HEIGHT - 65;
    for (let bx = -20; bx < CANVAS_WIDTH + 60; bx += 48) {
      const bh = 24 + ((bx * 37) % 40);
      ctx.fillRect(bx, skylineY - bh, 36, bh + 65);
    }

    // D. Render Pipes
    const pipes = pipesRef.current;
    for (let i = 0; i < pipes.length; i++) {
      const p = pipes[i];
      drawPipe(ctx, p.x, 0, PHYSICS.PIPE_WIDTH, p.topHeight, true);
      const bottomY = CANVAS_HEIGHT - GROUND_HEIGHT - p.bottomHeight;
      drawPipe(ctx, p.x, bottomY, PHYSICS.PIPE_WIDTH, p.bottomHeight, false);
    }

    // E. Render Ground
    const groundY = CANVAS_HEIGHT - GROUND_HEIGHT;
    // Ground Base
    ctx.fillStyle = '#15803d'; // Rich green turf
    ctx.fillRect(0, groundY, CANVAS_WIDTH, 14);

    // Underground soil
    ctx.fillStyle = '#b45309'; // Earthy amber/brown
    ctx.fillRect(0, groundY + 14, CANVAS_WIDTH, GROUND_HEIGHT - 14);

    // Ground grass blade highlights (scrolling)
    ctx.fillStyle = '#22c55e';
    for (let x = -24; x < CANVAS_WIDTH + 24; x += 24) {
      const renderX = x - groundOffsetRef.current;
      ctx.beginPath();
      ctx.moveTo(renderX, groundY);
      ctx.lineTo(renderX + 12, groundY + 12);
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
    ctx.translate(BIRD_X, birdRef.current.y);
    ctx.rotate(birdRef.current.rotation);

    // Body shadow underneath
    ctx.beginPath();
    ctx.arc(0, 3, BIRD_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.fill();

    // Main Body (Vibrant Yellow-Gold)
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

    // Athletic Red Sweatband across forehead!
    ctx.fillStyle = '#ef4444'; // Bright Red
    ctx.fillRect(-BIRD_RADIUS + 2, -BIRD_RADIUS + 3, BIRD_RADIUS * 2 - 4, 7);
    ctx.strokeStyle = '#991b1b';
    ctx.lineWidth = 1;
    ctx.strokeRect(-BIRD_RADIUS + 2, -BIRD_RADIUS + 3, BIRD_RADIUS * 2 - 4, 7);
    // Sweatband knot detail
    ctx.beginPath();
    ctx.arc(-BIRD_RADIUS + 2, -BIRD_RADIUS + 6, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#dc2626';
    ctx.fill();

    // Big Cartoon Eye
    ctx.beginPath();
    ctx.arc(6, -4, 6.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Pupil
    ctx.beginPath();
    ctx.arc(8, -4, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();

    // Eye catchlight
    ctx.beginPath();
    ctx.arc(7.5, -5.5, 1.2, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Beak
    ctx.beginPath();
    ctx.moveTo(11, -1);
    ctx.lineTo(23, 2);
    ctx.lineTo(11, 7);
    ctx.closePath();
    ctx.fillStyle = '#ea580c'; // Vibrant Orange
    ctx.fill();
    ctx.strokeStyle = '#7c2d12';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Beak middle crease
    ctx.beginPath();
    ctx.moveTo(11, 2.5);
    ctx.lineTo(20, 2.5);
    ctx.stroke();

    // Wing flapping animation
    const wingAngle = Math.sin(timestamp * 0.015 + birdRef.current.flapTime) * 0.5;
    ctx.save();
    ctx.translate(-7, 2);
    ctx.rotate(wingAngle);
    ctx.beginPath();
    ctx.ellipse(0, 0, 9, 6, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  };

  // Helper to draw clean retro arcade pipes with collar rim & 3D highlight
  const drawPipe = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    isTop: boolean
  ) => {
    if (h <= 0) return;

    const rimHeight = 24;
    const rimOverhang = 5;

    // 1. Pipe Body
    const bodyY = isTop ? y : y + rimHeight;
    const bodyH = Math.max(0, isTop ? h - rimHeight : h - rimHeight);

    if (bodyH > 0) {
      // Body gradient
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
