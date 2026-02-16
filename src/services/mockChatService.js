// Mock Chat Service for Development and Testing
// This provides realistic mock data for development without requiring a backend

import { chatService } from "./chatService";

// Mock data generators
const generateMockId = () =>
  `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const generateMockTimestamp = (hoursAgo = 0) => {
  const timestamp = new Date();
  timestamp.setHours(timestamp.getHours() - hoursAgo);
  return timestamp.toISOString();
};

const generateMockMessage = (
  chatId,
  senderId,
  content,
  type = "text",
  hoursAgo = 0,
) => ({
  id: generateMockId(),
  chatId,
  senderId,
  content,
  type,
  timestamp: generateMockTimestamp(hoursAgo),
  status: ["sent", "delivered", "read"][Math.floor(Math.random() * 3)],
  read: Math.random() > 0.3,
});

const generateMockConversation = (
  vendorId,
  vendorName,
  lastMessageContent,
  hoursAgo = 0,
) => ({
  id: generateMockId(),
  vendorId,
  vendorName,
  vendorAvatar:
    Math.random() > 0.5
      ? `https://via.placeholder.com/48?text=${vendorName.charAt(0)}`
      : null,
  lastMessage: generateMockMessage(
    generateMockId(),
    vendorId,
    lastMessageContent,
    "text",
    hoursAgo,
  ),
  unreadCount: Math.floor(Math.random() * 5),
  isOnline: Math.random() > 0.5,
  hasOffers: Math.random() > 0.7,
  hasNewOffers: Math.random() > 0.8,
  hasSentOffers: Math.random() > 0.6,
  status: "active",
  timestamp: generateMockTimestamp(hoursAgo),
  messages: [
    generateMockMessage(
      generateMockId(),
      vendorId,
      `Hello! Welcome to ${vendorName}`,
      "text",
      24,
    ),
    generateMockMessage(
      generateMockId(),
      "user",
      "Hi there! I saw your products online.",
      "text",
      23,
    ),
    generateMockMessage(
      generateMockId(),
      vendorId,
      lastMessageContent,
      "text",
      hoursAgo,
    ),
  ],
});

// Predefined vendor data
const vendorData = [
  {
    id: "vendor-tech-solutions",
    name: "Tech Solutions Ltd",
    avatar: "https://via.placeholder.com/48?text=TS",
    isOnline: true,
  },
  {
    id: "vendor-industrial",
    name: "Industrial Supplies Co",
    avatar: "https://via.placeholder.com/48?text=IS",
    isOnline: false,
  },
  {
    id: "vendor-global-mfg",
    name: "Global Manufacturing",
    avatar: null,
    isOnline: true,
  },
  {
    id: "vendor-electronics",
    name: "Electronics Hub",
    avatar: "https://via.placeholder.com/48?text=EH",
    isOnline: true,
  },
  {
    id: "vendor-textiles",
    name: "Premium Textiles",
    avatar: "https://via.placeholder.com/48?text=PT",
    isOnline: false,
  },
];

// Generate mock conversations
const generateMockConversations = () => {
  const conversations = [
    generateMockConversation(
      vendorData[0].id,
      vendorData[0].name,
      "Thank you for your inquiry. We can offer you a 15% discount on bulk orders above ₹1,00,000.",
      0.5,
    ),
    generateMockConversation(
      vendorData[1].id,
      vendorData[1].name,
      "The delivery will be completed by next week as scheduled.",
      2,
    ),
    generateMockConversation(
      vendorData[2].id,
      vendorData[2].name,
      "🎁 Special offer: Get 20% off on orders above ₹50,000. Valid till Jan 15, 2024",
      6,
    ),
    generateMockConversation(
      vendorData[3].id,
      vendorData[3].name,
      "New product line launched! Check out our latest electronics collection.",
      12,
    ),
    generateMockConversation(
      vendorData[4].id,
      vendorData[4].name,
      "Your order #WH12345 has been shipped and will arrive in 2-3 business days.",
      18,
    ),
  ];

  // Update conversation properties
  conversations.forEach((conv, index) => {
    conv.vendorAvatar = vendorData[index].avatar;
    conv.isOnline = vendorData[index].isOnline;

    // Add some variety to message types
    if (index === 2) {
      conv.lastMessage.type = "offer";
      conv.lastMessage.offerData = {
        price: "50,000",
        validity: "2024-01-15",
        discount: "20%",
      };
    }

    if (index === 3) {
      conv.lastMessage.type = "image";
      conv.lastMessage.content = "product-showcase.jpg";
      conv.lastMessage.caption = "Check out our new electronics collection!";
    }
  });

  return conversations;
};

