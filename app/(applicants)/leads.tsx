// app/(tabs)/leads.tsx
import { api } from "@/lib/api";
import { LinearGradient } from "expo-linear-gradient";
import {
  Calendar,
  Check,
  Mail,
  Phone,
  PhoneCall,
  Plus,
  Search,
  TrendingUp,
  UserCheck,
  Users,
  X,
} from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
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
interface Lead {
  id: string;
  $id: string;
  firstName: string;
  lastName: string;
  email: string;
  contact: string;
  leadStatus: "new" | "contacted" | "qualified" | "converted" | "lost";
  $createdAt: string;
  interestedArea?: string;
  countries?: string;
  budgetRange?: string;
  followUpPriority?: "low" | "medium" | "high" | "urgent";
  priorityScore?: number;
  isConverted?: boolean;
  canConvert?: boolean;
}

// ============ CACHE MANAGER ============
class CacheManager {
  private cache = new Map<string, any>();
  private defaultTTL = 5 * 60 * 1000;

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

// Status Badge Component
const StatusBadge = ({ status }: { status: string }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-500/20 text-blue-400";
      case "contacted":
        return "bg-yellow-500/20 text-yellow-400";
      case "qualified":
        return "bg-green-500/20 text-green-400";
      case "converted":
        return "bg-purple-500/20 text-purple-400";
      case "lost":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  return (
    <View className={`px-2 py-1 rounded-full ${getStatusColor(status)}`}>
      <Text className="text-xs font-medium capitalize">
        {status.replace("_", " ")}
      </Text>
    </View>
  );
};

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
      <Text className="text-xs font-medium capitalize">{priority}</Text>
    </View>
  );
};

