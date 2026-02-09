import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    TextInput,
    StatusBar,
    Alert,
    FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSelector, useDispatch } from 'react-redux';
import { fetchConversations, setActiveFilter } from '../../store/slices/chatSlice';
import ChatHeader from './ChatHeader';
import ChatFooter from './ChatFooter';
import { COLORS } from '../../constants/Colors';

const ChatList = ({ navigation }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredConversations, setFilteredConversations] = useState([]);

    const dispatch = useDispatch();
    const { conversations = [], activeFilter = 'All', loading = false } = useSelector(state => state.chat || {});
    const user = useSelector(state => state.auth?.user);

    useEffect(() => {
        if (user?.id) {
            dispatch(fetchConversations({ userId: user.id }));
        }
    }, [dispatch, user?.id]);

    useEffect(() => {
        filterConversations();
    }, [conversations, searchQuery, activeFilter]);

    const filterConversations = () => {
        let filtered = Array.isArray(conversations) ? [...conversations] : [];

        // Filter by search query
        if (searchQuery.trim()) {
            filtered = filtered.filter(conv =>
                conv.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                conv.lastMessage?.content?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Filter by active filter
        switch (activeFilter) {
            case 'Unread':
                filtered = filtered.filter(conv => conv.unreadCount > 0);
                break;
            case 'Offers Received':
                filtered = filtered.filter(conv => conv.hasOffers && conv.lastMessage?.type === 'offer');
                break;
            case 'Offers Sent':
                filtered = filtered.filter(conv => conv.hasSentOffers);
                break;
            case 'Deals Closed':
                filtered = filtered.filter(conv => conv.status === 'closed');
                break;
            case 'Support':
                filtered = filtered.filter(conv => conv.type === 'support');
                break;
            default:
                // 'All' or 'Chats' - show all conversations
                break;
        }

        // Sort by last message timestamp
        filtered.sort((a, b) => new Date(b.lastMessage?.timestamp || 0) - new Date(a.lastMessage?.timestamp || 0));

        setFilteredConversations(filtered);
    };

    const handleConversationPress = (conversation) => {
        navigation.navigate('ChatInterface', {
            vendorId: conversation.vendorId,
            vendorName: conversation.vendorName,
            vendorAvatar: conversation.vendorAvatar,
        });
    };

    const handleFilterChange = (filter) => {
        dispatch(setActiveFilter(filter));
    };

    const formatTime = (timestamp) => {
        try {
            const date = new Date(timestamp);
            const now = new Date();
            const diffInHours = (now - date) / (1000 * 60 * 60);

            if (diffInHours < 24) {
                return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } else if (diffInHours < 168) { // 7 days
                return date.toLocaleDateString([], { weekday: 'short' });
            } else {
                return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
            }
        } catch (error) {
            return '';
        }
    };

    const getLastMessagePreview = (message) => {
        if (!message) return 'No messages yet';

        switch (message.type) {
            case 'image':
                return '📷 Photo';
            case 'offer':
                return '🎁 Special offer received';
            case 'location':
                return '📍 Location shared';
            case 'file':
                return `📄 ${message.fileName}`;
            default:
                return message.content;
        }
    };

    const renderConversation = ({ item }) => (
        <TouchableOpacity
            style={styles.conversationItem}
            onPress={() => handleConversationPress(item)}
            activeOpacity={0.7}
        >
            <View style={styles.avatarContainer}>
                {item.vendorAvatar ? (
                    <Image source={{ uri: item.vendorAvatar }} style={styles.avatar} />
                ) : (
                    <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarText}>
                            {item.vendorName?.charAt(0)?.toUpperCase() || 'V'}
                        </Text>
                    </View>
                )}

                {item.isOnline && (
                    <View style={styles.onlineIndicator} />
                )}

                {item.unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                        <Text style={styles.unreadText}>
                            {item.unreadCount > 99 ? '99+' : item.unreadCount}
                        </Text>
                    </View>
                )}
            </View>

            <View style={styles.conversationContent}>
                <View style={styles.conversationHeader}>
                    <Text style={styles.vendorName} numberOfLines={1}>
                        {item.vendorName}
                    </Text>
                    <Text style={styles.timestamp}>
                        {formatTime(item.lastMessage?.timestamp)}
                    </Text>
                </View>

                <View style={styles.lastMessageContainer}>
                    <View style={styles.lastMessageContent}>
                        <Text style={styles.lastMessage} numberOfLines={1}>
                            {getLastMessagePreview(item.lastMessage)}
                        </Text>

                        {item.lastMessage?.type === 'offer' && (
                            <Icon name="card-giftcard" size={14} color={COLORS.WARNING} style={styles.offerIcon} />
                        )}

                        {item.lastMessage?.isOwn && (
                            <Icon name="done-all" size={14} color={COLORS.PRIMARY} style={styles.statusIcon} />
                        )}
                    </View>

                    {item.hasNewOffers && (
                        <View style={styles.offerBadge}>
                            <Text style={styles.offerBadgeText}>NEW OFFER</Text>
                        </View>
                    )}
                </View>

                {item.lastMessage?.type === 'offer' && item.lastMessage.offerData && (
                    <View style={styles.offerPreview}>
                        <Text style={styles.offerPrice}>₹{item.lastMessage.offerData.price}</Text>
                        <Text style={styles.offerValidity}>
                            Valid till {item.lastMessage.offerData.validity}
                        </Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Icon name="chat-bubble-outline" size={64} color={COLORS.GRAY_300} />
            <Text style={styles.emptyStateTitle}>No conversations yet</Text>
            <Text style={styles.emptyStateSubtitle}>
                Start chatting with vendors to see your conversations here
            </Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.WHITE} />

            <ChatHeader
                vendorName=""
                onBack={() => navigation.goBack()}
                onSearch={() => { }}
                onCall={() => { }}
                onVideoCall={() => { }}
                onMore={() => { }}
            />

            <ChatFooter
                activeFilter={activeFilter}
                onFilterChange={handleFilterChange}
            />

            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Icon name="search" size={20} color={COLORS.GRAY_500} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity
                            style={styles.clearButton}
                            onPress={() => setSearchQuery('')}
                        >
                            <Icon name="clear" size={18} color={COLORS.GRAY_500} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <View style={styles.conversationsContainer}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <Text style={styles.loadingText}>Loading conversations...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={filteredConversations}
                        renderItem={renderConversation}
                        keyExtractor={(item, index) =>
                            (item?.id || item?.vendorId || `conversation-${index}`).toString()
                        }
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={[
                            styles.conversationsList,
                            filteredConversations.length === 0 && styles.emptyListContainer
                        ]}
                        ListEmptyComponent={renderEmptyState}
                    />
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.WHITE,
    },
    searchContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: COLORS.WHITE,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.GRAY_200,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.GRAY_100,
        borderRadius: 25,
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: COLORS.GRAY_800,
    },
    clearButton: {
        marginLeft: 8,
        padding: 4,
    },
    conversationsContainer: {
        flex: 1,
        backgroundColor: COLORS.GRAY_50,
    },
    conversationsList: {
        paddingVertical: 8,
    },
    emptyListContainer: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: COLORS.GRAY_600,
    },
    conversationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: COLORS.WHITE,
        marginBottom: 1,
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 12,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    avatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.GRAY_300,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.GRAY_600,
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: COLORS.SUCCESS,
        borderWidth: 2,
        borderColor: COLORS.WHITE,
    },
    unreadBadge: {
        position: 'absolute',
        top: -2,
        right: -2,
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: COLORS.PRIMARY,
        justifyContent: 'center',
        alignItems: 'center',
    },
    unreadText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: COLORS.WHITE,
    },
    conversationContent: {
        flex: 1,
    },
    conversationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    vendorName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.GRAY_800,
        flex: 1,
    },
    timestamp: {
        fontSize: 12,
        color: COLORS.GRAY_500,
    },
    lastMessageContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    lastMessageContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    lastMessage: {
        fontSize: 14,
        color: COLORS.GRAY_600,
        flex: 1,
    },
    offerIcon: {
        marginLeft: 6,
    },
    statusIcon: {
        marginLeft: 4,
    },
    offerBadge: {
        backgroundColor: COLORS.WARNING,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        marginLeft: 8,
    },
    offerBadgeText: {
        fontSize: 8,
        fontWeight: 'bold',
        color: COLORS.WHITE,
    },
    offerPreview: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
        paddingTop: 4,
        borderTopWidth: 1,
        borderTopColor: COLORS.GRAY_200,
    },
    offerPrice: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.PRIMARY,
    },
    offerValidity: {
        fontSize: 12,
        color: COLORS.GRAY_500,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    emptyStateTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.GRAY_700,
        marginTop: 16,
        marginBottom: 8,
    },
    emptyStateSubtitle: {
        fontSize: 14,
        color: COLORS.GRAY_500,
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default ChatList;
