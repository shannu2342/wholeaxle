// API Configuration
const LOCAL_API_URL = 'http://localhost:8000';
const PROD_API_URL = 'https://api.wholexale.com';

export const API_BASE_URL = __DEV__ || global.__USE_LOCAL_API__
    ? LOCAL_API_URL // Local/Dev API URL
    : PROD_API_URL; // Production API URL

// Socket.io Configuration
export const SOCKET_URL = __DEV__ || global.__USE_LOCAL_API__
    ? LOCAL_API_URL
    : PROD_API_URL;

// Chat API Endpoints
export const CHAT_ENDPOINTS = {
    CONVERSATIONS: '/chat/conversations',
    MESSAGES: '/chat/messages',
    SEND_MESSAGE: '/chat/messages',
    MARK_READ: '/chat/messages/read',
    SEARCH: '/chat/search',
    OFFERS: '/chat/offers',
    SUPPORT: '/chat/support',
};

// Upload Configuration
export const UPLOAD_CONFIG = {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
    ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
};

// Pagination
export const PAGINATION = {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
};

// Timeouts
export const TIMEOUTS = {
    REQUEST: 30000, // 30 seconds
    SOCKET: 60000,  // 60 seconds
};

// Real-time Events
export const SOCKET_EVENTS = {
    // Connection events
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',
    ERROR: 'error',

    // Chat events
    JOIN_CHAT: 'join_chat',
    LEAVE_CHAT: 'leave_chat',
    SEND_MESSAGE: 'send_message',
    NEW_MESSAGE: 'new_message',
    TYPING: 'typing',
    USER_TYPING: 'user_typing',
    MESSAGE_STATUS: 'message_status',

    // User status events
    USER_ONLINE: 'user_online',
    USER_OFFLINE: 'user_offline',

    // Offer events
    OFFER_RECEIVED: 'offer_received',
    OFFER_SENT: 'offer_sent',
    OFFER_ACCEPTED: 'offer_accepted',
    OFFER_REJECTED: 'offer_rejected',

    // Support events
    SUPPORT_MESSAGE: 'support_message',
    SUPPORT_ASSIGNED: 'support_assigned',
    SUPPORT_RESOLVED: 'support_resolved',
};

// Chat Types
export const CHAT_TYPES = {
    DIRECT: 'direct',
    GROUP: 'group',
    SUPPORT: 'support',
    BROADCAST: 'broadcast',
};

// Message Types
export const MESSAGE_TYPES = {
    TEXT: 'text',
    IMAGE: 'image',
    DOCUMENT: 'document',
    AUDIO: 'audio',
    VIDEO: 'video',
    LOCATION: 'location',
    CONTACT: 'contact',
    OFFER: 'offer',
    PRODUCT: 'product',
    ORDER: 'order',
    SYSTEM: 'system',
};

// Message Status
export const MESSAGE_STATUS = {
    SENDING: 'sending',
    SENT: 'sent',
    DELIVERED: 'delivered',
    READ: 'read',
    FAILED: 'failed',
};

// Offer Status
export const OFFER_STATUS = {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected',
    EXPIRED: 'expired',
    CANCELLED: 'cancelled',
};

// Support Status
export const SUPPORT_STATUS = {
    OPEN: 'open',
    IN_PROGRESS: 'in_progress',
    WAITING: 'waiting',
    RESOLVED: 'resolved',
    CLOSED: 'closed',
};

// Filter Options
export const CHAT_FILTERS = {
    ALL: 'All',
    UNREAD: 'Unread',
    OFFERS_RECEIVED: 'Offers Received',
    OFFERS_SENT: 'Offers Sent',
    DEALS_CLOSED: 'Deals Closed',
    SUPPORT: 'Support',
    ARCHIVED: 'Archived',
};

// Chat Notification Settings
export const NOTIFICATION_SETTINGS = {
    NEW_MESSAGE: 'new_message',
    NEW_OFFER: 'new_offer',
    OFFER_ACCEPTED: 'offer_accepted',
    OFFER_REJECTED: 'offer_rejected',
    SUPPORT_ASSIGNED: 'support_assigned',
    SUPPORT_RESOLVED: 'support_resolved',
};

// Error Codes
export const ERROR_CODES = {
    NETWORK_ERROR: 'NETWORK_ERROR',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    SERVER_ERROR: 'SERVER_ERROR',
    SOCKET_ERROR: 'SOCKET_ERROR',
};

// Validation Rules
export const VALIDATION_RULES = {
    MESSAGE_MAX_LENGTH: 4000,
    SEARCH_MIN_LENGTH: 2,
    SEARCH_MAX_LENGTH: 100,
    MAX_FILE_ATTACHMENTS: 10,
    MAX_OFFER_ITEMS: 50,
};

// Feature Flags
export const FEATURE_FLAGS = {
    REAL_TIME_MESSAGING: true,
    FILE_SHARING: true,
    VOICE_MESSAGES: false,
    VIDEO_CALLS: false,
    SCREEN_SHARING: false,
    END_TO_END_ENCRYPTION: false,
    THIRD_PARTY_INTEGRATIONS: true,
    AI_ASSISTANT: true,
    TRANSCRIPTION: false,
    TRANSLATION: false,
};
