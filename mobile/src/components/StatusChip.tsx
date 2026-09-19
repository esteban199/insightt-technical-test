import React from 'react';
import { Chip } from 'react-native-paper';
import { TaskStatus } from '@/types/task';

interface StatusChipProps {
  status: TaskStatus;
  size?: 'small' | 'medium';
}

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string }> = {
  [TaskStatus.PENDING]:    { label: 'Pending',     color: '#F59E0B' },
  [TaskStatus.IN_PROGRESS]:{ label: 'In Progress', color: '#3B82F6' },
  [TaskStatus.DONE]:       { label: 'Done',        color: '#10B981' },
  [TaskStatus.ARCHIVED]:   { label: 'Archived',    color: '#9CA3AF' },
};

export function StatusChip({ status, size = 'small' }: StatusChipProps): React.JSX.Element {
  const config = STATUS_CONFIG[status];
  const isSmall = size === 'small';
  const fontSize = isSmall ? 11 : 13;
  const verticalPad = isSmall ? 2 : 6;

  return (
    <Chip
      mode="flat"
      compact={isSmall}
      style={{
        backgroundColor: `${config.color}22`,
        paddingVertical: verticalPad,
        alignSelf: 'flex-start',
      }}
      textStyle={{
        fontSize,
        color: config.color,
        fontWeight: '600',
        marginVertical: 0,
      }}
    >
      {config.label}
    </Chip>
  );
}
