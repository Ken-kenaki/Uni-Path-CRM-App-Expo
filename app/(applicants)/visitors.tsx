// app/(tabs)/visitors.tsx
import { API_URL } from "@/config";
import { LinearGradient } from "expo-linear-gradient";
import {
  Calendar,
  Mail,
  Phone,
  PhoneCall,
  Plus,
  Search,
  TrendingUp,
  Users,
  X,
} from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
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

const { width, height } = Dimensions.get("window");

// Calculate responsive values
const isSmallScreen = width < 375;
const isMediumScreen = width >= 375 && width < 768;
const isLargeScreen = width >= 768;

// Responsive calculations
const getCardWidth = () => {
  if (isLargeScreen) return (width - 48) / 3 - 8;
  if (isMediumScreen) return (width - 32) / 2 - 8;
  return width - 32;
};

const getCardPadding = () => {
  if (isLargeScreen) return 16;
  if (isMediumScreen) return 12;
  return 10;
};

const getFontSize = (baseSize: number) => {
  if (isLargeScreen) return baseSize + 2;
  if (isSmallScreen) return baseSize - 1;
  return baseSize;
};

const getIconSize = (baseSize: number) => {
  if (isLargeScreen) return baseSize + 2;
  if (isSmallScreen) return baseSize - 2;
  return baseSize;
};

// ============ TYPES ============
interface Visitor {
  id: string;
  $id: string;
  firstName: string;
  lastName: string;
  email: string;
  contact: string;
  gender?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  nationality?: string;
  interestArea?: string;
  referralSource?: string;
  visitorType?: string;
  followUpPriority?: string;
  conversionPotential?: string;
  $createdAt: string;
  totalVisits?: number;
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

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

const cacheManager = new CacheManager();

// ============ COMPONENTS ============

// Priority Badge Component
const PriorityBadge = ({ priority }: { priority: string }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500/20 text-red-400";
      case "high":
        return "bg-orange-500/20 text-orange-400";
      case "medium":
        return "bg-yellow-500/20 text-yellow-400";
      case "low":
        return "bg-gray-500/20 text-gray-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  return (
    <View className={`px-2 py-1 rounded-full ${getPriorityColor(priority)}`}>
      <Text className="text-xs font-medium capitalize">
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Text>
    </View>
  );
};

