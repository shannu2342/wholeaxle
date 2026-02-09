import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    Alert,
    ActivityIndicator,
    Dimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { BUSINESS_CATEGORIES } from '../constants/Categories';
import { useDispatch, useSelector } from 'react-redux';
import { saveCategoryPreference, setPreferredCategory } from '../store/slices/categorySlice';

const { width, height } = Dimensions.get('window');

const BusinessCategoryScreen = ({ navigation, route }) => {
    const dispatch = useDispatch();
    const userId = useSelector((state) => state.auth?.user?.id);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const categoryData = Array.isArray(BUSINESS_CATEGORIES) ? BUSINESS_CATEGORIES : [];

    const handleCategorySelect = async (category) => {
        setSelectedCategory(category);
    };

    const handleContinue = async () => {
        if (!selectedCategory) {
            Alert.alert('Selection Required', 'Please select your business category to continue');
            return;
        }

        setIsLoading(true);
        console.log('DEBUG: Starting category selection process...');

        try {
            console.log('DEBUG: Selected category:', selectedCategory);
            console.log('DEBUG: Navigation object:', navigation);
            console.log('DEBUG: Route params:', route.params);

            // Save to Redux store (instant UI) and persist selection
            console.log('DEBUG: Saving to Redux store...');
            dispatch(setPreferredCategory(selectedCategory));
            console.log('DEBUG: Redux store updated successfully');

            console.log('DEBUG: Persisting category preference...');
            await dispatch(
                saveCategoryPreference({
                    categoryId: selectedCategory.id,
                    userId
                })
            ).unwrap();
            console.log('DEBUG: Category preference persisted');

            // Navigate based on source
            console.log('DEBUG: Preparing navigation...');
            if (route.params?.source === 'switching') {
                // If switching category, go back to home
                console.log('DEBUG: Switching category - going back');
                navigation.goBack();
            } else {
                // First time selection, proceed to home
                console.log('DEBUG: First time selection - resetting navigation to BuyerMain');

                // Check if navigation is ready
                if (!navigation || !navigation.reset) {
                    console.error('DEBUG: Navigation object is not ready or missing reset method');
                    throw new Error('Navigation not ready');
                }

                // Check if BuyerMain route exists
                try {
                    console.log('DEBUG: Attempting navigation reset...');
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'BuyerMain' }],
                    });
                    console.log('DEBUG: Navigation reset successful');
                } catch (navError) {
                    console.error('DEBUG: Navigation reset failed:', navError);
                    console.log('DEBUG: Trying alternative navigation method...');
                    // Fallback navigation
                    navigation.navigate('BuyerMain');
                }
            }
        } catch (error) {
            console.error('DEBUG: Error in handleContinue:', error);
            console.error('DEBUG: Error stack:', error.stack);

            let errorMessage = 'Failed to save your category preference. Please try again.';
            if (error.message.includes('Navigation not ready')) {
                errorMessage = 'Navigation system is not ready. Please restart the app.';
            } else if (error.message.includes('network')) {
                errorMessage = 'Network error occurred. Please check your connection.';
            }

            Alert.alert(
                'Error',
                errorMessage,
                [{ text: 'OK', style: 'default' }]
            );
        } finally {
            console.log('DEBUG: handleContinue completed (success or failure)');
            setIsLoading(false);
        }
    };

    const renderCategoryItem = ({ item }) => {
        const isSelected = selectedCategory?.id === item.id;

        return (
            <TouchableOpacity
                style={[
                    styles.categoryCard,
                    isSelected && styles.selectedCategoryCard
                ]}
                onPress={() => handleCategorySelect(item)}
                activeOpacity={0.7}
            >
                <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                    <Icon
                        name={item.icon}
                        size={32}
                        color={item.color}
                    />
                </View>

                <Text style={[
                    styles.categoryName,
                    isSelected && styles.selectedCategoryName
                ]}>
                    {item.name}
                </Text>

                {isSelected && (
                    <View style={styles.checkIcon}>
                        <Icon name="check" size={16} color="#fff" />
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    // Group categories into roles (4 roles, 2 categories each)
    const roleGroups = [
        {
            name: 'Retail & Consumer Goods',
            categories: Array.isArray(categoryData.slice(0, 2)) ? categoryData.slice(0, 2) : []
        },
        {
            name: 'Electronics & Technology',
            categories: Array.isArray(categoryData.slice(2, 4)) ? categoryData.slice(2, 4) : []
        },
        {
            name: 'Healthcare & Wellness',
            categories: Array.isArray(categoryData.slice(4, 6)) ? categoryData.slice(4, 6) : []
        },
        {
            name: 'Industrial & Automotive',
            categories: Array.isArray(categoryData.slice(6, 8)) ? categoryData.slice(6, 8) : []
        }
    ].filter(roleGroup => roleGroup.categories.length > 0); // Remove empty role groups

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Icon name="arrow-left" size={20} color="#333" />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>
                    {route.params?.source === 'switching' ? 'Switch Business Category' : 'Select Your Business Category'}
                </Text>

                <View style={styles.headerRight} />
            </View>

            {/* Content */}
            <View style={styles.content}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.categoriesList}
                >
                    {roleGroups.map((roleGroup, roleIndex) => (
                        <View key={`role-${roleIndex}`} style={styles.roleSection}>
                            <Text style={styles.roleTitle}>{roleGroup.name}</Text>
                            <View style={styles.categoryRow}>
                                {roleGroup.categories.map((item) => (
                                    <View key={item.id} style={styles.categoryItemWrapper}>
                                        {renderCategoryItem({ item })}
                                    </View>
                                ))}
                            </View>
                        </View>
                    ))}
                </ScrollView>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[
                        styles.continueButton,
                        (!selectedCategory || isLoading) && styles.disabledButton
                    ]}
                    onPress={handleContinue}
                    disabled={!selectedCategory || isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.continueButtonText}>
                            {route.params?.source === 'switching' ? 'Switch Category' : 'Continue to Marketplace'}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
        backgroundColor: '#f8f9fa',
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginHorizontal: 16,
    },
    headerRight: {
        width: 40,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 16,
    },
    categoriesList: {
        paddingBottom: 20,
    },
    roleSection: {
        marginBottom: 30,
    },
    roleTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    categoryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    categoryItemWrapper: {
        width: (width - 60) / 2,
    },
    categoryCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#f0f0f0',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    selectedCategoryCard: {
        borderColor: '#0390F3',
        backgroundColor: '#f8fbff',
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    categoryName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
    },
    selectedCategoryName: {
        color: '#0390F3',
    },
    checkIcon: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#0390F3',
        alignItems: 'center',
        justifyContent: 'center',
    },
    footer: {
        paddingHorizontal: 20,
        paddingVertical: 20,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    continueButton: {
        backgroundColor: '#0390F3',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
    },
    disabledButton: {
        backgroundColor: '#ccc',
    },
    continueButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default BusinessCategoryScreen;
