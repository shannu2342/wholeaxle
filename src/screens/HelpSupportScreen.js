import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar } from 'react-native';
import { Colors } from '../constants/Colors';
import AppHeader from '../components/AppHeader';

const HelpSupportScreen = ({ navigation }) => {
  const faqs = [
    { q: 'How do I place a bulk order?', a: 'Select products and ensure MOQ is met before checkout.' },
    { q: 'How do I contact a vendor?', a: 'Use the chat feature or contact from product detail.' },
    { q: 'What is the return policy?', a: 'Returns are supported based on vendor and product type.' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      <AppHeader
        title="Help & Support"
        showBackButton
        onBackPress={() => navigation.goBack()}
        backgroundColor={Colors.white}
        textColor={Colors.text.primary}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>Contact Support</Text>
          <Text style={styles.detail}>WhatsApp: +91 90000 00000</Text>
          <Text style={styles.detail}>Email: support@wholexale.com</Text>
        </View>
        <Text style={styles.sectionTitle}>FAQs</Text>
        {faqs.map((item) => (
          <View key={item.q} style={styles.faq}>
            <Text style={styles.question}>{item.q}</Text>
            <Text style={styles.answer}>{item.a}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: Colors.lightGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 6,
  },
  detail: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  faq: {
    backgroundColor: Colors.lightGray,
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  question: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  answer: {
    marginTop: 6,
    fontSize: 13,
    color: Colors.text.secondary,
  },
});

export default HelpSupportScreen;
