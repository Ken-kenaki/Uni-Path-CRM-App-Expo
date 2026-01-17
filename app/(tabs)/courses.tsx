// app/(tabs)/courses.tsx
import { API_URL } from "@/config";
import { Theme, themeConfigs } from "@/theme";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
    BookOpen,
    Building,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Clock,
    DollarSign,
    Edit,
    GraduationCap,
    Grid,
    List,
    MoreVertical,
    Plus,
    RefreshCw,
    Search,
    Trash2,
    X
} from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Alert,
    Dimensions,
    FlatList,
    Modal,
    RefreshControl,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import Animated, {
    FadeIn,
    FadeOut,
    SlideInDown,
    SlideOutDown,
    ZoomIn,
    ZoomOut,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

interface Course {
  $id: string;
  name: string;
  level?: 'undergraduate' | 'postgraduate' | 'diploma' | 'certificate' | 'phd';
  duration?: string;
  tuitionFee?: number;
  intakeMonths?: string[];
  description?: string;
  universities: string;
  createdBy: string;
  isSystem: boolean;
  $createdAt: string;
  $updatedAt: string;
  university?: {
    name: string;
    id: string;
  };
}

interface University {
  $id: string;
  name: string;
}

const LEVEL_OPTIONS = [
  { value: 'undergraduate', label: 'Undergraduate' },
  { value: 'postgraduate', label: 'Postgraduate' },
  { value: 'diploma', label: 'Diploma' },
  { value: 'certificate', label: 'Certificate' },
  { value: 'phd', label: 'PhD' }
];

const MONTH_OPTIONS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [theme, setTheme] = useState<Theme>("dark");
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  
  // Pagination and filtering states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterType, setFilterType] = useState<"all" | "system" | "custom">("all");
  const [selectedUniversity, setSelectedUniversity] = useState<string>("all");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const currentTheme = themeConfigs[theme];

  const showToast = useCallback((message: string, type: "success" | "error" | "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
    Haptics.notificationAsync(
      type === "success" 
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Error
    );
  }, []);

  const fetchUniversities = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/dashboard/universities`);
      const result = await response.json();
      if (result.success) {
        setUniversities(result.data || []);
      } else {
        setUniversities([]);
      }
    } catch (error) {
      console.error("Error fetching universities:", error);
      setUniversities([]);
      showToast("Error fetching universities", "error");
    }
  }, [showToast]);

  const fetchCourses = useCallback(async (page = 1, search = searchQuery) => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(search && { search }),
        ...(selectedUniversity !== "all" && { universityId: selectedUniversity }),
        ...(selectedLevel !== "all" && { level: selectedLevel }),
        ...(filterType !== "all" && { type: filterType }),
      });

      const response = await fetch(`${API_URL}/dashboard/courses?${params}`);
      const result = await response.json();

      if (result.success) {
        setCourses(result.data?.documents || []);
        setTotalPages(result.data?.totalPages || 1);
        setCurrentPage(page);
      } else {
        showToast("Failed to fetch courses", "error");
        setCourses([]);
      }
    } catch (error) {
      showToast("Error fetching courses", "error");
      setCourses([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast, selectedUniversity, selectedLevel, filterType, searchQuery]);

  useEffect(() => {
    fetchCourses(1);
    fetchUniversities();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCourses(1);
  }, [fetchCourses]);

  const [formData, setFormData] = useState({
    name: "",
    level: "",
    duration: "",
    tuitionFee: "",
    intakeMonths: [] as string[],
    description: "",
    universities: "",
  });

  const createCourse = async () => {
    try {
      const response = await fetch(`${API_URL}/dashboard/courses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          tuitionFee: formData.tuitionFee ? parseInt(formData.tuitionFee) : undefined,
        }),
      });
      const result = await response.json();

      if (result.success) {
        showToast("Course created successfully", "success");
        setShowCreateModal(false);
        setFormData({
          name: "",
          level: "",
          duration: "",
          tuitionFee: "",
          intakeMonths: [],
          description: "",
          universities: "",
        });
        onRefresh();
      } else {
        showToast(result.error || "Failed to create course", "error");
      }
    } catch (error) {
      showToast("Error creating course", "error");
    }
  };

  const updateCourse = async () => {
    if (!selectedCourse) return;
    try {
      const response = await fetch(`${API_URL}/dashboard/courses/${selectedCourse.$id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          tuitionFee: formData.tuitionFee ? parseInt(formData.tuitionFee) : undefined,
        }),
      });
      const result = await response.json();

      if (result.success) {
        showToast("Course updated successfully", "success");
        setShowEditModal(false);
        setSelectedCourse(null);
        setFormData({
          name: "",
          level: "",
          duration: "",
          tuitionFee: "",
          intakeMonths: [],
          description: "",
          universities: "",
        });
        onRefresh();
      } else {
        showToast(result.error || "Failed to update course", "error");
      }
    } catch (error) {
      showToast("Error updating course", "error");
    }
  };

  const deleteCourse = async (courseId: string) => {
    Alert.alert(
      "Delete Course",
      "Are you sure you want to delete this course?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/dashboard/courses/${courseId}`, {
                method: "DELETE",
              });
              const result = await response.json();

              if (result.success) {
                showToast("Course deleted successfully", "success");
                onRefresh();
                setActionMenuOpen(null);
              } else {
                showToast(result.error || "Failed to delete course", "error");
              }
            } catch (error) {
              showToast("Error deleting course", "error");
            }
          },
        },
      ]
    );
  };

  const openCreateModal = useCallback(() => {
    setFormData({
      name: "",
      level: "",
      duration: "",
      tuitionFee: "",
      intakeMonths: [],
      description: "",
      universities: "",
    });
    setSelectedCourse(null);
    setShowCreateModal(true);
    setActionMenuOpen(null);
  }, []);

  const openEditModal = useCallback((course: Course) => {
    if (course.isSystem) {
      showToast("Cannot edit system courses", "error");
      return;
    }
    setSelectedCourse(course);
    setFormData({
      name: course.name,
      level: course.level || "",
      duration: course.duration || "",
      tuitionFee: course.tuitionFee?.toString() || "",
      intakeMonths: course.intakeMonths || [],
      description: course.description || "",
      universities: course.universities,
    });
    setShowEditModal(true);
    setActionMenuOpen(null);
  }, [showToast]);

  const closeModals = useCallback(() => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedCourse(null);
    setFormData({
      name: "",
      level: "",
      duration: "",
      tuitionFee: "",
      intakeMonths: [],
      description: "",
      universities: "",
    });
  }, []);

  const handleActionMenuToggle = useCallback((courseId: string) => {
    setActionMenuOpen(prev => prev === courseId ? null : courseId);
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, []);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR',
      minimumFractionDigits: 0,
    }).format(amount);
  }, []);

  const stats = useMemo(() => {
    const total = courses.length;
    const system = courses.filter((c) => c.isSystem).length;
    const custom = courses.filter((c) => !c.isSystem).length;
    const undergraduate = courses.filter((c) => c.level === 'undergraduate').length;

    return { total, system, custom, undergraduate };
  }, [courses]);

  const CourseCard = ({ course }: { course: Course }) => {
    const handleMorePress = () => {
      setActionMenuOpen(actionMenuOpen === course.$id ? null : course.$id);
    };

    return (
      <Animated.View 
        entering={ZoomIn.duration(300)}
        exiting={ZoomOut.duration(300)}
        className={`m-2 p-4 rounded-2xl ${currentTheme.card} border ${currentTheme.border}`}
        style={{ width: (width - 32) / 2 - 8 }}
      >
        {/* Header */}
        <View className="flex-row justify-between items-start mb-4">
          <View className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 items-center justify-center">
            <BookOpen size={24} color="white" />
          </View>
          <View className="flex-row items-center">
            <View className={`px-2 py-1 rounded-full mr-2 ${course.isSystem ? "bg-blue-100" : "bg-green-100"}`}>
              <Text className={`text-xs font-medium ${course.isSystem ? "text-blue-600" : "text-green-600"}`}>
                {course.isSystem ? "System" : "Custom"}
              </Text>
            </View>
            <TouchableOpacity onPress={handleMorePress} className="p-1">
              <MoreVertical size={20} color={currentTheme.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <Text className={`text-lg font-semibold ${currentTheme.text} mb-2`} numberOfLines={2}>
          {course.name}
        </Text>
        
        {course.description && (
          <Text className={`text-sm ${currentTheme.textMuted} mb-3`} numberOfLines={2}>
            {course.description}
          </Text>
        )}

        {/* Details */}
        <View className="space-y-2 mb-4">
          {course.university && (
            <View className="flex-row items-center">
              <Building size={16} color={currentTheme.textMuted} />
              <Text className={`text-sm ${currentTheme.textMuted} ml-2 flex-1`} numberOfLines={1}>
                {course.university.name}
              </Text>
            </View>
          )}
          
          {course.level && (
            <View className="flex-row items-center">
              <GraduationCap size={16} color={currentTheme.textMuted} />
              <Text className={`text-sm ${currentTheme.textMuted} ml-2 capitalize`}>
                {course.level}
              </Text>
            </View>
          )}
          
          {course.duration && (
            <View className="flex-row items-center">
              <Clock size={16} color={currentTheme.textMuted} />
              <Text className={`text-sm ${currentTheme.textMuted} ml-2`}>
                {course.duration}
              </Text>
            </View>
          )}
          
          {course.tuitionFee && (
            <View className="flex-row items-center">
              <DollarSign size={16} color={currentTheme.textMuted} />
              <Text className={`text-sm ${currentTheme.textMuted} ml-2`}>
                {formatCurrency(course.tuitionFee)}
              </Text>
            </View>
          )}
          
          {course.intakeMonths && course.intakeMonths.length > 0 && (
            <View className="flex-row items-center">
              <Calendar size={16} color={currentTheme.textMuted} />
              <Text className={`text-sm ${currentTheme.textMuted} ml-2`} numberOfLines={1}>
                {course.intakeMonths.slice(0, 2).join(', ')}
                {course.intakeMonths.length > 2 ? '...' : ''}
              </Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View className={`flex-row justify-between items-center pt-4 border-t ${currentTheme.border}`}>
          <Text className={`text-xs ${currentTheme.textMuted}`}>
            Created {formatDate(course.$createdAt)}
          </Text>
          {!course.isSystem && (
            <Text className="text-xs text-green-600">Editable</Text>
          )}
        </View>

        {/* Action Menu */}
        {actionMenuOpen === course.$id && (
          <Animated.View 
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            className="absolute right-2 top-12 z-10 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700"
          >
            {!course.isSystem && (
              <>
                <TouchableOpacity 
                  className="flex-row items-center px-4 py-3 border-b border-gray-100 dark:border-gray-700"
                  onPress={() => {
                    openEditModal(course);
                    setActionMenuOpen(null);
                  }}
                >
                  <Edit size={16} color={currentTheme.text} />
                  <Text className={`ml-2 ${currentTheme.text}`}>Edit</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  className="flex-row items-center px-4 py-3"
                  onPress={() => {
                    deleteCourse(course.$id);
                    setActionMenuOpen(null);
                  }}
                >
                  <Trash2 size={16} color="#ef4444" />
                  <Text className="ml-2 text-red-500">Delete</Text>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
        )}
      </Animated.View>
    );
  };

  const TableRow = ({ course }: { course: Course }) => (
    <View className={`p-4 border-b ${currentTheme.border}`}>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 items-center justify-center mr-3">
            <BookOpen size={20} color="white" />
          </View>
          <View className="flex-1">
            <Text className={`font-medium ${currentTheme.text}`} numberOfLines={1}>
              {course.name}
            </Text>
            {course.description && (
              <Text className={`text-xs ${currentTheme.textMuted}`} numberOfLines={1}>
                {course.description}
              </Text>
            )}
          </View>
        </View>
        
        <View className="flex-row items-center">
          {course.university && (
            <View className="px-2 py-1 bg-blue-100 dark:bg-blue-500/10 rounded-full mr-2">
              <Text className="text-xs text-blue-600 dark:text-blue-400">
                {course.university.name}
              </Text>
            </View>
          )}
          
          <View className={`px-2 py-1 rounded-full mr-2 ${course.isSystem ? "bg-blue-100" : "bg-green-100"}`}>
            <Text className={`text-xs ${course.isSystem ? "text-blue-600" : "text-green-600"}`}>
              {course.isSystem ? "System" : "Custom"}
            </Text>
          </View>
          
          {!course.isSystem && (
            <TouchableOpacity onPress={() => openEditModal(course)} className="p-2 mr-2">
              <Edit size={16} color={currentTheme.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  const Pagination = () => (
    <View className="flex-row justify-between items-center mt-6 px-4">
      <TouchableOpacity
        onPress={() => fetchCourses(currentPage - 1)}
        disabled={currentPage === 1}
        className={`flex-row items-center px-4 py-2 border ${currentTheme.border} rounded-xl ${
          currentPage === 1 ? "opacity-50" : ""
        }`}
      >
        <ChevronLeft size={20} color={currentTheme.text} />
        <Text className={`ml-2 ${currentTheme.text}`}>Previous</Text>
      </TouchableOpacity>

      <View className="flex-row items-center">
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(
            (page) =>
              page === 1 ||
              page === totalPages ||
              (page >= currentPage - 1 && page <= currentPage + 1)
          )
          .map((page, index, array) => (
            <View key={page} className="flex-row items-center">
              {index > 0 && array[index - 1] !== page - 1 && (
                <Text className="px-2">...</Text>
              )}
              <TouchableOpacity
                onPress={() => fetchCourses(page)}
                className={`px-3 py-1 rounded-lg mx-1 ${
                  currentPage === page
                    ? "bg-purple-600"
                    : `${currentTheme.card} border ${currentTheme.border}`
                }`}
              >
                <Text className={currentPage === page ? "text-white" : currentTheme.text}>
                  {page}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
      </View>

      <TouchableOpacity
        onPress={() => fetchCourses(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`flex-row items-center px-4 py-2 border ${currentTheme.border} rounded-xl ${
          currentPage === totalPages ? "opacity-50" : ""
        }`}
      >
        <Text className={`mr-2 ${currentTheme.text}`}>Next</Text>
        <ChevronRight size={20} color={currentTheme.text} />
      </TouchableOpacity>
    </View>
  );

  if (loading && courses.length === 0) {
    return (
      <SafeAreaView className={`flex-1 ${currentTheme.background} items-center justify-center`}>
        <View className="items-center">
          <RefreshCw size={32} color={currentTheme.primary} className="animate-spin" />
          <Text className={`mt-4 ${currentTheme.text}`}>Loading courses...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${currentTheme.background}`}>
      {/* Toast Notification */}
      {toast && (
        <Animated.View 
          entering={SlideInDown.duration(300)}
          exiting={SlideOutDown.duration(200)}
          className="absolute top-4 left-4 right-4 z-50"
        >
          <LinearGradient
            colors={
              toast.type === "success" ? ["#10b981", "#059669"] :
              toast.type === "error" ? ["#ef4444", "#dc2626"] :
              ["#3b82f6", "#2563eb"]
            }
            className="rounded-xl px-6 py-4 flex-row items-center justify-between shadow-2xl"
          >
            <Text className="text-white font-medium flex-1">{toast.message}</Text>
            <TouchableOpacity onPress={() => setToast(null)}>
              <X size={20} color="white" />
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      )}

      {/* Header */}
      <View className="p-4">
        <View className="flex-row justify-between items-center mb-4">
          <View>
            <Text className={`text-2xl font-bold ${currentTheme.text}`}>Courses</Text>
            <View className="flex-row mt-2 space-x-2">
              <View className="px-3 py-1 bg-purple-100 dark:bg-purple-500/10 rounded-full">
                <Text className="text-purple-600 dark:text-purple-400 text-xs font-medium">
                  {stats.total} total
                </Text>
              </View>
              <View className="px-3 py-1 bg-blue-100 dark:bg-blue-500/10 rounded-full">
                <Text className="text-blue-600 dark:text-blue-400 text-xs font-medium">
                  {stats.system} system
                </Text>
              </View>
              <View className="px-3 py-1 bg-green-100 dark:bg-green-500/10 rounded-full">
                <Text className="text-green-600 dark:text-green-400 text-xs font-medium">
                  {stats.custom} custom
                </Text>
              </View>
            </View>
          </View>
          <TouchableOpacity 
            onPress={openCreateModal}
            className="bg-gradient-to-r from-purple-600 to-purple-500 px-4 py-3 rounded-xl flex-row items-center"
          >
            <Plus size={20} color="white" />
            <Text className="text-white font-medium ml-2">Add</Text>
          </TouchableOpacity>
        </View>

        {/* Search and Filters */}
        <View className="space-y-3">
          <View className="relative">
            <Search size={20} color={currentTheme.textMuted} className="absolute left-3 top-3 z-10" />
            <TextInput
              placeholder="Search courses..."
              placeholderTextColor={currentTheme.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              className={`pl-10 pr-4 py-3 ${currentTheme.card} rounded-xl border ${currentTheme.border} ${currentTheme.text}`}
            />
            {searchQuery ? (
              <TouchableOpacity 
                onPress={() => setSearchQuery("")}
                className="absolute right-3 top-3"
              >
                <X size={20} color={currentTheme.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>

          <View className="flex-row space-x-2">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1">
              <View className="flex-row space-x-2">
                <TouchableOpacity
                  onPress={() => setFilterType("all")}
                  className={`px-4 py-2 rounded-full ${filterType === "all" ? "bg-purple-100 dark:bg-purple-600" : currentTheme.card}`}
                >
                  <Text className={filterType === "all" ? "text-purple-700 dark:text-white" : currentTheme.text}>
                    All
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setFilterType("system")}
                  className={`px-4 py-2 rounded-full ${filterType === "system" ? "bg-blue-100 dark:bg-blue-600" : currentTheme.card}`}
                >
                  <Text className={filterType === "system" ? "text-blue-700 dark:text-white" : currentTheme.text}>
                    System
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setFilterType("custom")}
                  className={`px-4 py-2 rounded-full ${filterType === "custom" ? "bg-green-100 dark:bg-green-600" : currentTheme.card}`}
                >
                  <Text className={filterType === "custom" ? "text-green-700 dark:text-white" : currentTheme.text}>
                    Custom
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <TouchableOpacity
              onPress={() => setViewMode(viewMode === "grid" ? "table" : "grid")}
              className="p-2 rounded-xl bg-white dark:bg-gray-800"
            >
              {viewMode === "grid" ? (
                <List size={20} color={currentTheme.text} />
              ) : (
                <Grid size={20} color={currentTheme.text} />
              )}
            </TouchableOpacity>
          </View>

          {/* University Filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-2">
            <TouchableOpacity
              onPress={() => setSelectedUniversity("all")}
              className={`px-4 py-2 mr-2 rounded-full ${selectedUniversity === "all" ? "bg-purple-100 dark:bg-purple-600" : currentTheme.card}`}
            >
              <Text className={selectedUniversity === "all" ? "text-purple-700 dark:text-white" : currentTheme.text}>
                All Universities
              </Text>
            </TouchableOpacity>
            {universities.map((university) => (
              <TouchableOpacity
                key={university.$id}
                onPress={() => setSelectedUniversity(university.$id)}
                className={`px-4 py-2 mr-2 rounded-full ${selectedUniversity === university.$id ? "bg-blue-100 dark:bg-blue-600" : currentTheme.card}`}
              >
                <Text className={selectedUniversity === university.$id ? "text-blue-700 dark:text-white" : currentTheme.text}>
                  {university.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Level Filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-2">
            <TouchableOpacity
              onPress={() => setSelectedLevel("all")}
              className={`px-4 py-2 mr-2 rounded-full ${selectedLevel === "all" ? "bg-purple-100 dark:bg-purple-600" : currentTheme.card}`}
            >
              <Text className={selectedLevel === "all" ? "text-purple-700 dark:text-white" : currentTheme.text}>
                All Levels
              </Text>
            </TouchableOpacity>
            {LEVEL_OPTIONS.map((level) => (
              <TouchableOpacity
                key={level.value}
                onPress={() => setSelectedLevel(level.value)}
                className={`px-4 py-2 mr-2 rounded-full ${selectedLevel === level.value ? "bg-green-100 dark:bg-green-600" : currentTheme.card}`}
              >
                <Text className={selectedLevel === level.value ? "text-green-700 dark:text-white" : currentTheme.text}>
                  {level.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Content */}
      <FlatList
        ref={flatListRef}
        data={courses}
        key={viewMode}
        keyExtractor={(item) => item.$id}
        numColumns={viewMode === "grid" ? 2 : 1}
        renderItem={({ item }) => 
          viewMode === "grid" ? <CourseCard course={item} /> : <TableRow course={item} />
        }
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
            <Search size={48} color={currentTheme.textMuted} />
            <Text className={`text-lg font-medium mt-4 ${currentTheme.text}`}>
              No courses found
            </Text>
            <Text className={`${currentTheme.textMuted} mt-2 text-center`}>
              {searchQuery || selectedUniversity !== "all" || selectedLevel !== "all" || filterType !== "all"
                ? "No courses match your filters"
                : "No courses available"}
            </Text>
          </View>
        }
      />

      {/* Pagination */}
      {courses.length > 0 && <Pagination />}

      {/* Create/Edit Modal */}
      <Modal
        visible={showCreateModal || showEditModal}
        animationType="slide"
        transparent={true}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <Animated.View 
            entering={SlideInDown.duration(300)}
            exiting={SlideOutDown.duration(200)}
            className={`${currentTheme.card} rounded-t-3xl p-6 max-h-[90%]`}
          >
            <View className="flex-row justify-between items-center mb-6">
              <Text className={`text-xl font-bold ${currentTheme.text}`}>
                {showCreateModal ? "Add New Course" : "Edit Course"}
              </Text>
              <TouchableOpacity onPress={closeModals}>
                <X size={24} color={currentTheme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="space-y-4">
                <View>
                  <Text className={`font-medium mb-2 ${currentTheme.text}`}>Course Name *</Text>
                  <TextInput
                    placeholder="Enter course name"
                    placeholderTextColor={currentTheme.textMuted}
                    value={formData.name}
                    onChangeText={(text) => setFormData({...formData, name: text})}
                    className={`px-4 py-3 rounded-xl border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                  />
                </View>

                <View>
                  <Text className={`font-medium mb-2 ${currentTheme.text}`}>University *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pb-2">
                    <View className="flex-row space-x-2">
                      {universities.map((university) => (
                        <TouchableOpacity
                          key={university.$id}
                          onPress={() => setFormData({...formData, universities: university.$id})}
                          className={`px-4 py-2 rounded-full ${formData.universities === university.$id ? "bg-purple-100 dark:bg-purple-600" : currentTheme.card}`}
                        >
                          <Text className={formData.universities === university.$id ? "text-purple-700 dark:text-white" : currentTheme.text}>
                            {university.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                <View>
                  <Text className={`font-medium mb-2 ${currentTheme.text}`}>Level</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pb-2">
                    <View className="flex-row space-x-2">
                      {LEVEL_OPTIONS.map((level) => (
                        <TouchableOpacity
                          key={level.value}
                          onPress={() => setFormData({...formData, level: level.value})}
                          className={`px-4 py-2 rounded-full ${formData.level === level.value ? "bg-green-100 dark:bg-green-600" : currentTheme.card}`}
                        >
                          <Text className={formData.level === level.value ? "text-green-700 dark:text-white" : currentTheme.text}>
                            {level.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                <View className="flex-row space-x-4">
                  <View className="flex-1">
                    <Text className={`font-medium mb-2 ${currentTheme.text}`}>Duration</Text>
                    <TextInput
                      placeholder="e.g., 4 years"
                      placeholderTextColor={currentTheme.textMuted}
                      value={formData.duration}
                      onChangeText={(text) => setFormData({...formData, duration: text})}
                      className={`px-4 py-3 rounded-xl border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className={`font-medium mb-2 ${currentTheme.text}`}>Tuition Fee (NPR)</Text>
                    <TextInput
                      placeholder="e.g., 500000"
                      placeholderTextColor={currentTheme.textMuted}
                      value={formData.tuitionFee}
                      onChangeText={(text) => setFormData({...formData, tuitionFee: text})}
                      keyboardType="numeric"
                      className={`px-4 py-3 rounded-xl border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                    />
                  </View>
                </View>

                <View>
                  <Text className={`font-medium mb-2 ${currentTheme.text}`}>Intake Months</Text>
                  <View className="flex-row flex-wrap">
                    {MONTH_OPTIONS.map((month) => (
                      <TouchableOpacity
                        key={month}
                        onPress={() => {
                          const newIntakeMonths = formData.intakeMonths.includes(month)
                            ? formData.intakeMonths.filter(m => m !== month)
                            : [...formData.intakeMonths, month];
                          setFormData({...formData, intakeMonths: newIntakeMonths});
                        }}
                        className={`px-3 py-2 rounded-lg mr-2 mb-2 ${
                          formData.intakeMonths.includes(month)
                            ? "bg-purple-100 dark:bg-purple-600"
                            : currentTheme.card
                        } border ${currentTheme.border}`}
                      >
                        <Text className={
                          formData.intakeMonths.includes(month)
                            ? "text-purple-700 dark:text-white"
                            : currentTheme.text
                        }>
                          {month}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View>
                  <Text className={`font-medium mb-2 ${currentTheme.text}`}>Description</Text>
                  <TextInput
                    placeholder="Enter course description (optional)"
                    placeholderTextColor={currentTheme.textMuted}
                    value={formData.description}
                    onChangeText={(text) => setFormData({...formData, description: text})}
                    multiline
                    numberOfLines={4}
                    className={`px-4 py-3 rounded-xl border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                  />
                </View>
              </View>
            </ScrollView>

            <View className="flex-row space-x-3 mt-6">
              <TouchableOpacity
                onPress={closeModals}
                className={`flex-1 py-3 rounded-xl border ${currentTheme.border} items-center`}
              >
                <Text className={currentTheme.textMuted}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={showCreateModal ? createCourse : updateCourse}
                className="flex-1 bg-gradient-to-r from-purple-600 to-purple-500 py-3 rounded-xl items-center"
              >
                <Text className="text-white font-medium">
                  {showCreateModal ? "Create" : "Update"} Course
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}