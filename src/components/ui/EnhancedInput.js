import React, { useState, useRef, useCallback, useEffect, memo } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Keyboard,
    Animated,
    Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSelector, useDispatch } from 'react-redux';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import DocumentPicker from 'react-native-document-picker';

// Import components
import VoiceRecorder from './VoiceRecorder';
import MediaGallery from './MediaGallery';

const { width: screenWidth } = Dimensions.get('window');

const EnhancedInput = memo(({
    onSendMessage,
    placeholder = "Type a message...",
    onOfferCreate,
    onFileUpload,
    disabled = false,
}) => {
    const dispatch = useDispatch();
    const themeMode = useSelector(state => state.theme?.mode || 'light');
    const user = useSelector(state => state.auth.user);

    const [message, setMessage] = useState('');
    const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [offerMode, setOfferMode] = useState(false);

    const textInputRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    const attachmentOpacity = useRef(new Animated.Value(0)).current;
    const sendButtonScale = useRef(new Animated.Value(1)).current;

    const handleTextChange = (text) => {
        setMessage(text);

        // Start typing indicator
        if (text.length > 0 && !isTyping) {
            setIsTyping(true);
            dispatch({ type: 'chat/setTyping', payload: true });
        }

        // Clear previous timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Stop typing indicator after 2 seconds of inactivity
        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            dispatch({ type: 'chat/setTyping', payload: false });
        }, 2000);
    };

    const handleSend = useCallback(() => {
        if (message.trim() === '') return;

        const messageData = {
            type: 'text',
            content: { text: message.trim() },
            timestamp: Date.now(),
            senderId: user?.id,
            status: 'pending',
        };

        onSendMessage(messageData);
        setMessage('');
        setOfferMode(false);

        // Stop typing indicator
        if (isTyping) {
            setIsTyping(false);
            dispatch({ type: 'chat/setTyping', payload: false });
        }
    }, [message, user, isTyping, onSendMessage, dispatch]);

    const handleOfferMode = () => {
        setOfferMode(!offerMode);
        if (!offerMode) {
            Keyboard.dismiss();
        }
    };

    const handleMediaPick = async (type) => {
        try {
            let result = null;

            if (type === 'camera') {
                result = await launchCamera({
                    mediaType: 'photo',
                    quality: 0.8,
                    saveToPhotos: false,
                });
            } else if (type === 'gallery') {
                result = await launchImageLibrary({
                    mediaType: 'photo',
                    quality: 0.8,
                    selectionLimit: 1,
                });
            } else if (type === 'document') {
                const doc = await DocumentPicker.pickSingle({
                    type: [
                        DocumentPicker.types.pdf,
                        DocumentPicker.types.plainText,
                        DocumentPicker.types.doc,
                        DocumentPicker.types.docx,
                    ],
                    copyTo: 'cachesDirectory',
                });
                result = {
                    assets: [{
                        uri: doc.fileCopyUri || doc.uri,
                        fileName: doc.name,
                        fileSize: doc.size,
                        type: doc.type,
                    }],
                };
            }

            if (result?.didCancel) {
                setShowAttachmentOptions(false);
                return;
            }

            if (result?.assets?.length > 0) {
                const asset = result.assets[0];
                const attachment = {
                    type: type === 'document' ? 'document' : 'image',
                    uri: asset.uri,
                    name: asset.fileName || asset.uri.split('/').pop(),
                    size: asset.fileSize,
                    mimeType: asset.type,
                };

                if (onFileUpload) {
                    onFileUpload(attachment);
                }
            }

            setShowAttachmentOptions(false);
        } catch (error) {
            if (DocumentPicker.isCancel?.(error)) {
                setShowAttachmentOptions(false);
                return;
            }
            console.error('Error picking media:', error);
            alert('Error selecting media. Please try again.');
        }
    };

    const handleVoiceRecord = (audioUri, duration) => {
        const audioMessage = {
            type: 'audio',
            content: { text: 'Voice message' },
            attachments: [{
                type: 'audio',
                uri: audioUri,
                duration: duration,
            }],
            timestamp: Date.now(),
            senderId: user?.id,
            status: 'pending',
        };

        onSendMessage(audioMessage);
    };

    const animateAttachmentOptions = () => {
        Animated.timing(attachmentOpacity, {
            toValue: showAttachmentOptions ? 1 : 0,
            duration: 200,
            useNativeDriver: true,
        }).start();
    };

    const animateSendButton = () => {
        Animated.spring(sendButtonScale, {
            toValue: message.trim() ? 1.1 : 1,
            useNativeDriver: true,
        }).start();
    };

    useEffect(() => {
        animateAttachmentOptions();
    }, [showAttachmentOptions]);

    useEffect(() => {
        animateSendButton();
    }, [message]);

    const renderAttachmentOptions = () => {
        if (!showAttachmentOptions) return null;

        return (
            <Animated.View
                style={[
                    styles.attachmentOptions,
                    { opacity: attachmentOpacity }
                ]}
            >
                <TouchableOpacity
                    style={styles.attachmentOption}
                    onPress={() => handleMediaPick('camera')}
                >
                    <Ionicons name="camera" size={24} color="#007AFF" />
                    <Text style={styles.attachmentOptionText}>Camera</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.attachmentOption}
                    onPress={() => handleMediaPick('gallery')}
                >
                    <Ionicons name="image" size={24} color="#007AFF" />
                    <Text style={styles.attachmentOptionText}>Gallery</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.attachmentOption}
                    onPress={() => handleMediaPick('document')}
                >
                    <MaterialCommunityIcons name="file-document" size={24} color="#007AFF" />
                    <Text style={styles.attachmentOptionText}>Document</Text>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <View style={styles.container}>
            {offerMode && (
                <View style={styles.offerModeContainer}>
                    <TouchableOpacity
                        style={styles.offerModeButton}
                        onPress={() => setOfferMode(false)}
                    >
                        <Text style={styles.offerModeButtonText}>Back to Chat</Text>
                    </TouchableOpacity>
                </View>
            )}

            <View style={styles.inputContainer}>
                <TouchableOpacity
                    style={styles.attachmentButton}
                    onPress={() => setShowAttachmentOptions(!showAttachmentOptions)}
                    disabled={disabled}
                >
                    <Ionicons
                        name="attach"
                        size={24}
                        color={disabled ? '#C7C7CC' : '#007AFF'}
                    />
                </TouchableOpacity>

                <View style={styles.textInputContainer}>
                    <TextInput
                        ref={textInputRef}
                        style={[
                            styles.textInput,
                            {
                                color: themeMode === 'dark' ? '#FFFFFF' : '#000000',
                                backgroundColor: themeMode === 'dark' ? '#2C2C2E' : '#F0F0F0'
                            }
                        ]}
                        value={message}
                        onChangeText={handleTextChange}
                        placeholder={placeholder}
                        placeholderTextColor={themeMode === 'dark' ? '#8E8E93' : '#8E8E93'}
                        multiline
                        maxLength={1000}
                        editable={!disabled && !offerMode}
                        onSubmitEditing={handleSend}
                        returnKeyType="send"
                    />
                </View>

                <TouchableOpacity
                    style={styles.offerButton}
                    onPress={handleOfferMode}
                    disabled={disabled}
                >
                    <MaterialCommunityIcons
                        name="handshake"
                        size={24}
                        color={disabled ? '#C7C7CC' : offerMode ? '#FF9500' : '#007AFF'}
                    />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.voiceButton}
                    onPress={() => setIsRecording(!isRecording)}
                    disabled={disabled}
                >
                    <Ionicons
                        name={isRecording ? "stop" : "mic"}
                        size={24}
                        color={disabled ? '#C7C7CC' : '#007AFF'}
                    />
                </TouchableOpacity>

                <Animated.View style={{ transform: [{ scale: sendButtonScale }] }}>
                    <TouchableOpacity
                        style={[
                            styles.sendButton,
                            { opacity: message.trim() ? 1 : 0.5 }
                        ]}
                        onPress={handleSend}
                        disabled={!message.trim() || disabled}
                    >
                        <Ionicons
                            name="send"
                            size={20}
                            color="#fff"
                        />
                    </TouchableOpacity>
                </Animated.View>
            </View>

            {renderAttachmentOptions()}

            {isRecording && (
                <VoiceRecorder
                    onRecordComplete={handleVoiceRecord}
                    onCancel={() => setIsRecording(false)}
                />
            )}

            <MediaGallery
                visible={showAttachmentOptions}
                onClose={() => setShowAttachmentOptions(false)}
                onMediaSelect={handleMediaPick}
            />
        </View>
    );
});

