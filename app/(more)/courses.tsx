// app/(more)/courses.tsx - Courses list screen
import { api } from "@/lib/api";
import { useToast } from "@/lib/toast-context";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Clock,
  DollarSign,
  School,
  Search,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

interface Course {
  $id: string;
  name: string;
  code?: string;
  duration?: string;
  fees?: number;
  level?: string;
  university?: { name?: string; $id?: string } | string;
  intake?: string;
  type?: string;
}

export default function CoursesScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const fetchCourses = useCallback(async () => {
    try {
      const result = await api.getCourses();
      if (result.success && result.data) {
        const items = Array.isArray(result.data)
          ? result.data
          : result.data.documents || result.data.courses || [];
        setCourses(items);
      }
    } catch {
      showToast("Failed to load courses", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const filtered = courses.filter(
    (c) => !search || c.name?.toLowerCase().includes(search.toLowerCase())
  );

  const getUniName = (uni: Course["university"]) => {
    if (!uni) return "";
    if (typeof uni === "string") return uni;
    return uni.name || "";
  };

  const renderItem = ({ item }: { item: Course }) => (
    <Animated.View entering={FadeIn.duration(300)}>
      <View className="mx-4 mb-3 p-4 rounded-2xl bg-[#111111] border border-[#1f1f1f]">
        <View className="flex-row items-start">
          <View className="w-10 h-10 rounded-xl bg-amber-500/15 items-center justify-center">
            <BookOpen size={18} color="#f59e0b" />
          </View>
          <View className="flex-1 ml-3">
            <Text className="text-white font-semibold text-[15px]" numberOfLines={2}>
              {item.name}
            </Text>
            {getUniName(item.university) ? (
              <View className="flex-row items-center mt-1">
                <School size={12} color="#6b7280" />
                <Text className="text-gray-500 text-xs ml-1" numberOfLines={1}>
                  {getUniName(item.university)}
                </Text>
              </View>
            ) : null}
          </View>
          {item.level && (
            <View className="px-2 py-0.5 rounded-full bg-purple-500/15">
              <Text className="text-purple-400 text-[10px] font-medium">{item.level}</Text>
            </View>
          )}
        </View>
        <View className="flex-row items-center mt-3 pt-3 border-t border-[#1f1f1f] gap-4">
          {item.duration && (
            <View className="flex-row items-center">
              <Clock size={12} color="#6b7280" />
              <Text className="text-gray-500 text-xs ml-1">{item.duration}</Text>
            </View>
          )}
          {item.fees != null && item.fees > 0 && (
            <View className="flex-row items-center">
              <DollarSign size={12} color="#6b7280" />
              <Text className="text-gray-500 text-xs ml-1">
                {new Intl.NumberFormat("en-US").format(item.fees)}
              </Text>
            </View>
          )}
          {item.intake && (
            <View className="flex-row items-center">
              <Calendar size={12} color="#6b7280" />
              <Text className="text-gray-500 text-xs ml-1">{item.intake}</Text>
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );

  if (loading) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-row items-center px-4 pt-2 pb-4">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <ArrowLeft size={22} color="white" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-xl font-bold text-white">Courses</Text>
          <Text className="text-gray-500 text-xs">{courses.length} total</Text>
        </View>
      </View>

      <View className="mx-4 mb-4 flex-row items-center bg-[#111111] border border-[#1f1f1f] rounded-xl px-3">
        <Search size={18} color="#6b7280" />
        <TextInput
          className="flex-1 text-white py-3 px-2 text-sm"
          placeholder="Search courses..."
          placeholderTextColor="#6b7280"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.$id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchCourses(); }}
            tintColor="#8b5cf6"
          />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <BookOpen size={48} color="#374151" />
            <Text className="text-gray-500 mt-4">No courses found</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
