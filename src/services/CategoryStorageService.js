import SafeStorage from './SafeStorage';
import { BUSINESS_CATEGORIES, getCategoryById } from '../constants/Categories';

// Storage keys
const PREFERRED_CATEGORY_KEY = 'preferred_category_id';
const CATEGORY_SELECTION_COMPLETED_KEY = 'category_selection_completed';

// Category Storage Service
class CategoryStorageService {

    /**
     * Save preferred category to AsyncStorage
     * @param {string} categoryId - The ID of the selected category
     */
    async savePreferredCategory(categoryId) {
        try {
            await SafeStorage.setItem(PREFERRED_CATEGORY_KEY, categoryId);
            console.log('Category preference saved to AsyncStorage:', categoryId);
            return true;
        } catch (error) {
            console.error('Error saving category preference to AsyncStorage:', error);
            throw error;
        }
    }

    /**
     * Get preferred category from AsyncStorage
     * @returns {Promise<string|null>} - The category ID or null if not found
     */
    async getPreferredCategory() {
        try {
            const categoryId = await SafeStorage.getItem(PREFERRED_CATEGORY_KEY);
            console.log('Retrieved category preference from AsyncStorage:', categoryId);
            return categoryId;
        } catch (error) {
            console.error('Error retrieving category preference from AsyncStorage:', error);
            return null;
        }
    }

    /**
     * Get preferred category details (including metadata)
     * @returns {Promise<Object|null>} - The category object or null if not found
     */
    async getPreferredCategoryDetails() {
        try {
            const categoryId = await this.getPreferredCategory();
            if (categoryId) {
                return getCategoryById(categoryId);
            }
            return null;
        } catch (error) {
            console.error('Error getting preferred category details:', error);
            return null;
        }
    }

    /**
     * Remove preferred category from AsyncStorage
     */
    async removePreferredCategory() {
        try {
            await SafeStorage.removeItem(PREFERRED_CATEGORY_KEY);
            console.log('Category preference removed from AsyncStorage');
            return true;
        } catch (error) {
            console.error('Error removing category preference from AsyncStorage:', error);
            throw error;
        }
    }

    /**
     * Mark category selection as completed
     */
    async markCategorySelectionCompleted() {
        try {
            await SafeStorage.setItem(CATEGORY_SELECTION_COMPLETED_KEY, 'true');
            console.log('Category selection marked as completed');
            return true;
        } catch (error) {
            console.error('Error marking category selection as completed:', error);
            throw error;
        }
    }

    /**
     * Check if category selection has been completed
     * @returns {Promise<boolean>} - Whether category selection is completed
     */
    async isCategorySelectionCompleted() {
        try {
            const value = await SafeStorage.getItem(CATEGORY_SELECTION_COMPLETED_KEY);
            return value === 'true';
        } catch (error) {
            console.error('Error checking category selection status:', error);
            return false;
        }
    }

    /**
     * Clear all category-related data
     */
    async clearCategoryData() {
        try {
            await SafeStorage.multiRemove([
                PREFERRED_CATEGORY_KEY,
                CATEGORY_SELECTION_COMPLETED_KEY
            ]);
            console.log('All category data cleared from AsyncStorage');
            return true;
        } catch (error) {
            console.error('Error clearing category data:', error);
            throw error;
        }
    }

    /**
     * Save category preference to backend (PHP)
     * @param {string} categoryId - The category ID to save
     * @param {string} userId - The user ID (from auth context)
     */
    async savePreferredCategoryToBackend(categoryId, userId) {
        try {
            // TODO: Replace with actual backend API endpoint
            const apiEndpoint = 'https://api.wholexale.com/v1/user/category-preference';

            console.log('Attempting to save category preference to backend:', { categoryId, userId });

            // Check if we have a valid user ID
            if (!userId) {
                console.warn('Cannot save category preference: User ID not available');
                return null;
            }

            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await this.getAuthToken()}`,
                },
                body: JSON.stringify({
                    user_id: userId,
                    preferred_category_id: categoryId,
                    timestamp: new Date().toISOString(),
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Category preference saved to backend:', result);
            return result;
        } catch (error) {
            console.error('Error saving category preference to backend:', error);
            // Don't throw error for backend failures - local storage should be primary
            return null;
        }
    }

    /**
     * Get category preference from backend
     * @param {string} userId - The user ID
     * @returns {Promise<Object|null>} - The category preference from backend
     */
    async getPreferredCategoryFromBackend(userId) {
        try {
            // TODO: Replace with actual backend API endpoint
            const apiEndpoint = `https://api.wholexale.com/v1/user/category-preference/${userId}`;

            const response = await fetch(apiEndpoint, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await this.getAuthToken()}`,
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Retrieved category preference from backend:', result);
            return result;
        } catch (error) {
            console.error('Error getting category preference from backend:', error);
            return null;
        }
    }

    /**
     * Sync category preference between local storage and backend
     * @param {string} userId - The user ID
     */
    async syncCategoryPreference(userId) {
        try {
            // Get local preference
            const localCategoryId = await this.getPreferredCategory();

            // Get backend preference
            const backendData = await this.getPreferredCategoryFromBackend(userId);
            const backendCategoryId = backendData?.preferred_category_id;

            // If both exist and are different, prefer backend (authoritative)
            if (backendCategoryId && localCategoryId !== backendCategoryId) {
                await this.savePreferredCategory(backendCategoryId);
                console.log('Synced category preference from backend:', backendCategoryId);
                return getCategoryById(backendCategoryId);
            }

            // If only local exists, sync to backend
            if (localCategoryId && !backendCategoryId) {
                await this.savePreferredCategoryToBackend(localCategoryId, userId);
                console.log('Synced category preference to backend:', localCategoryId);
            }

            // Return current preference
            const currentCategoryId = localCategoryId || backendCategoryId;
            return currentCategoryId ? getCategoryById(currentCategoryId) : null;
        } catch (error) {
            console.error('Error syncing category preference:', error);
            return null;
        }
    }

    /**
     * Get authentication token (placeholder - implement based on your auth system)
     * @returns {Promise<string>} - The auth token
     */
    async getAuthToken() {
        try {
            // TODO: Implement based on your authentication system
            // This could get token from AsyncStorage, Redux store, or secure storage
            const token = await SafeStorage.getItem('auth_token');
            return token || '';
        } catch (error) {
            console.error('Error getting auth token:', error);
            return '';
        }
    }

    /**
     * Check if user should see category selection screen
     * @param {boolean} isFirstTime - Whether this is a first-time user
     * @returns {Promise<Object>} - Object with shouldShow and reason
     */
    async shouldShowCategorySelection(isFirstTime = false) {
        try {
            const isCompleted = await this.isCategorySelectionCompleted();
            const hasPreference = await this.getPreferredCategory();

            // First-time users should always see category selection
            if (isFirstTime) {
                return {
                    shouldShow: true,
                    reason: 'first_time_user'
                };
            }

            // If category selection not completed or no preference saved
            if (!isCompleted || !hasPreference) {
                return {
                    shouldShow: true,
                    reason: 'incomplete_setup'
                };
            }

            return {
                shouldShow: false,
                reason: 'setup_complete'
            };
        } catch (error) {
            console.error('Error checking category selection requirement:', error);
            // Default to showing selection on error
            return {
                shouldShow: true,
                reason: 'error_default'
            };
        }
    }
}

export default new CategoryStorageService();
