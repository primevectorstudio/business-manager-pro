// Import translations from JSON locale files
import enTranslations from '../locales/en.json';
import hiTranslations from '../locales/hi.json';
import urTranslations from '../locales/ur.json';
import bnTranslations from '../locales/bn.json';
import arTranslations from '../locales/ar.json';

export const translations = {
  en: enTranslations,
  hi: hiTranslations,
  ur: urTranslations,
  bn: bnTranslations,
  ar: arTranslations,
};

export type Language = keyof typeof translations;

export function useTranslation(language: Language) {
  return translations[language] || translations.en;
}

export function getAvailableLanguages(): Language[] {
  return Object.keys(translations) as Language[];
}

export function isRTLLanguage(language: Language): boolean {
  return language === 'ur' || language === 'ar';
}
