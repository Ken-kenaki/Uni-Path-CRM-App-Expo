// app/(tabs)/universities.tsx
import { API_URL } from "@/config";
import { Theme, themeConfigs } from "@/theme";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
    Award,
    BookOpen,
    Building,
    Edit,
    ExternalLink,
    Globe,
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

interface University {
  $id: string;
  name: string;
  website?: string;
  ranking?: number;
  countries: string;
  isSystem: boolean;
  createdBy: string;
  description?: string;
  $createdAt: string;
  $updatedAt: string;
  country?: {
    name: string;
    isoCode: string;
    id: string;
  };
}

interface Country {
  $id: string;
  name: string;
  isoCode: string;
}

interface ApiResponse {
  success: boolean;
  data: University[];
  metadata?: {
    page: number;
    total: number;
    limit: number;
    hasMore: boolean;
    loadTime: number;
    totalTime: number;
    cache: string;
  };
}

type ViewMode = "grid" | "table";

export default function UniversitiesPage() {
  const [universities, setUniversities] = useState<University[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);
  const [universityToDelete, setUniversityToDelete] = useState<University | null>(null);
  const [theme, setTheme] = useState<Theme>("dark");
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" | "warning" } | null>(null);
  const [metadata, setMetadata] = useState({ page: 1, total: 0, hasMore: false, loadTime: 0, cache: "miss" });
  
  // Filter states
  const [filterType, setFilterType] = useState<"all" | "system" | "custom">("all");
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const currentTheme = themeConfigs[theme];

  const showToast = useCallback((message: string, type: "success" | "error" | "info" | "warning") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
    Haptics.notificationAsync(
      type === "success" 
        ? Haptics.NotificationFeedbackType.Success
        : type === "error"
        ? Haptics.NotificationFeedbackType.Error
        : Haptics.NotificationFeedbackType.Warning
    );
  }, []);

  const fetchCountries = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/dashboard/countries`);
      const result = await response.json();
      if (result.success) {
        setCountries(result.data);
      }
    } catch (error) {
      console.error("Error fetching countries:", error);
      showToast("Error fetching countries", "error");
    }
  }, [showToast]);

  const fetchUniversities = useCallback(async (page: number = 1, isRefresh = false) => {
    try {
      if (page === 1 && !isRefresh) setLoading(true);
      if (page > 1) setLoadingMore(true);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(searchQuery && { search: searchQuery }),
        ...(selectedCountry !== "all" && { countryId: selectedCountry }),
        ...(filterType !== "all" && { type: filterType }),
      });

      const response = await fetch(`${API_URL}/dashboard/universities?${params}`);
      const result: ApiResponse = await response.json();

      if (result.success) {
        if (page === 1) {
          setUniversities(result.data);
        } else {
          setUniversities(prev => [...prev, ...result.data]);
        }

        if (result.metadata) {
          setMetadata({
            page: result.metadata.page,
            total: result.metadata.total,
            hasMore: result.metadata.hasMore,
            loadTime: result.metadata.totalTime,
            cache: result.metadata.cache
          });
        }
      }
    } catch (error) {
      showToast("Error fetching universities", "error");
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [searchQuery, selectedCountry, filterType, showToast]);

  useEffect(() => {
    fetchUniversities(1);
    fetchCountries();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUniversities(1, true);
  }, [fetchUniversities]);

  const loadMore = useCallback(() => {
    if (metadata.hasMore && !loadingMore) {
      fetchUniversities(metadata.page + 1);
    }
  }, [metadata.hasMore, loadingMore, fetchUniversities]);

  const [formData, setFormData] = useState({
    name: "",
    website: "",
    ranking: "",
    countries: "",
    description: "",
  });

  const createUniversity = async () => {
    try {
      const response = await fetch(`${API_URL}/dashboard/universities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          ranking: formData.ranking ? parseInt(formData.ranking) : undefined,
        }),
      });
      const result = await response.json();

      if (result.success) {
        showToast("University created successfully", "success");
        setShowCreateModal(false);
        setFormData({ name: "", website: "", ranking: "", countries: "", description: "" });
        onRefresh();
      } else {
        showToast(result.error || "Failed to create university", "error");
      }
    } catch (error) {
      showToast("Error creating university", "error");
    }
  };

  const updateUniversity = async () => {
    if (!selectedUniversity) return;
    try {
      const response = await fetch(`${API_URL}/dashboard/universities/${selectedUniversity.$id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          ranking: formData.ranking ? parseInt(formData.ranking) : undefined,
        }),
      });
      const result = await response.json();

      if (result.success) {
        showToast("University updated successfully", "success");
        setShowEditModal(false);
        setSelectedUniversity(null);
        setFormData({ name: "", website: "", ranking: "", countries: "", description: "" });
        onRefresh();
      } else {
        showToast(result.error || "Failed to update university", "error");
      }
    } catch (error) {
      showToast("Error updating university", "error");
    }
  };

  const deleteUniversity = async () => {
    if (!universityToDelete) return;
    try {
      const response = await fetch(`${API_URL}/dashboard/universities/${universityToDelete.$id}`, { 
        method: "DELETE" 
      });
      const result = await response.json();
      if (result.success) {
        showToast("University deleted successfully", "success");
        onRefresh();
        setActionMenuOpen(null);
      } else {
        showToast(result.error || "Failed to delete university", "error");
      }
    } catch (error) {
      showToast("Error deleting university", "error");
    } finally {
      setShowDeleteModal(false);
      setUniversityToDelete(null);
    }
  };

  const handleDeleteClick = useCallback((universityId: string) => {
    const university = universities.find(u => u.$id === universityId);
    if (university) {
      if (university.isSystem) {
        showToast("Cannot delete system universities", "warning");
        return;
      }
      setUniversityToDelete(university);
      setShowDeleteModal(true);
      setActionMenuOpen(null);
    }
  }, [universities, showToast]);

  const openCreateModal = useCallback(() => {
    setFormData({ name: "", website: "", ranking: "", countries: "", description: "" });
    setSelectedUniversity(null);
    setShowCreateModal(true);
    setActionMenuOpen(null);
  }, []);

  const openEditModal = useCallback((university: University) => {
    if (university.isSystem) {
      showToast("Cannot edit system universities", "warning");
      return;
    }
    setSelectedUniversity(university);
    setFormData({
      name: university.name,
      website: university.website || "",
      ranking: university.ranking?.toString() || "",
      countries: university.countries || "",
      description: university.description || "",
    });
    setShowEditModal(true);
    setActionMenuOpen(null);
  }, [showToast]);

  const closeModals = useCallback(() => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setSelectedUniversity(null);
    setUniversityToDelete(null);
    setFormData({ name: "", website: "", ranking: "", countries: "", description: "" });
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, []);

  const stats = useMemo(() => {
    const total = metadata.total;
    const system = universities.filter((u) => u.isSystem).length;
    const custom = universities.filter((u) => !u.isSystem).length;
    return { total, system, custom };
  }, [universities, metadata.total]);

  const UniversityCard = ({ university }: { university: University }) => {
    const handleMorePress = () => {
      setActionMenuOpen(actionMenuOpen === university.$id ? null : university.$id);
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
          <View className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 items-center justify-center">
            <Building size={24} color="white" />
          </View>
          <View className="flex-row items-center">
            <View className={`px-2 py-1 rounded-full mr-2 ${university.isSystem ? "bg-blue-100" : "bg-green-100"}`}>
              <Text className={`text-xs font-medium ${university.isSystem ? "text-blue-600" : "text-green-600"}`}>
                {university.isSystem ? "System" : "Custom"}
              </Text>
            </View>
            <TouchableOpacity onPress={handleMorePress} className="p-1">
              <MoreVertical size={20} color={currentTheme.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <Text className={`text-lg font-semibold ${currentTheme.text} mb-2`} numberOfLines={2}>
          {university.name}
        </Text>
        
        {university.description && (
          <Text className={`text-sm ${currentTheme.textMuted} mb-3`} numberOfLines={2}>
            {university.description}
          </Text>
        )}

        {/* Details */}
        <View className="space-y-2 mb-4">
          {university.country && (
            <View className="flex-row items-center">
              <Globe size={16} color={currentTheme.textMuted} />
              <Text className={`text-sm ${currentTheme.textMuted} ml-2 flex-1`} numberOfLines={1}>
                {university.country.name}
              </Text>
            </View>
          )}
          
          {university.ranking && (
            <View className="flex-row items-center">
              <Award size={16} color={currentTheme.textMuted} />
              <Text className={`text-sm ${currentTheme.textMuted} ml-2`}>
                Rank #{university.ranking}
              </Text>
            </View>
          )}
          
          {university.website && (
            <TouchableOpacity className="flex-row items-center">
              <ExternalLink size={16} color="#3b82f6" />
              <Text className="text-sm text-blue-500 ml-2" numberOfLines={1}>
                Website
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Footer */}
        <View className={`flex-row justify-between items-center pt-4 border-t ${currentTheme.border}`}>
          <Text className={`text-xs ${currentTheme.textMuted}`}>
            Created {formatDate(university.$createdAt)}
          </Text>
          {!university.isSystem && (
            <Text className="text-xs text-green-600">Editable</Text>
          )}
        </View>

        {/* Action Menu */}
        {actionMenuOpen === university.$id && (
          <Animated.View 
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            className="absolute right-2 top-12 z-10 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700"
          >
            <TouchableOpacity 
              className="flex-row items-center px-4 py-3 border-b border-gray-100 dark:border-gray-700"
              onPress={() => {
                router.push(`/universities/${university.$id}/courses`);
                setActionMenuOpen(null);
              }}
            >
              <BookOpen size={16} color={currentTheme.text} />
              <Text className={`ml-2 ${currentTheme.text}`}>View Courses</Text>
            </TouchableOpacity>
            
            {!university.isSystem && (
              <>
                <TouchableOpacity 
                  className="flex-row items-center px-4 py-3 border-b border-gray-100 dark:border-gray-700"
                  onPress={() => {
                    openEditModal(university);
                    setActionMenuOpen(null);
                  }}
                >
                  <Edit size={16} color={currentTheme.text} />
                  <Text className={`ml-2 ${currentTheme.text}`}>Edit</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  className="flex-row items-center px-4 py-3"
                  onPress={() => {
                    handleDeleteClick(university.$id);
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

  const TableRow = ({ university }: { university: University }) => (
    <View className={`p-4 border-b ${currentTheme.border}`}>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 items-center justify-center mr-3">
            <Building size={20} color="white" />
          </View>
          <View className="flex-1">
            <Text className={`font-medium ${currentTheme.text}`} numberOfLines={1}>
              {university.name}
            </Text>
            {university.description && (
              <Text className={`text-xs ${currentTheme.textMuted}`} numberOfLines={1}>
                {university.description}
              </Text>
            )}
          </View>
        </View>
        
        <View className="flex-row items-center">
          {university.country && (
            <View className="px-2 py-1 bg-blue-100 dark:bg-blue-500/10 rounded-full mr-2">
              <Text className="text-xs text-blue-600 dark:text-blue-400">
                {university.country.name}
              </Text>
            </View>
          )}
          
          <View className={`px-2 py-1 rounded-full mr-2 ${university.isSystem ? "bg-blue-100" : "bg-green-100"}`}>
            <Text className={`text-xs ${university.isSystem ? "text-blue-600" : "text-green-600"}`}>
              {university.isSystem ? "System" : "Custom"}
            </Text>
          </View>
          
          <TouchableOpacity onPress={() => openEditModal(university)} className="p-2">
            <Edit size={16} color={currentTheme.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading && universities.length === 0) {
    return (
      <SafeAreaView className={`flex-1 ${currentTheme.background} items-center justify-center`}>
        <View className="items-center">
          <RefreshCw size={32} color={currentTheme.primary} className="animate-spin" />
          <Text className={`mt-4 ${currentTheme.text}`}>Loading universities...</Text>
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
              toast.type === "info" ? ["#3b82f6", "#2563eb"] :
              ["#f59e0b", "#d97706"]
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
            <Text className={`text-2xl font-bold ${currentTheme.text}`}>Universities</Text>
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
              placeholder="Search universities..."
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

          {/* Country Filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-2">
            <TouchableOpacity
              onPress={() => setSelectedCountry("all")}
              className={`px-4 py-2 mr-2 rounded-full ${selectedCountry === "all" ? "bg-purple-100 dark:bg-purple-600" : currentTheme.card}`}
            >
              <Text className={selectedCountry === "all" ? "text-purple-700 dark:text-white" : currentTheme.text}>
                All Countries
              </Text>
            </TouchableOpacity>
            {countries.map((country) => (
              <TouchableOpacity
                key={country.$id}
                onPress={() => setSelectedCountry(country.$id)}
                className={`px-4 py-2 mr-2 rounded-full ${selectedCountry === country.$id ? "bg-blue-100 dark:bg-blue-600" : currentTheme.card}`}
              >
                <Text className={selectedCountry === country.$id ? "text-blue-700 dark:text-white" : currentTheme.text}>
                  {country.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Content */}
      <FlatList
        ref={flatListRef}
        data={universities}
        key={viewMode}
        keyExtractor={(item) => item.$id}
        numColumns={viewMode === "grid" ? 2 : 1}
        renderItem={({ item }) => 
          viewMode === "grid" ? <UniversityCard university={item} /> : <TableRow university={item} />
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#8b5cf6"]}
            tintColor="#8b5cf6"
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20">
            <Search size={48} color={currentTheme.textMuted} />
            <Text className={`text-lg font-medium mt-4 ${currentTheme.text}`}>
              No universities found
            </Text>
            <Text className={`${currentTheme.textMuted} mt-2 text-center`}>
              {searchQuery || selectedCountry !== "all" || filterType !== "all"
                ? "No universities match your filters"
                : "No universities available"}
            </Text>
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <View className="py-4 items-center">
              <RefreshCw size={24} color={currentTheme.primary} className="animate-spin" />
            </View>
          ) : metadata.hasMore ? (
            <View className="py-4 items-center">
              <Text className={currentTheme.textMuted}>Scroll down to load more</Text>
            </View>
          ) : null
        }
      />

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
                {showCreateModal ? "Add New University" : "Edit University"}
              </Text>
              <TouchableOpacity onPress={closeModals}>
                <X size={24} color={currentTheme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="space-y-4">
                <View>
                  <Text className={`font-medium mb-2 ${currentTheme.text}`}>University Name *</Text>
                  <TextInput
                    placeholder="Enter university name"
                    placeholderTextColor={currentTheme.textMuted}
                    value={formData.name}
                    onChangeText={(text) => setFormData({...formData, name: text})}
                    className={`px-4 py-3 rounded-xl border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                  />
                </View>

                <View>
                  <Text className={`font-medium mb-2 ${currentTheme.text}`}>Country *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pb-2">
                    <View className="flex-row space-x-2">
                      {countries.map((country) => (
                        <TouchableOpacity
                          key={country.$id}
                          onPress={() => setFormData({...formData, countries: country.$id})}
                          className={`px-4 py-2 rounded-full ${formData.countries === country.$id ? "bg-purple-100 dark:bg-purple-600" : currentTheme.card}`}
                        >
                          <Text className={formData.countries === country.$id ? "text-purple-700 dark:text-white" : currentTheme.text}>
                            {country.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                <View className="flex-row space-x-4">
                  <View className="flex-1">
                    <Text className={`font-medium mb-2 ${currentTheme.text}`}>Ranking</Text>
                    <TextInput
                      placeholder="e.g., 1"
                      placeholderTextColor={currentTheme.textMuted}
                      value={formData.ranking}
                      onChangeText={(text) => setFormData({...formData, ranking: text})}
                      keyboardType="numeric"
                      className={`px-4 py-3 rounded-xl border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className={`font-medium mb-2 ${currentTheme.text}`}>Website</Text>
                    <TextInput
                      placeholder="https://example.com"
                      placeholderTextColor={currentTheme.textMuted}
                      value={formData.website}
                      onChangeText={(text) => setFormData({...formData, website: text})}
                      autoCapitalize="none"
                      className={`px-4 py-3 rounded-xl border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                    />
                  </View>
                </View>

                <View>
                  <Text className={`font-medium mb-2 ${currentTheme.text}`}>Description</Text>
                  <TextInput
                    placeholder="Enter university description (optional)"
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
                onPress={showCreateModal ? createUniversity : updateUniversity}
                className="flex-1 bg-gradient-to-r from-purple-600 to-purple-500 py-3 rounded-xl items-center"
              >
                <Text className="text-white font-medium">
                  {showCreateModal ? "Create" : "Update"} University
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
      >
        <View className="flex-1 bg-black/50 items-center justify-center p-6">
          <Animated.View 
            entering={ZoomIn.duration(300)}
            exiting={ZoomOut.duration(200)}
            className={`${currentTheme.card} rounded-2xl p-6 w-full max-w-md`}
          >
            <View className="items-center mb-6">
              <View className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-500/20 items-center justify-center mb-4">
                <Trash2 size={32} color="#ef4444" />
              </View>
              <Text className={`text-lg font-bold ${currentTheme.text} mb-2`}>
                Delete University
              </Text>
              <Text className={`${currentTheme.textMuted} text-center`}>
                Are you sure you want to delete{" "}
                <Text className="font-semibold">{universityToDelete?.name}</Text>?
                This action cannot be undone.
              </Text>
            </View>

            <View className="flex-row space-x-3">
              <TouchableOpacity
                onPress={() => setShowDeleteModal(false)}
                className={`flex-1 py-3 rounded-xl border ${currentTheme.border} items-center`}
              >
                <Text className={currentTheme.textMuted}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={deleteUniversity}
                className="flex-1 bg-gradient-to-r from-red-600 to-red-500 py-3 rounded-xl items-center"
              >
                <Text className="text-white font-medium">Delete University</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}