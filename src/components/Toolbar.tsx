import { useTranslation } from 'react-i18next';
import { EXAMPLE_PROGRAMS } from '../constants/examples';
import { getDir } from '../lib/i18n';
import { Play, Pause, SkipForward, RotateCcw, Gauge } from 'lucide-react';

interface ToolbarProps {
  isRunning: boolean;
  speed: number;
  onRun: () => void;
  onStep: () => void;
  onPause: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
  onLoadExample: (code: string) => void;
  isMobile?: boolean;
}

export function Toolbar({
  isRunning,
  speed,
  onRun,
  onStep,
  onPause,
  onReset,
  onSpeedChange,
  onLoadExample,
  isMobile,
}: ToolbarProps) {
  const { t, i18n } = useTranslation();
  const dir = getDir(i18n.language);

  return (
    <div className={`toolbar ${isMobile ? 'toolbar-mobile' : ''}`} dir={dir} role="toolbar" aria-label={t('ariaLabels.toolbar')}>
      <div className="toolbar-controls">
        <button
          className="toolbar-btn run-btn"
          onClick={isRunning ? onPause : onRun}
          aria-label={isRunning ? t('toolbar.pause') : t('toolbar.run')}
        >
          {isRunning ? <Pause size={18} /> : <Play size={18} />}
          <span>{isRunning ? t('toolbar.pause') : t('toolbar.run')}</span>
        </button>

        <button
          className="toolbar-btn step-btn"
          onClick={onStep}
          disabled={isRunning}
          aria-label={t('toolbar.step')}
        >
          <SkipForward size={18} />
          <span>{t('toolbar.step')}</span>
        </button>

        <button
          className="toolbar-btn reset-btn"
          onClick={onReset}
          aria-label={t('toolbar.reset')}
        >
          <RotateCcw size={18} />
          <span>{t('toolbar.reset')}</span>
        </button>
      </div>

      <div className="toolbar-secondary">
        <div className="toolbar-speed">
          <Gauge size={14} />
          {!isMobile && <label>{t('toolbar.speed')}</label>}
          <input
            type="range"
            min="0.1"
            max="3"
            step="0.1"
            value={speed}
            onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
            aria-label={t('toolbar.speed')}
          />
          <span className="speed-value">{speed.toFixed(1)}×</span>
        </div>

        <div className="toolbar-examples">
          {!isMobile && <label>{t('toolbar.examplesLabel')}</label>}
          <select
            onChange={(e) => {
              const example = EXAMPLE_PROGRAMS.find((ex) => ex.id === e.target.value);
              if (example) onLoadExample(example.code);
            }}
            defaultValue=""
            aria-label={t('toolbar.examplesLabel')}
          >
            <option value="" disabled>
              {isMobile ? '…' : t('toolbar.examplesPlaceholder')}
            </option>
            {EXAMPLE_PROGRAMS.map((example) => (
              <option key={example.id} value={example.id}>
                {t(example.nameKey) as string}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
