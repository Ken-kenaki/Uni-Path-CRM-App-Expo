// app/(tabs)/students.tsx
import { API_URL } from "@/config";
import { LinearGradient } from "expo-linear-gradient";
import {
  Calendar,
  Mail,
  Phone,
  PhoneCall,
  Search,
  Users,
  X,
} from "lucide-react-native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Linking,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { SlideInDown, SlideOutDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

// ============ TYPES ============
interface Student {
  id: string;
  $id: string;
  firstName: string;
  lastName: string;
  email: string;
  contact: string;
  status: "new" | "in_process" | "qualified" | "rejected";
  $createdAt: string;
  gender?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  lastDegree?: string;
  degreeGPA?: number;
  currentInstitution?: string;
  avatar?: string;
}

// ============ CACHE MANAGER ============
class CacheManager {
  private cache = new Map<string, any>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + (ttl || this.defaultTTL),
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

const cacheManager = new CacheManager();

// ============ COMPONENTS ============

// Status Badge Component
const StatusBadge = ({ status }: { status: string }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-500/20 text-blue-400";
      case "in_process":
        return "bg-yellow-500/20 text-yellow-400";
      case "qualified":
        return "bg-green-500/20 text-green-400";
      case "rejected":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const getStatusText = (status: string) => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <View className={`px-3 py-1 rounded-full ${getStatusColor(status)}`}>
      <Text className="text-xs font-medium">{getStatusText(status)}</Text>
    </View>
  );
};

