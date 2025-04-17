import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Basic configuration to prevent errors
i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: {
          'Saved Events': 'Saved Events',
          'Community': 'Community',
        }
      }
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false
    }
  });

export default i18n; 