EnhancedInput.displayName = 'EnhancedInput';

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: 'transparent',
    },
    offerModeContainer: {
        marginBottom: 8,
    },
    offerModeButton: {
        backgroundColor: '#FF9500',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    offerModeButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: '#F0F0F0',
        borderRadius: 25,
        paddingHorizontal: 12,
        paddingVertical: 8,
        minHeight: 44,
    },
    attachmentButton: {
        padding: 8,
        marginRight: 4,
    },
    textInputContainer: {
        flex: 1,
        minHeight: 28,
        maxHeight: 120,
    },
    textInput: {
        fontSize: 16,
        lineHeight: 22,
        paddingVertical: 6,
        paddingHorizontal: 8,
        borderRadius: 16,
    },
    offerButton: {
        padding: 8,
        marginLeft: 4,
    },
    voiceButton: {
        padding: 8,
        marginLeft: 4,
    },
    sendButton: {
        backgroundColor: '#007AFF',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    attachmentOptions: {
        position: 'absolute',
        bottom: 60,
        right: 16,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 8,
        flexDirection: 'row',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
        gap: 16,
    },
    attachmentOption: {
        alignItems: 'center',
        padding: 8,
    },
    attachmentOptionText: {
        fontSize: 12,
        color: '#007AFF',
        marginTop: 4,
    },
});

export default EnhancedInput;
