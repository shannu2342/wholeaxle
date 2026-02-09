import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiRequest } from '../../services/apiClient';

// Async thunks for inventory management
export const generateSKU = createAsyncThunk(
    'inventory/generateSKU',
    async ({ productData, vendorId }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            return await apiRequest('/api/inventory/sku', {
                method: 'POST',
                token,
                body: { productData, vendorId },
            });
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const generateBarcode = createAsyncThunk(
    'inventory/generateBarcode',
    async ({ sku, productName }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            return await apiRequest('/api/inventory/barcode', {
                method: 'POST',
                token,
                body: { sku, productName },
            });
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const generateStickerPDF = createAsyncThunk(
    'inventory/generateStickerPDF',
    async ({ skuData, vendorInfo }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            return await apiRequest('/api/inventory/pdf', {
                method: 'POST',
                token,
                body: { skuData, vendorInfo },
            });
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const scanBarcode = createAsyncThunk(
    'inventory/scanBarcode',
    async ({ barcodeData }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            return await apiRequest('/api/inventory/lookup', {
                method: 'POST',
                token,
                body: { sku: barcodeData },
            });
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const updateInventory = createAsyncThunk(
    'inventory/updateInventory',
    async ({ sku, operation, quantity, reason }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            return await apiRequest('/api/inventory/update', {
                method: 'POST',
                token,
                body: { sku, operation, quantity, reason },
            });
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchInventoryAnalytics = createAsyncThunk(
    'inventory/fetchAnalytics',
    async ({ timeRange, vendorId }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            return await apiRequest('/api/inventory/analytics', { token });
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const exportInventoryData = createAsyncThunk(
    'inventory/exportData',
    async ({ format, filters }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            return await apiRequest('/api/inventory/export', {
                token,
                params: { format, ...filters },
            });
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const initialState = {
    skus: [],
    barcodeData: {},
    inventoryItems: [],
    analytics: {
        totalSKUs: 0,
        totalStockValue: 0,
        lowStockAlerts: 0,
        outOfStockItems: 0,
        reorderPending: 0,
        stockTurnoverRate: 0,
        topMovingItems: [],
        slowMovingItems: [],
        categoryBreakdown: [],
        alerts: []
    },
    stickerPdfs: [],
    exportData: [],
    scanningHistory: [],
    pagination: {
        page: 1,
        limit: 50,
        total: 0,
        hasMore: false,
    },
    filters: {
        category: '',
        stockStatus: 'all', // all, in_stock, low_stock, out_of_stock
        vendor: '',
        location: '',
        dateRange: null
    },
    isLoading: false,
    isGeneratingSKU: false,
    isGeneratingBarcode: false,
    isGeneratingPDF: false,
    isScanning: false,
    isUpdatingInventory: false,
    error: null,
    success: null,
};

const inventorySlice = createSlice({
    name: 'inventory',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },

        clearSuccess: (state) => {
            state.success = null;
        },

        addSKU: (state, action) => {
            const skuData = action.payload;
            const existingSKU = state.skus.find(sku => sku.sku === skuData.sku);
            if (!existingSKU) {
                state.skus.push(skuData);
            }
        },

        updateSKU: (state, action) => {
            const { sku, updates } = action.payload;
            const existingSKU = state.skus.find(s => s.sku === sku);
            if (existingSKU) {
                Object.assign(existingSKU, updates);
            }
        },

        removeSKU: (state, action) => {
            const sku = action.payload;
            state.skus = state.skus.filter(s => s.sku !== sku);
        },

        setBarcodeData: (state, action) => {
            const { sku, barcode, qrCode } = action.payload;
            state.barcodeData[sku] = { barcode, qrCode };
        },

        addInventoryItem: (state, action) => {
            const item = action.payload;
            const existingItem = state.inventoryItems.find(i => i.sku === item.sku);
            if (!existingItem) {
                state.inventoryItems.push(item);
            }
        },

        updateInventoryItem: (state, action) => {
            const { sku, updates } = action.payload;
            const item = state.inventoryItems.find(i => i.sku === sku);
            if (item) {
                Object.assign(item, updates);
            }
        },

        setFilters: (state, action) => {
            state.filters = { ...state.filters, ...action.payload };
        },

        clearFilters: (state) => {
            state.filters = initialState.filters;
        },

        addAlert: (state, action) => {
            const alert = action.payload;
            state.analytics.alerts.unshift(alert);
        },

        removeAlert: (state, action) => {
            const alertId = action.payload;
            state.analytics.alerts = state.analytics.alerts.filter(a => a.id !== alertId);
        },

        markAlertAsRead: (state, action) => {
            const alertId = action.payload;
            const alert = state.analytics.alerts.find(a => a.id === alertId);
            if (alert) {
                alert.isRead = true;
            }
        },

        addScannedItem: (state, action) => {
            const scannedItem = action.payload;
            state.scanningHistory.unshift(scannedItem);
            // Keep only last 100 scans
            if (state.scanningHistory.length > 100) {
                state.scanningHistory = state.scanningHistory.slice(0, 100);
            }
        },

        updateAnalytics: (state, action) => {
            state.analytics = { ...state.analytics, ...action.payload };
        },

        setPagination: (state, action) => {
            state.pagination = { ...state.pagination, ...action.payload };
        },
    },

    extraReducers: (builder) => {
        builder
            // Generate SKU
            .addCase(generateSKU.pending, (state) => {
                state.isGeneratingSKU = true;
                state.error = null;
            })
            .addCase(generateSKU.fulfilled, (state, action) => {
                state.isGeneratingSKU = false;
                state.success = 'SKU generated successfully';
                // The SKU will be added via the addSKU reducer
            })
            .addCase(generateSKU.rejected, (state, action) => {
                state.isGeneratingSKU = false;
                state.error = action.payload;
            })

            // Generate Barcode
            .addCase(generateBarcode.pending, (state) => {
                state.isGeneratingBarcode = true;
                state.error = null;
            })
            .addCase(generateBarcode.fulfilled, (state, action) => {
                state.isGeneratingBarcode = false;
                state.success = 'Barcode generated successfully';
                // The barcode will be set via the setBarcodeData reducer
            })
            .addCase(generateBarcode.rejected, (state, action) => {
                state.isGeneratingBarcode = false;
                state.error = action.payload;
            })

            // Generate Sticker PDF
            .addCase(generateStickerPDF.pending, (state) => {
                state.isGeneratingPDF = true;
                state.error = null;
            })
            .addCase(generateStickerPDF.fulfilled, (state, action) => {
                state.isGeneratingPDF = false;
                state.stickerPdfs.unshift(action.payload);
                state.success = 'Sticker PDF generated successfully';
            })
            .addCase(generateStickerPDF.rejected, (state, action) => {
                state.isGeneratingPDF = false;
                state.error = action.payload;
            })

            // Scan Barcode
            .addCase(scanBarcode.pending, (state) => {
                state.isScanning = true;
                state.error = null;
            })
            .addCase(scanBarcode.fulfilled, (state, action) => {
                state.isScanning = false;
                state.success = 'Barcode scanned successfully';
                state.addScannedItem = (item) => {
                    state.scanningHistory.unshift(item);
                    if (state.scanningHistory.length > 100) {
                        state.scanningHistory = state.scanningHistory.slice(0, 100);
                    }
                };
            })
            .addCase(scanBarcode.rejected, (state, action) => {
                state.isScanning = false;
                state.error = action.payload;
            })

            // Update Inventory
            .addCase(updateInventory.pending, (state) => {
                state.isUpdatingInventory = true;
                state.error = null;
            })
            .addCase(updateInventory.fulfilled, (state, action) => {
                state.isUpdatingInventory = false;
                const { sku, newStock } = action.payload;
                const item = state.inventoryItems.find(i => i.sku === sku);
                if (item) {
                    item.currentStock = newStock;
                    item.lastUpdated = new Date().toISOString();
                }
                state.success = 'Inventory updated successfully';
            })
            .addCase(updateInventory.rejected, (state, action) => {
                state.isUpdatingInventory = false;
                state.error = action.payload;
            })

            // Fetch Analytics
            .addCase(fetchInventoryAnalytics.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchInventoryAnalytics.fulfilled, (state, action) => {
                state.isLoading = false;
                state.analytics = action.payload;
            })
            .addCase(fetchInventoryAnalytics.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Export Data
            .addCase(exportInventoryData.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(exportInventoryData.fulfilled, (state, action) => {
                state.isLoading = false;
                state.exportData.unshift(action.payload);
                state.success = 'Inventory data exported successfully';
            })
            .addCase(exportInventoryData.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            });
    },
});

export const {
    clearError,
    clearSuccess,
    addSKU,
    updateSKU,
    removeSKU,
    setBarcodeData,
    addInventoryItem,
    updateInventoryItem,
    setFilters,
    clearFilters,
    addAlert,
    removeAlert,
    markAlertAsRead,
    addScannedItem,
    updateAnalytics,
    setPagination,
} = inventorySlice.actions;

export default inventorySlice.reducer;
