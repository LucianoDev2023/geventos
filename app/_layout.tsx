import React, { Suspense } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { EventsProvider } from '@/context/EventsContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from 'react-native';
import { useCachedFonts } from '@/hooks/useFonts';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';

export default function RootLayout() {
  useFrameworkReady();
  const { fontsLoaded, fontError } = useCachedFonts();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  if (!fontsLoaded && !fontError) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <EventsProvider>
      <View style={[{ flex: 1, backgroundColor: colors.background }]}>
        <Suspense
          fallback={
            <View
              style={[styles.container, { backgroundColor: colors.background }]}
            >
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          }
        >
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'fade',
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
          </Stack>
        </Suspense>
        <StatusBar style="auto" backgroundColor={colors.background} />
      </View>
    </EventsProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
