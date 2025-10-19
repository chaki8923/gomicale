import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import ja from './locales/ja.json';
import en from './locales/en.json';

const LANGUAGE_KEY = 'selectedLanguage';

// デバイスの言語を取得
const getDeviceLanguage = () => {
  const locale = Localization.locale || Localization.getLocales()[0]?.languageCode;
  if (locale.startsWith('ja')) return 'ja';
  return 'en';
};

// 保存された言語を取得
const getSavedLanguage = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
    return savedLanguage || getDeviceLanguage();
  } catch (error) {
    return getDeviceLanguage();
  }
};

// 言語を保存
export const saveLanguage = async (language) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, language);
  } catch (error) {
    console.error('Error saving language:', error);
  }
};

// i18nの初期化
const initI18n = async () => {
  const savedLanguage = await getSavedLanguage();

  i18n
    .use(initReactI18next)
    .init({
      resources: {
        ja: { translation: ja },
        en: { translation: en },
      },
      lng: savedLanguage,
      fallbackLng: 'ja',
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });
};

initI18n();

export default i18n;

