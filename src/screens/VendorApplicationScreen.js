import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Colors } from '../constants/Colors';
import { useDispatch, useSelector } from 'react-redux';
import { submitVendorApplication } from '../store/slices/vendorApplicationSlice';

const VendorApplicationScreen = ({ navigation, route }) => {
    const dispatch = useDispatch();
    const userId = route?.params?.userId;
    const user = useSelector((state) => state.auth?.user);
    const { isLoading } = useSelector((state) => state.vendorApplications || {});
    const [businessName, setBusinessName] = useState('');
    const [businessType, setBusinessType] = useState('');
    const [businessAddress, setBusinessAddress] = useState('');
    const [gstNumber, setGstNumber] = useState('');
    const [panNumber, setPanNumber] = useState('');
    const [website, setWebsite] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = async () => {
        if (!businessName || !businessType || !businessAddress || !gstNumber || !panNumber) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        const applicationData = {
            userId: userId || user?.id,
            businessName,
            businessType,
            businessAddress,
            gstNumber,
            panNumber,
            website,
            description,
            status: 'pending',
            appliedAt: new Date().toISOString(),
        };

        try {
            await dispatch(submitVendorApplication(applicationData)).unwrap();
            Alert.alert('Success', 'Your vendor application has been submitted for review.', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            const message = typeof error === 'string' ? error : error?.message;
            Alert.alert('Error', message || 'Unable to submit application.');
        }
    };

    return (
        <ScrollView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <View style={styles.contentContainer}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Become a Vendor</Text>
                    <Text style={styles.headerSubtitle}>Expand your business by joining our marketplace</Text>
                </View>

                <View style={styles.formContainer}>
                    <Text style={styles.sectionTitle}>Business Information</Text>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Business Name *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your business name"
                            value={businessName}
                            onChangeText={setBusinessName}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Business Type *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., Manufacturer, Wholesaler, Retailer"
                            value={businessType}
                            onChangeText={setBusinessType}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Business Address *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your business address"
                            value={businessAddress}
                            onChangeText={setBusinessAddress}
                            multiline
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>GST Number *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your GST number"
                            value={gstNumber}
                            onChangeText={setGstNumber}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>PAN Number *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your PAN number"
                            value={panNumber}
                            onChangeText={setPanNumber}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Website (Optional)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your website URL"
                            value={website}
                            onChangeText={setWebsite}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Business Description (Optional)</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Describe your business"
                            value={description}
                            onChangeText={setDescription}
                            multiline
                        />
                    </View>

                    <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={isLoading}>
                        <Text style={styles.submitButtonText}>
                            {isLoading ? 'Submitting...' : 'Submit Application'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    contentContainer: {
        padding: 20,
        paddingTop: 40,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.primary,
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    formContainer: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 20,
        color: '#333',
    },
    inputContainer: {
        marginBottom: 15,
    },
    inputLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    input: {
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 10,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
        color: '#333',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    submitButton: {
        backgroundColor: Colors.primary,
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 20,
    },
    submitButtonText: {
        color: Colors.white,
        fontSize: 18,
        fontWeight: '600',
    },
});

export default VendorApplicationScreen;