// Student Card Component
const StudentCard = ({
  student,
  onPress,
}: {
  student: Student;
  onPress: () => void;
}) => {
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      className="m-2 p-4 rounded-2xl bg-gray-900 border border-gray-800"
      style={{ width: (width - 32) / 2 - 8 }}
    >
      <View className="items-center mb-3">
        {student.avatar ? (
          <Image
            source={{ uri: student.avatar }}
            className="w-16 h-16 rounded-full mb-3 border-2 border-purple-500"
          />
        ) : (
          <View className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 items-center justify-center mb-3">
            <Text className="text-white text-xl font-bold">
              {getInitials(student.firstName, student.lastName)}
            </Text>
          </View>
        )}
      </View>

      <Text
        className="font-semibold text-center text-white mb-2"
        numberOfLines={1}
      >
        {student.firstName} {student.lastName}
      </Text>

      <View className="space-y-2 mb-3">
        <View className="flex-row items-center">
          <Mail size={14} color="#9ca3af" />
          <Text className="text-xs text-gray-400 ml-2 flex-1" numberOfLines={1}>
            {student.email}
          </Text>
        </View>

        <View className="flex-row items-center">
          <Phone size={14} color="#9ca3af" />
          <Text className="text-xs text-gray-400 ml-2 flex-1" numberOfLines={1}>
            {student.contact || "N/A"}
          </Text>
        </View>
      </View>

      <View className="flex-row justify-between items-center pt-3 border-t border-gray-800">
        <StatusBadge status={student.status || "new"} />

        <View className="flex-row items-center">
          <Calendar size={12} color="#9ca3af" />
          <Text className="text-xs text-gray-400 ml-1">
            {new Date(student.$createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Student Detail Modal Component
const StudentDetailModal = ({
  student,
  isOpen,
  onClose,
}: {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [activeTab, setActiveTab] = useState<"overview" | "academic">(
    "overview",
  );

  if (!student) return null;

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  const handleCallPress = () => {
    if (student.contact) {
      const phoneNumber = student.contact.replace(/\D/g, "");
      const url = `tel:${phoneNumber}`;
      Linking.openURL(url).catch((err) => {
        Alert.alert("Error", "Could not make the call");
        console.error("Error opening phone app:", err);
      });
    }
  };

  const handleEmailPress = () => {
    if (student.email) {
      const url = `mailto:${student.email}`;
      Linking.openURL(url).catch((err) => {
        Alert.alert("Error", "Could not open email app");
        console.error("Error opening email app:", err);
      });
    }
  };

  return (
    <Modal visible={isOpen} animationType="slide" transparent={true}>
      <View className="flex-1 bg-black/50 justify-end">
        <Animated.View
          entering={SlideInDown.duration(300)}
          exiting={SlideOutDown.duration(200)}
          className="bg-gray-900 rounded-t-3xl p-6 max-h-[85vh]"
        >
          <View className="flex-row justify-between items-center mb-6">
            <View>
              <Text className="text-xl font-bold text-white">
                Student Details
              </Text>
              <Text className="text-sm text-gray-400 mt-1">
                View student information
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="white" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Student Header */}
            <View className="items-center mb-6">
              {student.avatar ? (
                <Image
                  source={{ uri: student.avatar }}
                  className="w-20 h-20 rounded-full mb-3 border-2 border-purple-500"
                />
              ) : (
                <View className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 items-center justify-center mb-3">
                  <Text className="text-white text-2xl font-bold">
                    {getInitials(student.firstName, student.lastName)}
                  </Text>
                </View>
              )}
              <Text className="text-xl font-bold text-white">
                {student.firstName} {student.lastName}
              </Text>
              <Text className="text-sm text-gray-400">{student.email}</Text>
              <StatusBadge status={student.status || "new"} />

              {/* Call and Email Buttons */}
              <View className="flex-row gap-3 mt-4">
                {student.contact && (
                  <TouchableOpacity
                    onPress={handleCallPress}
                    className="flex-row items-center gap-2 px-4 py-2 bg-green-600 rounded-xl"
                  >
                    <PhoneCall size={18} color="white" />
                    <Text className="text-white font-medium">Call</Text>
                  </TouchableOpacity>
                )}

                {student.email && (
                  <TouchableOpacity
                    onPress={handleEmailPress}
                    className="flex-row items-center gap-2 px-4 py-2 bg-blue-600 rounded-xl"
                  >
                    <Mail size={18} color="white" />
                    <Text className="text-white font-medium">Email</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Tabs */}
            <View className="flex-row border-b border-gray-800 mb-4">
              {(["overview", "academic"] as const).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  className={`flex-1 py-2 items-center border-b-2 ${activeTab === tab ? "border-purple-600" : "border-transparent"}`}
                >
                  <Text
                    className={`text-sm font-medium ${activeTab === tab ? "text-purple-400" : "text-gray-400"}`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Tab Content */}
            {activeTab === "overview" && (
              <View className="space-y-4">
                <View className="grid grid-cols-2 gap-3">
                  <View className="p-3 rounded-lg bg-gray-800">
                    <Text className="text-xs text-gray-400">Contact</Text>
                    <Text className="font-medium text-white">
                      {student.contact || "N/A"}
                    </Text>
                  </View>
                  <View className="p-3 rounded-lg bg-gray-800">
                    <Text className="text-xs text-gray-400">Gender</Text>
                    <Text className="font-medium text-white">
                      {student.gender || "N/A"}
                    </Text>
                  </View>
                  <View className="p-3 rounded-lg bg-gray-800">
                    <Text className="text-xs text-gray-400">Date of Birth</Text>
                    <Text className="font-medium text-white">
                      {student.dateOfBirth || "N/A"}
                    </Text>
                  </View>
                </View>

                {student.address && (
                  <View>
                    <Text className="font-medium text-white mb-2">Address</Text>
                    <Text className="text-sm text-white">
                      {student.address}
                      {student.city && `, ${student.city}`}
                      {student.state && `, ${student.state}`}
                      {student.zipCode && ` ${student.zipCode}`}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {activeTab === "academic" && (
              <View className="space-y-4">
                <View className="grid grid-cols-2 gap-3">
                  <View className="p-3 rounded-lg bg-blue-500/20">
                    <Text className="text-xs text-blue-400">
                      Highest Degree
                    </Text>
                    <Text className="font-medium text-white">
                      {student.lastDegree || "N/A"}
                    </Text>
                  </View>
                  <View className="p-3 rounded-lg bg-green-500/20">
                    <Text className="text-xs text-green-400">Bachelor GPA</Text>
                    <Text className="font-medium text-white">
                      {student.degreeGPA || "N/A"}
                    </Text>
                  </View>
                </View>

                {student.currentInstitution && (
                  <View>
                    <Text className="font-medium text-white mb-2">
                      Current Institution
                    </Text>
                    <Text className="text-sm text-white">
                      {student.currentInstitution}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* Close Button */}
          <TouchableOpacity
            onPress={onClose}
            className="mt-6 py-3 border border-gray-700 rounded-xl items-center"
          >
            <Text className="text-white">Close</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

// ============ MAIN PAGE COMPONENT ============
export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedStudentDetail, setSelectedStudentDetail] =
    useState<Student | null>(null);

  const flatListRef = useRef<FlatList>(null);

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info") => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 4000);
    },
    [],
  );

  const cachedFetch = useCallback(
    async <T,>(
      url: string,
      cacheKey: string,
      ttl: number = 5 * 60 * 1000,
    ): Promise<T> => {
      const cachedData = cacheManager.get<T>(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      const response = await fetch(`${API_URL}${url}`);
      const result = await response.json();

      if (result.success) {
        cacheManager.set(cacheKey, result.data || result, ttl);
        return result.data || result;
      } else {
        throw new Error(result.error || "Fetch failed");
      }
    },
    [],
  );

  const fetchStudents = async (isBackgroundUpdate = false) => {
    try {
      if (!isBackgroundUpdate) {
        setLoading(true);
      }

      const cacheKey = `students:${searchQuery}:${statusFilter}`;
      const url = `/dashboard/students${
        searchQuery || statusFilter !== "all"
          ? `?${new URLSearchParams({
              ...(searchQuery && { search: searchQuery }),
              ...(statusFilter !== "all" && { status: statusFilter }),
            })}`
          : ""
      }`;

      const studentsData = await cachedFetch<Student[]>(
        url,
        cacheKey,
        2 * 60 * 1000,
      );
      setStudents(studentsData || []);
    } catch (error) {
      console.error("Error fetching students:", error);
      showToast("Failed to fetch students", "error");
      setStudents([]);
    } finally {
      if (!isBackgroundUpdate) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [searchQuery, statusFilter]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    showToast("Refreshing students...", "info");
    cacheManager.delete("students");
    fetchStudents();
  }, [fetchStudents]);

  const openDetailModal = (student: Student) => {
    setSelectedStudentDetail(student);
    setDetailModalOpen(true);
  };

  const handleStudentPress = (student: Student) => {
    openDetailModal(student);
  };

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      if (statusFilter !== "all" && student.status !== statusFilter)
        return false;
      if (!searchQuery) return true;

      const searchLower = searchQuery.toLowerCase();
      return (
        student.firstName.toLowerCase().includes(searchLower) ||
        student.lastName.toLowerCase().includes(searchLower) ||
        student.email.toLowerCase().includes(searchLower) ||
        (student.contact && student.contact.toLowerCase().includes(searchLower))
      );
    });
  }, [students, searchQuery, statusFilter]);

  const stats = [
    {
      icon: Users,
      label: "Total Students",
      value: students.length.toString(),
      color: "bg-purple-500",
    },
    {
      icon: Users,
      label: "New",
      value: students.filter((s) => s.status === "new").length.toString(),
      color: "bg-blue-500",
    },
    {
      icon: Users,
      label: "In Process",
      value: students
        .filter((s) => s.status === "in_process")
        .length.toString(),
      color: "bg-yellow-500",
    },
    {
      icon: Users,
      label: "Qualified",
      value: students.filter((s) => s.status === "qualified").length.toString(),
      color: "bg-green-500",
    },
  ];

  const statusFilters = [
    { value: "all", label: "All Students" },
    { value: "new", label: "New" },
    { value: "in_process", label: "In Process" },
    { value: "qualified", label: "Qualified" },
    { value: "rejected", label: "Rejected" },
  ];

  const StatsCard = ({ icon: Icon, title, value, color }: any) => (
    <View className="bg-gray-900 rounded-lg p-4 border border-gray-800">
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-bold text-white">{value}</Text>
          <Text className="text-sm text-gray-400">{title}</Text>
        </View>
        <View
          className={`w-10 h-10 rounded-lg ${color} items-center justify-center`}
        >
          <Icon size={20} color="white" />
        </View>
      </View>
    </View>
  );

  if (loading && students.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text className="mt-4 text-white">Loading students...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Toast Notification */}
      {toast && (
        <Animated.View
          entering={SlideInDown.duration(300)}
          exiting={SlideOutDown.duration(200)}
          className="absolute top-4 left-4 right-4 z-50"
        >
          <LinearGradient
            colors={
              toast.type === "success"
                ? ["#10b981", "#059669"]
                : toast.type === "error"
                  ? ["#ef4444", "#dc2626"]
                  : ["#3b82f6", "#2563eb"]
            }
            className="rounded-xl px-6 py-4 flex-row items-center justify-between shadow-2xl"
          >
            <Text className="text-white font-medium flex-1">
              {toast.message}
            </Text>
            <TouchableOpacity onPress={() => setToast(null)}>
              <X size={20} color="white" />
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      )}

      {/* Header */}
      <View className="p-4">
        <View className="mb-4">
          <Text className="text-2xl font-bold text-white">Students</Text>
          <Text className="text-sm text-gray-400 mt-1">
            View student information
          </Text>
        </View>

        {/* Search Bar */}
        <View className="relative mb-4">
          <Search
            size={20}
            color="#9ca3af"
            className="absolute left-3 top-30 z-10"
          />
          <TextInput
            placeholder="Search students..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="pl-10 pr-4 py-3 bg-gray-900 rounded-xl border border-gray-800 text-white"
          />
        </View>

        {/* Status Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-4"
        >
          <View className="flex-row gap-2">
            {statusFilters.map((filter) => (
              <TouchableOpacity
                key={filter.value}
                onPress={() => setStatusFilter(filter.value)}
                className={`px-3 py-1.5 rounded-lg ${
                  statusFilter === filter.value
                    ? "bg-purple-600"
                    : "bg-gray-900 border border-gray-800"
                }`}
              >
                <Text
                  className={
                    statusFilter === filter.value ? "text-white" : "text-white"
                  }
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Stats Cards */}
      <View className="px-4 mb-6">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="pb-2"
        >
          <View className="flex-row gap-3">
            {stats.map((stat, index) => (
              <StatsCard
                key={index}
                icon={stat.icon}
                title={stat.label}
                value={stat.value}
                color={stat.color}
              />
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Students Grid */}
      <FlatList
        ref={flatListRef}
        data={filteredStudents}
        numColumns={2}
        keyExtractor={(item) => item.$id}
        renderItem={({ item }) => (
          <StudentCard
            student={item}
            onPress={() => handleStudentPress(item)}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#8b5cf6"]}
            tintColor="#8b5cf6"
          />
        }
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20">
            <Users size={48} color="#9ca3af" />
            <Text className="text-lg font-medium mt-4 text-white">
              {searchQuery ? "No matching students found" : "No students yet"}
            </Text>
            <Text className="text-sm text-gray-400 mt-2 text-center">
              {searchQuery
                ? "Try a different search term"
                : "No students available"}
            </Text>
          </View>
        }
      />

      {/* Student Detail Modal */}
      <StudentDetailModal
        student={selectedStudentDetail}
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedStudentDetail(null);
        }}
      />
    </SafeAreaView>
  );
}
