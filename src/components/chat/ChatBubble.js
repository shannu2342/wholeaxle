import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Colors from '../../constants/Colors';
import { getVendorCounterMeta, getOfferStatusColor } from '../../store/slices/offersSlice';

const resolveMessageType = (message) => {
    if (!message) return 'text';
    if (message.messageType) return message.messageType;
    if (message.type) return message.type;
    if (message.isSystemMessage) return 'system';
    return 'text';
};

const getSystemConfig = (type) => {
    switch (type) {
        case 'delivery_attempt':
        case 'delivery_attempted':
            return { icon: 'local-shipping', color: '#FF9800', title: 'Delivery Attempted' };
        case 'rto':
        case 'rto_marked':
            return { icon: 'warning', color: '#F44336', title: 'Order Marked RTO' };
        case 'credit_note':
            return { icon: 'description', color: '#2196F3', title: 'Credit Note Generated' };
        default:
            return { icon: 'info', color: Colors.info, title: 'System Update' };
    }
};

const ChatBubble = ({ message, isOwn, vendorAvatar }) => {
    const [showActions, setShowActions] = useState(false);
    const messageType = resolveMessageType(message);
    const isSystemMessage = messageType === 'system';

    const offerMeta = useMemo(() => {
        const rawOffer =
            message?.offerData ||
            message?.offer ||
            (typeof message?.content === 'object' ? message?.content?.offer : null) ||
            {};
        const counterMeta = getVendorCounterMeta(rawOffer);
        return { rawOffer, counterMeta };
    }, [message]);

    const formatTime = (timestamp) => {
        try {
            const date = new Date(timestamp);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (error) {
            return '';
        }
    };

    const handleMessagePress = () => {
        if (isSystemMessage) return;
        setShowActions(!showActions);
    };

    const handleReply = () => {
        Alert.alert('Reply', 'Feature coming soon!');
        setShowActions(false);
    };

    const handleForward = () => {
        Alert.alert('Forward', 'Feature coming soon!');
        setShowActions(false);
    };

    const handleCopy = () => {
        Alert.alert('Copy', 'Message copied to clipboard!');
        setShowActions(false);
    };

    const renderOfferMessage = () => {
        const { rawOffer, counterMeta } = offerMeta;
        const status = rawOffer.status || 'pending';
        const statusColor = getOfferStatusColor(status);
        const quantity = rawOffer.quantity || rawOffer.qty || rawOffer?.quantityRequested;
        const unitPrice = rawOffer.unitPrice || rawOffer.price || rawOffer?.pricing?.offerPrice;
        const total = quantity && unitPrice ? Number(quantity) * Number(unitPrice) : null;
        const description =
            (typeof message.content === 'string' ? message.content : null) ||
            rawOffer.description ||
            rawOffer.title ||
            'Negotiation update';

        return (
            <View style={styles.offerContainer}>
                <View style={styles.offerHeader}>
                    <View style={styles.offerHeaderLeft}>
                        <Icon name="local-offer" size={16} color={Colors.white} />
                        <Text style={styles.offerHeaderTitle}>Offer</Text>
                    </View>
                    <View style={[styles.offerStatusBadge, { backgroundColor: statusColor }]}>
                        <Text style={styles.offerStatusText}>{String(status).toUpperCase()}</Text>
                    </View>
                </View>

                <Text style={styles.offerContent}>{description}</Text>

                {(quantity || unitPrice) && (
                    <View style={styles.offerDetails}>
                        {quantity ? (
                            <Text style={styles.offerDetailText}>Qty: {quantity}</Text>
                        ) : null}
                        {unitPrice ? (
                            <Text style={styles.offerDetailText}>Unit: ₹{unitPrice}</Text>
                        ) : null}
                        {total ? (
                            <Text style={styles.offerDetailText}>Total: ₹{total}</Text>
                        ) : null}
                    </View>
                )}

                <View style={styles.counterMetaRow}>
                    <Text style={styles.counterMetaText}>
                        Counters used: {counterMeta.used}/{counterMeta.max}
                    </Text>
                    <Text
                        style={[
                            styles.counterMetaText,
                            counterMeta.remaining === 0 ? styles.counterMetaTextDanger : styles.counterMetaTextInfo
                        ]}
                    >
                        {counterMeta.remaining > 0
                            ? `${counterMeta.remaining} counter left`
                            : 'Max vendor counter limit reached'}
                    </Text>
                </View>
            </View>
        );
    };

    const renderSystemMessage = () => {
        const payload = typeof message.content === 'object' ? message.content : {};
        const systemType = payload?.type || message.systemType || 'info';
        const config = getSystemConfig(systemType);
        const title = payload?.title || message.title || config.title;
        const body = payload?.body || (typeof message.content === 'string' ? message.content : '');
        const amount = payload?.meta?.amount;

        return (
            <View style={styles.systemMessageContainer}>
                <View style={styles.systemHeader}>
                    <Icon name={config.icon} size={16} color={config.color} />
                    <Text style={[styles.systemTitle, { color: config.color }]}>{title}</Text>
                </View>
                {body ? <Text style={styles.systemBody}>{body}</Text> : null}
                {amount ? (
                    <Text style={styles.systemMeta}>Amount: ₹{amount}</Text>
                ) : null}
            </View>
        );
    };

    const renderMessageContent = () => {
        switch (messageType) {
            case 'image':
                return (
                    <View style={styles.imageContainer}>
                        <Image
                            source={{ uri: message.content }}
                            style={styles.messageImage}
                        />
                        {message.caption ? (
                            <Text style={styles.imageCaption}>{message.caption}</Text>
                        ) : null}
                    </View>
                );

            case 'offer':
                return renderOfferMessage();

            case 'system':
                return renderSystemMessage();

            case 'location':
                return (
                    <View style={styles.locationContainer}>
                        <Icon name="location-on" size={16} color={Colors.danger} />
                        <View style={styles.locationContent}>
                            <Text style={styles.locationTitle}>{message.content}</Text>
                            {message.locationData ? (
                                <Text style={styles.locationAddress}>{message.locationData.address}</Text>
                            ) : null}
                        </View>
                    </View>
                );

            case 'file':
                return (
                    <View style={styles.fileContainer}>
                        <Icon name="insert-drive-file" size={20} color={Colors.primary} />
                        <View style={styles.fileContent}>
                            <Text style={styles.fileName}>{message.fileName || 'Attachment'}</Text>
                            <Text style={styles.fileSize}>{message.fileSize || 'Unknown size'}</Text>
                        </View>
                        <TouchableOpacity style={styles.downloadButton}>
                            <Icon name="download" size={16} color={Colors.primary} />
                        </TouchableOpacity>
                    </View>
                );

            default: {
                const contentText =
                    typeof message.content === 'string'
                        ? message.content
                        : message?.content?.text || 'Message';

                return (
                    <Text style={[styles.messageText, isOwn ? styles.ownMessageText : styles.otherMessageText]}>
                        {contentText}
                    </Text>
                );
            }
        }
    };

    return (
        <View
            style={[
                styles.container,
                isSystemMessage ? styles.systemContainer : (isOwn ? styles.ownContainer : styles.otherContainer),
            ]}
        >
            {!isOwn && !isSystemMessage ? (
                <View style={styles.avatarContainer}>
                    {vendorAvatar ? (
                        <Image source={{ uri: vendorAvatar }} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarText}>V</Text>
                        </View>
                    )}
                </View>
            ) : null}

            <View
                style={[
                    styles.bubble,
                    isSystemMessage
                        ? styles.systemBubble
                        : (isOwn ? styles.ownBubble : styles.otherBubble),
                ]}
            >
                <TouchableOpacity onPress={handleMessagePress} activeOpacity={0.85}>
                    {renderMessageContent()}

                    <View style={styles.messageFooter}>
                        <Text style={[styles.timestamp, isOwn ? styles.ownTimestamp : styles.otherTimestamp]}>
                            {formatTime(message.timestamp)}
                        </Text>

                        {isOwn && !isSystemMessage ? (
                            <View style={styles.statusIcons}>
                                {message.status === 'sent' ? (
                                    <Icon name="check" size={12} color={Colors.mediumGray} />
                                ) : null}
                                {message.status === 'delivered' ? (
                                    <Icon name="done-all" size={12} color={Colors.mediumGray} />
                                ) : null}
                                {message.status === 'read' ? (
                                    <Icon name="done-all" size={12} color={Colors.primary} />
                                ) : null}
                            </View>
                        ) : null}
                    </View>
                </TouchableOpacity>

                {showActions && !isSystemMessage ? (
                    <View
                        style={[
                            styles.actionMenu,
                            isOwn ? { right: 0 } : { left: 0 },
                        ]}
                    >
                        <TouchableOpacity style={styles.actionButton} onPress={handleReply}>
                            <Icon name="reply" size={16} color={Colors.text.secondary} />
                            <Text style={styles.actionText}>Reply</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionButton} onPress={handleForward}>
                            <Icon name="forward" size={16} color={Colors.text.secondary} />
                            <Text style={styles.actionText}>Forward</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionButton} onPress={handleCopy}>
                            <Icon name="content-copy" size={16} color={Colors.text.secondary} />
                            <Text style={styles.actionText}>Copy</Text>
                        </TouchableOpacity>
                    </View>
                ) : null}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        marginBottom: 12,
        paddingHorizontal: 16,
    },
    ownContainer: {
        justifyContent: 'flex-end',
    },
    otherContainer: {
        justifyContent: 'flex-start',
    },
    systemContainer: {
        justifyContent: 'center',
    },
    avatarContainer: {
        marginRight: 8,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    avatarPlaceholder: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.lightGray,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: Colors.text.secondary,
    },
    bubble: {
        maxWidth: '78%',
        borderRadius: 16,
        padding: 12,
        elevation: 1,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
    },
    ownBubble: {
        backgroundColor: Colors.primary,
        borderBottomRightRadius: 4,
    },
    otherBubble: {
        backgroundColor: Colors.white,
        borderBottomLeftRadius: 4,
    },
    systemBubble: {
        backgroundColor: '#f7fbff',
        borderWidth: 1,
        borderColor: '#d9ebff',
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
        width: '90%',
        maxWidth: '90%',
    },
    messageText: {
        fontSize: 16,
        lineHeight: 22,
    },
    ownMessageText: {
        color: Colors.white,
    },
    otherMessageText: {
        color: Colors.text.primary,
    },
    imageContainer: {
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 8,
    },
    messageImage: {
        width: 220,
        height: 160,
        resizeMode: 'cover',
    },
    imageCaption: {
        padding: 8,
        backgroundColor: Colors.black,
        color: Colors.white,
        fontSize: 14,
    },
    offerContainer: {
        backgroundColor: '#fffaf0',
        borderRadius: 10,
        padding: 10,
        borderLeftWidth: 3,
        borderLeftColor: Colors.warning,
    },
    offerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    offerHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    offerHeaderTitle: {
        color: Colors.text.primary,
        fontSize: 13,
        fontWeight: '700',
    },
    offerStatusBadge: {
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    offerStatusText: {
        color: Colors.white,
        fontSize: 10,
        fontWeight: '700',
    },
    offerContent: {
        fontSize: 13,
        color: Colors.text.primary,
        marginBottom: 8,
    },
    offerDetails: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 8,
    },
    offerDetailText: {
        fontSize: 12,
        color: Colors.text.secondary,
        fontWeight: '600',
    },
    counterMetaRow: {
        borderTopWidth: 1,
        borderTopColor: '#f0e4cc',
        paddingTop: 8,
        gap: 2,
    },
    counterMetaText: {
        fontSize: 11,
        color: Colors.text.secondary,
    },
    counterMetaTextInfo: {
        color: Colors.primary,
        fontWeight: '600',
    },
    counterMetaTextDanger: {
        color: Colors.danger,
        fontWeight: '700',
    },
    systemMessageContainer: {
        gap: 6,
    },
    systemHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    systemTitle: {
        fontSize: 13,
        fontWeight: '700',
    },
    systemBody: {
        fontSize: 12,
        color: Colors.text.secondary,
    },
    systemMeta: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.lightGray,
        borderRadius: 8,
        padding: 12,
    },
    locationContent: {
        marginLeft: 8,
        flex: 1,
    },
    locationTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text.primary,
        marginBottom: 2,
    },
    locationAddress: {
        fontSize: 12,
        color: Colors.text.secondary,
    },
    fileContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.lightGray,
        borderRadius: 8,
        padding: 12,
        minWidth: 200,
    },
    fileContent: {
        marginLeft: 12,
        flex: 1,
    },
    fileName: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    fileSize: {
        fontSize: 12,
        color: Colors.text.secondary,
    },
    downloadButton: {
        marginLeft: 8,
        padding: 4,
    },
    messageFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginTop: 6,
    },
    timestamp: {
        fontSize: 11,
        marginRight: 4,
    },
    ownTimestamp: {
        color: Colors.white,
        opacity: 0.8,
    },
    otherTimestamp: {
        color: Colors.mediumGray,
    },
    statusIcons: {
        flexDirection: 'row',
    },
    actionMenu: {
        position: 'absolute',
        bottom: -42,
        backgroundColor: Colors.white,
        borderRadius: 8,
        padding: 8,
        flexDirection: 'row',
        elevation: 3,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 8,
        padding: 4,
    },
    actionText: {
        fontSize: 12,
        color: Colors.text.secondary,
        marginLeft: 4,
    },
});

export default ChatBubble;
