import { useRouter } from "expo-router";
import {
    Building2,
    ChevronRight,
    Filter,
    Plus,
    Search,
} from "lucide-react-native";
import React, { useState } from "react";
import {
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface University {
  id: string;
  name: string;
  location: string;
  country: string;
  students: number;
  status: "active" | "pending" | "inactive";
  partnershipDate: string;
}

export default function UniversitiesTab() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [theme] = useState<"dark">("dark");

  const universities: University[] = [
    {
      id: "1",
      name: "Harvard University",
      location: "Cambridge, MA",
      country: "USA",
      students: 150,
      status: "active",
      partnershipDate: "2023-01-15",
    },
    {
      id: "2",
      name: "Stanford University",
      location: "Stanford, CA",
      country: "USA",
      students: 120,
      status: "active",
      partnershipDate: "2023-03-22",
    },
    {
      id: "3",
      name: "MIT",
      location: "Cambridge, MA",
      country: "USA",
      students: 95,
      status: "active",
      partnershipDate: "2023-05-10",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-400";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/10 dark:text-yellow-400";
      case "inactive":
        return "bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-500/10 dark:text-gray-400";
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="flex-1 p-4">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-gray-900 dark:text-white">
            Universities
          </Text>
          <Text className="text-gray-600 dark:text-gray-400 mt-2">
            Manage university partnerships and agreements
          </Text>
        </View>

        {/* Search and Actions */}
        <View className="flex-row gap-3 mb-6">
          <View className="flex-1 flex-row items-center bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4">
            <Search size={20} className="text-gray-400 dark:text-gray-500" />
            <TextInput
              placeholder="Search universities..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-3 py-3 text-gray-900 dark:text-white"
              placeholderTextColor="#9ca3af"
            />
          </View>
          <TouchableOpacity className="p-3 bg-purple-600 rounded-xl">
            <Filter size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity className="p-3 bg-purple-600 rounded-xl">
            <Plus size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Universities List */}
        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="space-y-4">
            {universities.map((university) => (
              <TouchableOpacity
                key={university.id}
                onPress={() => {}}
                className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-4">
                    <View className="p-3 bg-purple-100 dark:bg-purple-500/20 rounded-xl">
                      <Building2
                        size={24}
                        className="text-purple-600 dark:text-purple-400"
                      />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center gap-3">
                        <Text className="text-lg font-semibold text-gray-900 dark:text-white">
                          {university.name}
                        </Text>
                        <View
                          className={`px-2 py-1 rounded-full ${getStatusColor(university.status)}`}
                        >
                          <Text className="text-xs font-medium">
                            {university.status.charAt(0).toUpperCase() +
                              university.status.slice(1)}
                          </Text>
                        </View>
                      </View>
                      <Text className="text-gray-600 dark:text-gray-400 mt-1">
                        {university.location}, {university.country}
                      </Text>
                      <View className="flex-row items-center gap-4 mt-2">
                        <Text className="text-sm text-gray-500 dark:text-gray-400">
                          🎓 {university.students} students
                        </Text>
                        <Text className="text-sm text-gray-500 dark:text-gray-400">
                          📅{" "}
                          {new Date(
                            university.partnershipDate,
                          ).toLocaleDateString()}
                        </Text>
                      </View>
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

          {/* Quick Stats */}
          <View className="mt-8 mb-4">
            <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Partnership Overview
            </Text>
            <View className="grid grid-cols-2 gap-4">
              <View className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <Text className="text-2xl font-bold text-gray-900 dark:text-white">
                  {universities.length}
                </Text>
                <Text className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  Total Universities
                </Text>
              </View>
              <View className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <Text className="text-2xl font-bold text-gray-900 dark:text-white">
                  {universities.reduce((sum, u) => sum + u.students, 0)}
                </Text>
                <Text className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  Total Students
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
