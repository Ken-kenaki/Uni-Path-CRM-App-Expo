import { Stack } from "expo-router";

export default function ApplicantsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="students" />
      <Stack.Screen name="visitors" />
      <Stack.Screen name="leads" />
    </Stack>
  );
}
