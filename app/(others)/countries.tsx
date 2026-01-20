// app/(tabs)/countries.tsx
import { API_URL } from "@/config";
import { Theme, themeConfigs } from "@/theme";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
    AlertTriangle,
    Edit,
    Grid,
    Hash,
    List,
    MoreVertical,
    Plus,
    RefreshCw,
    School,
    Search,
    Trash2,
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
    Dimensions,
    FlatList,
    Modal,
    RefreshControl,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
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

interface Country {
  $id: string;
  name: string;
  isoCode: string;
  isSystem: boolean;
  description?: string;
  createdBy?: string;
  $createdAt: string;
  $updatedAt: string;
}

interface ApiResponse {
  success: boolean;
  data: Country[];
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

export default function CountriesPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "system" | "custom">(
    "all",
  );
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [countryToDelete, setCountryToDelete] = useState<Country | null>(null);
  const [theme, setTheme] = useState<Theme>("dark");
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info" | "warning";
  } | null>(null);
  const [metadata, setMetadata] = useState({
    page: 1,
    total: 0,
    hasMore: false,
    loadTime: 0,
    cache: "miss",
  });

  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const currentTheme = themeConfigs[theme];

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info" | "warning") => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 4000);
      Haptics.notificationAsync(
        type === "success"
          ? Haptics.NotificationFeedbackType.Success
          : type === "error"
            ? Haptics.NotificationFeedbackType.Error
            : Haptics.NotificationFeedbackType.Warning,
      );
    },
    [],
  );

  const fetchCountries = useCallback(
    async (page: number = 1, isRefresh = false) => {
      try {
        if (page === 1 && !isRefresh) setLoading(true);
        if (page > 1) setLoadingMore(true);

        const params = new URLSearchParams({
          page: page.toString(),
          limit: "20",
          type: filterType,
          ...(searchQuery && { search: searchQuery }),
        });

        const response = await fetch(
          `${API_URL}/dashboard/countries?${params}`,
        );
        const result: ApiResponse = await response.json();

        if (result.success) {
          if (page === 1) {
            setCountries(result.data);
          } else {
            setCountries((prev) => [...prev, ...result.data]);
          }

          if (result.metadata) {
            setMetadata({
              page: result.metadata.page,
              total: result.metadata.total,
              hasMore: result.metadata.hasMore,
              loadTime: result.metadata.totalTime,
              cache: result.metadata.cache,
            });
          }
        }
      } catch (error) {
        showToast("Error fetching countries", "error");
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [searchQuery, filterType, showToast],
  );

  useEffect(() => {
    fetchCountries(1);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCountries(1, true);
  }, [fetchCountries]);

  const loadMore = useCallback(() => {
    if (metadata.hasMore && !loadingMore) {
      fetchCountries(metadata.page + 1);
    }
  }, [metadata.hasMore, loadingMore, fetchCountries]);

  const [formData, setFormData] = useState({
    name: "",
    isoCode: "",
    description: "",
  });

  const getFlagEmoji = (isoCode: string) => {
    if (!isoCode) return "🏳️";
    const code = isoCode.toUpperCase();
    if (code.length === 2) {
      const offset = 127397;
      return code
        .split("")
        .map((char) => String.fromCodePoint(char.charCodeAt(0) + offset))
        .join("");
    }
    return "🌍";
  };

  const createCountry = async () => {
    try {
      const response = await fetch(`${API_URL}/dashboard/countries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await response.json();

      if (result.success) {
        showToast("Country created successfully", "success");
        setShowCreateModal(false);
        setFormData({ name: "", isoCode: "", description: "" });
        onRefresh();
      } else {
        showToast(result.error || "Failed to create country", "error");
      }
    } catch (error) {
      showToast("Error creating country", "error");
    }
  };

  const updateCountry = async () => {
    if (!selectedCountry) return;
    try {
      const response = await fetch(
        `${API_URL}/dashboard/countries/${selectedCountry.$id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        },
      );
      const result = await response.json();

      if (result.success) {
        showToast("Country updated successfully", "success");
        setShowEditModal(false);
        setSelectedCountry(null);
        setFormData({ name: "", isoCode: "", description: "" });
        onRefresh();
      } else {
        showToast(result.error || "Failed to update country", "error");
      }
    } catch (error) {
      showToast("Error updating country", "error");
    }
  };

  const deleteCountry = async () => {
    if (!countryToDelete) return;
    try {
      const response = await fetch(
        `${API_URL}/dashboard/countries/${countryToDelete.$id}`,
        {
          method: "DELETE",
        },
      );
      const result = await response.json();
      if (result.success) {
        showToast("Country deleted successfully", "success");
        onRefresh();
        setActionMenuOpen(null);
      } else {
        showToast(result.error || "Failed to delete country", "error");
      }
    } catch (error) {
      showToast("Error deleting country", "error");
    } finally {
      setShowDeleteModal(false);
      setCountryToDelete(null);
    }
  };

  const handleDeleteClick = useCallback(
    (country: Country) => {
      if (country.isSystem) {
        showToast("Cannot delete system countries", "warning");
        return;
      }
      setCountryToDelete(country);
      setShowDeleteModal(true);
      setActionMenuOpen(null);
    },
    [showToast],
  );

  const openCreateModal = useCallback(() => {
    setFormData({ name: "", isoCode: "", description: "" });
    setSelectedCountry(null);
    setShowCreateModal(true);
    setActionMenuOpen(null);
  }, []);

  const openEditModal = useCallback(
    (country: Country) => {
      if (country.isSystem) {
        showToast("Cannot edit system countries", "warning");
        return;
      }
      setSelectedCountry(country);
      setFormData({
        name: country.name,
        isoCode: country.isoCode,
        description: country.description || "",
      });
      setShowEditModal(true);
      setActionMenuOpen(null);
    },
    [showToast],
  );

  const closeModals = useCallback(() => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setSelectedCountry(null);
    setCountryToDelete(null);
    setFormData({ name: "", isoCode: "", description: "" });
  }, []);

  const handleActionMenuToggle = useCallback((countryId: string) => {
    setActionMenuOpen((prev) => (prev === countryId ? null : countryId));
  }, []);

  const handleViewStudents = useCallback(
    (countryId: string) => {
      router.push(`/countries/${countryId}/students`);
      setActionMenuOpen(null);
    },
    [router],
  );

  const handleViewUniversities = useCallback(
    (countryId: string) => {
      router.push(`/countries/${countryId}/universities`);
      setActionMenuOpen(null);
    },
    [router],
  );

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, []);

  const stats = useMemo(() => {
    const total = metadata.total;
    const system = countries.filter((c) => c.isSystem).length;
    const custom = countries.filter((c) => !c.isSystem).length;
    return { total, system, custom };
  }, [countries, metadata.total]);

  const CountryCard = ({ country }: { country: Country }) => {
    const handleMorePress = () => {
      setActionMenuOpen(actionMenuOpen === country.$id ? null : country.$id);
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
            <Text className="text-2xl">{getFlagEmoji(country.isoCode)}</Text>
          </View>
          <View className="flex-row items-center">
            {country.isSystem && (
              <View className="px-2 py-1 bg-blue-100 rounded-full mr-2">
                <Text className="text-xs text-blue-600 font-medium">
                  System
                </Text>
              </View>
            )}
            <TouchableOpacity onPress={handleMorePress} className="p-1">
              <MoreVertical size={20} color={currentTheme.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <Text
          className={`text-lg font-semibold ${currentTheme.text} mb-2`}
          numberOfLines={2}
        >
          {country.name}
        </Text>

        <View className="flex-row items-center mb-3">
          <Hash size={16} color={currentTheme.textMuted} />
          <Text className={`text-sm ${currentTheme.textMuted} ml-2`}>
            {country.isoCode}
          </Text>
          <View
            className={`px-2 py-1 rounded-full ml-2 ${country.isSystem ? "bg-blue-100" : "bg-green-100"}`}
          >
            <Text
              className={`text-xs ${country.isSystem ? "text-blue-600" : "text-green-600"}`}
            >
              {country.isSystem ? "System" : "Custom"}
            </Text>
          </View>
        </View>

        {country.description && (
          <Text
            className={`text-sm ${currentTheme.textMuted} mb-4`}
            numberOfLines={2}
          >
            {country.description}
          </Text>
        )}

        {/* Footer */}
        <View
          className={`flex-row justify-between items-center pt-4 border-t ${currentTheme.border}`}
        >
          <Text className={`text-xs ${currentTheme.textMuted}`}>
            Created {formatDate(country.$createdAt)}
          </Text>
          {!country.isSystem && (
            <Text className="text-xs text-green-600">Editable</Text>
          )}
        </View>

        {/* Action Menu */}
        {actionMenuOpen === country.$id && (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            className="absolute right-2 top-12 z-10 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700"
          >
            <TouchableOpacity
              className="flex-row items-center px-4 py-3 border-b border-gray-100 dark:border-gray-700"
              onPress={() => {
                handleViewStudents(country.$id);
              }}
            >
              <Users size={16} color={currentTheme.text} />
              <Text className={`ml-2 ${currentTheme.text}`}>View Students</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center px-4 py-3 border-b border-gray-100 dark:border-gray-700"
              onPress={() => {
                handleViewUniversities(country.$id);
              }}
            >
              <School size={16} color={currentTheme.text} />
              <Text className={`ml-2 ${currentTheme.text}`}>
                View Universities
              </Text>
            </TouchableOpacity>

            {!country.isSystem && (
              <>
                <TouchableOpacity
                  className="flex-row items-center px-4 py-3 border-b border-gray-100 dark:border-gray-700"
                  onPress={() => {
                    openEditModal(country);
                  }}
                >
                  <Edit size={16} color={currentTheme.text} />
                  <Text className={`ml-2 ${currentTheme.text}`}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="flex-row items-center px-4 py-3"
                  onPress={() => {
                    handleDeleteClick(country);
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

  const TableRow = ({ country }: { country: Country }) => (
    <View className={`p-4 border-b ${currentTheme.border}`}>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 items-center justify-center mr-3">
            <Text className="text-xl">{getFlagEmoji(country.isoCode)}</Text>
          </View>
          <View className="flex-1">
            <Text
              className={`font-medium ${currentTheme.text}`}
              numberOfLines={1}
            >
              {country.name}
            </Text>
            <Text className={`text-xs ${currentTheme.textMuted}`}>
              {country.isoCode}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center">
          <View
            className={`px-2 py-1 rounded-full mr-2 ${country.isSystem ? "bg-blue-100" : "bg-green-100"}`}
          >
            <Text
              className={`text-xs ${country.isSystem ? "text-blue-600" : "text-green-600"}`}
            >
              {country.isSystem ? "System" : "Custom"}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => openEditModal(country)}
            className="p-2 mr-2"
          >
            <Edit size={16} color={currentTheme.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleViewUniversities(country.$id)}
            className="p-2"
          >
            <School size={16} color={currentTheme.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {country.description && (
        <Text
          className={`text-sm ${currentTheme.textMuted} mt-2`}
          numberOfLines={2}
        >
          {country.description}
        </Text>
      )}
    </View>
  );

  if (loading && countries.length === 0) {
    return (
      <SafeAreaView
        className={`flex-1 ${currentTheme.background} items-center justify-center`}
      >
        <View className="items-center">
          <RefreshCw
            size={32}
            color={currentTheme.primary}
            className="animate-spin"
          />
          <Text className={`mt-4 ${currentTheme.text}`}>
            Loading countries...
          </Text>
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
              toast.type === "success"
                ? ["#10b981", "#059669"]
                : toast.type === "error"
                  ? ["#ef4444", "#dc2626"]
                  : toast.type === "info"
                    ? ["#3b82f6", "#2563eb"]
                    : ["#f59e0b", "#d97706"]
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
        <View className="flex-row justify-between items-center mb-4">
          <View>
            <Text className={`text-2xl font-bold ${currentTheme.text}`}>
              Countries
            </Text>
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
            <Search
              size={20}
              color={currentTheme.textMuted}
              className="absolute left-3 top-3 z-10"
            />
            <TextInput
              placeholder="Search countries..."
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
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="flex-1"
            >
              <View className="flex-row space-x-2">
                <TouchableOpacity
                  onPress={() => setFilterType("all")}
                  className={`px-4 py-2 rounded-full ${filterType === "all" ? "bg-purple-100 dark:bg-purple-600" : currentTheme.card}`}
                >
                  <Text
                    className={
                      filterType === "all"
                        ? "text-purple-700 dark:text-white"
                        : currentTheme.text
                    }
                  >
                    All
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setFilterType("system")}
                  className={`px-4 py-2 rounded-full ${filterType === "system" ? "bg-blue-100 dark:bg-blue-600" : currentTheme.card}`}
                >
                  <Text
                    className={
                      filterType === "system"
                        ? "text-blue-700 dark:text-white"
                        : currentTheme.text
                    }
                  >
                    System
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setFilterType("custom")}
                  className={`px-4 py-2 rounded-full ${filterType === "custom" ? "bg-green-100 dark:bg-green-600" : currentTheme.card}`}
                >
                  <Text
                    className={
                      filterType === "custom"
                        ? "text-green-700 dark:text-white"
                        : currentTheme.text
                    }
                  >
                    Custom
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <TouchableOpacity
              onPress={() =>
                setViewMode(viewMode === "grid" ? "table" : "grid")
              }
              className="p-2 rounded-xl bg-white dark:bg-gray-800"
            >
              {viewMode === "grid" ? (
                <List size={20} color={currentTheme.text} />
              ) : (
                <Grid size={20} color={currentTheme.text} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Content */}
      <FlatList
        ref={flatListRef}
        data={countries}
        key={viewMode}
        keyExtractor={(item) => item.$id}
        numColumns={viewMode === "grid" ? 2 : 1}
        renderItem={({ item }) =>
          viewMode === "grid" ? (
            <CountryCard country={item} />
          ) : (
            <TableRow country={item} />
          )
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
              No countries found
            </Text>
            <Text className={`${currentTheme.textMuted} mt-2 text-center`}>
              {searchQuery || filterType !== "all"
                ? "No countries match your filters"
                : "No countries available"}
            </Text>
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <View className="py-4 items-center">
              <RefreshCw
                size={24}
                color={currentTheme.primary}
                className="animate-spin"
              />
            </View>
          ) : metadata.hasMore ? (
            <View className="py-4 items-center">
              <Text className={currentTheme.textMuted}>
                Scroll down to load more
              </Text>
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
                {showCreateModal ? "Add New Country" : "Edit Country"}
              </Text>
              <TouchableOpacity onPress={closeModals}>
                <X size={24} color={currentTheme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="space-y-4">
                <View>
                  <Text className={`font-medium mb-2 ${currentTheme.text}`}>
                    Country Name *
                  </Text>
                  <TextInput
                    placeholder="Enter country name"
                    placeholderTextColor={currentTheme.textMuted}
                    value={formData.name}
                    onChangeText={(text) =>
                      setFormData({ ...formData, name: text })
                    }
                    className={`px-4 py-3 rounded-xl border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                  />
                </View>

                <View>
                  <Text className={`font-medium mb-2 ${currentTheme.text}`}>
                    ISO Code *
                  </Text>
                  <TextInput
                    placeholder="e.g., USA, CAN, UK"
                    placeholderTextColor={currentTheme.textMuted}
                    value={formData.isoCode}
                    onChangeText={(text) =>
                      setFormData({ ...formData, isoCode: text.toUpperCase() })
                    }
                    maxLength={3}
                    autoCapitalize="characters"
                    className={`px-4 py-3 rounded-xl border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                  />
                </View>

                <View>
                  <Text className={`font-medium mb-2 ${currentTheme.text}`}>
                    Description
                  </Text>
                  <TextInput
                    placeholder="Enter country description (optional)"
                    placeholderTextColor={currentTheme.textMuted}
                    value={formData.description}
                    onChangeText={(text) =>
                      setFormData({ ...formData, description: text })
                    }
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
                onPress={showCreateModal ? createCountry : updateCountry}
                className="flex-1 bg-gradient-to-r from-purple-600 to-purple-500 py-3 rounded-xl items-center"
              >
                <Text className="text-white font-medium">
                  {showCreateModal ? "Create" : "Update"} Country
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={showDeleteModal} transparent={true} animationType="fade">
        <View className="flex-1 bg-black/50 items-center justify-center p-6">
          <Animated.View
            entering={ZoomIn.duration(300)}
            exiting={ZoomOut.duration(200)}
            className={`${currentTheme.card} rounded-2xl p-6 w-full max-w-md`}
          >
            <View className="items-center mb-6">
              <View className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-500/20 items-center justify-center mb-4">
                <AlertTriangle size={32} color="#ef4444" />
              </View>
              <Text className={`text-lg font-bold ${currentTheme.text} mb-2`}>
                Delete Country
              </Text>
              <Text className={`${currentTheme.textMuted} text-center`}>
                Are you sure you want to delete{" "}
                <Text className="font-semibold">{countryToDelete?.name}</Text>?
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
                onPress={deleteCountry}
                className="flex-1 bg-gradient-to-r from-red-600 to-red-500 py-3 rounded-xl items-center"
              >
                <Text className="text-white font-medium">Delete Country</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
