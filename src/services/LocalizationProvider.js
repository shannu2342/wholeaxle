import React, { createContext, useContext, useEffect, useState } from 'react';
import { I18nManager } from 'react-native';

const LocalizationContext = createContext();

export const useLocalization = () => {
    const context = useContext(LocalizationContext);
    if (!context) {
        throw new Error('useLocalization must be used within a LocalizationProvider');
    }
    return context;
};

class LocalizationProviderService {
    constructor() {
        this.cache = new Map();
        this.translationCache = new Map();
    }

    /**
     * Translate text synchronously to current language.
     * Uses mock translations and cache only; no async work.
     */
    translateTextSync(text, targetLanguage, sourceLanguage = 'auto') {
        try {
            const cacheKey = `${sourceLanguage}->${targetLanguage}:${text}`;

            if (this.cache.has(cacheKey)) {
                return this.cache.get(cacheKey);
            }

            const translations = this.getMockTranslations();
            const translatedText = translations[targetLanguage]?.[text] || text;

            this.cache.set(cacheKey, translatedText);

            return translatedText;
        } catch (error) {
            console.error('Translation error:', error);
            return text;
        }
    }

    /**
     * Translate text to current language
     */
    async translateText(text, targetLanguage, sourceLanguage = 'auto') {
        try {
            const cacheKey = `${sourceLanguage}->${targetLanguage}:${text}`;

            // Check cache first
            if (this.cache.has(cacheKey)) {
                return this.cache.get(cacheKey);
            }

            // Mock translation - replace with actual Google Translate API
            const translations = this.getMockTranslations();
            const translatedText = translations[targetLanguage]?.[text] || text;

            // Cache the result
            this.cache.set(cacheKey, translatedText);

            return translatedText;
        } catch (error) {
            console.error('Translation error:', error);
            return text; // Return original text if translation fails
        }
    }

    /**
     * Get mock translations for demonstration
     */
    getMockTranslations() {
        return {
            hi: {
                // Navigation
                'Home': 'होम',
                'Categories': 'श्रेणियां',
                'Products': 'उत्पाद',
                'Cart': 'कार्ट',
                'Profile': 'प्रोफाइल',

                // Search
                'Search products...': 'उत्पाद खोजें...',
                'Filter': 'फिल्टर',
                'Sort by': 'इसके अनुसार क्रमबद्ध करें',
                'Price: Low to High': 'कीमत: कम से अधिक',
                'Price: High to Low': 'कीमत: अधिक से कम',
                'Rating': 'रेटिंग',
                'Popularity': 'लोकप्रियता',

                // Product
                'Add to Cart': 'कार्ट में जोड़ें',
                'Buy Now': 'अभी खरीदें',
                'In Stock': 'स्टॉक में',
                'Out of Stock': 'स्टॉक खत्म',
                'Price': 'कीमत',
                'Original Price': 'मूल कीमत',
                'Discount': 'छूट',
                'Shipping': 'शिपिंग',
                'Free Delivery': 'मुफ्त डिलीवरी',
                'Customer Reviews': 'ग्राहक समीक्षा',

                // Location
                'Current Location': 'वर्तमान स्थान',
                'Set Location': 'स्थान सेट करें',
                'Change Location': 'स्थान बदलें',
                'Serviceable Areas': 'सेवा क्षेत्र',
                'Delivery to': 'डिलीवरी करें',

                // Common
                'Loading': 'लोड हो रहा है...',
                'Error': 'त्रुटि',
                'Retry': 'पुनः प्रयास करें',
                'Cancel': 'रद्द करें',
                'Save': 'सेव करें',
                'Delete': 'हटाएं',
                'Edit': 'संपादित करें',
                'View All': 'सभी देखें',
                'Show More': 'और दिखाएं',
                'Show Less': 'कम दिखाएं'
            },
            mr: {
                // Navigation
                'Home': 'मुखपृष्ठ',
                'Categories': 'वर्गीकरण',
                'Products': 'उत्पाद',
                'Cart': 'कार्ट',
                'Profile': 'प्रोफाइल',

                // Search
                'Search products...': 'उत्पाद शोधा...',
                'Filter': 'फिल्टर',
                'Sort by': 'यानुसार क्रमवारी लावा',
                'Price: Low to High': 'किंमत: कम ते जास्त',
                'Price: High to Low': 'किंमत: जास्त ते कम',
                'Rating': 'रेटिंग',
                'Popularity': 'लोकप्रियता',

                // Product
                'Add to Cart': 'कार्टमध्ये जोडा',
                'Buy Now': 'आता खरेदी करा',
                'In Stock': 'स्टॉकमध्ये',
                'Out of Stock': 'स्टॉक संपला',
                'Price': 'किंमत',
                'Original Price': 'मूळ किंमत',
                'Discount': 'सवलत',
                'Shipping': 'शिपिंग',
                'Free Delivery': 'मोफत डिलिव्हरी',
                'Customer Reviews': 'ग्राहक पुनरावलोकन',

                // Location
                'Current Location': 'सद्य स्थान',
                'Set Location': 'स्थान निश्चित करा',
                'Change Location': 'स्थान बदला',
                'Serviceable Areas': 'सेवा क्षेत्र',
                'Delivery to': 'डिलिव्हरी',

                // Common
                'Loading': 'लोड होत आहे...',
                'Error': 'त्रुटि',
                'Retry': 'पुन्हा प्रयत्न करा',
                'Cancel': 'रद्द करा',
                'Save': 'जतन करा',
                'Delete': 'हटवा',
                'Edit': 'संपादित करा',
                'View All': 'सर्व पहा',
                'Show More': 'आणखी दाखवा',
                'Show Less': 'कमी दाखवा'
            }
        };
    }

