import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Diagnostic } from '../lib/logo-core/types';
import { getDir } from '../lib/i18n';
import { AlertCircle, AlertTriangle, Info, ChevronUp, ChevronDown } from 'lucide-react';

interface ProblemsPanelProps {
  diagnostics: Diagnostic[];
  onJumpToLine: (line: number) => void;
}

export function ProblemsPanel({ diagnostics, onJumpToLine }: ProblemsPanelProps) {
  const { t, i18n } = useTranslation();
  const dir = getDir(i18n.language);
  const [collapsed, setCollapsed] = useState(false);

  const errors = diagnostics.filter((d) => d.severity === 'error');
  const warnings = diagnostics.filter((d) => d.severity === 'warning');
  const totalProblems = diagnostics.length;

  const getIcon = (severity: Diagnostic['severity']) => {
    switch (severity) {
      case 'error':
        return <AlertCircle size={14} className="severity-icon error" />;
      case 'warning':
        return <AlertTriangle size={14} className="severity-icon warning" />;
      default:
        return <Info size={14} className="severity-icon info" />;
    }
  };

  return (
    <div
      className={`problems-panel ${collapsed ? 'collapsed' : ''}`}
      dir={dir}
      role="region"
      aria-label={t('ariaLabels.problemsPanel')}
    >
      <button
        className="problems-header"
        onClick={() => setCollapsed(!collapsed)}
        aria-expanded={!collapsed}
        aria-label={collapsed ? t('problems.expandLabel') : t('problems.collapseLabel')}
      >
        <div className="problems-header-left">
          {collapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          <span className="problems-title">{t('problems.title')}</span>
          {totalProblems > 0 && (
            <span className="problems-count">
              {t('problems.count', { count: totalProblems })}
            </span>
          )}
        </div>
        <div className="problems-summary">
          {errors.length > 0 && (
            <span className="error-count">{errors.length} {t('problems.error')}</span>
          )}
          {warnings.length > 0 && (
            <span className="warning-count">{warnings.length} {t('problems.warning')}</span>
          )}
        </div>
      </button>

      {!collapsed && (
        <div className="problems-list" role="list" aria-live="polite">
          {totalProblems === 0 ? (
            <div className="no-problems">{t('problems.noProblems')}</div>
          ) : (
            diagnostics.map((diag, idx) => (
              <button
                key={idx}
                className="problem-item"
                onClick={() => onJumpToLine(diag.range.start.line)}
                role="listitem"
              >
                {getIcon(diag.severity)}
                <span className="problem-line">
                  {t('problems.line', { line: diag.range.start.line })}
                </span>
                <span className="problem-message">{diag.kidMessage}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