// Lead Card Component
const LeadCard = ({ lead, onPress }: { lead: Lead; onPress: () => void }) => {
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
            {lead.firstName} {lead.lastName}
          </Text>
          <Text
            className="text-gray-400 text-sm truncate"
            style={{ fontSize: fontSize - 2 }}
            numberOfLines={1}
          >
            {lead.email || "No email"}
          </Text>
        </View>
        <StatusBadge status={lead.leadStatus} />
      </View>

      <View className="space-y-2 mb-3">
        <View className="flex-row items-center">
          <Phone size={iconSize} color="#9ca3af" />
          <Text
            className="text-gray-400 ml-1.5 flex-1 truncate"
            style={{ fontSize: fontSize - 2 }}
            numberOfLines={1}
          >
            {lead.contact || "N/A"}
          </Text>
        </View>

        {lead.interestedArea && (
          <View className="flex-row items-center">
            <Text
              className="text-gray-400 flex-1 truncate"
              style={{ fontSize: fontSize - 2 }}
              numberOfLines={1}
            >
              {lead.interestedArea}
            </Text>
          </View>
        )}
      </View>

      <View className="flex-row justify-between items-center mb-2">
        <PriorityBadge priority={lead.followUpPriority || "medium"} />
        {lead.priorityScore && (
          <View className="flex-row items-center">
            <TrendingUp size={iconSize - 2} color="#9ca3af" />
            <Text
              className="text-gray-400 ml-1"
              style={{ fontSize: fontSize - 2 }}
            >
              {lead.priorityScore}
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
            {new Date(lead.$createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </Text>
        </View>

        {lead.canConvert && !lead.isConverted && (
          <View className="flex-row items-center">
            <UserCheck size={iconSize - 2} color="#10b981" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// Lead Detail Modal Component
const LeadDetailModal = ({
  lead,
  isOpen,
  onClose,
  onConvert,
}: {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onConvert: (leadId: string) => void;
}) => {
  const [activeTab, setActiveTab] = useState<"overview" | "details">(
    "overview",
  );

  if (!lead) return null;

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  const handleCallPress = () => {
    if (lead.contact) {
      const phoneNumber = lead.contact.replace(/\D/g, "");
      const url = `tel:${phoneNumber}`;
      Linking.openURL(url).catch((err) => {
        Alert.alert("Error", "Could not make the call");
        console.error("Error opening phone app:", err);
      });
    }
  };

  const handleEmailPress = () => {
    if (lead.email) {
      const url = `mailto:${lead.email}`;
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
            maxHeight: height * 0.9, // Changed from 0.85 to 0.9
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
            <Text className="text-xl font-bold text-white">Lead Details</Text>
            <Text className="text-sm text-gray-400 mt-1">
              View lead information
            </Text>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {/* Lead Header */}
            <View className="items-center mb-6">
              <View
                className="rounded-full bg-gradient-to-br from-purple-500 to-pink-500 items-center justify-center mb-3"
                style={{
                  width: avatarSize * 4,
                  height: avatarSize * 4,
                }}
              >
                <Text
                  className="text-white font-bold"
                  style={{ fontSize: avatarSize * 1.2 }}
                >
                  {getInitials(lead.firstName, lead.lastName)}
                </Text>
              </View>
              <Text className="text-xl font-bold text-white text-center">
                {lead.firstName} {lead.lastName}
              </Text>
              <Text className="text-sm text-gray-400 text-center">
                {lead.email || "No email"}
              </Text>
              <View className="flex-row gap-2 mt-2">
                <StatusBadge status={lead.leadStatus} />
                <PriorityBadge priority={lead.followUpPriority || "medium"} />
              </View>

              {/* Action Buttons */}
              <View className="flex-row gap-3 mt-4">
                {lead.contact && (
                  <TouchableOpacity
                    onPress={handleCallPress}
                    className="flex-row items-center justify-center gap-2 px-4 py-3 bg-green-600 rounded-xl flex-1"
                  >
                    <PhoneCall size={18} color="white" />
                    <Text className="text-white font-medium">Call</Text>
                  </TouchableOpacity>
                )}

                {lead.email && (
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
              {(["overview", "details"] as const).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  className={`flex-1 py-3 items-center border-b-2 ${
                    activeTab === tab
                      ? "border-purple-600"
                      : "border-transparent"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      activeTab === tab ? "text-purple-400" : "text-gray-400"
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
                      {lead.contact || "N/A"}
                    </Text>
                  </View>
                  <View className="p-3 rounded-lg bg-gray-800">
                    <Text className="text-xs text-gray-400">Created</Text>
                    <Text className="font-medium text-white mt-1">
                      {new Date(lead.$createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  {lead.priorityScore && (
                    <View className="p-3 rounded-lg bg-gray-800">
                      <Text className="text-xs text-gray-400">
                        Priority Score
                      </Text>
                      <Text className="font-medium text-white mt-1">
                        {lead.priorityScore}/100
                      </Text>
                    </View>
                  )}
                </View>

                {lead.interestedArea && (
                  <View className="p-3 rounded-lg bg-gray-800">
                    <Text className="font-medium text-white mb-2">
                      Interest Area
                    </Text>
                    <Text className="text-sm text-white">
                      {lead.interestedArea}
                    </Text>
                  </View>
                )}

                {lead.countries && (
                  <View className="p-3 rounded-lg bg-gray-800">
                    <Text className="font-medium text-white mb-2">
                      Target Countries
                    </Text>
                    <Text className="text-sm text-white">{lead.countries}</Text>
                  </View>
                )}

                {lead.budgetRange && (
                  <View className="p-3 rounded-lg bg-gray-800">
                    <Text className="font-medium text-white mb-2">
                      Budget Range
                    </Text>
                    <Text className="text-sm text-white">
                      {lead.budgetRange}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {activeTab === "details" && (
              <View className="space-y-4">
                <View className="p-3 rounded-lg bg-purple-500/20">
                  <Text className="text-xs text-purple-400">Lead Status</Text>
                  <Text className="font-medium text-white capitalize mt-1">
                    {lead.leadStatus.replace("_", " ")}
                  </Text>
                  <Text className="text-sm text-purple-300 mt-2">
                    {lead.isConverted
                      ? "Already converted to student"
                      : lead.canConvert
                        ? "Ready for conversion"
                        : "Needs qualification"}
                  </Text>
                </View>

                <View className="p-3 rounded-lg bg-gray-800">
                  <Text className="font-medium text-white mb-2">
                    Follow-up Priority
                  </Text>
                  <Text className="text-sm text-white capitalize">
                    {lead.followUpPriority || "medium"}
                  </Text>
                </View>

                {lead.canConvert && !lead.isConverted && (
                  <TouchableOpacity
                    onPress={() => onConvert(lead.$id)}
                    className="mt-4 flex-row items-center justify-center gap-2 px-4 py-4 bg-gradient-to-r from-green-600 to-emerald-500 rounded-xl"
                  >
                    <UserCheck size={20} color="white" />
                    <Text className="text-white font-medium text-lg">
                      Convert to Student
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

// ============ MAIN PAGE COMPONENT ============
export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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
        const result = await api.getLeads(
          Object.fromEntries(new URL(`https://x${url}`).searchParams),
        );

        if (result.success) {
          cacheManager.set(cacheKey, result.data || result, ttl);
          return (result.data || result) as T;
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

  const fetchLeads = async (isBackgroundUpdate = false) => {
    try {
      if (!isBackgroundUpdate) {
        setLoading(true);
      }

      const cacheKey = `leads:${searchQuery}:${statusFilter}:${priorityFilter}`;

      let url = "/dashboard/leads";
      const params = new URLSearchParams();

      if (searchQuery && searchQuery.trim().length > 0) {
        params.append("search", searchQuery.trim());
      }

      if (statusFilter && statusFilter !== "all") {
        params.append("leadStatus", statusFilter);
      }

      if (priorityFilter && priorityFilter !== "all") {
        params.append("followUpPriority", priorityFilter);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const leadsData = await cachedFetch<Lead[]>(url, cacheKey, 2 * 60 * 1000);

      setLeads(leadsData || []);

      if (leadsData && leadsData.length === 0 && searchQuery) {
        showToast("No leads found matching your search", "info");
      }
    } catch (error) {
      console.error("Error fetching leads:", error);
      showToast("Failed to fetch leads", "error");
      setLeads([]);
    } finally {
      if (!isBackgroundUpdate) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  const handleLeadAction = async (
    leadId: string,
    action: string,
    data?: any,
  ) => {
    try {
      setActionLoading(leadId);

      const result = await api.updateLead("", {
          leadId,
          action,
          ...data,
        });

      if (result.success) {
        showToast("Action successful", "success");
        fetchLeads();
      } else {
        showToast(result.error || "Failed to update lead", "error");
      }
    } catch (error) {
      showToast("Error updating lead", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleConvertLead = (leadId: string) => {
    Alert.alert(
      "Convert to Student",
      "Are you sure you want to convert this lead to a student?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Convert",
          onPress: () => handleLeadAction(leadId, "convert"),
        },
      ],
    );
  };

  useEffect(() => {
    fetchLeads();
  }, [searchQuery, statusFilter, priorityFilter]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    showToast("Refreshing leads...", "info");
    cacheManager.delete("leads");
    fetchLeads();
  }, [fetchLeads]);

  const openDetailModal = (lead: Lead) => {
    setSelectedLead(lead);
    setDetailModalOpen(true);
  };

  const handleLeadPress = (lead: Lead) => {
    openDetailModal(lead);
  };

  // Calculate statistics
  const totalLeads = leads.length;
  const qualifiedLeads = leads.filter(
    (l) => l.leadStatus === "qualified",
  ).length;
  const highPriorityLeads = leads.filter(
    (l) => l.followUpPriority === "high" || l.followUpPriority === "urgent",
  ).length;
  const convertibleLeads = leads.filter(
    (l) => l.canConvert && !l.isConverted,
  ).length;

  const stats = [
    {
      icon: Users,
      label: "Total Leads",
      value: totalLeads.toString(),
      color: "bg-purple-500",
    },
    {
      icon: Check,
      label: "Qualified",
      value: qualifiedLeads.toString(),
      color: "bg-green-500",
    },
    {
      icon: TrendingUp,
      label: "High Priority",
      value: highPriorityLeads.toString(),
      color: "bg-red-500",
    },
    {
      icon: UserCheck,
      label: "Ready to Convert",
      value: convertibleLeads.toString(),
      color: "bg-blue-500",
    },
  ];

  const statusFilters = [
    { value: "all", label: "All Status" },
    { value: "new", label: "New" },
    { value: "contacted", label: "Contacted" },
    { value: "qualified", label: "Qualified" },
    { value: "converted", label: "Converted" },
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

  if (loading && leads.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text className="mt-4 text-white">Loading leads...</Text>
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
                  : ["#8b5cf6", "#7c3aed"]
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
            <Text className="text-2xl font-bold text-white">Leads</Text>
            <Text className="text-sm text-gray-400 mt-1">
              Manage potential students
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              // Handle create new lead
              showToast("Create lead functionality", "info");
            }}
            className="p-2 bg-gradient-to-r from-purple-600 to-pink-500 rounded-lg"
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
            placeholder="Search leads..."
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
          <Text className="text-purple-400">
            {showFilters ? "Hide" : "Show"}
          </Text>
        </TouchableOpacity>

        {/* Filters */}
        {showFilters && (
          <View className="space-y-3 mb-4">
            <View>
              <Text className="text-sm text-gray-400 mb-2">Status</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
                          statusFilter === filter.value
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
              <Text className="text-sm text-gray-400 mb-2">Priority</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {priorityFilters.map((priority) => (
                    <TouchableOpacity
                      key={priority.value}
                      onPress={() => setPriorityFilter(priority.value)}
                      className={`px-3 py-1.5 rounded-lg ${
                        priorityFilter === priority.value
                          ? "bg-purple-600"
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

      {/* Leads Grid */}
      <FlatList
        ref={flatListRef}
        data={leads}
        numColumns={isLargeScreen ? 3 : isMediumScreen ? 2 : 1}
        key={isLargeScreen ? "3" : isMediumScreen ? "2" : "1"}
        keyExtractor={(item) => item.$id}
        renderItem={({ item }) => (
          <LeadCard lead={item} onPress={() => handleLeadPress(item)} />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#8b5cf6"]}
            tintColor="#8b5cf6"
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
              {searchQuery ? "No matching leads found" : "No leads yet"}
            </Text>
            <Text
              className="text-gray-400 mt-2 text-center"
              style={{ fontSize: isSmallScreen ? 12 : 14 }}
            >
              {searchQuery
                ? "Try a different search term"
                : "Get started by creating your first lead"}
            </Text>
          </View>
        }
      />

      {/* Lead Detail Modal */}
      <LeadDetailModal
        lead={selectedLead}
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedLead(null);
        }}
        onConvert={handleConvertLead}
      />
    </SafeAreaView>
  );
}
