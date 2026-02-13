import axios, {
    AxiosError,
    AxiosResponse,
    InternalAxiosRequestConfig,
} from 'axios'

// Create axios instance
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Request interceptor for adding auth token
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // Guard for Next.js SSR/edge environments.
        if (typeof window !== 'undefined') {
            const token = window.localStorage.getItem('adminToken')
            if (token) {
                config.headers.Authorization = `Bearer ${token}`
            }
        }
        return config
    },
    (error: AxiosError) => {
        return Promise.reject(error)
    }
)

// Response interceptor for error handling
api.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
        // Handle specific error statuses
        if (typeof window !== 'undefined' && error.response?.status === 401) {
            // Redirect to login if unauthorized
            window.location.href = '/admin/login'
        }
        return Promise.reject(error)
    }
)

export const adminApi = {
    // Auth endpoints
    login: (credentials: { email: string; password: string }) =>
        api.post('/auth/login', credentials),
    me: () => api.get('/auth/me'),

    // Admin dashboard endpoints
    getDashboard: () => api.get('/admin/dashboard'),
    getPartitions: () => api.get('/admin/partitions'),
    getAuditLog: () => api.get('/admin/audit'),

    // Brand management endpoints
    getBrandApplications: () => api.get('/admin/brands/applications'),
    approveBrand: (applicationId: string) =>
        api.post(`/admin/brands/${applicationId}/approve`),
    rejectBrand: (applicationId: string, reason: string) =>
        api.post(`/admin/brands/${applicationId}/reject`, { reason }),
    listBrandRequests: (params?: { status?: string; page?: number; limit?: number }) =>
        api.get('/brand/requests', { params }),
    approveBrandRequest: (requestId: string, comments?: string) =>
        api.post(`/brand/requests/${requestId}/approve`, { comments }),
    rejectBrandRequest: (requestId: string, comments?: string) =>
        api.post(`/brand/requests/${requestId}/reject`, { comments }),

    // Inventory endpoints
    getInventory: () => api.get('/admin/inventory'),
    getInventoryAlerts: () => api.get('/admin/inventory/alerts'),

    // User management endpoints
    getUsers: () => api.get('/admin/users'),
    updateUserRole: (userId: string, role: string) =>
        api.put(`/admin/users/${userId}/role`, { role }),
    listUsers: (params?: { role?: string }) => api.get('/admin/users', { params }),

    // Bulk operations endpoints
    generateBarcodes: (count: number) =>
        api.post('/admin/bulk/barcodes', { count }),
    bulkCreateProducts: (products: Array<Record<string, unknown>>) =>
        api.post('/admin/bulk/products', { products }),

    // Orders endpoints
    getOrders: (params?: { status?: string }) => api.get('/admin/orders', { params }),
    updateOrderStatus: (orderId: string, status: string) =>
        api.post(`/admin/orders/${orderId}/status`, { status }),

    // Analytics endpoints
    getAnalytics: () => api.get('/admin/analytics'),

    // Settings endpoints
    getSettings: () => api.get('/admin/settings'),

    // Super-admin endpoints
    listAdmins: () => api.get('/admin/admins'),
    createAdmin: (payload: { email: string; password: string; firstName?: string; lastName?: string; partitions?: string[] }) =>
        api.post('/admin/admins', payload),
    updateAdmin: (adminId: string, payload: { partitions?: string[]; status?: string }) =>
        api.patch(`/admin/admins/${adminId}`, payload),

    // Extended operations coverage (user/seller management domains)
    getCategories: () => api.get('/categories'),
    getProducts: () => api.get('/products'),
    createProduct: (payload: Record<string, unknown>) => api.post('/products', payload),
    getVendorApplications: () => api.get('/vendors/applications'),
    approveVendorApplication: (id: string) => api.post(`/vendors/applications/${id}/approve`),
    rejectVendorApplication: (id: string) => api.post(`/vendors/applications/${id}/reject`),
    getReturns: () => api.get('/returns'),
    updateReturnStatus: (id: string, status: string) => api.patch(`/returns/${id}/status`, { status }),
    getReviews: () => api.get('/reviews'),
    moderateReview: (id: string, action: 'approve' | 'reject') => api.patch(`/reviews/${id}/moderate`, { action }),
    getSupportTickets: () => api.get('/support/tickets'),
    updateSupportTicketStatus: (id: string, status: string) => api.patch(`/support/tickets/${id}/status`, { status }),
    assignSupportTicket: (id: string, assigneeId: string) => api.post(`/support/tickets/${id}/assign`, { assigneeId }),
    getOffers: (params?: { status?: string }) => api.get('/offers', { params }),
    respondOffer: (offerId: string, action: 'accept' | 'reject', message?: string) =>
        api.put(`/offers/${offerId}/respond`, { action, message }),
    getNotifications: () => api.get('/notifications'),
    sendTestNotification: (payload: { title: string; message: string; channels?: string[] }) =>
        api.post('/notifications/test', payload),
    getConversations: () => api.get('/chat/conversations'),
    getContentHome: () => api.get('/content/home'),
    getSystemHealth: () => api.get('/system/health'),
    getSystemStats: () => api.get('/system/stats'),
    getSystemEvents: () => api.get('/system/events'),
    getMarketingCampaigns: () => api.get('/marketing/campaigns'),
    getMarketingAnalytics: () => api.get('/marketing/analytics'),
}

export default api
