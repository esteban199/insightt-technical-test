import React from 'react';
import { Snackbar } from 'react-native-paper';
import { StyleSheet } from 'react-native';

interface ErrorSnackbarProps {
  visible: boolean;
  message: string;
  onDismiss: () => void;
  duration?: number;
}

export function ErrorSnackbar({
  visible,
  message,
  onDismiss,
  duration = 4000,
}: ErrorSnackbarProps): React.JSX.Element {
  return (
    <Snackbar
      visible={visible}
      onDismiss={onDismiss}
      duration={duration}
      action={{ label: 'Dismiss', onPress: onDismiss }}
      style={styles.snackbar}
    >
      {message}
    </Snackbar>
  );
}

const styles = StyleSheet.create({
  snackbar: {
    marginBottom: 80, // above bottom tab bar if any
  },
});
