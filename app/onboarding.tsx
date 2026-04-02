import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  FlatList,
  Pressable,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/translations';

const COUNTRIES = [
  { name: 'India', flag: '🇮🇳' },
  { name: 'Pakistan', flag: '🇵🇰' },
  { name: 'Bangladesh', flag: '🇧🇩' },
  { name: 'UAE', flag: '🇦🇪' },
  { name: 'Saudi Arabia', flag: '🇸🇦' },
  { name: 'USA', flag: '🇺🇸' },
  { name: 'UK', flag: '🇬🇧' },
  { name: 'Canada', flag: '🇨🇦' },
  { name: 'Australia', flag: '🇦🇺' },
  { name: 'Nepal', flag: '🇳🇵' },
  { name: 'Sri Lanka', flag: '🇱🇰' },
  { name: 'Malaysia', flag: '🇲🇾' },
  { name: 'Singapore', flag: '🇸🇬' },
  { name: 'South Africa', flag: '🇿🇦' },
  { name: 'Kenya', flag: '🇰🇪' },
  { name: 'Nigeria', flag: '🇳🇬' },
];

const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  'India': '₹',
  'Pakistan': 'Rs',
  'Bangladesh': '৳',
  'UAE': 'د.إ',
  'Saudi Arabia': '﷼',
  'USA': '$',
  'UK': '£',
  'Canada': 'CA$',
  'Australia': 'A$',
  'Nepal': 'Rs',
  'Sri Lanka': 'Rs',
  'Malaysia': 'RM',
  'Singapore': 'S$',
  'South Africa': 'R',
  'Kenya': 'KSh',
  'Nigeria': '₦',
};

const COUNTRY_LANGUAGES: Record<string, string[]> = {
  'India': ['Hindi', 'English', 'Tamil', 'Telugu', 'Marathi', 'Bengali', 'Gujarati', 'Kannada'],
  'Pakistan': ['Urdu', 'English'],
  'Bangladesh': ['Bengali', 'English'],
  'UAE': ['Arabic', 'English', 'Urdu'],
  'Saudi Arabia': ['Arabic', 'English'],
  'USA': ['English'],
  'UK': ['English'],
  'Canada': ['English'],
  'Australia': ['English'],
  'Nepal': ['Nepali', 'English'],
  'Sri Lanka': ['Sinhala', 'Tamil', 'English'],
  'Malaysia': ['Malay', 'English', 'Tamil'],
  'Singapore': ['English', 'Malay', 'Tamil', 'Chinese'],
  'South Africa': ['English'],
  'Kenya': ['Swahili', 'English'],
  'Nigeria': ['English'],
};

