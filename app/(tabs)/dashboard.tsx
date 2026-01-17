// app/(tabs)/analytics.tsx
import { API_URL } from "@/config";
import { Theme, themeConfigs } from "@/theme";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  Activity,
  ArrowRight,
  BarChart3,
  BookOpen,
  Briefcase,
  Building,
  Building2,
  Calendar,
  CheckCircle,
  CheckSquare,
  ChevronDown,
  Clock,
  CreditCard,
  Eye,
  FileCheck,
  Flag,
  Globe,
  GraduationCap,
  LineChart,
  MoreHorizontal,
  PieChart,
  RefreshCw,
  Search,
  School,
  TrendingUp,
  User,
  UserCheck,
  UserPlus,
  Users,
  X,
  XCircle,
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
import * as Progress from 'react-native-progress';

const { width } = Dimensions.get("window");

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

interface StudentDocument {
  id: string;
  $id: string;
  documentName: string;
  status: "pending" | "submitted" | "approved" | "rejected";
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
  documents: StudentDocument[];
  countries: any[];
  metadata: {
    fetchedAt: string;
    cache: string;
  };
}

interface DashboardStats {
  totalStudents: number;
  totalLeads: number;
  totalVisitors: number;
  totalAll: number;
  newStudents: number;
  inProgressStudents: number;
  qualifiedStudents: number;
  approvedStudents: number;
  rejectedStudents: number;
  pendingVisas: number;
  approvedVisas: number;
  rejectedVisas: number;
  underReviewVisas: number;
  monthlyGrowth: number;
  totalBranches: number;
  totalRevenue: number;
  avgRevenuePerStudent: number;
  totalCountries: number;
  totalUniversities: number;
  totalCourses: number;
  totalUsers: number;
}

// ============ CHART DATA ============
const STATUS_COLORS = {
  new: "#3b82f6",      // blue-500
  in_progress: "#f59e0b", // yellow-500
  qualified: "#8b5cf6",   // purple-500
  approved: "#10b981",    // green-500
  rejected: "#ef4444",    // red-500
};

const VISA_STATUS_COLORS = {
  pending: "#f59e0b",      // yellow-500
  approved: "#10b981",     // green-500
  rejected: "#ef4444",     // red-500
  under_review: "#3b82f6", // blue-500
  processing: "#8b5cf6",   // purple-500
};

