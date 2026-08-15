import { useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface ResizeHandleProps {
  direction: 'horizontal' | 'vertical';
  onResize: (delta: number) => void;
  onDoubleClick?: () => void;
  min?: number;
  max?: number;
  current?: number;
}

export function ResizeHandle({ direction, onResize, onDoubleClick, min = 0, max = Infinity, current }: ResizeHandleProps) {
  const { t } = useTranslation();
  const dragging = useRef(false);
  const startPos = useRef(0);
  const handleRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    startPos.current = direction === 'horizontal' ? e.clientX : e.clientY;
    document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      const pos = direction === 'horizontal' ? ev.clientX : ev.clientY;
      const delta = pos - startPos.current;
      startPos.current = pos;
      onResize(delta);
    };

    const onMouseUp = () => {
      dragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [direction, onResize]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    dragging.current = true;
    const touch = e.touches[0];
    startPos.current = direction === 'horizontal' ? touch.clientX : touch.clientY;

    const onTouchMove = (ev: TouchEvent) => {
      if (!dragging.current) return;
      const touch = ev.touches[0];
      const pos = direction === 'horizontal' ? touch.clientX : touch.clientY;
      const delta = pos - startPos.current;
      startPos.current = pos;
      onResize(delta);
    };

    const onTouchEnd = () => {
      dragging.current = false;
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };

    document.addEventListener('touchmove', onTouchMove);
    document.addEventListener('touchend', onTouchEnd);
  }, [direction, onResize]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 50 : 10;
    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        onResize(-step);
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        onResize(step);
        break;
      case 'Home':
        e.preventDefault();
        onDoubleClick?.();
        break;
    }
  }, [onResize, onDoubleClick]);

  useEffect(() => {
    const handleGlobalUp = () => {
      if (dragging.current) {
        dragging.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };
    window.addEventListener('mouseup', handleGlobalUp);
    return () => window.removeEventListener('mouseup', handleGlobalUp);
  }, []);

  return (
    <div
      ref={handleRef}
      className={`resize-handle resize-handle-${direction}`}
      role="separator"
      aria-orientation={direction === 'horizontal' ? 'vertical' : 'horizontal'}
      aria-label={t('ariaLabels.resizeHandle')}
      aria-valuenow={current}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={0}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onDoubleClick={onDoubleClick}
      onKeyDown={handleKeyDown}
    >
      <div className="resize-grip" />
    </div>
  );
}
