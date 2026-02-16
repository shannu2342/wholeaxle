import { io } from "socket.io-client";
import { API_BASE_URL } from "../config/api";
import SafeStorage from "./SafeStorage";

class ChatService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  normalizeId(value) {
    if (!value) return null;
    if (typeof value === "string") return value;
    return (
      value._id || value.id || value.conversationId || value.messageId || null
    );
  }

  normalizeMessage(rawMessage, fallbackConversationId = null) {
    if (!rawMessage || typeof rawMessage !== "object") {
      return null;
    }

    const senderId = this.normalizeId(rawMessage.senderId || rawMessage.sender);
    const conversationId = this.normalizeId(
      rawMessage.chatId || rawMessage.conversationId || fallbackConversationId,
    );
    const messageType =
      rawMessage.messageType ||
      rawMessage.type ||
      (rawMessage.isSystemMessage ? "system" : "text");
    const timestamp =
      rawMessage.timestamp ||
      rawMessage.createdAt ||
      rawMessage.updatedAt ||
      new Date().toISOString();

    return {
      ...rawMessage,
      id:
        this.normalizeId(
          rawMessage.id || rawMessage._id || rawMessage.messageId,
        ) || `${Date.now()}`,
      _id: rawMessage._id || rawMessage.id || rawMessage.messageId,
      chatId: conversationId,
      conversationId,
      senderId,
      sender: senderId,
      senderName:
        rawMessage.senderName ||
        rawMessage.sender?.businessName ||
        [rawMessage.sender?.firstName, rawMessage.sender?.lastName]
          .filter(Boolean)
          .join(" ") ||
        "User",
      content: rawMessage.content ?? "",
      type: messageType,
      messageType,
      timestamp,
      createdAt: rawMessage.createdAt || timestamp,
      read:
        typeof rawMessage.read === "boolean"
          ? rawMessage.read
          : rawMessage.status === "read" ||
            (Array.isArray(rawMessage.readBy) && rawMessage.readBy.length > 0),
      offerData: rawMessage.offerData || rawMessage.offer || null,
      systemType:
        rawMessage.systemType ||
        rawMessage.systemMessageType ||
        rawMessage.content?.type,
    };
  }

  normalizeConversation(rawConversation, currentUserId = null) {
    if (!rawConversation || typeof rawConversation !== "object") {
      return null;
    }

    const conversationId =
      this.normalizeId(
        rawConversation.id ||
          rawConversation._id ||
          rawConversation.conversationId,
      ) || `conversation-${Date.now()}`;

    const participants = Array.isArray(rawConversation.participants)
      ? rawConversation.participants
      : [];
    const normalizedCurrentUserId = currentUserId
      ? String(currentUserId)
      : null;

    const otherParticipant =
      participants.find((participant) => {
        const participantId = this.normalizeId(participant?.user);
        if (!participantId || !normalizedCurrentUserId) {
          return false;
        }
        return String(participantId) !== normalizedCurrentUserId;
      }) ||
      participants[0] ||
      {};

    const otherUser =
      otherParticipant?.user && typeof otherParticipant.user === "object"
        ? otherParticipant.user
        : {};

    const vendorId =
      this.normalizeId(rawConversation.vendorId || otherParticipant?.user) ||
      conversationId;
    const vendorName =
      rawConversation.vendorName ||
      otherUser.businessName ||
      [otherUser.firstName, otherUser.lastName].filter(Boolean).join(" ") ||
      "Vendor";
    const vendorAvatar =
      rawConversation.vendorAvatar || otherUser.avatar || null;

    const lastMessage = this.normalizeMessage(
      rawConversation.lastMessage,
      conversationId,
    );
    const messages = Array.isArray(rawConversation.messages)
      ? rawConversation.messages
          .map((msg) => this.normalizeMessage(msg, conversationId))
          .filter(Boolean)
      : lastMessage
        ? [lastMessage]
        : [];

    const timestamp =
      lastMessage?.timestamp ||
      rawConversation.lastMessageAt ||
      rawConversation.updatedAt ||
      rawConversation.createdAt ||
      new Date().toISOString();

    return {
      ...rawConversation,
      id: conversationId,
      _id: rawConversation._id || conversationId,
      conversationId,
      vendorId,
      vendorName,
      vendorAvatar,
      isOnline: Boolean(rawConversation.isOnline),
      unreadCount: Number(rawConversation.unreadCount || 0),
      status: rawConversation.status || "active",
      type:
        rawConversation.type || rawConversation.conversationType || "direct",
      lastMessage: lastMessage || null,
      lastMessageAt: rawConversation.lastMessageAt || timestamp,
      timestamp,
      messages,
      hasOffers: Boolean(
        rawConversation.hasOffers || lastMessage?.type === "offer",
      ),
      hasNewOffers: Boolean(rawConversation.hasNewOffers),
      hasSentOffers: Boolean(rawConversation.hasSentOffers),
    };
  }

  // Initialize Socket.io connection
  initializeSocket(userId, token = null) {
    this.socket = io(API_BASE_URL, {
      auth: {},
      autoConnect: false,
      transports: ["websocket", "polling"],
    });

    const connectSocket = async () => {
      const authToken = token || (await this.getAuthToken());
      this.socket.auth = authToken ? { token: authToken } : { userId };
      this.socket.connect();
    };
    connectSocket();

    this.socket.on("connect", () => {
      console.log("Connected to chat server");
    });

    this.socket.on("disconnect", () => {
      console.log("Disconnected from chat server");
    });

    this.socket.on("error", (error) => {
      console.error("Socket error:", error);
    });

    return this.socket;
  }

  // Disconnect socket
  disconnectSocket() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Join a chat room
  joinChatRoom(chatId) {
    if (this.socket) {
      this.socket.emit("chat:join", { conversationId: chatId });
      this.socket.emit("join_chat", { chatId });
    }
  }

  // Leave a chat room
  leaveChatRoom(chatId) {
    if (this.socket) {
      this.socket.emit("chat:leave", { conversationId: chatId });
      this.socket.emit("leave_chat", { chatId });
    }
  }

  // Send message
  async sendMessage(messageData) {
    try {
      const conversationId = this.normalizeId(
        messageData?.conversationId || messageData?.chatId,
      );

      const payload = {
        conversationId,
        content: messageData?.content ?? messageData?.message ?? "",
        messageType: messageData?.messageType || messageData?.type || "text",
        replyTo: messageData?.replyTo,
        media: messageData?.media,
        location: messageData?.location,
      };

      const response = await fetch(`${API_BASE_URL}/api/chat/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${messageData?.token || (await this.getAuthToken())}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const result = await response.json();
      const rawMessage = result?.data?.message || result?.message || result;
      const message = this.normalizeMessage(rawMessage, conversationId);

      // Emit via socket for real-time delivery
      if (this.socket && message) {
        this.socket.emit("chat:send", {
          conversationId: message.conversationId,
          content: message.content,
          messageType: message.messageType,
          replyTo: message.replyTo,
          media: message.media,
          location: message.location,
        });
        this.socket.emit("send_message", message);
      }

      return message;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  }

  // Get conversations
  async getConversations(userId, filter = null) {
    try {
      const params = new URLSearchParams();
      if (filter) {
        params.append("filter", filter);
      }

      const query = params.toString();
      const response = await fetch(
        `${API_BASE_URL}/api/chat/conversations${query ? `?${query}` : ""}`,
        {
          headers: {
            Authorization: `Bearer ${await this.getAuthToken()}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch conversations");
      }

      const payload = await response.json();
      const conversationsList = Array.isArray(payload)
        ? payload
        : payload?.conversations || [];
      const conversations = conversationsList
        .map((conversation) => this.normalizeConversation(conversation, userId))
        .filter(Boolean);

      // If socket is connected, join all conversation rooms
      if (this.socket) {
        conversations.forEach((conv) => {
          this.joinChatRoom(conv.id);
        });
      }

      return conversations;
    } catch (error) {
      console.error("Error fetching conversations:", error);
      return [];
    }
  }

  // Get messages for a specific chat
  async getMessages(chatId, page = 1, limit = 50) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/chat/messages/${chatId}?page=${page}&limit=${limit}`,
        {
          headers: {
            Authorization: `Bearer ${await this.getAuthToken()}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }

      const payload = await response.json();
      const messages = Array.isArray(payload)
        ? payload
        : payload?.messages || [];

      return messages
        .map((message) => this.normalizeMessage(message, chatId))
        .filter(Boolean);
    } catch (error) {
      console.error("Error fetching messages:", error);
      throw error;
    }
  }

  // Mark messages as read
  async markAsRead(chatId, messageIds) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/chat/conversations/${chatId}/read`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${await this.getAuthToken()}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to mark messages as read");
      }

      // Emit via socket
      if (this.socket) {
        if (Array.isArray(messageIds)) {
          messageIds.forEach((messageId) => {
            this.socket.emit("chat:read", {
              conversationId: chatId,
              messageId,
            });
          });
        }
        this.socket.emit("chat:read", { conversationId: chatId });
        this.socket.emit("mark_as_read", { chatId, messageIds });
      }

      return await response.json();
    } catch (error) {
      console.error("Error marking messages as read:", error);
      throw error;
    }
  }

  // Search messages
  async searchMessages(chatId, query) {
    try {
      const messages = await this.getMessages(chatId, 1, 200);
      const normalizedQuery = String(query || "").toLowerCase();
      if (!normalizedQuery) {
        return messages;
      }

      return messages.filter((message) => {
        const content =
          typeof message.content === "string"
            ? message.content
            : JSON.stringify(message.content || {});
        return content.toLowerCase().includes(normalizedQuery);
      });
    } catch (error) {
      console.error("Error searching messages:", error);
      throw error;
    }
  }

  // Send typing indicator
  sendTypingIndicator(chatId, isTyping) {
    if (this.socket) {
      this.socket.emit(isTyping ? "typing:start" : "typing:stop", {
        conversationId: chatId,
      });
      this.socket.emit("typing", { chatId, isTyping });
    }
  }

  // Event listeners
  onNewMessage(callback) {
    if (this.socket) {
      this.socket.on("chat:message", (payload) => {
        const message = this.normalizeMessage(
          payload?.message || payload,
          payload?.conversationId,
        );
        if (message) {
          callback(message);
        }
      });
      this.socket.on("new_message", callback);
    }
  }

  onTyping(callback) {
    if (this.socket) {
      this.socket.on("typing:start", (payload) =>
        callback({ ...payload, isTyping: true }),
      );
      this.socket.on("typing:stop", (payload) =>
        callback({ ...payload, isTyping: false }),
      );
      this.socket.on("user_typing", callback);
    }
  }

  onMessageStatus(callback) {
    if (this.socket) {
      this.socket.on("chat:read", callback);
      this.socket.on("message_status", callback);
    }
  }

  onUserOnline(callback) {
    if (this.socket) {
      this.socket.on("user_online", callback);
    }
  }

  onUserOffline(callback) {
    if (this.socket) {
      this.socket.on("user_offline", callback);
    }
  }

  onOfferReceived(callback) {
    if (this.socket) {
      this.socket.on("offer:received", callback);
      this.socket.on("offer_received", callback);
    }
  }

  // Remove event listeners
  off(event) {
    if (this.socket) {
      this.socket.off(event);
    }
  }

  // Utility methods
  async getAuthToken() {
    try {
      const persisted = await SafeStorage.getItem("persist:root");
      if (!persisted) return null;
      const parsed = JSON.parse(persisted);
      const auth = parsed?.auth ? JSON.parse(parsed.auth) : null;
      return auth?.token || null;
    } catch (error) {
      console.warn("Failed to read auth token:", error);
      return null;
    }
  }

  getMockMessages(chatId) {
    return [
      {
        id: "msg-1",
        content: "Hello! I saw your inquiry about our products.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        senderId: "vendor-1",
        type: "text",
        status: "read",
      },
      {
        id: "msg-2",
        content:
          "Yes, I am interested in bulk purchasing. What are your terms?",
        timestamp: new Date(
          Date.now() - 1000 * 60 * 60 * 2 + 1000 * 60 * 5,
        ).toISOString(),
        senderId: "user",
        type: "text",
        status: "read",
      },
      {
        id: "msg-3",
        content:
          "Thank you for your interest in our products. We can offer you a 15% discount on bulk orders.",
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        senderId: "vendor-1",
        type: "text",
        status: "read",
      },
    ];
  }
}

export const chatService = new ChatService();
