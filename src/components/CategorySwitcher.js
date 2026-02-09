import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    StyleSheet,
    FlatList,
    SafeAreaView,
    StatusBar,
    Alert,
    Dimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useSelector, useDispatch } from 'react-redux';
import {
    selectPreferredCategory,
    selectIsSwitchingCategory,
    setSwitching,
    setPreferredCategory,
    markSelectionCompleted
} from '../store/slices/categorySlice';
import { BUSINESS_CATEGORIES } from '../constants/Categories';
import CategoryStorageService from '../services/CategoryStorageService';

const { width, height } = Dimensions.get('window');

const CategorySwitcher = ({ onCategorySwitch }) => {
    const dispatch = useDispatch();
    const preferredCategory = useSelector(selectPreferredCategory);
    const isSwitching = useSelector(selectIsSwitchingCategory);
    const [modalVisible, setModalVisible] = useState(false);

    const handleCategorySelect = async (category) => {
        try {
            dispatch(setSwitching(true));

            // Update Redux state immediately
            dispatch(setPreferredCategory(category));
            dispatch(markSelectionCompleted());

            // Save to AsyncStorage
            await CategoryStorageService.savePreferredCategory(category.id);
            await CategoryStorageService.markCategorySelectionCompleted();

            // Close modal
            setModalVisible(false);

            // Call callback if provided
            if (onCategorySwitch) {
                onCategorySwitch();
            }

            // Show success feedback
            Alert.alert(
                'Category Updated',
                `Now browsing ${category.name}`,
                [{ text: 'OK', style: 'default' }],
                { duration: 2000 }
            );

        } catch (error) {
            console.error('Error switching category:', error);
            Alert.alert(
                'Error',
                'Failed to switch category. Please try again.',
                [{ text: 'OK', style: 'default' }]
            );
        } finally {
            dispatch(setSwitching(false));
        }
    };

    const renderCategoryItem = ({ item }) => {
        const isSelected = preferredCategory?.id === item.id;

        return (
            <TouchableOpacity
                style={[
                    styles.categoryItem,
                    isSelected && styles.selectedCategoryItem
                ]}
                onPress={() => handleCategorySelect(item)}
                activeOpacity={0.7}
            >
                <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                    <Icon
                        name={item.icon}
                        size={24}
                        color={item.color}
                    />
                </View>

                <View style={styles.categoryContent}>
                    <Text style={[
                        styles.categoryName,
                        isSelected && styles.selectedCategoryName
                    ]}>
                        {item.name}
                    </Text>

                    <Text style={styles.categorySubtitle}>
                        {item.subCategories.length} subcategories
                    </Text>
                </View>

                {isSelected && (
                    <View style={styles.selectedIndicator}>
                        <Icon name="check" size={16} color="#0390F3" />
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <>
            <TouchableOpacity
                style={styles.switcherContainer}
                onPress={() => setModalVisible(true)}
                activeOpacity={0.7}
            >
                <View style={styles.switcherContent}>
                    {preferredCategory ? (
                        <>
                            <View style={[styles.currentIcon, { backgroundColor: preferredCategory.color + '20' }]}>
                                <Icon
                                    name={preferredCategory.icon}
                                    size={16}
                                    color={preferredCategory.color}
                                />
                            </View>

                            <Text style={styles.currentCategory}>
                                {preferredCategory.name}
                            </Text>

                            <Icon
                                name="chevron-down"
                                size={14}
                                color="#666"
                                style={styles.dropdownIcon}
                            />
                        </>
                    ) : (
                        <>
                            <Icon
                                name="th-large"
                                size={16}
                                color="#666"
                            />

                            <Text style={styles.placeholderText}>
                                Select Category
                            </Text>

                            <Icon
                                name="chevron-down"
                                size={14}
                                color="#666"
                                style={styles.dropdownIcon}
                            />
                        </>
                    )}
                </View>
            </TouchableOpacity>

            {/* Category Selection Modal */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setModalVisible(false)}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <StatusBar barStyle="dark-content" backgroundColor="#fff" />

                    {/* Modal Header */}
                    <View style={styles.modalHeader}>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setModalVisible(false)}
                        >
                            <Icon name="times" size={20} color="#333" />
                        </TouchableOpacity>

                        <Text style={styles.modalTitle}>
                            Switch Business Category
                        </Text>

                        <View style={styles.headerRight} />
                    </View>

                    {/* Modal Content */}
                    <View style={styles.modalContent}>
                        <Text style={styles.modalDescription}>
                            Select a different category to explore products from that industry
                        </Text>

                        <FlatList
                            data={Array.isArray(BUSINESS_CATEGORIES) ? BUSINESS_CATEGORIES : []}
                            renderItem={renderCategoryItem}
                            keyExtractor={(item) => item.id}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.categoriesList}
                            ItemSeparatorComponent={() => <View style={styles.separator} />}
                            ListEmptyComponent={() => (
                                <View style={styles.emptyState}>
                                    <Text style={styles.emptyStateText}>
                                        No categories available
                                    </Text>
                                </View>
                            )}
                        />
                    </View>
                </SafeAreaView>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    switcherContainer: {
        flex: 1,
        maxWidth: width * 0.7,
    },
    switcherContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    currentIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    currentCategory: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    placeholderText: {
        flex: 1,
        fontSize: 14,
        color: '#666',
    },
    dropdownIcon: {
        marginLeft: 4,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    closeButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
        backgroundColor: '#f8f9fa',
    },
    modalTitle: {
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
    modalContent: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 24,
    },
    modalDescription: {
        fontSize: 16,
        color: '#666',
        lineHeight: 24,
        marginBottom: 24,
        textAlign: 'center',
    },
    categoriesList: {
        paddingBottom: 20,
    },
    categoryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        borderWidth: 2,
        borderColor: '#f0f0f0',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    selectedCategoryItem: {
        borderColor: '#0390F3',
        backgroundColor: '#f8fbff',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    categoryContent: {
        flex: 1,
    },
    categoryName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    selectedCategoryName: {
        color: '#0390F3',
    },
    categorySubtitle: {
        fontSize: 12,
        color: '#666',
    },
    selectedIndicator: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#e3f2fd',
        alignItems: 'center',
        justifyContent: 'center',
    },
    separator: {
        height: 12,
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    emptyStateText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
});

export default CategorySwitcher;