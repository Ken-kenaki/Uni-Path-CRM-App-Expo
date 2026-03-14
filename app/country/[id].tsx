// app/country/[id].tsx - Country detail screen
import { api } from "@/lib/api";
import { useToast } from "@/lib/toast-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Building,
  Flag,
  Globe,
  GraduationCap,
  MapPin,
  RefreshCw,
  Users,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CountryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const [country, setCountry] = useState<any>(null);
  const [universities, setUniversities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"info" | "universities">("info");

  const fetchData = useCallback(async () => {
    try {
      const [countryRes, uniRes] = await Promise.all([
        api.getCountry(id),
        api.getCountryUniversities(id),
      ]);
      if (countryRes.success) setCountry(countryRes.data);
      if (uniRes.success) setUniversities(uniRes.data?.documents || uniRes.data || []);
    } catch {
      showToast("Failed to load country", "error");
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  if (!country) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <Text className="text-gray-500">Country not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Header */}
      <View className="px-4 pt-2 pb-3 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <ArrowLeft size={22} color="white" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-white font-bold text-lg" numberOfLines={1}>
            {country.name}
          </Text>
          <Text className="text-gray-500 text-xs">{universities.length} universities</Text>
        </View>
        <TouchableOpacity onPress={fetchData} className="p-2">
          <RefreshCw size={18} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View className="flex-row px-4 mb-3">
        {(["info", "universities"] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            className={`mr-2 px-5 py-2 rounded-xl ${activeTab === tab ? "bg-purple-600" : "bg-[#1a1a1a]"}`}
          >
            <Text className={`text-sm font-medium ${activeTab === tab ? "text-white" : "text-gray-400"}`}>
              {tab === "info" ? "Info" : `Universities (${universities.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === "info" ? (
        <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
          {/* Hero */}
          <View className="p-4 rounded-2xl bg-[#111111] border border-[#1f1f1f] mb-4 items-center">
            <View className="w-16 h-16 rounded-2xl bg-blue-600/20 items-center justify-center mb-3">
              <Flag size={28} color="#3b82f6" />
            </View>
            <Text className="text-white font-bold text-xl">{country.name}</Text>
          </View>

          {/* Stats */}
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1 p-4 rounded-xl bg-[#111111] border border-[#1f1f1f] items-center">
              <GraduationCap size={20} color="#8b5cf6" />
              <Text className="text-white font-bold text-xl mt-2">{universities.length}</Text>
              <Text className="text-gray-500 text-xs">Universities</Text>
            </View>
            <View className="flex-1 p-4 rounded-xl bg-[#111111] border border-[#1f1f1f] items-center">
              <Users size={20} color="#10b981" />
              <Text className="text-white font-bold text-xl mt-2">{country.studentCount || "—"}</Text>
              <Text className="text-gray-500 text-xs">Students</Text>
            </View>
          </View>

          {/* Details */}
          <View className="p-4 rounded-2xl bg-[#111111] border border-[#1f1f1f] mb-4">
            <Text className="text-gray-500 text-xs font-semibold uppercase mb-3">Details</Text>
            {country.code && (
              <View className="flex-row items-start mb-3">
                <Globe size={14} color="#6b7280" />
                <View className="ml-3 flex-1">
                  <Text className="text-gray-500 text-[10px] uppercase">Code</Text>
                  <Text className="text-white text-sm">{country.code}</Text>
                </View>
              </View>
            )}
            {country.region && (
              <View className="flex-row items-start mb-3">
                <MapPin size={14} color="#6b7280" />
                <View className="ml-3 flex-1">
                  <Text className="text-gray-500 text-[10px] uppercase">Region</Text>
                  <Text className="text-white text-sm">{country.region}</Text>
                </View>
              </View>
            )}
            {country.description && (
              <View className="mt-1">
                <Text className="text-gray-500 text-[10px] uppercase mb-1">Description</Text>
                <Text className="text-gray-300 text-sm">{country.description}</Text>
              </View>
            )}
          </View>
          <View className="h-8" />
        </ScrollView>
      ) : (
        <FlatList
          data={universities}
          keyExtractor={(item, i) => item.$id || String(i)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push(`/university/${item.$id}` as any)}
              className="mb-3 p-4 rounded-xl bg-[#111111] border border-[#1f1f1f]"
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-xl bg-purple-600/15 items-center justify-center">
                  <GraduationCap size={18} color="#8b5cf6" />
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-white font-semibold text-sm" numberOfLines={1}>
                    {item.name}
                  </Text>
                  {item.city && (
                    <View className="flex-row items-center mt-1">
                      <MapPin size={10} color="#6b7280" />
                      <Text className="text-gray-500 text-xs ml-1">{item.city}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View className="items-center py-16">
              <GraduationCap size={40} color="#374151" />
              <Text className="text-gray-500 mt-3">No universities found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
