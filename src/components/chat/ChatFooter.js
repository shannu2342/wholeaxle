import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Colors from '../../constants/Colors';

const ChatFooter = ({ activeFilter, onFilterChange }) => {
    const filters = [
        { key: 'Chats', label: 'Chats', icon: 'chat' },
        { key: 'Your Offers', label: 'Your Offers', icon: 'card-giftcard' },
        { key: 'Sent', label: 'Sent', icon: 'send' },
        { key: 'Received', label: 'Received', icon: 'markunread-mailbox' },
        { key: 'Support', label: 'Support', icon: 'support-agent' },
    ];

    const getFilterCount = (filterKey) => {
        // This would be connected to actual data counts
        switch (filterKey) {
            case 'Chats':
                return 12; // Mock count
            case 'Your Offers':
                return 3;
            case 'Sent':
                return 8;
            case 'Received':
                return 5;
            case 'Support':
                return 1;
            default:
                return 0;
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Messages & Offers</Text>
                <Text style={styles.subtitle}>Manage your B2B communications</Text>
            </View>

            <View style={styles.filterContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterScrollContent}
                >
                    {filters.map((filter) => {
                        const isActive = activeFilter === filter.key;
                        const count = getFilterCount(filter.key);

                        return (
                            <TouchableOpacity
                                key={filter.key}
                                style={[styles.filterChip, isActive && styles.activeFilterChip]}
                                onPress={() => onFilterChange(filter.key)}
                            >
                                <Icon
                                    name={filter.icon}
                                    size={16}
                                    color={isActive ? Colors.primary : Colors.text.secondary}
                                    style={styles.filterIcon}
                                />
                                <Text style={[styles.filterText, isActive && styles.activeFilterText]}>
                                    {filter.label}
                                </Text>
                                {count > 0 && (
                                    <View style={[styles.countBadge, isActive && styles.activeCountBadge]}>
                                        <Text style={[styles.countText, isActive && styles.activeCountText]}>
                                            {count > 99 ? '99+' : count}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.white,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    header: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.text.primary,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: Colors.text.secondary,
        marginBottom: 12,
    },
    filterContainer: {
        paddingBottom: 12,
    },
    filterScrollContent: {
        paddingHorizontal: 16,
        paddingVertical: 4,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 12,
        borderRadius: 20,
        backgroundColor: Colors.lightGray,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    activeFilterChip: {
        backgroundColor: Colors.primaryLight,
        borderColor: Colors.primary,
    },
    filterIcon: {
        marginRight: 6,
    },
    filterText: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.text.secondary,
    },
    activeFilterText: {
        color: Colors.primary,
        fontWeight: '600',
    },
    countBadge: {
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: Colors.mediumGray,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 6,
    },
    activeCountBadge: {
        backgroundColor: Colors.primary,
    },
    countText: {
        fontSize: 10,
        fontWeight: '600',
        color: Colors.white,
        textAlign: 'center',
    },
    activeCountText: {
        color: Colors.white,
    },
});

export default ChatFooter;