class MockChatService {
  constructor() {
    this.conversations = generateMockConversations();
    this.isInitialized = false;
  }

  // Override chatService methods to return mock data
  initializeSocket(userId) {
    console.log("🔧 Mock ChatService: Initializing socket for user:", userId);
    this.isInitialized = true;

    // Simulate connection delay
    setTimeout(() => {
      console.log("🔧 Mock ChatService: Socket connected");
    }, 500);

    return {
      emit: (event, data) => {
        console.log(`🔧 Mock ChatService: Emitting ${event}`, data);
      },
      on: (event, callback) => {
        console.log(`🔧 Mock ChatService: Listening for ${event}`);

        // Simulate real-time events
        if (event === "new_message") {
          setTimeout(() => {
            const randomConversation =
              this.conversations[
                Math.floor(Math.random() * this.conversations.length)
              ];
            callback(
              generateMockMessage(
                randomConversation.id,
                randomConversation.vendorId,
                "This is a simulated real-time message!",
                "text",
                0,
              ),
            );
          }, 3000);
        }

        if (event === "offer_received") {
          setTimeout(() => {
            callback({
              id: generateMockId(),
              vendorName:
                vendorData[Math.floor(Math.random() * vendorData.length)].name,
              offerData: {
                price: (Math.random() * 100000 + 10000).toFixed(0),
                validity: "2024-02-01",
                discount: Math.floor(Math.random() * 30 + 10) + "%",
              },
            });
          }, 5000);
        }
      },
      disconnect: () => {
        console.log("🔧 Mock ChatService: Socket disconnected");
      },
    };
  }

  async getConversations(userId, filter = null) {
    console.log(
      `🔧 Mock ChatService: Fetching conversations for user: ${userId}, filter: ${filter}`,
    );

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    let filtered = [...this.conversations];

    // Apply filters
    switch (filter) {
      case "Unread":
        filtered = filtered.filter((conv) => conv.unreadCount > 0);
        break;
      case "Offers Received":
        filtered = filtered.filter((conv) => conv.hasOffers);
        break;
      case "Offers Sent":
        filtered = filtered.filter((conv) => conv.hasSentOffers);
        break;
      case "Deals Closed":
        filtered = filtered.filter((conv) => conv.status === "closed");
        break;
      case "Support":
        filtered = filtered.filter((conv) => conv.type === "support");
        break;
      default:
        // Return all conversations
        break;
    }

    console.log(
      `🔧 Mock ChatService: Returning ${filtered.length} conversations`,
    );
    return filtered;
  }

  async sendMessage(messageData) {
    console.log("🔧 Mock ChatService: Sending message", messageData);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const chatId = messageData.chatId || messageData.conversationId;
    const message = {
      id: generateMockId(),
      ...messageData,
      chatId,
      conversationId: chatId,
      timestamp: new Date().toISOString(),
      status: "sent",
      read: false,
    };

    // Find and update conversation
    const conversation = this.conversations.find((conv) => conv.id === chatId);
    if (conversation) {
      conversation.messages.push(message);
      conversation.lastMessage = message;
      conversation.timestamp = message.timestamp;
    }

    console.log("🔧 Mock ChatService: Message sent successfully");
    return message;
  }

