import React, { useState, useCallback, useEffect, useRef } from 'react';
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
    Keyboard,
    StatusBar
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useDispatch, useSelector } from 'react-redux';
import { useLocalization } from '../services/LocalizationProvider';
import { analyzeImageSimilarity, initializeAI } from '../store/slices/aiSlice';
import {
    performAdvancedSearch,
    getSearchSuggestions,
    saveSearchHistory,
    getTrendingProducts,
    getPersonalizedRecommendations,
    addToComparison,
    removeFromComparison,
    updateSearchParams,
    updateFilters,
    toggleSearchHistory,
    removeActiveFilter,
    clearSearchResults,
    updateSearchAnalytics,
    clearActiveFilters
} from '../store/slices/searchSlice';
import {
    getCurrentLocation,
    getAddressFromCoordinates,
    validatePincode,
    updateLocationFilters
} from '../store/slices/locationSlice';

const { width } = Dimensions.get('window');

const EnhancedAdvancedSearch = ({
    onSearch,
    onFilterChange,
    initialQuery = '',
    placeholder = "Search products...",
    style,
    showLocationFilter = true,
    showComparisonFeature = true,
    showRecommendations = true
}) => {
    const dispatch = useDispatch();
    const { translate: rawTranslate, formatCurrency, currentLanguageCode } = useLocalization();

    const {
        searchResults,
        totalResults,
        isSearching,
        searchSuggestions,
        isGettingSuggestions,
        searchHistory,
        trendingProducts,
        isLoadingTrending,
        personalizedRecommendations,
        isLoadingRecommendations,
        comparisonList,
        maxComparisonItems,
        searchParams,
        showSearchHistory,
        activeFilters
    } = useSelector(state => state.search);

    const {
        currentLocation,
        currentAddress,
        userPincode,
        locationFilters
    } = useSelector(state => state.location);

    const {
        currentLanguage,
        currency,
        currencySymbol
    } = useSelector(state => state.localization);

    const [searchText, setSearchText] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [showImageSearch, setShowImageSearch] = useState(false);
    const [showComparison, setShowComparison] = useState(false);
    const [searchType, setSearchType] = useState('text');
    const [selectedImage, setSelectedImage] = useState(null);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [debounceTimer, setDebounceTimer] = useState(null);

    const searchInputRef = useRef(null);

    const toText = useCallback((value) => {
        if (value === null || value === undefined) {
            return '';
        }
        if (typeof value === 'string' || typeof value === 'number') {
            return String(value);
        }
        if (typeof value?.then === 'function') {
            return '';
        }
        if (typeof value?.text === 'string' || typeof value?.text === 'number') {
            return String(value.text);
        }
        return String(value);
    }, []);

    // `translate()` must never return a Promise (or any non-primitive) into JSX.
    // If localization is async for some reason, fall back to the key/fallback string.
    const translate = useCallback((key, fallback) => {
        const raw = rawTranslate?.(key, fallback);
        const text = toText(raw);
        if (text) return text;
        if (typeof fallback === 'string') return fallback;
        if (typeof key === 'string') return key;
        return '';
    }, [rawTranslate, toText]);

    const hasInitializedQuery = useRef(false);

    const runAdvancedSearch = useCallback(async (query) => {
        const q = String(query || '').trim();
        if (!q) return;

        Keyboard.dismiss();
        setShowSuggestions(false);

        const searchData = {
            query: q,
            filters: searchParams.filters,
            location: currentLocation || userPincode,
            userPreferences: {
                preferredBrands: [], // Could be loaded from user profile
                priceRange: searchParams.filters.priceRange,
                category: searchParams.filters.category
            }
        };

        try {
            const result = await dispatch(performAdvancedSearch(searchData)).unwrap();
            dispatch(saveSearchHistory(q));

            dispatch(updateSearchAnalytics({ type: 'INCREMENT_SEARCH_COUNT' }));
            dispatch(updateSearchAnalytics({ type: 'ADD_POPULAR_QUERY', data: { query: q } }));

            onSearch?.({
                type: 'advanced',
                results: result.results,
                totalResults: result.totalCount,
                searchParams: searchData
            });
        } catch (error) {
            console.error('Advanced search failed:', error);
            Alert.alert(
                translate('Search Error'),
                translate('Unable to perform search. Please try again.'),
                [{ text: translate('OK') }]
            );
        }
    }, [
        dispatch,
        currentLocation,
        userPincode,
        onSearch,
        searchParams.filters,
        translate,
    ]);

    // Categories with translations
    const categories = [
        { id: '', name: translate('All Categories') },
        { id: 'palazzo', name: translate('Palazzo') },
        { id: 'leggings', name: translate('Leggings') },
        { id: 'pants', name: translate('Pants') },
        { id: 'kurti', name: translate('Kurti') },
        { id: 'saree', name: translate('Saree') },
        { id: 'dupatta', name: translate('Dupatta') },
    ];

    // Price ranges with localized formatting
    const priceRanges = [
        { label: translate('All Prices'), value: [0, 10000] },
        { label: `${translate('Under')} ${currencySymbol}500`, value: [0, 500] },
        { label: `${currencySymbol}500 - ${currencySymbol}1000`, value: [500, 1000] },
        { label: `${currencySymbol}1000 - ${currencySymbol}2000`, value: [1000, 2000] },
        { label: `${currencySymbol}2000 - ${currencySymbol}5000`, value: [2000, 5000] },
        { label: `${translate('Above')} ${currencySymbol}5000`, value: [5000, 10000] },
    ];

    // Sort options
    const sortOptions = [
        { value: 'relevance', label: translate('Relevance') },
        { value: 'price-low', label: translate('Price: Low to High') },
        { value: 'price-high', label: translate('Price: High to Low') },
        { value: 'rating', label: translate('Rating') },
        { value: 'distance', label: translate('Distance') },
        { value: 'popularity', label: translate('Popularity') }
    ];

    // Load initial data
    useEffect(() => {
        dispatch(getTrendingProducts());
        dispatch(getPersonalizedRecommendations('current-user')); // Replace with actual user ID
    }, [dispatch]);

    // If the screen navigates with an initial query (Home search), auto-run it once.
    useEffect(() => {
        if (hasInitializedQuery.current) return;
        const q = String(initialQuery || '').trim();
        if (!q) return;
        hasInitializedQuery.current = true;
        setSearchText(q);
        runAdvancedSearch(q);
    }, [initialQuery, runAdvancedSearch]);

    // Handle text input with debounced suggestions
    const handleTextChange = useCallback((text) => {
        setSearchText(text);

        // Clear previous timer
        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }

        // Show suggestions after 300ms of inactivity
        if (text.length > 0) {
            const timer = setTimeout(() => {
                dispatch(getSearchSuggestions(text));
                setShowSuggestions(true);
            }, 300);
            setDebounceTimer(timer);
        } else {
            setShowSuggestions(false);
        }
    }, [dispatch, debounceTimer]);

    // Enhanced search function
    const handleAdvancedSearch = useCallback(async () => {
        await runAdvancedSearch(searchText);
    }, [runAdvancedSearch, searchText]);

    // Handle filter changes
    const handleFilterChange = useCallback((key, value) => {
        const newFilters = { ...searchParams.filters, [key]: value };
        dispatch(updateFilters(newFilters));
        onFilterChange?.(newFilters);
    }, [searchParams.filters, dispatch, onFilterChange]);

    // Handle location-based filtering
    const handleLocationFilter = useCallback(async () => {
        try {
            // Get current location if not already available
            if (!currentLocation) {
                const locationResult = await dispatch(getCurrentLocation()).unwrap();
                if (locationResult) {
                    await dispatch(getAddressFromCoordinates(locationResult)).unwrap();
                }
            }

            // Update location filters
            const locationData = {
                enabled: true,
                pincodeFilter: userPincode,
                stateFilter: currentAddress?.state || '',
                cityFilter: currentAddress?.city || '',
                radius: locationFilters.radius
            };

            dispatch(updateLocationFilters(locationData));

            // Trigger search with location filter
            if (searchText.trim()) {
                handleAdvancedSearch();
            }

        } catch (error) {
            console.error('Location filter error:', error);
            Alert.alert(
                translate('Location Error'),
                translate('Unable to access location. Please check permissions.'),
                [{ text: translate('OK') }]
            );
        }
    }, [currentLocation, currentAddress, userPincode, locationFilters, searchText, handleAdvancedSearch, dispatch, translate]);

    // Add product to comparison
    const handleAddToComparison = useCallback((product) => {
        if (comparisonList.length >= maxComparisonItems) {
            Alert.alert(
                translate('Comparison Limit'),
                translate(`You can compare up to ${maxComparisonItems} products at a time.`),
                [{ text: translate('OK') }]
            );
            return;
        }

        dispatch(addToComparison(product));
        setShowComparison(true);
    }, [comparisonList, maxComparisonItems, dispatch, translate]);

    // Render search suggestions
    const renderSearchSuggestions = () => (
        <Modal
            visible={showSuggestions && searchSuggestions.length > 0}
            transparent
            animationType="fade"
            onRequestClose={() => setShowSuggestions(false)}
        >
            <TouchableOpacity
                style={styles.suggestionsOverlay}
                activeOpacity={1}
                onPress={() => setShowSuggestions(false)}
            >
                <View style={styles.suggestionsContainer}>
                    <ScrollView keyboardShouldPersistTaps="handled">
                        {searchSuggestions.map((suggestion, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.suggestionItem}
                                onPress={() => {
                                    setSearchText(toText(suggestion.text));
                                    setShowSuggestions(false);
                                    searchInputRef.current?.focus();
                                }}
                            >
                                <Icon name="search" size={16} color="#999" style={styles.suggestionIcon} />
                                <Text style={styles.suggestionText}>{toText(suggestion.text)}</Text>
                                {suggestion.count && (
                                    <Text style={styles.suggestionCount}>
                                        ({suggestion.count})
                                    </Text>
                                )}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </TouchableOpacity>
        </Modal>
    );

    // Render enhanced filter modal
    const renderEnhancedFilterModal = () => (
        <Modal
            visible={showFilters}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowFilters(false)}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={() => setShowFilters(false)}>
                        <Text style={styles.cancelButton}>{translate('Cancel')}</Text>
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>{translate('Filters')}</Text>
                    <TouchableOpacity onPress={() => {
                        dispatch(clearActiveFilters());
                        dispatch(updateFilters({
                            category: '',
                            priceRange: [0, 10000],
                            location: '',
                            rating: 0,
                            inStock: false,
                            vendor: '',
                            sortBy: 'relevance'
                        }));
                    }}>
                        <Text style={styles.clearButton}>{translate('Clear All')}</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalContent}>
                    {/* Category Filter */}
                    <View style={styles.filterSection}>
                        <Text style={styles.filterTitle}>{translate('Category')}</Text>
                        <View style={styles.filterOptions}>
                            {categories.map(category => (
                                <TouchableOpacity
                                    key={category.id}
                                    style={[
                                        styles.filterOption,
                                        searchParams.filters.category === category.id && styles.filterOptionSelected
                                    ]}
                                    onPress={() => handleFilterChange('category', category.id)}
                                >
                                    <Text style={[
                                        styles.filterOptionText,
                                        searchParams.filters.category === category.id && styles.filterOptionTextSelected
                                    ]}>
                                        {category.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Price Range Filter */}
                    <View style={styles.filterSection}>
                        <Text style={styles.filterTitle}>{translate('Price Range')}</Text>
                        <View style={styles.filterOptions}>
                            {priceRanges.map(range => (
                                <TouchableOpacity
                                    key={range.label}
                                    style={[
                                        styles.filterOption,
                                        JSON.stringify(searchParams.filters.priceRange) === JSON.stringify(range.value) && styles.filterOptionSelected
                                    ]}
                                    onPress={() => handleFilterChange('priceRange', range.value)}
                                >
                                    <Text style={[
                                        styles.filterOptionText,
                                        JSON.stringify(searchParams.filters.priceRange) === JSON.stringify(range.value) && styles.filterOptionTextSelected
                                    ]}>
                                        {range.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Sort By */}
                    <View style={styles.filterSection}>
                        <Text style={styles.filterTitle}>{translate('Sort by')}</Text>
                        <View style={styles.filterOptions}>
                            {sortOptions.map(option => (
                                <TouchableOpacity
                                    key={option.value}
                                    style={[
                                        styles.filterOption,
                                        searchParams.filters.sortBy === option.value && styles.filterOptionSelected
                                    ]}
                                    onPress={() => handleFilterChange('sortBy', option.value)}
                                >
                                    <Text style={[
                                        styles.filterOptionText,
                                        searchParams.filters.sortBy === option.value && styles.filterOptionTextSelected
                                    ]}>
                                        {option.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Location Filter */}
                    {showLocationFilter && (
                        <View style={styles.filterSection}>
                            <Text style={styles.filterTitle}>{translate('Location')}</Text>
                            <TouchableOpacity
                                style={styles.locationFilterButton}
                                onPress={handleLocationFilter}
                            >
                                <Icon name="map-marker" size={16} color="#0390F3" />
                                <Text style={styles.locationFilterText}>
                                    {currentAddress ?
                                        `${translate('Delivery to')} ${currentAddress.city}, ${currentAddress.state}` :
                                        translate('Set Delivery Location')
                                    }
                                </Text>
                                <Icon name="chevron-right" size={12} color="#999" />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Rating Filter */}
                    <View style={styles.filterSection}>
                        <Text style={styles.filterTitle}>{translate('Minimum Rating')}</Text>
                        <View style={styles.ratingOptions}>
                            {[1, 2, 3, 4, 5].map(rating => (
                                <TouchableOpacity
                                    key={rating}
                                    style={[
                                        styles.ratingOption,
                                        searchParams.filters.rating === rating && styles.ratingOptionSelected
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
                                        searchParams.filters.rating === rating && styles.filterOptionTextSelected
                                    ]}>
                                        & {translate('Up')}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Stock Filter */}
                    <View style={styles.filterSection}>
                        <TouchableOpacity
                            style={styles.stockToggle}
                            onPress={() => handleFilterChange('inStock', !searchParams.filters.inStock)}
                        >
                            <Text style={styles.filterTitle}>{translate('In Stock Only')}</Text>
                            <View style={[
                                styles.toggleSwitch,
                                searchParams.filters.inStock && styles.toggleSwitchActive
                            ]}>
                                <View style={[
                                    styles.toggleThumb,
                                    searchParams.filters.inStock && styles.toggleThumbActive
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
                            if (searchText.trim()) {
                                handleAdvancedSearch();
                            }
                        }}
                    >
                        <Text style={styles.applyButtonText}>
                            {translate('Apply Filters')} ({totalResults} {translate('results')})
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    // Render comparison modal
    const renderComparisonModal = () => (
        <Modal
            visible={showComparison}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowComparison(false)}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={() => setShowComparison(false)}>
                        <Text style={styles.cancelButton}>{translate('Close')}</Text>
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>{translate('Product Comparison')}</Text>
                    <View style={{ width: 60 }} />
                </View>

                <ScrollView style={styles.modalContent}>
                    <View style={styles.comparisonGrid}>
                        {comparisonList.map((product, index) => (
                            <View key={product.id} style={styles.comparisonItem}>
                                <Image source={{ uri: product.image }} style={styles.comparisonImage} />
                                <Text style={styles.comparisonName} numberOfLines={2}>
                                    {toText(product.name)}
                                </Text>
                                <Text style={styles.comparisonPrice}>
                                    {formatCurrency(product.price)}
                                </Text>
                                <TouchableOpacity
                                    style={styles.removeComparisonButton}
                                    onPress={() => dispatch(removeFromComparison(product.id))}
                                >
                                    <Icon name="times" size={14} color="#F44336" />
                                </TouchableOpacity>
                            </View>
                        ))}

                        {/* Empty slots */}
                        {Array.from({ length: maxComparisonItems - comparisonList.length }).map((_, index) => (
                            <View key={`empty-${index}`} style={styles.comparisonItemEmpty}>
                                <Icon name="plus" size={32} color="#ccc" />
                                <Text style={styles.comparisonEmptyText}>
                                    {translate('Add Product')}
                                </Text>
                            </View>
                        ))}
                    </View>
                </ScrollView>
            </View>
        </Modal>
    );

    // Render trending products section
    const renderTrendingProducts = () => (
        <View style={styles.trendingSection}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{translate('Trending Now')}</Text>
                <TouchableOpacity>
                    <Text style={styles.seeAllText}>{translate('See All')}</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={trendingProducts}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.trendingItem}>
                        <Image source={{ uri: item.image }} style={styles.trendingImage} />
                        <Text style={styles.trendingName} numberOfLines={1}>
                            {toText(item.name)}
                        </Text>
                        <Text style={styles.trendingPrice}>
                            {formatCurrency(item.price)}
                        </Text>
                        <View style={styles.trendingBadge}>
                            <Text style={styles.trendingBadgeText}>
                                {translate('Trending')} #{item.trendScore}
                            </Text>
                        </View>
                    </TouchableOpacity>
                )}
                keyExtractor={(item) => item.id}
            />
        </View>
    );

    // Render personalized recommendations
    const renderRecommendations = () => (
        <View style={styles.recommendationsSection}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{translate('Recommended for You')}</Text>
                <TouchableOpacity>
                    <Text style={styles.seeAllText}>{translate('See All')}</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={personalizedRecommendations}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.recommendationItem}>
                        <Image source={{ uri: item.image }} style={styles.recommendationImage} />
                        <Text style={styles.recommendationName} numberOfLines={1}>
                            {toText(item.name)}
                        </Text>
                        <Text style={styles.recommendationPrice}>
                            {formatCurrency(item.price)}
                        </Text>
                        <Text style={styles.recommendationReason}>
                            {toText(item.reason)}
                        </Text>
                    </TouchableOpacity>
                )}
                keyExtractor={(item) => item.id}
            />
        </View>
    );

    return (
        <View style={[styles.container, style]}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Search Input */}
            <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                    <Icon name="search" size={16} color="#999" style={styles.searchIcon} />
                    <TextInput
                        ref={searchInputRef}
                        style={styles.searchInput}
                        placeholder={placeholder}
                        value={searchText}
                        onChangeText={handleTextChange}
                        onSubmitEditing={handleAdvancedSearch}
                        returnKeyType="search"
                        placeholderTextColor="#999"
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
                        {activeFilters.length > 0 && (
                            <View style={styles.filterBadge}>
                                <Text style={styles.filterBadgeText}>
                                    {activeFilters.length}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* Comparison Button */}
                    {showComparisonFeature && comparisonList.length > 0 && (
                        <TouchableOpacity
                            style={styles.comparisonButton}
                            onPress={() => setShowComparison(true)}
                        >
                            <Icon name="balance-scale" size={16} color="#0390F3" />
                            <View style={styles.comparisonBadge}>
                                <Text style={styles.comparisonBadgeText}>
                                    {comparisonList.length}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Active Filters Display */}
            {activeFilters.length > 0 && (
                <View style={styles.activeFilters}>
                    <Text style={styles.activeFiltersLabel}>{translate('Active filters:')}</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {activeFilters.map((filter, index) => (
                            <View key={index} style={styles.filterChip}>
                                <Text style={styles.filterChipText}>{toText(filter.label)}</Text>
                                <TouchableOpacity onPress={() => dispatch(removeActiveFilter(filter.key))}>
                                    <Icon name="times" size={12} color="#666" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* Search History */}
            {showSearchHistory && searchHistory.length > 0 && !searchText && (
                <View style={styles.searchHistoryContainer}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>{translate('Recent Searches')}</Text>
                        <TouchableOpacity onPress={() => dispatch(toggleSearchHistory())}>
                            <Text style={styles.hideText}>{translate('Hide')}</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {searchHistory.slice(0, 10).map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.historyItem}
                                onPress={() => {
                                    setSearchText(toText(item.query));
                                    dispatch(toggleSearchHistory());
                                }}
                            >
                                <Icon name="history" size={14} color="#999" />
                                <Text style={styles.historyText}>{toText(item.query)}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* Search Results Info */}
            {searchResults.length > 0 && (
                <View style={styles.searchResultsInfo}>
                    <Text style={styles.searchResultsText}>
                        {translate('Found')} {totalResults} {translate('products')}
                        {searchText && ` ${translate('for')} "${toText(searchText)}"`}
                    </Text>
                    {isSearching && (
                        <ActivityIndicator size="small" color="#0390F3" />
                    )}
                </View>
            )}

            {/* Trending Products */}
            {showRecommendations && trendingProducts.length > 0 && !searchText && (
                renderTrendingProducts()
            )}

            {/* Personalized Recommendations */}
            {showRecommendations && personalizedRecommendations.length > 0 && !searchText && (
                renderRecommendations()
            )}

            {/* Search History Toggle */}
            {!searchText && searchHistory.length > 0 && (
                <TouchableOpacity
                    style={styles.searchHistoryToggle}
                    onPress={() => dispatch(toggleSearchHistory())}
                >
                    <Icon name="history" size={14} color="#0390F3" />
                    <Text style={styles.searchHistoryToggleText}>
                        {showSearchHistory ? translate('Hide Search History') : translate('Show Search History')}
                    </Text>
                </TouchableOpacity>
            )}

            {/* Render Modals */}
            {renderSearchSuggestions()}
            {renderEnhancedFilterModal()}
            {renderComparisonModal()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    searchContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
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
        position: 'relative',
    },
    comparisonButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginLeft: 8,
        position: 'relative',
    },
    filterBadge: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: '#F44336',
        borderRadius: 8,
        minWidth: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    comparisonBadge: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: '#0390F3',
        borderRadius: 8,
        minWidth: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    comparisonBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    activeFilters: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 8,
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#f0f8ff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    searchResultsText: {
        fontSize: 14,
        color: '#0390F3',
    },
    trendingSection: {
        paddingVertical: 16,
    },
    recommendationsSection: {
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    seeAllText: {
        fontSize: 14,
        color: '#0390F3',
        fontWeight: '500',
    },
    hideText: {
        fontSize: 14,
        color: '#666',
    },
    trendingItem: {
        width: 140,
        marginLeft: 16,
        marginRight: 8,
    },
    trendingImage: {
        width: '100%',
        height: 120,
        borderRadius: 8,
        marginBottom: 8,
    },
    trendingName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        marginBottom: 4,
    },
    trendingPrice: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0390F3',
        marginBottom: 4,
    },
    trendingBadge: {
        backgroundColor: '#FF5722',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    trendingBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    recommendationItem: {
        width: 140,
        marginLeft: 16,
        marginRight: 8,
    },
    recommendationImage: {
        width: '100%',
        height: 120,
        borderRadius: 8,
        marginBottom: 8,
    },
    recommendationName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        marginBottom: 4,
    },
    recommendationPrice: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0390F3',
        marginBottom: 4,
    },
    recommendationReason: {
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic',
    },
    searchHistoryContainer: {
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        marginLeft: 16,
    },
    historyText: {
        fontSize: 14,
        color: '#333',
        marginLeft: 8,
    },
    searchHistoryToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    searchHistoryToggleText: {
        fontSize: 14,
        color: '#0390F3',
        marginLeft: 8,
    },
    suggestionsOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    suggestionsContainer: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginTop: 100,
        borderRadius: 8,
        maxHeight: 300,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    suggestionIcon: {
        marginRight: 12,
    },
    suggestionText: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    suggestionCount: {
        fontSize: 14,
        color: '#999',
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
    locationFilterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        backgroundColor: '#f9f9f9',
    },
    locationFilterText: {
        flex: 1,
        fontSize: 14,
        color: '#333',
        marginLeft: 12,
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
    comparisonGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    comparisonItem: {
        width: '30%',
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        position: 'relative',
    },
    comparisonItemEmpty: {
        width: '30%',
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 120,
    },
    comparisonImage: {
        width: '100%',
        height: 80,
        borderRadius: 4,
        marginBottom: 8,
    },
    comparisonName: {
        fontSize: 12,
        fontWeight: '500',
        color: '#333',
        marginBottom: 4,
    },
    comparisonPrice: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0390F3',
    },
    comparisonEmptyText: {
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
        marginTop: 8,
    },
    removeComparisonButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#fff',
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
});

export default EnhancedAdvancedSearch;
