import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '@/screens/LoginScreen';
import { RegisterScreen } from '@/screens/RegisterScreen';
import { ConfirmRegistrationScreen } from '@/screens/ConfirmRegistrationScreen';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ConfirmRegistration: { email: string };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStack(): React.JSX.Element {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ConfirmRegistration" component={ConfirmRegistrationScreen} />
    </Stack.Navigator>
  );
}
