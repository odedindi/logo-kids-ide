import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { conceptLessons, type ConceptLesson } from '../../lib/education/content';
import { BookOpen, ChevronRight } from 'lucide-react';

interface ConceptBrowserProps {
  onLoadCode: (code: string) => void;
}

export function ConceptBrowser({ onLoadCode }: ConceptBrowserProps) {
  const { t } = useTranslation();
  const [selectedConcept, setSelectedConcept] = useState<ConceptLesson | null>(null);

  return (
    <div className="concept-browser">
      {selectedConcept ? (
        <div className="concept-detail">
          <button className="back-btn" onClick={() => setSelectedConcept(null)}>
            ← {t('common.back')}
          </button>
          <h3>{t(selectedConcept.titleKey)}</h3>
          <p>{t(selectedConcept.contentKey)}</p>

          <div className="concept-examples">
            <h4>{t('concepts.examples')}</h4>
            {selectedConcept.examples.map((example, i) => (
              <div key={i} className="concept-example-card">
                <pre className="concept-code">{example.code}</pre>
                <p>{t(example.descriptionKey)}</p>
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
      ) : (
        <div className="concept-list">
          <h3>{t('concepts.title')}</h3>
          {conceptLessons.map((concept) => (
            <button
              key={concept.id}
              className="concept-card"
              onClick={() => setSelectedConcept(concept)}
            >
              <div className="concept-card-content">
                <BookOpen size={20} className="concept-icon" />
                <div>
                  <span className="concept-title">{t(concept.titleKey)}</span>
                  <span className="concept-desc">
                    {t(concept.contentKey).substring(0, 80)}...
                  </span>
                </div>
              </div>
              <ChevronRight size={16} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
