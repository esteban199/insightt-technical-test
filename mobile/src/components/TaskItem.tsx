import React, { useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import {
  Card,
  Text,
  IconButton,
  Button,
  useTheme,
} from 'react-native-paper';
import { Swipeable } from 'react-native-gesture-handler';
import { Task, TaskStatus } from '@/types/task';
import { StatusChip } from './StatusChip';

interface TaskItemProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onMarkDone: (task: Task) => void;
}

export function TaskItem({
  task,
  onEdit,
  onDelete,
  onMarkDone,
}: TaskItemProps): React.JSX.Element {
  const theme = useTheme();
  const swipeableRef = useRef<Swipeable>(null);

  const canMarkDone =
    task.status !== TaskStatus.DONE && task.status !== TaskStatus.ARCHIVED;

  function renderRightActions(
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
  ) {
    const scale = dragX.interpolate({
      inputRange: [-120, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View style={[styles.deleteAction, { transform: [{ scale }] }]}>
        <IconButton
          icon="delete"
          iconColor="#fff"
          size={24}
          onPress={() => {
            swipeableRef.current?.close();
            onDelete(task);
          }}
        />
      </Animated.View>
    );
  }

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
    >
      <Card
        style={[styles.card, { backgroundColor: theme.colors.surface }]}
        mode="elevated"
      >
        <Card.Content style={styles.content}>
          <View style={styles.topRow}>
            <View style={styles.titleContainer}>
              <Text variant="titleMedium" numberOfLines={1} style={styles.title}>
                {task.title}
              </Text>
              <StatusChip status={task.status} />
            </View>
            <View style={styles.actions}>
              <IconButton
                icon="pencil-outline"
                size={20}
                onPress={() => onEdit(task)}
                iconColor={theme.colors.primary}
              />
              <IconButton
                icon="delete-outline"
                size={20}
                onPress={() => onDelete(task)}
                iconColor={theme.colors.error}
              />
            </View>
          </View>

          {task.description ? (
            <Text
              variant="bodyMedium"
              numberOfLines={2}
              style={[styles.description, { color: theme.colors.onSurfaceVariant }]}
            >
              {task.description}
            </Text>
          ) : null}

          {canMarkDone && (
            <Button
              mode="outlined"
              compact
              onPress={() => onMarkDone(task)}
              style={styles.markDoneBtn}
              labelStyle={styles.markDoneLabel}
              icon="check-circle-outline"
            >
              Mark Done
            </Button>
          )}
        </Card.Content>
      </Card>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
  },
  content: {
    paddingVertical: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  title: {
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  description: {
    marginTop: 4,
    marginBottom: 8,
  },
  markDoneBtn: {
    alignSelf: 'flex-start',
    marginTop: 4,
    borderRadius: 20,
  },
  markDoneLabel: {
    fontSize: 12,
  },
  deleteAction: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    marginVertical: 6,
    marginRight: 16,
    borderRadius: 12,
  },
});
