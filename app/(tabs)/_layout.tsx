import { Tabs } from 'expo-router';
import { BookOpen, Building2, CreditCard, FileText, Globe, GraduationCap, Home } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#111827',
          borderTopColor: '#374151',
        },
        tabBarActiveTintColor: '#8b5cf6',
        tabBarInactiveTintColor: '#9ca3af',
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"  // This will be app/(tabs)/index.tsx
        options={{
          title: 'Home',
          tabBarIcon: ({ size, color }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="countries"  // This will be app/(tabs)/countries.tsx
        options={{
          title: 'Countries',
          tabBarIcon: ({ size, color }) => <Globe size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="universities"  // This will be app/(tabs)/universities.tsx
        options={{
          title: 'Universities',
          tabBarIcon: ({ size, color }) => <GraduationCap size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="courses"  // This will be app/(tabs)/courses.tsx
        options={{
          title: 'Courses',
          tabBarIcon: ({ size, color }) => <BookOpen size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="documents"  // This will be app/(tabs)/documents.tsx
        options={{
          title: 'Documents',
          tabBarIcon: ({ size, color }) => <FileText size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="payments"  // This will be app/(tabs)/payments.tsx
        options={{
          title: 'Payments',
          tabBarIcon: ({ size, color }) => <CreditCard size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="branches"  // This will be app/(tabs)/branches.tsx
        options={{
          title: 'Branches',
          tabBarIcon: ({ size, color }) => <Building2 size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}