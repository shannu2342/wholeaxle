import React, { useState, useRef, useEffect, memo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Dimensions,
    PermissionsAndroid,
    Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';

const { width: screenWidth } = Dimensions.get('window');

const VoiceRecorder = memo(({
    onRecordComplete,
    onCancel,
    maxDuration = 300, // 5 minutes in seconds
}) => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [recordingUri, setRecordingUri] = useState(null);

    const recorderPlayerRef = useRef(new AudioRecorderPlayer());
    const soundRef = useRef(null);
    const intervalRef = useRef(null);

    const pulseAnimation = useRef(new Animated.Value(1)).current;
    const waveformAnimation = useRef(new Animated.Value(0)).current;

    const requestMicrophonePermission = async () => {
        if (Platform.OS !== 'android') {
            return true;
        }

        const result = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
        );
        if (result !== PermissionsAndroid.RESULTS.GRANTED) {
            alert('Microphone permission is required to record audio messages.');
            return false;
        }
        return true;
    };

    const startRecording = async () => {
        try {
            const hasPermission = await requestMicrophonePermission();
            if (!hasPermission) return;

            const uri = await recorderPlayerRef.current.startRecorder();
            setRecordingUri(uri);
            recorderPlayerRef.current.removeRecordBackListener();
            recorderPlayerRef.current.addRecordBackListener((event) => {
                const seconds = Math.floor(event.currentPosition / 1000);
                setRecordingDuration(seconds);
                if (seconds >= maxDuration) {
                    stopRecording();
                }
            });
            setIsRecording(true);
            setRecordingDuration(0);

            // Start pulse animation
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnimation, {
                        toValue: 1.2,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnimation, {
                        toValue: 1,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                ])
            ).start();

            // Start duration timer
        } catch (error) {
            console.error('Failed to start recording:', error);
            alert('Failed to start recording. Please try again.');
        }
    };

    const stopRecording = async () => {
        try {
            if (isRecording) {
                const duration = recordingDuration;
                const uri = await recorderPlayerRef.current.stopRecorder();
                recorderPlayerRef.current.removeRecordBackListener();
                setRecordingUri(uri);

                // Clean up recording
                setIsRecording(false);
                setRecordingDuration(0);

                // Stop animations
                pulseAnimation.stopAnimation();
                pulseAnimation.setValue(1);

                // Clear timer
                // Call completion handler
                if (onRecordComplete && uri) {
                    onRecordComplete(uri, duration);
                }
            }
        } catch (error) {
            console.error('Failed to stop recording:', error);
            alert('Failed to stop recording. Please try again.');
        }
    };

    const cancelRecording = () => {
        if (isRecording) {
            recorderPlayerRef.current.stopRecorder();
            recorderPlayerRef.current.removeRecordBackListener();
        }

        // Clean up
        setIsRecording(false);
        setRecordingDuration(0);
        setRecordingUri(null);

        // Stop animations
        pulseAnimation.stopAnimation();
        pulseAnimation.setValue(1);

        // Clear timer
        if (onCancel) {
            onCancel();
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const renderWaveform = () => {
        const bars = Array.from({ length: 20 }, (_, i) => (
            <Animated.View
                key={i}
                style={[
                    styles.waveformBar,
                    {
                        height: waveformAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [8, 32],
                        }),
                    },
                ]}
            />
        ));

        return <View style={styles.waveformContainer}>{bars}</View>;
    };

    return (
        <View style={styles.container}>
            <View style={styles.recordingContainer}>
                <View style={styles.header}>
                    <Text style={styles.recordingText}>
                        {isRecording ? 'Recording...' : 'Voice Message'}
                    </Text>
                    <Text style={styles.durationText}>
                        {formatTime(recordingDuration)}
                    </Text>
                </View>

                {isRecording && (
                    <Animated.View style={[styles.pulseContainer, { transform: [{ scale: pulseAnimation }] }]}>
                        <View style={styles.pulseCircle}>
                            <MaterialCommunityIcons name="microphone" size={32} color="#fff" />
                        </View>
                    </Animated.View>
                )}

                <View style={styles.controls}>
                    <TouchableOpacity
                        style={[styles.button, styles.cancelButton]}
                        onPress={cancelRecording}
                    >
                        <Ionicons name="close" size={24} color="#fff" />
                        <Text style={styles.buttonText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.button,
                            styles.recordButton,
                            isRecording && styles.recordingButton
                        ]}
                        onPress={isRecording ? stopRecording : startRecording}
                    >
                        <Ionicons
                            name={isRecording ? "stop" : "mic"}
                            size={24}
                            color="#fff"
                        />
                        <Text style={styles.buttonText}>
                            {isRecording ? 'Stop' : 'Record'}
                        </Text>
                    </TouchableOpacity>

                    {recordingDuration > 0 && (
                        <TouchableOpacity
                            style={[styles.button, styles.sendButton]}
                            onPress={() => onRecordComplete(recordingUri, recordingDuration)}
                            disabled={!recordingUri}
                        >
                            <Ionicons name="send" size={24} color="#fff" />
                            <Text style={styles.buttonText}>Send</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {isRecording && renderWaveform()}
            </View>
        </View>
    );
});

VoiceRecorder.displayName = 'VoiceRecorder';

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
    },
    recordingContainer: {
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginBottom: 20,
    },
    recordingText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
    },
    durationText: {
        fontSize: 16,
        color: '#007AFF',
        fontWeight: '500',
    },
    pulseContainer: {
        marginBottom: 20,
    },
    pulseCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FF3B30',
        justifyContent: 'center',
        alignItems: 'center',
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginBottom: 20,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 25,
        minWidth: 80,
        justifyContent: 'center',
    },
    cancelButton: {
        backgroundColor: '#8E8E93',
    },
    recordButton: {
        backgroundColor: '#007AFF',
    },
    recordingButton: {
        backgroundColor: '#FF3B30',
    },
    sendButton: {
        backgroundColor: '#34C759',
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
        marginLeft: 8,
    },
    waveformContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 40,
        width: '100%',
    },
    waveformBar: {
        width: 3,
        backgroundColor: '#007AFF',
        marginHorizontal: 1,
        borderRadius: 2,
    },
});

export default VoiceRecorder;
