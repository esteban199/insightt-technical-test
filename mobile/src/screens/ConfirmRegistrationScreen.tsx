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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useAuth } from '@/hooks/useAuth';
import { AuthStackParamList } from '@/navigation/AuthStack';
import { ErrorSnackbar } from '@/components/ErrorSnackbar';
import { normalizeApiError } from '@/types/api';

const ConfirmSchema = z.object({
  code: z.string().min(1, 'Enter the code we emailed you.'),
});

type FormValues = z.infer<typeof ConfirmSchema>;

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ConfirmRegistration'>;
type ConfirmRoute = RouteProp<AuthStackParamList, 'ConfirmRegistration'>;

export function ConfirmRegistrationScreen(): React.JSX.Element {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { params } = useRoute<ConfirmRoute>();
  const { confirmRegistration, resendConfirmationCode } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [snackbarError, setSnackbarError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(ConfirmSchema),
    defaultValues: { code: '' },
  });

  async function onSubmit(values: FormValues) {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSnackbarError(null);

    try {
      await confirmRegistration(params.email, values.code);
      navigation.navigate('Login');
    } catch (err) {
      setSnackbarError(normalizeApiError(err).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onResend() {
    if (isResending) return;
    setIsResending(true);
    setSnackbarError(null);

    try {
      await resendConfirmationCode(params.email);
      setInfoMessage('We sent you a new code.');
    } catch (err) {
      setSnackbarError(normalizeApiError(err).message);
    } finally {
      setIsResending(false);
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
            Check your email
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Enter the verification code we sent to {params.email}
          </Text>
        </View>

        <View style={styles.form}>
          <Controller
            control={control}
            name="code"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputWrapper}>
                <TextInput
                  label="Verification code"
                  mode="outlined"
                  keyboardType="number-pad"
                  autoComplete="one-time-code"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={Boolean(errors.code)}
                  disabled={isSubmitting}
                />
                {errors.code && (
                  <HelperText type="error" visible>
                    {errors.code.message}
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
              'Confirm'
            )}
          </Button>

          <Button mode="text" compact onPress={onResend} disabled={isResending}>
            {isResending ? 'Sending...' : "Didn't get a code? Resend"}
          </Button>

          {infoMessage && (
            <Text variant="bodySmall" style={{ color: theme.colors.primary, textAlign: 'center' }}>
              {infoMessage}
            </Text>
          )}
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
});
