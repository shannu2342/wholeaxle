import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

const Loader = ({ size = 50, color = '#0390F3' }) => {
    // Try to render SVG first, with fallback if it fails
    try {
        return (
            <Svg width={size} height={size} viewBox="0 0 100 100">
                <Defs>
                    <LinearGradient id="loaderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor={color} />
                        <Stop offset="100%" stopColor="#007AFF" />
                    </LinearGradient>
                </Defs>
                <Circle cx="50" cy="50" r="40" fill="none" stroke="url(#loaderGradient)" strokeWidth="4" strokeDasharray="200" strokeDashoffset="100">
                    <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="1s" repeatCount="indefinite" />
                </Circle>
            </Svg>
        );
    } catch (error) {
        console.warn('SVG rendering failed, using fallback:', error.message);
        return (
            <View style={[styles.fallbackContainer, { width: size, height: size }]}>
                <ActivityIndicator size="large" color={color} />
            </View>
        );
    }
};

const styles = StyleSheet.create({
    fallbackContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default Loader;