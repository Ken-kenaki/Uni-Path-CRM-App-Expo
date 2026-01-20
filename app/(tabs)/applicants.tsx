import { useRouter } from "expo-router";
import { ChevronRight, UserCheck, UserPlus, Users } from "lucide-react-native";
import React, { useState } from "react";
import {
  Dimensions,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

interface ApplicantCategory {
  id: string;
  title: string;
  description: string;
  count: number;
  icon: any;
  route: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export default function ApplicantsTab() {
  const router = useRouter();
  const [theme] = useState<"dark">("dark");

  const categories: ApplicantCategory[] = [
    {
      id: "students",
      title: "Students",
      description: "Manage all student applications",
      count: 0, // Will be fetched dynamically
      icon: Users,
      route: "/(applicants)/students",
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-500/20",
      borderColor: "border-purple-200 dark:border-purple-800",
    },
    {
      id: "visitors",
      title: "Visitors",
      description: "Track visitor inquiries and walk-ins",
      count: 0,
      icon: UserPlus,
      route: "/(applicants)/visitors",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-500/20",
      borderColor: "border-blue-200 dark:border-blue-800",
    },
    {
      id: "leads",
      title: "Leads",
      description: "Manage potential student leads",
      count: 0,
      icon: UserCheck,
      route: "/(applicants)/leads",
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-500/20",
      borderColor: "border-green-200 dark:border-green-800",
    },
  ];

  const handleCategoryPress = (route: string) => {
    router.push(route as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="flex-1 p-4">
        {/* Header */}
        <View className="mb-8">
          <Text className="text-3xl font-bold text-gray-900 dark:text-white">
            Applicants
          </Text>
          <Text className="text-gray-600 dark:text-gray-400 mt-2">
            Manage all types of applicants in one place
          </Text>
        </View>

        {/* Categories Grid */}
        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="space-y-4">
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                onPress={() => handleCategoryPress(category.route)}
                className={`p-6 rounded-2xl border ${category.borderColor} ${category.bgColor} active:opacity-80`}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-4">
                    <View className={`p-3 rounded-xl ${category.bgColor}`}>
                      <category.icon
                        size={24}
                        className={category.color.replace("text-", "stroke-")}
                      />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center gap-3">
                        <Text className="text-lg font-semibold text-gray-900 dark:text-white">
                          {category.title}
                        </Text>
                        <View className="px-2 py-1 bg-white dark:bg-gray-800 rounded-full">
                          <Text className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            {category.count}
                          </Text>
                        </View>
                      </View>
                      <Text className="text-gray-600 dark:text-gray-400 mt-1">
                        {category.description}
                      </Text>
                    </View>
                  </View>
                  <ChevronRight
                    size={20}
                    className="text-gray-400 dark:text-gray-500"
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Quick Stats Section */}
          <View className="mt-8 mb-4">
            <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Overview
            </Text>
            <View className="grid grid-cols-2 gap-4">
              <View className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <Text className="text-2xl font-bold text-gray-900 dark:text-white">
                  0
                </Text>
                <Text className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  Total Applicants
                </Text>
              </View>
              <View className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <Text className="text-2xl font-bold text-gray-900 dark:text-white">
                  0
                </Text>
                <Text className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  New Today
                </Text>
              </View>
            </View>
          </View>

          {/* Recent Activity Placeholder */}
          <View className="mt-6 mb-8">
            <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recent Activity
            </Text>
            <View className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <Text className="text-gray-600 dark:text-gray-400 text-center py-8">
                No recent activity
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
