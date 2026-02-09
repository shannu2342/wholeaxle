import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import {
    initializeAI,
    scanImageForCompliance,
    analyzeImageSimilarity,
    extractImageFeatures
} from '../store/slices/aiSlice';
import Icon from 'react-native-vector-icons/FontAwesome';

/**
 * AI Integration Test Component
 * 
 * This component provides a testing interface to validate that all AI integrations
 * are working correctly. It can be used during development and testing phases.
 */
const AIIntegrationTest = ({ style }) => {
    const dispatch = useDispatch();
    const aiState = useSelector(state => state.ai);
    const [testResults, setTestResults] = useState([]);

    const addTestResult = (testName, success, message, details = null) => {
        const result = {
            id: Date.now(),
            testName,
            success,
            message,
            details,
            timestamp: new Date().toISOString()
        };
        setTestResults(prev => [result, ...prev]);
    };

    const testAIInitialization = async () => {
        try {
            if (aiState.isInitialized) {
                addTestResult('AI Initialization', true, 'AI services are already initialized');
                return;
            }

            await dispatch(initializeAI()).unwrap();
            addTestResult('AI Initialization', true, 'AI services initialized successfully');
        } catch (error) {
            addTestResult('AI Initialization', false, `Failed to initialize: ${error}`);
        }
    };

    const testComplianceScanning = async () => {
        try {
            if (!aiState.isInitialized) {
                addTestResult('Compliance Scanning', false, 'AI services not initialized');
                return;
            }

            // Create a simple test image (base64 encoded 1x1 pixel red image)
            const testImageUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

            const result = await dispatch(scanImageForCompliance({
                imageUri: testImageUri,
                imageType: 'test'
            })).unwrap();

            addTestResult('Compliance Scanning', true, 'Compliance scan completed', result);
        } catch (error) {
            addTestResult('Compliance Scanning', false, `Compliance scan failed: ${error}`);
        }
    };

    const testVisualSearch = async () => {
        try {
            if (!aiState.isInitialized) {
                addTestResult('Visual Search', false, 'AI services not initialized');
                return;
            }

            const testImageUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

            const result = await dispatch(analyzeImageSimilarity({
                queryImage: testImageUri,
                catalogImages: []
            })).unwrap();

            addTestResult('Visual Search', true, 'Visual search analysis completed', result);
        } catch (error) {
            addTestResult('Visual Search', false, `Visual search failed: ${error}`);
        }
    };

    const testFeatureExtraction = async () => {
        try {
            if (!aiState.isInitialized) {
                addTestResult('Feature Extraction', false, 'AI services not initialized');
                return;
            }

            const testImageUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

            const result = await dispatch(extractImageFeatures({
                imageUri: testImageUri,
                options: { includeColor: true, includeTexture: true }
            })).unwrap();

            addTestResult('Feature Extraction', true, 'Feature extraction completed', result);
        } catch (error) {
            addTestResult('Feature Extraction', false, `Feature extraction failed: ${error}`);
        }
    };

    const runAllTests = async () => {
        setTestResults([]);
        await testAIInitialization();

        if (aiState.isInitialized) {
            await testComplianceScanning();
            await testVisualSearch();
            await testFeatureExtraction();
        }
    };

    const renderTestResult = (result) => (
        <View key={result.id} style={[styles.testResult, result.success ? styles.success : styles.error]}>
            <View style={styles.testResultHeader}>
                <Icon
                    name={result.success ? 'check-circle' : 'times-circle'}
                    size={16}
                    color={result.success ? '#4CAF50' : '#F44336'}
                />
                <Text style={styles.testResultName}>{result.testName}</Text>
                <Text style={styles.testResultTime}>
                    {new Date(result.timestamp).toLocaleTimeString()}
                </Text>
            </View>
            <Text style={styles.testResultMessage}>{result.message}</Text>
            {result.details && (
                <Text style={styles.testResultDetails}>
                    {JSON.stringify(result.details, null, 2)}
                </Text>
            )}
        </View>
    );

    return (
        <View style={[styles.container, style]}>
            <Text style={styles.title}>AI Integration Test Panel</Text>

            {/* AI Status */}
            <View style={styles.statusContainer}>
                <Text style={styles.statusText}>
                    AI Status: {aiState.isInitialized ? '✅ Initialized' : '❌ Not Initialized'}
                </Text>
                {aiState.initializationError && (
                    <Text style={styles.errorText}>
                        Error: {aiState.initializationError}
                    </Text>
                )}
            </View>

            {/* Test Buttons */}
            <View style={styles.testButtons}>
                <TouchableOpacity style={styles.testButton} onPress={testAIInitialization}>
                    <Icon name="play" size={16} color="#fff" />
                    <Text style={styles.testButtonText}>Test Initialization</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.testButton} onPress={testComplianceScanning}>
                    <Icon name="shield" size={16} color="#fff" />
                    <Text style={styles.testButtonText}>Test Compliance</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.testButton} onPress={testVisualSearch}>
                    <Icon name="search" size={16} color="#fff" />
                    <Text style={styles.testButtonText}>Test Visual Search</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.testButton} onPress={testFeatureExtraction}>
                    <Icon name="extract" size={16} color="#fff" />
                    <Text style={styles.testButtonText}>Test Features</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.runAllButton} onPress={runAllTests}>
                    <Icon name="play-circle" size={16} color="#fff" />
                    <Text style={styles.testButtonText}>Run All Tests</Text>
                </TouchableOpacity>
            </View>

            {/* Test Results */}
            <ScrollView style={styles.resultsContainer}>
                <Text style={styles.resultsTitle}>Test Results</Text>
                {testResults.length === 0 ? (
                    <Text style={styles.noResults}>No tests run yet</Text>
                ) : (
                    testResults.map(renderTestResult)
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
        textAlign: 'center',
    },
    statusContainer: {
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },
    errorText: {
        fontSize: 12,
        color: '#F44336',
        marginTop: 4,
    },
    testButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    testButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0390F3',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
        gap: 6,
    },
    runAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4CAF50',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
        gap: 6,
    },
    testButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '500',
    },
    resultsContainer: {
        maxHeight: 300,
    },
    resultsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    noResults: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        fontStyle: 'italic',
    },
    testResult: {
        marginBottom: 12,
        padding: 12,
        borderRadius: 8,
        borderLeftWidth: 4,
    },
    success: {
        backgroundColor: '#f1f8e9',
        borderLeftColor: '#4CAF50',
    },
    error: {
        backgroundColor: '#ffebee',
        borderLeftColor: '#F44336',
    },
    testResultHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    testResultName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        flex: 1,
    },
    testResultTime: {
        fontSize: 12,
        color: '#666',
    },
    testResultMessage: {
        fontSize: 13,
        color: '#555',
        marginBottom: 8,
    },
    testResultDetails: {
        fontSize: 11,
        color: '#777',
        fontFamily: 'monospace',
        backgroundColor: '#f5f5f5',
        padding: 8,
        borderRadius: 4,
    },
});

export default AIIntegrationTest;