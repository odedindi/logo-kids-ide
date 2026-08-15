import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { challenges, conceptLessons, type Challenge, type ConceptLesson } from '../../lib/education/content';
import { Trophy, BookOpen, CheckCircle, AlertCircle } from 'lucide-react';

interface ChallengePanelProps {
  onLoadCode: (code: string) => void;
  onValidateCode: (code: string, challenge: Challenge) => boolean;
  code: string;
}

type ChallengeFeedback = 'success' | 'retry' | null;

export function ChallengePanel({ onLoadCode, onValidateCode, code }: ChallengePanelProps) {
  const { t } = useTranslation();
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [completedChallenges, setCompletedChallenges] = useState<Set<string>>(new Set());
  const [showConcept, setShowConcept] = useState<ConceptLesson | null>(null);
  const [feedback, setFeedback] = useState<ChallengeFeedback>(null);

  useEffect(() => {
    setFeedback(null);
  }, [code]);

  const handleCheckCode = useCallback(() => {
    if (!selectedChallenge) return;
    const solved = onValidateCode(code, selectedChallenge);
    setFeedback(solved ? 'success' : 'retry');
    if (solved) {
      setCompletedChallenges((prev) => new Set(prev).add(selectedChallenge.id));
    }
  }, [code, onValidateCode, selectedChallenge]);

  const openChallenge = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setFeedback(null);
  };

  const closeChallenge = () => {
    setSelectedChallenge(null);
    setFeedback(null);
  };

  const difficultyColors = {
    easy: '#22c55e',
    medium: '#f59e0b',
    hard: '#ef4444',
  };

  return (
    <div className="challenge-panel">
      {showConcept ? (
        <div className="concept-lesson">
          <button className="back-btn" onClick={() => setShowConcept(null)}>
            ← {t('common.back')}
          </button>
          <h3>{t(showConcept.titleKey)}</h3>
          <p>{t(showConcept.contentKey)}</p>

          <div className="concept-examples">
            <h4>{t('concepts.examples')}</h4>
            {showConcept.examples.map((example, i) => (
              <div key={i} className="concept-example">
                <pre>{example.code}</pre>
                <button
                  className="try-btn"
                  onClick={() => onLoadCode(example.code)}
                >
                  {t('concepts.tryIt')}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : selectedChallenge ? (
        <div className="challenge-detail">
          <button className="back-btn" onClick={closeChallenge}>
            ← {t('common.back')}
          </button>
          <h3>{t(selectedChallenge.titleKey)}</h3>
          <span
            className="difficulty-badge"
            style={{ backgroundColor: difficultyColors[selectedChallenge.difficulty] }}
          >
            {t(`challenges.difficulty.${selectedChallenge.difficulty}`)}
          </span>
          <p>{t(selectedChallenge.descriptionKey)}</p>

          <button
            className="load-code-btn"
            onClick={() => onLoadCode(selectedChallenge.starterCode)}
          >
            {t('challenges.startChallenge')}
          </button>

          <div className="challenge-hints">
            <h4>{t('challenges.hints')}</h4>
            {selectedChallenge.hintKeys.map((hintKey, i) => (
              <div key={i} className="hint-item">
                <AlertCircle size={14} />
                <span>{t(hintKey)}</span>
              </div>
            ))}
          </div>

          <button className="check-code-btn" onClick={handleCheckCode}>
            <CheckCircle size={16} />
            {t('challenges.checkSolution')}
          </button>

          {feedback === 'success' && (
            <div className="challenge-feedback success" role="status">
              <CheckCircle size={20} color="#22c55e" />
              <span>{t('challenges.feedback.success')}</span>
            </div>
          )}
          {feedback === 'retry' && (
            <div className="challenge-feedback retry" role="status">
              <AlertCircle size={20} color="#f59e0b" />
              <span>{t('challenges.feedback.retry')}</span>
            </div>
          )}

          <button
            className="view-concept-btn"
            onClick={() => {
              const concept = conceptLessons.find(
                (c) => c.id === selectedChallenge.conceptId
              );
              if (concept) setShowConcept(concept);
            }}
          >
            <BookOpen size={16} />
            {t('challenges.learnMore')}
          </button>
        </div>
      ) : (
        <div className="challenge-list">
          <h3>{t('challenges.title')}</h3>
          {challenges.map((challenge) => (
            <button
              key={challenge.id}
              className="challenge-card"
              onClick={() => openChallenge(challenge)}
            >
              <div className="challenge-card-header">
                {completedChallenges.has(challenge.id) ? (
                  <CheckCircle size={20} color="#22c55e" />
                ) : (
                  <Trophy size={20} color="#f59e0b" />
                )}
                <span className="challenge-title">{t(challenge.titleKey)}</span>
              </div>
              <span
                className="difficulty-badge"
                style={{ backgroundColor: difficultyColors[challenge.difficulty] }}
              >
                {t(`challenges.difficulty.${challenge.difficulty}`)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
