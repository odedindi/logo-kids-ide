import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SIDEBAR_COMMANDS, type SidebarCommandGroup } from '../constants/examples';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface SidebarProps {
  onInsertCode: (code: string) => void;
  embedded?: boolean;
}

export function Sidebar({ onInsertCode, embedded }: SidebarProps) {
  const { t } = useTranslation();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['movement', 'pen'])
  );

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const content = (
    <>
      <h2 className="sidebar-title">{t('sidebar.title')}</h2>
      <p className="sidebar-hint">{t('sidebar.clickToInsert')}</p>

      <div className="sidebar-categories">
        {SIDEBAR_COMMANDS.map((group: SidebarCommandGroup) => (
          <div key={group.category} className="command-category">
            <button
              className="category-header"
              onClick={() => toggleCategory(group.category)}
              aria-expanded={expandedCategories.has(group.category)}
            >
              {expandedCategories.has(group.category) ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )}
              <span>{t(group.categoryKey)}</span>
            </button>

            {expandedCategories.has(group.category) && (
              <div className="category-commands">
                {group.commands.map((cmd, idx) => (
                  <button
                    key={idx}
                    className="command-block"
                    onClick={() => onInsertCode(cmd.code)}
                    title={cmd.description}
                  >
                    <code>{cmd.label}</code>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );

  if (embedded) {
    return <div className="commands-panel">{content}</div>;
  }

  return (
    <aside className="sidebar" role="complementary" aria-label={t('ariaLabels.sidebar')}>
      {content}
    </aside>
  );
}
