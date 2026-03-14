// app/(tabs)/analytics.tsx
import { api } from "@/lib/api";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  BarChart3,
  Calendar,
  CheckCircle,
  Eye,
  FileCheck,
  RefreshCw,
  Search,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  X,
} from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as Progress from "react-native-progress";
import Animated, {
  FadeIn,
  Layout,
  SlideInDown,
  SlideOutDown,
  ZoomIn,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");
const isTablet = width >= 768;
const isSmallScreen = width < 375;

// ============ TYPES ============
interface Student {
  id: string;
  $id: string;
  firstName: string;
  lastName: string;
  email: string;
  contact: string;
  leadStatus: "new" | "in_progress" | "qualified" | "approved" | "rejected";
  $createdAt: string;
  country?: any;
  university?: any;
  nationality?: string;
  type?: "student" | "lead" | "visitor";
}

interface VisaApplication {
  id: string;
  $id: string;
  status: "pending" | "approved" | "rejected" | "under_review" | "processing";
  country: string;
  university: string;
  $createdAt: string;
  student?: {
    firstName: string;
    lastName: string;
  };
}

interface Payment {
  id: string;
  $id: string;
  status: "pending" | "received" | "failed";
  amount: number;
  $createdAt: string;
  student?: {
    firstName: string;
    lastName: string;
  };
}

interface DashboardData {
  success: boolean;
  user: {
    name: string;
    email: string;
    role: string;
  };
  students: Student[];
  leads: Student[];
  visitors: Student[];
  branches: any[];
  payments: Payment[];
  visas: VisaApplication[];
  documents: any[];
  countries: any[];
  metadata: {
    fetchedAt: string;
    cache: string;
  };
}

interface AnalyticsStats {
  // Overview Stats
  totalStudents: number;
  totalLeads: number;
  totalVisitors: number;
  totalAll: number;

  // Status Breakdown
  newStudents: number;
  inProgressStudents: number;
  qualifiedStudents: number;
  approvedStudents: number;
  rejectedStudents: number;

  // Visa Stats
  pendingVisas: number;
  approvedVisas: number;
  rejectedVisas: number;
  underReviewVisas: number;
  processingVisas: number;

  // Growth Metrics
  monthlyGrowth: number;
  weeklyGrowth: number;
  conversionRate: number;

  // Financials
  totalRevenue: number;
  avgRevenuePerStudent: number;
  pendingPayments: number;
  receivedPayments: number;

  // System Stats
  totalBranches: number;
  totalCountries: number;
  totalUniversities: number;
  totalCourses: number;
  totalUsers: number;

  // Performance
  avgProcessingTime: number;
  satisfactionScore: number;
  completionRate: number;
}

// ============ CONSTANTS ============
const STATUS_COLORS = {
  new: "#3b82f6", // blue-500
  in_progress: "#f59e0b", // amber-500
  qualified: "#8b5cf6", // purple-500
  approved: "#10b981", // emerald-500
  rejected: "#ef4444", // red-500
};

const VISA_STATUS_COLORS = {
  pending: "#f59e0b",
  approved: "#10b981",
  rejected: "#ef4444",
  under_review: "#3b82f6",
  processing: "#8b5cf6",
};

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// Black theme configuration
const blackTheme = {
  background: "bg-black",
  card: "bg-gray-900",
  border: "border-gray-800",
  text: "text-white",
  textMuted: "text-gray-400",
};

export default function AnalyticsPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">(
    "30d",
  );
  const [activeTab, setActiveTab] = useState<
    "overview" | "students" | "visas" | "financial"
  >("overview");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const router = useRouter();

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info") => {
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

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const result = await api.getSummary();

      if (result.success) {
        setDashboardData(result as any);
        setError(null);
        showToast("Data updated successfully", "success");
      } else {
        setError(result.error || "Failed to load analytics");
        showToast("Failed to load analytics data", "error");
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
      setError("Network error. Please check your connection.");
      showToast("Network error", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Calculate comprehensive stats
  const stats = useMemo((): AnalyticsStats => {
    if (!dashboardData) {
      return {
        totalStudents: 0,
        totalLeads: 0,
        totalVisitors: 0,
        totalAll: 0,
        newStudents: 0,
        inProgressStudents: 0,
        qualifiedStudents: 0,
        approvedStudents: 0,
        rejectedStudents: 0,
        pendingVisas: 0,
        approvedVisas: 0,
        rejectedVisas: 0,
        underReviewVisas: 0,
        processingVisas: 0,
        monthlyGrowth: 0,
        weeklyGrowth: 0,
        conversionRate: 0,
        totalRevenue: 0,
        avgRevenuePerStudent: 0,
        pendingPayments: 0,
        receivedPayments: 0,
        totalBranches: 0,
        totalCountries: 0,
        totalUniversities: 0,
        totalCourses: 0,
        totalUsers: 1,
        avgProcessingTime: 0,
        satisfactionScore: 0,
        completionRate: 0,
      };
    }

    const { students, leads, visitors, branches, payments, visas, countries } =
      dashboardData;

    // Basic counts
    const totalStudents = students.length;
    const totalLeads = leads.length;
    const totalVisitors = visitors.length;
    const totalAll = totalStudents + totalLeads + totalVisitors;

    // Student status breakdown
    const newStudents = students.filter((s) => s.leadStatus === "new").length;
    const inProgressStudents = students.filter(
      (s) => s.leadStatus === "in_progress",
    ).length;
    const qualifiedStudents = students.filter(
      (s) => s.leadStatus === "qualified",
    ).length;
    const approvedStudents = students.filter(
      (s) => s.leadStatus === "approved",
    ).length;
    const rejectedStudents = students.filter(
      (s) => s.leadStatus === "rejected",
    ).length;

    // Visa status breakdown
    const pendingVisas = visas.filter((v) => v.status === "pending").length;
    const approvedVisas = visas.filter((v) => v.status === "approved").length;
    const rejectedVisas = visas.filter((v) => v.status === "rejected").length;
    const underReviewVisas = visas.filter(
      (v) => v.status === "under_review",
    ).length;
    const processingVisas = visas.filter(
      (v) => v.status === "processing",
    ).length;

    // Payment calculations
    const receivedPayments = payments.filter(
      (p) => p.status === "received",
    ).length;
    const pendingPayments = payments.filter(
      (p) => p.status === "pending",
    ).length;
    const totalRevenue = payments
      .filter((p) => p.status === "received")
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    const avgRevenuePerStudent =
      totalStudents > 0 ? totalRevenue / totalStudents : 0;

    // Growth calculations
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const lastMonthStudents = students.filter((s) => {
      const date = new Date(s.$createdAt);
      return date >= lastMonth && date < thisMonthStart;
    }).length;

    const thisMonthStudents = students.filter((s) => {
      const date = new Date(s.$createdAt);
      return date >= thisMonthStart;
    }).length;

    const monthlyGrowth =
      lastMonthStudents > 0
        ? ((thisMonthStudents - lastMonthStudents) / lastMonthStudents) * 100
        : thisMonthStudents > 0
          ? 100
          : 0;

    // Conversion rate (leads to students)
    const conversionRate =
      totalLeads > 0
        ? (totalStudents / (totalStudents + totalLeads)) * 100
        : totalStudents > 0
          ? 100
          : 0;

    // Unique universities count
    const uniqueUniversities = new Set([
      ...students.map((s) => s.university?.name).filter(Boolean),
      ...leads.map((l) => l.university?.name).filter(Boolean),
      ...visitors.map((v) => v.university?.name).filter(Boolean),
    ]);

    return {
      totalStudents,
      totalLeads,
      totalVisitors,
      totalAll,
      newStudents,
      inProgressStudents,
      qualifiedStudents,
      approvedStudents,
      rejectedStudents,
      pendingVisas,
      approvedVisas,
      rejectedVisas,
      underReviewVisas,
      processingVisas,
      monthlyGrowth: Math.round(monthlyGrowth),
      weeklyGrowth: 12, // Placeholder
      conversionRate: Math.round(conversionRate),
      totalRevenue,
      avgRevenuePerStudent: Math.round(avgRevenuePerStudent),
      pendingPayments,
      receivedPayments,
      totalBranches: branches.length,
      totalCountries: countries?.length || 0,
      totalUniversities: uniqueUniversities.size,
      totalCourses: 0,
      totalUsers: 1,
      avgProcessingTime: 24, // Placeholder in hours
      satisfactionScore: 92, // Placeholder percentage
      completionRate: 85, // Placeholder percentage
    };
  }, [dashboardData]);

  // ============ CHART DATA GENERATION ============
  const enrollmentData = useMemo(() => {
    if (!dashboardData) return [];

    const data = [];
    const now = new Date();
    const monthsToShow =
      timeRange === "7d"
        ? 7
        : timeRange === "30d"
          ? 12
          : timeRange === "90d"
            ? 6
            : 12;

    for (let i = monthsToShow - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = MONTHS[date.getMonth()];

      const monthStudents = dashboardData.students.filter((s) => {
        const studentDate = new Date(s.$createdAt);
        return (
          studentDate.getMonth() === date.getMonth() &&
          studentDate.getFullYear() === date.getFullYear()
        );
      }).length;

      const monthLeads = dashboardData.leads.filter((l) => {
        const leadDate = new Date(l.$createdAt);
        return (
          leadDate.getMonth() === date.getMonth() &&
          leadDate.getFullYear() === date.getFullYear()
        );
      }).length;

      const monthVisitors = dashboardData.visitors.filter((v) => {
        const visitorDate = new Date(v.$createdAt);
        return (
          visitorDate.getMonth() === date.getMonth() &&
          visitorDate.getFullYear() === date.getFullYear()
        );
      }).length;

      data.push({
        month: monthLabel,
        students: monthStudents,
        leads: monthLeads,
        visitors: monthVisitors,
        total: monthStudents + monthLeads + monthVisitors,
      });
    }

    return data;
  }, [dashboardData, timeRange]);

  const countryDistribution = useMemo(() => {
    if (!dashboardData) return [];

    const countryMap = new Map();
    const allRecords = [
      ...dashboardData.students,
      ...dashboardData.leads,
      ...dashboardData.visitors,
    ];

    allRecords.forEach((record) => {
      const country = record.country?.name || record.nationality || "Unknown";
      countryMap.set(country, (countryMap.get(country) || 0) + 1);
    });

    return Array.from(countryMap.entries())
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [dashboardData]);

  // ============ COMPONENTS ============
  const MetricCard = ({
    title,
    value,
    change,
    icon: Icon,
    color,
    bgColor,
    suffix = "",
    format = "number",
  }: {
    title: string;
    value: number;
    change?: number;
    icon: any;
    color: string;
    bgColor: string;
    suffix?: string;
    format?: "number" | "currency" | "percentage";
  }) => {
    const formattedValue = useMemo(() => {
      if (format === "currency") {
        return `$${value.toLocaleString()}`;
      } else if (format === "percentage") {
        return `${value}%`;
      }
      return value.toLocaleString();
    }, [value, format]);

    return (
      <Animated.View
        layout={Layout.duration(300)}
        className={`p-4 rounded-2xl ${blackTheme.card} border ${blackTheme.border}`}
      >
        <View className="flex-row justify-between items-start mb-3">
          <View className={`p-2.5 rounded-xl ${bgColor}`}>
            <Icon size={20} color={color} />
          </View>
          {change !== undefined && (
            <View
              className={`flex-row items-center px-2 py-1 rounded-full ${change >= 0 ? "bg-green-500/10" : "bg-red-500/10"}`}
            >
              {change >= 0 ? (
                <TrendingUp size={12} color="#10b981" />
              ) : (
                <TrendingDown size={12} color="#ef4444" />
              )}
              <Text
                className={`text-xs font-semibold ml-1 ${change >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {Math.abs(change)}%
              </Text>
            </View>
          )}
        </View>

        <Text className={`text-2xl font-black ${blackTheme.text} mb-1`}>
          {formattedValue}
          {suffix}
        </Text>
        <Text className={`text-sm ${blackTheme.textMuted}`}>{title}</Text>
      </Animated.View>
    );
  };

  const ChartCard = ({
    title,
    children,
    onAction,
  }: {
    title: string;
    children: React.ReactNode;
    onAction?: () => void;
  }) => (
    <View
      className={`rounded-2xl p-4 ${blackTheme.card} border ${blackTheme.border} mb-4`}
    >
      <View className="flex-row justify-between items-center mb-4">
        <Text className={`text-lg font-bold ${blackTheme.text}`}>{title}</Text>
        {onAction && (
          <TouchableOpacity
            onPress={onAction}
            className="p-1.5 rounded-lg bg-gray-800"
          >
            <Eye size={16} color={blackTheme.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      {children}
    </View>
  );

  const CountryDistributionChart = () => {
    const maxCount = Math.max(...countryDistribution.map((c) => c.count), 1);

    return (
      <ChartCard title="Top Countries">
        <View className="space-y-3">
          {countryDistribution.map((item, index) => {
            const percentage = (item.count / maxCount) * 100;
            return (
              <View key={index} className="space-y-1">
                <View className="flex-row justify-between items-center">
                  <Text className={`text-sm ${blackTheme.text}`}>
                    {item.country}
                  </Text>
                  <Text className={`font-medium ${blackTheme.text}`}>
                    {item.count}
                  </Text>
                </View>
                <Progress.Bar
                  progress={percentage / 100}
                  width={width - 80}
                  color="#3b82f6"
                  unfilledColor={blackTheme.card}
                  borderWidth={0}
                  height={6}
                  borderRadius={3}
                />
              </View>
            );
          })}
        </View>
      </ChartCard>
    );
  };

  const PerformanceMetrics = () => (
    <ChartCard title="Performance Metrics">
      <View className="flex-row flex-wrap -mx-1">
        {[
          {
            label: "Conversion Rate",
            value: stats.conversionRate,
            suffix: "%",
            icon: TrendingUp,
            color: "#10b981",
            bgColor: "bg-green-500/10",
          },
          {
            label: "Avg Processing",
            value: stats.avgProcessingTime,
            suffix: "h",
            icon: Calendar,
            color: "#3b82f6",
            bgColor: "bg-blue-500/10",
          },
          {
            label: "Satisfaction",
            value: stats.satisfactionScore,
            suffix: "%",
            icon: CheckCircle,
            color: "#8b5cf6",
            bgColor: "bg-purple-500/10",
          },
          {
            label: "Completion",
            value: stats.completionRate,
            suffix: "%",
            icon: FileCheck,
            color: "#f59e0b",
            bgColor: "bg-yellow-500/10",
          },
        ].map((metric, index) => (
          <View key={index} className="w-1/2 px-1 mb-3">
            <View className={`p-3 rounded-xl ${metric.bgColor}`}>
              <View className="flex-row items-center mb-2">
                <View className="p-1.5 rounded-lg bg-black/20 mr-2">
                  <metric.icon size={14} color={metric.color} />
                </View>
                <Text className={`text-xs font-medium ${blackTheme.text}`}>
                  {metric.label}
                </Text>
              </View>
              <Text className={`text-xl font-black ${blackTheme.text}`}>
                {metric.value}
                {metric.suffix}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ChartCard>
  );

  const RecentActivity = () => {
    if (!dashboardData) return null;

    const recentActivities = [
      ...dashboardData.students.slice(0, 3).map((s) => ({
        type: "student" as const,
        id: s.$id,
        name: `${s.firstName} ${s.lastName}`,
        status: s.leadStatus,
        date: s.$createdAt,
        color: STATUS_COLORS[s.leadStatus],
      })),
      ...dashboardData.visas.slice(0, 3).map((v) => ({
        type: "visa" as const,
        id: v.$id,
        name: v.student?.firstName || "Unknown",
        status: v.status,
        date: v.$createdAt,
        color: VISA_STATUS_COLORS[v.status],
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    return (
      <ChartCard title="Recent Activity">
        <View className="space-y-3">
          {recentActivities.map((activity, index) => {
            // Fixed: Check if status exists before splitting
            const statusText = activity.status
              ? activity.status
                  .split("_")
                  .map(
                    (word: string) =>
                      word.charAt(0).toUpperCase() + word.slice(1),
                  )
                  .join(" ")
              : "Unknown";

            return (
              <TouchableOpacity
                key={index}
                className="flex-row items-center justify-between p-3 rounded-xl bg-gray-800/50"
                onPress={() => {
                  if (activity.type === "student") {
                    router.push(`/(applicants)/students`);
                  } else {
                    router.push(`/(applicants)/students`);
                  }
                }}
              >
                <View className="flex-row items-center flex-1">
                  <View
                    className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                    style={{ backgroundColor: `${activity.color}20` }}
                  >
                    {activity.type === "student" ? (
                      <Users size={18} color={activity.color} />
                    ) : (
                      <FileCheck size={18} color={activity.color} />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text
                      className={`font-medium ${blackTheme.text}`}
                      numberOfLines={1}
                    >
                      {activity.name}
                    </Text>
                    <Text className={`text-xs ${blackTheme.textMuted}`}>
                      {activity.type === "student"
                        ? "New Student"
                        : "Visa Application"}
                    </Text>
                  </View>
                </View>

                <View className="items-end">
                  <Text
                    className={`text-xs font-medium px-2 py-1 rounded-full`}
                    style={{
                      backgroundColor: `${activity.color}20`,
                      color: activity.color,
                    }}
                  >
                    {statusText}
                  </Text>
                  <Text className={`text-xs ${blackTheme.textMuted} mt-1`}>
                    {new Date(activity.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ChartCard>
    );
  };

  const QuickActions = () => (
    <ChartCard title="Quick Actions">
      <View className="flex-row flex-wrap -mx-1">
        {[
          {
            label: "View Student",
            icon: Users,
            color: "#8b5cf6",
            bgColor: "bg-purple-500/10",
            action: () => router.push("/(applicants)/students"),
          },
          {
            label: "View Leads",
            icon: BarChart3,
            color: "#10b981",
            bgColor: "bg-green-500/10",
            action: () => router.push("/(applicants)/leads"),
          },
          {
            label: "View Visitors",
            icon: Target,
            color: "#10b981",
            bgColor: "bg-green-500/10",
            action: () => router.push("/(applicants)/visitors"),
          },
          {
            label: "Branches",
            icon: Calendar,
            color: "#8b5cf6",
            bgColor: "bg-purple-500/10",
            action: () => router.push("/(tabs)/branches"),
          },
        ].map((action, index) => (
          <TouchableOpacity
            key={index}
            className="w-1/2 px-1 mb-3"
            onPress={action.action}
          >
            <View className={`p-4 rounded-xl ${action.bgColor} items-center`}>
              <View className="p-2.5 rounded-lg bg-black/20 mb-2">
                <action.icon size={20} color={action.color} />
              </View>
              <Text
                className={`text-sm font-medium ${blackTheme.text} text-center`}
              >
                {action.label}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ChartCard>
  );

  if (loading && !dashboardData) {
    return (
      <SafeAreaView className={`flex-1 ${blackTheme.background}`}>
        <StatusBar barStyle="light-content" />
        <View className="flex-1 items-center justify-center">
          <Animated.View
            entering={ZoomIn.duration(1000)}
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 items-center justify-center"
          >
            <BarChart3 size={32} color="white" />
          </Animated.View>
          <Animated.Text
            entering={FadeIn.delay(200)}
            className={`text-lg font-semibold mt-6 ${blackTheme.text}`}
          >
            Loading Analytics...
          </Animated.Text>
          <Text className={`${blackTheme.textMuted} mt-2 text-center px-8`}>
            Crunching the numbers for you
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className={`flex-1 ${blackTheme.background}`}>
        <StatusBar barStyle="light-content" />
        <View className="flex-1 items-center justify-center p-8">
          <View className="w-24 h-24 rounded-3xl bg-gradient-to-br from-red-500/20 to-red-600/20 items-center justify-center mb-6">
            <X size={40} color="#ef4444" />
          </View>
          <Text className={`text-2xl font-bold mb-2 ${blackTheme.text}`}>
            Failed to Load
          </Text>
          <Text
            className={`${blackTheme.textMuted} text-center text-base mb-8`}
          >
            {error}
          </Text>
          <TouchableOpacity
            onPress={fetchDashboardData}
            className="bg-gradient-to-r from-purple-600 to-purple-500 px-8 py-4 rounded-2xl flex-row items-center"
          >
            <RefreshCw size={20} color="white" />
            <Text className="text-white font-bold text-base ml-2">Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${blackTheme.background}`}>
      <StatusBar barStyle="light-content" />

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
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="rounded-2xl px-5 py-4 flex-row items-center justify-between"
          >
            <Text className="text-white font-semibold flex-1">
              {toast.message}
            </Text>
            <TouchableOpacity
              onPress={() => setToast(null)}
              className="ml-4 p-1 rounded-full bg-white/20"
            >
              <X size={18} color="white" />
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      )}

      {/* Header */}
      <View className="px-5 pt-4 pb-3">
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-1">
            <Text className={`text-3xl font-black ${blackTheme.text} mb-1`}>
              Analytics
            </Text>
            <Text className={`text-sm ${blackTheme.textMuted}`}>
              {dashboardData?.user?.name
                ? `Welcome, ${dashboardData.user.name}`
                : "Real-time insights & metrics"}
            </Text>
          </View>
        </View>

        {/* Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-4"
        ></ScrollView>

        {/* Search */}
        <View className="relative mb-3">
          <View className="absolute left-4 top-0 bottom-0 justify-center z-10">
            <Search size={20} color={blackTheme.textMuted} />
          </View>
          <TextInput
            placeholder="Search analytics"
            placeholderTextColor={blackTheme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            className={`pl-12 pr-4 py-3.5 ${blackTheme.card} placeholder:text-white rounded-2xl border ${blackTheme.border} ${blackTheme.text} text-base font-medium`}
          />
          {searchQuery ? (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              className="absolute right-4 top-0 bottom-0 justify-center"
            >
              <X size={20} color={blackTheme.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#8b5cf6"]}
            tintColor="#8b5cf6"
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
      >
        {/* Overview Stats Grid */}
        <View className="flex-row flex-wrap -mx-1.5 mb-4">
          <View className="w-1/2 px-1.5 mb-3">
            <MetricCard
              title="Total Records"
              value={stats.totalAll}
              change={stats.monthlyGrowth}
              icon={Users}
              color="#8b5cf6"
              bgColor="bg-purple-500/10"
            />
          </View>
          <View className="w-1/2 px-1.5">
            <MetricCard
              title="Conversion Rate"
              value={stats.conversionRate}
              icon={TrendingUp}
              color="#f59e0b"
              bgColor="bg-yellow-500/10"
              suffix="%"
              format="percentage"
            />
          </View>
        </View>

        <PerformanceMetrics />
        <QuickActions />
        {/* Performance & Recent Activity */}
        {/* <RecentActivity /> */}
      </ScrollView>
    </SafeAreaView>
  );
}
