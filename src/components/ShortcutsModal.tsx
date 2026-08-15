import { useTranslation } from 'react-i18next';
import { getDir } from '../lib/i18n';
import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface ShortcutsModalProps {
  onClose: () => void;
}

interface ShortcutEntry {
  keys: string[];
  labelKey: string;
}

const SHORTCUTS: ShortcutEntry[] = [
  { keys: ['Ctrl', 'Enter'], labelKey: 'shortcuts.runPause' },
  { keys: ['Ctrl', '.'], labelKey: 'shortcuts.step' },
  { keys: ['Ctrl', 'R'], labelKey: 'shortcuts.reset' },
  { keys: ['Ctrl', 'Shift', 'F'], labelKey: 'shortcuts.format' },
  { keys: ['Ctrl', 'Z'], labelKey: 'shortcuts.undo' },
  { keys: ['Ctrl', 'Shift', 'Z'], labelKey: 'shortcuts.redo' },
  { keys: ['?'], labelKey: 'shortcuts.toggleShortcuts' },
];

export function ShortcutsModal({ onClose }: ShortcutsModalProps) {
  const { t, i18n } = useTranslation();
  const dir = getDir(i18n.language);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div className="modal-overlay" dir={dir} role="dialog" aria-modal="true" aria-label={t('ariaLabels.keyboardShortcuts')}>
      <div className="modal-content shortcuts-modal">
        <button
          ref={closeRef}
          className="modal-close"
          onClick={onClose}
          aria-label={t('ariaLabels.closeModal')}
        >
          <X size={24} />
        </button>

        <h2 className="modal-title">{t('shortcuts.title')}</h2>
        <p className="modal-subtitle">{t('shortcuts.subtitle')}</p>

        <div className="shortcuts-list">
          {SHORTCUTS.map((shortcut, i) => (
            <div key={i} className="shortcut-row">
              <span className="shortcut-label">{t(shortcut.labelKey)}</span>
              <div className="shortcut-keys">
                {shortcut.keys.map((key, j) => (
                  <span key={j}>
                    <kbd className="shortcut-key">{key}</kbd>
                    {j < shortcut.keys.length - 1 && <span className="shortcut-separator">+</span>}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button className="modal-cta" onClick={onClose}>
          {t('shortcuts.close')}
        </button>
      </div>
    </div>
  );
}
