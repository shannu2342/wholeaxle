import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// KYC Verification types
const KYC_TYPES = {
    INDIVIDUAL: 'individual',
    BUSINESS: 'business',
    VENDOR: 'vendor'
};

// Verification status
const VERIFICATION_STATUS = {
    PENDING: 'pending',
    VERIFIED: 'verified',
    REJECTED: 'rejected',
    EXPIRED: 'expired',
    UNDER_REVIEW: 'under_review'
};

// Async thunks
export const submitKYCVerification = createAsyncThunk(
    'userProfiles/submitKYC',
    async ({ userId, kycData, documents }, { rejectWithValue }) => {
        try {
            // Mock KYC submission
            const verificationRequest = {
                id: `kyc_${Date.now()}`,
                userId,
                type: kycData.type,
                status: VERIFICATION_STATUS.PENDING,
                submittedAt: new Date().toISOString(),
                documents: documents.map(doc => ({
                    id: `doc_${Date.now()}_${Math.random()}`,
                    type: doc.type,
                    name: doc.name,
                    url: doc.url,
                    status: 'uploaded',
                    uploadedAt: new Date().toISOString()
                })),
                data: kycData,
                verificationSteps: [
                    { step: 'document_upload', completed: true, completedAt: new Date().toISOString() },
                    { step: 'identity_verification', completed: false },
                    { step: 'address_verification', completed: false },
                    { step: 'business_verification', completed: false },
                    { step: 'final_review', completed: false }
                ]
            };

            return verificationRequest;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const updateUserProfile = createAsyncThunk(
    'userProfiles/updateProfile',
    async ({ userId, profileData }, { rejectWithValue }) => {
        try {
            // Mock API call
            const updatedProfile = {
                id: userId,
                ...profileData,
                updatedAt: new Date().toISOString(),
                completeness: calculateProfileCompleteness(profileData)
            };

            return updatedProfile;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const uploadProfileDocument = createAsyncThunk(
    'userProfiles/uploadDocument',
    async ({ userId, documentType, file, metadata }, { rejectWithValue }) => {
        try {
            // Mock document upload
            const document = {
                id: `doc_${Date.now()}`,
                userId,
                type: documentType,
                name: file.name,
                size: file.size,
                url: `https://storage.example.com/documents/${userId}/${file.name}`,
                status: 'uploaded',
                uploadedAt: new Date().toISOString(),
                metadata: metadata || {}
            };

            return document;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const getUserProfile = createAsyncThunk(
    'userProfiles/getProfile',
    async ({ userId }, { rejectWithValue }) => {
        try {
            // Mock user profile
            const profile = {
                id: userId,
                personalInfo: {
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john.doe@example.com',
                    phone: '+91 9876543210',
                    dateOfBirth: '1990-01-01',
                    gender: 'male',
                    maritalStatus: 'single'
                },
                address: {
                    street: '123 Main Street',
                    city: 'Mumbai',
                    state: 'Maharashtra',
                    pincode: '400001',
                    country: 'India'
                },
                businessInfo: {
                    businessName: 'John Enterprises',
                    businessType: 'proprietorship',
                    gstNumber: '27ABCDE1234F1Z5',
                    panNumber: 'ABCDE1234F',
                    businessAddress: {
                        street: '456 Business Ave',
                        city: 'Mumbai',
                        state: 'Maharashtra',
                        pincode: '400002'
                    },
                    bankDetails: {
                        accountNumber: '1234567890',
                        ifscCode: 'SBIN0001234',
                        bankName: 'State Bank of India',
                        accountHolderName: 'John Doe'
                    }
                },
                kyc: {
                    status: VERIFICATION_STATUS.VERIFIED,
                    verifiedAt: '2025-12-01T10:00:00.000Z',
                    documents: [
                        { type: 'pan_card', url: 'https://storage.example.com/pan_card.pdf', status: 'verified' },
                        { type: 'aadhar_card', url: 'https://storage.example.com/aadhar_card.pdf', status: 'verified' },
                        { type: 'address_proof', url: 'https://storage.example.com/address_proof.pdf', status: 'verified' }
                    ]
                },
                preferences: {
                    language: 'en',
                    currency: 'INR',
                    timezone: 'Asia/Kolkata',
                    theme: 'light',
                    notifications: {
                        email: true,
                        sms: true,
                        push: true,
                        whatsapp: false
                    }
                },
                statistics: {
                    totalOrders: 156,
                    totalSpent: 125000,
                    averageOrderValue: 801,
                    memberSince: '2024-01-15',
                    lastActiveAt: new Date().toISOString()
                },
                badges: [
                    { id: 'early_bird', name: 'Early Bird', description: 'Joined in the first month', earnedAt: '2024-01-15T00:00:00.000Z' },
                    { id: 'frequent_buyer', name: 'Frequent Buyer', description: 'Made 100+ orders', earnedAt: '2025-06-15T00:00:00.000Z' }
                ],
                completeness: 95
            };

            return profile;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const verifyDocument = createAsyncThunk(
    'userProfiles/verifyDocument',
    async ({ documentId, verificationData }, { rejectWithValue }) => {
        try {
            // Mock document verification
            const verification = {
                documentId,
                status: VERIFICATION_STATUS.VERIFIED,
                verifiedBy: 'system',
                verifiedAt: new Date().toISOString(),
                confidence: 0.95,
                extractedData: verificationData.extractedData || {},
                notes: 'Document verified successfully'
            };

            return verification;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const initialState = {
    profiles: {}, // { userId: profileData }
    kycRequests: {}, // { userId: kycData }
    documents: {}, // { userId: [documents] }
    verificationHistory: {}, // { userId: [verification records] }
    isLoading: false,
    error: null,
    profileCompleteness: {
        basic: 20, // Name, email, phone
        personal: 40, // DOB, gender, address
        business: 70, // Business info, documents
        verified: 100 // KYC completed
    }
};

// Helper function to calculate profile completeness
const calculateProfileCompleteness = (profileData) => {
    let completeness = 0;

    // Basic info (20%)
    if (profileData.firstName && profileData.lastName) completeness += 10;
    if (profileData.email) completeness += 5;
    if (profileData.phone) completeness += 5;

    // Personal info (20%)
    if (profileData.dateOfBirth) completeness += 5;
    if (profileData.gender) completeness += 5;
    if (profileData.address) completeness += 10;

    // Business info (30%)
    if (profileData.businessInfo?.businessName) completeness += 10;
    if (profileData.businessInfo?.gstNumber) completeness += 10;
    if (profileData.businessInfo?.panNumber) completeness += 10;

    // KYC verification (30%)
    if (profileData.kyc?.status === VERIFICATION_STATUS.VERIFIED) {
        completeness += 30;
    }

    return Math.min(completeness, 100);
};

const userProfilesSlice = createSlice({
    name: 'userProfiles',
    initialState,
    reducers: {
        updatePersonalInfo: (state, action) => {
            const { userId, data } = action.payload;
            if (state.profiles[userId]) {
                state.profiles[userId].personalInfo = {
                    ...state.profiles[userId].personalInfo,
                    ...data
                };
                state.profiles[userId].completeness = calculateProfileCompleteness(state.profiles[userId]);
            }
        },

        updateAddress: (state, action) => {
            const { userId, address } = action.payload;
            if (state.profiles[userId]) {
                state.profiles[userId].address = { ...address };
                state.profiles[userId].completeness = calculateProfileCompleteness(state.profiles[userId]);
            }
        },

        updateBusinessInfo: (state, action) => {
            const { userId, businessData } = action.payload;
            if (state.profiles[userId]) {
                state.profiles[userId].businessInfo = {
                    ...state.profiles[userId].businessInfo,
                    ...businessData
                };
                state.profiles[userId].completeness = calculateProfileCompleteness(state.profiles[userId]);
            }
        },

        updatePreferences: (state, action) => {
            const { userId, preferences } = action.payload;
            if (state.profiles[userId]) {
                state.profiles[userId].preferences = {
                    ...state.profiles[userId].preferences,
                    ...preferences
                };
            }
        },

        addBadge: (state, action) => {
            const { userId, badge } = action.payload;
            if (state.profiles[userId]) {
                if (!state.profiles[userId].badges) {
                    state.profiles[userId].badges = [];
                }
                state.profiles[userId].badges.push({
                    ...badge,
                    earnedAt: new Date().toISOString()
                });
            }
        },

        removeBadge: (state, action) => {
            const { userId, badgeId } = action.payload;
            if (state.profiles[userId]?.badges) {
                state.profiles[userId].badges = state.profiles[userId].badges.filter(
                    badge => badge.id !== badgeId
                );
            }
        },

        updateKYCStatus: (state, action) => {
            const { userId, status, notes } = action.payload;
            if (state.profiles[userId]) {
                state.profiles[userId].kyc.status = status;
                if (status === VERIFICATION_STATUS.VERIFIED) {
                    state.profiles[userId].kyc.verifiedAt = new Date().toISOString();
                }
                state.profiles[userId].kyc.notes = notes;
                state.profiles[userId].completeness = calculateProfileCompleteness(state.profiles[userId]);
            }
        },

        addDocument: (state, action) => {
            const { userId, document } = action.payload;
            if (!state.documents[userId]) {
                state.documents[userId] = [];
            }
            state.documents[userId].push(document);
        },

        removeDocument: (state, action) => {
            const { userId, documentId } = action.payload;
            if (state.documents[userId]) {
                state.documents[userId] = state.documents[userId].filter(
                    doc => doc.id !== documentId
                );
            }
        },

        updateDocumentStatus: (state, action) => {
            const { userId, documentId, status } = action.payload;
            if (state.documents[userId]) {
                const document = state.documents[userId].find(doc => doc.id === documentId);
                if (document) {
                    document.status = status;
                }
            }
        },

        clearError: (state) => {
            state.error = null;
        }
    },

    extraReducers: (builder) => {
        builder
            // Submit KYC
            .addCase(submitKYCVerification.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(submitKYCVerification.fulfilled, (state, action) => {
                state.isLoading = false;
                const kycRequest = action.payload;
                state.kycRequests[kycRequest.userId] = kycRequest;
            })
            .addCase(submitKYCVerification.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Update profile
            .addCase(updateUserProfile.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(updateUserProfile.fulfilled, (state, action) => {
                state.isLoading = false;
                const updatedProfile = action.payload;
                state.profiles[updatedProfile.id] = updatedProfile;
            })
            .addCase(updateUserProfile.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Upload document
            .addCase(uploadProfileDocument.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(uploadProfileDocument.fulfilled, (state, action) => {
                state.isLoading = false;
                const document = action.payload;
                if (!state.documents[document.userId]) {
                    state.documents[document.userId] = [];
                }
                state.documents[document.userId].push(document);
            })
            .addCase(uploadProfileDocument.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Get profile
            .addCase(getUserProfile.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getUserProfile.fulfilled, (state, action) => {
                state.isLoading = false;
                const profile = action.payload;
                state.profiles[profile.id] = profile;
            })
            .addCase(getUserProfile.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Verify document
            .addCase(verifyDocument.fulfilled, (state, action) => {
                const verification = action.payload;
                // Update document status based on verification
                Object.keys(state.documents).forEach(userId => {
                    const document = state.documents[userId].find(doc => doc.id === verification.documentId);
                    if (document) {
                        document.status = verification.status;
                        document.verifiedAt = verification.verifiedAt;
                    }
                });
            });
    }
});

export const {
    updatePersonalInfo,
    updateAddress,
    updateBusinessInfo,
    updatePreferences,
    addBadge,
    removeBadge,
    updateKYCStatus,
    addDocument,
    removeDocument,
    updateDocumentStatus,
    clearError
} = userProfilesSlice.actions;

export default userProfilesSlice.reducer;