import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import "./global.css";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Public/auth screens */}
        <Stack.Screen name="(auth)" />
        
        {/* Protected/main app screens with tabs */}
        <Stack.Screen name="(tabs)" />
        
        {/* Any other standalone screens */}
        <Stack.Screen name="index" />
      </Stack>
    </SafeAreaProvider>
  );
}