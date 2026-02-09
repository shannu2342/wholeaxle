import React, { useState } from 'react';
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

const ChatBubble = ({ message, isOwn, vendorAvatar }) => {
    const [showActions, setShowActions] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    const formatTime = (timestamp) => {
        try {
            const date = new Date(timestamp);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (error) {
            return '';
        }
    };

    const handleMessagePress = () => {
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

    const renderMessageContent = () => {
        switch (message.type) {
            case 'image':
                return (
                    <View style={styles.imageContainer}>
                        <Image
                            source={{ uri: message.content }}
                            style={styles.messageImage}
                            onLoadEnd={() => setImageLoaded(true)}
                        />
                        {message.caption && (
                            <Text style={styles.imageCaption}>{message.caption}</Text>
                        )}
                    </View>
                );

            case 'offer':
                return (
                    <View style={styles.offerContainer}>
                        <View style={styles.offerHeader}>
                            <Icon name="card-giftcard" size={16} color={Colors.warning} />
                            <Text style={styles.offerTitle}>Special Offer</Text>
                        </View>
                        <Text style={styles.offerContent}>{message.content}</Text>
                        {message.offerData && (
                            <View style={styles.offerDetails}>
                                <Text style={styles.offerPrice}>₹{message.offerData.price}</Text>
                                <Text style={styles.offerValidity}>Valid till {message.offerData.validity}</Text>
                            </View>
                        )}
                    </View>
                );

            case 'location':
                return (
                    <View style={styles.locationContainer}>
                        <Icon name="location-on" size={16} color={Colors.danger} />
                        <View style={styles.locationContent}>
                            <Text style={styles.locationTitle}>📍 {message.content}</Text>
                            {message.locationData && (
                                <Text style={styles.locationAddress}>{message.locationData.address}</Text>
                            )}
                        </View>
                    </View>
                );

            case 'file':
                return (
                    <View style={styles.fileContainer}>
                        <Icon name="insert-drive-file" size={20} color={Colors.primary} />
                        <View style={styles.fileContent}>
                            <Text style={styles.fileName}>{message.fileName}</Text>
                            <Text style={styles.fileSize}>{message.fileSize}</Text>
                        </View>
                        <TouchableOpacity style={styles.downloadButton}>
                            <Icon name="download" size={16} color={Colors.primary} />
                        </TouchableOpacity>
                    </View>
                );

            default:
                return (
                    <Text style={[styles.messageText, isOwn ? styles.ownMessageText : styles.otherMessageText]}>
                        {message.content}
                    </Text>
                );
        }
    };

    return (
        <View style={[styles.container, isOwn ? styles.ownContainer : styles.otherContainer]}>
            {!isOwn && (
                <View style={styles.avatarContainer}>
                    {vendorAvatar ? (
                        <Image source={{ uri: vendorAvatar }} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarText}>V</Text>
                        </View>
                    )}
                </View>
            )}

            <View style={[styles.bubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
                <TouchableOpacity onPress={handleMessagePress} activeOpacity={0.8}>
                    {renderMessageContent()}

                    <View style={styles.messageFooter}>
                        <Text style={[styles.timestamp, isOwn ? styles.ownTimestamp : styles.otherTimestamp]}>
                            {formatTime(message.timestamp)}
                        </Text>

                        {isOwn && (
                            <View style={styles.statusIcons}>
                                {message.status === 'sent' && (
                                    <Icon name="check" size={12} color={Colors.mediumGray} />
                                )}
                                {message.status === 'delivered' && (
                                    <Icon name="done-all" size={12} color={Colors.mediumGray} />
                                )}
                                {message.status === 'read' && (
                                    <Icon name="done-all" size={12} color={Colors.primary} />
                                )}
                            </View>
                        )}
                    </View>
                </TouchableOpacity>

                {showActions && (
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
                )}
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
        maxWidth: '75%',
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
        width: 200,
        height: 150,
        resizeMode: 'cover',
    },
    imageCaption: {
        padding: 8,
        backgroundColor: Colors.black,
        color: Colors.white,
        fontSize: 14,
    },
    offerContainer: {
        backgroundColor: Colors.warningLight,
        borderRadius: 8,
        padding: 12,
        borderLeftWidth: 3,
        borderLeftColor: Colors.warning,
    },
    offerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    offerTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.warning,
        marginLeft: 6,
    },
    offerContent: {
        fontSize: 14,
        color: Colors.text.primary,
        marginBottom: 8,
    },
    offerDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    offerPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text.primary,
    },
    offerValidity: {
        fontSize: 12,
        color: Colors.text.secondary,
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
        marginTop: 4,
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
        bottom: -40,
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
