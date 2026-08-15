import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Undo2, Redo2, AlignLeft, Minus, Plus } from 'lucide-react';

interface EditorToolbarProps {
  onFormat: () => void;
}

const MIN_FONT = 10;
const MAX_FONT = 28;
const DEFAULT_FONT = 16;

function loadFontSize(): number {
  const stored = localStorage.getItem('logo-kids-font-size');
  if (stored) {
    const n = parseInt(stored, 10);
    if (!isNaN(n) && n >= MIN_FONT && n <= MAX_FONT) return n;
  }
  return DEFAULT_FONT;
}

export function EditorToolbar({ onFormat }: EditorToolbarProps) {
  const { t } = useTranslation();
  const [fontSize, setFontSize] = useState(loadFontSize);

  useEffect(() => {
    document.documentElement.style.setProperty('--editor-font-size', `${fontSize}px`);
    localStorage.setItem('logo-kids-font-size', String(fontSize));
  }, [fontSize]);

  const decreaseFont = useCallback(() => {
    setFontSize((s) => Math.max(MIN_FONT, s - 1));
  }, []);

  const increaseFont = useCallback(() => {
    setFontSize((s) => Math.min(MAX_FONT, s + 1));
  }, []);

  const handleUndo = () => {
    const el = document.querySelector('.cm-content') as HTMLElement | null;
    el?.focus();
    document.execCommand('undo');
  };

  const handleRedo = () => {
    const el = document.querySelector('.cm-content') as HTMLElement | null;
    el?.focus();
    document.execCommand('redo');
  };

  return (
    <div className="editor-toolbar" role="toolbar" aria-label={t('editor.format')}>
      <button
        className="editor-toolbar-btn"
        onClick={handleUndo}
        title={t('editor.undo')}
        aria-label={t('editor.undo')}
      >
        <Undo2 size={16} />
      </button>
      <button
        className="editor-toolbar-btn"
        onClick={handleRedo}
        title={t('editor.redo')}
        aria-label={t('editor.redo')}
      >
        <Redo2 size={16} />
      </button>
      <button
        className="editor-toolbar-btn"
        onClick={onFormat}
        title={t('editor.format')}
        aria-label={t('editor.format')}
      >
        <AlignLeft size={16} />
      </button>

      <div className="font-size-controls">
        <button
          className="editor-toolbar-btn"
          onClick={decreaseFont}
          title={t('editor.decreaseFont')}
          aria-label={t('editor.decreaseFont')}
          disabled={fontSize <= MIN_FONT}
        >
          <Minus size={14} />
        </button>
        <span className="font-size-label" aria-label={t('fontSize.value', { size: fontSize })}>
          {fontSize}px
        </span>
        <button
          className="editor-toolbar-btn"
          onClick={increaseFont}
          title={t('editor.increaseFont')}
          aria-label={t('editor.increaseFont')}
          disabled={fontSize >= MAX_FONT}
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}
