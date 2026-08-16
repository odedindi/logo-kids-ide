import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Diagnostic } from '../lib/logo-core/types';
import type { QuickFix } from '../lib/editor/quick-fix';
import { getDir } from '../lib/i18n';
import { AlertCircle, AlertTriangle, Info, ChevronUp, ChevronDown, Wand2 } from 'lucide-react';

interface ProblemsPanelProps {
  diagnostics: Diagnostic[];
  quickFixes: QuickFix[];
  onJumpToLine: (line: number) => void;
  onApplyFix: (fix: QuickFix) => void;
  onApplyAllFixes: () => void;
}

function fixForDiagnostic(diag: Diagnostic, quickFixes: QuickFix[]): QuickFix | undefined {
  return quickFixes.find(
    (fix) => fix.from >= diag.range.start.offset && fix.from <= diag.range.end.offset,
  );
}

export function ProblemsPanel({
  diagnostics,
  quickFixes,
  onJumpToLine,
  onApplyFix,
  onApplyAllFixes,
}: ProblemsPanelProps) {
  const { t, i18n } = useTranslation();
  const dir = getDir(i18n.language);
  const [collapsed, setCollapsed] = useState(false);

  const errors = diagnostics.filter((d) => d.severity === 'error');
  const warnings = diagnostics.filter((d) => d.severity === 'warning');
  const totalProblems = diagnostics.length;
  const fixableCount = quickFixes.length;

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
          {!collapsed && fixableCount > 0 && (
            <button
              className="fix-all-btn"
              onClick={(e) => {
                e.stopPropagation();
                onApplyAllFixes();
              }}
              aria-label={t('problems.fixItForMe')}
            >
              <Wand2 size={13} />
              {t('problems.fixItForMe')}
            </button>
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
            diagnostics.map((diag, idx) => {
              const fix = fixForDiagnostic(diag, quickFixes);
              return (
                <div
                  key={idx}
                  className="problem-item"
                  role="listitem"
                  tabIndex={0}
                  onClick={() => onJumpToLine(diag.range.start.line)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onJumpToLine(diag.range.start.line);
                    }
                  }}
                  aria-label={diag.kidMessage}
                >
                  {getIcon(diag.severity)}
                  <span className="problem-line">
                    {t('problems.line', { line: diag.range.start.line })}
                  </span>
                  <span className="problem-message">{diag.kidMessage}</span>
                  {fix && (
                    <button
                      className="problem-fix-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onApplyFix(fix);
                      }}
                      aria-label={fix.label}
                    >
                      <Wand2 size={12} />
                      {fix.label}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
