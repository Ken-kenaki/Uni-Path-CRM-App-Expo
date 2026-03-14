// app/(more)/universities.tsx - Universities list screen
import { api } from "@/lib/api";
import { useToast } from "@/lib/toast-context";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Globe,
  MapPin,
  School,
  Search,
  Users,
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

interface University {
  $id: string;
  name: string;
  country?: string | { name?: string; $id?: string };
  city?: string;
  type?: string;
  ranking?: number;
  coursesCount?: number;
  studentsCount?: number;
  courses?: any[];
  students?: any[];
}

export default function UniversitiesScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const fetchUniversities = useCallback(async () => {
    try {
      const result = await api.getUniversities();
      if (result.success && result.data) {
        const items = Array.isArray(result.data)
          ? result.data
          : result.data.documents || result.data.universities || [];
        setUniversities(items);
      }
    } catch {
      showToast("Failed to load universities", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchUniversities();
  }, [fetchUniversities]);

  const filtered = universities.filter((u) =>
    !search || u.name?.toLowerCase().includes(search.toLowerCase())
  );

  const getCountryName = (country: University["country"]) => {
    if (!country) return "Unknown";
    if (typeof country === "string") return country;
    return country.name || "Unknown";
  };

  const renderItem = ({ item }: { item: University }) => (
    <Animated.View entering={FadeIn.duration(300)}>
      <TouchableOpacity
        className="mx-4 mb-3 p-4 rounded-2xl bg-[#111111] border border-[#1f1f1f]"
        onPress={() => router.push(`/university/${item.$id}` as any)}
        activeOpacity={0.7}
      >
        <View className="flex-row items-center">
          <View className="w-12 h-12 rounded-xl bg-blue-500/15 items-center justify-center">
            <School size={22} color="#3b82f6" />
          </View>
          <View className="flex-1 ml-3">
            <Text className="text-white font-semibold text-[15px]" numberOfLines={1}>
              {item.name}
            </Text>
            <View className="flex-row items-center mt-1">
              <MapPin size={12} color="#6b7280" />
              <Text className="text-gray-500 text-xs ml-1">
                {getCountryName(item.country)}
                {item.city ? `, ${item.city}` : ""}
              </Text>
            </View>
          </View>
          <View className="items-end">
            {item.courses && (
              <View className="flex-row items-center">
                <BookOpen size={12} color="#8b5cf6" />
                <Text className="text-gray-400 text-xs ml-1">{item.courses.length}</Text>
              </View>
            )}
            <ChevronRight size={16} color="#4b5563" className="mt-1" />
          </View>
        </View>
      </TouchableOpacity>
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
      {/* Header */}
      <View className="flex-row items-center px-4 pt-2 pb-4">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <ArrowLeft size={22} color="white" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-xl font-bold text-white">Universities</Text>
          <Text className="text-gray-500 text-xs">{universities.length} total</Text>
        </View>
      </View>

      {/* Search */}
      <View className="mx-4 mb-4 flex-row items-center bg-[#111111] border border-[#1f1f1f] rounded-xl px-3">
        <Search size={18} color="#6b7280" />
        <TextInput
          className="flex-1 text-white py-3 px-2 text-sm"
          placeholder="Search universities..."
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
            onRefresh={() => { setRefreshing(true); fetchUniversities(); }}
            tintColor="#8b5cf6"
          />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <School size={48} color="#374151" />
            <Text className="text-gray-500 mt-4">No universities found</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
