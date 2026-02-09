import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Colors } from '../constants/Colors';

const BecomeVendorButton = ({ onPress }) => {
    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.button} onPress={onPress}>
                <Icon name="star" size={16} color="#fff" />
                <Text style={styles.buttonText}>Become a Vendor</Text>
            </TouchableOpacity>
            <Text style={styles.subtitle}>Expand your business by joining our marketplace</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        marginBottom: 20,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
        marginBottom: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    subtitle: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
});

export default BecomeVendorButton;