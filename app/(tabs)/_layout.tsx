import { Tabs } from "expo-router";
import {
  BookOpen,
  FileText,
  Globe,
  GraduationCap
} from "lucide-react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: "#111827",
          borderTopColor: "#374151",
        },
        tabBarActiveTintColor: "#8b5cf6",
        tabBarInactiveTintColor: "#9ca3af",
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="dashboard" // This will be app/(tabs)/dashboard.tsx
        options={{
          title: "Dashboard",
          tabBarIcon: ({ size, color }) => <Globe size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="applicants" // This will be app/(tabs)/applicants.tsx
        options={{
          title: "Applicants",
          tabBarIcon: ({ size, color }) => (
            <GraduationCap size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="email" // This will be app/(tabs)/email.tsx
        options={{
          title: "Email",
          tabBarIcon: ({ size, color }) => (
            <BookOpen size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile" // This will be app/(tabs)/profile.tsx
        options={{
          title: "Profile",
          tabBarIcon: ({ size, color }) => (
            <FileText size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
