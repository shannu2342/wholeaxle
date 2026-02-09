import React from 'react';
import { SafeAreaView, StatusBar, ScrollView, StyleSheet, View } from 'react-native';
import { Colors } from '../constants/Colors';
import AppHeader from './AppHeader';

const HubLayout = ({
  title,
  navigation,
  children,
  scroll = true,
  backgroundColor = Colors.white,
}) => {
  const content = scroll ? (
    <ScrollView contentContainerStyle={styles.content}>
      {children}
    </ScrollView>
  ) : (
    <View style={styles.content}>{children}</View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <StatusBar barStyle="dark-content" backgroundColor={backgroundColor} />
      <AppHeader
        title={title}
        showBackButton
        onBackPress={() => navigation.goBack()}
        backgroundColor={backgroundColor}
        textColor={Colors.text.primary}
      />
      {content}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
});

export default HubLayout;
