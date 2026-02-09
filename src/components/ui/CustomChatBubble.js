import React, { memo, useMemo } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Animated,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSelector } from 'react-redux';

// Import message type components
import MessageRenderer from './MessageRenderer';
import MessageStatusIndicator from './MessageStatusIndicator';

const { width: screenWidth } = Dimensions.get('window');

const CustomChatBubble = memo(({
    message,
    isOwn,
    onLongPress,
    onPress,
    animation,
    theme = 'light',
}) => {
    const themeMode = useSelector(state => state.theme?.mode || 'light');

    const bubbleStyle = useMemo(() => {
        const baseStyle = {
            maxWidth: screenWidth * 0.75,
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 20,
            marginVertical: 4,
            marginHorizontal: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
        };

        if (isOwn) {
            return {
                ...baseStyle,
                alignSelf: 'flex-end',
                backgroundColor: themeMode === 'dark' ? '#007AFF' : '#007AFF',
                borderBottomRightRadius: 4,
            };
        } else {
            return {
                ...baseStyle,
                alignSelf: 'flex-start',
                backgroundColor: themeMode === 'dark' ? '#2C2C2E' : '#F0F0F0',
                borderBottomLeftRadius: 4,
            };
        }
    }, [isOwn, themeMode]);

    const containerStyle = useMemo(() => {
        return {
            width: '100%',
            flexDirection: isOwn ? 'row-reverse' : 'row',
            alignItems: 'flex-end',
        };
    }, [isOwn]);

    const handleBubblePress = () => {
        if (onPress) {
            onPress(message);
        }
    };

    const handleBubbleLongPress = () => {
        if (onLongPress) {
            onLongPress(message);
        }
    };

    const renderMessageContent = () => {
        return (
            <MessageRenderer
                message={message}
                isOwn={isOwn}
                theme={theme}
            />
        );
    };

    const renderAttachment = () => {
        if (!message.attachments || message.attachments.length === 0) {
            return null;
        }

        return (
            <View style={styles.attachmentContainer}>
                {message.attachments.map((attachment, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.attachmentItem}
                        onPress={() => handleAttachmentPress(attachment)}
                    >
                        {attachment.type === 'image' && (
                            <Image
                                source={{ uri: attachment.uri }}
                                style={styles.attachmentImage}
                                resizeMode="cover"
                            />
                        )}
                        {attachment.type === 'video' && (
                            <View style={styles.videoContainer}>
                                <Ionicons name="play-circle" size={40} color="#fff" />
                                <Text style={styles.videoText}>Video</Text>
                            </View>
                        )}
                        {attachment.type === 'audio' && (
                            <View style={styles.audioContainer}>
                                <MaterialCommunityIcons name="microphone" size={24} color="#fff" />
                                <Text style={styles.audioText}>Audio Message</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    const renderLocation = () => {
        if (!message.location) {
            return null;
        }

        return (
            <TouchableOpacity style={styles.locationContainer} onPress={() => handleLocationPress()}>
                <Ionicons name="location" size={16} color="#007AFF" />
                <Text style={styles.locationText} numberOfLines={2}>
                    {message.location.name || `${message.location.latitude}, ${message.location.longitude}`}
                </Text>
            </TouchableOpacity>
        );
    };

    const renderTimestamp = () => {
        return (
            <View style={styles.timestampContainer}>
                <Text style={styles.timestamp}>
                    {formatTimestamp(message.timestamp)}
                </Text>
                {isOwn && (
                    <MessageStatusIndicator
                        status={message.status}
                        size={12}
                    />
                )}
            </View>
        );
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);

        if (diffInHours < 24) {
            return date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        } else {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        }
    };

    const handleAttachmentPress = (attachment) => {
        // Handle attachment press
        console.log('Attachment pressed:', attachment);
    };

    const handleLocationPress = () => {
        // Handle location press
        console.log('Location pressed:', message.location);
    };

    const bubbleContent = (
        <View style={containerStyle}>
            <TouchableOpacity
                style={bubbleStyle}
                onPress={handleBubblePress}
                onLongPress={handleBubbleLongPress}
                activeOpacity={0.8}
            >
                {renderMessageContent()}
                {renderAttachment()}
                {renderLocation()}
                {renderTimestamp()}
            </TouchableOpacity>
        </View>
    );

    if (animation) {
        return (
            <Animated.View style={{ transform: [{ scale: animation }] }}>
                {bubbleContent}
            </Animated.View>
        );
    }

    return bubbleContent;
});

CustomChatBubble.displayName = 'CustomChatBubble';

const styles = StyleSheet.create({
    container: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    attachmentContainer: {
        marginTop: 8,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    attachmentItem: {
        borderRadius: 8,
        overflow: 'hidden',
    },
    attachmentImage: {
        width: 100,
        height: 100,
        borderRadius: 8,
    },
    videoContainer: {
        width: 120,
        height: 80,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
    },
    videoText: {
        color: '#fff',
        marginTop: 4,
        fontSize: 12,
    },
    audioContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#007AFF',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    audioText: {
        color: '#fff',
        marginLeft: 8,
        fontSize: 14,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        padding: 8,
        backgroundColor: 'rgba(0, 122, 255, 0.1)',
        borderRadius: 8,
    },
    locationText: {
        marginLeft: 8,
        color: '#007AFF',
        fontSize: 14,
        flex: 1,
    },
    timestampContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    timestamp: {
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.7)',
        marginRight: 4,
    },
});

export default CustomChatBubble;