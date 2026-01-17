// app/(tabs)/payments.tsx
import { API_URL } from "@/config";
import { Theme, themeConfigs } from "@/theme";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
    Calendar,
    Check,
    CheckCircle,
    ChevronRight,
    Clock,
    DollarSign,
    Edit,
    FileText,
    History,
    Play,
    Plus,
    Receipt,
    RefreshCw,
    Search,
    Trash2,
    UserPlus,
    Users,
    X
} from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
    SlideInDown,
    SlideOutDown,
    ZoomIn,
    ZoomOut
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

type PaymentStatus = "pending" | "received" | "issued" | "failed" | "under_review";
type TabType = "templates" | "history";

interface PaymentTemplate {
  id: string;
  $id?: string;
  templateName: string;
  items: TemplateItem[];
  isActive: boolean;
  studentCount: number;
  createdAt: string;
  updatedAt: string;
}

interface TemplateItem {
  id: string;
  $id?: string;
  label: string;
  amount: number;
  type: "tuition" | "fee" | "material" | "other";
  required: boolean;
  description?: string;
}

interface Payment {
  id: string;
  $id?: string;
  notes: string;
  status: PaymentStatus;
  amount: number;
  remarks: string;
  createdAt: string;
  updatedAt: string;
  template?: {
    id: string;
    templateName: string;
    isActive: boolean;
  };
  student?: {
    id: string;
    $id?: string;
    firstName: string;
    lastName: string;
    email: string;
    contact: string;
    branches: string;
  };
  templateItem?: {
    id: string;
    $id?: string;
    label: string;
    amount: number;
  };
}

interface Student {
  id: string;
  $id?: string;
  firstName: string;
  lastName: string;
  email: string;
  status: "new" | "pending" | "in_progress" | "qualified" | "completed" | "dropped";
  paymentTemplates?: string;
}

