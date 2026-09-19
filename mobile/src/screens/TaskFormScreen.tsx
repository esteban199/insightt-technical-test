import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  TextInput,
  Button,
  HelperText,
  Banner,
  useTheme,
  ActivityIndicator,
} from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTask, useCreateTask, useUpdateTask } from '@/hooks/useTasks';
import { LoadingView } from '@/components/LoadingView';
import { ErrorSnackbar } from '@/components/ErrorSnackbar';
import { TaskStatus } from '@/types/task';
import { AppStackParamList } from '@/navigation/AppStack';
import { normalizeApiError } from '@/types/api';

const TaskFormSchema = z.object({
  title: z.string().min(1, 'Title is required.').max(200, 'Title is too long.'),
  description: z.string().max(2000, 'Description is too long.').optional(),
});

type FormValues = z.infer<typeof TaskFormSchema>;

type RouteProps = RouteProp<AppStackParamList, 'TaskForm'>;
type NavigationProp = NativeStackNavigationProp<AppStackParamList, 'TaskForm'>;

export function TaskFormScreen(): React.JSX.Element {
  const theme = useTheme();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const taskId = route.params?.taskId;
  const isEditMode = Boolean(taskId);

  const { data: existingTask, isLoading: isLoadingTask } = useTask(taskId ?? '');
  const createMutation = useCreateTask();
  const updateMutation = useUpdateTask();

  const [snackbarError, setSnackbarError] = useState<string | null>(null);
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const isDoneTask = existingTask?.status === TaskStatus.DONE;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(TaskFormSchema),
    defaultValues: { title: '', description: '' },
  });

  useEffect(() => {
    if (existingTask) {
      reset({
        title: existingTask.title,
        description: existingTask.description ?? '',
      });
    }
  }, [existingTask, reset]);

  async function onSubmit(values: FormValues) {
    setSnackbarError(null);
    try {
      if (isEditMode && taskId) {
        await updateMutation.mutateAsync({ id: taskId, payload: values });
      } else {
        await createMutation.mutateAsync(values);
      }
      navigation.goBack();
    } catch (err) {
      setSnackbarError(normalizeApiError(err).message);
    }
  }

  if (isLoadingTask) {
    return <LoadingView />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {isDoneTask && (
            <Banner
              visible
              icon="information"
              style={styles.doneBanner}
            >
              This task is marked as done. Only the title can be edited.
            </Banner>
          )}

          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputWrapper}>
                <TextInput
                  label="Title"
                  mode="outlined"
                  placeholder="What needs to be done?"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={Boolean(errors.title)}
                  disabled={isSubmitting}
                  maxLength={200}
                />
                {errors.title && (
                  <HelperText type="error" visible>
                    {errors.title.message}
                  </HelperText>
                )}
              </View>
            )}
          />

          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputWrapper}>
                <TextInput
                  label="Description"
                  mode="outlined"
                  placeholder="Add more details (optional)"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={Boolean(errors.description)}
                  disabled={isSubmitting || isDoneTask}
                  multiline
                  numberOfLines={4}
                  maxLength={2000}
                  style={styles.descriptionInput}
                />
                {errors.description && (
                  <HelperText type="error" visible>
                    {errors.description.message}
                  </HelperText>
                )}
                {isDoneTask && (
                  <HelperText type="info" visible>
                    Description cannot be edited for completed tasks.
                  </HelperText>
                )}
              </View>
            )}
          />

          <Button
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting || (!isDirty && isEditMode)}
            style={styles.submitBtn}
            contentStyle={styles.submitBtnContent}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={theme.colors.onPrimary} />
            ) : isEditMode ? (
              'Save Changes'
            ) : (
              'Create Task'
            )}
          </Button>

          <Button
            mode="text"
            onPress={() => navigation.goBack()}
            disabled={isSubmitting}
            style={styles.cancelBtn}
          >
            Cancel
          </Button>
        </ScrollView>
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
  flex: { flex: 1 },
  scrollContent: { padding: 24 },
  doneBanner: {
    marginBottom: 16,
    borderRadius: 8,
  },
  inputWrapper: { marginBottom: 16 },
  descriptionInput: { minHeight: 120 },
  submitBtn: { marginTop: 8, borderRadius: 8 },
  submitBtnContent: { height: 48 },
  cancelBtn: { marginTop: 8 },
});
