// app/student/[id].tsx - Student detail screen with tabs
import { api } from "@/lib/api";
import { useToast } from "@/lib/toast-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  FileText,
  Globe,
  GraduationCap,
  Mail,
  MessageCircle,
  Phone,
  Plane,
  RefreshCw,
  School,
  Send,
  User,
  XCircle,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeIn, SlideInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

type Tab = "overview" | "documents" | "payments" | "visa" | "comments";

const TABS: { key: Tab; label: string; icon: any }[] = [
  { key: "overview", label: "Overview", icon: User },
  { key: "documents", label: "Docs", icon: FileText },
  { key: "payments", label: "Payments", icon: CreditCard },
  { key: "visa", label: "Visa", icon: Plane },
  { key: "comments", label: "Notes", icon: MessageCircle },
];

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  new: { color: "#3b82f6", bg: "bg-blue-500/15", label: "New" },
  in_progress: { color: "#f59e0b", bg: "bg-amber-500/15", label: "In Progress" },
  in_process: { color: "#f59e0b", bg: "bg-amber-500/15", label: "In Process" },
  qualified: { color: "#8b5cf6", bg: "bg-purple-500/15", label: "Qualified" },
  approved: { color: "#10b981", bg: "bg-emerald-500/15", label: "Approved" },
  rejected: { color: "#ef4444", bg: "bg-red-500/15", label: "Rejected" },
  pending: { color: "#f59e0b", bg: "bg-amber-500/15", label: "Pending" },
  received: { color: "#10b981", bg: "bg-emerald-500/15", label: "Received" },
  failed: { color: "#ef4444", bg: "bg-red-500/15", label: "Failed" },
  processing: { color: "#8b5cf6", bg: "bg-purple-500/15", label: "Processing" },
  under_review: { color: "#3b82f6", bg: "bg-blue-500/15", label: "Under Review" },
};