export default function PaymentsManagement() {
  const [templates, setTemplates] = useState<PaymentTemplate[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState({
    templates: true,
    payments: true,
    students: false,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("templates");
  const [theme, setTheme] = useState<Theme>("dark");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info" | "warning";
  } | null>(null);
  
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showTemplateEditModal, setShowTemplateEditModal] = useState(false);
  const [showAssignStudentModal, setShowAssignStudentModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<PaymentTemplate | null>(null);
  
  const [templateFormData, setTemplateFormData] = useState({
    templateName: "",
    items: [] as TemplateItem[],
    isActive: true,
  });
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [isUpdatingTemplate, setIsUpdatingTemplate] = useState(false);
  const [isAssigningTemplate, setIsAssigningTemplate] = useState(false);

  const router = useRouter();
  const currentTheme = themeConfigs[theme];
  const flatListRef = useRef<FlatList>(null);

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

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, templates: true }));
      const response = await fetch(`${API_URL}/dashboard/paymentsTemplates`);
      const result = await response.json();

      if (result.success) {
        setTemplates(Array.isArray(result.data) ? result.data : []);
      } else {
        showToast("Failed to fetch payment templates", "error");
      }
    } catch (error) {
      showToast("Error fetching payment templates", "error");
    } finally {
      setLoading(prev => ({ ...prev, templates: false }));
      setRefreshing(false);
    }
  }, [showToast]);

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, payments: true }));
      const response = await fetch(`${API_URL}/dashboard/payments`);
      const result = await response.json();

      if (result.success) {
        setPayments(Array.isArray(result.data) ? result.data : []);
      } else {
        showToast("Failed to fetch payments", "error");
      }
    } catch (error) {
      showToast("Error fetching payments", "error");
    } finally {
      setLoading(prev => ({ ...prev, payments: false }));
    }
  }, [showToast]);

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, students: true }));
      const response = await fetch(`${API_URL}/dashboard/students?status=in_progress`);
      const result = await response.json();

      if (result.success) {
        setStudents(Array.isArray(result.data) ? result.data : []);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(prev => ({ ...prev, students: false }));
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
    fetchPayments();
    fetchStudents();
  }, [fetchTemplates, fetchPayments, fetchStudents]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    showToast("Refreshing data...", "info");
    fetchTemplates();
    if (activeTab === "history") {
      fetchPayments();
    }
  }, [fetchTemplates, fetchPayments, activeTab, showToast]);

  const createPaymentTemplate = async () => {
    if (templateFormData.items.length === 0) {
      showToast("Please add at least one item to the template", "error");
      return;
    }

    try {
      setIsCreatingTemplate(true);
      const response = await fetch(`${API_URL}/dashboard/paymentsTemplates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(templateFormData),
      });

      const result = await response.json();
      if (result.success) {
        showToast("Payment template created successfully", "success");
        setShowTemplateModal(false);
        setTemplateFormData({ templateName: "", items: [], isActive: true });
        fetchTemplates();
      } else {
        showToast(result.error || "Failed to create template", "error");
      }
    } catch (error) {
      showToast("Failed to create payment template", "error");
    } finally {
      setIsCreatingTemplate(false);
    }
  };

  const updatePaymentTemplate = async () => {
    if (!selectedTemplate) return;
    
    try {
      setIsUpdatingTemplate(true);
      const response = await fetch(
        `${API_URL}/dashboard/paymentsTemplates/${selectedTemplate.id || selectedTemplate.$id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(templateFormData),
        }
      );

      const result = await response.json();
      if (result.success) {
        showToast("Payment template updated successfully", "success");
        setShowTemplateEditModal(false);
        setSelectedTemplate(null);
        setTemplateFormData({ templateName: "", items: [], isActive: true });
        fetchTemplates();
      } else {
        showToast(result.error || "Failed to update template", "error");
      }
    } catch (error) {
      showToast("Failed to update payment template", "error");
    } finally {
      setIsUpdatingTemplate(false);
    }
  };

  const deletePaymentTemplate = async (templateId: string) => {
    Alert.alert(
      "Delete Payment Template",
      "Are you sure you want to delete this payment template? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(
                `${API_URL}/dashboard/paymentsTemplates/${templateId}`,
                {
                  method: "DELETE",
                }
              );

              const result = await response.json();
              if (result.success) {
                showToast("Payment template deleted successfully", "success");
                fetchTemplates();
              } else {
                showToast(result.error || "Failed to delete template", "error");
              }
            } catch (error) {
              showToast("Failed to delete payment template", "error");
            }
          },
        },
      ]
    );
  };

  const assignTemplateToStudent = async (studentId: string, templateId: string) => {
    try {
      setIsAssigningTemplate(true);

      const response = await fetch(
        `${API_URL}/dashboard/students/${studentId}/payment-template`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            templateId, 
            createPayments: true 
          }),
        }
      );

      const result = await response.json();
      if (result.success) {
        showToast("Payment template assigned successfully", "success");
        setShowAssignStudentModal(false);
        setSelectedTemplate(null);
        fetchStudents();
      } else {
        showToast(result.error || "Failed to assign template", "error");
      }
    } catch (error) {
      showToast("Failed to assign payment template", "error");
    } finally {
      setIsAssigningTemplate(false);
    }
  };

  const openEditTemplateModal = (template: PaymentTemplate) => {
    setSelectedTemplate(template);
    setTemplateFormData({
      templateName: template.templateName,
      items: template.items,
      isActive: template.isActive,
    });
    setShowTemplateEditModal(true);
  };

  const applyTemplateToStudent = (template: PaymentTemplate) => {
    setSelectedTemplate(template);
    setShowAssignStudentModal(true);
  };

  const filteredTemplates = useMemo(() => {
    return templates.filter((template) =>
      template.templateName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [templates, searchQuery]);

  const filteredPayments = useMemo(() => {
    return payments.filter(
      (payment) =>
        payment.student?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.student?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.templateItem?.label?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.notes?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [payments, searchQuery]);

  const PaymentStatusBadge = ({ status }: { status: PaymentStatus }) => {
    const config = {
      pending: {
        color: "bg-yellow-100 dark:bg-yellow-500/10",
        text: "text-yellow-800 dark:text-yellow-400",
        label: "Pending"
      },
      received: {
        color: "bg-green-100 dark:bg-green-500/10",
        text: "text-green-800 dark:text-green-400",
        label: "Received"
      },
      issued: {
        color: "bg-blue-100 dark:bg-blue-500/10",
        text: "text-blue-800 dark:text-blue-400",
        label: "Issued"
      },
      failed: {
        color: "bg-red-100 dark:bg-red-500/10",
        text: "text-red-800 dark:text-red-400",
        label: "Failed"
      },
      under_review: {
        color: "bg-purple-100 dark:bg-purple-500/10",
        text: "text-purple-800 dark:text-purple-400",
        label: "Under Review"
      },
    };

    const { color, text, label } = config[status];

    return (
      <View className={`px-2 py-1 rounded ${color}`}>
        <Text className={`text-xs font-medium ${text}`}>{label}</Text>
      </View>
    );
  };

  const PaymentTemplateCard = ({ template }: { template: PaymentTemplate }) => {
    const totalAmount = template.items.reduce((sum, item) => sum + item.amount, 0);

    return (
      <Animated.View 
        entering={ZoomIn.duration(300)}
        exiting={ZoomOut.duration(300)}
        className={`m-2 p-4 rounded-2xl ${currentTheme.card} border ${currentTheme.border}`}
        style={{ width: (width - 32) / 2 - 8 }}
      >
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-row items-center gap-2">
            <View className="p-2 bg-purple-100 dark:bg-purple-500/20 rounded-lg">
              <FileText size={16} color="#8b5cf6" />
            </View>
            <Text className={`text-sm font-medium ${currentTheme.text}`}>
              {template.studentCount} students
            </Text>
          </View>
          <View className={`px-2 py-1 rounded ${
            template.isActive
              ? "bg-green-100 dark:bg-green-500/10"
              : "bg-gray-100 dark:bg-gray-500/10"
          }`}>
            <Text className={`text-xs ${
              template.isActive
                ? "text-green-600 dark:text-green-400"
                : "text-gray-600 dark:text-gray-400"
            }`}>
              {template.isActive ? "Active" : "Inactive"}
            </Text>
          </View>
        </View>

        <Text className={`${currentTheme.text} font-semibold text-lg mb-2`}>
          {template.templateName}
        </Text>

        <View className="space-y-2 mb-4">
          {template.items.slice(0, 2).map((item, index) => (
            <View key={`${template.id || template.$id}-item-${index}`} className="flex-row justify-between items-center">
              <Text className={`${currentTheme.textMuted} text-sm flex-1`} numberOfLines={1}>
                {item.label}
              </Text>
              <Text className={`font-medium ${currentTheme.text} text-sm`}>
                {item.amount.toLocaleString("en-NP", {
                  style: "currency",
                  currency: "NPR",
                  maximumFractionDigits: 0,
                })}
              </Text>
            </View>
          ))}
          {template.items.length > 2 && (
            <Text className={`text-xs ${currentTheme.textMuted}`}>
              +{template.items.length - 2} more items
            </Text>
          )}
        </View>

        <View className="flex-row justify-between items-center">
          <View>
            <Text className={`text-lg font-bold ${currentTheme.text}`}>
              {totalAmount.toLocaleString("en-NP", {
                style: "currency",
                currency: "NPR",
                maximumFractionDigits: 0,
              })}
            </Text>
            <Text className={`text-xs ${currentTheme.textMuted}`}>
              {template.items.length} items
            </Text>
          </View>
          <View className="flex-row gap-1">
            <TouchableOpacity
              onPress={() => applyTemplateToStudent(template)}
              className="p-2 bg-green-100 dark:bg-green-500/20 rounded-lg"
            >
              <Play size={16} color="#10b981" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => openEditTemplateModal(template)}
              className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-lg"
            >
              <Edit size={16} color="#3b82f6" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => deletePaymentTemplate(template.id || template.$id || '')}
              className="p-2 bg-red-100 dark:bg-red-500/20 rounded-lg"
            >
              <Trash2 size={16} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  };

  const PaymentHistoryCard = ({ payment }: { payment: Payment }) => {
    const paymentName = payment.templateItem?.label || payment.notes || "Payment";
    const studentName = payment.student
      ? `${payment.student.firstName} ${payment.student.lastName}`
      : "Unknown Student";
    const dateTime = new Date(payment.updatedAt || payment.createdAt);
    const formattedDate = dateTime.toLocaleDateString();
    const formattedTime = dateTime.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <View className={`${currentTheme.card} rounded-lg p-4 ${currentTheme.border} mb-3`}>
        <View className="flex-row justify-between items-start mb-2">
          <Text className={`font-semibold ${currentTheme.text} flex-1`} numberOfLines={2}>
            {paymentName}
          </Text>
          <PaymentStatusBadge status={payment.status} />
        </View>
        
        <Text className={`text-sm ${currentTheme.text} mb-2`}>
          {studentName}
        </Text>
        
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center gap-1">
            <Calendar size={14} color={currentTheme.textMuted} />
            <Text className={`text-xs ${currentTheme.textMuted}`}>
              {formattedDate} at {formattedTime}
            </Text>
          </View>
          <Text className="font-semibold text-green-600 dark:text-green-400">
            {payment.amount.toLocaleString("en-NP", {
              style: "currency",
              currency: "NPR",
              maximumFractionDigits: 0,
            })}
          </Text>
        </View>
      </View>
    );
  };

  const StatsCard = ({
    icon: Icon,
    title,
    value,
    color,
  }: {
    icon: any;
    title: string;
    value: string | number;
    color: string;
  }) => (
    <View className={`${currentTheme.card} rounded-lg p-4 ${currentTheme.border}`}>
      <View className="flex-row items-center gap-3">
        <View className={`p-2 ${color} rounded-lg`}>
          <Icon size={20} color="white" />
        </View>
        <View>
          <Text className={`text-2xl font-bold ${currentTheme.text}`}>{value}</Text>
          <Text className={`text-sm ${currentTheme.textMuted}`}>{title}</Text>
        </View>
      </View>
    </View>
  );

  const templateStats = useMemo(() => {
    const total = templates.length;
    const active = templates.filter(t => t.isActive).length;
    const totalStudents = templates.reduce((sum, t) => sum + t.studentCount, 0);
    return { total, active, totalStudents };
  }, [templates]);

  const paymentStats = useMemo(() => {
    const total = payments.length;
    const received = payments.filter(p => p.status === "received").length;
    const pending = payments.filter(p => p.status === "pending").length;
    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    return { total, received, pending, totalAmount };
  }, [payments]);

  if (loading.templates && templates.length === 0) {
    return (
      <SafeAreaView className={`flex-1 ${currentTheme.background} items-center justify-center`}>
        <ActivityIndicator size="large" color={currentTheme.primary} />
        <Text className={`mt-4 ${currentTheme.text}`}>Loading...</Text>
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
            <Text className={`text-2xl font-bold ${currentTheme.text}`}>
              Payment Management
            </Text>
            <View className="flex-row mt-2 gap-2">
              <View className="px-2 py-1 bg-purple-100 dark:bg-purple-500/10 rounded-full">
                <Text className="text-purple-600 dark:text-purple-400 text-xs">
                  {activeTab === "templates" 
                    ? `${templateStats.total} templates`
                    : `${paymentStats.total} payments`
                  }
                </Text>
              </View>
            </View>
          </View>
          
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={onRefresh}
              className="p-2.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <RefreshCw size={20} color={currentTheme.textMuted} />
            </TouchableOpacity>
            
            {activeTab === "templates" && (
              <TouchableOpacity
                onPress={() => setShowTemplateModal(true)}
                className="flex-row items-center gap-2 px-4 py-2.5 bg-purple-600 rounded-lg"
              >
                <Plus size={20} color="white" />
                <Text className="text-white font-medium">New</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Search Bar */}
        <View className="relative mb-4">
          <Search
            size={20}
            color={currentTheme.textMuted}
            className="absolute left-3 top-3 z-10"
          />
          <TextInput
            placeholder={
              activeTab === "templates" 
                ? "Search template names..." 
                : "Search payments..."
            }
            placeholderTextColor={currentTheme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            className={`pl-10 pr-4 py-3 ${currentTheme.card} rounded-xl border ${currentTheme.border} ${currentTheme.text}`}
          />
        </View>

        {/* Tabs */}
        <View className={`flex-row ${currentTheme.card} rounded-lg p-1 ${currentTheme.border} mb-6`}>
          {[
            { id: "templates", label: "Templates", icon: FileText },
            { id: "history", label: "History", icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => {
                  setActiveTab(tab.id as TabType);
                  setSearchQuery("");
                }}
                className={`flex-1 flex-row items-center justify-center gap-2 py-2 rounded ${
                  isActive
                    ? "bg-purple-600"
                    : ""
                }`}
              >
                <Icon size={16} color={isActive ? "white" : currentTheme.textMuted} />
                <Text className={isActive ? "text-white font-medium" : currentTheme.textMuted}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Content */}
      {activeTab === "templates" ? (
        <>
          {/* Template Stats */}
          <View className="px-4 mb-6">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pb-2">
              <View className="flex-row gap-3">
                <StatsCard
                  icon={FileText}
                  title="Total Templates"
                  value={templateStats.total}
                  color="bg-purple-500"
                />
                <StatsCard
                  icon={CheckCircle}
                  title="Active"
                  value={templateStats.active}
                  color="bg-green-500"
                />
                <StatsCard
                  icon={Users}
                  title="Assigned Students"
                  value={templateStats.totalStudents}
                  color="bg-blue-500"
                />
              </View>
            </ScrollView>
          </View>

          {/* Templates Grid */}
          <FlatList
            ref={flatListRef}
            data={filteredTemplates}
            numColumns={2}
            keyExtractor={(item) => item.id || item.$id || Math.random().toString()}
            renderItem={({ item }) => <PaymentTemplateCard template={item} />}
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
                <FileText size={48} color={currentTheme.textMuted} />
                <Text className={`text-lg font-medium mt-4 ${currentTheme.text}`}>
                  {searchQuery ? "No matching templates found" : "No templates yet"}
                </Text>
                <Text className={`text-sm ${currentTheme.textMuted} mt-2 text-center`}>
                  {searchQuery 
                    ? "Try a different search term" 
                    : "Create your first payment template to get started"}
                </Text>
                {!searchQuery && (
                  <TouchableOpacity
                    onPress={() => setShowTemplateModal(true)}
                    className="mt-4 px-4 py-2 bg-purple-600 rounded-lg"
                  >
                    <Text className="text-white">Create Template</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
          />
        </>
      ) : (
        <>
          {/* Payment Stats */}
          <View className="px-4 mb-6">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pb-2">
              <View className="flex-row gap-3">
                <StatsCard
                  icon={Receipt}
                  title="Total Payments"
                  value={paymentStats.total}
                  color="bg-purple-500"
                />
                <StatsCard
                  icon={CheckCircle}
                  title="Received"
                  value={paymentStats.received}
                  color="bg-green-500"
                />
                <StatsCard
                  icon={Clock}
                  title="Pending"
                  value={paymentStats.pending}
                  color="bg-yellow-500"
                />
                <StatsCard
                  icon={DollarSign}
                  title="Total Amount"
                  value={paymentStats.totalAmount.toLocaleString("en-NP", {
                    style: "currency",
                    currency: "NPR",
                    maximumFractionDigits: 0,
                  })}
                  color="bg-blue-500"
                />
              </View>
            </ScrollView>
          </View>

          {/* Payment History List */}
          <FlatList
            ref={flatListRef}
            data={filteredPayments}
            keyExtractor={(item) => item.id || item.$id || Math.random().toString()}
            renderItem={({ item }) => <PaymentHistoryCard payment={item} />}
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
                <History size={48} color={currentTheme.textMuted} />
                <Text className={`text-lg font-medium mt-4 ${currentTheme.text}`}>
                  {searchQuery ? "No matching payments found" : "No payments yet"}
                </Text>
                <Text className={`text-sm ${currentTheme.textMuted} mt-2 text-center`}>
                  {searchQuery 
                    ? "Try a different search term" 
                    : "Payment history will appear here"}
                </Text>
              </View>
            }
          />
        </>
      )}

      {/* Template Form Modal */}
      <Modal
        visible={showTemplateModal}
        animationType="slide"
        transparent={true}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <Animated.View 
            entering={SlideInDown.duration(300)}
            exiting={SlideOutDown.duration(200)}
            className={`${currentTheme.card} rounded-t-3xl p-6 max-h-[85vh]`}
          >
            <View className="flex-row justify-between items-center mb-6">
              <Text className={`text-xl font-bold ${currentTheme.text}`}>
                Create Payment Template
              </Text>
              <TouchableOpacity onPress={() => {
                setShowTemplateModal(false);
                setTemplateFormData({ templateName: "", items: [], isActive: true });
              }}>
                <X size={24} color={currentTheme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="space-y-4">
                <View>
                  <Text className={`font-medium mb-2 ${currentTheme.text}`}>
                    Template Name *
                  </Text>
                  <TextInput
                    placeholder="e.g., Standard Tuition Fee, Course Materials, etc."
                    placeholderTextColor={currentTheme.textMuted}
                    value={templateFormData.templateName}
                    onChangeText={(text) => setTemplateFormData({
                      ...templateFormData,
                      templateName: text
                    })}
                    className={`px-4 py-3 rounded-xl border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                  />
                </View>

                <View>
                  <View className="flex-row justify-between items-center mb-4">
                    <Text className={`font-medium ${currentTheme.text}`}>
                      Template Items *
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setTemplateFormData({
                          ...templateFormData,
                          items: [
                            ...templateFormData.items,
                            {
                              id: Date.now().toString(),
                              label: "",
                              amount: 0,
                              type: "other",
                              required: false,
                            },
                          ],
                        });
                      }}
                      className="flex-row items-center gap-2 px-3 py-1.5 bg-purple-600 rounded-lg"
                    >
                      <Plus size={16} color="white" />
                      <Text className="text-white text-sm">Add Item</Text>
                    </TouchableOpacity>
                  </View>

                  <ScrollView className="max-h-60">
                    {templateFormData.items.map((item, index) => (
                      <View
                        key={`item-${index}`}
                        className={`p-4 mb-3 ${currentTheme.border} rounded-lg border`}
                      >
                        <View className="flex-row justify-between items-center mb-3">
                          <Text className={`font-medium ${currentTheme.text}`}>
                            Item {index + 1}
                          </Text>
                          <TouchableOpacity
                            onPress={() => {
                              const newItems = templateFormData.items.filter((_, i) => i !== index);
                              setTemplateFormData({
                                ...templateFormData,
                                items: newItems,
                              });
                            }}
                          >
                            <Trash2 size={18} color="#ef4444" />
                          </TouchableOpacity>
                        </View>

                        <View className="space-y-3">
                          <View>
                            <Text className={`text-sm ${currentTheme.textMuted} mb-1`}>
                              Item Label *
                            </Text>
                            <TextInput
                              placeholder="Item name"
                              placeholderTextColor={currentTheme.textMuted}
                              value={item.label}
                              onChangeText={(text) => {
                                const newItems = [...templateFormData.items];
                                newItems[index].label = text;
                                setTemplateFormData({
                                  ...templateFormData,
                                  items: newItems,
                                });
                              }}
                              className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                            />
                          </View>

                          <View>
                            <Text className={`text-sm ${currentTheme.textMuted} mb-1`}>
                              Amount *
                            </Text>
                            <TextInput
                              placeholder="0"
                              placeholderTextColor={currentTheme.textMuted}
                              value={item.amount.toString()}
                              onChangeText={(text) => {
                                const newItems = [...templateFormData.items];
                                newItems[index].amount = parseFloat(text) || 0;
                                setTemplateFormData({
                                  ...templateFormData,
                                  items: newItems,
                                });
                              }}
                              keyboardType="numeric"
                              className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                            />
                          </View>

                          <View>
                            <Text className={`text-sm ${currentTheme.textMuted} mb-1`}>
                              Type
                            </Text>
                            <View className="flex-row gap-2 flex-wrap">
                              {["tuition", "fee", "material", "other"].map((type) => (
                                <TouchableOpacity
                                  key={type}
                                  onPress={() => {
                                    const newItems = [...templateFormData.items];
                                    newItems[index].type = type as any;
                                    setTemplateFormData({
                                      ...templateFormData,
                                      items: newItems,
                                    });
                                  }}
                                  className={`px-3 py-1.5 rounded ${
                                    item.type === type
                                      ? "bg-purple-600"
                                      : "bg-gray-100 dark:bg-gray-700"
                                  }`}
                                >
                                  <Text className={
                                    item.type === type
                                      ? "text-white"
                                      : currentTheme.text
                                  }>
                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          </View>

                          <View className="flex-row items-center gap-2">
                            <TouchableOpacity
                              onPress={() => {
                                const newItems = [...templateFormData.items];
                                newItems[index].required = !item.required;
                                setTemplateFormData({
                                  ...templateFormData,
                                  items: newItems,
                                });
                              }}
                              className="flex-row items-center gap-2"
                            >
                              <View className={`w-5 h-5 rounded border ${
                                item.required 
                                  ? "bg-purple-600 border-purple-600" 
                                  : currentTheme.border
                              } items-center justify-center`}>
                                {item.required && <Check size={12} color="white" />}
                              </View>
                              <Text className={currentTheme.text}>Required</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    ))}
                  </ScrollView>

                  {templateFormData.items.length === 0 && (
                    <View className={`py-8 ${currentTheme.border} rounded-lg border-dashed items-center`}>
                      <FileText size={32} color={currentTheme.textMuted} />
                      <Text className={`${currentTheme.textMuted} mt-3`}>
                        No items added yet
                      </Text>
                    </View>
                  )}
                </View>

                {templateFormData.items.length > 0 && (
                  <View className={`p-4 bg-gray-50 dark:bg-gray-800 rounded-lg`}>
                    <View className="flex-row justify-between items-center">
                      <Text className={`font-medium ${currentTheme.text}`}>
                        Total Amount:
                      </Text>
                      <Text className={`text-xl font-bold ${currentTheme.primary}`}>
                        {templateFormData.items.reduce((sum, item) => sum + item.amount, 0)
                          .toLocaleString("en-NP", {
                            style: "currency",
                            currency: "NPR",
                            maximumFractionDigits: 0,
                          })}
                      </Text>
                    </View>
                  </View>
                )}

                <View className="flex-row items-center gap-2">
                  <TouchableOpacity
                    onPress={() => setTemplateFormData({
                      ...templateFormData,
                      isActive: !templateFormData.isActive
                    })}
                    className={`w-6 h-6 rounded border ${
                      templateFormData.isActive 
                        ? "bg-purple-600 border-purple-600" 
                        : currentTheme.border
                    } items-center justify-center`}
                  >
                    {templateFormData.isActive && <Check size={12} color="white" />}
                  </TouchableOpacity>
                  <Text className={currentTheme.text}>
                    Active Template
                  </Text>
                </View>
              </View>
            </ScrollView>

            <View className="flex-row gap-3 mt-6">
              <TouchableOpacity
                onPress={() => {
                  setShowTemplateModal(false);
                  setTemplateFormData({ templateName: "", items: [], isActive: true });
                }}
                className={`flex-1 py-3 rounded-xl border ${currentTheme.border} items-center`}
              >
                <Text className={currentTheme.textMuted}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={createPaymentTemplate}
                disabled={isCreatingTemplate || templateFormData.items.length === 0}
                className="flex-1 bg-purple-600 py-3 rounded-xl items-center"
              >
                {isCreatingTemplate ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-medium">
                    Create Template
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Edit Template Modal */}
      <Modal
        visible={showTemplateEditModal}
        animationType="slide"
        transparent={true}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <Animated.View 
            entering={SlideInDown.duration(300)}
            exiting={SlideOutDown.duration(200)}
            className={`${currentTheme.card} rounded-t-3xl p-6 max-h-[85vh]`}
          >
            <View className="flex-row justify-between items-center mb-6">
              <Text className={`text-xl font-bold ${currentTheme.text}`}>
                Edit Payment Template
              </Text>
              <TouchableOpacity onPress={() => {
                setShowTemplateEditModal(false);
                setSelectedTemplate(null);
                setTemplateFormData({ templateName: "", items: [], isActive: true });
              }}>
                <X size={24} color={currentTheme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="space-y-4">
                <View>
                  <Text className={`font-medium mb-2 ${currentTheme.text}`}>
                    Template Name *
                  </Text>
                  <TextInput
                    placeholder="Template name"
                    placeholderTextColor={currentTheme.textMuted}
                    value={templateFormData.templateName}
                    onChangeText={(text) => setTemplateFormData({
                      ...templateFormData,
                      templateName: text
                    })}
                    className={`px-4 py-3 rounded-xl border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                  />
                </View>

                <View>
                  <View className="flex-row justify-between items-center mb-4">
                    <Text className={`font-medium ${currentTheme.text}`}>
                      Template Items *
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setTemplateFormData({
                          ...templateFormData,
                          items: [
                            ...templateFormData.items,
                            {
                              id: Date.now().toString(),
                              label: "",
                              amount: 0,
                              type: "other",
                              required: false,
                            },
                          ],
                        });
                      }}
                      className="flex-row items-center gap-2 px-3 py-1.5 bg-purple-600 rounded-lg"
                    >
                      <Plus size={16} color="white" />
                      <Text className="text-white text-sm">Add Item</Text>
                    </TouchableOpacity>
                  </View>

                  <ScrollView className="max-h-60">
                    {templateFormData.items.map((item, index) => (
                      <View
                        key={`item-${index}`}
                        className={`p-4 mb-3 ${currentTheme.border} rounded-lg border`}
                      >
                        <View className="flex-row justify-between items-center mb-3">
                          <Text className={`font-medium ${currentTheme.text}`}>
                            Item {index + 1}
                          </Text>
                          <TouchableOpacity
                            onPress={() => {
                              const newItems = templateFormData.items.filter((_, i) => i !== index);
                              setTemplateFormData({
                                ...templateFormData,
                                items: newItems,
                              });
                            }}
                          >
                            <Trash2 size={18} color="#ef4444" />
                          </TouchableOpacity>
                        </View>

                        <View className="space-y-3">
                          <View>
                            <Text className={`text-sm ${currentTheme.textMuted} mb-1`}>
                              Item Label *
                            </Text>
                            <TextInput
                              placeholder="Item name"
                              placeholderTextColor={currentTheme.textMuted}
                              value={item.label}
                              onChangeText={(text) => {
                                const newItems = [...templateFormData.items];
                                newItems[index].label = text;
                                setTemplateFormData({
                                  ...templateFormData,
                                  items: newItems,
                                });
                              }}
                              className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                            />
                          </View>

                          <View>
                            <Text className={`text-sm ${currentTheme.textMuted} mb-1`}>
                              Amount *
                            </Text>
                            <TextInput
                              placeholder="0"
                              placeholderTextColor={currentTheme.textMuted}
                              value={item.amount.toString()}
                              onChangeText={(text) => {
                                const newItems = [...templateFormData.items];
                                newItems[index].amount = parseFloat(text) || 0;
                                setTemplateFormData({
                                  ...templateFormData,
                                  items: newItems,
                                });
                              }}
                              keyboardType="numeric"
                              className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                            />
                          </View>

                          <View className="flex-row items-center gap-2">
                            <TouchableOpacity
                              onPress={() => {
                                const newItems = [...templateFormData.items];
                                newItems[index].required = !item.required;
                                setTemplateFormData({
                                  ...templateFormData,
                                  items: newItems,
                                });
                              }}
                              className="flex-row items-center gap-2"
                            >
                              <View className={`w-5 h-5 rounded border ${
                                item.required 
                                  ? "bg-purple-600 border-purple-600" 
                                  : currentTheme.border
                              } items-center justify-center`}>
                                {item.required && <Check size={12} color="white" />}
                              </View>
                              <Text className={currentTheme.text}>Required</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                </View>

                <View className="flex-row items-center gap-2">
                  <TouchableOpacity
                    onPress={() => setTemplateFormData({
                      ...templateFormData,
                      isActive: !templateFormData.isActive
                    })}
                    className={`w-6 h-6 rounded border ${
                      templateFormData.isActive 
                        ? "bg-purple-600 border-purple-600" 
                        : currentTheme.border
                    } items-center justify-center`}
                  >
                    {templateFormData.isActive && <Check size={12} color="white" />}
                  </TouchableOpacity>
                  <Text className={currentTheme.text}>
                    Active Template
                  </Text>
                </View>
              </View>
            </ScrollView>

            <View className="flex-row gap-3 mt-6">
              <TouchableOpacity
                onPress={() => {
                  setShowTemplateEditModal(false);
                  setSelectedTemplate(null);
                  setTemplateFormData({ templateName: "", items: [], isActive: true });
                }}
                className={`flex-1 py-3 rounded-xl border ${currentTheme.border} items-center`}
              >
                <Text className={currentTheme.textMuted}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={updatePaymentTemplate}
                disabled={isUpdatingTemplate || templateFormData.items.length === 0}
                className="flex-1 bg-purple-600 py-3 rounded-xl items-center"
              >
                {isUpdatingTemplate ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-medium">
                    Update Template
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Assign Student Modal */}
      <Modal
        visible={showAssignStudentModal}
        animationType="slide"
        transparent={true}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <Animated.View 
            entering={SlideInDown.duration(300)}
            exiting={SlideOutDown.duration(200)}
            className={`${currentTheme.card} rounded-t-3xl p-6 max-h-[85vh]`}
          >
            <View className="flex-row justify-between items-center mb-6">
              <Text className={`text-xl font-bold ${currentTheme.text}`}>
                Assign Template to Student
              </Text>
              <TouchableOpacity onPress={() => {
                setShowAssignStudentModal(false);
                setSelectedTemplate(null);
              }}>
                <X size={24} color={currentTheme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedTemplate && (
                <View className="mb-6 p-4 bg-blue-50 dark:bg-blue-500/10 rounded-lg border border-blue-200 dark:border-blue-500/20">
                  <Text className={`font-semibold ${currentTheme.text} mb-2`}>
                    Template Details
                  </Text>
                  <View className="space-y-1">
                    <View className="flex-row justify-between">
                      <Text className={currentTheme.textMuted}>Template:</Text>
                      <Text className={`${currentTheme.text} font-medium`}>
                        {selectedTemplate.templateName}
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className={currentTheme.textMuted}>Items:</Text>
                      <Text className={`${currentTheme.text} font-medium`}>
                        {selectedTemplate.items.length}
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className={currentTheme.textMuted}>Total Amount:</Text>
                      <Text className="font-semibold text-green-600 dark:text-green-400">
                        {selectedTemplate.items.reduce((sum, item) => sum + item.amount, 0)
                          .toLocaleString("en-NP", {
                            style: "currency",
                            currency: "NPR",
                            maximumFractionDigits: 0,
                          })}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              <View>
                <Text className={`font-medium mb-4 ${currentTheme.text}`}>
                  Select Student
                </Text>
                
                <View className="relative mb-4">
                  <Search
                    size={20}
                    color={currentTheme.textMuted}
                    className="absolute left-3 top-3 z-10"
                  />
                  <TextInput
                    placeholder="Search students..."
                    placeholderTextColor={currentTheme.textMuted}
                    className={`pl-10 pr-4 py-3 ${currentTheme.card} rounded-xl border ${currentTheme.border} ${currentTheme.text}`}
                  />
                </View>

                <ScrollView className="max-h-60">
                  {students
                    .filter(student => student.status === "in_progress" && !student.paymentTemplates)
                    .map((student) => (
                      <TouchableOpacity
                        key={student.id || student.$id}
                        onPress={() => {
                          if (selectedTemplate) {
                            assignTemplateToStudent(
                              student.id || student.$id || '',
                              selectedTemplate.id || selectedTemplate.$id || ''
                            );
                          }
                        }}
                        className={`p-3 mb-2 ${currentTheme.border} rounded-lg border`}
                      >
                        <View className="flex-row items-center justify-between">
                          <View>
                            <Text className={`font-medium ${currentTheme.text}`}>
                              {student.firstName} {student.lastName}
                            </Text>
                            <Text className={`text-sm ${currentTheme.textMuted}`}>
                              {student.email}
                            </Text>
                          </View>
                          <ChevronRight size={20} color={currentTheme.textMuted} />
                        </View>
                      </TouchableOpacity>
                    ))
                  }
                </ScrollView>

                {students.filter(s => s.status === "in_progress" && !s.paymentTemplates).length === 0 && (
                  <View className="py-8 items-center">
                    <UserPlus size={32} color={currentTheme.textMuted} />
                    <Text className={`${currentTheme.text} mt-3`}>
                      No unassigned students available
                    </Text>
                    <Text className={`text-sm ${currentTheme.textMuted} mt-1 text-center`}>
                      All in_progress students already have payment templates assigned.
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>

            <TouchableOpacity
              onPress={() => {
                setShowAssignStudentModal(false);
                setSelectedTemplate(null);
              }}
              className={`w-full py-3 rounded-xl border ${currentTheme.border} items-center mt-6`}
            >
              <Text className={currentTheme.textMuted}>Cancel</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}