import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

// Import existing components
import OfferBubble from '../offers/OfferBubble';
import SettlementBubble from '../finance/settlement/SettlementBubble';
import SystemMessage from '../system/SystemMessage';
import CreditAwareChat from '../finance/CreditAwareChat';

const MessageRenderer = memo(({
    message,
    isOwn,
    theme = 'light',
}) => {
    const renderMessageContent = () => {
        switch (message.type) {
            case 'offer':
                return <OfferBubble offer={message.content} />;

            case 'settlement':
                return <SettlementBubble settlement={message.content} />;

            case 'system':
                return <SystemMessage content={message.content} />;

            case 'financial':
                return <CreditAwareChat content={message.content} />;

            case 'text':
            default:
                return (
                    <Text style={[
                        styles.text,
                        { color: isOwn ? '#FFFFFF' : '#000000' }
                    ]}>
                        {message.content.text || message.content}
                    </Text>
                );
        }
    };

    const renderGradientOverlay = () => {
        if (message.type === 'system' || message.type === 'financial') {
            return (
                <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientOverlay}
                />
            );
        }
        return null;
    };

    return (
        <View style={styles.container}>
            {renderGradientOverlay()}
            <View style={styles.content}>
                {renderMessageContent()}
            </View>
        </View>
    );
});

MessageRenderer.displayName = 'MessageRenderer';

const styles = StyleSheet.create({
    container: {
        position: 'relative',
    },
    gradientOverlay: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 20,
        opacity: 0.1,
    },
    content: {
        position: 'relative',
        zIndex: 1,
    },
    text: {
        fontSize: 16,
        lineHeight: 22,
    },
});

export default MessageRenderer;
