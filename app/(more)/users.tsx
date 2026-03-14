// app/(more)/users.tsx - User management screen
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  ChevronRight,
  Mail,
  Phone,
  Search,
  Shield,
  Users,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

interface UserItem {
  $id: string;
  userId: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: string;
  status?: string;
  contact?: string;
  branches?: any[];
}

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  admin: { bg: "bg-purple-500/15", text: "text-purple-400" },
  branchAdmin: { bg: "bg-blue-500/15", text: "text-blue-400" },
  staff: { bg: "bg-green-500/15", text: "text-green-400" },
  counselor: { bg: "bg-amber-500/15", text: "text-amber-400" },
  owner: { bg: "bg-red-500/15", text: "text-red-400" },
};

export default function UsersScreen() {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const fetchUsers = useCallback(async () => {
    try {
      const result = await api.getUsers();
      if (result.success && result.data) {
        const items = Array.isArray(result.data)
          ? result.data
          : result.data.documents || result.data.users || [];
        setUsers(items);
      }
    } catch {
      showToast("Failed to load users", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filtered = users.filter((u) => {
    const name = u.name || `${u.firstName || ""} ${u.lastName || ""}`.trim();
    const matchesSearch =
      !search ||
      name.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getInitials = (u: UserItem) => {
    const name = u.name || `${u.firstName || ""} ${u.lastName || ""}`.trim();
    return name
      .split(" ")
      .map((w: string) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";
  };

  const getName = (u: UserItem) => {
    return u.name || `${u.firstName || ""} ${u.lastName || ""}`.trim() || "Unknown";
  };

  const renderItem = ({ item }: { item: UserItem }) => {
    const roleStyle = ROLE_COLORS[item.role] || ROLE_COLORS.staff;

    return (
      <Animated.View entering={FadeIn.duration(300)}>
        <View className="mx-4 mb-3 p-4 rounded-2xl bg-[#111111] border border-[#1f1f1f]">
          <View className="flex-row items-center">
            <View className="w-12 h-12 rounded-xl bg-purple-600 items-center justify-center">
              <Text className="text-white font-bold">{getInitials(item)}</Text>
            </View>
            <View className="flex-1 ml-3">
              <View className="flex-row items-center">
                <Text className="text-white font-semibold text-[15px]" numberOfLines={1}>
                  {getName(item)}
                </Text>
                {item.userId === currentUser?.userId && (
                  <View className="ml-2 px-1.5 py-0.5 rounded bg-purple-500/20">
                    <Text className="text-purple-400 text-[9px] font-bold">YOU</Text>
                  </View>
                )}
              </View>
              <View className="flex-row items-center mt-1">
                <Mail size={12} color="#6b7280" />
                <Text className="text-gray-500 text-xs ml-1" numberOfLines={1}>
                  {item.email}
                </Text>
              </View>
            </View>
            <View className="items-end">
              <View className={`px-2 py-0.5 rounded-full ${roleStyle.bg}`}>
                <Text className={`text-[10px] font-semibold capitalize ${roleStyle.text}`}>
                  {item.role === "branchAdmin" ? "Branch Admin" : item.role}
                </Text>
              </View>
              {item.status && (
                <View
                  className={`w-2 h-2 rounded-full mt-1.5 ${
                    item.status === "active" ? "bg-emerald-500" : "bg-gray-500"
                  }`}
                />
              )}
            </View>
          </View>
        </View>
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
      <View className="flex-row items-center px-4 pt-2 pb-4">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <ArrowLeft size={22} color="white" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-xl font-bold text-white">Users</Text>
          <Text className="text-gray-500 text-xs">{users.length} total</Text>
        </View>
      </View>

      <View className="mx-4 mb-3 flex-row items-center bg-[#111111] border border-[#1f1f1f] rounded-xl px-3">
        <Search size={18} color="#6b7280" />
        <TextInput
          className="flex-1 text-white py-3 px-2 text-sm"
          placeholder="Search users..."
          placeholderTextColor="#6b7280"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View className="flex-row px-4 mb-3">
        {["all", "admin", "branchAdmin", "staff"].map((r) => (
          <TouchableOpacity
            key={r}
            onPress={() => setRoleFilter(r)}
            className={`mr-2 px-3 py-1.5 rounded-full ${
              roleFilter === r ? "bg-purple-600" : "bg-[#1a1a1a]"
            }`}
          >
            <Text
              className={`text-xs font-medium capitalize ${
                roleFilter === r ? "text-white" : "text-gray-400"
              }`}
            >
              {r === "branchAdmin" ? "Branch Admin" : r}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.$id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchUsers(); }}
            tintColor="#8b5cf6"
          />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Users size={48} color="#374151" />
            <Text className="text-gray-500 mt-4">No users found</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
