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
import { loginUser } from '../store/slices/authSlice';

const LoginScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.auth || {});
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedUserType, setSelectedUserType] = useState('buyer');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    try {
      await dispatch(
        loginUser({
          email,
          password,
          userType: selectedUserType,
        })
      ).unwrap();
    } catch (error) {
      const message = typeof error === 'string' ? error : error?.message;
      Alert.alert('Login Failed', message || 'Unable to login. Please try again.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.contentContainer}>
        {/* Logo (matching HTML) */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>Wholexale.com®</Text>
          <Text style={styles.tagline}>India's B2B Multi Vendor Marketplace</Text>
        </View>

        {/* Login Form (matching HTML) */}
        <View style={styles.formContainer}>
          <Text style={styles.formTitle} id="login-title">
            Login
          </Text>

          {/* Email Input (matching HTML) */}
          <View style={styles.inputContainer}>
            <Icon name="envelope" size={18} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Password Input (matching HTML) */}
          <View style={styles.inputContainer}>
            <Icon name="lock" size={18} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Icon name={showPassword ? 'eye' : 'eye-slash'} size={18} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Forgot Password (matching HTML) */}
          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* User Type Selector */}
          <View style={styles.userTypeSection}>
            <Text style={styles.userTypeLabel}>Login as</Text>
            <View style={styles.userTypeOptions}>
              {[
                { value: 'buyer', label: 'Buyer' },
                { value: 'seller', label: 'Seller' },
                { value: 'admin', label: 'Admin' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.userTypeButton,
                    selectedUserType === option.value && styles.userTypeButtonActive,
                  ]}
                  onPress={() => setSelectedUserType(option.value)}
                >
                  <Text
                    style={[
                      styles.userTypeButtonText,
                      selectedUserType === option.value && styles.userTypeButtonTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Login Button (matching HTML) */}
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={isLoading}>
            <Text style={styles.loginButtonText}>
              {isLoading ? 'Logging in...' : 'Login'}
            </Text>
          </TouchableOpacity>

          {/* OR Divider (matching HTML) */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>— OR —</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Login (matching HTML) */}
          <View style={styles.socialContainer}>
            <TouchableOpacity style={styles.socialButton}>
              <Text style={styles.socialIcon}>G</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Text style={styles.socialIcon}>f</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Icon name="apple" size={18} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Register Link (matching HTML) */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register', { userType: selectedUserType })}>
              <Text style={styles.registerLink}>Register</Text>
            </TouchableOpacity>
          </View>
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
    paddingTop: 60,
    paddingBottom: 40,
  },

  // Logo (matching HTML)
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 10,
  },
  tagline: {
    fontSize: 14,
    color: '#666',
    marginBottom: 30,
  },

  // Form Container (matching HTML)
  formContainer: {
    // marginBottom: 20,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 25,
    textAlign: 'center',
    color: '#333',
  },

  // Input Containers (matching HTML)
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    fontSize: 18,
    color: '#666',
  },

  // Forgot Password (matching HTML)
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: Colors.primary,
    fontSize: 14,
    textDecorationLine: 'underline',
  },

  // User type selector
  userTypeSection: {
    marginBottom: 20,
  },
  userTypeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  userTypeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  userTypeButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f9f9f9',
    alignItems: 'center',
  },
  userTypeButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  userTypeButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  userTypeButtonTextActive: {
    color: '#fff',
  },

  // Login Button (matching HTML)
  loginButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 25,
  },
  loginButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '600',
  },

  // Divider (matching HTML)
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 15,
    color: '#666',
    fontSize: 14,
  },

  // Social Login (matching HTML)
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    marginBottom: 25,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialIcon: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },

  // Register Link (matching HTML)
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  registerText: {
    color: '#666',
    fontSize: 14,
  },
  registerLink: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LoginScreen;
