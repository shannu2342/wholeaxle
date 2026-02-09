import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { I18nManager } from 'react-native';
import { apiRequest } from '../../services/apiClient';

// Translation service using Google Translate API
export const translateText = createAsyncThunk(
    'localization/translateText',
    async ({ text, targetLanguage, sourceLanguage = 'auto' }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/localization/translate', {
                method: 'POST',
                token,
                body: { text, targetLanguage, sourceLanguage },
            });
            return response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Load localized content for vendors
export const loadLocalizedContent = createAsyncThunk(
    'localization/loadLocalizedContent',
    async ({ vendorId, languages }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/localization/content', {
                token,
                params: { vendorId, languages },
            });
            return response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Auto-detect user language
export const detectUserLanguage = createAsyncThunk(
    'localization/detectUserLanguage',
    async () => {
        try {
            // NOTE:
            // `react-native-localize` is not guaranteed to be present/linked in this project.
            // For standalone APK stability, derive the locale from JS (if available) and
            // fall back to English.
            let deviceLanguage = 'en';
            try {
                const resolvedLocale = Intl?.DateTimeFormat?.().resolvedOptions?.().locale;
                if (typeof resolvedLocale === 'string' && resolvedLocale.length > 0) {
                    deviceLanguage = resolvedLocale.split(/[-_]/)[0] || 'en';
                }
            } catch {
                deviceLanguage = 'en';
            }

            // Map device language to supported languages
            const supportedLanguages = {
                'en': 'English',
                'hi': 'हिंदी',
                'mr': 'मराठी',
                'gu': 'ગુજરાતી',
                'ta': 'தமிழ்',
                'te': 'తెలుగు',
                'kn': 'ಕನ್ನಡ',
                'ml': 'മലയാളം'
            };

            const detectedLanguage = supportedLanguages[deviceLanguage] || 'English';
            const languageCode = Object.keys(supportedLanguages).find(
                key => supportedLanguages[key] === detectedLanguage
            ) || 'en';

            return {
                detectedLanguage,
                languageCode,
                deviceLanguage,
                confidence: 0.9
            };
        } catch (error) {
            return {
                detectedLanguage: 'English',
                languageCode: 'en',
                deviceLanguage: 'en',
                confidence: 0.5
            };
        }
    }
);