// Potential Badge Component
const PotentialBadge = ({ potential }: { potential: string }) => {
  const getPotentialColor = (potential: string) => {
    switch (potential) {
      case "high":
        return "bg-green-500/20 text-green-400";
      case "medium":
        return "bg-yellow-500/20 text-yellow-400";
      case "low":
        return "bg-gray-500/20 text-gray-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  return (
    <View className={`px-2 py-1 rounded-full ${getPotentialColor(potential)}`}>
      <Text className="text-xs font-medium capitalize">
        {potential} potential
      </Text>
    </View>
  );
};

// Visitor Card Component
const VisitorCard = ({
  visitor,
  onPress,
}: {
  visitor: Visitor;
  onPress: () => void;
}) => {
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  const cardWidth = getCardWidth();
  const cardPadding = getCardPadding();
  const fontSize = getFontSize(14);
  const iconSize = getIconSize(12);

  return (
    <TouchableOpacity
      onPress={onPress}
      className="rounded-2xl bg-gray-900 border border-gray-800"
      style={{
        width: cardWidth,
        margin: 4,
        padding: cardPadding,
      }}
    >
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1">
          <Text
            className="font-semibold text-white mb-1 truncate"
            style={{ fontSize }}
            numberOfLines={1}
          >
            {visitor.firstName} {visitor.lastName}
          </Text>
          <Text
            className="text-gray-400 text-sm truncate"
            style={{ fontSize: fontSize - 2 }}
            numberOfLines={1}
          >
            {visitor.email || "No email"}
          </Text>
        </View>
        <PotentialBadge potential={visitor.conversionPotential || "low"} />
      </View>

      <View className="space-y-2 mb-3">
        <View className="flex-row items-center">
          <Phone size={iconSize} color="#9ca3af" />
          <Text
            className="text-gray-400 ml-1.5 flex-1 truncate"
            style={{ fontSize: fontSize - 2 }}
            numberOfLines={1}
          >
            {visitor.contact || "N/A"}
          </Text>
        </View>

        {visitor.interestArea && (
          <View className="flex-row items-center">
            <Text
              className="text-gray-400 flex-1 truncate"
              style={{ fontSize: fontSize - 2 }}
              numberOfLines={1}
            >
              {visitor.interestArea}
            </Text>
          </View>
        )}
      </View>

      <View className="flex-row justify-between items-center mb-2">
        <PriorityBadge priority={visitor.followUpPriority || "medium"} />
        {visitor.totalVisits && (
          <View className="flex-row items-center">
            <TrendingUp size={iconSize - 2} color="#9ca3af" />
            <Text
              className="text-gray-400 ml-1"
              style={{ fontSize: fontSize - 2 }}
            >
              {visitor.totalVisits} visits
            </Text>
          </View>
        )}
      </View>

      <View className="flex-row justify-between items-center pt-2 border-t border-gray-800">
        <View className="flex-row items-center">
          <Calendar size={iconSize - 2} color="#9ca3af" />
          <Text
            className="text-gray-400 ml-1"
            style={{ fontSize: fontSize - 2 }}
          >
            {new Date(visitor.$createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </Text>
        </View>

        <View className="flex-row items-center">
          <Users size={iconSize - 2} color="#3b82f6" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Visitor Detail Modal Component
const VisitorDetailModal = ({
  visitor,
  isOpen,
  onClose,
}: {
  visitor: Visitor | null;
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [activeTab, setActiveTab] = useState<"overview" | "source">("overview");

  if (!visitor) return null;

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  const handleCallPress = () => {
    if (visitor.contact) {
      const phoneNumber = visitor.contact.replace(/\D/g, "");
      const url = `tel:${phoneNumber}`;
      Linking.openURL(url).catch((err) => {
        Alert.alert("Error", "Could not make the call");
        console.error("Error opening phone app:", err);
      });
    }
  };

  const handleEmailPress = () => {
    if (visitor.email) {
      const url = `mailto:${visitor.email}`;
      Linking.openURL(url).catch((err) => {
        Alert.alert("Error", "Could not open email app");
        console.error("Error opening email app:", err);
      });
    }
  };

  const modalPadding = isSmallScreen ? 4 : 6;
  const avatarSize = isSmallScreen ? 16 : 20;

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50">
        {/* Dismiss area - tap outside to close */}
        <TouchableOpacity
          className="flex-1"
          onPress={onClose}
          activeOpacity={1}
        />

        <Animated.View
          entering={SlideInDown.duration(300)}
          exiting={SlideOutDown.duration(200)}
          className="bg-gray-900 rounded-t-3xl absolute bottom-0 left-0 right-0"
          style={{
            padding: modalPadding,
            maxHeight: height * 0.9,
          }}
        >
          {/* Close button at top */}
          <View className="flex-row justify-end mb-2">
            <TouchableOpacity
              onPress={onClose}
              className="w-10 h-10 items-center justify-center"
            >
              <X size={24} color="white" />
            </TouchableOpacity>
          </View>

          <View className="mb-4">
            <Text className="text-xl font-bold text-white">
              Visitor Details
            </Text>
            <Text className="text-sm text-gray-400 mt-1">
              View visitor information
            </Text>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {/* Visitor Header */}
            <View className="items-center mb-6">
              {visitor.avatar ? (
                <Image
                  source={{ uri: visitor.avatar }}
                  className="rounded-full mb-3 border-2 border-blue-500"
                  style={{
                    width: avatarSize * 4,
                    height: avatarSize * 4,
                  }}
                />
              ) : (
                <View
                  className="rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 items-center justify-center mb-3"
                  style={{
                    width: avatarSize * 4,
                    height: avatarSize * 4,
                  }}
                >
                  <Text
                    className="text-white font-bold"
                    style={{ fontSize: avatarSize * 1.2 }}
                  >
                    {getInitials(visitor.firstName, visitor.lastName)}
                  </Text>
                </View>
              )}
              <Text className="text-xl font-bold text-white text-center">
                {visitor.firstName} {visitor.lastName}
              </Text>
              <Text className="text-sm text-gray-400 text-center">
                {visitor.email || "No email"}
              </Text>
              <View className="flex-row gap-2 mt-2">
                <PriorityBadge
                  priority={visitor.followUpPriority || "medium"}
                />
                <PotentialBadge
                  potential={visitor.conversionPotential || "low"}
                />
              </View>

              {/* Call and Email Buttons */}
              <View className="flex-row gap-3 mt-4">
                {visitor.contact && (
                  <TouchableOpacity
                    onPress={handleCallPress}
                    className="flex-row items-center justify-center gap-2 px-4 py-3 bg-green-600 rounded-xl flex-1"
                  >
                    <PhoneCall size={18} color="white" />
                    <Text className="text-white font-medium">Call</Text>
                  </TouchableOpacity>
                )}

                {visitor.email && (
                  <TouchableOpacity
                    onPress={handleEmailPress}
                    className="flex-row items-center justify-center gap-2 px-4 py-3 bg-blue-600 rounded-xl flex-1"
                  >
                    <Mail size={18} color="white" />
                    <Text className="text-white font-medium">Email</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Tabs */}
            <View className="flex-row border-b border-gray-800 mb-4">
              {(["overview", "source"] as const).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  className={`flex-1 py-3 items-center border-b-2 ${
                    activeTab === tab ? "border-blue-600" : "border-transparent"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      activeTab === tab ? "text-blue-400" : "text-gray-400"
                    }`}
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
                    <Text className="font-medium text-white mt-1">
                      {visitor.contact || "N/A"}
                    </Text>
                  </View>
                  <View className="p-3 rounded-lg bg-gray-800">
                    <Text className="text-xs text-gray-400">Gender</Text>
                    <Text className="font-medium text-white mt-1">
                      {visitor.gender || "N/A"}
                    </Text>
                  </View>
                  <View className="p-3 rounded-lg bg-gray-800">
                    <Text className="text-xs text-gray-400">Date of Birth</Text>
                    <Text className="font-medium text-white mt-1">
                      {visitor.dateOfBirth || "N/A"}
                    </Text>
                  </View>
                  <View className="p-3 rounded-lg bg-gray-800">
                    <Text className="text-xs text-gray-400">Nationality</Text>
                    <Text className="font-medium text-white mt-1">
                      {visitor.nationality || "N/A"}
                    </Text>
                  </View>
                </View>

                {visitor.address && (
                  <View className="p-3 rounded-lg bg-gray-800">
                    <Text className="font-medium text-white mb-2">Address</Text>
                    <Text className="text-sm text-white">
                      {visitor.address}
                      {visitor.city && `, ${visitor.city}`}
                      {visitor.state && `, ${visitor.state}`}
                      {visitor.zipCode && ` ${visitor.zipCode}`}
                    </Text>
                  </View>
                )}

                {visitor.interestArea && (
                  <View className="p-3 rounded-lg bg-gray-800">
                    <Text className="font-medium text-white mb-2">
                      Interest Area
                    </Text>
                    <Text className="text-sm text-white">
                      {visitor.interestArea}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {activeTab === "source" && (
              <View className="space-y-4">
                <View className="grid grid-cols-2 gap-3">
                  <View className="p-3 rounded-lg bg-blue-500/20">
                    <Text className="text-xs text-blue-400">
                      Referral Source
                    </Text>
                    <Text className="font-medium text-white capitalize mt-1">
                      {visitor.referralSource || "walk_in"}
                    </Text>
                  </View>
                  <View className="p-3 rounded-lg bg-green-500/20">
                    <Text className="text-xs text-green-400">Visitor Type</Text>
                    <Text className="font-medium text-white capitalize mt-1">
                      {visitor.visitorType || "walk_in"}
                    </Text>
                  </View>
                </View>

                <View className="p-3 rounded-lg bg-gray-800">
                  <Text className="font-medium text-white mb-2">
                    Total Visits
                  </Text>
                  <Text className="text-2xl font-bold text-white">
                    {visitor.totalVisits || 1}
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

// ============ MAIN PAGE COMPONENT ============
export default function VisitorsPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [referralFilter, setReferralFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedVisitorDetail, setSelectedVisitorDetail] =
    useState<Visitor | null>(null);
  const [showFilters, setShowFilters] = useState(false);

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

      try {
        const response = await fetch(`${API_URL}${url}`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
          cacheManager.set(cacheKey, result.data || result, ttl);
          return result.data || result;
        } else {
          throw new Error(result.error || "Fetch failed");
        }
      } catch (error) {
        console.error(`Error fetching from ${url}:`, error);
        throw error;
      }
    },
    [],
  );

  const fetchVisitors = async (isBackgroundUpdate = false) => {
    try {
      if (!isBackgroundUpdate) {
        setLoading(true);
      }

      const cacheKey = `visitors:${searchQuery}:${dateFilter}:${referralFilter}:${priorityFilter}`;

      let url = "/dashboard/visitors";
      const params = new URLSearchParams();

      if (searchQuery && searchQuery.trim().length > 0) {
        params.append("search", searchQuery.trim());
      }

      if (dateFilter && dateFilter !== "all") {
        params.append("dateFilter", dateFilter);
      }

      if (referralFilter && referralFilter !== "all") {
        params.append("referralSource", referralFilter);
      }

      if (priorityFilter && priorityFilter !== "all") {
        params.append("followUpPriority", priorityFilter);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const visitorsData = await cachedFetch<Visitor[]>(
        url,
        cacheKey,
        2 * 60 * 1000,
      );

      setVisitors(visitorsData || []);

      if (visitorsData && visitorsData.length === 0 && searchQuery) {
        showToast("No visitors found matching your search", "info");
      }
    } catch (error) {
      console.error("Error fetching visitors:", error);
      showToast("Failed to fetch visitors", "error");
      setVisitors([]);
    } finally {
      if (!isBackgroundUpdate) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, [searchQuery, dateFilter, referralFilter, priorityFilter]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    showToast("Refreshing visitors...", "info");
    cacheManager.delete("visitors");
    fetchVisitors();
  }, [fetchVisitors]);

  const openDetailModal = (visitor: Visitor) => {
    setSelectedVisitorDetail(visitor);
    setDetailModalOpen(true);
  };

  const handleVisitorPress = (visitor: Visitor) => {
    openDetailModal(visitor);
  };

  // Calculate statistics
  const totalVisitors = visitors.length;
  const highPriorityVisitors = visitors.filter(
    (v) => v.followUpPriority === "high" || v.followUpPriority === "urgent",
  ).length;
  const highPotentialVisitors = visitors.filter(
    (v) => v.conversionPotential === "high",
  ).length;

  const stats = [
    {
      icon: Users,
      label: "Total Visitors",
      value: totalVisitors.toString(),
      color: "bg-blue-500",
    },
    {
      icon: Users,
      label: "High Priority",
      value: highPriorityVisitors.toString(),
      color: "bg-red-500",
    },
    {
      icon: TrendingUp,
      label: "High Potential",
      value: highPotentialVisitors.toString(),
      color: "bg-green-500",
    },
  ];

  const dateFilters = [
    { value: "all", label: "All Time" },
    { value: "today", label: "Today" },
    { value: "week", label: "Last 7 Days" },
    { value: "month", label: "Last 30 Days" },
  ];

  const referralSources = [
    { value: "all", label: "All Sources" },
    { value: "walk_in", label: "Walk-in" },
    { value: "referral", label: "Referral" },
    { value: "website", label: "Website" },
  ];

  const priorityFilters = [
    { value: "all", label: "All Priorities" },
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "urgent", label: "Urgent" },
  ];

  const StatsCard = ({ icon: Icon, title, value, color }: any) => {
    const cardPadding = isSmallScreen ? 8 : 12;
    const valueSize = isSmallScreen ? 20 : 24;
    const iconSize = isSmallScreen ? 14 : 20;

    return (
      <View
        className="bg-gray-900 rounded-lg border border-gray-800"
        style={{ padding: cardPadding }}
      >
        <View className="flex-row items-center justify-between">
          <View>
            <Text
              className="font-bold text-white"
              style={{ fontSize: valueSize }}
            >
              {value}
            </Text>
            <Text
              className="text-gray-400"
              style={{ fontSize: isSmallScreen ? 10 : 12 }}
            >
              {title}
            </Text>
          </View>
          <View
            className={`rounded-lg ${color} items-center justify-center`}
            style={{
              width: isSmallScreen ? 32 : 40,
              height: isSmallScreen ? 32 : 40,
            }}
          >
            <Icon size={iconSize} color="white" />
          </View>
        </View>
      </View>
    );
  };

  if (loading && visitors.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-white">Loading visitors...</Text>
      </SafeAreaView>
    );
  }

  const searchIconSize = getIconSize(16);
  const searchInputHeight = isSmallScreen ? 40 : 48;

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
            className="rounded-xl px-4 py-3 flex-row items-center justify-between shadow-2xl"
          >
            <Text className="text-white font-medium flex-1 text-sm">
              {toast.message}
            </Text>
            <TouchableOpacity onPress={() => setToast(null)} className="ml-2">
              <X size={16} color="white" />
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      )}

      {/* Header */}
      <View className="p-4">
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-1">
            <Text className="text-2xl font-bold text-white">Visitors</Text>
            <Text className="text-sm text-gray-400 mt-1">
              View visitor information
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              // Handle create new visitor
              showToast("Create visitor functionality", "info");
            }}
            className="p-2 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg"
          >
            <Plus size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="relative mb-4">
          <View
            className="absolute left-3 z-10 justify-center"
            style={{ height: searchInputHeight }}
          >
            <Search size={searchIconSize} color="#9ca3af" />
          </View>
          <TextInput
            placeholder="Search visitors..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="pl-10 pr-4 bg-gray-900 rounded-xl border border-gray-800 text-white"
            style={{
              height: searchInputHeight,
              fontSize: isSmallScreen ? 14 : 16,
            }}
          />
        </View>

        {/* Filter Toggle */}
        <TouchableOpacity
          onPress={() => setShowFilters(!showFilters)}
          className="flex-row items-center justify-between p-2 mb-4 bg-gray-900 rounded-lg border border-gray-800"
        >
          <Text className="text-white">Filters</Text>
          <Text className="text-blue-400">{showFilters ? "Hide" : "Show"}</Text>
        </TouchableOpacity>

        {/* Filters */}
        {showFilters && (
          <View className="space-y-3 mb-4">
            <View>
              <Text className="text-sm text-gray-400 mb-2">Date Range</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {dateFilters.map((filter) => (
                    <TouchableOpacity
                      key={filter.value}
                      onPress={() => setDateFilter(filter.value)}
                      className={`px-3 py-1.5 rounded-lg ${
                        dateFilter === filter.value
                          ? "bg-blue-600"
                          : "bg-gray-900 border border-gray-800"
                      }`}
                    >
                      <Text
                        className={
                          dateFilter === filter.value
                            ? "text-white"
                            : "text-white"
                        }
                        style={{ fontSize: isSmallScreen ? 12 : 14 }}
                      >
                        {filter.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View>
              <Text className="text-sm text-gray-400 mb-2">
                Referral Source
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {referralSources.map((source) => (
                    <TouchableOpacity
                      key={source.value}
                      onPress={() => setReferralFilter(source.value)}
                      className={`px-3 py-1.5 rounded-lg ${
                        referralFilter === source.value
                          ? "bg-blue-600"
                          : "bg-gray-900 border border-gray-800"
                      }`}
                    >
                      <Text
                        className={
                          referralFilter === source.value
                            ? "text-white"
                            : "text-white"
                        }
                        style={{ fontSize: isSmallScreen ? 12 : 14 }}
                      >
                        {source.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View>
              <Text className="text-sm text-gray-400 mb-2">Priority Level</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {priorityFilters.map((priority) => (
                    <TouchableOpacity
                      key={priority.value}
                      onPress={() => setPriorityFilter(priority.value)}
                      className={`px-3 py-1.5 rounded-lg ${
                        priorityFilter === priority.value
                          ? "bg-blue-600"
                          : "bg-gray-900 border border-gray-800"
                      }`}
                    >
                      <Text
                        className={
                          priorityFilter === priority.value
                            ? "text-white"
                            : "text-white"
                        }
                        style={{ fontSize: isSmallScreen ? 12 : 14 }}
                      >
                        {priority.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        )}
      </View>

      {/* Stats Cards */}
      <View className="px-4 mb-4">
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

      {/* Visitors Grid */}
      <FlatList
        ref={flatListRef}
        data={visitors}
        numColumns={isLargeScreen ? 3 : isMediumScreen ? 2 : 1}
        key={isLargeScreen ? "3" : isMediumScreen ? "2" : "1"}
        keyExtractor={(item) => item.$id}
        renderItem={({ item }) => (
          <VisitorCard
            visitor={item}
            onPress={() => handleVisitorPress(item)}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#3b82f6"]}
            tintColor="#3b82f6"
          />
        }
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20 px-4">
            <Users size={isSmallScreen ? 40 : 48} color="#9ca3af" />
            <Text
              className="font-medium mt-4 text-white text-center"
              style={{ fontSize: isSmallScreen ? 16 : 18 }}
            >
              {searchQuery ? "No matching visitors found" : "No visitors yet"}
            </Text>
            <Text
              className="text-gray-400 mt-2 text-center"
              style={{ fontSize: isSmallScreen ? 12 : 14 }}
            >
              {searchQuery
                ? "Try a different search term"
                : "No visitors available"}
            </Text>
          </View>
        }
      />

      {/* Visitor Detail Modal */}
      <VisitorDetailModal
        visitor={selectedVisitorDetail}
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedVisitorDetail(null);
        }}
      />
    </SafeAreaView>
  );
}
