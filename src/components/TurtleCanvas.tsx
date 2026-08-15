import { useRef, useEffect, useCallback, useState } from 'react';
import type { TraceOp, TurtleState } from '../lib/logo-core/types';

interface TurtleCanvasProps {
  trace: TraceOp[];
  turtle: TurtleState;
  currentStep: number;
  isAnimating: boolean;
  className?: string;
}

const TURTLE_SIZE = 16;

function drawTurtle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  heading: number,
  visible: boolean
) {
  if (!visible) return;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((heading * Math.PI) / 180);

  ctx.fillStyle = '#52b788';
  ctx.beginPath();
  ctx.ellipse(0, 2, TURTLE_SIZE * 0.55, TURTLE_SIZE * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#2d6a4f';
  ctx.beginPath();
  ctx.ellipse(0, 2, TURTLE_SIZE * 0.4, TURTLE_SIZE * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#52b788';
  ctx.beginPath();
  ctx.arc(0, -TURTLE_SIZE * 0.5, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#1b4332';
  ctx.beginPath();
  ctx.arc(-1.5, -TURTLE_SIZE * 0.55, 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(1.5, -TURTLE_SIZE * 0.55, 1, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#52b788';
  ctx.beginPath();
  ctx.ellipse(-TURTLE_SIZE * 0.5, -2, 3, 5, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(TURTLE_SIZE * 0.5, -2, 3, 5, 0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#52b788';
  ctx.beginPath();
  ctx.ellipse(-TURTLE_SIZE * 0.35, 8, 3, 5, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(TURTLE_SIZE * 0.35, 8, 3, 5, 0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function getThemeColors() {
  const style = getComputedStyle(document.documentElement);
  return {
    gridLine: style.getPropertyValue('--text-muted').trim() || '#94a3b8',
    axisLine: style.getPropertyValue('--text-secondary').trim() || '#64748b',
    labelColor: style.getPropertyValue('--text-muted').trim() || '#94a3b8',
    bg: style.getPropertyValue('--bg-panel').trim() || '#ffffff',
  };
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  const colors = getThemeColors();
  const centerX = width / 2;
  const centerY = height / 2;
  const gridSize = 50;

  ctx.strokeStyle = colors.gridLine;
  ctx.lineWidth = 0.5;
  ctx.globalAlpha = 0.4;

  for (let x = centerX % gridSize; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  for (let y = centerY % gridSize; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
  ctx.strokeStyle = colors.axisLine;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(centerX, 0);
  ctx.lineTo(centerX, height);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, centerY);
  ctx.lineTo(width, centerY);
  ctx.stroke();

  ctx.fillStyle = colors.labelColor;
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  const maxCoord = Math.max(centerX, centerY);
  for (let px = -maxCoord; px <= maxCoord; px += 100) {
    if (px === 0) continue;
    const sx = centerX + px;
    if (sx > 10 && sx < width - 10) {
      ctx.fillText(String(px), sx, centerY + 4);
    }
  }

  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let py = -maxCoord; py <= maxCoord; py += 100) {
    if (py === 0) continue;
    const sy = centerY - py;
    if (sy > 10 && sy < height - 10) {
      ctx.fillText(String(py), centerX - 6, sy);
    }
  }
}

function drawTrace(
  ctx: CanvasRenderingContext2D,
  trace: TraceOp[],
  upToStep: number,
  width: number,
  height: number
) {
  const centerX = width / 2;
  const centerY = height / 2;

  const toScreen = (px: number, py: number) => ({
    x: centerX + px,
    y: centerY - py,
  });

  for (let i = 0; i < Math.min(upToStep, trace.length); i++) {
    const op = trace[i];
    if (!op.penDown) continue;

    const from = toScreen(op.from.x, op.from.y);
    const to = toScreen(op.to.x, op.to.y);

    ctx.strokeStyle = op.penColor;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.globalAlpha = op.lineOpacity ?? 1;

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
}

export function TurtleCanvas({
  trace,
  turtle,
  currentStep,
  isAnimating,
  className,
}: TurtleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensions;

    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const colors = getThemeColors();
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, width, height);

    drawGrid(ctx, width, height);
    drawTrace(ctx, trace, currentStep, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    drawTurtle(
      ctx,
      centerX + turtle.x,
      centerY - turtle.y,
      turtle.heading,
      turtle.visible
    );
  }, [trace, turtle, currentStep, dimensions]);

  useEffect(() => {
    render();
  }, [render]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width, height });
        }
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={className} style={{ width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  );
}
