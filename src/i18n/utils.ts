import { ui, defaultLang, type Lang, type TranslationKey } from './ui';

/** Extract the locale from a URL pathname (e.g. `/en/blog` -> `en`). */
export function getLangFromUrl(url: URL): Lang {
  const [, langSegment] = url.pathname.split('/');
  if (langSegment in ui) return langSegment as Lang;
  return defaultLang;
}

/** Translate a key for the given language, falling back to the default lang. */
export function t(lang: Lang, key: TranslationKey): string {
  return ui[lang]?.[key] ?? ui[defaultLang][key];
}

/** Build the equivalent path of the current URL in another locale. */
export function localizePath(pathname: string, targetLang: Lang): string {
  const segments = pathname.split('/').filter(Boolean);
  if (segments[0] && segments[0] in ui) {
    segments.shift();
  }
  const tail = segments.length ? '/' + segments.join('/') : '';
  return targetLang === defaultLang ? tail || '/' : `/${targetLang}${tail}`;
}
