import React, { useEffect, useRef, memo } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useSelector } from 'react-redux';

const TypingIndicator = memo(({
    userIds = [],
    style,
}) => {
    const themeMode = useSelector(state => state.theme?.mode || 'light');

    const dot1Opacity = useRef(new Animated.Value(0.4)).current;
    const dot2Opacity = useRef(new Animated.Value(0.4)).current;
    const dot3Opacity = useRef(new Animated.Value(0.4)).current;

    const createDotAnimation = (opacityRef, delay) => {
        return Animated.loop(
            Animated.sequence([
                Animated.timing(opacityRef, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityRef, {
                    toValue: 0.4,
                    duration: 400,
                    useNativeDriver: true,
                }),
            ]),
            { iterations: -1, delay }
        );
    };

    useEffect(() => {
        const animation1 = createDotAnimation(dot1Opacity, 0);
        const animation2 = createDotAnimation(dot2Opacity, 200);
        const animation3 = createDotAnimation(dot3Opacity, 400);

        animation1.start();
        animation2.start();
        animation3.start();

        return () => {
            animation1.stop();
            animation2.stop();
            animation3.stop();
        };
    }, []);

    const renderTypingUsers = () => {
        if (userIds.length === 0) return null;

        if (userIds.length === 1) {
            return <Text style={styles.typingText}>Someone is typing...</Text>;
        } else if (userIds.length === 2) {
            return <Text style={styles.typingText}>Two people are typing...</Text>;
        } else {
            return <Text style={styles.typingText}>{userIds.length} people are typing...</Text>;
        }
    };

    return (
        <View style={[styles.container, style]}>
            <View style={[
                styles.typingBubble,
                {
                    backgroundColor: themeMode === 'dark' ? '#2C2C2E' : '#F0F0F0',
                    borderBottomLeftRadius: 4,
                }
            ]}>
                <View style={styles.dotsContainer}>
                    <Animated.View style={[styles.dot, { opacity: dot1Opacity }]} />
                    <Animated.View style={[styles.dot, { opacity: dot2Opacity }]} />
                    <Animated.View style={[styles.dot, { opacity: dot3Opacity }]} />
                </View>
                {renderTypingUsers()}
            </View>
        </View>
    );
});

TypingIndicator.displayName = 'TypingIndicator';

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginVertical: 4,
        marginHorizontal: 8,
    },
    typingBubble: {
        maxWidth: '70%',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    dotsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 8,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#8E8E93',
        marginHorizontal: 1,
    },
    typingText: {
        fontSize: 14,
        color: '#8E8E93',
        fontStyle: 'italic',
    },
});

export default TypingIndicator;