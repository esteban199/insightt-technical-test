import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TaskListScreen } from '@/screens/TaskListScreen';
import { TaskFormScreen } from '@/screens/TaskFormScreen';

export type AppStackParamList = {
  TaskList: undefined;
  /** If taskId is provided, the form operates in edit mode. Otherwise, create mode. */
  TaskForm: { taskId?: string };
};

const Stack = createNativeStackNavigator<AppStackParamList>();

export function AppStack(): React.JSX.Element {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="TaskList" component={TaskListScreen} />
      <Stack.Screen
        name="TaskForm"
        component={TaskFormScreen}
        options={({ route }) => ({
          headerShown: true,
          title: route.params?.taskId ? 'Edit Task' : 'New Task',
          headerBackTitle: 'Back',
        })}
      />
    </Stack.Navigator>
  );
}
