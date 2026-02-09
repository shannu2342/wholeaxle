/**
 * Unit Tests - Product Slice
 * Wholexale.com B2B Marketplace
 */

import productReducer, {
    fetchProducts,
    fetchProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    searchProducts,
    setFilters,
    clearFilters,
    setLoading,
    setError,
    clearError,
} from '../../../src/store/slices/productSlice';

describe('Product Slice', () => {
    const initialState = {
        products: [],
        categories: [],
        selectedProduct: null,
        loading: false,
        error: null,
        filters: {},
        searchQuery: '',
    };

    describe('Initial State', () => {
        it('should return the initial state', () => {
            expect(productReducer(undefined, { type: 'unknown' })).toEqual(initialState);
        });
    });

    describe('Fetch Products', () => {
        it('should handle fetchProducts.pending', () => {
            const action = { type: fetchProducts.pending.type };
            const state = productReducer(initialState, action);
            expect(state.loading).toBe(true);
            expect(state.error).toBeNull();
        });

        it('should handle fetchProducts.fulfilled', () => {
            const mockProducts = [
                {
                    id: 'product-1',
                    name: 'Test Product',
                    price: 1000,
                    category: 'Electronics',
                    sellerId: 'seller-1',
                },
            ];

            const action = {
                type: fetchProducts.fulfilled.type,
                payload: mockProducts,
            };

            const state = productReducer(initialState, action);
            expect(state.products).toEqual(mockProducts);
            expect(state.loading).toBe(false);
            expect(state.error).toBeNull();
        });

        it('should handle fetchProducts.rejected', () => {
            const action = {
                type: fetchProducts.rejected.type,
                payload: 'Failed to fetch products',
            };

            const state = productReducer(initialState, action);
            expect(state.loading).toBe(false);
            expect(state.error).toBe('Failed to fetch products');
        });
    });

    describe('Fetch Product by ID', () => {
        it('should handle fetchProductById.fulfilled', () => {
            const mockProduct = {
                id: 'product-1',
                name: 'Single Product',
                description: 'Product description',
                price: 2000,
            };

            const action = {
                type: fetchProductById.fulfilled.type,
                payload: mockProduct,
            };

            const state = productReducer(initialState, action);
            expect(state.selectedProduct).toEqual(mockProduct);
        });
    });

    describe('Create Product', () => {
        it('should handle createProduct.fulfilled', () => {
            const newProduct = {
                id: 'product-new',
                name: 'New Product',
                price: 500,
                category: 'Clothing',
            };

            const action = {
                type: createProduct.fulfilled.type,
                payload: newProduct,
            };

            const state = productReducer(initialState, action);
            expect(state.products).toContain(newProduct);
            expect(state.products.length).toBe(1);
        });
    });

    describe('Update Product', () => {
        it('should handle updateProduct.fulfilled', () => {
            const existingProducts = [
                {
                    id: 'product-1',
                    name: 'Original Name',
                    price: 1000,
                },
            ];

            const updatedProduct = {
                id: 'product-1',
                name: 'Updated Name',
                price: 1500,
            };

            const stateWithProducts = {
                ...initialState,
                products: existingProducts,
            };

            const action = {
                type: updateProduct.fulfilled.type,
                payload: updatedProduct,
            };

            const state = productReducer(stateWithProducts, action);
            expect(state.products[0].name).toBe('Updated Name');
            expect(state.products[0].price).toBe(1500);
        });
    });

    describe('Delete Product', () => {
        it('should handle deleteProduct.fulfilled', () => {
            const products = [
                { id: 'product-1', name: 'Product 1' },
                { id: 'product-2', name: 'Product 2' },
                { id: 'product-3', name: 'Product 3' },
            ];

            const stateWithProducts = {
                ...initialState,
                products,
            };

            const action = {
                type: deleteProduct.fulfilled.type,
                payload: 'product-2',
            };

            const state = productReducer(stateWithProducts, action);
            expect(state.products).toHaveLength(2);
            expect(state.products).not.toContainEqual(
                expect.objectContaining({ id: 'product-2' })
            );
        });
    });

    describe('Search Products', () => {
        it('should handle searchProducts.fulfilled', () => {
            const searchResults = [
                { id: 'product-1', name: 'Electronics Product' },
                { id: 'product-2', name: 'Electronic Device' },
            ];

            const action = {
                type: searchProducts.fulfilled.type,
                payload: { query: 'Electronic', results: searchResults },
            };

            const state = productReducer(initialState, action);
            expect(state.products).toEqual(searchResults);
            expect(state.searchQuery).toBe('Electronic');
        });
    });

    describe('Filters', () => {
        it('should handle setFilters', () => {
            const filters = {
                category: 'Electronics',
                priceRange: [100, 1000],
                minRating: 4,
            };

            const action = { type: setFilters.type, payload: filters };
            const state = productReducer(initialState, action);
            expect(state.filters).toEqual(filters);
        });

        it('should handle clearFilters', () => {
            const stateWithFilters = {
                ...initialState,
                filters: { category: 'Electronics' },
            };

            const action = { type: clearFilters.type };
            const state = productReducer(stateWithFilters, action);
            expect(state.filters).toEqual({});
            expect(state.searchQuery).toBe('');
        });
    });

    describe('Utility Actions', () => {
        it('should handle setLoading', () => {
            const action = setLoading(true);
            const state = productReducer(initialState, action);
            expect(state.loading).toBe(true);
        });

        it('should handle setError', () => {
            const action = setError('Something went wrong');
            const state = productReducer(initialState, action);
            expect(state.error).toBe('Something went wrong');
        });

        it('should handle clearError', () => {
            const stateWithError = { ...initialState, error: 'Some error' };
            const action = { type: clearError.type };
            const state = productReducer(stateWithError, action);
            expect(state.error).toBeNull();
        });
    });
});
