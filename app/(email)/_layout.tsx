import { Stack } from "expo-router";

export default function EmailLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="gmail" />
      <Stack.Screen name="bulk-email" />
    </Stack>
  );
}
