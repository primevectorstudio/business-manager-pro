import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import { useAppStore } from './store';
import { isRTLLanguage } from './translations';
import type { Language } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => Promise<void>;
  isLoading: boolean;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [isLoading, setIsLoading] = useState(true);
  const [isRTL, setIsRTL] = useState(false);
  const { updateSettings } = useAppStore();

  // Load language on mount
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('user_language');
        const langToSet = (savedLanguage as Language) || 'en';
        setLanguageState(langToSet);
        
        // Set RTL status
        const rtl = isRTLLanguage(langToSet);
        setIsRTL(rtl);
        
        // Apply RTL setting to I18nManager
        if (rtl !== I18nManager.isRTL) {
          I18nManager.forceRTL(rtl);
        }
      } catch (error) {
        console.error('Error loading language:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLanguage();
  }, []);

  const setLanguage = async (newLanguage: Language) => {
    try {
      const wasRTL = isRTL;
      const willBeRTL = isRTLLanguage(newLanguage);
      
      // Update state
      setLanguageState(newLanguage);
      setIsRTL(willBeRTL);
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('user_language', newLanguage);
      
      // Update app store
      await updateSettings({ language: newLanguage });
      
      // If RTL status changed, reload the app
      if (wasRTL !== willBeRTL) {
        // Force RTL setting
        I18nManager.forceRTL(willBeRTL);
        
        // Reload app to apply RTL changes
        try {
          await Updates.reloadAsync();
        } catch (reloadError) {
          console.warn('App reload not available in development:', reloadError);
          // In development, RTL changes may not require reload
        }
      }
    } catch (error) {
      console.error('Error setting language:', error);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isLoading, isRTL }}>
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
