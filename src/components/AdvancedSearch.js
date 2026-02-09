import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Modal,
    ScrollView,
    Dimensions,
    Image,
    FlatList,
    Alert,
    ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useDispatch, useSelector } from 'react-redux';
import { analyzeImageSimilarity, initializeAI } from '../store/slices/aiSlice';
import { updateFilters, setSearchResults, clearSearchResults } from '../store/slices/productSlice';

const { width } = Dimensions.get('window');

const AdvancedSearch = ({
    onSearch,
    onFilterChange,
    placeholder = "Search products...",
    style,
}) => {
    const dispatch = useDispatch();
    const { filters, products = [] } = useSelector(state => state.products);
    const {
        visualSearch,
        isInitialized,
        initializationError
    } = useSelector(state => state.ai);

    const [searchText, setSearchText] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [showImageSearch, setShowImageSearch] = useState(false);
    const [searchType, setSearchType] = useState('text'); // 'text' | 'image'
    const [selectedImage, setSelectedImage] = useState(null);
    const [aiInitializationAttempted, setAiInitializationAttempted] = useState(false);

    // Initialize AI services on component mount
    useEffect(() => {
        const initializeAIServices = async () => {
            if (!isInitialized && !aiInitializationAttempted) {
                setAiInitializationAttempted(true);
                try {
                    await dispatch(initializeAI()).unwrap();
                } catch (error) {
                    console.warn('AI initialization failed for visual search:', error);
                }
            }
        };

        initializeAIServices();
    }, [dispatch, isInitialized, aiInitializationAttempted]);

    const categories = [
        { id: '', name: 'All Categories' },
        { id: 'palazzo', name: 'Palazzo' },
        { id: 'leggings', name: 'Leggings' },
        { id: 'pants', name: 'Pants' },
        { id: 'kurti', name: 'Kurti' },
        { id: 'saree', name: 'Saree' },
        { id: 'dupatta', name: 'Dupatta' },
    ];

    const priceRanges = [
        { label: 'All Prices', value: [0, 10000] },
        { label: 'Under ₹500', value: [0, 500] },
        { label: '₹500 - ₹1000', value: [500, 1000] },
        { label: '₹1000 - ₹2000', value: [1000, 2000] },
        { label: '₹2000 - ₹5000', value: [2000, 5000] },
        { label: 'Above ₹5000', value: [5000, 10000] },
    ];

    const locations = [
        { id: '', name: 'All Locations' },
        { id: 'maharashtra', name: 'Maharashtra' },
        { id: 'karnataka', name: 'Karnataka' },
        { id: 'gujarat', name: 'Gujarat' },
        { id: 'rajasthan', name: 'Rajasthan' },
        { id: 'delhi', name: 'Delhi' },
    ];

    const handleTextSearch = useCallback(() => {
        if (searchText.trim()) {
            dispatch(updateFilters({ ...filters, searchText: searchText.trim() }));
            onSearch?.({ type: 'text', query: searchText.trim(), filters });
            onFilterChange?.(filters);
        }
    }, [searchText, filters, dispatch, onSearch, onFilterChange]);

    const handleImageSearch = useCallback(async (imageUri) => {
        try {
            setShowImageSearch(false);
            setSelectedImage({ uri: imageUri });
            setSearchType('image');

            // Get product catalog from Redux (you may need to adjust this based on your store structure)
            const productCatalog = Array.isArray(products)
                ? products.map((product) => product.image || product.images?.[0]).filter(Boolean)
                : [];

            if (isInitialized) {
                // Perform visual similarity search with real AI
                const result = await dispatch(analyzeImageSimilarity({
                    queryImage: imageUri,
                    catalogImages: productCatalog
                })).unwrap();

                dispatch(setSearchResults(result.similarProducts));
                onSearch?.({
                    type: 'image',
                    results: result.similarProducts,
                    queryImage: imageUri,
                    analysisTime: result.analysisTime
                });
            } else {
                Alert.alert(
                    'Visual Search Unavailable',
                    'AI visual search is not yet initialized. Please try again later.',
                    [{ text: 'OK' }]
                );
            }

        } catch (error) {
            console.error('Visual search failed:', error);
            Alert.alert(
                'Search Failed',
                'Unable to perform visual search. Please try again.',
                [{ text: 'OK' }]
            );
        }
    }, [dispatch, onSearch, isInitialized]);

    const openCamera = useCallback(() => {
        ImagePicker.openCamera({
            width: 300,
            height: 300,
            cropping: true,
            mediaType: 'photo',
            compressImageQuality: 0.8,
        }).then(image => {
            handleImageSearch(image.path);
        }).catch(error => {
            if (error.code !== 'E_PICKER_CANCELLED') {
                Alert.alert('Camera Error', 'Failed to capture image');
            }
        });
    }, [handleImageSearch]);

    const openImageLibrary = useCallback(() => {
        ImagePicker.openPicker({
            width: 300,
            height: 300,
            cropping: true,
            mediaType: 'photo',
            compressImageQuality: 0.8,
        }).then(image => {
            handleImageSearch(image.path);
        }).catch(error => {
            if (error.code !== 'E_PICKER_CANCELLED') {
                Alert.alert('Image Picker Error', 'Failed to select image');
            }
        });
    }, [handleImageSearch]);

    const handleFilterChange = useCallback((key, value) => {
        const newFilters = { ...filters, [key]: value };
        dispatch(updateFilters(newFilters));
        onFilterChange?.(newFilters);
    }, [filters, dispatch, onFilterChange]);

    const clearAllFilters = useCallback(() => {
        dispatch(updateFilters({
            category: '',
            priceRange: [0, 10000],
            location: '',
            rating: 0,
            inStock: false,
            vendor: '',
        }));
        setSearchText('');
        dispatch(clearSearchResults());
    }, [dispatch]);

    const renderFilterModal = () => (
        <Modal
            visible={showFilters}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowFilters(false)}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={() => setShowFilters(false)}>
                        <Text style={styles.cancelButton}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Filters</Text>
                    <TouchableOpacity onPress={clearAllFilters}>
                        <Text style={styles.clearButton}>Clear All</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalContent}>
                    {/* Category Filter */}
                    <View style={styles.filterSection}>
                        <Text style={styles.filterTitle}>Category</Text>
                        <View style={styles.filterOptions}>
                            {categories.map(category => (
                                <TouchableOpacity
                                    key={category.id}
                                    style={[
                                        styles.filterOption,
                                        filters.category === category.id && styles.filterOptionSelected
                                    ]}
                                    onPress={() => handleFilterChange('category', category.id)}
                                >
                                    <Text style={[
                                        styles.filterOptionText,
                                        filters.category === category.id && styles.filterOptionTextSelected
                                    ]}>
                                        {category.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Price Range Filter */}
                    <View style={styles.filterSection}>
                        <Text style={styles.filterTitle}>Price Range</Text>
                        <View style={styles.filterOptions}>
                            {priceRanges.map(range => (
                                <TouchableOpacity
                                    key={range.label}
                                    style={[
                                        styles.filterOption,
                                        JSON.stringify(filters.priceRange) === JSON.stringify(range.value) && styles.filterOptionSelected
                                    ]}
                                    onPress={() => handleFilterChange('priceRange', range.value)}
                                >
                                    <Text style={[
                                        styles.filterOptionText,
                                        JSON.stringify(filters.priceRange) === JSON.stringify(range.value) && styles.filterOptionTextSelected
                                    ]}>
                                        {range.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Location Filter */}
                    <View style={styles.filterSection}>
                        <Text style={styles.filterTitle}>Location</Text>
                        <View style={styles.filterOptions}>
                            {locations.map(location => (
                                <TouchableOpacity
                                    key={location.id}
                                    style={[
                                        styles.filterOption,
                                        filters.location === location.id && styles.filterOptionSelected
                                    ]}
                                    onPress={() => handleFilterChange('location', location.id)}
                                >
                                    <Text style={[
                                        styles.filterOptionText,
                                        filters.location === location.id && styles.filterOptionTextSelected
                                    ]}>
                                        {location.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Rating Filter */}
                    <View style={styles.filterSection}>
                        <Text style={styles.filterTitle}>Minimum Rating</Text>
                        <View style={styles.ratingOptions}>
                            {[1, 2, 3, 4, 5].map(rating => (
                                <TouchableOpacity
                                    key={rating}
                                    style={[
                                        styles.ratingOption,
                                        filters.rating === rating && styles.ratingOptionSelected
                                    ]}
                                    onPress={() => handleFilterChange('rating', rating)}
                                >
                                    <View style={styles.ratingStars}>
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <Icon
                                                key={i}
                                                name={i < rating ? 'star' : 'star-o'}
                                                size={16}
                                                color={i < rating ? '#FFD700' : '#ccc'}
                                            />
                                        ))}
                                    </View>
                                    <Text style={[
                                        styles.filterOptionText,
                                        filters.rating === rating && styles.filterOptionTextSelected
                                    ]}>
                                        & Up
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Stock Filter */}
                    <View style={styles.filterSection}>
                        <TouchableOpacity
                            style={styles.stockToggle}
                            onPress={() => handleFilterChange('inStock', !filters.inStock)}
                        >
                            <Text style={styles.filterTitle}>In Stock Only</Text>
                            <View style={[
                                styles.toggleSwitch,
                                filters.inStock && styles.toggleSwitchActive
                            ]}>
                                <View style={[
                                    styles.toggleThumb,
                                    filters.inStock && styles.toggleThumbActive
                                ]} />
                            </View>
                        </TouchableOpacity>
                    </View>
                </ScrollView>

                <View style={styles.modalFooter}>
                    <TouchableOpacity
                        style={styles.applyButton}
                        onPress={() => {
                            setShowFilters(false);
                            onSearch?.({ type: 'filter', filters });
                        }}
                    >
                        <Text style={styles.applyButtonText}>Apply Filters</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    const renderImageSearchModal = () => (
        <Modal
            visible={showImageSearch}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowImageSearch(false)}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={() => setShowImageSearch(false)}>
                        <Text style={styles.cancelButton}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Search by Image</Text>
                    <View style={{ width: 60 }} />
                </View>

                <View style={styles.modalContent}>
                    <View style={styles.imageSearchContainer}>
                        {!isInitialized && !initializationError && (
                            <View style={styles.aiInitializationContainer}>
                                <ActivityIndicator size="large" color="#0390F3" />
                                <Text style={styles.aiInitializationText}>Initializing visual search...</Text>
                            </View>
                        )}

                        {initializationError && (
                            <View style={styles.aiErrorContainer}>
                                <Icon name="exclamation-triangle" size={24} color="#FF9800" />
                                <Text style={styles.aiErrorText}>
                                    Visual search unavailable. AI services failed to initialize.
                                </Text>
                            </View>
                        )}

                        {isInitialized && (
                            <>
                                <Text style={styles.imageSearchTitle}>Find Similar Products</Text>
                                <Text style={styles.imageSearchSubtitle}>
                                    Upload an image to find visually similar products in our catalog
                                </Text>

                                <View style={styles.imageSearchOptions}>
                                    <TouchableOpacity
                                        style={styles.imageSearchOption}
                                        onPress={openCamera}
                                    >
                                        <View style={styles.optionIconContainer}>
                                            <Icon name="camera" size={32} color="#0390F3" />
                                        </View>
                                        <Text style={styles.optionTitle}>Take Photo</Text>
                                        <Text style={styles.optionSubtitle}>Use camera to capture</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.imageSearchOption}
                                        onPress={openImageLibrary}
                                    >
                                        <View style={styles.optionIconContainer}>
                                            <Icon name="image" size={32} color="#0390F3" />
                                        </View>
                                        <Text style={styles.optionTitle}>Choose from Gallery</Text>
                                        <Text style={styles.optionSubtitle}>Select existing photo</Text>
                                    </TouchableOpacity>
                                </View>

                                {visualSearch.isSearching && (
                                    <View style={styles.searchingContainer}>
                                        <ActivityIndicator size="large" color="#0390F3" />
                                        <Text style={styles.searchingText}>Analyzing image features...</Text>
                                        <Text style={styles.searchingSubtext}>This may take a few moments</Text>
                                    </View>
                                )}
                            </>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );

    return (
        <View style={[styles.container, style]}>
            {/* Search Input */}
            <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                    <Icon name="search" size={16} color="#999" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder={placeholder}
                        value={searchText}
                        onChangeText={setSearchText}
                        onSubmitEditing={handleTextSearch}
                        returnKeyType="search"
                    />

                    {/* Camera Button for Image Search */}
                    <TouchableOpacity
                        style={styles.cameraButton}
                        onPress={() => setShowImageSearch(true)}
                    >
                        <Icon name="camera" size={16} color="#0390F3" />
                    </TouchableOpacity>

                    {/* Filter Button */}
                    <TouchableOpacity
                        style={styles.filterButton}
                        onPress={() => setShowFilters(true)}
                    >
                        <Icon name="sliders" size={16} color="#0390F3" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Active Filters Display */}
            {(filters.category || filters.location || filters.rating > 0 || filters.inStock) && (
                <View style={styles.activeFilters}>
                    <Text style={styles.activeFiltersLabel}>Active filters:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {filters.category && (
                            <View style={styles.filterChip}>
                                <Text style={styles.filterChipText}>{categories.find(c => c.id === filters.category)?.name}</Text>
                                <TouchableOpacity onPress={() => handleFilterChange('category', '')}>
                                    <Icon name="times" size={12} color="#666" />
                                </TouchableOpacity>
                            </View>
                        )}
                        {filters.location && (
                            <View style={styles.filterChip}>
                                <Text style={styles.filterChipText}>{locations.find(l => l.id === filters.location)?.name}</Text>
                                <TouchableOpacity onPress={() => handleFilterChange('location', '')}>
                                    <Icon name="times" size={12} color="#666" />
                                </TouchableOpacity>
                            </View>
                        )}
                        {filters.rating > 0 && (
                            <View style={styles.filterChip}>
                                <Text style={styles.filterChipText}>{filters.rating}+ Stars</Text>
                                <TouchableOpacity onPress={() => handleFilterChange('rating', 0)}>
                                    <Icon name="times" size={12} color="#666" />
                                </TouchableOpacity>
                            </View>
                        )}
                        {filters.inStock && (
                            <View style={styles.filterChip}>
                                <Text style={styles.filterChipText}>In Stock</Text>
                                <TouchableOpacity onPress={() => handleFilterChange('inStock', false)}>
                                    <Icon name="times" size={12} color="#666" />
                                </TouchableOpacity>
                            </View>
                        )}
                    </ScrollView>
                </View>
            )}

            {/* Search Results Info */}
            {visualSearch.searchResults.length > 0 && searchType === 'image' && (
                <View style={styles.searchResultsInfo}>
                    <View style={styles.resultInfoHeader}>
                        <Icon name="search" size={16} color="#0390F3" />
                        <Text style={styles.searchResultsText}>
                            Found {visualSearch.searchResults.length} similar products
                        </Text>
                        {selectedImage && (
                            <TouchableOpacity
                                style={styles.clearSearchButton}
                                onPress={() => {
                                    setSearchType('text');
                                    setSelectedImage(null);
                                    dispatch(clearSearchResults());
                                }}
                            >
                                <Icon name="times" size={14} color="#666" />
                            </TouchableOpacity>
                        )}
                    </View>
                    {selectedImage && (
                        <View style={styles.selectedImagePreview}>
                            <Image source={selectedImage} style={styles.previewImage} />
                            <Text style={styles.previewText}>Visual search query</Text>
                        </View>
                    )}
                </View>
            )}

            {renderFilterModal()}
            {renderImageSearchModal()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    searchContainer: {
        marginBottom: 12,
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 25,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        paddingVertical: 8,
    },
    cameraButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginLeft: 8,
    },
    filterButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginLeft: 8,
    },
    activeFilters: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    activeFiltersLabel: {
        fontSize: 14,
        color: '#666',
        marginRight: 8,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e3f2fd',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginRight: 8,
    },
    filterChipText: {
        fontSize: 12,
        color: '#0390F3',
        marginRight: 6,
    },
    searchResultsInfo: {
        backgroundColor: '#f0f8ff',
        padding: 8,
        borderRadius: 6,
    },
    searchResultsText: {
        fontSize: 12,
        color: '#0390F3',
        textAlign: 'center',
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
    clearButton: {
        fontSize: 16,
        color: '#F44336',
    },
    modalContent: {
        flex: 1,
        padding: 16,
    },
    filterSection: {
        marginBottom: 24,
    },
    filterTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    filterOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    filterOption: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        backgroundColor: '#f9f9f9',
    },
    filterOptionSelected: {
        backgroundColor: '#0390F3',
        borderColor: '#0390F3',
    },
    filterOptionText: {
        fontSize: 14,
        color: '#666',
    },
    filterOptionTextSelected: {
        color: '#fff',
    },
    ratingOptions: {
        gap: 12,
    },
    ratingOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    ratingOptionSelected: {
        backgroundColor: '#e3f2fd',
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    ratingStars: {
        marginRight: 8,
    },
    stockToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    toggleSwitch: {
        width: 50,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#e0e0e0',
        padding: 2,
    },
    toggleSwitchActive: {
        backgroundColor: '#0390F3',
    },
    toggleThumb: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#fff',
    },
    toggleThumbActive: {
        marginLeft: 22,
    },
    modalFooter: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    applyButton: {
        backgroundColor: '#0390F3',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    applyButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    imageSearchContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    aiInitializationContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    aiInitializationText: {
        marginTop: 12,
        fontSize: 16,
        color: '#0390F3',
        textAlign: 'center',
    },
    aiErrorContainer: {
        alignItems: 'center',
        backgroundColor: '#fff3e0',
        padding: 20,
        borderRadius: 12,
        marginBottom: 30,
    },
    aiErrorText: {
        marginTop: 12,
        fontSize: 14,
        color: '#FF9800',
        textAlign: 'center',
        lineHeight: 20,
    },
    imageSearchTitle: {
        fontSize: 24,
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
        marginBottom: 8,
    },
    imageSearchSubtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 20,
    },
    imageSearchOptions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginBottom: 40,
    },
    imageSearchOption: {
        alignItems: 'center',
        padding: 20,
        borderRadius: 12,
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#e9ecef',
        width: '45%',
    },
    optionIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#e3f2fd',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    optionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    optionSubtitle: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
    searchingContainer: {
        alignItems: 'center',
        marginTop: 20,
    },
    searchingText: {
        fontSize: 16,
        color: '#0390F3',
        marginTop: 12,
        fontWeight: '500',
    },
    searchingSubtext: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
        textAlign: 'center',
    },
    resultInfoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    clearSearchButton: {
        padding: 4,
    },
    selectedImagePreview: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        padding: 8,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
    },
    previewImage: {
        width: 40,
        height: 40,
        borderRadius: 6,
        marginRight: 8,
    },
    previewText: {
        fontSize: 12,
        color: '#666',
    },
});

export default AdvancedSearch;
