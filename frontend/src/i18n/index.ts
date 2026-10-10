import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import ru from './ru.json'
import uz from './uz.json'

export const LANGUAGES = ['uz', 'ru'] as const
export type Language = (typeof LANGUAGES)[number]

const STORAGE_KEY = 'locale'

function isLanguage(value: unknown): value is Language {
  return LANGUAGES.includes(value as Language)
}

function initialLanguage(): Language {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (isLanguage(saved)) return saved
  } catch {
    // localStorage yopiq (masalan, maxfiy rejim) — sukut bo'yicha o'zbekcha.
  }
  return 'uz'
}

export const i18n = i18next

void i18n.use(initReactI18next).init({
  resources: { uz: { translation: uz }, ru: { translation: ru } },
  lng: initialLanguage(),
  fallbackLng: 'uz',
  supportedLngs: [...LANGUAGES],
  interpolation: { escapeValue: false },
  initAsync: false,
})

document.documentElement.lang = i18n.language

/** Interfeys tilini almashtiradi va tanlovni brauzerda eslab qoladi. */
export function setLanguage(lang: Language): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    // Saqlab bo'lmasa ham til almashadi.
  }
  document.documentElement.lang = lang
  void i18n.changeLanguage(lang)
}
