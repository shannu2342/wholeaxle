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

const LoginScreen = ({ navigation, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState('buyer'); // 'buyer' or 'seller'

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    
    // Mock login - in real app, this would call an API
    const userData = {
      id: 1,
      name: userType === 'buyer' ? 'John Buyer' : 'Haajra Garments',
      email: email,
      userType: userType,
      isLoggedIn: true,
    };
    
    if (onLogin) {
      onLogin(userData);
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

        {/* User Type Toggle (matching HTML) */}
        <View style={styles.userTypeContainer}>
          <TouchableOpacity
            style={[
              styles.userTypeButton,
              userType === 'buyer' && styles.userTypeButtonActive,
            ]}
            onPress={() => setUserType('buyer')}
          >
            <Text style={styles.userTypeEmoji}>🛒</Text>
            <Text
              style={[
                styles.userTypeText,
                userType === 'buyer' && styles.userTypeTextActive,
              ]}
            >
              Buyer
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.userTypeButton,
              userType === 'seller' && styles.userTypeButtonActive,
            ]}
            onPress={() => setUserType('seller')}
          >
            <Text style={styles.userTypeEmoji}>🏪</Text>
            <Text
              style={[
                styles.userTypeText,
                userType === 'seller' && styles.userTypeTextActive,
              ]}
            >
              Seller
            </Text>
          </TouchableOpacity>
        </View>

        {/* Login Form (matching HTML) */}
        <View style={styles.formContainer}>
          <Text style={styles.formTitle} id="login-title">
            {userType === 'buyer' ? 'Buyer Login' : 'Seller Login'}
          </Text>

          {/* Email Input (matching HTML) */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputIcon}>📧</Text>
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
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Text style={styles.eyeIcon}>👁️</Text>
            </TouchableOpacity>
          </View>

          {/* Forgot Password (matching HTML) */}
          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Login Button (matching HTML) */}
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Login</Text>
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
              <Text style={styles.socialIcon}>🍎</Text>
            </TouchableOpacity>
          </View>

          {/* Register Link (matching HTML) */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register', { userType })}>
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
  
  // User Type Toggle (matching HTML)
  userTypeContainer: {
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 30,
  },
  userTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    backgroundColor: Colors.white,
  },
  userTypeButtonActive: {
    backgroundColor: Colors.primary,
  },
  userTypeEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  userTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  userTypeTextActive: {
    color: Colors.white,
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
    fontSize: 18,
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
