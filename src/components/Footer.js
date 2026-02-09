import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Colors } from '../constants/Colors';

const DEFAULT_ITEMS = [
    {
        id: 'home',
        label: 'Home',
        icon: 'home',
        screen: 'Home',
    },
    {
        id: 'products',
        label: 'Products',
        icon: 'shopping-bag',
        screen: 'Products',
    },
    {
        id: 'categories',
        label: 'Categories',
        icon: 'th-large',
        screen: 'Categories',
    },
    {
        id: 'cart',
        label: 'Cart',
        icon: 'shopping-cart',
        screen: 'Cart',
    },
    {
        id: 'profile',
        label: 'Profile',
        icon: 'user',
        screen: 'Profile',
    },
];

const Footer = ({ navigation, activeTab, items }) => {
    const footerItems = items?.length ? items : DEFAULT_ITEMS;

    const getRouteNames = (nav) => nav?.getState?.()?.routeNames || [];

    const handleNavigate = (item) => {
        if (!item?.screen || !navigation?.navigate) {
            return;
        }

        const routeNames = getRouteNames(navigation);
        if (routeNames.includes(item.screen)) {
            navigation.navigate(item.screen, item.params);
            return;
        }

        const parent = navigation.getParent?.();
        const parentRouteNames = getRouteNames(parent);
        if (parentRouteNames.includes(item.screen)) {
            parent.navigate(item.screen, item.params);
            return;
        }

        console.warn(`Footer route not found: ${item.screen}`);
    };

    // Udaan-like footer button styling
    const getFooterButtonStyle = (itemId) => {
        if (activeTab === itemId) {
            return {
                backgroundColor: Colors.primary,
                borderRadius: Colors.borderRadius.circle,
                padding: Colors.spacing.md,
            };
        }
        return {
            backgroundColor: 'transparent',
            padding: Colors.spacing.md,
        };
    };

    const getFooterTextStyle = (itemId) => {
        if (activeTab === itemId) {
            return {
                color: Colors.white,
                fontWeight: Colors.fontWeight.semibold,
            };
        }
        return {
            color: Colors.text.secondary,
            fontWeight: Colors.fontWeight.normal,
        };
    };

    return (
        <View style={styles.footerContainer}>
            {footerItems.map((item) => (
                <TouchableOpacity
                    key={item.id}
                    style={[styles.footerItem, getFooterButtonStyle(item.id)]}
                    onPress={() => handleNavigate(item)}
                >
                    <View style={styles.footerItemContent}>
                        <Icon
                            name={item.icon}
                            size={24}
                            color={activeTab === item.id ? Colors.white : Colors.text.secondary}
                        />
                        <Text
                            style={[styles.footerItemText, getFooterTextStyle(item.id)]}
                        >
                            {item.label}
                        </Text>
                    </View>
                </TouchableOpacity>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    footerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: Colors.white,
        paddingVertical: Colors.spacing.sm,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        ...Colors.shadows.medium,
        height: 60,
    },
    footerItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Colors.spacing.sm,
        borderRadius: Colors.borderRadius.circle,
    },
    footerItemContent: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
    },
    footerItemText: {
        fontSize: Colors.fontSize.sm,
        color: Colors.text.secondary,
        marginTop: Colors.spacing.xs,
        textAlign: 'center',
    },
    activeFooterItemText: {
        color: Colors.primary,
        fontWeight: Colors.fontWeight.semibold,
    },
});

export default Footer;
