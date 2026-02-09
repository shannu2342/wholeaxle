import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Image,
    Alert,
    Platform,
    StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Colors from '../../constants/Colors';

const ChatHeader = ({
    vendorName,
    vendorAvatar,
    onBack,
    onSearch,
    onCall,
    onVideoCall,
    onMore,
}) => {
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearchToggle = () => {
        if (isSearchActive && searchQuery.trim()) {
            // Perform search
            onSearch(searchQuery);
        }
        setIsSearchActive(!isSearchActive);
        if (!isSearchActive) {
            setSearchQuery('');
        }
    };

    const handleCall = () => {
        Alert.alert(
            'Voice Call',
            `Calling ${vendorName}...`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Call', onPress: () => console.log('Voice call initiated') }
            ]
        );
    };

    const handleVideoCall = () => {
        Alert.alert(
            'Video Call',
            `Starting video call with ${vendorName}...`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Start', onPress: () => console.log('Video call initiated') }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerContent}>
                <TouchableOpacity style={styles.backButton} onPress={onBack}>
                    <Icon name="arrow-back" size={24} color={Colors.white} />
                </TouchableOpacity>

                {isSearchActive ? (
                    <View style={styles.searchContainer}>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search messages..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoFocus
                        />
                        <TouchableOpacity style={styles.searchIcon} onPress={handleSearchToggle}>
                            <Icon name="close" size={20} color={Colors.text.secondary} />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.vendorInfo}>
                        <TouchableOpacity style={styles.avatarContainer}>
                            {vendorAvatar ? (
                                <Image source={{ uri: vendorAvatar }} style={styles.avatar} />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <Text style={styles.avatarText}>
                                        {vendorName?.charAt(0)?.toUpperCase() || 'V'}
                                    </Text>
                                </View>
                            )}
                            <View style={styles.onlineIndicator} />
                        </TouchableOpacity>

                        <View style={styles.vendorDetails}>
                            <Text style={styles.vendorName} numberOfLines={1}>
                                {vendorName || 'Vendor'}
                            </Text>
                            <Text style={styles.onlineStatus}>Online</Text>
                        </View>
                    </View>
                )}

                <View style={styles.actionButtons}>
                    {!isSearchActive && (
                        <>
                            <TouchableOpacity style={styles.actionButton} onPress={onSearch}>
                                <Icon name="search" size={22} color={Colors.white} />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
                                <Icon name="call" size={22} color={Colors.white} />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.actionButton} onPress={handleVideoCall}>
                                <Icon name="videocam" size={22} color={Colors.white} />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.actionButton} onPress={onMore}>
                                <Icon name="more-vert" size={22} color={Colors.white} />
                            </TouchableOpacity>
                        </>
                    )}

                    {isSearchActive && (
                        <TouchableOpacity style={styles.actionButton} onPress={handleSearchToggle}>
                            <Icon name="check" size={22} color={Colors.white} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.primary,
        paddingTop: Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight || 0) + 8,
        paddingBottom: 12,
        elevation: 2,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    backButton: {
        marginRight: 16,
        padding: 4,
    },
    vendorInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.white,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.primary,
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: Colors.success,
        borderWidth: 2,
        borderColor: Colors.white,
    },
    vendorDetails: {
        flex: 1,
    },
    vendorName: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.white,
        marginBottom: 2,
    },
    onlineStatus: {
        fontSize: 12,
        color: Colors.white,
        opacity: 0.8,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: Colors.dark,
        paddingVertical: 8,
    },
    searchIcon: {
        marginLeft: 8,
    },
    actionButtons: {
        flexDirection: 'row',
    },
    actionButton: {
        marginLeft: 16,
        padding: 4,
    },
});

export default ChatHeader;