const initialState = {
    // Current language settings
    currentLanguage: 'English',
    currentLanguageCode: 'en',
    isRTL: false,

    // Available languages
    availableLanguages: [
        { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', rtl: false },
        { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳', rtl: false },
        { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳', rtl: false },
        { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳', rtl: false },
        { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳', rtl: false },
        { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳', rtl: false },
        { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳', rtl: false },
        { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳', rtl: false }
    ],

    // Language detection
    detectedLanguage: null,
    autoDetectLanguage: true,

    // Translations cache
    translations: {},
    isTranslating: false,
    translationError: null,

    // Localized content
    localizedContent: {},
    isLoadingContent: false,

    // Currency settings
    currency: 'INR',
    currencySymbol: '₹',
    currencyLocale: 'en_IN',

    // Regional settings
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12h', // '12h' or '24h'
    numberFormat: 'en_IN',

    // UI preferences
    fontSize: 'medium', // 'small', 'medium', 'large'
    textDirection: 'ltr', // 'ltr' or 'rtl'

    // Vendor content
    vendorLocalizedContent: {},

    // Loading states
    isDetectingLanguage: false,

    // Error states
    languageDetectionError: null
};

const localizationSlice = createSlice({
    name: 'localization',
    initialState,
    reducers: {
        setCurrentLanguage: (state, action) => {
            const { name, code, rtl } = action.payload;
            state.currentLanguage = name;
            state.currentLanguageCode = code;
            state.isRTL = rtl;
            state.textDirection = rtl ? 'rtl' : 'ltr';

            // Update I18nManager for RTL support
            if (rtl && !I18nManager.isRTL) {
                I18nManager.forceRTL(true);
            } else if (!rtl && I18nManager.isRTL) {
                I18nManager.forceRTL(false);
            }
        },

        toggleAutoDetectLanguage: (state) => {
            state.autoDetectLanguage = !state.autoDetectLanguage;
        },

        setCurrency: (state, action) => {
            const { currency, symbol, locale } = action.payload;
            state.currency = currency;
            state.currencySymbol = symbol;
            state.currencyLocale = locale;
        },

        setDateFormat: (state, action) => {
            state.dateFormat = action.payload;
        },

        setTimeFormat: (state, action) => {
            state.timeFormat = action.payload;
        },

        setNumberFormat: (state, action) => {
            state.numberFormat = action.payload;
        },

        setFontSize: (state, action) => {
            state.fontSize = action.payload;
        },

        cacheTranslation: (state, action) => {
            const { originalText, translatedText, targetLanguage } = action.payload;
            if (!state.translations[targetLanguage]) {
                state.translations[targetLanguage] = {};
            }
            state.translations[targetLanguage][originalText] = translatedText;
        },

        cacheVendorContent: (state, action) => {
            const { vendorId, content } = action.payload;
            state.vendorLocalizedContent[vendorId] = content;
        },

        clearTranslations: (state) => {
            state.translations = {};
        },

        clearVendorContent: (state, action) => {
            const vendorId = action.payload;
            delete state.vendorLocalizedContent[vendorId];
        },

        updateRegionalSettings: (state, action) => {
            const settings = action.payload;
            Object.keys(settings).forEach(key => {
                if (key in state) {
                    state[key] = settings[key];
                }
            });
        },

        resetLocalizationSettings: () => initialState
    },

    extraReducers: (builder) => {
        builder
            // Translate text
            .addCase(translateText.pending, (state) => {
                state.isTranslating = true;
                state.translationError = null;
            })
            .addCase(translateText.fulfilled, (state, action) => {
                state.isTranslating = false;
                const { originalText, translatedText, targetLanguage } = action.payload;

                if (!state.translations[targetLanguage]) {
                    state.translations[targetLanguage] = {};
                }
                state.translations[targetLanguage][originalText] = translatedText;
            })
            .addCase(translateText.rejected, (state, action) => {
                state.isTranslating = false;
                state.translationError = action.payload;
            })

            // Load localized content
            .addCase(loadLocalizedContent.pending, (state) => {
                state.isLoadingContent = true;
            })
            .addCase(loadLocalizedContent.fulfilled, (state, action) => {
                state.isLoadingContent = false;
                const { vendorId, content } = action.payload;
                state.vendorLocalizedContent[vendorId] = content;
            })
            .addCase(loadLocalizedContent.rejected, (state, action) => {
                state.isLoadingContent = false;
                state.translationError = action.payload;
            })

            // Detect user language
            .addCase(detectUserLanguage.pending, (state) => {
                state.isDetectingLanguage = true;
                state.languageDetectionError = null;
            })
            .addCase(detectUserLanguage.fulfilled, (state, action) => {
                state.isDetectingLanguage = false;
                state.detectedLanguage = action.payload;

                // Auto-apply detected language if auto-detect is enabled
                if (state.autoDetectLanguage) {
                    const language = state.availableLanguages.find(
                        lang => lang.code === action.payload.languageCode
                    );
                    if (language) {
                        state.currentLanguage = language.name;
                        state.currentLanguageCode = language.code;
                        state.isRTL = language.rtl;
                        state.textDirection = language.rtl ? 'rtl' : 'ltr';
                    }
                }
            })
            .addCase(detectUserLanguage.rejected, (state, action) => {
                state.isDetectingLanguage = false;
                state.languageDetectionError = action.payload;
            });
    }
});

export const {
    setCurrentLanguage,
    toggleAutoDetectLanguage,
    setCurrency,
    setDateFormat,
    setTimeFormat,
    setNumberFormat,
    setFontSize,
    cacheTranslation,
    cacheVendorContent,
    clearTranslations,
    clearVendorContent,
    updateRegionalSettings,
    resetLocalizationSettings
} = localizationSlice.actions;

export default localizationSlice.reducer;
