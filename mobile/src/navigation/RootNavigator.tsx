import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, useTheme } from 'react-native-paper';
import { View, StyleSheet } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { AuthStack } from './AuthStack';
import { AppStack } from './AppStack';

export function RootNavigator(): React.JSX.Element {
  const { user, isLoading } = useAuth();
  const theme = useTheme();

  if (isLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
