import { messages } from './messages.js';

export const languages = { ko: '한국어', en: 'English', ja: '日本語' };

export function preference(key) {
  try { return globalThis.localStorage?.getItem('stage-ex.' + key); } catch { return null; }
}
export function remember(key, value) {
  try { globalThis.localStorage?.setItem('stage-ex.' + key, value); } catch {}
}

const requested = new URLSearchParams(globalThis.location?.search).get('lang');
const preferred = [requested, preference('language'), ...(globalThis.navigator?.languages || [])];
export const language = preferred.map(tag => tag?.split('-')[0]).find(tag => Object.hasOwn(languages, tag)) || 'ko';
if (language === requested) remember('language', language);

export function tr(source, ...values) {
  const translated = language === 'ko' ? source : messages[source]?.[language === 'en' ? 0 : 1] ?? source;
  return values.length ? translated.replace(/\{(\d+)\}/g, (_, index) => values[index]) : translated;
}

export function languageSelect(onChange) {
  const select = document.createElement('select');
  select.className = 'language-select';
  select.setAttribute('aria-label', tr('언어'));
  for (const [code, label] of Object.entries(languages)) select.add(new Option(label, code));
  select.value = language;
  select.addEventListener('change', () => {
    remember('language', select.value);
    onChange(select.value);
  });
  return select;
}
