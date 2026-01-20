// app/(tabs)/branches.tsx
import { API_URL } from "@/config";
import { Theme, themeConfigs } from "@/theme";
import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import * as MediaLibrary from "expo-media-library";
import { useRouter } from "expo-router";
import {
    Activity,
    Building2,
    Calendar,
    CheckCircle,
    Copy,
    Download,
    Edit,
    Eye,
    EyeOff,
    Mail,
    MapPin,
    MoreVertical,
    Phone,
    Plus,
    QrCode,
    Search,
    Share2,
    Trash2,
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
    Clipboard,
    Dimensions,
    FlatList,
    Modal,
    RefreshControl,
    ScrollView,
    Share,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import QRCode from "react-native-qrcode";
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

interface Branch {
  id: string;
  $id: string;
  name: string;
  location: string;
  email: string;
  contactNumber: string;
  status: "active" | "inactive";
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

interface BranchFormData {
  name: string;
  location: string;
  email: string;
  contactNumber: string;
  status: "active" | "inactive";
}

interface Organization {
  id: string;
  name: string;
  maxUsers: number;
  activeUsersCount: number;
  maxBranches: number;
  activeBranchesCount: number;
}

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | undefined>();
  const [selectedBranchForQR, setSelectedBranchForQR] = useState<Branch | null>(
    null,
  );
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>("dark");
  const [branchFormData, setBranchFormData] = useState<BranchFormData>({
    name: "",
    location: "",
    email: "",
    contactNumber: "",
    status: "active",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const router = useRouter();
  const currentTheme = themeConfigs[theme];
  const flatListRef = useRef<FlatList>(null);
  const qrCodeRef = useRef<any>(null);

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

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/current`);
      const result = await response.json();
      if (result.success) {
        setCurrentUser(result.user);
        if (result.user.organizationId) {
          fetchOrganization(result.user.organizationId);
        }
      }
    } catch (error) {
      console.error("Error fetching current user:", error);
    }
  };

  const fetchOrganization = async (organizationId: string) => {
    try {
      const response = await fetch(
        `${API_URL}/dashboard/organizations/${organizationId}`,
      );
      const result = await response.json();
      if (result.success) {
        setOrganization(result.data);
      }
    } catch (error) {
      console.error("Error fetching organization:", error);
    }
  };

  const fetchBranches = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (filterStatus !== "all") params.append("status", filterStatus);

      const response = await fetch(`${API_URL}/dashboard/branches?${params}`);
      const result = await response.json();

      if (result.success) {
        setBranches(result.data || []);
      } else {
        showToast("Failed to fetch branches", "error");
      }
    } catch (error) {
      console.error("Error fetching branches:", error);
      showToast("Error fetching branches", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, filterStatus, showToast]);

  useEffect(() => {
    fetchCurrentUser();
    fetchBranches();
  }, [fetchBranches]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    showToast("Refreshing branches...", "info");
    fetchBranches();
  }, [fetchBranches, showToast]);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!branchFormData.name.trim()) {
      errors.name = "Branch name is required";
    }

    if (!branchFormData.location.trim()) {
      errors.location = "Location is required";
    }

    if (!branchFormData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(branchFormData.email)) {
      errors.email = "Invalid email format";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveBranch = async () => {
    if (!validateForm()) return;

    try {
      const url = editingBranch
        ? `${API_URL}/dashboard/branches/${editingBranch.id}`
        : `${API_URL}/dashboard/branches`;

      const method = editingBranch ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(branchFormData),
      });

      const result = await response.json();

      if (result.success) {
        showToast(
          editingBranch
            ? "Branch updated successfully"
            : "Branch created successfully",
          "success",
        );
        setIsModalOpen(false);
        setEditingBranch(undefined);
        setBranchFormData({
          name: "",
          location: "",
          email: "",
          contactNumber: "",
          status: "active",
        });
        fetchBranches();
        if (organization) {
          fetchOrganization(organization.id);
        }
      } else {
        showToast(result.error || "Failed to save branch", "error");
      }
    } catch (error) {
      console.error("Error saving branch:", error);
      showToast("Error saving branch", "error");
    }
  };

  const handleDeleteBranch = async (branchId: string) => {
    const branch = branches.find((b) => b.id === branchId);
    if (!branch) return;

    Alert.alert(
      "Deactivate Branch",
      `Are you sure you want to deactivate "${branch.name}"? This will make the branch inactive.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Deactivate",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(
                `${API_URL}/dashboard/branches/${branchId}`,
                {
                  method: "DELETE",
                },
              );

              const result = await response.json();

              if (result.success) {
                showToast("Branch deactivated successfully", "success");
                fetchBranches();
                if (organization) {
                  fetchOrganization(organization.id);
                }
              } else {
                showToast(
                  result.error || "Failed to deactivate branch",
                  "error",
                );
              }
            } catch (error) {
              console.error("Error deleting branch:", error);
              showToast("Error deactivating branch", "error");
            }
          },
        },
      ],
    );
  };

  const handleToggleStatus = async (
    branchId: string,
    currentStatus: string,
  ) => {
    const branch = branches.find((b) => b.id === branchId);
    if (!branch) return;

    const newStatus = currentStatus === "active" ? "inactive" : "active";
    const action = newStatus === "active" ? "activate" : "deactivate";

    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} Branch`,
      `Are you sure you want to ${action} "${branch.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          onPress: async () => {
            try {
              const response = await fetch(
                `${API_URL}/dashboard/branches/${branchId}`,
                {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    status: newStatus,
                  }),
                },
              );

              const result = await response.json();

              if (result.success) {
                showToast(`Branch ${action}d successfully`, "success");
                fetchBranches();
              } else {
                showToast(
                  result.error || `Failed to ${action} branch`,
                  "error",
                );
              }
            } catch (error) {
              console.error("Error toggling branch status:", error);
              showToast(`Error ${action}ing branch`, "error");
            }
          },
        },
      ],
    );
  };

  const downloadQRCode = async () => {
    if (!qrCodeRef.current || !selectedBranchForQR) return;

    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        showToast("Permission needed to save images", "error");
        return;
      }

      qrCodeRef.current?.toDataURL(async (dataURL: string) => {
        try {
          const filename = `${selectedBranchForQR.name
            .replace(/\s+/g, "-")
            .toLowerCase()}-student-registration-qr.png`;
          const fileUri = FileSystem.documentDirectory + filename;

          await FileSystem.writeAsStringAsync(fileUri, dataURL.split(",")[1], {
            encoding: FileSystem.EncodingType.Base64,
          });

          const asset = await MediaLibrary.createAssetAsync(fileUri);
          await MediaLibrary.createAlbumAsync("QR Codes", asset, false);

          showToast("QR code saved to gallery", "success");
        } catch (error) {
          console.error("Error saving QR code:", error);
          showToast("Failed to save QR code", "error");
        }
      });
    } catch (error) {
      console.error("Error downloading QR code:", error);
      showToast("Error downloading QR code", "error");
    }
  };

  const copyToClipboard = () => {
    if (!selectedBranchForQR) return;

    const studentRegistrationUrl = `${API_URL}/students/${selectedBranchForQR.id}`;
    Clipboard.setString(studentRegistrationUrl);
    showToast("URL copied to clipboard", "success");
  };

  const shareQR = async () => {
    if (!selectedBranchForQR) return;

    const studentRegistrationUrl = `${API_URL}/students/${selectedBranchForQR.id}`;

    try {
      await Share.share({
        title: `Student Registration - ${selectedBranchForQR.name}`,
        message: `Scan to register as a student at ${selectedBranchForQR.name}: ${studentRegistrationUrl}`,
        url: studentRegistrationUrl,
      });
    } catch (error) {
      console.error("Error sharing:", error);
      copyToClipboard();
    }
  };

  const openCreateModal = () => {
    if (
      organization &&
      organization.activeBranchesCount >= organization.maxBranches
    ) {
      showToast(
        `Organization branch limit reached. Maximum ${organization.maxBranches} branches allowed.`,
        "error",
      );
      return;
    }
    setEditingBranch(undefined);
    setBranchFormData({
      name: "",
      location: "",
      email: "",
      contactNumber: "",
      status: "active",
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (branch: Branch) => {
    setEditingBranch(branch);
    setBranchFormData({
      name: branch.name,
      location: branch.location,
      email: branch.email,
      contactNumber: branch.contactNumber || "",
      status: branch.status,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openQRModal = (branch: Branch) => {
    setSelectedBranchForQR(branch);
    setQrModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const filteredBranches = useMemo(() => {
    return branches.filter((branch) => {
      if (filterStatus !== "all" && branch.status !== filterStatus)
        return false;
      if (!searchQuery) return true;

      const searchLower = searchQuery.toLowerCase();
      return (
        branch.name.toLowerCase().includes(searchLower) ||
        branch.location.toLowerCase().includes(searchLower) ||
        branch.email.toLowerCase().includes(searchLower) ||
        (branch.contactNumber &&
          branch.contactNumber.toLowerCase().includes(searchLower))
      );
    });
  }, [branches, searchQuery, filterStatus]);

  const stats = [
    {
      icon: Building2,
      label: "Total Branches",
      value: branches.length.toString(),
      color: "bg-purple-500",
    },
    {
      icon: Activity,
      label: "Active Branches",
      value: branches.filter((b) => b.status === "active").length.toString(),
      color: "bg-green-500",
    },
    {
      icon: Users,
      label: "Organization",
      value: organization?.name || "N/A",
      color: "bg-blue-500",
    },
  ];

  const BranchCard = ({ branch }: { branch: Branch }) => {
    const StatusBadge = ({ status }: { status: "active" | "inactive" }) => (
      <View
        className={`px-2 py-1 rounded-full flex-row items-center gap-1 ${
          status === "active"
            ? "bg-green-100 dark:bg-green-500/20"
            : "bg-gray-100 dark:bg-gray-500/20"
        }`}
      >
        {status === "active" ? (
          <CheckCircle size={12} color="#10b981" />
        ) : (
          <XCircle size={12} color="#6b7280" />
        )}
        <Text
          className={`text-xs font-medium ${
            status === "active"
              ? "text-green-600 dark:text-green-400"
              : "text-gray-600 dark:text-gray-400"
          }`}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Text>
      </View>
    );

    return (
      <Animated.View
        entering={ZoomIn.duration(300)}
        exiting={ZoomOut.duration(300)}
        className={`m-2 p-4 rounded-2xl ${currentTheme.card} border ${currentTheme.border}`}
        style={{ width: (width - 32) / 2 - 8 }}
      >
        <View className="flex-row justify-between items-start mb-4">
          <View className="flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 items-center justify-center">
              <Building2 size={20} color="white" />
            </View>
            <View>
              <Text
                className={`font-semibold ${currentTheme.text}`}
                numberOfLines={1}
              >
                {branch.name}
              </Text>
              <StatusBadge status={branch.status} />
            </View>
          </View>

          <TouchableOpacity
            onPress={() =>
              setOpenDropdownId(openDropdownId === branch.id ? null : branch.id)
            }
            className="p-1"
          >
            <MoreVertical size={20} color={currentTheme.textMuted} />
          </TouchableOpacity>
        </View>

        {openDropdownId === branch.id && (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            className="absolute right-2 top-12 z-10 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700"
          >
            <View className="p-1 space-y-1">
              <TouchableOpacity
                onPress={() => {
                  openEditModal(branch);
                  setOpenDropdownId(null);
                }}
                className="flex-row items-center px-3 py-2"
              >
                <Edit size={16} color={currentTheme.text} />
                <Text className={`ml-2 ${currentTheme.text}`}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  openQRModal(branch);
                  setOpenDropdownId(null);
                }}
                className="flex-row items-center px-3 py-2"
              >
                <QrCode size={16} color={currentTheme.text} />
                <Text className={`ml-2 ${currentTheme.text}`}>QR Code</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  handleToggleStatus(branch.id, branch.status);
                  setOpenDropdownId(null);
                }}
                className="flex-row items-center px-3 py-2"
              >
                {branch.status === "active" ? (
                  <>
                    <EyeOff size={16} color="#f59e0b" />
                    <Text className="ml-2 text-yellow-600">Deactivate</Text>
                  </>
                ) : (
                  <>
                    <Eye size={16} color="#10b981" />
                    <Text className="ml-2 text-green-600">Activate</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  handleDeleteBranch(branch.id);
                  setOpenDropdownId(null);
                }}
                className="flex-row items-center px-3 py-2"
              >
                <Trash2 size={16} color="#ef4444" />
                <Text className="ml-2 text-red-500">Delete</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        <View className="space-y-2 mb-4">
          <View className="flex-row items-center">
            <MapPin size={16} color={currentTheme.textMuted} />
            <Text
              className={`text-sm ${currentTheme.textMuted} ml-2 flex-1`}
              numberOfLines={2}
            >
              {branch.location}
            </Text>
          </View>

          <View className="flex-row items-center">
            <Mail size={16} color={currentTheme.textMuted} />
            <Text
              className={`text-sm ${currentTheme.textMuted} ml-2 flex-1`}
              numberOfLines={1}
            >
              {branch.email}
            </Text>
          </View>

          {branch.contactNumber && (
            <View className="flex-row items-center">
              <Phone size={16} color={currentTheme.textMuted} />
              <Text
                className={`text-sm ${currentTheme.textMuted} ml-2 flex-1`}
                numberOfLines={1}
              >
                {branch.contactNumber}
              </Text>
            </View>
          )}
        </View>

        <View
          className={`flex-row justify-between items-center pt-3 border-t ${currentTheme.border}`}
        >
          <View className="flex-row items-center">
            <Calendar size={14} color={currentTheme.textMuted} />
            <Text className={`text-xs ${currentTheme.textMuted} ml-1`}>
              {formatDate(branch.createdAt)}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => openQRModal(branch)}
            className="p-1.5 bg-purple-100 dark:bg-purple-500/20 rounded-lg"
          >
            <QrCode size={16} color="#8b5cf6" />
          </TouchableOpacity>
        </View>
      </Animated.View>
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
    <View
      className={`${currentTheme.card} rounded-lg p-4 ${currentTheme.border}`}
    >
      <View className="flex-row items-center justify-between">
        <View>
          <Text className={`text-2xl font-bold ${currentTheme.text}`}>
            {value}
          </Text>
          <Text className={`text-sm ${currentTheme.textMuted}`}>{title}</Text>
        </View>
        <View
          className={`w-10 h-10 rounded-lg ${color} items-center justify-center`}
        >
          <Icon size={20} color="white" />
        </View>
      </View>
    </View>
  );

  if (loading && branches.length === 0) {
    return (
      <SafeAreaView
        className={`flex-1 ${currentTheme.background} items-center justify-center`}
      >
        <ActivityIndicator size="large" color={currentTheme.primary} />
        <Text className={`mt-4 ${currentTheme.text}`}>Loading branches...</Text>
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
        <View className="flex-row justify-between items-center mb-4">
          <View>
            <Text className={`text-2xl font-bold ${currentTheme.text}`}>
              Branch Management
            </Text>
            <Text className={`text-sm ${currentTheme.textMuted} mt-1`}>
              Manage your organization branches
            </Text>
          </View>

          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={onRefresh}
              className="p-2.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <Activity size={20} color={currentTheme.textMuted} />
            </TouchableOpacity>

            {currentUser?.role === "admin" && (
              <TouchableOpacity
                onPress={openCreateModal}
                disabled={
                  organization &&
                  organization.activeBranchesCount >= organization.maxBranches
                }
                className="flex-row items-center gap-2 px-4 py-2.5 bg-purple-600 rounded-lg"
              >
                <Plus size={20} color="white" />
                <Text className="text-white font-medium">Add</Text>
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
            placeholder="Search branches..."
            placeholderTextColor={currentTheme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            className={`pl-10 pr-4 py-3 ${currentTheme.card} rounded-xl border ${currentTheme.border} ${currentTheme.text}`}
          />
        </View>

        {/* Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-6"
        >
          <View className="flex-row gap-2">
            {["all", "active", "inactive"].map((status) => (
              <TouchableOpacity
                key={status}
                onPress={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-lg ${
                  filterStatus === status
                    ? "bg-purple-600"
                    : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                }`}
              >
                <Text
                  className={
                    filterStatus === status ? "text-white" : currentTheme.text
                  }
                >
                  {status === "all"
                    ? "All"
                    : status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
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

      {/* Branches Grid */}
      <FlatList
        ref={flatListRef}
        data={filteredBranches}
        numColumns={2}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <BranchCard branch={item} />}
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
            <Building2 size={48} color={currentTheme.textMuted} />
            <Text className={`text-lg font-medium mt-4 ${currentTheme.text}`}>
              {searchQuery ? "No matching branches found" : "No branches yet"}
            </Text>
            <Text
              className={`text-sm ${currentTheme.textMuted} mt-2 text-center`}
            >
              {searchQuery
                ? "Try a different search term"
                : "Get started by creating your first branch"}
            </Text>
            {!searchQuery && currentUser?.role === "admin" && (
              <TouchableOpacity
                onPress={openCreateModal}
                className="mt-4 px-4 py-2 bg-purple-600 rounded-lg"
              >
                <Text className="text-white">Create Branch</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* Branch Form Modal */}
      <Modal visible={isModalOpen} animationType="slide" transparent={true}>
        <View className="flex-1 bg-black/50 justify-end">
          <Animated.View
            entering={SlideInDown.duration(300)}
            exiting={SlideOutDown.duration(200)}
            className={`${currentTheme.card} rounded-t-3xl p-6 max-h-[85vh]`}
          >
            <View className="flex-row justify-between items-center mb-6">
              <Text className={`text-xl font-bold ${currentTheme.text}`}>
                {editingBranch ? "Edit Branch" : "Create Branch"}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setIsModalOpen(false);
                  setEditingBranch(undefined);
                  setBranchFormData({
                    name: "",
                    location: "",
                    email: "",
                    contactNumber: "",
                    status: "active",
                  });
                  setFormErrors({});
                }}
              >
                <X size={24} color={currentTheme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {organization && !editingBranch && (
                <View className="mb-4 p-3 bg-blue-100 dark:bg-blue-500/20 rounded-lg">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-blue-800 dark:text-blue-400 text-sm">
                      Organization Capacity
                    </Text>
                    <Text className="font-medium text-blue-900 dark:text-blue-300">
                      {organization.activeBranchesCount} /{" "}
                      {organization.maxBranches} branches
                    </Text>
                  </View>
                  {organization.activeBranchesCount >=
                    organization.maxBranches && (
                    <Text className="text-xs text-red-600 dark:text-red-400 mt-2">
                      ⚠️ Maximum branch limit reached. Upgrade plan to add more
                      branches.
                    </Text>
                  )}
                </View>
              )}

              <View className="space-y-4">
                <View>
                  <Text className={`font-medium mb-2 ${currentTheme.text}`}>
                    Branch Name *
                  </Text>
                  <TextInput
                    placeholder="Enter branch name"
                    placeholderTextColor={currentTheme.textMuted}
                    value={branchFormData.name}
                    onChangeText={(text) => {
                      setBranchFormData({ ...branchFormData, name: text });
                      if (formErrors.name)
                        setFormErrors({ ...formErrors, name: "" });
                    }}
                    className={`px-4 py-3 rounded-xl border ${
                      formErrors.name ? "border-red-500" : currentTheme.border
                    } ${currentTheme.text} ${currentTheme.card}`}
                  />
                  {formErrors.name && (
                    <Text className="text-red-500 text-xs mt-1">
                      {formErrors.name}
                    </Text>
                  )}
                </View>

                <View>
                  <Text className={`font-medium mb-2 ${currentTheme.text}`}>
                    Location *
                  </Text>
                  <TextInput
                    placeholder="Enter branch location"
                    placeholderTextColor={currentTheme.textMuted}
                    value={branchFormData.location}
                    onChangeText={(text) => {
                      setBranchFormData({ ...branchFormData, location: text });
                      if (formErrors.location)
                        setFormErrors({ ...formErrors, location: "" });
                    }}
                    className={`px-4 py-3 rounded-xl border ${
                      formErrors.location
                        ? "border-red-500"
                        : currentTheme.border
                    } ${currentTheme.text} ${currentTheme.card}`}
                  />
                  {formErrors.location && (
                    <Text className="text-red-500 text-xs mt-1">
                      {formErrors.location}
                    </Text>
                  )}
                </View>

                <View>
                  <Text className={`font-medium mb-2 ${currentTheme.text}`}>
                    Email *
                  </Text>
                  <TextInput
                    placeholder="Enter branch email"
                    placeholderTextColor={currentTheme.textMuted}
                    value={branchFormData.email}
                    onChangeText={(text) => {
                      setBranchFormData({ ...branchFormData, email: text });
                      if (formErrors.email)
                        setFormErrors({ ...formErrors, email: "" });
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    className={`px-4 py-3 rounded-xl border ${
                      formErrors.email ? "border-red-500" : currentTheme.border
                    } ${currentTheme.text} ${currentTheme.card}`}
                  />
                  {formErrors.email && (
                    <Text className="text-red-500 text-xs mt-1">
                      {formErrors.email}
                    </Text>
                  )}
                </View>

                <View>
                  <Text className={`font-medium mb-2 ${currentTheme.text}`}>
                    Contact Number
                  </Text>
                  <TextInput
                    placeholder="Enter contact number"
                    placeholderTextColor={currentTheme.textMuted}
                    value={branchFormData.contactNumber}
                    onChangeText={(text) =>
                      setBranchFormData({
                        ...branchFormData,
                        contactNumber: text,
                      })
                    }
                    keyboardType="phone-pad"
                    className={`px-4 py-3 rounded-xl border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                  />
                </View>

                <View>
                  <Text className={`font-medium mb-2 ${currentTheme.text}`}>
                    Status
                  </Text>
                  <View className="flex-row gap-2">
                    {(["active", "inactive"] as const).map((status) => (
                      <TouchableOpacity
                        key={status}
                        onPress={() =>
                          setBranchFormData({ ...branchFormData, status })
                        }
                        className={`flex-1 py-2 rounded-lg border ${
                          branchFormData.status === status
                            ? "border-purple-600 bg-purple-100 dark:bg-purple-500/20"
                            : currentTheme.border
                        } items-center`}
                      >
                        <Text
                          className={
                            branchFormData.status === status
                              ? "text-purple-600 dark:text-purple-400 font-medium"
                              : currentTheme.text
                          }
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            </ScrollView>

            <View className="flex-row gap-3 mt-6">
              <TouchableOpacity
                onPress={() => {
                  setIsModalOpen(false);
                  setEditingBranch(undefined);
                  setBranchFormData({
                    name: "",
                    location: "",
                    email: "",
                    contactNumber: "",
                    status: "active",
                  });
                  setFormErrors({});
                }}
                className={`flex-1 py-3 rounded-xl border ${currentTheme.border} items-center`}
              >
                <Text className={currentTheme.textMuted}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveBranch}
                disabled={
                  organization &&
                  !editingBranch &&
                  organization.activeBranchesCount >= organization.maxBranches
                }
                className="flex-1 bg-purple-600 py-3 rounded-xl items-center"
              >
                <Text className="text-white font-medium">
                  {editingBranch ? "Update" : "Create"} Branch
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* QR Code Modal */}
      <Modal visible={qrModalOpen} animationType="slide" transparent={true}>
        <View className="flex-1 bg-black/70 justify-end">
          <Animated.View
            entering={SlideInDown.duration(300)}
            exiting={SlideOutDown.duration(200)}
            className={`${currentTheme.card} rounded-t-3xl p-6 max-h-[85vh]`}
          >
            <View className="flex-row justify-between items-center mb-6">
              <View>
                <Text className={`text-xl font-bold ${currentTheme.text}`}>
                  Student Registration QR
                </Text>
                <Text className={`text-sm ${currentTheme.textMuted} mt-1`}>
                  Scan for student registration
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setQrModalOpen(false);
                  setSelectedBranchForQR(null);
                }}
                className="p-2"
              >
                <X size={24} color={currentTheme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedBranchForQR && (
                <>
                  <View className="items-center mb-6">
                    <View className="bg-white p-4 rounded-lg shadow-lg mb-4">
                      <QRCode
                        value={`${API_URL}/students/${selectedBranchForQR.id}`}
                        size={200}
                        bgColor="white"
                        fgColor="#7c3aed"
                      />
                    </View>

                    <View
                      className={`p-4 ${currentTheme.card} rounded-lg border ${currentTheme.border} w-full`}
                    >
                      <View className="flex-row items-center gap-3">
                        <View className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 items-center justify-center">
                          <Building2 size={20} color="white" />
                        </View>
                        <View className="flex-1">
                          <Text
                            className={`font-semibold ${currentTheme.text}`}
                          >
                            {selectedBranchForQR.name}
                          </Text>
                          <Text className={`text-sm ${currentTheme.textMuted}`}>
                            Student Registration Portal
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View className="grid grid-cols-3 gap-3 mb-6">
                    <TouchableOpacity
                      onPress={downloadQRCode}
                      className="items-center p-3 bg-purple-600 rounded-lg"
                    >
                      <Download size={20} color="white" />
                      <Text className="text-white text-xs font-medium mt-1">
                        Download
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={copyToClipboard}
                      className="items-center p-3 bg-blue-600 rounded-lg"
                    >
                      <Copy size={20} color="white" />
                      <Text className="text-white text-xs font-medium mt-1">
                        Copy URL
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={shareQR}
                      className="items-center p-3 bg-green-600 rounded-lg"
                    >
                      <Share2 size={20} color="white" />
                      <Text className="text-white text-xs font-medium mt-1">
                        Share
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View className={`pt-6 border-t ${currentTheme.border}`}>
                    <Text className={`font-semibold ${currentTheme.text} mb-2`}>
                      How to use:
                    </Text>
                    <View className="space-y-2">
                      {[
                        "Print and display at branch entrance",
                        "Students scan with phone camera",
                        "Direct access to registration form",
                      ].map((instruction, index) => (
                        <View
                          key={index}
                          className="flex-row items-start gap-2"
                        >
                          <View className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2" />
                          <Text
                            className={`text-sm ${currentTheme.textMuted} flex-1`}
                          >
                            {instruction}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </>
              )}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
