import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from './store';

interface LanguageContextType {
  language: string;
  setLanguage: (language: string) => Promise<void>;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState('English');
  const [isLoading, setIsLoading] = useState(true);
  const { updateSettings } = useAppStore();

  // Load language on mount
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('user_language');
        if (savedLanguage) {
          setLanguageState(savedLanguage);
        }
      } catch (error) {
        console.error('Error loading language:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLanguage();
  }, []);

  const setLanguage = async (newLanguage: string) => {
    try {
      setLanguageState(newLanguage);
      await AsyncStorage.setItem('user_language', newLanguage);
      await updateSettings({ language: newLanguage });
    } catch (error) {
      console.error('Error setting language:', error);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
