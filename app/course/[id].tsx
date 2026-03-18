// app/course/[id].tsx - Course detail screen
import { api } from "@/lib/api";
import { useToast } from "@/lib/toast-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
    ArrowLeft,
    BookOpen,
    Calendar,
    Clock,
    DollarSign,
    GraduationCap,
    RefreshCw,
    Users,
    MapPin,
    Building
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

export default function CourseDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { showToast } = useToast();
    const [course, setCourse] = useState<any>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"info" | "students">("info");

    const fetchData = useCallback(async () => {
        try {
            const [courseRes, studentsRes] = await Promise.all([
                api.getCourse(id),
                api.getCourseStudents(id),
            ]);
            if (courseRes.success) setCourse(courseRes.data);
            if (studentsRes.success) setStudents(studentsRes.data?.students || studentsRes.data || []);
        } catch {
            showToast("Failed to load course", "error");
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

    if (!course) {
        return (
            <View className="flex-1 bg-black items-center justify-center">
                <Text className="text-gray-500">Course not found</Text>
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
                        {course.name}
                    </Text>
                    <Text className="text-gray-500 text-xs">
                        {course.level} • {students.length} students
                    </Text>
                </View>
                <TouchableOpacity onPress={fetchData} className="p-2">
                    <RefreshCw size={18} color="#6b7280" />
                </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View className="flex-row px-4 mb-3">
                {(["info", "students"] as const).map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        onPress={() => setActiveTab(tab)}
                        className={`mr-2 px-5 py-2 rounded-xl ${activeTab === tab ? "bg-purple-600" : "bg-[#1a1a1a]"}`}
                    >
                        <Text className={`text-sm font-medium ${activeTab === tab ? "text-white" : "text-gray-400"}`}>
                            {tab === "info" ? "Info" : `Students (${students.length})`}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {activeTab === "info" ? (
                <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
                    {/* Hero */}
                    <View className="p-4 rounded-2xl bg-[#111111] border border-[#1f1f1f] mb-4 items-center">
                        <View className="w-16 h-16 rounded-2xl bg-orange-600/20 items-center justify-center mb-3">
                            <BookOpen size={28} color="#f97316" />
                        </View>
                        <Text className="text-white font-bold text-xl text-center">{course.name}</Text>
                    </View>

                    {/* Details */}
                    <View className="p-4 rounded-2xl bg-[#111111] border border-[#1f1f1f] mb-4">
                        <Text className="text-gray-500 text-xs font-semibold uppercase mb-3">Course Details</Text>
                        <InfoRow icon={Building} label="University" value={course.universities?.name} />
                        <InfoRow icon={GraduationCap} label="Level" value={course.level} />
                        <InfoRow icon={Clock} label="Duration" value={course.duration} />
                        <InfoRow icon={DollarSign} label="Fees" value={course.fees ? `$${course.fees}` : null} />
                        <InfoRow icon={Calendar} label="Intake" value={course.intake} />

                        {course.description && (
                            <View className="mt-2 text-right">
                                <Text className="text-gray-500 text-[10px] uppercase mb-1">Description</Text>
                                <Text className="text-gray-300 text-sm">{course.description}</Text>
                            </View>
                        )}
                    </View>
                    <View className="h-8" />
                </ScrollView>
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
                            <Text className="text-gray-500 mt-3">No students enrolled in this course</Text>
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
