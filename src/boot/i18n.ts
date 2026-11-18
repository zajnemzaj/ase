import { defineBoot } from '#q-app';
import { LocalStorage } from 'quasar';
import { createI18n } from 'vue-i18n';

import messages from '@/i18n';

export type MessageLanguages = keyof typeof messages;
// Type-define 'en-US' as the master schema for the resource
export type MessageSchema = (typeof messages)['en-US'];

// See https://vue-i18n.intlify.dev/guide/advanced/typescript.html#global-resource-schema-type-definition
/* eslint-disable @typescript-eslint/no-empty-object-type */
declare module 'vue-i18n' {
  // define the locale messages schema
  export interface DefineLocaleMessage extends MessageSchema {}

  // define the datetime format schema
  export interface DefineDateTimeFormat {}

  // define the number format schema
  export interface DefineNumberFormat {}
}
/* eslint-enable @typescript-eslint/no-empty-object-type */

export const LOCALE_KEY = 'ase.locale';
export const languages: { value: MessageLanguages; label: string }[] = [
  { value: 'en-US', label: 'English' },
  { value: 'hu', label: 'Magyar' },
];

function isLanguage(value: unknown): value is MessageLanguages {
  return typeof value === 'string' && value in messages;
}

// Saved choice first, then the browser's language, English otherwise
function initialLocale(): MessageLanguages {
  const saved = LocalStorage.getItem(LOCALE_KEY);
  if (isLanguage(saved)) return saved;
  return navigator.language.toLowerCase().startsWith('hu') ? 'hu' : 'en-US';
}

export default defineBoot(({ app }) => {
  const i18n = createI18n<{ message: MessageSchema }, MessageLanguages>({
    locale: initialLocale(),
    fallbackLocale: 'en-US',
    legacy: false,
    messages,
  });

  // Set i18n instance on app
  app.use(i18n);
});
