import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';

const ErrorIcon = ({ size = 50, color = '#FF0000' }) => {
    // Try to render SVG first, with fallback if it fails
    try {
        return (
            <Svg width={size} height={size} viewBox="0 0 100 100">
                <Defs>
                    <LinearGradient id="errorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor={color} />
                        <Stop offset="100%" stopColor="#CC0000" />
                    </LinearGradient>
                </Defs>
                <Circle cx="50" cy="50" r="40" fill="url(#errorGradient)" />
                <SvgText x="50" y="55" fontFamily="System" fontSize="30" fontWeight="bold" fill="white" textAnchor="middle">X</SvgText>
            </Svg>
        );
    } catch (error) {
        console.warn('SVG rendering failed, using fallback:', error.message);
        return (
            <View style={[styles.fallbackContainer, { width: size, height: size }]}>
                <View style={[styles.fallbackCircle, { backgroundColor: color }]}>
                    <Text style={styles.fallbackText}>X</Text>
                </View>
            </View>
        );
    }
};

const styles = StyleSheet.create({
    fallbackContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    fallbackCircle: {
        width: '100%',
        height: '100%',
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fallbackText: {
        color: 'white',
        fontSize: 30,
        fontWeight: 'bold',
    },
});

export default ErrorIcon;