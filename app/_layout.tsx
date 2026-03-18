// app/_layout.tsx
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";
import { ToastProvider } from "@/lib/toast-context";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "./global.css";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <ToastProvider>
            <StatusBar style="auto" />
            <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="(applicants)" />
              <Stack.Screen name="(more)" />
              <Stack.Screen
                name="student/[id]"
                options={{ animation: "slide_from_right" }}
              />
              <Stack.Screen
                name="university/[id]"
                options={{ animation: "slide_from_right" }}
              />
              <Stack.Screen
                name="country/[id]"
                options={{ animation: "slide_from_right" }}
              />
            </Stack>
          </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
