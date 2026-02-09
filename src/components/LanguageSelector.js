import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    FlatList,
    Switch,
    Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useDispatch, useSelector } from 'react-redux';
import { useLocalization } from '../services/LocalizationProvider';
import {
    setCurrentLanguage,
    toggleAutoDetectLanguage,
    setCurrency,
    setDateFormat,
    setTimeFormat,
    setNumberFormat,
    setFontSize,
    detectUserLanguage
} from '../store/slices/localizationSlice';

const LanguageSelector = ({
    showSettings = false,
    onLanguageChange,
    style
}) => {
    const dispatch = useDispatch();
    const { localizationService } = useLocalization();

    const {
        currentLanguage,
        currentLanguageCode,
        isRTL,
        availableLanguages,
        detectedLanguage,
        autoDetectLanguage,
        currency,
        currencySymbol,
        dateFormat,
        timeFormat,
        numberFormat,
        fontSize,
        isDetectingLanguage,
        languageDetectionError
    } = useSelector(state => state.localization);

    const [showLanguageModal, setShowLanguageModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);

    // Auto-detect language on mount
    useEffect(() => {
        if (autoDetectLanguage && !detectedLanguage) {
            dispatch(detectUserLanguage());
        }
    }, [autoDetectLanguage, detectedLanguage, dispatch]);

    const handleLanguageChange = async (language) => {
        try {
            dispatch(setCurrentLanguage(language));

            // Save language preference
            await localizationService.saveLanguagePreference(language.code);

            // Call parent callback
            onLanguageChange?.(language);

            setShowLanguageModal(false);

            Alert.alert(
                'Language Changed',
                `App language changed to ${language.name}`,
                [{ text: 'OK' }]
            );
        } catch (error) {
            console.error('Language change error:', error);
            Alert.alert(
                'Error',
                'Failed to change language. Please try again.',
                [{ text: 'OK' }]
            );
        }
    };

    const handleAutoDetectToggle = () => {
        dispatch(toggleAutoDetectLanguage());

        if (!autoDetectLanguage) {
            // Enable auto-detection
            dispatch(detectUserLanguage());
        }
    };

    const handleCurrencyChange = (newCurrency) => {
        const currencySettings = {
            'INR': { symbol: '₹', locale: 'en_IN' },
            'USD': { symbol: '$', locale: 'en_US' },
            'EUR': { symbol: '€', locale: 'de_DE' },
            'GBP': { symbol: '£', locale: 'en_GB' }
        };

        const settings = currencySettings[newCurrency];
        if (settings) {
            dispatch(setCurrency({
                currency: newCurrency,
                symbol: settings.symbol,
                locale: settings.locale
            }));
        }
    };

    const currencies = [
        { code: 'INR', name: 'Indian Rupee', symbol: '₹', locale: 'en_IN' },
        { code: 'USD', name: 'US Dollar', symbol: '$', locale: 'en_US' },
        { code: 'EUR', name: 'Euro', symbol: '€', locale: 'de_DE' },
        { code: 'GBP', name: 'British Pound', symbol: '£', locale: 'en_GB' }
    ];

    const dateFormats = [
        { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
        { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
        { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
        { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY' }
    ];

    const timeFormats = [
        { value: '12h', label: '12 Hour' },
        { value: '24h', label: '24 Hour' }
    ];

    const fontSizes = [
        { value: 'small', label: 'Small' },
        { value: 'medium', label: 'Medium' },
        { value: 'large', label: 'Large' }
    ];

    const renderLanguageItem = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.languageItem,
                currentLanguageCode === item.code && styles.languageItemSelected
            ]}
            onPress={() => handleLanguageChange(item)}
        >
            <View style={styles.languageInfo}>
                <Text style={styles.languageFlag}>{item.flag}</Text>
                <View style={styles.languageDetails}>
                    <Text style={[
                        styles.languageName,
                        currentLanguageCode === item.code && styles.languageNameSelected
                    ]}>
                        {item.name}
                    </Text>
                    <Text style={[
                        styles.languageNative,
                        currentLanguageCode === item.code && styles.languageNativeSelected
                    ]}>
                        {item.nativeName}
                    </Text>
                </View>
            </View>

            {currentLanguageCode === item.code && (
                <Icon name="check" size={16} color="#0390F3" />
            )}

            {item.rtl && (
                <View style={styles.rtlBadge}>
                    <Text style={styles.rtlText}>RTL</Text>
                </View>
            )}
        </TouchableOpacity>
    );

    const renderCurrencyItem = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.currencyItem,
                currency === item.code && styles.currencyItemSelected
            ]}
            onPress={() => handleCurrencyChange(item.code)}
        >
            <Text style={styles.currencySymbol}>{item.symbol}</Text>
            <Text style={[
                styles.currencyName,
                currency === item.code && styles.currencyNameSelected
            ]}>
                {item.name}
            </Text>

            {currency === item.code && (
                <Icon name="check" size={16} color="#0390F3" />
            )}
        </TouchableOpacity>
    );

    const renderLanguageModal = () => (
        <Modal
            visible={showLanguageModal}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowLanguageModal(false)}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                        <Text style={styles.cancelButton}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Select Language</Text>
                    <View style={{ width: 60 }} />
                </View>

                <View style={styles.autoDetectContainer}>
                    <View style={styles.autoDetectInfo}>
                        <Icon name="language" size={16} color="#0390F3" />
                        <Text style={styles.autoDetectText}>
                            Auto-detect device language
                        </Text>
                    </View>
                    <Switch
                        value={autoDetectLanguage}
                        onValueChange={handleAutoDetectToggle}
                        trackColor={{ false: '#e0e0e0', true: '#0390F3' }}
                        thumbColor={autoDetectLanguage ? '#fff' : '#f4f3f4'}
                    />
                </View>

                {detectedLanguage && (
                    <View style={styles.detectedContainer}>
                        <Text style={styles.detectedLabel}>Detected:</Text>
                        <Text style={styles.detectedText}>
                            {detectedLanguage.detectedLanguage}
                        </Text>
                        {autoDetectLanguage && (
                            <TouchableOpacity
                                style={styles.applyDetectedButton}
                                onPress={() => {
                                    const language = availableLanguages.find(
                                        lang => lang.code === detectedLanguage.languageCode
                                    );
                                    if (language) {
                                        handleLanguageChange(language);
                                    }
                                }}
                            >
                                <Text style={styles.applyDetectedText}>Apply</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                <FlatList
                    data={availableLanguages}
                    renderItem={renderLanguageItem}
                    keyExtractor={(item) => item.code}
                    style={styles.languageList}
                    showsVerticalScrollIndicator={false}
                />
            </View>
        </Modal>
    );

    const renderSettingsModal = () => (
        <Modal
            visible={showSettingsModal}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowSettingsModal(false)}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
                        <Text style={styles.cancelButton}>Close</Text>
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Localization Settings</Text>
                    <View style={{ width: 60 }} />
                </View>

                <View style={styles.settingsContent}>
                    {/* Currency Settings */}
                    <View style={styles.settingSection}>
                        <Text style={styles.sectionTitle}>Currency</Text>
                        <FlatList
                            data={currencies}
                            renderItem={renderCurrencyItem}
                            keyExtractor={(item) => item.code}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                        />
                    </View>

                    {/* Date Format */}
                    <View style={styles.settingSection}>
                        <Text style={styles.sectionTitle}>Date Format</Text>
                        <View style={styles.optionContainer}>
                            {dateFormats.map(format => (
                                <TouchableOpacity
                                    key={format.value}
                                    style={[
                                        styles.optionButton,
                                        dateFormat === format.value && styles.optionButtonSelected
                                    ]}
                                    onPress={() => dispatch(setDateFormat(format.value))}
                                >
                                    <Text style={[
                                        styles.optionText,
                                        dateFormat === format.value && styles.optionTextSelected
                                    ]}>
                                        {format.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Time Format */}
                    <View style={styles.settingSection}>
                        <Text style={styles.sectionTitle}>Time Format</Text>
                        <View style={styles.optionContainer}>
                            {timeFormats.map(format => (
                                <TouchableOpacity
                                    key={format.value}
                                    style={[
                                        styles.optionButton,
                                        timeFormat === format.value && styles.optionButtonSelected
                                    ]}
                                    onPress={() => dispatch(setTimeFormat(format.value))}
                                >
                                    <Text style={[
                                        styles.optionText,
                                        timeFormat === format.value && styles.optionTextSelected
                                    ]}>
                                        {format.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Font Size */}
                    <View style={styles.settingSection}>
                        <Text style={styles.sectionTitle}>Font Size</Text>
                        <View style={styles.optionContainer}>
                            {fontSizes.map(size => (
                                <TouchableOpacity
                                    key={size.value}
                                    style={[
                                        styles.optionButton,
                                        fontSize === size.value && styles.optionButtonSelected
                                    ]}
                                    onPress={() => dispatch(setFontSize(size.value))}
                                >
                                    <Text style={[
                                        styles.optionText,
                                        fontSize === size.value && styles.optionTextSelected
                                    ]}>
                                        {size.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Current Selection Summary */}
                    <View style={styles.summarySection}>
                        <Text style={styles.sectionTitle}>Current Settings</Text>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Language:</Text>
                            <Text style={styles.summaryValue}>{currentLanguage}</Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Currency:</Text>
                            <Text style={styles.summaryValue}>{currency} ({currencySymbol})</Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Date Format:</Text>
                            <Text style={styles.summaryValue}>{dateFormat}</Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Time Format:</Text>
                            <Text style={styles.summaryValue}>{timeFormat}</Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Font Size:</Text>
                            <Text style={styles.summaryValue}>{fontSize}</Text>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );

    if (showSettings) {
        return (
            <View style={[styles.container, style]}>
                <View style={styles.settingsItem}>
                    <Text style={styles.settingsLabel}>Language</Text>
                    <TouchableOpacity
                        style={styles.settingsValueContainer}
                        onPress={() => setShowLanguageModal(true)}
                    >
                        <Text style={styles.settingsValue}>{currentLanguage}</Text>
                        <Icon name="chevron-right" size={12} color="#999" />
                    </TouchableOpacity>
                </View>

                <View style={styles.settingsItem}>
                    <Text style={styles.settingsLabel}>Auto-detect Language</Text>
                    <Switch
                        value={autoDetectLanguage}
                        onValueChange={handleAutoDetectToggle}
                        trackColor={{ false: '#e0e0e0', true: '#0390F3' }}
                        thumbColor={autoDetectLanguage ? '#fff' : '#f4f3f4'}
                    />
                </View>

                <TouchableOpacity
                    style={styles.settingsItem}
                    onPress={() => setShowSettingsModal(true)}
                >
                    <Text style={styles.settingsLabel}>More Settings</Text>
                    <Icon name="chevron-right" size={12} color="#999" />
                </TouchableOpacity>

                {renderLanguageModal()}
                {renderSettingsModal()}
            </View>
        );
    }

    return (
        <View style={[styles.container, style]}>
            <TouchableOpacity
                style={styles.languageButton}
                onPress={() => setShowLanguageModal(true)}
            >
                <Icon name="language" size={16} color="#0390F3" />
                <Text style={styles.languageButtonText}>{currentLanguage}</Text>
                <Icon name="chevron-down" size={12} color="#999" />
            </TouchableOpacity>

            {renderLanguageModal()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
    },
    languageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
        backgroundColor: '#f8f9fa',
        gap: 6,
    },
    languageButtonText: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    settingsItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    settingsLabel: {
        fontSize: 16,
        color: '#333',
        flex: 1,
    },
    settingsValueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    settingsValue: {
        fontSize: 16,
        color: '#666',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    cancelButton: {
        fontSize: 16,
        color: '#0390F3',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    autoDetectContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#f8f9fa',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    autoDetectInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    autoDetectText: {
        fontSize: 14,
        color: '#333',
    },
    detectedContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        backgroundColor: '#e3f2fd',
        marginHorizontal: 16,
        marginTop: 8,
        borderRadius: 6,
    },
    detectedLabel: {
        fontSize: 14,
        color: '#666',
    },
    detectedText: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
        flex: 1,
    },
    applyDetectedButton: {
        backgroundColor: '#0390F3',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 4,
    },
    applyDetectedText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '500',
    },
    languageList: {
        flex: 1,
        paddingHorizontal: 16,
    },
    languageItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    languageItemSelected: {
        backgroundColor: '#f0f8ff',
        marginHorizontal: -16,
        paddingHorizontal: 16,
    },
    languageInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    languageFlag: {
        fontSize: 24,
    },
    languageDetails: {
        flex: 1,
    },
    languageName: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
        marginBottom: 2,
    },
    languageNameSelected: {
        color: '#0390F3',
    },
    languageNative: {
        fontSize: 14,
        color: '#666',
    },
    languageNativeSelected: {
        color: '#0390F3',
    },
    rtlBadge: {
        backgroundColor: '#FF9800',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginLeft: 8,
    },
    rtlText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    currencyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 6,
        marginRight: 8,
        minWidth: 100,
        justifyContent: 'space-between',
    },
    currencyItemSelected: {
        borderColor: '#0390F3',
        backgroundColor: '#f0f8ff',
    },
    currencySymbol: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    currencyName: {
        fontSize: 12,
        color: '#666',
        flex: 1,
        marginLeft: 8,
    },
    currencyNameSelected: {
        color: '#0390F3',
    },
    settingsContent: {
        flex: 1,
        padding: 16,
    },
    settingSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    optionContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    optionButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 20,
        backgroundColor: '#f9f9f9',
    },
    optionButtonSelected: {
        backgroundColor: '#0390F3',
        borderColor: '#0390F3',
    },
    optionText: {
        fontSize: 14,
        color: '#666',
    },
    optionTextSelected: {
        color: '#fff',
    },
    summarySection: {
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 8,
    },
    summaryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    summaryLabel: {
        fontSize: 14,
        color: '#666',
    },
    summaryValue: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
});

export default LanguageSelector;