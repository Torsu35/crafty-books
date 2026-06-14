import "../global.css";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useEffect } from "react";
import { getDb } from "../src/lib/db";

export default function RootLayout() {
  useEffect(() => {
    // Eagerly initialize SQLite on cold start so first screen is instant.
    try { getDb(); } catch (e) { console.warn("db init", e); }
  }, []);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#F7F8FC" } }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="setup" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="sales/new" options={{ presentation: "modal" }} />
          <Stack.Screen name="purchases/index" />
          <Stack.Screen name="purchases/new" options={{ presentation: "modal" }} />
          <Stack.Screen name="expenses/new" options={{ presentation: "modal" }} />
          <Stack.Screen name="inventory/index" />
          <Stack.Screen name="inventory/new" options={{ presentation: "modal" }} />
          <Stack.Screen name="accounts" />
          <Stack.Screen name="backup" />
          <Stack.Screen name="settings" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}