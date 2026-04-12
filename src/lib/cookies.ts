export const setLanguageCookie = (locale: string) => {
  if (typeof window !== 'undefined') {
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=${60 * 60 * 24 * 365}`;
  }
};