import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text,
  Chip,
  FAB,
  Portal,
  Dialog,
  Button,
  useTheme,
  IconButton,
  ActivityIndicator,
  ProgressBar,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTasks, useDeleteTask, useMarkTaskDone } from '@/hooks/useTasks';
import { TaskItem } from '@/components/TaskItem';
import { LoadingView } from '@/components/LoadingView';
import { ErrorSnackbar } from '@/components/ErrorSnackbar';
import { useAuthContext } from '@/context/AuthContext';
import { Task, TaskStatus } from '@/types/task';
import { AppStackParamList } from '@/navigation/AppStack';
import { normalizeApiError } from '@/types/api';

type NavigationProp = NativeStackNavigationProp<AppStackParamList, 'TaskList'>;

type FilterStatus = 'ALL' | TaskStatus;

const FILTER_OPTIONS: Array<{ key: FilterStatus; label: string }> = [
  { key: 'ALL', label: 'All' },
  { key: TaskStatus.PENDING, label: 'Pending' },
  { key: TaskStatus.IN_PROGRESS, label: 'In Progress' },
  { key: TaskStatus.DONE, label: 'Done' },
  { key: TaskStatus.ARCHIVED, label: 'Archived' },
];

export function TaskListScreen(): React.JSX.Element {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { user, logout } = useAuthContext();

  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  const [filter, setFilter] = useState<FilterStatus>('ALL');
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbarError, setSnackbarError] = useState<string | null>(null);

  const apiStatus = filter === 'ALL' ? undefined : filter;

  const {
    data: tasks,
    isLoading,
    isFetching,
    isPlaceholderData,
    isError,
    error,
    refetch,
  } = useTasks(apiStatus);

  // Tab switches reuse the previous list via keepPreviousData, so only show the
  // full-screen loader on the very first load — everything else gets the thin bar below.
  const isInitialLoading = isLoading && tasks === undefined;
  const isSwitchingFilter = isFetching && isPlaceholderData;

  const deleteMutation = useDeleteTask();
  const markDoneMutation = useMarkTaskDone();

  async function handleRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  async function handleMarkDone(task: Task) {
    try {
      await markDoneMutation.mutateAsync(task.id);
    } catch (err) {
      setSnackbarError(normalizeApiError(err).message);
    }
  }

  function handleEdit(task: Task) {
    navigation.navigate('TaskForm', { taskId: task.id });
  }

  function handleDeletePrompt(task: Task) {
    setDeleteTarget(task);
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
    } catch (err) {
      setSnackbarError(normalizeApiError(err).message);
    } finally {
      setDeleteTarget(null);
    }
  }

  const renderItem = useCallback(
    ({ item }: { item: Task }) => (
      <TaskItem
        task={item}
        onEdit={handleEdit}
        onDelete={handleDeletePrompt}
        onMarkDone={handleMarkDone}
      />
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const keyExtractor = useCallback((item: Task) => item.id, []);

  function renderEmpty() {
    return (
      <View style={styles.emptyContainer}>
        <IconButton
          icon="checkbox-marked-circle-outline"
          size={64}
          iconColor={theme.colors.outline}
        />
        <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
          No tasks found
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.outline, textAlign: 'center', marginTop: 4 }}>
          {filter === 'ALL'
            ? 'Tap the + button to create your first task.'
            : 'No tasks with this status.'}
        </Text>
      </View>
    );
  }

  if (isInitialLoading) {
    return <LoadingView />;
  }

  if (isError && tasks === undefined) {
    return (
      <SafeAreaView style={[styles.container, styles.emptyContainer, { backgroundColor: theme.colors.background }]}>
        <Text variant="titleMedium" style={{ color: theme.colors.error, marginBottom: 8 }}>
          Couldn&apos;t load your tasks
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.outline, textAlign: 'center', marginBottom: 16 }}>
          {normalizeApiError(error).message}
        </Text>
        <Button mode="contained" onPress={() => refetch()}>
          Try again
        </Button>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.headerTitle}>
          My Tasks
        </Text>
        <View style={styles.headerActions}>
          <Text style={styles.userName} numberOfLines={1}>
            {user?.name ?? user?.email ?? ''}
          </Text>
          <IconButton
            icon="logout"
            size={22}
            onPress={handleLogout}
            accessibilityLabel="Log out"
          />
        </View>
      </View>

      <View style={styles.filterRow}>
        <FlatList
          horizontal
          data={FILTER_OPTIONS}
          extraData={filter}
          keyExtractor={(item) => item.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => {
            const isActive = filter === item.key;
            return (
              <Chip
                key={item.key}
                selected={isActive}
                onPress={() => setFilter(item.key)}
                mode={isActive ? 'flat' : 'outlined'}
                showSelectedCheck={false}
                selectedColor={theme.colors.onPrimaryContainer}
                style={{
                  marginRight: 8,
                  backgroundColor: isActive ? theme.colors.primaryContainer : 'transparent',
                  borderColor: isActive ? theme.colors.primary : theme.colors.outline,
                }}
                textStyle={{
                  color: isActive ? theme.colors.onPrimaryContainer : theme.colors.onSurface,
                  fontWeight: isActive ? '700' : '500',
                }}
              >
                {item.label}
              </Chip>
            );
          }}
        />
      </View>

      {isSwitchingFilter && <ProgressBar indeterminate color={theme.colors.primary} />}

      <FlatList
        data={tasks ?? []}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={tasks?.length === 0 ? styles.emptyList : styles.listContent}
        ListEmptyComponent={isSwitchingFilter ? null : renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      />

      <ErrorSnackbar
        visible={Boolean(snackbarError)}
        message={snackbarError ?? ''}
        onDismiss={() => setSnackbarError(null)}
      />

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color={theme.colors.onPrimary}
        onPress={() => navigation.navigate('TaskForm', {})}
      />

      <Portal>
        <Dialog visible={Boolean(deleteTarget)} onDismiss={() => setDeleteTarget(null)}>
          <Dialog.Title>Delete Task</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Are you sure you want to delete "{deleteTarget?.title}"? This action cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteTarget(null)}>Cancel</Button>
            <Button
              onPress={handleConfirmDelete}
              textColor={theme.colors.error}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <ActivityIndicator size="small" color={theme.colors.error} />
              ) : (
                'Delete'
              )}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: { fontWeight: '700' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  userName: { maxWidth: 120 },
  filterRow: { paddingVertical: 8 },
  filterList: { paddingHorizontal: 16, gap: 8 },
  filterChip: { marginRight: 8 },
  listContent: { paddingBottom: 100 },
  emptyList: { flex: 1 },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    borderRadius: 28,
  },
});
