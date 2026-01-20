// app/(tabs)/visitors.tsx
import { API_URL } from "@/config";
import { Theme, themeConfigs } from "@/theme";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
    AlertCircle,
    Calendar,
    Check,
    ChevronDown,
    ChevronUp,
    Clock,
    Filter,
    Mail,
    Phone,
    RefreshCw,
    Search,
    Trash2,
    TrendingUp,
    User,
    UserCheck,
    UserPlus,
    Users,
    Users as UsersIcon,
    X
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
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

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
  emergencyContact?: string;
  emergencyContactPhone?: string;
  visitNotes?: string;
  interestArea?: string;
  followUpDate?: string;
  visitDuration?: number;
  referralSource?: string;
  referralNotes?: string;
  leadSource?: string;
  campaign?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  visitorType?: string;
  priorityScore?: number;
  engagementScore?: number;
  followUpPriority?: string;
  $createdAt: string;
  $updatedAt: string;
  analytics?: {
    totalVisits: number;
    lastVisit: string;
    averageVisitDuration: number;
    followUpRequired: boolean;
  };
  sourceInfo?: {
    referralSource: string;
    visitorType: string;
    leadSource: string;
    campaign: string;
  };
  conversionReadiness?: {
    readyForConversion: boolean;
    conversionPotential: string;
  };
  totalVisits?: number;
  lastVisited?: string;
  firstVisitedAt?: string;
  lastVisitedAt?: string;
  conversionPotential?: string;
  engagementLevel?: string;
  branches?: string;
}

interface User {
  id: string;
  $id: string;
  name: string;
  email: string;
  role: string;
}

interface Branch {
  id: string;
  $id: string;
  name: string;
  location: string;
  status: "active" | "inactive";
}

interface VisitorFormData {
  firstName: string;
  lastName: string;
  email: string;
  contact: string;
  gender: string;
  dateOfBirth: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  nationality: string;
  emergencyContact: string;
  emergencyContactPhone: string;
  visitNotes: string;
  interestArea: string;
  followUpDate: string;
  visitDuration: string;
  referralSource: string;
  referralNotes: string;
  leadSource: string;
  campaign: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm: string;
  utmContent: string;
  visitorType: string;
  priorityScore: string;
  engagementScore: string;
  followUpPriority: string;
  referredBy: string[];
}

interface ConvertToStudentFormData {
  firstName: string;
  lastName: string;
  email: string;
  contact: string;
  gender: string;
  dateOfBirth: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  nationality: string;
  emergencyContact: string;
  emergencyContactPhone: string;
  lastDegree: string;
  degreeGPA: string;
  highSchoolGPA: string;
  plusTwoGPA: string;
  currentInstitution: string;
  currentCourse: string;
  graduationYear: string;
  academicQualification: string;
  testScores: string;
  achievements: string;
  extracurricularActivities: string;
  workExperience: string;
  intendedStartDate: string;
  englishProficiency: string;
  previousEducation: string;
  assignedTo: string[];
  branches: string;
  status: "new";
  leadStatus: "new";
  notes: string;
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

// Priority Badge Component
const PriorityBadge = ({ priority }: { priority: string }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400";
      case "high":
        return "bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400";
      case "medium":
        return "bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400";
      case "low":
        return "bg-gray-100 dark:bg-gray-500/20 text-gray-600 dark:text-gray-400";
      default:
        return "bg-gray-100 dark:bg-gray-500/20 text-gray-600 dark:text-gray-400";
    }
  };

  return (
    <View className={`px-2 py-1 rounded-full ${getPriorityColor(priority)}`}>
      <Text className="text-xs font-medium">
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
        return "bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400";
      case "medium":
        return "bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400";
      case "low":
        return "bg-gray-100 dark:bg-gray-500/20 text-gray-600 dark:text-gray-400";
      default:
        return "bg-gray-100 dark:bg-gray-500/20 text-gray-600 dark:text-gray-400";
    }
  };

  return (
    <View className={`px-2 py-1 rounded-full ${getPotentialColor(potential)}`}>
      <Text className="text-xs font-medium">{potential} potential</Text>
    </View>
  );
};

