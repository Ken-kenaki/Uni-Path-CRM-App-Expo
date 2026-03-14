// app/(tabs)/more.tsx - Hub for all other features
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "expo-router";
import {
  BookOpen,
  Building2,
  ChevronRight,
  FileText,
  Flag,
  GraduationCap,
  CreditCard,
  School,
  Users,
} from "lucide-react-native";
import React from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface MenuItem {
  id: string;
  title: string;
  description: string;
  icon: any;
  route: string;
  color: string;
  bgColor: string;
  roles?: string[];
}

const menuSections: { title: string; items: MenuItem[] }[] = [
  {
    title: "Academic",
    items: [
      {
        id: "universities",
        title: "Universities",
        description: "Browse universities & programs",
        icon: School,
        route: "/(more)/universities",
        color: "#3b82f6",
        bgColor: "bg-blue-500/15",
      },
      {
        id: "countries",
        title: "Countries",
        description: "Manage destination countries",
        icon: Flag,
        route: "/(more)/countries",
        color: "#10b981",
        bgColor: "bg-emerald-500/15",
      },
      {
        id: "courses",
        title: "Courses",
        description: "View available courses",
        icon: BookOpen,
        route: "/(more)/courses",
        color: "#f59e0b",
        bgColor: "bg-amber-500/15",
      },
    ],
  },
  {
    title: "Templates",
    items: [
      {
        id: "doc-templates",
        title: "Document Templates",
        description: "Manage document templates",
        icon: FileText,
        route: "/(more)/document-templates",
        color: "#8b5cf6",
        bgColor: "bg-purple-500/15",
      },
      {
        id: "pay-templates",
        title: "Payment Templates",
        description: "Manage payment templates",
        icon: CreditCard,
        route: "/(more)/payment-templates",
        color: "#ec4899",
        bgColor: "bg-pink-500/15",
      },
    ],
  },
  {
    title: "Management",
    items: [
      {
        id: "branches",
        title: "Branches",
        description: "Manage office branches",
        icon: Building2,
        route: "/(tabs)/branches",
        color: "#06b6d4",
        bgColor: "bg-cyan-500/15",
        roles: ["admin"],
      },
      {
        id: "users",
        title: "Users",
        description: "Manage staff & admins",
        icon: Users,
        route: "/(more)/users",
        color: "#f97316",
        bgColor: "bg-orange-500/15",
        roles: ["admin", "branchAdmin"],
      },
    ],
  },
];

export default function MoreScreen() {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="px-4 pt-2 pb-4">
        <Text className="text-2xl font-bold text-white">More</Text>
        <Text className="text-gray-500 text-sm mt-1">All features & management</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {menuSections.map((section) => {
          const visibleItems = section.items.filter(
            (item) => !item.roles || item.roles.includes(user?.role || "")
          );
          if (visibleItems.length === 0) return null;

          return (
            <View key={section.title} className="mb-6">
              <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 mb-2">
                {section.title}
              </Text>
              <View className="mx-4 rounded-2xl bg-[#111111] border border-[#1f1f1f] overflow-hidden">
                {visibleItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => router.push(item.route as any)}
                      className={`flex-row items-center p-4 ${
                        index < visibleItems.length - 1 ? "border-b border-[#1f1f1f]" : ""
                      }`}
                      activeOpacity={0.6}
                    >
                      <View
                        className={`w-10 h-10 rounded-xl items-center justify-center ${item.bgColor}`}
                      >
                        <Icon size={20} color={item.color} />
                      </View>
                      <View className="flex-1 ml-3">
                        <Text className="text-white font-semibold text-[15px]">
                          {item.title}
                        </Text>
                        <Text className="text-gray-500 text-xs mt-0.5">
                          {item.description}
                        </Text>
                      </View>
                      <ChevronRight size={18} color="#4b5563" />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
