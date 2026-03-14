// app/(tabs)/_layout.tsx
import { useAuth } from "@/lib/auth-context";
import { Tabs } from "expo-router";
import {
  BarChart3,
  CreditCard,
  GraduationCap,
  LayoutGrid,
  Settings,
} from "lucide-react-native";
import { ActivityIndicator, View } from "react-native";

export default function TabLayout() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: "#0a0a0a",
          borderTopColor: "#1a1a1a",
          borderTopWidth: 1,
          height: 85,
          paddingBottom: 28,
          paddingTop: 8,
        },
        tabBarActiveTintColor: "#8b5cf6",
        tabBarInactiveTintColor: "#6b7280",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ size, color }) => (
            <BarChart3 size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="applicants"
        options={{
          title: "Applicants",
          tabBarIcon: ({ size, color }) => (
            <GraduationCap size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          title: "Payments",
          tabBarIcon: ({ size, color }) => (
            <CreditCard size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ size, color }) => (
            <LayoutGrid size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ size, color }) => (
            <Settings size={size} color={color} />
          ),
        }}
      />
      {/* Hide branches from tab bar since it's now under "More" */}
      <Tabs.Screen
        name="branches"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