  async markAsRead(chatId, messageIds) {
    console.log(`🔧 Mock ChatService: Marking messages as read`, {
      chatId,
      messageIds,
    });

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    const conversation = this.conversations.find((conv) => conv.id === chatId);
    if (conversation) {
      const hasMessageIds = Array.isArray(messageIds) && messageIds.length > 0;
      conversation.messages.forEach((msg) => {
        if (!hasMessageIds || messageIds.includes(msg.id)) {
          msg.read = true;
        }
      });
      conversation.unreadCount = 0;
    }

    console.log("🔧 Mock ChatService: Messages marked as read");
    return { success: true };
  }

  async searchMessages(chatId, query) {
    console.log(
      `🔧 Mock ChatService: Searching messages in ${chatId} for "${query}"`,
    );

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 600));

    const conversation = this.conversations.find((conv) => conv.id === chatId);
    if (!conversation) return [];

    const results = conversation.messages.filter((msg) =>
      msg.content.toLowerCase().includes(query.toLowerCase()),
    );

    console.log(`🔧 Mock ChatService: Found ${results.length} messages`);
    return results;
  }

  // Additional mock methods
  async getMessages(chatId, page = 1, limit = 50) {
    console.log(`🔧 Mock ChatService: Getting messages for chat ${chatId}`);

    await new Promise((resolve) => setTimeout(resolve, 400));

    const conversation = this.conversations.find((conv) => conv.id === chatId);
    return conversation ? conversation.messages : [];
  }

  // Utility methods for testing
  addMockMessage(chatId, content, type = "text") {
    const conversation = this.conversations.find((conv) => conv.id === chatId);
    if (conversation) {
      const message = generateMockMessage(chatId, "vendor", content, type, 0);
      conversation.messages.push(message);
      conversation.lastMessage = message;
      conversation.timestamp = message.timestamp;
      conversation.unreadCount += 1;
    }
  }

  addMockOffer(chatId, offerData) {
    const conversation = this.conversations.find((conv) => conv.id === chatId);
    if (conversation) {
      const message = {
        id: generateMockId(),
        chatId,
        senderId: "vendor",
        content: "🎁 Special offer received!",
        type: "offer",
        timestamp: new Date().toISOString(),
        status: "sent",
        read: false,
        offerData,
      };
      conversation.messages.push(message);
      conversation.lastMessage = message;
      conversation.timestamp = message.timestamp;
      conversation.hasOffers = true;
      conversation.hasNewOffers = true;
      conversation.unreadCount += 1;
    }
  }

  getConversationStats() {
    const totalConversations = this.conversations.length;
    const unreadConversations = this.conversations.filter(
      (c) => c.unreadCount > 0,
    ).length;
    const totalUnreadMessages = this.conversations.reduce(
      (sum, c) => sum + c.unreadCount,
      0,
    );
    const conversationsWithOffers = this.conversations.filter(
      (c) => c.hasOffers,
    ).length;

    return {
      totalConversations,
      unreadConversations,
      totalUnreadMessages,
      conversationsWithOffers,
    };
  }

  // Reset to initial state
  reset() {
    this.conversations = generateMockConversations();
    console.log("🔧 Mock ChatService: Reset to initial state");
  }
}

// Create singleton instance
export const mockChatService = new MockChatService();

// Function to enable mock mode
export const enableMockMode = () => {
  console.log("🔧 Mock ChatService: Enabling mock mode");

  // Override the real chatService methods with mock implementations
  chatService.getConversations =
    mockChatService.getConversations.bind(mockChatService);
  chatService.sendMessage = mockChatService.sendMessage.bind(mockChatService);
  chatService.markAsRead = mockChatService.markAsRead.bind(mockChatService);
  chatService.searchMessages =
    mockChatService.searchMessages.bind(mockChatService);
  chatService.getMessages = mockChatService.getMessages.bind(mockChatService);

  return mockChatService;
};

// Function to disable mock mode (restore original implementations)
export const disableMockMode = () => {
  console.log("🔧 Mock ChatService: Disabling mock mode");
  // In a real implementation, you would restore the original methods here
};

// Auto-enable mock mode in development
if (__DEV__) {
  enableMockMode();
  console.log("🔧 Mock ChatService: Auto-enabled in development mode");
}
