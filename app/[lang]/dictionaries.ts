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

// Correctly extract the shape of the dictionary from the English master file
export type Dictionary = Awaited<ReturnType<typeof dictionaries['en']>>

/**
 * Deep merges two objects. Used to fill gaps in translations using the English base.
 */
function deepMerge<T extends Record<string, unknown>>(target: T, source: unknown): T {
  const output = { ...target } as Record<string, unknown>;
  if (!source || typeof source !== 'object' || Array.isArray(source)) return output as T;

  const s = source as Record<string, unknown>;

  for (const key in s) {
    if (Object.prototype.hasOwnProperty.call(s, key)) {
      const sValue = s[key];
      const tValue = output[key];

      if (sValue && typeof sValue === 'object' && !Array.isArray(sValue)) {
        output[key] = deepMerge(
          (tValue && typeof tValue === 'object' && !Array.isArray(tValue)
            ? tValue
            : {}) as Record<string, unknown>,
          sValue
        );
      } else {
        output[key] = sValue;
      }
    }
  }
  return output as T;
}

/**
 * Recursively fills an object structure with its own paths as leaf values.
 * This ensures that for every known key, there is a string value representing its path.
 */
function fillPaths<T extends Record<string, unknown>>(obj: T, path: string = ''): T {
  const output = (Array.isArray(obj) ? [] : {}) as Record<string, unknown>;
  for (const key in obj) {
    const currentPath = path ? `${path}.${key}` : key;
    const value = obj[key];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      output[key] = fillPaths(value as Record<string, unknown>, currentPath);
    } else {
      output[key] = currentPath;
    }
  }
  return output as T;
}

export const getDictionary = async (locale: Locale): Promise<Dictionary> => {
  // Load all dictionaries to build a master schema of all available keys
  // This ensures that any key present in ANY language will show its path ID if missing in others
  const allDictionaries = await Promise.all(
    locales.map((l) => dictionaries[l]())
  );

  // Combine all keys into a single master structure
  const masterSchema = allDictionaries.reduce(
    (acc, current) => deepMerge(acc as Record<string, unknown>, current),
    {} as Record<string, unknown>
  );

  const en = await dictionaries.en();
  const target = locale === 'en' ? en : await dictionaries[locale]();

  // 1. Create a skeleton from the MASTER SCHEMA where every value is its own path (e.g., "screening.title")
  // This ensures that even if EN is missing a key, we have its ID as a fallback.
  const skeleton = fillPaths(masterSchema as Record<string, unknown>);

  // 2. Merge English on top (fills in actual English values for known keys)
  const withEn = deepMerge(skeleton, en as Record<string, unknown>);

  // 3. Merge target locale on top (fills in available translations)
  const merged = target
    ? deepMerge(withEn, target as Record<string, unknown>)
    : withEn;

  // 4. Sanitation: Stringify and parse to ensure a STRICTLY plain, serializable object.
  // This resolves the error: "Only plain objects can be passed to Client Components..."
  return JSON.parse(JSON.stringify(merged)) as Dictionary;
};
