import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme, ThemeColors, lightTheme, darkTheme } from '../types/theme';
import { Language, Translations } from '../types/language';
import { translations } from '../i18n/translations';

interface AppContextType {
  theme: Theme;
  toggleTheme: () => void;
  colors: ThemeColors;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('light');
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const storedTheme = await AsyncStorage.getItem('theme');
      const storedLanguage = await AsyncStorage.getItem('language');
      
      if (storedTheme) setTheme(storedTheme as Theme);
      if (storedLanguage) setLanguage(storedLanguage as Language);
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    try {
      await AsyncStorage.setItem('theme', newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const changeLanguage = async (lang: Language) => {
    setLanguage(lang);
    try {
      await AsyncStorage.setItem('language', lang);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || translations['en'][key] || key;
  };

  const value = {
    theme,
    toggleTheme,
    colors: theme === 'light' ? lightTheme : darkTheme,
    language,
    setLanguage: changeLanguage,
    t,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}; 