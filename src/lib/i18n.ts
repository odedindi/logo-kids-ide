import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import enTranslation from '../locales/en.json'
import heTranslation from '../locales/he.json'

export const SUPPORTED_LANGUAGES = ['en', 'he'] as const
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

const RTL_LANGUAGES: ReadonlySet<string> = new Set(['he', 'ar', 'fa'])

export function isRTL(lang: string): boolean {
  return RTL_LANGUAGES.has(lang)
}

export function getDir(lang: string): 'ltr' | 'rtl' {
  return isRTL(lang) ? 'rtl' : 'ltr'
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslation },
      he: { translation: heTranslation },
    },
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGES,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'logo-kids-lang',
    },
  })

export default i18n
