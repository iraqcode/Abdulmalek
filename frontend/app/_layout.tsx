import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0D1117' },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="course/[id]" />
        <Stack.Screen name="lesson/[courseId]/[lessonId]" />
        <Stack.Screen name="quiz/[courseId]" />
      </Stack>
    </>
  );
}