export default function AnalyticsPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>("dark");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [selectedType, setSelectedType] = useState<'all' | 'student' | 'lead' | 'visitor'>('all');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedUniversity, setSelectedUniversity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState("");
  const [timeRange, setTimeRange] = useState("30d");
  const [activeTab, setActiveTab] = useState<"university" | "country">("university");
  const [showFilters, setShowFilters] = useState(false);

  const router = useRouter();
  const currentTheme = themeConfigs[theme];

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info") => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 4000);
      Haptics.notificationAsync(
        type === "success"
          ? Haptics.NotificationFeedbackType.Success
          : type === "error"
          ? Haptics.NotificationFeedbackType.Error
          : Haptics.NotificationFeedbackType.Warning
      );
    },
    []
  );

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/dashboard/analytics`);
      const result = await response.json();

      if (result.success) {
        setDashboardData(result);
        setError(null);
      } else {
        setError(result.error || "Failed to load analytics");
        showToast("Failed to load analytics data", "error");
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
      setError("Network error");
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
    showToast("Refreshing analytics...", "info");
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Calculate stats
  const stats = useMemo((): DashboardStats => {
    if (!dashboardData) {
      return {
        totalStudents: 0,
        totalLeads: 0,
        totalVisitors: 0,
        totalAll: 0,
        newStudents: 0,
        inProgressStudents: 0,
        qualifiedStudents: number;
        approvedStudents: 0,
        rejectedStudents: 0,
        pendingVisas: 0,
        approvedVisas: 0,
        rejectedVisas: 0,
        underReviewVisas: 0,
        monthlyGrowth: 0,
        totalBranches: 0,
        totalRevenue: 0,
        avgRevenuePerStudent: 0,
        totalCountries: 0,
        totalUniversities: 0,
        totalCourses: 0,
        totalUsers: 0
      };
    }

    const { students, leads, visitors, branches, payments, visas, countries } = dashboardData;

    const totalStudents = students.length;
    const totalLeads = leads.length;
    const totalVisitors = visitors.length;
    const totalAll = totalStudents + totalLeads + totalVisitors;

    // Student status counts
    const newStudents = students.filter((s) => s.leadStatus === "new").length;
    const inProgressStudents = students.filter((s) => s.leadStatus === "in_progress").length;
    const qualifiedStudents = students.filter((s) => s.leadStatus === "qualified").length;
    const approvedStudents = students.filter((s) => s.leadStatus === "approved").length;
    const rejectedStudents = students.filter((s) => s.leadStatus === "rejected").length;

    // Visa status counts
    const pendingVisas = visas.filter((v) => v.status === "pending").length;
    const approvedVisas = visas.filter((v) => v.status === "approved").length;
    const rejectedVisas = visas.filter((v) => v.status === "rejected").length;
    const underReviewVisas = visas.filter((v) => 
      v.status === "under_review" || v.status === "processing"
    ).length;

    // Revenue calculation
    const totalRevenue = payments
      .filter((p) => p.status === "received")
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const avgRevenuePerStudent = totalStudents > 0 ? totalRevenue / totalStudents : 0;

    // Monthly growth calculation
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const currentMonthStudents = students.filter((student) => {
      const date = new Date(student.$createdAt);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).length;

    const previousMonthStudents = students.filter((student) => {
      const date = new Date(student.$createdAt);
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      return date.getMonth() === prevMonth && date.getFullYear() === prevYear;
    }).length;

    const monthlyGrowth = previousMonthStudents > 0 
      ? ((currentMonthStudents - previousMonthStudents) / previousMonthStudents) * 100 
      : (currentMonthStudents > 0 ? 100 : 0);

    // Count unique universities
    const uniqueUniversities = new Set([
      ...students.map(s => s.university?.name).filter(Boolean),
      ...leads.map(l => l.university?.name).filter(Boolean),
      ...visitors.map(v => v.university?.name).filter(Boolean)
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
      monthlyGrowth: Math.round(monthlyGrowth),
      totalBranches: branches.length,
      totalRevenue,
      avgRevenuePerStudent: Math.round(avgRevenuePerStudent),
      totalCountries: countries?.length || 0,
      totalUniversities: uniqueUniversities.size,
      totalCourses: 0, // Would need to fetch from courses API
      totalUsers: 1 // Would need to fetch from users API
    };
  }, [dashboardData]);

  // ============ COMPONENTS ============

  const StatsCard = ({
    icon: Icon,
    label,
    value,
    color,
    bgColor,
    textColor,
  }: {
    icon: any;
    label: string;
    value: string | number;
    color: string;
    bgColor: string;
    textColor: string;
  }) => (
    <TouchableOpacity
      className={`${currentTheme.card} rounded-xl p-4 border ${currentTheme.border}`}
      onPress={() => {
        // Navigate based on label
        switch (label) {
          case "Students":
            router.push("/(tabs)/students");
            break;
          case "Leads":
            router.push("/(tabs)/students?type=lead");
            break;
          case "Total Records":
            router.push("/(tabs)/students");
            break;
          case "Visitors":
            router.push("/(tabs)/students?type=visitor");
            break;
          case "Approved Visas":
            router.push("/(tabs)/visa?status=approved");
            break;
          case "Active Branches":
            router.push("/(tabs)/branches");
            break;
          default:
            break;
        }
      }}
    >
      <View className="flex flex-row items-center justify-between mb-3">
        <View className={`p-2 rounded-lg ${bgColor}`}>
          <Icon size={20} color={textColor} />
        </View>
        <ArrowRight size={16} color={currentTheme.textMuted} />
      </View>
      <Text className={`text-2xl font-bold ${currentTheme.text}`}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </Text>
      <Text className={`text-sm ${currentTheme.textMuted} mt-1`}>{label}</Text>
    </TouchableOpacity>
  );

  const ChartCard = ({
    title,
    description,
    children,
  }: {
    title: string;
    description: string;
    children: React.ReactNode;
  }) => (
    <View className={`${currentTheme.card} rounded-xl p-4 border ${currentTheme.border} mb-4`}>
      <Text className={`text-lg font-bold ${currentTheme.text} mb-1`}>{title}</Text>
      <Text className={`text-sm ${currentTheme.textMuted} mb-4`}>{description}</Text>
      {children}
    </View>
  );

  const StudentStatusChart = () => {
    if (!dashboardData) return null;

    const statusData = [
      { status: "new", label: "New", color: STATUS_COLORS.new },
      { status: "in_progress", label: "In Progress", color: STATUS_COLORS.in_progress },
      { status: "qualified", label: "Qualified", color: STATUS_COLORS.qualified },
      { status: "approved", label: "Approved", color: STATUS_COLORS.approved },
      { status: "rejected", label: "Rejected", color: STATUS_COLORS.rejected },
    ].map((item) => ({
      ...item,
      count: dashboardData.students.filter((s) => s.leadStatus === item.status).length,
    })).filter((item) => item.count > 0);

    const total = statusData.reduce((sum, item) => sum + item.count, 0);

    return (
      <ChartCard
        title="Students by Status"
        description="Distribution of students across different statuses"
      >
        <View className="space-y-3">
          {statusData.map((item, index) => {
            const percentage = total > 0 ? (item.count / total) * 100 : 0;
            return (
              <View key={index} className="space-y-2">
                <View className="flex flex-row justify-between items-center">
                  <View className="flex flex-row items-center space-x-2">
                    <View
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <Text className={`font-medium ${currentTheme.text}`}>{item.label}</Text>
                  </View>
                  <Text className={`font-medium ${currentTheme.text}`}>{item.count}</Text>
                </View>
                <Progress.Bar
                  progress={percentage / 100}
                  width={width - 64}
                  color={item.color}
                  unfilledColor={currentTheme.card}
                  borderWidth={0}
                  height={8}
                  borderRadius={4}
                />
              </View>
            );
          })}
        </View>
        <View className="flex flex-row justify-between items-center mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Text className={`text-sm ${currentTheme.textMuted}`}>Total Students</Text>
          <Text className={`font-bold ${currentTheme.text}`}>{total}</Text>
        </View>
      </ChartCard>
    );
  };

  const EnrollmentChart = () => {
    if (!dashboardData) return null;

    const monthlyData = useMemo(() => {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const currentYear = new Date().getFullYear();
      
      const data = months.map((month, index) => ({
        month,
        date: `${currentYear}-${String(index + 1).padStart(2, "0")}-01`,
        Students: 0,
        Leads: 0,
        Visitors: 0,
        total: 0,
      }));

      // Count students per month
      dashboardData.students.forEach((student) => {
        if (student.$createdAt) {
          const date = new Date(student.$createdAt);
          const monthIndex = date.getMonth();
          if (date.getFullYear() === currentYear && monthIndex >= 0 && monthIndex < 12) {
            data[monthIndex].Students++;
            data[monthIndex].total++;
          }
        }
      });

      // Count leads per month
      dashboardData.leads.forEach((lead) => {
        if (lead.$createdAt) {
          const date = new Date(lead.$createdAt);
          const monthIndex = date.getMonth();
          if (date.getFullYear() === currentYear && monthIndex >= 0 && monthIndex < 12) {
            data[monthIndex].Leads++;
            data[monthIndex].total++;
          }
        }
      });

      // Count visitors per month
      dashboardData.visitors.forEach((visitor) => {
        if (visitor.$createdAt) {
          const date = new Date(visitor.$createdAt);
          const monthIndex = date.getMonth();
          if (date.getFullYear() === currentYear && monthIndex >= 0 && monthIndex < 12) {
            data[monthIndex].Visitors++;
            data[monthIndex].total++;
          }
        }
      });

      return data;
    }, [dashboardData]);

    const filteredData = useMemo(() => {
      const daysToSubtract = timeRange === "30d" ? 30 : timeRange === "7d" ? 7 : 90;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToSubtract);
      return monthlyData.filter((item) => {
        const itemDate = new Date(item.date);
        return itemDate >= cutoffDate;
      });
    }, [monthlyData, timeRange]);

    return (
      <ChartCard
        title="Enrollment Over Time"
        description="Showing students, leads, and visitors enrollment trends"
      >
        <View className="flex flex-row justify-between items-center mb-4">
          <View className="flex flex-row space-x-2">
            {["90d", "30d", "7d"].map((range) => (
              <TouchableOpacity
                key={range}
                onPress={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-lg ${
                  timeRange === range
                    ? "bg-purple-600"
                    : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                }`}
              >
                <Text
                  className={timeRange === range ? "text-white" : currentTheme.text}
                >
                  {range}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="space-y-4 min-w-full">
            {filteredData.map((item, index) => {
              const maxValue = Math.max(item.Students, item.Leads, item.Visitors, 1);
              return (
                <View key={index} className="space-y-2">
                  <View className="flex flex-row justify-between items-center">
                    <Text className={`text-sm ${currentTheme.text}`}>{item.month}</Text>
                    <Text className={`text-xs ${currentTheme.textMuted}`}>
                      Total: {item.total}
                    </Text>
                  </View>
                  
                  <View className="flex flex-row space-x-1 h-6">
                    {/* Students bar */}
                    {item.Students > 0 && (
                      <View
                        className="rounded-l"
                        style={{
                          width: `${(item.Students / maxValue) * 100}%`,
                          backgroundColor: STATUS_COLORS.approved,
                        }}
                      />
                    )}
                    
                    {/* Leads bar */}
                    {item.Leads > 0 && (
                      <View
                        className=""
                        style={{
                          width: `${(item.Leads / maxValue) * 100}%`,
                          backgroundColor: STATUS_COLORS.qualified,
                        }}
                      />
                    )}
                    
                    {/* Visitors bar */}
                    {item.Visitors > 0 && (
                      <View
                        className="rounded-r"
                        style={{
                          width: `${(item.Visitors / maxValue) * 100}%`,
                          backgroundColor: STATUS_COLORS.in_progress,
                        }}
                      />
                    )}
                  </View>
                  
                  <View className="flex flex-row justify-between text-xs">
                    <Text className={currentTheme.textMuted}>S: {item.Students}</Text>
                    <Text className={currentTheme.textMuted}>L: {item.Leads}</Text>
                    <Text className={currentTheme.textMuted}>V: {item.Visitors}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>

        <View className="flex flex-row justify-center space-x-6 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <View className="flex flex-row items-center space-x-2">
            <View className="w-3 h-3 rounded-full bg-green-500" />
            <Text className={`text-xs ${currentTheme.textMuted}`}>Students</Text>
          </View>
          <View className="flex flex-row items-center space-x-2">
            <View className="w-3 h-3 rounded-full bg-purple-500" />
            <Text className={`text-xs ${currentTheme.textMuted}`}>Leads</Text>
          </View>
          <View className="flex flex-row items-center space-x-2">
            <View className="w-3 h-3 rounded-full bg-yellow-500" />
            <Text className={`text-xs ${currentTheme.textMuted}`}>Visitors</Text>
          </View>
        </View>
      </ChartCard>
    );
  };

  const RecentStudentsList = () => {
    if (!dashboardData) return null;

    const recentStudents = [...dashboardData.students]
      .sort((a, b) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime())
      .slice(0, 5);

    const getStatusColor = (status: string) => {
      switch (status) {
        case "new": return "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400";
        case "in_progress": return "bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400";
        case "qualified": return "bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400";
        case "approved": return "bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400";
        case "rejected": return "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400";
        default: return "bg-gray-100 dark:bg-gray-500/20 text-gray-600 dark:text-gray-400";
      }
    };

    return (
      <ChartCard
        title="Recent Students"
        description="Latest student registrations"
      >
        <View className="space-y-3">
          {recentStudents.map((student, index) => (
            <TouchableOpacity
              key={index}
              className="flex flex-row items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
              onPress={() => router.push(`/(tabs)/students/${student.id}`)}
            >
              <View className="flex flex-row items-center space-x-3">
                <View className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 items-center justify-center">
                  <Text className="text-white font-bold">
                    {student.firstName?.[0]}{student.lastName?.[0]}
                  </Text>
                </View>
                <View>
                  <Text className={`font-medium ${currentTheme.text}`}>
                    {student.firstName} {student.lastName}
                  </Text>
                  <Text className={`text-xs ${currentTheme.textMuted}`}>
                    {student.email}
                  </Text>
                </View>
              </View>
              <View className="items-end">
                <Text className={`px-2 py-1 rounded-full text-xs ${getStatusColor(student.leadStatus)}`}>
                  {student.leadStatus?.split('_').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ')}
                </Text>
                <Text className={`text-xs ${currentTheme.textMuted} mt-1`}>
                  {new Date(student.$createdAt).toLocaleDateString()}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        
        <TouchableOpacity
          className="mt-4 flex flex-row items-center justify-center space-x-2"
          onPress={() => router.push("/(tabs)/students")}
        >
          <Text className={`text-purple-600 dark:text-purple-400 font-medium`}>
            View All Students
          </Text>
          <ArrowRight size={16} color="#8b5cf6" />
        </TouchableOpacity>
      </ChartCard>
    );
  };

  const RecentVisaApplications = () => {
    if (!dashboardData) return null;

    const recentVisas = [...dashboardData.visas]
      .sort((a, b) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime())
      .slice(0, 5);

    const getStatusIcon = (status: string) => {
      switch (status) {
        case "approved":
          return <CheckCircle size={16} color="#10b981" />;
        case "rejected":
          return <XCircle size={16} color="#ef4444" />;
        case "pending":
          return <Clock size={16} color="#f59e0b" />;
        default:
          return <Clock size={16} color="#6b7280" />;
      }
    };

    return (
      <ChartCard
        title="Recent Visa Applications"
        description="Latest visa application submissions"
      >
        <View className="space-y-3">
          {recentVisas.map((visa, index) => (
            <View
              key={index}
              className="flex flex-row items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
            >
              <View className="flex flex-row items-center space-x-3">
                <View className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 items-center justify-center">
                  {getStatusIcon(visa.status)}
                </View>
                <View>
                  <Text className={`font-medium ${currentTheme.text}`}>
                    {visa.student?.firstName} {visa.student?.lastName || "Unknown"}
                  </Text>
                  <Text className={`text-xs ${currentTheme.textMuted}`}>
                    {visa.country} • {visa.university}
                  </Text>
                </View>
              </View>
              <View className="items-end">
                <Text className={`text-sm font-medium ${
                  visa.status === "approved" ? "text-green-600 dark:text-green-400" :
                  visa.status === "rejected" ? "text-red-600 dark:text-red-400" :
                  "text-yellow-600 dark:text-yellow-400"
                }`}>
                  {visa.status.charAt(0).toUpperCase() + visa.status.slice(1)}
                </Text>
                <Text className={`text-xs ${currentTheme.textMuted} mt-1`}>
                  {new Date(visa.$createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
          ))}
        </View>
        
        <TouchableOpacity
          className="mt-4 flex flex-row items-center justify-center space-x-2"
          onPress={() => router.push("/(tabs)/visa")}
        >
          <Text className={`text-purple-600 dark:text-purple-400 font-medium`}>
            View All Visa Applications
          </Text>
          <ArrowRight size={16} color="#8b5cf6" />
        </TouchableOpacity>
      </ChartCard>
    );
  };

  const CountryDistribution = () => {
    if (!dashboardData) return null;

    const countryData = useMemo(() => {
      const counts: Record<string, number> = {};
      const allRecords = [...dashboardData.students, ...dashboardData.leads, ...dashboardData.visitors];

      allRecords.forEach((record) => {
        const country = record.country?.name || record.nationality || "Unknown";
        counts[country] = (counts[country] || 0) + 1;
      });

      return Object.entries(counts)
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);
    }, [dashboardData]);

    const maxCount = Math.max(...countryData.map(item => item.count), 1);

    return (
      <ChartCard
        title="Students by Country"
        description="Top countries by number of students"
      >
        <View className="space-y-3">
          {countryData.map((item, index) => {
            const percentage = (item.count / maxCount) * 100;
            return (
              <View key={index} className="space-y-1">
                <View className="flex flex-row justify-between items-center">
                  <Text className={`text-sm ${currentTheme.text}`}>{item.country}</Text>
                  <Text className={`font-medium ${currentTheme.text}`}>{item.count}</Text>
                </View>
                <Progress.Bar
                  progress={percentage / 100}
                  width={width - 64}
                  color="#8b5cf6"
                  unfilledColor={currentTheme.card}
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

  const VisaStatusChart = () => {
    if (!dashboardData) return null;

    const visaData = [
      { status: "pending", label: "Pending", color: VISA_STATUS_COLORS.pending },
      { status: "approved", label: "Approved", color: VISA_STATUS_COLORS.approved },
      { status: "rejected", label: "Rejected", color: VISA_STATUS_COLORS.rejected },
      { status: "under_review", label: "Under Review", color: VISA_STATUS_COLORS.under_review },
      { status: "processing", label: "Processing", color: VISA_STATUS_COLORS.processing },
    ].map((item) => ({
      ...item,
      count: dashboardData.visas.filter((v) => v.status === item.status).length,
    }));

    const total = visaData.reduce((sum, item) => sum + item.count, 0);

    return (
      <ChartCard
        title="Visa Applications Status"
        description="Distribution across different statuses"
      >
        <View className="flex flex-row flex-wrap justify-between">
          {visaData.map((item, index) => (
            <View key={index} className="w-1/2 p-2">
              <View className="items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <View className="w-12 h-12 rounded-full items-center justify-center mb-2"
                  style={{ backgroundColor: `${item.color}20` }}>
                  <Text className="font-bold text-lg" style={{ color: item.color }}>
                    {item.count}
                  </Text>
                </View>
                <Text className={`text-xs ${currentTheme.text} text-center`}>{item.label}</Text>
              </View>
            </View>
          ))}
        </View>
        <View className="flex flex-row justify-between items-center mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Text className={`text-sm ${currentTheme.textMuted}`}>Total Visa Applications</Text>
          <Text className={`font-bold ${currentTheme.text}`}>{total}</Text>
        </View>
      </ChartCard>
    );
  };

  const StatsCardsGrid = () => {
    const statsData = [
      {
        icon: Users,
        label: "Total Records",
        value: stats.totalAll,
        color: "bg-purple-500",
        bgColor: "bg-purple-500/10",
        textColor: "text-purple-600 dark:text-purple-400",
      },
      {
        icon: UserCheck,
        label: "Students",
        value: stats.totalStudents,
        color: "bg-blue-500",
        bgColor: "bg-blue-500/10",
        textColor: "text-blue-600 dark:text-blue-400",
      },
      {
        icon: Briefcase,
        label: "Leads",
        value: stats.totalLeads,
        color: "bg-yellow-500",
        bgColor: "bg-yellow-500/10",
        textColor: "text-yellow-600 dark:text-yellow-400",
      },
      {
        icon: Users,
        label: "Visitors",
        value: stats.totalVisitors,
        color: "bg-green-500",
        bgColor: "bg-green-500/10",
        textColor: "text-green-600 dark:text-green-400",
      },
      {
        icon: Flag,
        label: "Countries",
        value: stats.totalCountries,
        color: "bg-red-500",
        bgColor: "bg-red-500/10",
        textColor: "text-red-600 dark:text-red-400",
      },
      {
        icon: BookOpen,
        label: "Courses",
        value: stats.totalCourses,
        color: "bg-indigo-500",
        bgColor: "bg-indigo-500/10",
        textColor: "text-indigo-600 dark:text-indigo-400",
      },
      {
        icon: GraduationCap,
        label: "Universities",
        value: stats.totalUniversities,
        color: "bg-pink-500",
        bgColor: "bg-pink-500/10",
        textColor: "text-pink-600 dark:text-pink-400",
      },
      {
        icon: User,
        label: "Users",
        value: stats.totalUsers,
        color: "bg-cyan-500",
        bgColor: "bg-cyan-500/10",
        textColor: "text-cyan-600 dark:text-cyan-400",
      },
      {
        icon: CheckSquare,
        label: "Approved Visas",
        value: stats.approvedVisas,
        color: "bg-emerald-500",
        bgColor: "bg-emerald-500/10",
        textColor: "text-emerald-600 dark:text-emerald-400",
      },
      {
        icon: XSquare,
        label: "Rejected Visas",
        value: stats.rejectedVisas,
        color: "bg-rose-500",
        bgColor: "bg-rose-500/10",
        textColor: "text-rose-600 dark:text-rose-400",
      },
      {
        icon: Building,
        label: "Active Branches",
        value: stats.totalBranches,
        color: "bg-violet-500",
        bgColor: "bg-violet-500/10",
        textColor: "text-violet-600 dark:text-violet-400",
      },
    ];

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-4"
      >
        <View className="flex flex-row gap-3 px-4">
          {statsData.map((stat, index) => (
            <StatsCard key={index} {...stat} />
          ))}
        </View>
      </ScrollView>
    );
  };

  if (loading && !dashboardData) {
    return (
      <SafeAreaView
        className={`flex-1 ${currentTheme.background} items-center justify-center`}
      >
        <ActivityIndicator size="large" color={currentTheme.primary} />
        <Text className={`mt-4 ${currentTheme.text}`}>Loading analytics...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className={`flex-1 ${currentTheme.background} items-center justify-center`}>
        <View className="p-6 items-center">
          <XCircle size={48} color="#ef4444" />
          <Text className={`text-lg font-medium mt-4 ${currentTheme.text}`}>
            Failed to load analytics
          </Text>
          <Text className={`text-sm ${currentTheme.textMuted} mt-2 text-center`}>
            {error}
          </Text>
          <TouchableOpacity
            onPress={fetchDashboardData}
            className="mt-6 px-4 py-2 bg-purple-600 rounded-lg"
          >
            <Text className="text-white">Retry</Text>
          </TouchableOpacity>
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
        <View className="flex flex-row justify-between items-center mb-4">
          <View>
            <Text className={`text-2xl font-bold ${currentTheme.text}`}>
              Analytics Dashboard
            </Text>
            <Text className={`text-sm ${currentTheme.textMuted} mt-1`}>
              {dashboardData?.user?.name 
                ? `Welcome back, ${dashboardData.user.name}`
                : "View your analytics insights"}
            </Text>
          </View>

          <View className="flex flex-row gap-2">
            <TouchableOpacity
              onPress={onRefresh}
              className={`p-2.5 ${currentTheme.card} rounded-lg border ${currentTheme.border}`}
            >
              <RefreshCw size={20} color={currentTheme.textMuted} className={refreshing ? "animate-spin" : ""} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowFilters(!showFilters)}
              className={`p-2.5 ${currentTheme.card} rounded-lg border ${currentTheme.border}`}
            >
              <Search size={20} color={currentTheme.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Filters (Conditional) */}
        {showFilters && (
          <Animated.View
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(200)}
            className="mb-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
          >
            <Text className={`font-medium mb-3 ${currentTheme.text}`}>Filters</Text>
            <View className="flex flex-row flex-wrap gap-2">
              {["all", "student", "lead", "visitor"].map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => setSelectedType(type as any)}
                  className={`px-3 py-1.5 rounded-lg ${
                    selectedType === type
                      ? "bg-purple-600"
                      : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <Text
                    className={selectedType === type ? "text-white" : currentTheme.text}
                  >
                    {type === "all" ? "All" : type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}
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
      >
        {/* Stats Cards */}
        <StatsCardsGrid />

        {/* Charts Section */}
        <View className="px-4">
          <View className="flex flex-row items-center justify-between mb-4">
            <Text className={`text-lg font-bold ${currentTheme.text}`}>
              Charts & Insights
            </Text>
            <View className="flex flex-row space-x-2">
              <TouchableOpacity className="p-1">
                <BarChart3 size={20} color={currentTheme.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity className="p-1">
                <PieChart size={20} color={currentTheme.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity className="p-1">
                <LineChart size={20} color={currentTheme.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Main Charts */}
          <StudentStatusChart />
          <EnrollmentChart />

          <View className="flex flex-row flex-wrap -mx-2">
            <View className="w-1/2 px-2">
              <VisaStatusChart />
            </View>
            <View className="w-1/2 px-2">
              <CountryDistribution />
            </View>
          </View>

          {/* Recent Items */}
          <RecentStudentsList />
          <RecentVisaApplications />

          {/* Growth Metrics */}
          <View className={`${currentTheme.card} rounded-xl p-4 border ${currentTheme.border} mb-4`}>
            <Text className={`text-lg font-bold ${currentTheme.text} mb-4`}>Growth Metrics</Text>
            <View className="flex flex-row flex-wrap -mx-2">
              <View className="w-1/2 px-2 mb-4">
                <View className="p-3 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
                  <Text className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {stats.monthlyGrowth}%
                  </Text>
                  <Text className={`text-sm ${currentTheme.textMuted} mt-1`}>Monthly Growth</Text>
                  <TrendingUp size={16} color="#3b82f6" className="mt-2" />
                </View>
              </View>
              <View className="w-1/2 px-2 mb-4">
                <View className="p-3 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                  <Text className="text-2xl font-bold text-green-600 dark:text-green-400">
                    NPR {stats.totalRevenue.toLocaleString()}
                  </Text>
                  <Text className={`text-sm ${currentTheme.textMuted} mt-1`}>Total Revenue</Text>
                  <CreditCard size={16} color="#10b981" className="mt-2" />
                </View>
              </View>
              <View className="w-1/2 px-2">
                <View className="p-3 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                  <Text className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    NPR {stats.avgRevenuePerStudent.toLocaleString()}
                  </Text>
                  <Text className={`text-sm ${currentTheme.textMuted} mt-1`}>Avg per Student</Text>
                  <Users size={16} color="#8b5cf6" className="mt-2" />
                </View>
              </View>
              <View className="w-1/2 px-2">
                <View className="p-3 rounded-lg bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
                  <Text className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {stats.underReviewVisas}
                  </Text>
                  <Text className={`text-sm ${currentTheme.textMuted} mt-1`}>Visa in Process</Text>
                  <FileCheck size={16} color="#f59e0b" className="mt-2" />
                </View>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View className={`${currentTheme.card} rounded-xl p-4 border ${currentTheme.border} mb-8`}>
            <Text className={`text-lg font-bold ${currentTheme.text} mb-4`}>Quick Actions</Text>
            <View className="flex flex-row flex-wrap -mx-2">
              <TouchableOpacity 
                className="w-1/2 px-2 mb-4"
                onPress={() => router.push("/(tabs)/students?action=create")}
              >
                <View className="p-4 rounded-lg bg-purple-100 dark:bg-purple-500/20 items-center">
                  <UserPlus size={24} color="#8b5cf6" />
                  <Text className={`font-medium mt-2 ${currentTheme.text}`}>Add Student</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity 
                className="w-1/2 px-2 mb-4"
                onPress={() => router.push("/(tabs)/visa?action=create")}
              >
                <View className="p-4 rounded-lg bg-blue-100 dark:bg-blue-500/20 items-center">
                  <FileCheck size={24} color="#3b82f6" />
                  <Text className={`font-medium mt-2 ${currentTheme.text}`}>New Visa</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity 
                className="w-1/2 px-2"
                onPress={() => router.push("/(tabs)/branches")}
              >
                <View className="p-4 rounded-lg bg-green-100 dark:bg-green-500/20 items-center">
                  <Building2 size={24} color="#10b981" />
                  <Text className={`font-medium mt-2 ${currentTheme.text}`}>Branches</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity 
                className="w-1/2 px-2"
                onPress={() => router.push("/(tabs)/reports")}
              >
                <View className="p-4 rounded-lg bg-yellow-100 dark:bg-yellow-500/20 items-center">
                  <BarChart3 size={24} color="#f59e0b" />
                  <Text className={`font-medium mt-2 ${currentTheme.text}`}>Reports</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}