    /**
     * Format currency according to locale
     */
    formatCurrency(amount, currency = 'INR', locale = 'en_IN') {
        try {
            return new Intl.NumberFormat(locale, {
                style: 'currency',
                currency: currency,
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(amount);
        } catch (error) {
            console.error('Currency formatting error:', error);
            return `₹${amount}`;
        }
    }

    /**
     * Format date according to locale
     */
    formatDate(date, format = 'short', locale = 'en_IN') {
        try {
            const dateObj = typeof date === 'string' ? new Date(date) : date;

            const options = {
                short: { dateStyle: 'short' },
                medium: { dateStyle: 'medium' },
                long: { dateStyle: 'long' },
                full: { dateStyle: 'full' }
            };

            return new Intl.DateTimeFormat(locale, options[format] || options.short)
                .format(dateObj);
        } catch (error) {
            console.error('Date formatting error:', error);
            return date.toString();
        }
    }

    /**
     * Format number according to locale
     */
    formatNumber(number, locale = 'en_IN') {
        try {
            return new Intl.NumberFormat(locale).format(number);
        } catch (error) {
            console.error('Number formatting error:', error);
            return number.toString();
        }
    }

    /**
     * Get text direction for language
     */
    getTextDirection(languageCode) {
        const rtlLanguages = ['ar', 'fa', 'he', 'ur'];
        return rtlLanguages.includes(languageCode) ? 'rtl' : 'ltr';
    }

    /**
     * Check if language supports RTL
     */
    isRTLLanguage(languageCode) {
        const rtlLanguages = ['ar', 'fa', 'he', 'ur'];
        return rtlLanguages.includes(languageCode);
    }

    /**
     * Get plural forms for language
     */
    getPluralRules(languageCode) {
        // Simplified plural rules - in real app, use a library like formatjs
        const rules = {
            'en': (n) => n === 1 ? 'one' : 'other',
            'hi': (n) => 'other', // Hindi doesn't have plural forms in the same way
            'mr': (n) => 'other',
            'gu': (n) => 'other',
            'ta': (n) => 'other',
            'te': (n) => 'other',
            'kn': (n) => 'other',
            'ml': (n) => 'other'
        };

        return rules[languageCode] || rules['en'];
    }

    /**
     * Pluralize text based on count and language rules
     */
    pluralize(text, count, languageCode = 'en') {
        const pluralRule = this.getPluralRules(languageCode);
        const form = pluralRule(count);

        // This is a simplified implementation
        // In real app, you would have separate translation keys for plural forms
        if (form === 'one' && languageCode === 'en') {
            return text;
        }

        // For other languages, return the same text for now
        return text;
    }

    /**
     * Get language name in native script
     */
    getLanguageNativeName(languageCode) {
        const names = {
            'en': 'English',
            'hi': 'हिंदी',
            'mr': 'मराठी',
            'gu': 'ગુજરાતી',
            'ta': 'தமிழ்',
            'te': 'తెలుగు',
            'kn': 'ಕನ್ನಡ',
            'ml': 'മലയാളം'
        };

        return names[languageCode] || names['en'];
    }

    /**
     * Auto-detect device language
     */
    detectDeviceLanguage() {
        try {
            // NOTE:
            // `react-native-localize` is not guaranteed to be present/linked in this project.
            // Prefer a pure-JS locale read so standalone APKs don't crash.
            let deviceLanguage = 'en';
            try {
                const resolvedLocale = Intl?.DateTimeFormat?.().resolvedOptions?.().locale;
                if (typeof resolvedLocale === 'string' && resolvedLocale.length > 0) {
                    deviceLanguage = resolvedLocale.split(/[-_]/)[0] || 'en';
                }
            } catch {
                deviceLanguage = 'en';
            }

            const supportedLanguages = ['en', 'hi', 'mr', 'gu', 'ta', 'te', 'kn', 'ml'];
            const detectedLanguage = supportedLanguages.includes(deviceLanguage)
                ? deviceLanguage
                : 'en';

            return {
                languageCode: detectedLanguage,
                languageName: this.getLanguageNativeName(detectedLanguage),
                isRTL: this.isRTLLanguage(detectedLanguage)
            };
        } catch (error) {
            console.error('Language detection error:', error);
            return {
                languageCode: 'en',
                languageName: 'English',
                isRTL: false
            };
        }
    }

    /**
     * Save user language preference
     */
    async saveLanguagePreference(languageCode) {
        try {
            // Save to AsyncStorage or preferences
            // This is a mock implementation
            console.log('Language preference saved:', languageCode);
            return true;
        } catch (error) {
            console.error('Error saving language preference:', error);
            return false;
        }
    }

    /**
     * Load user language preference
     */
    async loadLanguagePreference() {
        try {
            // Load from AsyncStorage or preferences
            // This is a mock implementation
            return null; // Return null to use auto-detection
        } catch (error) {
            console.error('Error loading language preference:', error);
            return null;
        }
    }

    /**
     * Translate product data
     */
    async translateProductData(productData, targetLanguage) {
        try {
            const translatedData = { ...productData };

            // Translate product name and description
            if (productData.name) {
                translatedData.name = await this.translateText(
                    productData.name,
                    targetLanguage
                );
            }

            if (productData.description) {
                translatedData.description = await this.translateText(
                    productData.description,
                    targetLanguage
                );
            }

            // Translate category if needed
            if (productData.category) {
                translatedData.category = await this.translateText(
                    productData.category,
                    targetLanguage
                );
            }

            // Translate vendor name
            if (productData.vendor) {
                translatedData.vendor = await this.translateText(
                    productData.vendor,
                    targetLanguage
                );
            }

            return translatedData;
        } catch (error) {
            console.error('Product translation error:', error);
            return productData;
        }
    }

    /**
     * Clear translation cache
     */
    clearCache() {
        this.cache.clear();
        this.translationCache.clear();
    }

    /**
     * Get supported languages list
     */
    getSupportedLanguages() {
        return [
            { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', rtl: false },
            { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳', rtl: false },
            { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳', rtl: false },
            { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳', rtl: false },
            { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳', rtl: false },
            { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳', rtl: false },
            { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳', rtl: false },
            { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳', rtl: false }
        ];
    }
}

export const localizationService = new LocalizationProviderService();

export const LocalizationProvider = ({ children }) => {
    // Remove Redux dependencies - LocalizationProvider should work independently
    const [language, setLanguage] = React.useState('en');

    useEffect(() => {
        // Auto-detect language on mount
        const detectedLanguage = localizationService.detectDeviceLanguage();
        setLanguage(detectedLanguage.languageCode);
    }, []);

    const contextValue = {
        localization: {
            currentLanguage: language,
            autoDetectLanguage: true
        },
        localizationService,
        translate: (text, targetLanguage) =>
            localizationService.translateTextSync(text, targetLanguage || language),
        translateAsync: (text, targetLanguage) =>
            localizationService.translateText(text, targetLanguage || language),
        formatCurrency: (amount, currency, locale) =>
            localizationService.formatCurrency(amount, currency, locale),
        formatDate: (date, format, locale) =>
            localizationService.formatDate(date, format, locale),
        formatNumber: (number, locale) =>
            localizationService.formatNumber(number, locale),
        getTextDirection: (languageCode) =>
            localizationService.getTextDirection(languageCode),
        isRTLLanguage: (languageCode) =>
            localizationService.isRTLLanguage(languageCode),
        getSupportedLanguages: () =>
            localizationService.getSupportedLanguages()
    };

    return (
        <LocalizationContext.Provider value={contextValue}>
            {children}
        </LocalizationContext.Provider>
    );
};

export default LocalizationProvider;
