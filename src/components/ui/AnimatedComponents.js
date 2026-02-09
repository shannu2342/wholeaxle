import React, { useRef, useEffect, memo } from 'react';
import {
    View,
    Text,
    Animated,
    StyleSheet,
    Dimensions,
} from 'react-native';
import Loader from '../../components/svg/Loader';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Fade In Animation
export const FadeInView = memo(({
    children,
    duration = 300,
    delay = 0,
    style,
    ...props
}) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const timer = setTimeout(() => {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration,
                useNativeDriver: true,
            }).start();
        }, delay);

        return () => clearTimeout(timer);
    }, [fadeAnim, duration, delay]);

    return (
        <Animated.View
            style={[
                style,
                {
                    opacity: fadeAnim,
                },
            ]}
            {...props}
        >
            {children}
        </Animated.View>
    );
});

FadeInView.displayName = 'FadeInView';

// Slide In Animation (from bottom)
export const SlideInView = memo(({
    children,
    duration = 300,
    delay = 0,
    style,
    ...props
}) => {
    const slideAnim = useRef(new Animated.Value(50)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const timer = setTimeout(() => {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration,
                    useNativeDriver: true,
                }),
            ]).start();
        }, delay);

        return () => clearTimeout(timer);
    }, [slideAnim, fadeAnim, duration, delay]);

    return (
        <Animated.View
            style={[
                style,
                {
                    transform: [{ translateY: slideAnim }],
                    opacity: fadeAnim,
                },
            ]}
            {...props}
        >
            {children}
        </Animated.View>
    );
});

SlideInView.displayName = 'SlideInView';

// Slide In from Left
export const SlideInLeft = memo(({
    children,
    duration = 300,
    delay = 0,
    style,
    ...props
}) => {
    const slideAnim = useRef(new Animated.Value(-screenWidth)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const timer = setTimeout(() => {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration,
                    useNativeDriver: true,
                }),
            ]).start();
        }, delay);

        return () => clearTimeout(timer);
    }, [slideAnim, fadeAnim, duration, delay]);

    return (
        <Animated.View
            style={[
                style,
                {
                    transform: [{ translateX: slideAnim }],
                    opacity: fadeAnim,
                },
            ]}
            {...props}
        >
            {children}
        </Animated.View>
    );
});

SlideInLeft.displayName = 'SlideInLeft';

// Slide In from Right
export const SlideInRight = memo(({
    children,
    duration = 300,
    delay = 0,
    style,
    ...props
}) => {
    const slideAnim = useRef(new Animated.Value(screenWidth)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const timer = setTimeout(() => {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration,
                    useNativeDriver: true,
                }),
            ]).start();
        }, delay);

        return () => clearTimeout(timer);
    }, [slideAnim, fadeAnim, duration, delay]);

    return (
        <Animated.View
            style={[
                style,
                {
                    transform: [{ translateX: slideAnim }],
                    opacity: fadeAnim,
                },
            ]}
            {...props}
        >
            {children}
        </Animated.View>
    );
});

SlideInRight.displayName = 'SlideInRight';

// Scale Animation (for buttons, modals, etc.)
export const ScaleView = memo(({
    children,
    duration = 200,
    delay = 0,
    style,
    ...props
}) => {
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const timer = setTimeout(() => {
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    duration,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: duration * 0.7,
                    useNativeDriver: true,
                }),
            ]).start();
        }, delay);

        return () => clearTimeout(timer);
    }, [scaleAnim, fadeAnim, duration, delay]);

    return (
        <Animated.View
            style={[
                style,
                {
                    transform: [{ scale: scaleAnim }],
                    opacity: fadeAnim,
                },
            ]}
            {...props}
        >
            {children}
        </Animated.View>
    );
});

ScaleView.displayName = 'ScaleView';

// Bounce Animation
export const BounceView = memo(({
    children,
    style,
    onPress,
    disabled = false,
    ...props
}) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePress = () => {
        if (disabled || !onPress) return;

        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 0.95,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start();

        onPress();
    };

    return (
        <Animated.View
            style={[
                style,
                {
                    transform: [{ scale: scaleAnim }],
                },
            ]}
            onTouchStart={handlePress}
            {...props}
        >
            {children}
        </Animated.View>
    );
});

BounceView.displayName = 'BounceView';

// Pulse Animation (for loading states)
export const PulseView = memo(({
    children,
    style,
    duration = 1000,
    ...props
}) => {
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: duration / 2,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: duration / 2,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        return () => pulseAnim.removeAllListeners();
    }, [pulseAnim, duration]);

    return (
        <Animated.View
            style={[
                style,
                {
                    transform: [{ scale: pulseAnim }],
                },
            ]}
            {...props}
        >
            {children}
        </Animated.View>
    );
});

PulseView.displayName = 'PulseView';

// Shake Animation (for errors)
export const ShakeView = memo(({
    children,
    style,
    trigger,
    ...props
}) => {
    const shakeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (trigger) {
            Animated.sequence([
                Animated.timing(shakeAnim, {
                    toValue: 10,
                    duration: 50,
                    useNativeDriver: true,
                }),
                Animated.timing(shakeAnim, {
                    toValue: -10,
                    duration: 50,
                    useNativeDriver: true,
                }),
                Animated.timing(shakeAnim, {
                    toValue: 5,
                    duration: 50,
                    useNativeDriver: true,
                }),
                Animated.timing(shakeAnim, {
                    toValue: 0,
                    duration: 50,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [shakeAnim, trigger]);

    return (
        <Animated.View
            style={[
                style,
                {
                    transform: [{ translateX: shakeAnim }],
                },
            ]}
            {...props}
        >
            {children}
        </Animated.View>
    );
});

ShakeView.displayName = 'ShakeView';

// Message Animation (for chat bubbles)
export const MessageAnimation = memo(({
    children,
    isOwn,
    style,
    ...props
}) => {
    const translateX = useRef(new Animated.Value(isOwn ? 50 : -50)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(translateX, {
                toValue: 0,
                tension: 100,
                friction: 8,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start();
    }, [translateX, opacity, isOwn]);

    return (
        <Animated.View
            style={[
                style,
                {
                    transform: [{ translateX }],
                    opacity,
                },
            ]}
            {...props}
        >
            {children}
        </Animated.View>
    );
});

MessageAnimation.displayName = 'MessageAnimation';

// Loading Spinner with Animation
export const LoadingSpinner = memo(({
    size = 'large',
    color = '#007AFF',
    style,
}) => {
    return (
        <View style={[styles.spinnerContainer, style]}>
            <Loader size={size === 'large' ? 50 : 30} color={color} />
        </View>
    );
});

LoadingSpinner.displayName = 'LoadingSpinner';

const styles = StyleSheet.create({
    spinnerContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    spinner: {
        borderWidth: 3,
        borderRadius: 20,
    },
});

// Export all animated components
const AnimatedComponents = {
    FadeInView,
    SlideInView,
    SlideInLeft,
    SlideInRight,
    ScaleView,
    BounceView,
    PulseView,
    ShakeView,
    MessageAnimation,
    LoadingSpinner,
};

export default AnimatedComponents;