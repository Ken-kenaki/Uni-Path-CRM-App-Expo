// app/(tabs)/payments.tsx - Payments management screen
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  RefreshCw,
  Search,
  TrendingUp,
  XCircle,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

interface Payment {
  $id: string;
  amount: number;
  status: "pending" | "received" | "failed" | "overdue";
  paymentMethod?: string;
  description?: string;
  dueDate?: string;
  paidDate?: string;
  $createdAt: string;
  student?: {
    $id: string;
    firstName: string;
    lastName: string;
  };
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: any; label: string }> = {
  received: { color: "#10b981", bg: "bg-emerald-500/15", icon: CheckCircle, label: "Received" },
  pending: { color: "#f59e0b", bg: "bg-amber-500/15", icon: Clock, label: "Pending" },
  failed: { color: "#ef4444", bg: "bg-red-500/15", icon: XCircle, label: "Failed" },
  overdue: { color: "#ef4444", bg: "bg-red-500/15", icon: XCircle, label: "Overdue" },
};

export default function PaymentsScreen() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const fetchPayments = useCallback(async () => {
    try {
      const result = await api.getPayments();
      if (result.success && result.data) {
        const items = Array.isArray(result.data) ? result.data : result.data.documents || [];
        setPayments(items);
      }
    } catch (error) {
      showToast("Failed to load payments", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPayments();
  };

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      !search ||
      p.student?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      p.student?.lastName?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || p.status === filter;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
    received: payments.filter((p) => p.status === "received").reduce((sum, p) => sum + (p.amount || 0), 0),
    pending: payments.filter((p) => p.status === "pending").reduce((sum, p) => sum + (p.amount || 0), 0),
    count: payments.length,
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
  };

  const formatDate = (date?: string) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const renderPaymentCard = ({ item }: { item: Payment }) => {
    const config = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
    const Icon = config.icon;

    return (
      <Animated.View entering={FadeIn.duration(300)}>
        <TouchableOpacity
          className="mx-4 mb-3 p-4 rounded-2xl bg-[#111111] border border-[#1f1f1f]"
          onPress={() => {
            if (item.student?.$id) {
              router.push(`/student/${item.student.$id}` as any);
            }
          }}
          activeOpacity={0.7}
        >
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center flex-1">
              <View
                className={`w-10 h-10 rounded-xl items-center justify-center ${config.bg}`}
              >
                <Icon size={18} color={config.color} />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-white font-semibold text-[15px]" numberOfLines={1}>
                  {item.student?.firstName} {item.student?.lastName}
                </Text>
                <Text className="text-gray-500 text-xs mt-0.5" numberOfLines={1}>
                  {item.description || "Payment"}
                </Text>
              </View>
            </View>
            <View className="items-end">
              <Text className="text-white font-bold text-[16px]">
                {formatCurrency(item.amount || 0)}
              </Text>
              <View className={`px-2 py-0.5 rounded-full mt-1 ${config.bg}`}>
                <Text style={{ color: config.color }} className="text-[10px] font-semibold">
                  {config.label}
                </Text>
              </View>
            </View>
          </View>

          <View className="flex-row items-center pt-3 border-t border-[#1f1f1f]">
            <Calendar size={12} color="#6b7280" />
            <Text className="text-gray-500 text-xs ml-1.5">
              {item.status === "received" ? `Paid ${formatDate(item.paidDate || item.$createdAt)}` : `Due ${formatDate(item.dueDate)}`}
            </Text>
            {item.paymentMethod && (
              <>
                <View className="w-1 h-1 bg-gray-600 rounded-full mx-2" />
                <CreditCard size={12} color="#6b7280" />
                <Text className="text-gray-500 text-xs ml-1 capitalize">{item.paymentMethod}</Text>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Header */}
      <View className="px-4 pt-2 pb-4">
        <Text className="text-2xl font-bold text-white">Payments</Text>
        <Text className="text-gray-500 text-sm mt-1">Track all payment records</Text>
      </View>

      {/* Stats Cards */}
      <View className="flex-row px-4 mb-4">
        <View className="flex-1 mr-2 p-3 rounded-xl bg-[#111111] border border-[#1f1f1f]">
          <View className="flex-row items-center mb-1">
            <DollarSign size={14} color="#10b981" />
            <Text className="text-gray-500 text-xs ml-1">Received</Text>
          </View>
          <Text className="text-emerald-400 font-bold text-lg">{formatCurrency(stats.received)}</Text>
        </View>
        <View className="flex-1 ml-1 mr-1 p-3 rounded-xl bg-[#111111] border border-[#1f1f1f]">
          <View className="flex-row items-center mb-1">
            <Clock size={14} color="#f59e0b" />
            <Text className="text-gray-500 text-xs ml-1">Pending</Text>
          </View>
          <Text className="text-amber-400 font-bold text-lg">{formatCurrency(stats.pending)}</Text>
        </View>
        <View className="flex-1 ml-2 p-3 rounded-xl bg-[#111111] border border-[#1f1f1f]">
          <View className="flex-row items-center mb-1">
            <TrendingUp size={14} color="#8b5cf6" />
            <Text className="text-gray-500 text-xs ml-1">Total</Text>
          </View>
          <Text className="text-purple-400 font-bold text-lg">{formatCurrency(stats.total)}</Text>
        </View>
      </View>

      {/* Search */}
      <View className="mx-4 mb-3 flex-row items-center bg-[#111111] border border-[#1f1f1f] rounded-xl px-3">
        <Search size={18} color="#6b7280" />
        <TextInput
          className="flex-1 text-white py-3 px-2 text-sm"
          placeholder="Search payments..."
          placeholderTextColor="#6b7280"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filter Chips */}
      <View className="flex-row px-4 mb-3">
        {["all", "received", "pending", "failed"].map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            className={`mr-2 px-3 py-1.5 rounded-full ${
              filter === f ? "bg-purple-600" : "bg-[#1a1a1a]"
            }`}
          >
            <Text
              className={`text-xs font-medium capitalize ${
                filter === f ? "text-white" : "text-gray-400"
              }`}
            >
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Payments List */}
      <FlatList
        data={filteredPayments}
        keyExtractor={(item) => item.$id}
        renderItem={renderPaymentCard}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8b5cf6" />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <CreditCard size={48} color="#374151" />
            <Text className="text-gray-500 mt-4 text-center">No payments found</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
