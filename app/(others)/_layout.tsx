import { Stack } from "expo-router";

export default function OthersLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(others)/branches" />
      <Stack.Screen name="(others)/countries" />
      <Stack.Screen name="(others)/paymentTemplates" />
      <Stack.Screen name="(others)/documentTemplates" />
      <Stack.Screen name="(others)/universities" />
      <Stack.Screen name="(others)/courses" />
    </Stack>
  );
}
