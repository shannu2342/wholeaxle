import React, { memo, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    FlatList,
    Image,
    Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const MediaGallery = memo(({
    visible,
    onClose,
    onMediaSelect,
}) => {
    const [selectedMedia, setSelectedMedia] = useState(null);

    const mediaOptions = [
        {
            id: 'camera',
            title: 'Camera',
            icon: 'camera',
            action: () => onMediaSelect('camera'),
        },
        {
            id: 'gallery',
            title: 'Photo Gallery',
            icon: 'images',
            action: () => onMediaSelect('gallery'),
        },
        {
            id: 'document',
            title: 'Documents',
            icon: 'document-text',
            action: () => onMediaSelect('document'),
        },
    ];

    const renderMediaOption = ({ item }) => (
        <TouchableOpacity
            style={styles.mediaOption}
            onPress={item.action}
        >
            <View style={styles.iconContainer}>
                <Ionicons name={item.icon} size={32} color="#007AFF" />
            </View>
            <Text style={styles.mediaOptionText}>{item.title}</Text>
        </TouchableOpacity>
    );

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity style={styles.overlay} onPress={onClose}>
                <View style={styles.container}>
                    <View style={styles.content}>
                        <View style={styles.header}>
                            <Text style={styles.title}>Select Media</Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <Ionicons name="close" size={24} color="#8E8E93" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={mediaOptions}
                            renderItem={renderMediaOption}
                            keyExtractor={(item) => item.id}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.mediaList}
                        />
                    </View>
                </View>
            </TouchableOpacity>
        </Modal>
    );
});

MediaGallery.displayName = 'MediaGallery';

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        width: '80%',
        maxWidth: 400,
    },
    content: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
    },
    closeButton: {
        padding: 4,
    },
    mediaList: {
        paddingVertical: 8,
    },
    mediaOption: {
        alignItems: 'center',
        marginHorizontal: 16,
        padding: 16,
        backgroundColor: '#F0F0F0',
        borderRadius: 12,
        minWidth: 100,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    mediaOptionText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#007AFF',
        textAlign: 'center',
    },
});

export default MediaGallery;