// Visitor Card Component
const VisitorCard = ({
  visitor,
  isSelected,
  onSelect,
  onPress,
  onMorePress,
}: {
  visitor: Visitor;
  isSelected: boolean;
  onSelect: () => void;
  onPress: () => void;
  onMorePress: () => void;
}) => {
  const [theme] = useState<Theme>("dark");
  const currentTheme = themeConfigs[theme];
  const [expanded, setExpanded] = useState(false);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`m-2 p-4 rounded-2xl ${currentTheme.card} border ${currentTheme.border}`}
    >
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            className="mt-1"
          >
            <View
              className={`w-5 h-5 rounded border ${isSelected ? "bg-blue-600 border-blue-600" : currentTheme.border} items-center justify-center`}
            >
              {isSelected && <Check size={12} color="white" />}
            </View>
          </TouchableOpacity>

          <View className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 items-center justify-center">
            <Text className="text-white font-bold">
              {getInitials(visitor.firstName, visitor.lastName)}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            onMorePress();
          }}
          className="p-1"
        >
          {expanded ? (
            <ChevronUp size={20} color={currentTheme.textMuted} />
          ) : (
            <ChevronDown size={20} color={currentTheme.textMuted} />
          )}
        </TouchableOpacity>
      </View>

      <Text
        className={`font-semibold ${currentTheme.text} mb-2`}
        numberOfLines={1}
      >
        {visitor.firstName} {visitor.lastName}
      </Text>

      <View className="space-y-2 mb-3">
        <View className="flex-row items-center">
          <Mail size={14} color={currentTheme.textMuted} />
          <Text
            className={`text-xs ${currentTheme.textMuted} ml-2 flex-1`}
            numberOfLines={1}
          >
            {visitor.email || "No email"}
          </Text>
        </View>

        <View className="flex-row items-center">
          <Phone size={14} color={currentTheme.textMuted} />
          <Text
            className={`text-xs ${currentTheme.textMuted} ml-2 flex-1`}
            numberOfLines={1}
          >
            {visitor.contact || "N/A"}
          </Text>
        </View>
      </View>

      <View className="flex-row justify-between items-center mb-3">
        <PotentialBadge potential={visitor.conversionPotential || "low"} />
        <PriorityBadge priority={visitor.followUpPriority || "medium"} />
      </View>

      <View className="flex-row justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
        <View className="flex-row items-center">
          <UsersIcon size={12} color={currentTheme.textMuted} />
          <Text className={`text-xs ${currentTheme.textMuted} ml-1`}>
            {visitor.analytics?.totalVisits || visitor.totalVisits || 1}{" "}
            visit(s)
          </Text>
        </View>

        <View className="flex-row items-center">
          <Calendar size={12} color={currentTheme.textMuted} />
          <Text className={`text-xs ${currentTheme.textMuted} ml-1`}>
            {new Date(visitor.$createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </Text>
        </View>
      </View>

      {expanded && (
        <View className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
          <View>
            <Text className={`text-xs ${currentTheme.textMuted} mb-1`}>
              Interest Area
            </Text>
            <Text className={`text-sm ${currentTheme.text}`}>
              {visitor.interestArea || "Not specified"}
            </Text>
          </View>

          <View>
            <Text className={`text-xs ${currentTheme.textMuted} mb-1`}>
              Source
            </Text>
            <Text className={`text-sm ${currentTheme.text} capitalize`}>
              {visitor.sourceInfo?.referralSource ||
                visitor.referralSource ||
                "walk_in"}
            </Text>
          </View>

          {visitor.followUpDate && (
            <View>
              <Text className={`text-xs ${currentTheme.textMuted} mb-1`}>
                Follow-up Date
              </Text>
              <Text className={`text-sm ${currentTheme.text}`}>
                {new Date(visitor.followUpDate).toLocaleDateString()}
              </Text>
            </View>
          )}

          {visitor.conversionReadiness?.readyForConversion && (
            <View className="p-2 bg-green-100 dark:bg-green-500/20 rounded-lg">
              <Text className="text-sm text-green-800 dark:text-green-400 font-medium">
                Ready for conversion
              </Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

// Visitor Detail Modal Component
const VisitorDetailModal = ({
  visitor,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onConvert,
}: {
  visitor: Visitor | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (visitor: Visitor) => void;
  onDelete: (id: string) => void;
  onConvert: (visitor: Visitor) => void;
}) => {
  const [theme] = useState<Theme>("dark");
  const currentTheme = themeConfigs[theme];
  const [activeTab, setActiveTab] = useState<
    "overview" | "source" | "analytics" | "conversion"
  >("overview");

  if (!visitor) return null;

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  return (
    <Modal visible={isOpen} animationType="slide" transparent={true}>
      <View className="flex-1 bg-black/50 justify-end">
        <Animated.View
          entering={SlideInDown.duration(300)}
          exiting={SlideOutDown.duration(200)}
          className={`${currentTheme.card} rounded-t-3xl p-6 max-h-[85vh]`}
        >
          <View className="flex-row justify-between items-center mb-6">
            <View>
              <Text className={`text-xl font-bold ${currentTheme.text}`}>
                Visitor Details
              </Text>
              <Text className={`text-sm ${currentTheme.textMuted} mt-1`}>
                View and manage visitor information
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={currentTheme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Visitor Header */}
            <View className="items-center mb-6">
              <View className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 items-center justify-center mb-3">
                <Text className="text-white text-2xl font-bold">
                  {getInitials(visitor.firstName, visitor.lastName)}
                </Text>
              </View>
              <Text className={`text-xl font-bold ${currentTheme.text}`}>
                {visitor.firstName} {visitor.lastName}
              </Text>
              <Text className={`text-sm ${currentTheme.textMuted}`}>
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
            </View>

            {/* Tabs */}
            <View className="flex-row border-b border-gray-200 dark:border-gray-700 mb-4">
              {(["overview", "source", "analytics", "conversion"] as const).map(
                (tab) => (
                  <TouchableOpacity
                    key={tab}
                    onPress={() => setActiveTab(tab)}
                    className={`flex-1 py-2 items-center border-b-2 ${activeTab === tab ? "border-blue-600" : "border-transparent"}`}
                  >
                    <Text
                      className={`text-sm font-medium ${activeTab === tab ? "text-blue-600 dark:text-blue-400" : currentTheme.textMuted}`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ),
              )}
            </View>

            {/* Tab Content */}
            {activeTab === "overview" && (
              <View className="space-y-4">
                <View className="grid grid-cols-2 gap-3">
                  <View className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
                    <Text className={`text-xs ${currentTheme.textMuted}`}>
                      Contact
                    </Text>
                    <Text className={`font-medium ${currentTheme.text}`}>
                      {visitor.contact || "N/A"}
                    </Text>
                  </View>
                  <View className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
                    <Text className={`text-xs ${currentTheme.textMuted}`}>
                      Gender
                    </Text>
                    <Text className={`font-medium ${currentTheme.text}`}>
                      {visitor.gender || "N/A"}
                    </Text>
                  </View>
                  <View className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
                    <Text className={`text-xs ${currentTheme.textMuted}`}>
                      Date of Birth
                    </Text>
                    <Text className={`font-medium ${currentTheme.text}`}>
                      {visitor.dateOfBirth || "N/A"}
                    </Text>
                  </View>
                  <View className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
                    <Text className={`text-xs ${currentTheme.textMuted}`}>
                      Nationality
                    </Text>
                    <Text className={`font-medium ${currentTheme.text}`}>
                      {visitor.nationality || "N/A"}
                    </Text>
                  </View>
                </View>

                {visitor.address && (
                  <View>
                    <Text className={`font-medium ${currentTheme.text} mb-2`}>
                      Address
                    </Text>
                    <Text className={`text-sm ${currentTheme.text}`}>
                      {visitor.address}
                      {visitor.city && `, ${visitor.city}`}
                      {visitor.state && `, ${visitor.state}`}
                      {visitor.zipCode && ` ${visitor.zipCode}`}
                    </Text>
                  </View>
                )}

                {visitor.emergencyContact && (
                  <View>
                    <Text className={`font-medium ${currentTheme.text} mb-2`}>
                      Emergency Contact
                    </Text>
                    <Text className={`text-sm ${currentTheme.text}`}>
                      {visitor.emergencyContact} -{" "}
                      {visitor.emergencyContactPhone}
                    </Text>
                  </View>
                )}

                {visitor.visitNotes && (
                  <View>
                    <Text className={`font-medium ${currentTheme.text} mb-2`}>
                      Visit Notes
                    </Text>
                    <Text className={`text-sm ${currentTheme.text}`}>
                      {visitor.visitNotes}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {activeTab === "source" && (
              <View className="space-y-4">
                <View className="grid grid-cols-2 gap-3">
                  <View className="p-3 rounded-lg bg-blue-100 dark:bg-blue-500/20">
                    <Text
                      className={`text-xs text-blue-600 dark:text-blue-400`}
                    >
                      Referral Source
                    </Text>
                    <Text
                      className={`font-medium ${currentTheme.text} capitalize`}
                    >
                      {visitor.sourceInfo?.referralSource ||
                        visitor.referralSource ||
                        "walk_in"}
                    </Text>
                  </View>
                  <View className="p-3 rounded-lg bg-green-100 dark:bg-green-500/20">
                    <Text
                      className={`text-xs text-green-600 dark:text-green-400`}
                    >
                      Visitor Type
                    </Text>
                    <Text className={`font-medium ${currentTheme.text}`}>
                      {visitor.sourceInfo?.visitorType ||
                        visitor.visitorType ||
                        "walk_in"}
                    </Text>
                  </View>
                  <View className="p-3 rounded-lg bg-purple-100 dark:bg-purple-500/20">
                    <Text
                      className={`text-xs text-purple-600 dark:text-purple-400`}
                    >
                      Lead Source
                    </Text>
                    <Text className={`font-medium ${currentTheme.text}`}>
                      {visitor.sourceInfo?.leadSource ||
                        visitor.leadSource ||
                        "N/A"}
                    </Text>
                  </View>
                  <View className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-500/20">
                    <Text
                      className={`text-xs text-yellow-600 dark:text-yellow-400`}
                    >
                      Campaign
                    </Text>
                    <Text className={`font-medium ${currentTheme.text}`}>
                      {visitor.sourceInfo?.campaign ||
                        visitor.campaign ||
                        "N/A"}
                    </Text>
                  </View>
                </View>

                {visitor.referralNotes && (
                  <View>
                    <Text className={`font-medium ${currentTheme.text} mb-2`}>
                      Referral Notes
                    </Text>
                    <Text className={`text-sm ${currentTheme.text}`}>
                      {visitor.referralNotes}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {activeTab === "analytics" && (
              <View className="space-y-4">
                <View className="grid grid-cols-2 gap-3">
                  <View className="p-3 rounded-lg bg-purple-100 dark:bg-purple-500/20">
                    <Text
                      className={`text-xs text-purple-600 dark:text-purple-400`}
                    >
                      Total Visits
                    </Text>
                    <Text className={`text-xl font-bold ${currentTheme.text}`}>
                      {visitor.analytics?.totalVisits ||
                        visitor.totalVisits ||
                        1}
                    </Text>
                  </View>
                  <View className="p-3 rounded-lg bg-blue-100 dark:bg-blue-500/20">
                    <Text
                      className={`text-xs text-blue-600 dark:text-blue-400`}
                    >
                      Last Visit
                    </Text>
                    <Text className={`font-medium ${currentTheme.text}`}>
                      {visitor.analytics?.lastVisit
                        ? new Date(
                            visitor.analytics.lastVisit,
                          ).toLocaleDateString()
                        : "N/A"}
                    </Text>
                  </View>
                  <View className="p-3 rounded-lg bg-green-100 dark:bg-green-500/20">
                    <Text
                      className={`text-xs text-green-600 dark:text-green-400`}
                    >
                      Avg Visit Duration
                    </Text>
                    <Text className={`font-medium ${currentTheme.text}`}>
                      {visitor.analytics?.averageVisitDuration ||
                        visitor.visitDuration ||
                        "N/A"}{" "}
                      mins
                    </Text>
                  </View>
                  <View className="p-3 rounded-lg bg-red-100 dark:bg-red-500/20">
                    <Text className={`text-xs text-red-600 dark:text-red-400`}>
                      Follow-up Required
                    </Text>
                    <Text className={`font-medium ${currentTheme.text}`}>
                      {visitor.analytics?.followUpRequired ? "Yes" : "No"}
                    </Text>
                  </View>
                </View>

                <View>
                  <Text className={`font-medium ${currentTheme.text} mb-2`}>
                    Engagement Level
                  </Text>
                  <View
                    className={`px-3 py-2 rounded-lg ${visitor.engagementLevel === "high" ? "bg-green-100 dark:bg-green-500/20" : visitor.engagementLevel === "medium" ? "bg-yellow-100 dark:bg-yellow-500/20" : "bg-gray-100 dark:bg-gray-800"}`}
                  >
                    <Text className={`${currentTheme.text}`}>
                      {visitor.engagementLevel || "low"}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {activeTab === "conversion" && (
              <View className="space-y-4">
                <View className="grid grid-cols-2 gap-3">
                  <View className="p-3 rounded-lg bg-green-100 dark:bg-green-500/20">
                    <Text
                      className={`text-xs text-green-600 dark:text-green-400`}
                    >
                      Conversion Potential
                    </Text>
                    <PotentialBadge
                      potential={visitor.conversionPotential || "low"}
                    />
                  </View>
                  <View className="p-3 rounded-lg bg-orange-100 dark:bg-orange-500/20">
                    <Text
                      className={`text-xs text-orange-600 dark:text-orange-400`}
                    >
                      Follow-up Priority
                    </Text>
                    <PriorityBadge
                      priority={visitor.followUpPriority || "medium"}
                    />
                  </View>
                </View>

                {visitor.conversionReadiness?.readyForConversion && (
                  <View className="p-4 bg-green-100 dark:bg-green-500/20 rounded-lg border border-green-200 dark:border-green-800">
                    <Text className="text-lg font-semibold text-green-800 dark:text-green-400 mb-2">
                      Ready for Conversion
                    </Text>
                    <Text className="text-sm text-green-700 dark:text-green-400">
                      This visitor is ready to be converted to a student. They
                      have shown strong interest and meet the criteria for
                      student conversion.
                    </Text>
                  </View>
                )}

                <View>
                  <Text className={`font-medium ${currentTheme.text} mb-2`}>
                    Interest Area
                  </Text>
                  <Text className={`text-sm ${currentTheme.text}`}>
                    {visitor.interestArea || "Not specified"}
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View className="flex-row gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <TouchableOpacity
              onPress={() => onEdit(visitor)}
              className="flex-1 py-3 bg-blue-600 rounded-xl items-center"
            >
              <Text className="text-white font-medium">Edit</Text>
            </TouchableOpacity>

            {visitor.conversionReadiness?.readyForConversion && (
              <TouchableOpacity
                onPress={() => onConvert(visitor)}
                className="flex-1 py-3 bg-green-600 rounded-xl items-center"
              >
                <Text className="text-white font-medium">Convert</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={() => onDelete(visitor.$id)}
              className="flex-1 py-3 bg-red-600 rounded-xl items-center"
            >
              <Text className="text-white font-medium">Delete</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

// Visitor Modal Component
const VisitorModal = ({
  visitor,
  isOpen,
  onClose,
  onSave,
  users,
  currentUser,
}: {
  visitor?: Visitor;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: VisitorFormData) => void;
  users: User[];
  currentUser?: any;
}) => {
  const [theme] = useState<Theme>("dark");
  const currentTheme = themeConfigs[theme];
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<VisitorFormData>({
    firstName: "",
    lastName: "",
    email: "",
    contact: "",
    gender: "",
    dateOfBirth: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    nationality: "",
    emergencyContact: "",
    emergencyContactPhone: "",
    visitNotes: "",
    interestArea: "",
    followUpDate: "",
    visitDuration: "",
    referralSource: "walk_in",
    referralNotes: "",
    leadSource: "",
    campaign: "",
    utmSource: "",
    utmMedium: "",
    utmCampaign: "",
    utmTerm: "",
    utmContent: "",
    visitorType: "walk_in",
    priorityScore: "10",
    engagementScore: "0",
    followUpPriority: "medium",
    referredBy: [],
  });
  const [isSaving, setIsSaving] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const steps = [
    { number: 1, title: "Basic Info", description: "Personal details" },
    {
      number: 2,
      title: "Contact & Visit",
      description: "Contact and visit details",
    },
    {
      number: 3,
      title: "Source & Tracking",
      description: "Source information",
    },
  ];

  useEffect(() => {
    if (visitor) {
      setFormData({
        firstName: visitor.firstName || "",
        lastName: visitor.lastName || "",
        email: visitor.email || "",
        contact: visitor.contact || "",
        gender: visitor.gender || "",
        dateOfBirth: visitor.dateOfBirth || "",
        address: visitor.address || "",
        city: visitor.city || "",
        state: visitor.state || "",
        zipCode: visitor.zipCode || "",
        nationality: visitor.nationality || "",
        emergencyContact: visitor.emergencyContact || "",
        emergencyContactPhone: visitor.emergencyContactPhone || "",
        visitNotes: visitor.visitNotes || "",
        interestArea: visitor.interestArea || "",
        followUpDate: visitor.followUpDate || "",
        visitDuration: visitor.visitDuration?.toString() || "",
        referralSource: visitor.referralSource || "walk_in",
        referralNotes: visitor.referralNotes || "",
        leadSource: visitor.leadSource || "",
        campaign: visitor.campaign || "",
        utmSource: visitor.utmSource || "",
        utmMedium: visitor.utmMedium || "",
        utmCampaign: visitor.utmCampaign || "",
        utmTerm: visitor.utmTerm || "",
        utmContent: visitor.utmContent || "",
        visitorType: visitor.visitorType || "walk_in",
        priorityScore: visitor.priorityScore?.toString() || "10",
        engagementScore: visitor.engagementScore?.toString() || "0",
        followUpPriority: visitor.followUpPriority || "medium",
        referredBy: [],
      });
      setCurrentStep(0);
    }
  }, [visitor, isOpen]);

  const handleSubmit = async () => {
    if (currentStep === steps.length - 1) {
      try {
        setIsSaving(true);
        await onSave({
          ...formData,
          referredBy: selectedUsers,
        });
      } catch (error) {
        console.error("Error saving visitor:", error);
      } finally {
        setIsSaving(false);
      }
    } else {
      nextStep();
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleChange = (field: keyof VisitorFormData, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleUserSelection = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <View className="space-y-4">
            <View className="grid grid-cols-2 gap-4">
              <View>
                <Text className={`font-medium ${currentTheme.text} mb-2`}>
                  First Name *
                </Text>
                <TextInput
                  value={formData.firstName}
                  onChangeText={(text) => handleChange("firstName", text)}
                  className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                  placeholder="Enter first name"
                />
              </View>
              <View>
                <Text className={`font-medium ${currentTheme.text} mb-2`}>
                  Last Name *
                </Text>
                <TextInput
                  value={formData.lastName}
                  onChangeText={(text) => handleChange("lastName", text)}
                  className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                  placeholder="Enter last name"
                />
              </View>
            </View>

            <View className="grid grid-cols-2 gap-4">
              <View>
                <Text className={`font-medium ${currentTheme.text} mb-2`}>
                  Email
                </Text>
                <TextInput
                  value={formData.email}
                  onChangeText={(text) => handleChange("email", text)}
                  keyboardType="email-address"
                  className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                  placeholder="Enter email address"
                />
              </View>
              <View>
                <Text className={`font-medium ${currentTheme.text} mb-2`}>
                  Contact Number *
                </Text>
                <TextInput
                  value={formData.contact}
                  onChangeText={(text) => handleChange("contact", text)}
                  keyboardType="phone-pad"
                  className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                  placeholder="Enter phone number"
                />
              </View>
            </View>

            <View className="grid grid-cols-2 gap-4">
              <View>
                <Text className={`font-medium ${currentTheme.text} mb-2`}>
                  Gender
                </Text>
                <View
                  className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.card}`}
                >
                  <TextInput
                    value={formData.gender}
                    onChangeText={(text) => handleChange("gender", text)}
                    placeholder="Select gender"
                  />
                </View>
              </View>
              <View>
                <Text className={`font-medium ${currentTheme.text} mb-2`}>
                  Date of Birth
                </Text>
                <TextInput
                  value={formData.dateOfBirth}
                  onChangeText={(text) => handleChange("dateOfBirth", text)}
                  className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                  placeholder="YYYY-MM-DD"
                />
              </View>
            </View>

            <View>
              <Text className={`font-medium ${currentTheme.text} mb-2`}>
                Nationality
              </Text>
              <TextInput
                value={formData.nationality}
                onChangeText={(text) => handleChange("nationality", text)}
                className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                placeholder="Enter nationality"
              />
            </View>
          </View>
        );

      case 1:
        return (
          <View className="space-y-4">
            <View>
              <Text className={`font-medium ${currentTheme.text} mb-2`}>
                Address
              </Text>
              <TextInput
                value={formData.address}
                onChangeText={(text) => handleChange("address", text)}
                multiline
                className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                placeholder="Enter full address"
              />
            </View>

            <View className="grid grid-cols-3 gap-4">
              <View>
                <Text className={`font-medium ${currentTheme.text} mb-2`}>
                  City
                </Text>
                <TextInput
                  value={formData.city}
                  onChangeText={(text) => handleChange("city", text)}
                  className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                  placeholder="City"
                />
              </View>
              <View>
                <Text className={`font-medium ${currentTheme.text} mb-2`}>
                  State
                </Text>
                <TextInput
                  value={formData.state}
                  onChangeText={(text) => handleChange("state", text)}
                  className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                  placeholder="State"
                />
              </View>
              <View>
                <Text className={`font-medium ${currentTheme.text} mb-2`}>
                  ZIP Code
                </Text>
                <TextInput
                  value={formData.zipCode}
                  onChangeText={(text) => handleChange("zipCode", text)}
                  className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                  placeholder="ZIP Code"
                />
              </View>
            </View>

            <View className="grid grid-cols-2 gap-4">
              <View>
                <Text className={`font-medium ${currentTheme.text} mb-2`}>
                  Emergency Contact
                </Text>
                <TextInput
                  value={formData.emergencyContact}
                  onChangeText={(text) =>
                    handleChange("emergencyContact", text)
                  }
                  className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                  placeholder="Emergency contact name"
                />
              </View>
              <View>
                <Text className={`font-medium ${currentTheme.text} mb-2`}>
                  Emergency Phone
                </Text>
                <TextInput
                  value={formData.emergencyContactPhone}
                  onChangeText={(text) =>
                    handleChange("emergencyContactPhone", text)
                  }
                  keyboardType="phone-pad"
                  className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                  placeholder="Emergency phone"
                />
              </View>
            </View>

            <View>
              <Text className={`font-medium ${currentTheme.text} mb-2`}>
                Interest Area
              </Text>
              <TextInput
                value={formData.interestArea}
                onChangeText={(text) => handleChange("interestArea", text)}
                className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                placeholder="e.g., Engineering, Business, Medicine"
              />
            </View>

            <View className="grid grid-cols-2 gap-4">
              <View>
                <Text className={`font-medium ${currentTheme.text} mb-2`}>
                  Follow-up Date
                </Text>
                <TextInput
                  value={formData.followUpDate}
                  onChangeText={(text) => handleChange("followUpDate", text)}
                  className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                  placeholder="YYYY-MM-DD"
                />
              </View>
              <View>
                <Text className={`font-medium ${currentTheme.text} mb-2`}>
                  Visit Duration (minutes)
                </Text>
                <TextInput
                  value={formData.visitDuration}
                  onChangeText={(text) => handleChange("visitDuration", text)}
                  keyboardType="numeric"
                  className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                  placeholder="e.g., 30"
                />
              </View>
            </View>

            <View>
              <Text className={`font-medium ${currentTheme.text} mb-2`}>
                Visit Notes
              </Text>
              <TextInput
                value={formData.visitNotes}
                onChangeText={(text) => handleChange("visitNotes", text)}
                multiline
                className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                placeholder="Enter any notes about the visit..."
              />
            </View>
          </View>
        );

      case 2:
        return (
          <View className="space-y-4">
            <View className="grid grid-cols-2 gap-4">
              <View>
                <Text className={`font-medium ${currentTheme.text} mb-2`}>
                  Referral Source
                </Text>
                <View
                  className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.card}`}
                >
                  <TextInput
                    value={formData.referralSource}
                    onChangeText={(text) =>
                      handleChange("referralSource", text)
                    }
                    placeholder="walk_in"
                  />
                </View>
              </View>
              <View>
                <Text className={`font-medium ${currentTheme.text} mb-2`}>
                  Visitor Type
                </Text>
                <View
                  className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.card}`}
                >
                  <TextInput
                    value={formData.visitorType}
                    onChangeText={(text) => handleChange("visitorType", text)}
                    placeholder="walk_in"
                  />
                </View>
              </View>
            </View>

            <View>
              <Text className={`font-medium ${currentTheme.text} mb-2`}>
                Referral Notes
              </Text>
              <TextInput
                value={formData.referralNotes}
                onChangeText={(text) => handleChange("referralNotes", text)}
                multiline
                className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                placeholder="Any notes about the referral or lead source"
              />
            </View>

            <View className="grid grid-cols-2 gap-4">
              <View>
                <Text className={`font-medium ${currentTheme.text} mb-2`}>
                  Lead Source
                </Text>
                <TextInput
                  value={formData.leadSource}
                  onChangeText={(text) => handleChange("leadSource", text)}
                  className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                  placeholder="e.g., Google Ad, Facebook Ad"
                />
              </View>
              <View>
                <Text className={`font-medium ${currentTheme.text} mb-2`}>
                  Campaign
                </Text>
                <TextInput
                  value={formData.campaign}
                  onChangeText={(text) => handleChange("campaign", text)}
                  className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                  placeholder="Campaign name"
                />
              </View>
            </View>

            <View className="grid grid-cols-3 gap-4">
              <View>
                <Text className={`font-medium ${currentTheme.text} mb-2`}>
                  Priority Score
                </Text>
                <TextInput
                  value={formData.priorityScore}
                  onChangeText={(text) => handleChange("priorityScore", text)}
                  keyboardType="numeric"
                  className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                  placeholder="1-100"
                />
              </View>
              <View>
                <Text className={`font-medium ${currentTheme.text} mb-2`}>
                  Engagement Score
                </Text>
                <TextInput
                  value={formData.engagementScore}
                  onChangeText={(text) => handleChange("engagementScore", text)}
                  keyboardType="numeric"
                  className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                  placeholder="1-100"
                />
              </View>
              <View>
                <Text className={`font-medium ${currentTheme.text} mb-2`}>
                  Follow-up Priority
                </Text>
                <View
                  className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.card}`}
                >
                  <TextInput
                    value={formData.followUpPriority}
                    onChangeText={(text) =>
                      handleChange("followUpPriority", text)
                    }
                    placeholder="medium"
                  />
                </View>
              </View>
            </View>

            <View>
              <Text className={`font-medium ${currentTheme.text} mb-2`}>
                Referred By Users
              </Text>
              <ScrollView className="max-h-32 border rounded-lg p-2 bg-gray-100 dark:bg-gray-800">
                {users.length === 0 ? (
                  <Text className="text-sm text-center p-2 text-gray-500">
                    No users available
                  </Text>
                ) : (
                  users.map((user) => (
                    <TouchableOpacity
                      key={user.$id}
                      onPress={() => handleUserSelection(user.$id)}
                      className={`p-2 rounded-lg ${selectedUsers.includes(user.$id) ? "bg-blue-100 dark:bg-blue-500/20" : ""}`}
                    >
                      <View className="flex-row items-center gap-3">
                        <View
                          className={`w-4 h-4 rounded-full border ${selectedUsers.includes(user.$id) ? "bg-blue-600 border-blue-600" : "border-gray-400"} items-center justify-center`}
                        >
                          {selectedUsers.includes(user.$id) && (
                            <Check size={10} color="white" />
                          )}
                        </View>
                        <View className="flex-1">
                          <Text className={`font-medium ${currentTheme.text}`}>
                            {user.name || user.email}
                          </Text>
                          {user.name && user.email && (
                            <Text
                              className={`text-xs ${currentTheme.textMuted}`}
                            >
                              {user.email}
                            </Text>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <Modal visible={isOpen} animationType="slide" transparent={true}>
      <View className="flex-1 bg-black/50 justify-end">
        <Animated.View
          entering={SlideInDown.duration(300)}
          exiting={SlideOutDown.duration(200)}
          className={`${currentTheme.card} rounded-t-3xl p-6 max-h-[85vh]`}
        >
          <View className="flex-row justify-between items-center mb-6">
            <View>
              <Text className={`text-xl font-bold ${currentTheme.text}`}>
                {visitor ? "Edit Visitor" : "Add New Visitor"}
              </Text>
              <Text className={`text-sm ${currentTheme.textMuted} mt-1`}>
                Step {currentStep + 1} of {steps.length}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={currentTheme.text} />
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-between mb-6">
            {steps.map((step, index) => (
              <View key={index} className="items-center">
                <View
                  className={`w-8 h-8 rounded-full items-center justify-center ${
                    index < currentStep
                      ? "bg-green-500"
                      : index === currentStep
                        ? "bg-blue-600"
                        : "bg-gray-300 dark:bg-gray-700"
                  }`}
                >
                  {index < currentStep ? (
                    <Check size={16} color="white" />
                  ) : (
                    <Text
                      className={`text-sm font-medium ${
                        index === currentStep ? "text-white" : currentTheme.text
                      }`}
                    >
                      {index + 1}
                    </Text>
                  )}
                </View>
                <Text
                  className={`text-xs mt-2 ${index === currentStep ? "text-blue-600 dark:text-blue-400 font-medium" : currentTheme.textMuted}`}
                >
                  {step.title}
                </Text>
              </View>
            ))}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="max-h-96">
            {renderStepContent()}
          </ScrollView>

          <View className="flex-row gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <TouchableOpacity
              onPress={prevStep}
              disabled={currentStep === 0}
              className={`flex-1 py-3 rounded-xl border ${currentTheme.border} items-center ${
                currentStep === 0 ? "opacity-50" : ""
              }`}
            >
              <Text className={currentTheme.text}>Previous</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSaving}
              className="flex-1 bg-blue-600 py-3 rounded-xl items-center"
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-white font-medium">
                  {currentStep === steps.length - 1
                    ? visitor
                      ? "Update Visitor"
                      : "Create Visitor"
                    : "Next"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

// ConvertToStudentModal Component
const ConvertToStudentModal = ({
  visitor,
  isOpen,
  onClose,
  onSave,
  currentUser,
}: {
  visitor?: Visitor;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ConvertToStudentFormData) => void;
  currentUser?: any;
}) => {
  const [theme] = useState<Theme>("dark");
  const currentTheme = themeConfigs[theme];
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<ConvertToStudentFormData>({
    firstName: "",
    lastName: "",
    email: "",
    contact: "",
    gender: "",
    dateOfBirth: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    nationality: "",
    emergencyContact: "",
    emergencyContactPhone: "",
    lastDegree: "",
    degreeGPA: "",
    highSchoolGPA: "",
    plusTwoGPA: "",
    currentInstitution: "",
    currentCourse: "",
    graduationYear: "",
    academicQualification: "",
    testScores: "",
    achievements: "",
    extracurricularActivities: "",
    workExperience: "",
    intendedStartDate: "",
    englishProficiency: "",
    previousEducation: "",
    assignedTo: [],
    branches: "",
    status: "new",
    leadStatus: "new",
    notes: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const steps = [
    {
      number: 1,
      title: "Confirm Conversion",
      description: "Review visitor details",
    },
    {
      number: 2,
      title: "Academic Info",
      description: "Education history & GPA",
    },
    {
      number: 3,
      title: "Study Preferences",
      description: "Target study & timeline",
    },
    { number: 4, title: "Assignment", description: "Assign to team & branch" },
    { number: 5, title: "Confirmation", description: "Complete conversion" },
  ];

  useEffect(() => {
    if (visitor) {
      setFormData({
        firstName: visitor.firstName || "",
        lastName: visitor.lastName || "",
        email: visitor.email || "",
        contact: visitor.contact || "",
        gender: visitor.gender || "",
        dateOfBirth: visitor.dateOfBirth || "",
        address: visitor.address || "",
        city: visitor.city || "",
        state: visitor.state || "",
        zipCode: visitor.zipCode || "",
        nationality: visitor.nationality || "",
        emergencyContact: visitor.emergencyContact || "",
        emergencyContactPhone: visitor.emergencyContactPhone || "",
        lastDegree: "",
        degreeGPA: "",
        highSchoolGPA: "",
        plusTwoGPA: "",
        currentInstitution: "",
        currentCourse: "",
        graduationYear: "",
        academicQualification: "",
        testScores: "",
        achievements: "",
        extracurricularActivities: "",
        workExperience: "",
        intendedStartDate: "",
        englishProficiency: "",
        previousEducation: visitor.interestArea || "",
        assignedTo: currentUser?.$id ? [currentUser.$id] : [],
        branches: visitor.branches || currentUser?.branches || "",
        status: "new",
        leadStatus: "new",
        notes: `Converted from visitor on ${new Date().toLocaleDateString()}. Previous interest: ${visitor.interestArea || "Not specified"}. Referral source: ${visitor.referralSource || "walk_in"}`,
      });
      setSelectedUsers(currentUser?.$id ? [currentUser.$id] : []);
      setCurrentStep(0);
    }

    // Fetch available users and branches
    fetchUsers();
    fetchBranches();
  }, [visitor, isOpen, currentUser]);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/dashboard/users`);
      const result = await response.json();
      if (result.success) {
        setAvailableUsers(result.data || []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await fetch(`${API_URL}/dashboard/branches`);
      const result = await response.json();
      if (result.success) {
        setBranches(result.data || []);
      }
    } catch (error) {
      console.error("Error fetching branches:", error);
    }
  };

  const handleSubmit = async () => {
    if (currentStep === steps.length - 1) {
      try {
        setIsSaving(true);
        await onSave({
          ...formData,
          assignedTo: selectedUsers,
        });
      } catch (error) {
        console.error("Error converting to student:", error);
      } finally {
        setIsSaving(false);
      }
    } else {
      nextStep();
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleChange = (
    field: keyof ConvertToStudentFormData,
    value: string,
  ) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleUserSelection = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <View className="space-y-4">
            <View className="p-4 bg-blue-100 dark:bg-blue-500/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <View className="flex-row items-center gap-3 text-blue-800 dark:text-blue-400 mb-2">
                <UserCheck size={20} color="currentColor" />
                <Text className="text-lg font-semibold">
                  Convert Visitor to Student
                </Text>
              </View>
              <Text className="text-sm text-blue-700 dark:text-blue-300">
                You are about to convert{" "}
                <Text className="font-bold">
                  {visitor?.firstName} {visitor?.lastName}
                </Text>{" "}
                from a visitor to a student. This will move them to the student
                management system with full academic tracking.
              </Text>
            </View>

            <View className="space-y-3">
              <Text className={`font-medium ${currentTheme.text}`}>
                Visitor Information:
              </Text>
              <View className="grid grid-cols-2 gap-4">
                <View>
                  <Text className={`text-xs ${currentTheme.textMuted}`}>
                    Name:
                  </Text>
                  <Text className={`font-medium ${currentTheme.text}`}>
                    {visitor?.firstName} {visitor?.lastName}
                  </Text>
                </View>
                <View>
                  <Text className={`text-xs ${currentTheme.textMuted}`}>
                    Contact:
                  </Text>
                  <Text className={`font-medium ${currentTheme.text}`}>
                    {visitor?.contact}
                  </Text>
                </View>
                <View>
                  <Text className={`text-xs ${currentTheme.textMuted}`}>
                    Email:
                  </Text>
                  <Text className={`font-medium ${currentTheme.text}`}>
                    {visitor?.email || "Not provided"}
                  </Text>
                </View>
                <View>
                  <Text className={`text-xs ${currentTheme.textMuted}`}>
                    Interest Area:
                  </Text>
                  <Text className={`font-medium ${currentTheme.text}`}>
                    {visitor?.interestArea || "Not specified"}
                  </Text>
                </View>
                <View>
                  <Text className={`text-xs ${currentTheme.textMuted}`}>
                    Total Visits:
                  </Text>
                  <Text className={`font-medium ${currentTheme.text}`}>
                    {visitor?.totalVisits || 1}
                  </Text>
                </View>
                <View>
                  <Text className={`text-xs ${currentTheme.textMuted}`}>
                    Referral Source:
                  </Text>
                  <Text
                    className={`font-medium ${currentTheme.text} capitalize`}
                  >
                    {visitor?.referralSource || "walk_in"}
                  </Text>
                </View>
              </View>
            </View>

            <View className="p-3 bg-yellow-100 dark:bg-yellow-500/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <View className="flex-row items-start gap-2">
                <AlertCircle
                  size={16}
                  color="#f59e0b"
                  style={{ marginTop: 2 }}
                />
                <Text className="text-sm text-yellow-700 dark:text-yellow-400 flex-1">
                  After conversion, you will need to collect academic
                  information and assign the student to appropriate staff
                  members.
                </Text>
              </View>
            </View>
          </View>
        );

      case 1:
        return (
          <View className="space-y-4">
            <Text className={`text-lg font-bold ${currentTheme.text} mb-4`}>
              Academic Information
            </Text>

            <View className="grid grid-cols-2 gap-4">
              <View>
                <Text className={`font-medium ${currentTheme.text} mb-2`}>
                  Highest Degree Completed
                </Text>
                <TextInput
                  value={formData.lastDegree}
                  onChangeText={(text) => handleChange("lastDegree", text)}
                  className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                  placeholder="e.g., Bachelor's Degree"
                />
              </View>

              <View>
                <Text className={`font-medium ${currentTheme.text} mb-2`}>
                  Current Institution
                </Text>
                <TextInput
                  value={formData.currentInstitution}
                  onChangeText={(text) =>
                    handleChange("currentInstitution", text)
                  }
                  className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                  placeholder="Current school/college"
                />
              </View>
            </View>

            <View className="grid grid-cols-3 gap-4">
              <View>
                <Text className={`font-medium ${currentTheme.text} mb-2`}>
                  +2 GPA
                </Text>
                <TextInput
                  value={formData.plusTwoGPA}
                  onChangeText={(text) => handleChange("plusTwoGPA", text)}
                  keyboardType="numeric"
                  className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                  placeholder="e.g., 3.5"
                />
              </View>

              <View>
                <Text className={`font-medium ${currentTheme.text} mb-2`}>
                  Bachelor's GPA
                </Text>
                <TextInput
                  value={formData.degreeGPA}
                  onChangeText={(text) => handleChange("degreeGPA", text)}
                  keyboardType="numeric"
                  className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                  placeholder="e.g., 3.2"
                />
              </View>

              <View>
                <Text className={`font-medium ${currentTheme.text} mb-2`}>
                  Graduation Year
                </Text>
                <TextInput
                  value={formData.graduationYear}
                  onChangeText={(text) => handleChange("graduationYear", text)}
                  keyboardType="numeric"
                  className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                  placeholder="e.g., 2023"
                />
              </View>
            </View>

            <View>
              <Text className={`font-medium ${currentTheme.text} mb-2`}>
                Academic Qualification Details
              </Text>
              <TextInput
                value={formData.academicQualification}
                onChangeText={(text) =>
                  handleChange("academicQualification", text)
                }
                multiline
                className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                placeholder="Detailed description of academic background"
              />
            </View>

            <View className="grid grid-cols-2 gap-4">
              <View>
                <Text className={`font-medium ${currentTheme.text} mb-2`}>
                  Test Scores (JSON)
                </Text>
                <TextInput
                  value={formData.testScores}
                  onChangeText={(text) => handleChange("testScores", text)}
                  multiline
                  className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                  placeholder='{"IELTS": 7.5, "TOEFL": 100}'
                />
              </View>

              <View>
                <Text className={`font-medium ${currentTheme.text} mb-2`}>
                  Work Experience
                </Text>
                <TextInput
                  value={formData.workExperience}
                  onChangeText={(text) => handleChange("workExperience", text)}
                  multiline
                  className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                  placeholder="Work experience details"
                />
              </View>
            </View>
          </View>
        );

      case 2:
        return (
          <View className="space-y-4">
            <Text className={`text-lg font-bold ${currentTheme.text} mb-4`}>
              Study Preferences
            </Text>

            <View className="grid grid-cols-2 gap-4">
              <View>
                <Text className={`font-medium ${currentTheme.text} mb-2`}>
                  Intended Start Date *
                </Text>
                <TextInput
                  value={formData.intendedStartDate}
                  onChangeText={(text) =>
                    handleChange("intendedStartDate", text)
                  }
                  className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                  placeholder="YYYY-MM-DD"
                />
              </View>

              <View>
                <Text className={`font-medium ${currentTheme.text} mb-2`}>
                  English Proficiency
                </Text>
                <TextInput
                  value={formData.englishProficiency}
                  onChangeText={(text) =>
                    handleChange("englishProficiency", text)
                  }
                  className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                  placeholder="e.g., Intermediate"
                />
              </View>
            </View>

            <View>
              <Text className={`font-medium ${currentTheme.text} mb-2`}>
                Previous Education/Experience
              </Text>
              <TextInput
                value={formData.previousEducation}
                onChangeText={(text) => handleChange("previousEducation", text)}
                multiline
                className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                placeholder="Describe previous education"
              />
            </View>

            <View className="grid grid-cols-2 gap-4">
              <View>
                <Text className={`font-medium ${currentTheme.text} mb-2`}>
                  Achievements & Awards
                </Text>
                <TextInput
                  value={formData.achievements}
                  onChangeText={(text) => handleChange("achievements", text)}
                  multiline
                  className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                  placeholder="Scholarships, awards"
                />
              </View>

              <View>
                <Text className={`font-medium ${currentTheme.text} mb-2`}>
                  Extracurricular Activities
                </Text>
                <TextInput
                  value={formData.extracurricularActivities}
                  onChangeText={(text) =>
                    handleChange("extracurricularActivities", text)
                  }
                  multiline
                  className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                  placeholder="Clubs, sports, volunteer work"
                />
              </View>
            </View>
          </View>
        );

      case 3:
        return (
          <View className="space-y-4">
            <Text className={`text-lg font-bold ${currentTheme.text} mb-4`}>
              Assignment & Branch
            </Text>

            <View>
              <Text className={`font-medium ${currentTheme.text} mb-2`}>
                Branch {currentUser?.role === "superAdmin" && "*"}
              </Text>
              <TextInput
                value={formData.branches}
                onChangeText={(text) => handleChange("branches", text)}
                className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                placeholder="Select branch"
              />
            </View>

            <View>
              <Text className={`font-medium ${currentTheme.text} mb-2`}>
                Assign To Users *
              </Text>
              <ScrollView className="max-h-32 border rounded-lg p-2 bg-gray-100 dark:bg-gray-800">
                {availableUsers.length === 0 ? (
                  <Text className="text-sm text-center p-2 text-gray-500">
                    No users available
                  </Text>
                ) : (
                  availableUsers.map((user) => (
                    <TouchableOpacity
                      key={user.$id}
                      onPress={() => handleUserSelection(user.$id)}
                      className={`p-2 rounded-lg ${selectedUsers.includes(user.$id) ? "bg-blue-100 dark:bg-blue-500/20" : ""}`}
                    >
                      <View className="flex-row items-center gap-3">
                        <View
                          className={`w-4 h-4 rounded-full border ${selectedUsers.includes(user.$id) ? "bg-blue-600 border-blue-600" : "border-gray-400"} items-center justify-center`}
                        >
                          {selectedUsers.includes(user.$id) && (
                            <Check size={10} color="white" />
                          )}
                        </View>
                        <View className="flex-1">
                          <Text className={`font-medium ${currentTheme.text}`}>
                            {user.name || user.email}
                          </Text>
                          {user.name && user.email && (
                            <Text
                              className={`text-xs ${currentTheme.textMuted}`}
                            >
                              {user.email}
                            </Text>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>

            <View>
              <Text className={`font-medium ${currentTheme.text} mb-2`}>
                Conversion Notes
              </Text>
              <TextInput
                value={formData.notes}
                onChangeText={(text) => handleChange("notes", text)}
                multiline
                className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                placeholder="Add any notes about this conversion..."
              />
            </View>
          </View>
        );

      case 4:
        return (
          <View className="space-y-4">
            <View className="p-4 bg-green-100 dark:bg-green-500/20 rounded-lg border border-green-200 dark:border-green-800 items-center">
              <View className="w-12 h-12 bg-green-200 dark:bg-green-800 rounded-full items-center justify-center mb-4">
                <Check size={24} color="#10b981" />
              </View>
              <Text className="text-lg font-semibold text-green-800 dark:text-green-400 mb-2">
                Ready to Convert!
              </Text>
              <Text className="text-sm text-green-700 dark:text-green-400 text-center">
                {visitor?.firstName} {visitor?.lastName} will be converted to a
                student.
              </Text>
            </View>

            <View className="space-y-3">
              <View className="flex-row justify-between">
                <Text className={`font-medium ${currentTheme.text}`}>
                  Type:
                </Text>
                <Text className={`font-medium ${currentTheme.text}`}>
                  Student
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className={`font-medium ${currentTheme.text}`}>
                  Status:
                </Text>
                <View className="px-2 py-1 bg-blue-100 dark:bg-blue-800 rounded-full">
                  <Text className="text-xs text-blue-800 dark:text-blue-400 font-medium">
                    {formData.status}
                  </Text>
                </View>
              </View>
              <View className="flex-row justify-between">
                <Text className={`font-medium ${currentTheme.text}`}>
                  Assigned to:
                </Text>
                <Text className={`font-medium ${currentTheme.text}`}>
                  {selectedUsers.length} user(s)
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className={`font-medium ${currentTheme.text}`}>
                  Conversion Date:
                </Text>
                <Text className={`font-medium ${currentTheme.text}`}>
                  {new Date().toLocaleDateString()}
                </Text>
              </View>
            </View>

            <View className="p-3 bg-yellow-100 dark:bg-yellow-500/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <View className="flex-row items-start gap-2">
                <AlertCircle
                  size={16}
                  color="#f59e0b"
                  style={{ marginTop: 2 }}
                />
                <Text className="text-sm text-yellow-700 dark:text-yellow-400 flex-1">
                  After conversion, the visitor will appear in the Students
                  section. All visitor history will be preserved.
                </Text>
              </View>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  if (!isOpen || !visitor) return null;

  return (
    <Modal visible={isOpen} animationType="slide" transparent={true}>
      <View className="flex-1 bg-black/50 justify-end">
        <Animated.View
          entering={SlideInDown.duration(300)}
          exiting={SlideOutDown.duration(200)}
          className={`${currentTheme.card} rounded-t-3xl p-6 max-h-[85vh]`}
        >
          <View className="flex-row justify-between items-center mb-6">
            <View>
              <Text className={`text-xl font-bold ${currentTheme.text}`}>
                Convert to Student
              </Text>
              <Text className={`text-sm ${currentTheme.textMuted} mt-1`}>
                Step {currentStep + 1} of {steps.length}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={currentTheme.text} />
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-between mb-6">
            {steps.map((step, index) => (
              <View key={index} className="items-center">
                <View
                  className={`w-8 h-8 rounded-full items-center justify-center ${
                    index < currentStep
                      ? "bg-green-500"
                      : index === currentStep
                        ? "bg-blue-600"
                        : "bg-gray-300 dark:bg-gray-700"
                  }`}
                >
                  {index < currentStep ? (
                    <Check size={16} color="white" />
                  ) : (
                    <Text
                      className={`text-sm font-medium ${
                        index === currentStep ? "text-white" : currentTheme.text
                      }`}
                    >
                      {index + 1}
                    </Text>
                  )}
                </View>
                <Text
                  className={`text-xs mt-2 ${index === currentStep ? "text-blue-600 dark:text-blue-400 font-medium" : currentTheme.textMuted}`}
                >
                  {step.title}
                </Text>
              </View>
            ))}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="max-h-96">
            {renderStepContent()}
          </ScrollView>

          <View className="flex-row gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <TouchableOpacity
              onPress={prevStep}
              disabled={currentStep === 0}
              className={`flex-1 py-3 rounded-xl border ${currentTheme.border} items-center ${
                currentStep === 0 ? "opacity-50" : ""
              }`}
            >
              <Text className={currentTheme.text}>Previous</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSaving}
              className="flex-1 bg-green-600 py-3 rounded-xl items-center"
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-white font-medium">
                  {currentStep === steps.length - 1
                    ? "Convert to Student"
                    : "Next"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

// ============ MAIN PAGE COMPONENT ============
export default function VisitorsPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVisitors, setSelectedVisitors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [theme, setTheme] = useState<Theme>("dark");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info" | "warning";
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [editingVisitor, setEditingVisitor] = useState<Visitor | undefined>();
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedVisitorDetail, setSelectedVisitorDetail] =
    useState<Visitor | null>(null);
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [referralFilter, setReferralFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [conversionFilter, setConversionFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [isCreatingVisitor, setIsCreatingVisitor] = useState(false);
  const [isConvertingVisitor, setIsConvertingVisitor] = useState(false);
  const [isDeletingVisitor, setIsDeletingVisitor] = useState(false);

  const router = useRouter();
  const currentTheme = themeConfigs[theme];
  const flatListRef = useRef<FlatList>(null);

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

  const fetchVisitors = async (isBackgroundUpdate = false) => {
    try {
      if (!isBackgroundUpdate) {
        setLoading(true);
      }

      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (dateFilter !== "all") {
        const today = new Date();
        let startDate = new Date();

        switch (dateFilter) {
          case "today":
            startDate.setHours(0, 0, 0, 0);
            break;
          case "week":
            startDate.setDate(today.getDate() - 7);
            break;
          case "month":
            startDate.setMonth(today.getMonth() - 1);
            break;
        }

        params.append("startDate", startDate.toISOString());
      }

      if (referralFilter !== "all") {
        params.append("referralSource", referralFilter);
      }
      if (priorityFilter !== "all") {
        params.append("followUpPriority", priorityFilter);
      }
      if (conversionFilter !== "all") {
        params.append(
          "hasInterestArea",
          conversionFilter === "high" ? "true" : "false",
        );
      }

      const cacheKey = `visitors:${searchQuery}:${dateFilter}:${referralFilter}:${priorityFilter}:${conversionFilter}`;
      const url = `/dashboard/visitors${params.toString() ? `?${params.toString()}` : ""}`;

      const visitorsData = await cachedFetch<Visitor[]>(
        url,
        cacheKey,
        2 * 60 * 1000,
      );
      setVisitors(visitorsData || []);
      setSelectedVisitors([]);
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

  const fetchUsers = async () => {
    try {
      const usersData = await cachedFetch<User[]>(
        "/dashboard/users",
        "users",
        10 * 60 * 1000,
      );
      setUsers(usersData || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/current`);
      const result = await response.json();
      if (result.success) {
        setCurrentUser(result.user);
      }
    } catch (error) {
      console.error("Error fetching current user:", error);
    }
  };

  const fetchEssentialData = useCallback(async () => {
    await Promise.all([fetchVisitors(false), fetchUsers()]);
  }, [
    searchQuery,
    dateFilter,
    referralFilter,
    priorityFilter,
    conversionFilter,
  ]);

  useEffect(() => {
    fetchCurrentUser();
    fetchEssentialData();
  }, []);

  useEffect(() => {
    fetchVisitors();
  }, [
    searchQuery,
    dateFilter,
    referralFilter,
    priorityFilter,
    conversionFilter,
  ]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    showToast("Refreshing visitors...", "info");
    cacheManager.delete("visitors");
    fetchVisitors();
  }, [fetchVisitors]);

  const handleSelectAll = () => {
    if (selectedVisitors.length === filteredVisitors.length) {
      setSelectedVisitors([]);
    } else {
      setSelectedVisitors(filteredVisitors.map((v) => v.$id));
    }
  };

  const handleSelectVisitor = (visitorId: string) => {
    if (selectedVisitors.includes(visitorId)) {
      setSelectedVisitors(selectedVisitors.filter((id) => id !== visitorId));
    } else {
      setSelectedVisitors([...selectedVisitors, visitorId]);
    }
  };

  const handleCreateVisitor = () => {
    setEditingVisitor(undefined);
    setIsModalOpen(true);
  };

  const handleEditVisitor = (visitor: Visitor) => {
    setEditingVisitor(visitor);
    setIsModalOpen(true);
  };

  const handleConvertToStudent = (visitor: Visitor) => {
    setEditingVisitor(visitor);
    setIsConvertModalOpen(true);
  };

  const handleSaveVisitor = async (formData: VisitorFormData) => {
    try {
      setIsCreatingVisitor(true);

      const url = editingVisitor
        ? `${API_URL}/dashboard/visitors`
        : `${API_URL}/dashboard/visitors`;

      const method = editingVisitor ? "PATCH" : "POST";

      const requestData = editingVisitor
        ? { visitorId: editingVisitor.$id, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (result.success) {
        showToast(
          editingVisitor
            ? "Visitor updated successfully"
            : "Visitor created successfully",
          "success",
        );
        setIsModalOpen(false);
        setEditingVisitor(undefined);
        cacheManager.delete("visitors");
        fetchEssentialData();
      } else {
        showToast(result.error || "Failed to save visitor", "error");
      }
    } catch (error) {
      console.error("Error saving visitor:", error);
      showToast("Error saving visitor", "error");
    } finally {
      setIsCreatingVisitor(false);
    }
  };

  const handleConvertToStudentSave = async (
    formData: ConvertToStudentFormData,
  ) => {
    if (!editingVisitor) return;

    try {
      setIsConvertingVisitor(true);

      const response = await fetch(`${API_URL}/dashboard/visitors`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          visitorId: editingVisitor.$id,
          convertToStudent: true,
          ...formData,
        }),
      });

      const result = await response.json();

      if (result.success) {
        showToast("Visitor converted to student successfully", "success");
        setIsConvertModalOpen(false);
        setEditingVisitor(undefined);
        cacheManager.delete("visitors");
        fetchEssentialData();
      } else {
        showToast(result.error || "Failed to convert visitor", "error");
      }
    } catch (error) {
      console.error("Error converting visitor:", error);
      showToast("Error converting visitor", "error");
    } finally {
      setIsConvertingVisitor(false);
    }
  };

  const handleDeleteVisitor = async (visitorId: string) => {
    Alert.alert(
      "Delete Visitor",
      "Are you sure you want to delete this visitor? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => performDelete(visitorId),
        },
      ],
    );
  };

  const performDelete = async (visitorId: string) => {
    try {
      setIsDeletingVisitor(true);
      const response = await fetch(
        `${API_URL}/dashboard/visitors?id=${visitorId}`,
        {
          method: "DELETE",
        },
      );

      const result = await response.json();

      if (result.success) {
        showToast("Visitor deleted successfully", "success");
        cacheManager.delete("visitors");
        fetchEssentialData();
        setDetailModalOpen(false);
        setSelectedVisitorDetail(null);
      } else {
        showToast(result.error || "Failed to delete visitor", "error");
      }
    } catch (error) {
      console.error("Error deleting visitor:", error);
      showToast("Error deleting visitor", "error");
    } finally {
      setIsDeletingVisitor(false);
    }
  };

  const openDetailModal = (visitor: Visitor) => {
    setSelectedVisitorDetail(visitor);
    setDetailModalOpen(true);
  };

  const handleVisitorPress = (visitor: Visitor) => {
    openDetailModal(visitor);
  };

  const handleVisitorMorePress = (visitor: Visitor) => {
    Alert.alert("Visitor Actions", "Choose an action", [
      { text: "View Details", onPress: () => openDetailModal(visitor) },
      { text: "Edit", onPress: () => handleEditVisitor(visitor) },
      {
        text: "Convert to Student",
        onPress: () => handleConvertToStudent(visitor),
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => handleDeleteVisitor(visitor.$id),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  // Calculate statistics
  const totalVisitors = visitors.length;
  const todaysVisitors = visitors.filter((v) => {
    const visitDate = new Date(v.$createdAt);
    const today = new Date();
    return visitDate.toDateString() === today.toDateString();
  }).length;
  const needsFollowUp = visitors.filter(
    (v) => v.analytics?.followUpRequired,
  ).length;
  const readyForConversion = visitors.filter(
    (v) => v.conversionReadiness?.readyForConversion,
  ).length;
  const highPriorityVisitors = visitors.filter(
    (v) => v.followUpPriority === "high" || v.followUpPriority === "urgent",
  ).length;

  const stats = [
    {
      icon: Users,
      label: "Total Visitors",
      value: totalVisitors.toString(),
      color: "bg-blue-500",
    },
    {
      icon: Calendar,
      label: "Today's Visitors",
      value: todaysVisitors.toString(),
      color: "bg-green-500",
    },
    {
      icon: Clock,
      label: "Needs Follow-up",
      value: needsFollowUp.toString(),
      color: "bg-yellow-500",
    },
    {
      icon: TrendingUp,
      label: "Ready for Conversion",
      value: readyForConversion.toString(),
      color: "bg-purple-500",
    },
    {
      icon: AlertCircle,
      label: "High Priority",
      value: highPriorityVisitors.toString(),
      color: "bg-red-500",
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
    { value: "facebook", label: "Facebook" },
    { value: "instagram", label: "Instagram" },
    { value: "event", label: "Event" },
    { value: "other", label: "Other" },
  ];

  const priorityFilters = [
    { value: "all", label: "All Priorities" },
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "urgent", label: "Urgent" },
  ];

  const conversionFilters = [
    { value: "all", label: "All" },
    { value: "low", label: "Low Potential" },
    { value: "medium", label: "Medium Potential" },
    { value: "high", label: "High Potential" },
  ];

  const filteredVisitors = useMemo(() => {
    return visitors.filter((visitor) => {
      if (!searchQuery) return true;

      const searchLower = searchQuery.toLowerCase();
      return (
        visitor.firstName.toLowerCase().includes(searchLower) ||
        visitor.lastName.toLowerCase().includes(searchLower) ||
        (visitor.email && visitor.email.toLowerCase().includes(searchLower)) ||
        (visitor.contact &&
          visitor.contact.toLowerCase().includes(searchLower)) ||
        (visitor.interestArea &&
          visitor.interestArea.toLowerCase().includes(searchLower))
      );
    });
  }, [visitors, searchQuery]);

  const StatsCard = ({ icon: Icon, title, value, color }: any) => (
    <View
      className={`${currentTheme.card} rounded-lg p-4 ${currentTheme.border}`}
      style={{ width: (width - 40) / 2.5 }}
    >
      <View className="flex-row items-center justify-between">
        <View>
          <Text className={`text-2xl font-bold ${currentTheme.text}`}>
            {value}
          </Text>
          <Text
            className={`text-xs ${currentTheme.textMuted}`}
            numberOfLines={2}
          >
            {title}
          </Text>
        </View>
        <View
          className={`w-10 h-10 rounded-lg ${color} items-center justify-center`}
        >
          <Icon size={20} color="white" />
        </View>
      </View>
    </View>
  );

  if (loading && visitors.length === 0) {
    return (
      <SafeAreaView
        className={`flex-1 ${currentTheme.background} items-center justify-center`}
      >
        <ActivityIndicator size="large" color={currentTheme.primary} />
        <Text className={`mt-4 ${currentTheme.text}`}>Loading visitors...</Text>
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
                  : toast.type === "warning"
                    ? ["#f59e0b", "#d97706"]
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
        <View className="flex-row justify-between items-center mb-4">
          <View>
            <Text className={`text-2xl font-bold ${currentTheme.text}`}>
              Visitors Management
            </Text>
            <Text className={`text-sm ${currentTheme.textMuted} mt-1`}>
              Manage your organization visitors
            </Text>
          </View>

          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={onRefresh}
              className="p-2.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <RefreshCw size={20} color={currentTheme.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowFilters(!showFilters)}
              className="p-2.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <Filter size={20} color={currentTheme.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleCreateVisitor}
              className="flex-row items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg"
            >
              <UserPlus size={20} color="white" />
              <Text className="text-white font-medium">Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View className="relative mb-4">
          <Search
            size={20}
            color={currentTheme.textMuted}
            style={{ position: "absolute", left: 12, top: 12, zIndex: 10 }}
          />
          <TextInput
            placeholder="Search visitors..."
            placeholderTextColor={currentTheme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            className={`pl-10 pr-4 py-3 ${currentTheme.card} rounded-xl border ${currentTheme.border} ${currentTheme.text}`}
          />
        </View>

        {/* Bulk Selection Info */}
        {selectedVisitors.length > 0 && (
          <Animated.View
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(200)}
            className="mb-4 p-4 bg-blue-100 dark:bg-blue-500/20 rounded-xl border border-blue-200 dark:border-blue-800"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <View className="w-8 h-8 rounded-full bg-blue-600 items-center justify-center">
                  <Check size={16} color="white" />
                </View>
                <View>
                  <Text className={`font-medium ${currentTheme.text}`}>
                    {selectedVisitors.length} visitor
                    {selectedVisitors.length !== 1 ? "s" : ""} selected
                  </Text>
                  <TouchableOpacity onPress={() => setSelectedVisitors([])}>
                    <Text className="text-sm text-blue-600 dark:text-blue-400">
                      Clear selection
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => {
                  Alert.alert(
                    "Delete Multiple Visitors",
                    `Are you sure you want to delete ${selectedVisitors.length} selected visitor(s)?`,
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Delete",
                        style: "destructive",
                        onPress: () => {
                          // Implement bulk delete
                          showToast("Bulk delete not implemented", "warning");
                        },
                      },
                    ],
                  );
                }}
                className="flex-row items-center gap-2 px-4 py-2 bg-red-600 rounded-lg"
              >
                <Trash2 size={16} color="white" />
                <Text className="text-white font-medium">Delete</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* Filters */}
        {showFilters && (
          <Animated.View
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(200)}
            className="mb-4"
          >
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                {dateFilters.map((filter) => (
                  <TouchableOpacity
                    key={filter.value}
                    onPress={() => setDateFilter(filter.value)}
                    className={`px-3 py-1.5 rounded-lg ${
                      dateFilter === filter.value
                        ? "bg-blue-600"
                        : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    <Text
                      className={
                        dateFilter === filter.value
                          ? "text-white"
                          : currentTheme.text
                      }
                    >
                      {filter.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View className="mt-3 space-y-3">
              <View>
                <Text className={`font-medium ${currentTheme.text} mb-2`}>
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
                            : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                        }`}
                      >
                        <Text
                          className={
                            referralFilter === source.value
                              ? "text-white"
                              : currentTheme.text
                          }
                        >
                          {source.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View>
                <Text className={`font-medium ${currentTheme.text} mb-2`}>
                  Priority Level
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-2">
                    {priorityFilters.map((priority) => (
                      <TouchableOpacity
                        key={priority.value}
                        onPress={() => setPriorityFilter(priority.value)}
                        className={`px-3 py-1.5 rounded-lg ${
                          priorityFilter === priority.value
                            ? "bg-blue-600"
                            : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                        }`}
                      >
                        <Text
                          className={
                            priorityFilter === priority.value
                              ? "text-white"
                              : currentTheme.text
                          }
                        >
                          {priority.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View>
                <Text className={`font-medium ${currentTheme.text} mb-2`}>
                  Conversion Potential
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-2">
                    {conversionFilters.map((filter) => (
                      <TouchableOpacity
                        key={filter.value}
                        onPress={() => setConversionFilter(filter.value)}
                        className={`px-3 py-1.5 rounded-lg ${
                          conversionFilter === filter.value
                            ? "bg-blue-600"
                            : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                        }`}
                      >
                        <Text
                          className={
                            conversionFilter === filter.value
                              ? "text-white"
                              : currentTheme.text
                          }
                        >
                          {filter.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>
          </Animated.View>
        )}
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

      {/* Visitors List */}
      <FlatList
        ref={flatListRef}
        data={filteredVisitors}
        numColumns={2}
        keyExtractor={(item) => item.$id}
        renderItem={({ item }) => (
          <VisitorCard
            visitor={item}
            isSelected={selectedVisitors.includes(item.$id)}
            onSelect={() => handleSelectVisitor(item.$id)}
            onPress={() => handleVisitorPress(item)}
            onMorePress={() => handleVisitorMorePress(item)}
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
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20">
            <Users size={48} color={currentTheme.textMuted} />
            <Text className={`text-lg font-medium mt-4 ${currentTheme.text}`}>
              {searchQuery ? "No matching visitors found" : "No visitors yet"}
            </Text>
            <Text
              className={`text-sm ${currentTheme.textMuted} mt-2 text-center`}
            >
              {searchQuery
                ? "Try a different search term"
                : "Get started by creating your first visitor"}
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                onPress={handleCreateVisitor}
                className="mt-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg"
              >
                <Text className="text-white">Create Visitor</Text>
              </TouchableOpacity>
            )}
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
        onEdit={handleEditVisitor}
        onDelete={handleDeleteVisitor}
        onConvert={handleConvertToStudent}
      />

      {/* Visitor Form Modal */}
      <VisitorModal
        visitor={editingVisitor}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingVisitor(undefined);
        }}
        onSave={handleSaveVisitor}
        users={users}
        currentUser={currentUser}
      />

      {/* Convert to Student Modal */}
      <ConvertToStudentModal
        visitor={editingVisitor}
        isOpen={isConvertModalOpen}
        onClose={() => {
          setIsConvertModalOpen(false);
          setEditingVisitor(undefined);
        }}
        onSave={handleConvertToStudentSave}
        currentUser={currentUser}
      />
    </SafeAreaView>
  );
}
