import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';

const MessageStatusIndicator = memo(({
    status = 'sent',
    size = 16,
    style,
}) => {
    const themeMode = useSelector(state => state.theme?.mode || 'light');

    const getIconName = () => {
        switch (status) {
            case 'pending':
                return 'time-outline';
            case 'sent':
                return 'checkmark-outline';
            case 'delivered':
                return 'checkmark-done-outline';
            case 'read':
                return 'checkmark-done';
            case 'failed':
                return 'alert-circle-outline';
            default:
                return 'checkmark-outline';
        }
    };

    const getIconColor = () => {
        switch (status) {
            case 'pending':
                return themeMode === 'dark' ? '#8E8E93' : '#8E8E93';
            case 'sent':
                return themeMode === 'dark' ? '#8E8E93' : '#8E8E93';
            case 'delivered':
                return themeMode === 'dark' ? '#8E8E93' : '#8E8E93';
            case 'read':
                return '#007AFF';
            case 'failed':
                return '#FF3B30';
            default:
                return themeMode === 'dark' ? '#8E8E93' : '#8E8E93';
        }
    };

    return (
        <View style={[styles.container, style]}>
            <Ionicons
                name={getIconName()}
                size={size}
                color={getIconColor()}
            />
        </View>
    );
});

MessageStatusIndicator.displayName = 'MessageStatusIndicator';

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default MessageStatusIndicator;