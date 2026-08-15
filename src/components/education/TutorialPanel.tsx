import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { tutorials, type Tutorial, type TutorialStep } from '../../lib/education/content';
import { ChevronRight, ChevronLeft, Lightbulb } from 'lucide-react';

interface TutorialPanelProps {
  onLoadCode: (code: string) => void;
}

export function TutorialPanel({ onLoadCode }: TutorialPanelProps) {
  const { t } = useTranslation();
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showHint, setShowHint] = useState(false);

  const currentStep: TutorialStep | null = selectedTutorial?.steps[currentStepIndex] ?? null;

  return (
    <div className="tutorial-panel">
      {!selectedTutorial ? (
        <div className="tutorial-list">
          <h3>{t('tutorials.title')}</h3>
          {tutorials.map((tutorial) => (
            <button
              key={tutorial.id}
              className="tutorial-card"
              onClick={() => {
                setSelectedTutorial(tutorial);
                setCurrentStepIndex(0);
                setShowHint(false);
              }}
            >
              <span className="tutorial-card-title">{t(tutorial.titleKey)}</span>
              <span className="tutorial-card-desc">{t(tutorial.descriptionKey)}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="tutorial-steps">
          <div className="tutorial-header">
            <button className="back-btn" onClick={() => setSelectedTutorial(null)}>
              ← {t('common.back')}
            </button>
            <h3>{t(selectedTutorial.titleKey)}</h3>
            <span className="step-counter">
              {currentStepIndex + 1} / {selectedTutorial.steps.length}
            </span>
          </div>

          {currentStep && (
            <div className="step-content">
              <h4>{t(currentStep.titleKey)}</h4>
              <p>{t(currentStep.contentKey)}</p>

              {currentStep.hintKey && (
                <div className="hint-section">
                  <button className="hint-btn" onClick={() => setShowHint(!showHint)}>
                    <Lightbulb size={16} />
                    {t('common.hint')}
                  </button>
                  {showHint && (
                    <p className="hint-text">{t(currentStep.hintKey!)}</p>
                  )}
                </div>
              )}

              {currentStep.code && (
                <button
                  className="load-code-btn"
                  onClick={() => onLoadCode(currentStep.code!)}
                >
                  {t('tutorials.loadCode')}
                </button>
              )}
            </div>
          )}

          <div className="step-navigation">
            <button
              className="nav-btn"
              disabled={currentStepIndex === 0}
              onClick={() => {
                setCurrentStepIndex((i) => i - 1);
                setShowHint(false);
              }}
            >
              <ChevronLeft size={16} /> {t('common.previous')}
            </button>
            <button
              className="nav-btn"
              disabled={currentStepIndex === selectedTutorial.steps.length - 1}
              onClick={() => {
                setCurrentStepIndex((i) => i + 1);
                setShowHint(false);
              }}
            >
              {t('common.next')} <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