export default function StudentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [student, setStudent] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [visa, setVisa] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [sendingComment, setSendingComment] = useState(false);

  const fetchStudent = useCallback(async () => {
    try {
      const result = await api.getStudent(id);
      if (result.success && result.data) {
        setStudent(result.data);
      } else {
        showToast("Student not found", "error");
        router.back();
      }
    } catch {
      showToast("Failed to load student", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, showToast, router]);

  const fetchTabData = useCallback(async (tab: Tab) => {
    try {
      switch (tab) {
        case "documents": {
          const res = await api.getStudentDocuments(id);
          if (res.success) setDocuments(res.data?.documents || res.data || []);
          break;
        }
        case "payments": {
          const [payRes, summaryRes] = await Promise.all([
            api.getStudentPayments(id),
            api.getStudentPaymentSummary(id),
          ]);
          if (payRes.success) setPayments(payRes.data?.documents || payRes.data || []);
          if (summaryRes.success) setPaymentSummary(summaryRes.data);
          break;
        }
        case "visa": {
          const res = await api.getStudentVisa(id);
          if (res.success) setVisa(res.data);
          break;
        }
        case "comments": {
          const res = await api.getStudentComments(id);
          if (res.success) setComments(res.data?.comments || res.data || []);
          break;
        }
      }
    } catch {
      // Silently fail tab data loading
    }
  }, [id]);

  useEffect(() => {
    fetchStudent();
  }, [fetchStudent]);

  useEffect(() => {
    if (student) {
      fetchTabData(activeTab);
    }
  }, [activeTab, student, fetchTabData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStudent();
    fetchTabData(activeTab);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setSendingComment(true);
    try {
      const result = await api.addStudentComment(id, newComment.trim());
      if (result.success) {
        setNewComment("");
        showToast("Comment added", "success");
        fetchTabData("comments");
      } else {
        showToast(result.error || "Failed to add comment", "error");
      }
    } catch {
      showToast("Failed to add comment", "error");
    } finally {
      setSendingComment(false);
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount || 0);

  const getStatusConfig = (status: string) =>
    STATUS_CONFIG[status] || { color: "#6b7280", bg: "bg-gray-500/15", label: status };

  if (loading) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  if (!student) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <Text className="text-gray-500">Student not found</Text>
      </View>
    );
  }

  const statusConfig = getStatusConfig(student.leadStatus || student.status || "new");

  // ============ TAB CONTENT RENDERERS ============

  const renderOverview = () => (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      {/* Info Card */}
      <View className="mx-4 mb-4 p-4 rounded-2xl bg-[#111111] border border-[#1f1f1f]">
        <Text className="text-gray-500 text-xs font-semibold uppercase mb-3">Contact Info</Text>
        <InfoRow icon={Mail} label="Email" value={student.email} />
        <InfoRow icon={Phone} label="Phone" value={student.contact} />
        <InfoRow icon={Calendar} label="Date of Birth" value={formatDate(student.dateOfBirth)} />
        <InfoRow icon={Globe} label="Nationality" value={student.nationality} />
        <InfoRow icon={User} label="Gender" value={student.gender} />
      </View>

      {/* Academic Info */}
      <View className="mx-4 mb-4 p-4 rounded-2xl bg-[#111111] border border-[#1f1f1f]">
        <Text className="text-gray-500 text-xs font-semibold uppercase mb-3">Academic Info</Text>
        <InfoRow icon={GraduationCap} label="Last Degree" value={student.lastDegree} />
        <InfoRow icon={BookOpen} label="GPA" value={student.degreeGPA?.toString()} />
        <InfoRow icon={School} label="Institution" value={student.currentInstitution} />
      </View>

      {/* Country & University */}
      {(student.countries || student.universities) && (
        <View className="mx-4 mb-4 p-4 rounded-2xl bg-[#111111] border border-[#1f1f1f]">
          <Text className="text-gray-500 text-xs font-semibold uppercase mb-3">Destination</Text>
          {student.countries && (
            <InfoRow
              icon={Globe}
              label="Country"
              value={typeof student.countries === "string" ? student.countries : student.countries?.name}
            />
          )}
          {student.universities && (
            <InfoRow
              icon={School}
              label="University"
              value={typeof student.universities === "string" ? student.universities : student.universities?.name}
            />
          )}
          {student.courses && student.courses.length > 0 && (
            <InfoRow
              icon={BookOpen}
              label="Courses"
              value={student.courses.map((c: any) => c.name || c).join(", ")}
            />
          )}
        </View>
      )}

      {/* Address */}
      {(student.address || student.city) && (
        <View className="mx-4 mb-4 p-4 rounded-2xl bg-[#111111] border border-[#1f1f1f]">
          <Text className="text-gray-500 text-xs font-semibold uppercase mb-3">Address</Text>
          {student.address && <InfoRow icon={User} label="Address" value={student.address} />}
          {student.city && <InfoRow icon={User} label="City" value={student.city} />}
          {student.state && <InfoRow icon={User} label="State" value={student.state} />}
          {student.zipCode && <InfoRow icon={User} label="Zip Code" value={student.zipCode} />}
        </View>
      )}
      <View className="h-8" />
    </ScrollView>
  );

  const renderDocuments = () => (
    <FlatList
      data={Array.isArray(documents) ? documents : []}
      keyExtractor={(item, index) => item.$id || String(index)}
      contentContainerStyle={{ paddingBottom: 20 }}
      ListHeaderComponent={
        <View className="mx-4 mb-3 flex-row gap-2">
          <TouchableOpacity
            onPress={() => {
              api.sendDocumentRequest(id).then((res) => {
                showToast(
                  res.success ? "Document request sent!" : res.error || "Failed",
                  res.success ? "success" : "error"
                );
              });
            }}
            className="flex-1 bg-purple-600/20 border border-purple-500/30 rounded-xl py-3 items-center flex-row justify-center"
          >
            <Send size={14} color="#8b5cf6" />
            <Text className="text-purple-400 font-medium text-xs ml-1.5">Send Doc Request</Text>
          </TouchableOpacity>
        </View>
      }
      renderItem={({ item }) => {
        const docStatus = getStatusConfig(item.status || "pending");
        return (
          <View className="mx-4 mb-2 p-3 rounded-xl bg-[#111111] border border-[#1f1f1f]">
            <View className="flex-row items-center">
              <View className={`w-8 h-8 rounded-lg items-center justify-center ${docStatus.bg}`}>
                <FileText size={14} color={docStatus.color} />
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-white text-sm font-medium" numberOfLines={1}>
                  {item.documentName || item.name || "Document"}
                </Text>
                <Text className="text-gray-500 text-xs">{formatDate(item.$createdAt)}</Text>
              </View>
              <View className={`px-2 py-0.5 rounded-full ${docStatus.bg}`}>
                <Text style={{ color: docStatus.color }} className="text-[10px] font-semibold">
                  {docStatus.label}
                </Text>
              </View>
            </View>
          </View>
        );
      }}
      ListEmptyComponent={
        <View className="items-center py-16">
          <FileText size={40} color="#374151" />
          <Text className="text-gray-500 mt-3">No documents yet</Text>
        </View>
      }
    />
  );

  const renderPayments = () => (
    <FlatList
      data={Array.isArray(payments) ? payments : []}
      keyExtractor={(item, index) => item.$id || String(index)}
      contentContainerStyle={{ paddingBottom: 20 }}
      ListHeaderComponent={
        <>
          {paymentSummary && (
            <View className="mx-4 mb-4 flex-row gap-2">
              <View className="flex-1 p-3 rounded-xl bg-[#111111] border border-[#1f1f1f]">
                <Text className="text-gray-500 text-[10px]">Due</Text>
                <Text className="text-white font-bold">{formatCurrency(paymentSummary.totalDue || 0)}</Text>
              </View>
              <View className="flex-1 p-3 rounded-xl bg-[#111111] border border-[#1f1f1f]">
                <Text className="text-gray-500 text-[10px]">Received</Text>
                <Text className="text-emerald-400 font-bold">{formatCurrency(paymentSummary.totalReceived || 0)}</Text>
              </View>
              <View className="flex-1 p-3 rounded-xl bg-[#111111] border border-[#1f1f1f]">
                <Text className="text-gray-500 text-[10px]">Remaining</Text>
                <Text className="text-amber-400 font-bold">{formatCurrency(paymentSummary.remainingDue || 0)}</Text>
              </View>
            </View>
          )}
          <View className="mx-4 mb-3">
            <TouchableOpacity
              onPress={() => {
                api.sendPaymentRequest(id).then((res) => {
                  showToast(
                    res.success ? "Payment request sent!" : res.error || "Failed",
                    res.success ? "success" : "error"
                  );
                });
              }}
              className="bg-emerald-600/20 border border-emerald-500/30 rounded-xl py-3 items-center flex-row justify-center"
            >
              <Send size={14} color="#10b981" />
              <Text className="text-emerald-400 font-medium text-xs ml-1.5">Send Payment Request</Text>
            </TouchableOpacity>
          </View>
        </>
      }
      renderItem={({ item }) => {
        const payStatus = getStatusConfig(item.status || "pending");
        return (
          <View className="mx-4 mb-2 p-3 rounded-xl bg-[#111111] border border-[#1f1f1f]">
            <View className="flex-row items-center">
              <View className={`w-8 h-8 rounded-lg items-center justify-center ${payStatus.bg}`}>
                <DollarSign size={14} color={payStatus.color} />
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-white text-sm font-medium" numberOfLines={1}>
                  {item.description || item.name || "Payment"}
                </Text>
                <Text className="text-gray-500 text-xs">{formatDate(item.$createdAt)}</Text>
              </View>
              <View className="items-end">
                <Text className="text-white font-bold text-sm">{formatCurrency(item.amount || 0)}</Text>
                <View className={`px-2 py-0.5 rounded-full mt-0.5 ${payStatus.bg}`}>
                  <Text style={{ color: payStatus.color }} className="text-[10px] font-semibold">
                    {payStatus.label}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        );
      }}
      ListEmptyComponent={
        <View className="items-center py-16">
          <CreditCard size={40} color="#374151" />
          <Text className="text-gray-500 mt-3">No payments yet</Text>
        </View>
      }
    />
  );

  const renderVisa = () => (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      {visa ? (
        <View className="mx-4">
          <View className="p-4 rounded-2xl bg-[#111111] border border-[#1f1f1f] mb-4">
            <View className="flex-row items-center mb-4">
              <Plane size={20} color="#8b5cf6" />
              <Text className="text-white font-bold text-lg ml-2">Visa Application</Text>
            </View>
            <InfoRow icon={Globe} label="Status" value={visa.status} />
            <InfoRow icon={Globe} label="Type" value={visa.visaType || visa.type} />
            <InfoRow icon={Calendar} label="Applied" value={formatDate(visa.appliedDate || visa.$createdAt)} />
            <InfoRow icon={Calendar} label="Expiry" value={formatDate(visa.expiryDate)} />
            {visa.notes && <InfoRow icon={FileText} label="Notes" value={visa.notes} />}
          </View>
        </View>
      ) : (
        <View className="items-center py-16">
          <Plane size={40} color="#374151" />
          <Text className="text-gray-500 mt-3">No visa application</Text>
        </View>
      )}
    </ScrollView>
  );

  const renderComments = () => (
    <View className="flex-1">
      <FlatList
        data={Array.isArray(comments) ? comments : []}
        keyExtractor={(item, index) => item.$id || String(index)}
        contentContainerStyle={{ paddingBottom: 80 }}
        renderItem={({ item }) => (
          <View className="mx-4 mb-3 p-3 rounded-xl bg-[#111111] border border-[#1f1f1f]">
            <View className="flex-row items-center mb-2">
              <View className="w-7 h-7 rounded-full bg-purple-600/30 items-center justify-center">
                <Text className="text-purple-400 text-[10px] font-bold">
                  {(item.userName || item.user?.name || "U")[0].toUpperCase()}
                </Text>
              </View>
              <Text className="text-gray-400 text-xs ml-2 flex-1">
                {item.userName || item.user?.name || "User"}
              </Text>
              <Text className="text-gray-600 text-[10px]">{formatDate(item.$createdAt)}</Text>
            </View>
            <Text className="text-gray-300 text-sm">{item.content || item.text}</Text>
          </View>
        )}
        ListEmptyComponent={
          <View className="items-center py-16">
            <MessageCircle size={40} color="#374151" />
            <Text className="text-gray-500 mt-3">No comments yet</Text>
          </View>
        }
      />
      {/* Add Comment Input */}
      <Animated.View
        entering={SlideInDown.duration(300)}
        className="absolute bottom-0 left-0 right-0 p-4 bg-[#0a0a0a] border-t border-[#1f1f1f]"
      >
        <View className="flex-row items-center bg-[#111111] border border-[#1f1f1f] rounded-xl px-3">
          <TextInput
            className="flex-1 text-white py-3 text-sm"
            placeholder="Add a comment..."
            placeholderTextColor="#6b7280"
            value={newComment}
            onChangeText={setNewComment}
            multiline
          />
          <TouchableOpacity
            onPress={handleAddComment}
            disabled={sendingComment || !newComment.trim()}
            className="ml-2 p-2"
          >
            {sendingComment ? (
              <ActivityIndicator size="small" color="#8b5cf6" />
            ) : (
              <Send size={18} color={newComment.trim() ? "#8b5cf6" : "#4b5563"} />
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview": return renderOverview();
      case "documents": return renderDocuments();
      case "payments": return renderPayments();
      case "visa": return renderVisa();
      case "comments": return renderComments();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Header */}
      <View className="px-4 pt-2 pb-3 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <ArrowLeft size={22} color="white" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-white font-bold text-lg" numberOfLines={1}>
            {student.firstName} {student.lastName}
          </Text>
          <View className="flex-row items-center mt-0.5">
            <View className={`px-2 py-0.5 rounded-full ${statusConfig.bg}`}>
              <Text style={{ color: statusConfig.color }} className="text-[10px] font-semibold">
                {statusConfig.label}
              </Text>
            </View>
            <Text className="text-gray-500 text-xs ml-2">ID: {id.slice(0, 8)}...</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onRefresh} className="p-2">
          <RefreshCw size={18} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* Tab Bar */}
      <View className="flex-row px-4 mb-3">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                className={`mr-2 px-4 py-2 rounded-xl flex-row items-center ${
                  isActive ? "bg-purple-600" : "bg-[#1a1a1a]"
                }`}
              >
                <Icon size={14} color={isActive ? "white" : "#6b7280"} />
                <Text
                  className={`text-xs font-medium ml-1.5 ${
                    isActive ? "text-white" : "text-gray-400"
                  }`}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Tab Content */}
      {renderTabContent()}
    </SafeAreaView>
  );
}

// Helper component for info rows
function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value?: string | null;
}) {
  if (!value || value === "N/A") return null;
  return (
    <View className="flex-row items-start mb-3">
      <Icon size={14} color="#6b7280" className="mt-0.5" />
      <View className="ml-3 flex-1">
        <Text className="text-gray-500 text-[10px] uppercase">{label}</Text>
        <Text className="text-white text-sm">{value}</Text>
      </View>
    </View>
  );
}
