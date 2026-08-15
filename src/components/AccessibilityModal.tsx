import { useTranslation } from 'react-i18next';
import { getDir } from '../lib/i18n';
import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface AccessibilityModalProps {
  onClose: () => void;
}

export function AccessibilityModal({ onClose }: AccessibilityModalProps) {
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
    <div className="modal-overlay" dir={dir} role="dialog" aria-modal="true" aria-label={t('accessibility.title')}>
      <div className="modal-content">
        <button
          ref={closeRef}
          className="modal-close"
          onClick={onClose}
          aria-label={t('ariaLabels.closeModal')}
        >
          <X size={24} />
        </button>

        <h2 className="modal-title">{t('accessibility.title')}</h2>
        <p className="modal-subtitle">{t('accessibility.intro')}</p>

        <div className="modal-section">
          <h3>{t('accessibility.keyboardTitle')}</h3>
          <p>{t('accessibility.keyboardText')}</p>
        </div>

        <div className="modal-section">
          <h3>{t('accessibility.screenReaderTitle')}</h3>
          <p>{t('accessibility.screenReaderText')}</p>
        </div>

        <div className="modal-section">
          <h3>{t('accessibility.contrastTitle')}</h3>
          <p>{t('accessibility.contrastText')}</p>
        </div>

        <div className="modal-section">
          <h3>{t('accessibility.fontSizeTitle')}</h3>
          <p>{t('accessibility.fontSizeText')}</p>
        </div>

        <div className="modal-section">
          <h3>{t('accessibility.feedbackTitle')}</h3>
          <p>{t('accessibility.feedbackText')}</p>
        </div>

        <button className="modal-cta" onClick={onClose}>
          {t('accessibility.close')}
        </button>
      </div>
    </div>
  );
}
