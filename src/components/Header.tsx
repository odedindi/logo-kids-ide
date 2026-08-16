import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Moon, Sun, ChevronDown, Menu, X } from 'lucide-react';
import { getDir } from '../lib/i18n';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸', dir: 'ltr' as const },
  { code: 'he', label: 'עברית', flag: '🇮🇱', dir: 'rtl' as const },
];

interface HeaderProps {
  onOpenShortcuts?: () => void;
  onOpenAccessibility?: () => void;
  isMobile?: boolean;
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export function Header({ onOpenShortcuts, onOpenAccessibility, isMobile, sidebarOpen, onToggleSidebar }: HeaderProps) {
  const { t, i18n } = useTranslation();
  const dir = getDir(i18n.language);

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('logo-kids-dark-mode') === 'true';
  });
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const langButtonRef = useRef<HTMLButtonElement>(null);
  const langListRef = useRef<HTMLDivElement>(null);

  const currentLang = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0];

  useEffect(() => {
    if (darkMode) {
      document.documentElement.dataset.theme = 'dark';
    } else {
      delete document.documentElement.dataset.theme;
    }
    localStorage.setItem('logo-kids-dark-mode', String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    if (!langOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLangOpen(false);
        langButtonRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [langOpen]);

  const changeLanguage = useCallback((code: string) => {
    i18n.changeLanguage(code);
    document.documentElement.dir = getDir(code);
    setLangOpen(false);
    langButtonRef.current?.focus();
  }, [i18n]);

  const handleLangKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!langListRef.current) return;
    const items = langListRef.current.querySelectorAll('[role="option"]');
    const currentIndex = LANGUAGES.findIndex((l) => l.code === i18n.language);
    let nextIndex = currentIndex;

    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault();
        nextIndex = (currentIndex + 1) % LANGUAGES.length;
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault();
        nextIndex = (currentIndex - 1 + LANGUAGES.length) % LANGUAGES.length;
        break;
      case 'Home':
        e.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        nextIndex = LANGUAGES.length - 1;
        break;
      default:
        return;
    }
    changeLanguage(LANGUAGES[nextIndex].code);
    (items[nextIndex] as HTMLElement)?.focus();
  }, [i18n.language, changeLanguage]);

  return (
    <header className="app-header" dir={dir} role="banner" aria-label={t('ariaLabels.header')}>
      <div className="header-left">
        {isMobile && onToggleSidebar && (
          <button
            className="mobile-sidebar-toggle"
            onClick={onToggleSidebar}
            aria-label={sidebarOpen ? t('ariaLabels.closeSidebar') : t('ariaLabels.openSidebar')}
            aria-expanded={sidebarOpen}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        )}
        <h1 className="app-title">{t('app.name')}</h1>
        {!isMobile && <span className="app-tagline">{t('app.tagline')}</span>}
      </div>

      <div className="header-right">
        <button
          className="theme-toggle"
          onClick={() => setDarkMode((d) => !d)}
          aria-label={darkMode ? t('header.theme.light') : t('header.theme.dark')}
          title={darkMode ? t('header.theme.light') : t('header.theme.dark')}
        >
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {onOpenShortcuts && (
          <button
            className="shortcuts-toggle"
            onClick={onOpenShortcuts}
            aria-label={t('ariaLabels.keyboardShortcuts')}
            title={t('ariaLabels.keyboardShortcuts')}
          >
            ⌨
          </button>
        )}

        {onOpenAccessibility && (
          <button
            className="shortcuts-toggle"
            onClick={onOpenAccessibility}
            aria-label={t('ariaLabels.accessibilityStatement')}
            title={t('ariaLabels.accessibilityStatement')}
          >
            ♿
          </button>
        )}

        <div className="lang-dropdown" ref={langRef}>
          <button
            ref={langButtonRef}
            className="lang-toggle"
            onClick={() => setLangOpen((o) => !o)}
            aria-expanded={langOpen}
            aria-haspopup="listbox"
            aria-label={t('header.languageSwitcher.label')}
          >
            <span className="lang-flag">{currentLang.flag}</span>
            <span className="lang-code">{currentLang.code.toUpperCase()}</span>
            <ChevronDown size={14} className={`lang-chevron ${langOpen ? 'open' : ''}`} />
          </button>
          {langOpen && (
            <div
              ref={langListRef}
              className="lang-menu"
              role="listbox"
              aria-label={t('header.languageSwitcher.label')}
              onKeyDown={handleLangKeyDown}
            >
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  role="option"
                  aria-selected={lang.code === i18n.language}
                  className={`lang-option ${lang.code === i18n.language ? 'active' : ''}`}
                  onClick={() => changeLanguage(lang.code)}
                  tabIndex={lang.code === i18n.language ? 0 : -1}
                >
                  <span className="lang-flag">{lang.flag}</span>
                  <span className="lang-name">{lang.label}</span>
                  {lang.code === i18n.language && <span className="lang-check">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
