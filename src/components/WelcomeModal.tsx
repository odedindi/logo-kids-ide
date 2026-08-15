import { useTranslation } from 'react-i18next';
import { getDir } from '../lib/i18n';
import { X } from 'lucide-react';

interface WelcomeModalProps {
  onClose: () => void;
}

export function WelcomeModal({ onClose }: WelcomeModalProps) {
  const { t, i18n } = useTranslation();
  const dir = getDir(i18n.language);

  return (
    <div className="modal-overlay" dir={dir} role="dialog" aria-modal="true" aria-label={t('welcome.title')}>
      <div className="modal-content">
        <button
          className="modal-close"
          onClick={onClose}
          aria-label={t('ariaLabels.closeModal')}
        >
          <X size={24} />
        </button>

        <h2 className="modal-title">{t('welcome.title')}</h2>
        <p className="modal-subtitle">{t('welcome.subtitle')}</p>

        <div className="modal-section">
          <h3>{t('welcome.whatIsLogoTitle')}</h3>
          <p>{t('welcome.whatIsLogoText')}</p>
        </div>

        <div className="modal-section">
          <h3>{t('welcome.howToUseTitle')}</h3>
          <ol className="welcome-steps">
            <li>{t('welcome.steps.step1')}</li>
            <li>{t('welcome.steps.step2')}</li>
            <li>{t('welcome.steps.step3')}</li>
            <li>{t('welcome.steps.step4')}</li>
          </ol>
        </div>

        <div className="modal-section turtle-tip">
          <h3>{t('welcome.turtleTipTitle')}</h3>
          <p>{t('welcome.turtleTip')}</p>
        </div>

        <button className="modal-cta" onClick={onClose}>
          {t('welcome.closeButton')}
        </button>
      </div>
    </div>
  );
}
