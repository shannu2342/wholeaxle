import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

const RegisterScreen = ({ navigation, route }) => {
  const initialUserType = route?.params?.userType || 'buyer';
  const [userType, setUserType] = useState(initialUserType);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    // Seller specific fields
    businessName: '',
    gstNumber: '',
    businessAddress: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const handleRegister = () => {
    if (!formData.name || !formData.email || !formData.password) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (!agreeTerms) {
      Alert.alert('Error', 'Please agree to Terms & Conditions');
      return;
    }
    
    Alert.alert(
      'Success',
      `${userType === 'buyer' ? 'Buyer' : 'Seller'} account created successfully!`,
      [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
    );
  };

  const updateFormData = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={20} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Account</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* User Type Toggle */}
      <View style={styles.userTypeContainer}>
        <TouchableOpacity
          style={[styles.userTypeButton, userType === 'buyer' && styles.userTypeButtonActive]}
          onPress={() => setUserType('buyer')}
        >
          <Icon name="shopping-cart" size={18} color={userType === 'buyer' ? '#fff' : '#0390F3'} />
          <Text style={[styles.userTypeText, userType === 'buyer' && styles.userTypeTextActive]}>
            Buyer
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.userTypeButton, userType === 'seller' && styles.userTypeButtonActive]}
          onPress={() => setUserType('seller')}
        >
          <Icon name="store" size={18} color={userType === 'seller' ? '#fff' : '#0390F3'} />
          <Text style={[styles.userTypeText, userType === 'seller' && styles.userTypeTextActive]}>
            Seller
          </Text>
        </TouchableOpacity>
      </View>

      {/* Form */}
      <View style={styles.formContainer}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        
        <View style={styles.inputContainer}>
          <Icon name="user" size={18} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Full Name *"
            value={formData.name}
            onChangeText={(value) => updateFormData('name', value)}
          />
        </View>

        <View style={styles.inputContainer}>
          <Icon name="envelope" size={16} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email Address *"
            value={formData.email}
            onChangeText={(value) => updateFormData('email', value)}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Icon name="phone" size={18} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            value={formData.phone}
            onChangeText={(value) => updateFormData('phone', value)}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputContainer}>
          <Icon name="lock" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Password *"
            value={formData.password}
            onChangeText={(value) => updateFormData('password', value)}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Icon name={showPassword ? 'eye' : 'eye-slash'} size={18} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <Icon name="lock" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Confirm Password *"
            value={formData.confirmPassword}
            onChangeText={(value) => updateFormData('confirmPassword', value)}
            secureTextEntry={!showPassword}
          />
        </View>

        {/* Seller Specific Fields */}
        {userType === 'seller' && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Business Information</Text>
            
            <View style={styles.inputContainer}>
              <Icon name="building" size={18} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Business Name *"
                value={formData.businessName}
                onChangeText={(value) => updateFormData('businessName', value)}
              />
            </View>

            <View style={styles.inputContainer}>
              <Icon name="id-card" size={16} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="GST Number"
                value={formData.gstNumber}
                onChangeText={(value) => updateFormData('gstNumber', value)}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.inputContainer}>
              <Icon name="map-marker" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Business Address"
                value={formData.businessAddress}
                onChangeText={(value) => updateFormData('businessAddress', value)}
                multiline
              />
            </View>

            <View style={styles.sellerBenefits}>
              <Text style={styles.benefitsTitle}>Seller Benefits:</Text>
              <View style={styles.benefitItem}>
                <Icon name="check-circle" size={14} color="#00c57d" />
                <Text style={styles.benefitText}>Reach millions of buyers</Text>
              </View>
              <View style={styles.benefitItem}>
                <Icon name="check-circle" size={14} color="#00c57d" />
                <Text style={styles.benefitText}>Low commission rates</Text>
              </View>
              <View style={styles.benefitItem}>
                <Icon name="check-circle" size={14} color="#00c57d" />
                <Text style={styles.benefitText}>Easy product management</Text>
              </View>
              <View style={styles.benefitItem}>
                <Icon name="check-circle" size={14} color="#00c57d" />
                <Text style={styles.benefitText}>Fast payments</Text>
              </View>
            </View>
          </>
        )}

        {/* Terms & Conditions */}
        <TouchableOpacity 
          style={styles.termsContainer}
          onPress={() => setAgreeTerms(!agreeTerms)}
        >
          <View style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}>
            {agreeTerms && <Icon name="check" size={12} color="#fff" />}
          </View>
          <Text style={styles.termsText}>
            I agree to the <Text style={styles.termsLink}>Terms & Conditions</Text> and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </TouchableOpacity>

        {/* Register Button */}
        <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
          <Text style={styles.registerButtonText}>
            {userType === 'buyer' ? 'Create Buyer Account' : 'Create Seller Account'}
          </Text>
        </TouchableOpacity>

        {/* Login Link */}
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>Login</Text>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingTop: 10,
  },
  backButton: {
    padding: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  userTypeContainer: {
    flexDirection: 'row',
    marginBottom: 25,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#0390F3',
  },
  userTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  userTypeButtonActive: {
    backgroundColor: '#0390F3',
  },
  userTypeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0390F3',
    marginLeft: 8,
  },
  userTypeTextActive: {
    color: '#fff',
  },
  formContainer: {
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: '#333',
  },
  sellerBenefits: {
    backgroundColor: '#f0f8ff',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 15,
  },
  benefitsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  benefitText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#555',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 20,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#0390F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: '#0390F3',
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
  termsLink: {
    color: '#0390F3',
    fontWeight: '500',
  },
  registerButton: {
    backgroundColor: '#0390F3',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  loginText: {
    color: '#666',
    fontSize: 14,
  },
  loginLink: {
    color: '#0390F3',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default RegisterScreen;
