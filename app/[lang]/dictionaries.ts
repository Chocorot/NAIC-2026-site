import 'server-only'

const dictionaries = {
  en: () => import('./dictionaries/en.json').then((module) => module.default),
  zh: () => import('./dictionaries/zh.json').then((module) => module.default),
  ms: () => import('./dictionaries/ms.json').then((module) => module.default),
  ja: () => import('./dictionaries/ja.json').then((module) => module.default),
  de: () => import('./dictionaries/de.json').then((module) => module.default),
}

export type Locale = keyof typeof dictionaries

export const locales = Object.keys(dictionaries) as Locale[]

export const hasLocale = (locale: string): locale is Locale =>
  locale in dictionaries

export type Dictionary = typeof import('./dictionaries/en.json')

export const getDictionary = async (locale: Locale): Promise<Dictionary> => dictionaries[locale]()
