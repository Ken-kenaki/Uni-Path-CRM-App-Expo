// app/(more)/countries.tsx - Countries list screen
import { api } from "@/lib/api";
import { useToast } from "@/lib/toast-context";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  ChevronRight,
  Flag,
  Globe,
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

interface Country {
  $id: string;
  name: string;
  code?: string;
  universities?: any[];
  students?: any[];
  isSystem?: boolean;
}

export default function CountriesScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const fetchCountries = useCallback(async () => {
    try {
      const result = await api.getCountries();
      if (result.success && result.data) {
        const items = Array.isArray(result.data)
          ? result.data
          : result.data.documents || result.data.countries || [];
        setCountries(items);
      }
    } catch {
      showToast("Failed to load countries", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  const filtered = countries.filter(
    (c) => !search || c.name?.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item }: { item: Country }) => (
    <Animated.View entering={FadeIn.duration(300)}>
      <TouchableOpacity
        className="mx-4 mb-3 p-4 rounded-2xl bg-[#111111] border border-[#1f1f1f]"
        onPress={() => router.push(`/country/${item.$id}` as any)}
        activeOpacity={0.7}
      >
        <View className="flex-row items-center">
          <View className="w-12 h-12 rounded-xl bg-emerald-500/15 items-center justify-center">
            <Flag size={22} color="#10b981" />
          </View>
          <View className="flex-1 ml-3">
            <Text className="text-white font-semibold text-[15px]">{item.name}</Text>
            <View className="flex-row items-center mt-1.5 gap-3">
              {item.universities && (
                <View className="flex-row items-center">
                  <School size={12} color="#6b7280" />
                  <Text className="text-gray-500 text-xs ml-1">
                    {item.universities.length} universities
                  </Text>
                </View>
              )}
              {item.students && (
                <View className="flex-row items-center">
                  <Users size={12} color="#6b7280" />
                  <Text className="text-gray-500 text-xs ml-1">
                    {item.students.length} students
                  </Text>
                </View>
              )}
            </View>
          </View>
          <ChevronRight size={16} color="#4b5563" />
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
      <View className="flex-row items-center px-4 pt-2 pb-4">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <ArrowLeft size={22} color="white" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-xl font-bold text-white">Countries</Text>
          <Text className="text-gray-500 text-xs">{countries.length} total</Text>
        </View>
      </View>

      <View className="mx-4 mb-4 flex-row items-center bg-[#111111] border border-[#1f1f1f] rounded-xl px-3">
        <Search size={18} color="#6b7280" />
        <TextInput
          className="flex-1 text-white py-3 px-2 text-sm"
          placeholder="Search countries..."
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
            onRefresh={() => { setRefreshing(true); fetchCountries(); }}
            tintColor="#8b5cf6"
          />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Flag size={48} color="#374151" />
            <Text className="text-gray-500 mt-4">No countries found</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
