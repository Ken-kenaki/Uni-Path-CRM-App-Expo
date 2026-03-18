// app/university/[id].tsx - University detail screen
import { api } from "@/lib/api";
import { useToast } from "@/lib/toast-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  BookOpen,
  Building,
  Calendar,
  Clock,
  DollarSign,
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

export default function UniversityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const [university, setUniversity] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"info" | "courses" | "students">("info");

  const fetchData = useCallback(async () => {
    try {
      const [uniRes, coursesRes, studentsRes] = await Promise.all([
        api.getUniversity(id),
        api.getUniversityCourses(id),
        api.getUniversityStudents(id),
      ]);
      if (uniRes.success) setUniversity(uniRes.data);
      if (coursesRes.success) setCourses(coursesRes.data?.documents || coursesRes.data || []);
      if (studentsRes.success) setStudents(studentsRes.data?.students || studentsRes.data || []);
    } catch {
      showToast("Failed to load university", "error");
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

  if (!university) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <Text className="text-gray-500">University not found</Text>
      </View>
    );
  }

  const LEVEL_COLORS: Record<string, string> = {
    Undergraduate: "#3b82f6",
    Postgraduate: "#8b5cf6",
    Doctorate: "#f59e0b",
    Foundation: "#10b981",
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Header */}
      <View className="px-4 pt-2 pb-3 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <ArrowLeft size={22} color="white" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-white font-bold text-lg" numberOfLines={1}>
            {university.name}
          </Text>
          <View className="flex-row items-center mt-0.5">
            <Text className="text-gray-500 text-xs">
              {courses.length} courses • {students.length} students
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={fetchData} className="p-2">
          <RefreshCw size={18} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="max-h-12 mb-3">
        <View className="flex-row px-4">
          {(["info", "courses", "students"] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`mr-2 px-5 py-2 rounded-xl h-10 ${activeTab === tab ? "bg-purple-600" : "bg-[#1a1a1a]"}`}
            >
              <Text className={`text-sm font-medium ${activeTab === tab ? "text-white" : "text-gray-400"}`}>
                {tab === "info" ? "Info" : tab === "courses" ? `Courses (${courses.length})` : `Students (${students.length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {activeTab === "info" ? (
        <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
          {/* Hero Card */}
          <View className="p-4 rounded-2xl bg-[#111111] border border-[#1f1f1f] mb-4">
            <View className="items-center mb-4">
              <View className="w-16 h-16 rounded-2xl bg-purple-600/20 items-center justify-center mb-3">
                <GraduationCap size={28} color="#8b5cf6" />
              </View>
              <Text className="text-white font-bold text-xl text-center">{university.name}</Text>
            </View>
          </View>

          {/* Details */}
          <View className="p-4 rounded-2xl bg-[#111111] border border-[#1f1f1f] mb-4">
            <Text className="text-gray-500 text-xs font-semibold uppercase mb-3">Details</Text>
            <InfoRow icon={Globe} label="Country" value={university.countries?.name} />
            <InfoRow icon={MapPin} label="City" value={university.city} />
            <InfoRow icon={BookOpen} label="Courses" value={`${courses.length} available`} />
            <InfoRow icon={Users} label="Enrolled Students" value={`${students.length} students`} />
            {university.website && <InfoRow icon={Globe} label="Website" value={university.website} />}
            {university.description && (
              <View className="mt-2">
                <Text className="text-gray-500 text-[10px] uppercase mb-1">Description</Text>
                <Text className="text-gray-300 text-sm">{university.description}</Text>
              </View>
            )}
          </View>
          <View className="h-8" />
        </ScrollView>
      ) : activeTab === "courses" ? (
        <FlatList
          data={courses}
          keyExtractor={(item, i) => item.$id || String(i)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
          renderItem={({ item }) => {
            const lvlColor = LEVEL_COLORS[item.level] || "#6b7280";
            return (
              <TouchableOpacity
                onPress={() => router.push(`/course/${item.$id}` as any)}
                className="mb-3 p-4 rounded-xl bg-[#111111] border border-[#1f1f1f]"
              >
                <View className="flex-row items-start">
                  <View className="flex-1">
                    <Text className="text-white font-semibold text-sm" numberOfLines={2}>
                      {item.name}
                    </Text>
                    {item.level && (
                      <View className="flex-row items-center mt-1.5">
                        <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: `${lvlColor}20` }}>
                          <Text style={{ color: lvlColor }} className="text-[10px] font-semibold">
                            {item.level}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
                <View className="flex-row flex-wrap mt-3 gap-x-4 gap-y-1">
                  {item.duration && (
                    <View className="flex-row items-center">
                      <Clock size={12} color="#6b7280" />
                      <Text className="text-gray-400 text-xs ml-1">{item.duration}</Text>
                    </View>
                  )}
                  {item.fees != null && (
                    <View className="flex-row items-center">
                      <DollarSign size={12} color="#6b7280" />
                      <Text className="text-gray-400 text-xs ml-1">${item.fees}</Text>
                    </View>
                  )}
                  {item.intake && (
                    <View className="flex-row items-center">
                      <Calendar size={12} color="#6b7280" />
                      <Text className="text-gray-400 text-xs ml-1">{item.intake}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View className="items-center py-16">
              <BookOpen size={40} color="#374151" />
              <Text className="text-gray-500 mt-3">No courses found</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={students}
          keyExtractor={(item, i) => item.$id || String(i)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push(`/student/${item.$id}` as any)}
              className="mb-3 p-4 rounded-xl bg-[#111111] border border-[#1f1f1f]"
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-xl bg-green-500/15 items-center justify-center">
                  <Users size={18} color="#10b981" />
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-white font-semibold text-sm" numberOfLines={1}>
                    {item.firstName} {item.lastName}
                  </Text>
                  <Text className="text-gray-500 text-xs mt-1" numberOfLines={1}>
                    {item.email}
                  </Text>
                </View>
                <View className={`px-2 py-0.5 rounded-full bg-blue-500/10`}>
                  <Text className="text-[10px] text-blue-400 font-medium uppercase">{item.leadStatus || "New"}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View className="items-center py-16">
              <Users size={40} color="#374151" />
              <Text className="text-gray-500 mt-3">No students found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View className="flex-row items-start mb-3">
      <Icon size={14} color="#6b7280" />
      <View className="ml-3 flex-1">
        <Text className="text-gray-500 text-[10px] uppercase">{label}</Text>
        <Text className="text-white text-sm">{value}</Text>
      </View>
    </View>
  );
}
