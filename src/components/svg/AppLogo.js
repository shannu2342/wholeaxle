import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';

const AppLogo = ({ size = 50, color = '#0390F3' }) => {
    // Try to render SVG first, with fallback if it fails
    try {
        return (
            <Svg width={size} height={size} viewBox="0 0 100 100">
                <Defs>
                    <LinearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor={color} />
                        <Stop offset="100%" stopColor="#007AFF" />
                    </LinearGradient>
                </Defs>
                <Circle cx="50" cy="50" r="40" fill="url(#logoGradient)" />
                <SvgText x="50" y="55" fontFamily="System" fontSize="20" fontWeight="bold" fill="white" textAnchor="middle">W</SvgText>
            </Svg>
        );
    } catch (error) {
        console.warn('SVG rendering failed, using fallback:', error.message);
        return (
            <View style={[styles.fallbackContainer, { width: size, height: size }]}>
                <View style={[styles.fallbackCircle, { backgroundColor: color }]}>
                    <Text style={styles.fallbackText}>W</Text>
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
        fontSize: 20,
        fontWeight: 'bold',
    },
});

export default AppLogo;