import React from 'react';
import { render } from '@testing-library/react-native';
import { StatusChip } from '../../src/components/StatusChip';
import { TaskStatus } from '../../src/types/task';

describe('StatusChip', () => {
  it('renders without crashing for PENDING status', () => {
    const { root } = render(<StatusChip status={TaskStatus.PENDING} />);
    expect(root).toBeTruthy();
  });

  it('renders without crashing for IN_PROGRESS status', () => {
    const { root } = render(<StatusChip status={TaskStatus.IN_PROGRESS} />);
    expect(root).toBeTruthy();
  });

  it('renders without crashing for DONE status', () => {
    const { root } = render(<StatusChip status={TaskStatus.DONE} />);
    expect(root).toBeTruthy();
  });

  it('renders without crashing for ARCHIVED status', () => {
    const { root } = render(<StatusChip status={TaskStatus.ARCHIVED} />);
    expect(root).toBeTruthy();
  });

  it('renders without crashing at small size', () => {
    const { root } = render(<StatusChip status={TaskStatus.PENDING} size="small" />);
    expect(root).toBeTruthy();
  });

  it('renders without crashing at medium size', () => {
    const { root } = render(<StatusChip status={TaskStatus.PENDING} size="medium" />);
    expect(root).toBeTruthy();
  });
});