export default function OnboardingScreen() {
  const colors = useColors();
  const [currentStep, setCurrentStep] = useState(1);
  const [businessName, setBusinessName] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>('English');
  const [searchQuery, setSearchQuery] = useState('');
  const { updateSettings } = useAppStore();
  const t = useTranslation(selectedLanguage || 'English');

  const filteredCountries = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const availableLanguages = selectedCountry
    ? COUNTRY_LANGUAGES[selectedCountry] || ['English']
    : [];

  // Auto-select first language when country changes
  React.useEffect(() => {
    if (availableLanguages.length > 0) {
      setSelectedLanguage(availableLanguages[0]);
    }
  }, [selectedCountry]);

  const handleNext = () => {
    if (currentStep === 2) {
      if (!businessName.trim()) {
        Alert.alert(t.error, t.business_name_required);
        return;
      }
    } else if (currentStep === 3) {
      if (!selectedCountry) {
        Alert.alert(t.error, t.country_required);
        return;
      }
    }
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      // Save to AsyncStorage
      await AsyncStorage.setItem('onboarding_complete', 'true');
      await AsyncStorage.setItem('user_country', selectedCountry || 'India');
      await AsyncStorage.setItem('user_language', selectedLanguage || 'English');

      // Get currency for selected country
      const currency = COUNTRY_CURRENCY_MAP[selectedCountry || 'India'] || '$';
      
      // Save business name and currency to app store
      updateSettings({ 
        businessName: businessName.trim(),
        currency: currency
      });

      // Navigate to main app
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      Alert.alert('Error', 'Failed to complete onboarding');
    }
  };

  const progressPercentage = (currentStep / 4) * 100;

  return (
    <ScreenContainer className="bg-background">
      {/* Progress bar */}
      <View className="h-1 bg-surface mb-6">
        <View
          className="h-full bg-primary"
          style={{ width: `${progressPercentage}%` }}
        />
      </View>

      {/* Step indicator */}
      <Text className="text-center text-sm text-muted mb-6">
        {t.step_of} {currentStep} {t.of} 4
      </Text>

      {/* Screen 1: Welcome */}
      {currentStep === 1 && (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="flex-1">
          <View className="flex-1 justify-center items-center px-6 gap-6">
            <Image
              source={require('@/assets/images/icon.png')}
              style={{ width: 120, height: 120 }}
              className="rounded-2xl"
            />
            <View className="gap-3">
              <Text className="text-3xl font-bold text-foreground text-center">
                {t.welcome_title}
              </Text>
              <Text className="text-base text-muted text-center leading-relaxed">
                {t.welcome_subtitle}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setCurrentStep(2)}
              className="bg-primary px-8 py-4 rounded-full mt-4 active:opacity-80"
            >
              <Text className="text-background font-semibold text-center">
                {t.get_started}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Screen 2: Business Name */}
      {currentStep === 2 && (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="flex-1">
          <View className="flex-1 justify-center px-6 gap-6">
            <View className="gap-2">
            <Text className="text-2xl font-bold text-foreground">
              {t.business_name_title}
            </Text>
            </View>

            <TextInput
              placeholder={t.business_name_placeholder}
              placeholderTextColor={colors.muted}
              value={businessName}
              onChangeText={setBusinessName}
              className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
              style={{
                color: colors.foreground,
              }}
            />

            <Text className="text-sm text-muted">
              {t.business_name_hint}
            </Text>

            <View className="flex-row gap-3 mt-6">
              <TouchableOpacity
                onPress={handleBack}
                className="flex-1 border border-border px-6 py-3 rounded-full active:opacity-80"
              >
                <Text className="text-foreground font-semibold text-center">
                  ← Back
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleNext}
                className="flex-1 bg-primary px-6 py-3 rounded-full active:opacity-80"
              >
                <Text className="text-background font-semibold text-center">
                  Next →
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Screen 3: Country Selection */}
      {currentStep === 3 && (
        <View className="flex-1 px-6 gap-4">
          <View className="gap-2">
            <Text className="text-2xl font-bold text-foreground">
              {t.select_country}
            </Text>
          </View>

          <TextInput
            placeholder={t.search_countries}
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
            style={{
              color: colors.foreground,
            }}
          />

          <FlatList
            data={filteredCountries}
            keyExtractor={item => item.name}
            scrollEnabled={true}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => setSelectedCountry(item.name)}
                className={cn(
                  'flex-row items-center gap-3 px-4 py-3 rounded-lg border mb-2',
                  selectedCountry === item.name
                    ? 'bg-primary border-primary'
                    : 'bg-surface border-border'
                )}
              >
                <Text className="text-2xl">{item.flag}</Text>
                <Text
                  className={cn(
                    'flex-1 text-base font-medium',
                    selectedCountry === item.name
                      ? 'text-background'
                      : 'text-foreground'
                  )}
                >
                  {item.name}
                </Text>
              </Pressable>
            )}
          />

          <View className="flex-row gap-3 mt-4">
            <TouchableOpacity
              onPress={handleBack}
              className="flex-1 border border-border px-6 py-3 rounded-full active:opacity-80"
            >
              <Text className="text-foreground font-semibold text-center">
                {t.back}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleNext}
              className="flex-1 bg-primary px-6 py-3 rounded-full active:opacity-80"
            >
              <Text className="text-background font-semibold text-center">
                {t.next}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Screen 4: Language Selection */}
      {currentStep === 4 && (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="flex-1">
          <View className="flex-1 px-6 gap-4">
            <View className="gap-2">
              <Text className="text-2xl font-bold text-foreground">
                {t.choose_language}
              </Text>
            </View>

            <View className="gap-2 flex-1">
              {availableLanguages.map((lang, index) => (
                <Pressable
                  key={lang}
                  onPress={() => setSelectedLanguage(lang)}
                  className={cn(
                    'flex-row items-center gap-3 px-4 py-3 rounded-lg border',
                    selectedLanguage === lang
                      ? 'bg-primary border-primary'
                      : 'bg-surface border-border'
                  )}
                >
                  <View
                    className={cn(
                      'w-5 h-5 rounded-full border-2 items-center justify-center',
                      selectedLanguage === lang
                        ? 'bg-background border-background'
                        : 'border-border'
                    )}
                  >
                    {selectedLanguage === lang && (
                      <View className="w-2 h-2 bg-primary rounded-full" />
                    )}
                  </View>
                  <Text
                    className={cn(
                      'flex-1 text-base font-medium',
                      selectedLanguage === lang
                        ? 'text-background'
                        : 'text-foreground'
                    )}
                  >
                    {lang}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View className="flex-row gap-3 mt-4">
              <TouchableOpacity
                onPress={handleBack}
                className="flex-1 border border-border px-6 py-3 rounded-full active:opacity-80"
              >
                <Text className="text-foreground font-semibold text-center">
                  {t.back}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleComplete}
                className="flex-1 bg-primary px-6 py-3 rounded-full active:opacity-80"
              >
                <Text className="text-background font-semibold text-center">
                  {t.lets_go}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}
    </ScreenContainer>
  );
}
