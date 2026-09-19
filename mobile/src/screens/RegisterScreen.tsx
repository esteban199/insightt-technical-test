import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text,
  TextInput,
  Button,
  HelperText,
  ActivityIndicator,
  useTheme,
} from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/hooks/useAuth';
import { AuthStackParamList } from '@/navigation/AuthStack';
import { ErrorSnackbar } from '@/components/ErrorSnackbar';
import { normalizeApiError } from '@/types/api';

const RegisterSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters.'),
    email: z.string().email('Please enter a valid email address.'),
    // Matches the Cognito User Pool's password policy (min length 8, no other requirements).
    password: z.string().min(8, 'Password must be at least 8 characters.'),
    confirmPassword: z.string().min(1, 'Please confirm your password.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof RegisterSchema>;

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

export function RegisterScreen(): React.JSX.Element {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { register } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbarError, setSnackbarError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  async function onSubmit(values: FormValues) {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSnackbarError(null);

    try {
      await register(values.email, values.password, values.name);
      navigation.navigate('ConfirmRegistration', { email: values.email });
    } catch (err) {
      const apiErr = normalizeApiError(err);
      setSnackbarError(apiErr.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inner}
      >
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            Create account
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Fill in your details to get started
          </Text>
        </View>

        <View style={styles.form}>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputWrapper}>
                <TextInput
                  label="Full Name"
                  mode="outlined"
                  textContentType="name"
                  autoComplete="name"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={Boolean(errors.name)}
                  disabled={isSubmitting}
                />
                {errors.name && (
                  <HelperText type="error" visible>
                    {errors.name.message}
                  </HelperText>
                )}
              </View>
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputWrapper}>
                <TextInput
                  label="Email"
                  mode="outlined"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  autoComplete="email"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={Boolean(errors.email)}
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <HelperText type="error" visible>
                    {errors.email.message}
                  </HelperText>
                )}
              </View>
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputWrapper}>
                <TextInput
                  label="Password"
                  mode="outlined"
                  secureTextEntry
                  textContentType="newPassword"
                  autoComplete="password-new"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={Boolean(errors.password)}
                  disabled={isSubmitting}
                />
                {errors.password && (
                  <HelperText type="error" visible>
                    {errors.password.message}
                  </HelperText>
                )}
              </View>
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputWrapper}>
                <TextInput
                  label="Confirm Password"
                  mode="outlined"
                  secureTextEntry
                  textContentType="newPassword"
                  autoComplete="password-new"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={Boolean(errors.confirmPassword)}
                  disabled={isSubmitting}
                />
                {errors.confirmPassword && (
                  <HelperText type="error" visible>
                    {errors.confirmPassword.message}
                  </HelperText>
                )}
              </View>
            )}
          />

          <Button
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            style={styles.submitBtn}
            contentStyle={styles.submitBtnContent}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={theme.colors.onPrimary} />
            ) : (
              'Create Account'
            )}
          </Button>
        </View>

        <View style={styles.footer}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Already have an account?{' '}
          </Text>
          <Button
            mode="text"
            compact
            onPress={() => navigation.navigate('Login')}
          >
            Sign In
          </Button>
        </View>
      </KeyboardAvoidingView>

      <ErrorSnackbar
        visible={Boolean(snackbarError)}
        message={snackbarError ?? ''}
        onDismiss={() => setSnackbarError(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  header: { marginBottom: 32 },
  title: { fontWeight: '700', marginBottom: 8 },
  form: { gap: 8 },
  inputWrapper: { marginBottom: 4 },
  submitBtn: { marginTop: 16, borderRadius: 8 },
  submitBtnContent: { height: 48 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
});
