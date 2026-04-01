import { create } from 'zustand';
import { Product, Sale, Expense } from './database';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Currency mapping by country
export const COUNTRY_CURRENCY_MAP: Record<string, { code: string; symbol: string }> = {
  'India': { code: 'INR', symbol: '₹' },
  'Pakistan': { code: 'PKR', symbol: '₨' },
  'Bangladesh': { code: 'BDT', symbol: '৳' },
  'UAE': { code: 'AED', symbol: 'د.إ' },
  'Saudi Arabia': { code: 'SAR', symbol: '﷼' },
  'USA': { code: 'USD', symbol: '$' },
  'UK': { code: 'GBP', symbol: '£' },
  'Canada': { code: 'CAD', symbol: 'C$' },
  'Australia': { code: 'AUD', symbol: 'A$' },
  'Nepal': { code: 'NPR', symbol: 'Rs' },
  'Sri Lanka': { code: 'LKR', symbol: 'Rs' },
  'Malaysia': { code: 'MYR', symbol: 'RM' },
  'Singapore': { code: 'SGD', symbol: 'S$' },
  'South Africa': { code: 'ZAR', symbol: 'R' },
  'Kenya': { code: 'KES', symbol: 'KSh' },
  'Nigeria': { code: 'NGN', symbol: '₦' },
};

interface AppSettings {
  businessName: string;
  currency: string;
  currencySymbol: string;
  country: string;
  language: string;
  taxPercentage: number;
  lowStockThreshold: number;
  notificationsEnabled: boolean;
}

interface AppStore {
  // Settings
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  loadSettings: () => Promise<void>;

  // Cart state
  cartItems: Array<{ productId: string; quantity: number; product?: Product }>;
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;

  // UI state
  loading: boolean;
  setLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  successMessage: string | null;
  setSuccessMessage: (message: string | null) => void;

  // Discount and payment
  discount: number;
  setDiscount: (discount: number) => void;
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
}

const defaultSettings: AppSettings = {
  businessName: 'My Business',
  currency: 'USD',
  currencySymbol: '$',
  country: 'USA',
  language: 'English',
  taxPercentage: 0,
  lowStockThreshold: 5,
  notificationsEnabled: true,
};

export const useAppStore = create<AppStore>((set) => ({
  // Settings
  settings: defaultSettings,

  updateSettings: async (updates: Partial<AppSettings>) => {
    set((state) => ({
      settings: { ...state.settings, ...updates },
    }));

    try {
      const state = useAppStore.getState();
      await AsyncStorage.setItem('appSettings', JSON.stringify(state.settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  },

  loadSettings: async () => {
    try {
      const stored = await AsyncStorage.getItem('appSettings');
      if (stored) {
        const settings = JSON.parse(stored);
        set({ settings });
      }
      
      // Also load country and language from onboarding if available
      const country = await AsyncStorage.getItem('user_country');
      const language = await AsyncStorage.getItem('user_language');
      
      if (country || language) {
        const updates: Partial<AppSettings> = {};
        
        if (country) {
          updates.country = country;
          const currencyInfo = COUNTRY_CURRENCY_MAP[country];
          if (currencyInfo) {
            updates.currency = currencyInfo.code;
            updates.currencySymbol = currencyInfo.symbol;
          }
        }
        
        if (language) {
          updates.language = language;
        }
        
        set((state) => ({
          settings: { ...state.settings, ...updates },
        }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  },

  // Cart
  cartItems: [],

  addToCart: (product: Product, quantity: number) => {
    set((state) => {
      const existingItem = state.cartItems.find((item) => item.productId === product.id);

      if (existingItem) {
        return {
          cartItems: state.cartItems.map((item) =>
            item.productId === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          ),
        };
      }

      return {
        cartItems: [...state.cartItems, { productId: product.id, quantity, product }],
      };
    });
  },

  removeFromCart: (productId: string) => {
    set((state) => ({
      cartItems: state.cartItems.filter((item) => item.productId !== productId),
    }));
  },

  updateCartQuantity: (productId: string, quantity: number) => {
    set((state) => ({
      cartItems: state.cartItems.map((item) =>
        item.productId === productId ? { ...item, quantity: Math.max(0, quantity) } : item
      ),
    }));
  },

  clearCart: () => {
    set({ cartItems: [], discount: 0, paymentMethod: 'cash' });
  },

  // UI state
  loading: false,
  setLoading: (loading: boolean) => set({ loading }),

  error: null,
  setError: (error: string | null) => set({ error }),

  successMessage: null,
  setSuccessMessage: (message: string | null) => set({ successMessage: message }),

  // Discount and payment
  discount: 0,
  setDiscount: (discount: number) => set({ discount: Math.max(0, discount) }),

  paymentMethod: 'cash',
  setPaymentMethod: (method: string) => set({ paymentMethod: method }),
}));
