import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getAIService } from '../../ai';
import { apiRequest } from '../../services/apiClient';

// Initialize AI Services
export const initializeAI = createAsyncThunk(
    'ai/initializeAI',
    async (_, { rejectWithValue }) => {
        try {
            const aiService = getAIService();
            const success = await aiService.initialize();

            if (!success) {
                throw new Error('Failed to initialize AI services');
            }

            return { initialized: true, initializedAt: new Date().toISOString() };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Async thunks for AI services
export const scanImageForCompliance = createAsyncThunk(
    'ai/scanImageForCompliance',
    async ({ imageUri, imageType }, { rejectWithValue }) => {
        try {
            const aiService = getAIService();

            const scanOptions = {
                detectInappropriateContent: true,
                detectBrandLogos: true,
                detectWatermarks: true,
                strictnessLevel: 'medium'
            };

            const result = await aiService.scanImageCompliance(imageUri, scanOptions);

            return {
                ...result,
                processedAt: new Date().toISOString(),
                imageUri,
                imageType
            };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const generateProductImage = createAsyncThunk(
    'ai/generateProductImage',
    async ({
        originalImage,
        style,
        background,
        model,
        settings
    }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/ai/generate', {
                method: 'POST',
                token,
                body: { originalImage, style, background, model, settings },
            });
            return response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const bulkGenerateImages = createAsyncThunk(
    'ai/bulkGenerateImages',
    async ({ images, themePreset }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/ai/bulk', {
                method: 'POST',
                token,
                body: { images, themePreset },
            });
            return response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const analyzeImageSimilarity = createAsyncThunk(
    'ai/analyzeImageSimilarity',
    async ({ queryImage, catalogImages }, { rejectWithValue }) => {
        try {
            const aiService = getAIService();

            const searchOptions = {
                maxResults: 20,
                similarityThreshold: 0.7,
                includeFeatures: true
            };

            const result = await aiService.findSimilarProducts(queryImage, catalogImages, searchOptions);

            return {
                ...result,
                queryImage,
                processedAt: new Date().toISOString()
            };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const extractImageFeatures = createAsyncThunk(
    'ai/extractImageFeatures',
    async ({ imageUri, options = {} }, { rejectWithValue }) => {
        try {
            const aiService = getAIService();

            const extractionOptions = {
                includeColor: true,
                includeTexture: true,
                includeShape: true,
                ...options
            };

            const features = await aiService.extractFeatures(imageUri, extractionOptions);

            return {
                imageUri,
                features,
                extractedAt: new Date().toISOString()
            };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const processImagesInBackground = createAsyncThunk(
    'ai/processImagesInBackground',
    async ({ imageSources, operation, options = {} }, { rejectWithValue }) => {
        try {
            const aiService = getAIService();

            const jobId = await aiService.processImagesInBackground(imageSources, operation, options);

            return {
                jobId,
                imageSources,
                operation,
                options,
                submittedAt: new Date().toISOString()
            };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const getProcessingStatus = createAsyncThunk(
    'ai/getProcessingStatus',
    async ({ jobId }, { rejectWithValue }) => {
        try {
            const aiService = getAIService();

            const status = await aiService.getProcessingStatus(jobId);

            return {
                jobId,
                status,
                checkedAt: new Date().toISOString()
            };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const initialState = {
    // AI Service Status
    isInitialized: false,
    initializationError: null,

    // Image Compliance
    complianceScans: [],
    scanResults: {},
    complianceSettings: {
        blockInappropriateContent: true,
        detectUnauthorizedBrands: true,
        detectWatermarks: true,
        strictnessLevel: 'medium', // 'low' | 'medium' | 'high'
    },

    // Feature Extraction
    extractedFeatures: {},

    // Background Processing
    backgroundJobs: {},
    activeJobs: [],

    // AI Image Generation
    imageGeneration: {
        queue: [],
        processing: [],
        completed: [],
        failed: [],
        themePresets: [
            {
                id: 'outdoor_garden',
                name: 'Outdoor Garden Shoot',
                description: 'Natural outdoor setting with garden background',
                defaultSettings: {
                    background: 'garden',
                    lighting: 'natural',
                    style: 'realistic'
                }
            },
            {
                id: 'studio_professional',
                name: 'Studio Professional',
                description: 'Clean white background with professional lighting',
                defaultSettings: {
                    background: 'white_studio',
                    lighting: 'professional',
                    style: 'clean'
                }
            },
            {
                id: 'lifestyle_casual',
                name: 'Lifestyle Casual',
                description: 'Casual lifestyle setting with natural poses',
                defaultSettings: {
                    background: 'lifestyle',
                    lighting: 'soft',
                    style: 'casual'
                }
            }
        ],
    },

    // Visual Search
    visualSearch: {
        recentSearches: [],
        searchResults: [],
        isSearching: false,
        similarityThreshold: 0.7,
    },

    // Processing Status
    isProcessing: false,
    processingProgress: 0,
    error: null,
    lastProcessedAt: null,
};

const aiSlice = createSlice({
    name: 'ai',
    initialState,
    reducers: {
        updateComplianceSettings: (state, action) => {
            state.complianceSettings = { ...state.complianceSettings, ...action.payload };
        },

        addComplianceScan: (state, action) => {
            state.complianceScans.unshift(action.payload);
        },

        updateScanResult: (state, action) => {
            const { scanId, result } = action.payload;
            state.scanResults[scanId] = result;
        },

        addExtractedFeatures: (state, action) => {
            const { imageUri, features } = action.payload;
            state.extractedFeatures[imageUri] = features;
        },

        addBackgroundJob: (state, action) => {
            const { jobId, ...jobData } = action.payload;
            state.backgroundJobs[jobId] = jobData;
            state.activeJobs.unshift(jobId);
        },

        updateJobStatus: (state, action) => {
            const { jobId, status } = action.payload;
            if (state.backgroundJobs[jobId]) {
                state.backgroundJobs[jobId].status = status;
                state.backgroundJobs[jobId].updatedAt = new Date().toISOString();
            }
        },

        removeJob: (state, action) => {
            const jobId = action.payload;
            delete state.backgroundJobs[jobId];
            state.activeJobs = state.activeJobs.filter(id => id !== jobId);
        },

        setInitializationError: (state, action) => {
            state.initializationError = action.payload;
        },

        addToGenerationQueue: (state, action) => {
            state.imageGeneration.queue.push(action.payload);
        },

        updateGenerationStatus: (state, action) => {
            const { jobId, status, progress } = action.payload;
            const job = state.imageGeneration.queue.find(j => j.id === jobId);
            if (job) {
                job.status = status;
                job.progress = progress;
            }
        },

        moveToProcessing: (state, action) => {
            const job = state.imageGeneration.queue.find(j => j.id === action.payload);
            if (job) {
                state.imageGeneration.processing.push(job);
                state.imageGeneration.queue = state.imageGeneration.queue.filter(j => j.id !== action.payload);
            }
        },

        moveToCompleted: (state, action) => {
            const job = state.imageGeneration.processing.find(j => j.id === action.payload);
            if (job) {
                state.imageGeneration.completed.push(job);
                state.imageGeneration.processing = state.imageGeneration.processing.filter(j => j.id !== action.payload);
            }
        },

        addVisualSearchResult: (state, action) => {
            state.visualSearch.searchResults = action.payload;
            state.visualSearch.recentSearches.unshift({
                id: Date.now(),
                queryImage: action.payload.queryImage,
                timestamp: new Date().toISOString(),
                resultCount: action.payload.similarProducts.length,
            });
            // Keep only last 10 searches
            state.visualSearch.recentSearches = state.visualSearch.recentSearches.slice(0, 10);
        },

        clearVisualSearchResults: (state) => {
            state.visualSearch.searchResults = [];
        },

        updateProcessingProgress: (state, action) => {
            state.processingProgress = action.payload;
        },

        clearError: (state) => {
            state.error = null;
        },
    },

    extraReducers: (builder) => {
        builder
            // Image Compliance Scan
            .addCase(scanImageForCompliance.pending, (state) => {
                state.isProcessing = true;
                state.error = null;
            })
            .addCase(scanImageForCompliance.fulfilled, (state, action) => {
                state.isProcessing = false;
                const scanId = 'scan_' + Date.now();
                state.complianceScans.unshift({
                    id: scanId,
                    ...action.payload,
                    scannedAt: new Date().toISOString(),
                });
                state.scanResults[scanId] = action.payload;
                state.lastProcessedAt = new Date().toISOString();
            })
            .addCase(scanImageForCompliance.rejected, (state, action) => {
                state.isProcessing = false;
                state.error = action.payload;
            })

            // Single Image Generation
            .addCase(generateProductImage.pending, (state) => {
                state.isProcessing = true;
                state.error = null;
            })
            .addCase(generateProductImage.fulfilled, (state, action) => {
                state.isProcessing = false;
                state.imageGeneration.completed.unshift(action.payload);
                state.lastProcessedAt = new Date().toISOString();
            })
            .addCase(generateProductImage.rejected, (state, action) => {
                state.isProcessing = false;
                state.error = action.payload;
            })

            // Bulk Image Generation
            .addCase(bulkGenerateImages.pending, (state) => {
                state.isProcessing = true;
                state.error = null;
            })
            .addCase(bulkGenerateImages.fulfilled, (state, action) => {
                state.isProcessing = false;
                state.imageGeneration.queue.unshift(action.payload);
                state.lastProcessedAt = new Date().toISOString();
            })
            .addCase(bulkGenerateImages.rejected, (state, action) => {
                state.isProcessing = false;
                state.error = action.payload;
            })

            // Visual Search
            .addCase(analyzeImageSimilarity.pending, (state) => {
                state.visualSearch.isSearching = true;
                state.error = null;
            })
            .addCase(analyzeImageSimilarity.fulfilled, (state, action) => {
                state.visualSearch.isSearching = false;
                state.visualSearch.searchResults = action.payload;
                state.visualSearch.recentSearches.unshift({
                    id: Date.now(),
                    queryImage: action.payload.queryImage,
                    timestamp: new Date().toISOString(),
                    resultCount: action.payload.similarProducts.length,
                });
                state.lastProcessedAt = new Date().toISOString();
            })
            .addCase(analyzeImageSimilarity.rejected, (state, action) => {
                state.visualSearch.isSearching = false;
                state.error = action.payload;
            })

            // AI Service Initialization
            .addCase(initializeAI.pending, (state) => {
                state.isProcessing = true;
                state.initializationError = null;
            })
            .addCase(initializeAI.fulfilled, (state, action) => {
                state.isProcessing = false;
                state.isInitialized = true;
                state.initializationError = null;
                state.lastProcessedAt = action.payload.initializedAt;
            })
            .addCase(initializeAI.rejected, (state, action) => {
                state.isProcessing = false;
                state.isInitialized = false;
                state.initializationError = action.payload;
            })

            // Feature Extraction
            .addCase(extractImageFeatures.pending, (state) => {
                state.isProcessing = true;
                state.error = null;
            })
            .addCase(extractImageFeatures.fulfilled, (state, action) => {
                state.isProcessing = false;
                const { imageUri, features } = action.payload;
                state.extractedFeatures[imageUri] = features;
                state.lastProcessedAt = action.payload.extractedAt;
            })
            .addCase(extractImageFeatures.rejected, (state, action) => {
                state.isProcessing = false;
                state.error = action.payload;
            })

            // Background Processing
            .addCase(processImagesInBackground.pending, (state) => {
                state.isProcessing = true;
                state.error = null;
            })
            .addCase(processImagesInBackground.fulfilled, (state, action) => {
                state.isProcessing = false;
                const { jobId, ...jobData } = action.payload;
                state.backgroundJobs[jobId] = { ...jobData, status: 'pending' };
                state.activeJobs.unshift(jobId);
                state.lastProcessedAt = action.payload.submittedAt;
            })
            .addCase(processImagesInBackground.rejected, (state, action) => {
                state.isProcessing = false;
                state.error = action.payload;
            })

            // Processing Status
            .addCase(getProcessingStatus.fulfilled, (state, action) => {
                const { jobId, status } = action.payload;
                if (state.backgroundJobs[jobId]) {
                    state.backgroundJobs[jobId].status = status;
                    state.backgroundJobs[jobId].updatedAt = action.payload.checkedAt;

                    // Remove completed jobs from active list
                    if (status === 'completed' || status === 'failed') {
                        state.activeJobs = state.activeJobs.filter(id => id !== jobId);
                    }
                }
            });
    },
});

export const {
    updateComplianceSettings,
    addComplianceScan,
    updateScanResult,
    addToGenerationQueue,
    updateGenerationStatus,
    moveToProcessing,
    moveToCompleted,
    addVisualSearchResult,
    clearVisualSearchResults,
    updateProcessingProgress,
    clearError,
    addExtractedFeatures,
    addBackgroundJob,
    updateJobStatus,
    removeJob,
    setInitializationError,
} = aiSlice.actions;

export default aiSlice.reducer;
