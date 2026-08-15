import { useEffect, useState } from 'react';

interface CelebrationOverlayProps {
  show: boolean;
}

const CONFETTI_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'];

interface ConfettiPiece {
  id: number;
  left: string;
  color: string;
  delay: string;
  duration: string;
  size: string;
  drift: string;
  rotation: string;
}

function generatePieces(): ConfettiPiece[] {
  return Array.from({ length: 12 }, (_, i) => ({
    id: i,
    left: `${8 + Math.random() * 84}%`,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    delay: `${Math.random() * 0.4}s`,
    duration: `${1.2 + Math.random() * 0.8}s`,
    size: `${6 + Math.random() * 6}px`,
    drift: `${-30 + Math.random() * 60}px`,
    rotation: `${Math.random() * 720}deg`,
  }));
}

export function CelebrationOverlay({ show }: CelebrationOverlayProps) {
  const [visible, setVisible] = useState(false);
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (show) {
      setPieces(generatePieces());
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!visible) return null;

  return (
    <div className="celebration-overlay">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: p.left,
            backgroundColor: p.color,
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
            animationDuration: p.duration,
            '--drift': p.drift,
            '--rotation': p.rotation,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
