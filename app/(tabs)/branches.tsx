// app/(tabs)/branches.tsx
import { API_URL } from "@/config";
import { Theme } from "@/theme";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import * as MediaLibrary from "expo-media-library";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import {
  Activity,
  Building2,
  Calendar,
  CheckCircle,
  ChevronRight,
  Copy,
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
  XCircle
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
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import ViewShot from "react-native-view-shot";

const { width } = Dimensions.get("window");

// Enhanced color palette for black theme
const colors = {
  primary: "#8b5cf6",
  primaryLight: "#a78bfa",
  primaryDark: "#7c3aed",
  secondary: "#3b82f6",
  success: "#10b981",
  successDark: "#059669",
  danger: "#ef4444",
  dangerDark: "#dc2626",
  warning: "#f59e0b",
  info: "#3b82f6",
  infoDark: "#2563eb",

  // Black theme colors
  background: "#000000",
  surface: "#0a0a0a",
  card: "#111111",
  cardElevated: "#1a1a1a",
  cardLight: "#1c1c1c",
  border: "#262626",
  borderLight: "#333333",
  borderDark: "#1f1f1f",

  // Text colors
  text: "#ffffff",
  textSecondary: "#a3a3a3",
  textMuted: "#737373",
  textLight: "#d4d4d4",

  // Gradients
  gradientPrimary: ["#8b5cf6", "#7c3aed"],
  gradientSuccess: ["#10b981", "#059669"],
  gradientDanger: ["#ef4444", "#dc2626"],
};

const styles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    flex: 1,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  cardElevated: {
    backgroundColor: colors.cardElevated,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.2)",
  },

  // Header styles
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDark,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 6,
  },

  // Search bar
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 20,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    marginLeft: 12,
    padding: 0,
  },

  // Filter chips
  filterContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    borderColor: colors.primary,
  },
  filterChipInactive: {
    backgroundColor: colors.card,
    borderColor: colors.border,
  },

  // Stats cards
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500",
    letterSpacing: 0.2,
  },

  // Branch card
  branchCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  branchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  branchIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  branchTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  branchName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  branchInfoContainer: {
    gap: 10,
    marginBottom: 16,
  },
  branchInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  branchFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  // Badge styles
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  badgeActive: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
  },
  badgeInactive: {
    backgroundColor: "rgba(163, 163, 163, 0.15)",
  },

  // Text styles
  text: {
    color: colors.text,
  },
  textSecondary: {
    color: colors.textSecondary,
  },
  textMuted: {
    color: colors.textMuted,
  },
  textSuccess: {
    color: colors.success,
  },
  textDanger: {
    color: colors.danger,
  },
  textPrimary: {
    color: colors.primary,
  },

  // Button styles
  btnPrimary: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  btnSecondary: {
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    gap: 8,
  },
  btnText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
  },

  // Input styles
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    color: colors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputError: {
    borderColor: colors.danger,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 24,
    paddingHorizontal: 20,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
  },

  // Dropdown menu
  dropdownMenu: {
    position: "absolute",
    right: 8,
    top: 40,
    backgroundColor: colors.cardElevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 8,
    minWidth: 160,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },

  // QR Code styles
  qrContainer: {
    backgroundColor: "#ffffff",
    padding: 24,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  qrTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111111",
    marginTop: 16,
    textAlign: "center",
  },
  qrSubtitle: {
    fontSize: 13,
    color: "#666666",
    textAlign: "center",
    marginTop: 4,
  },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.text,
    textAlign: "center",
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },

  // Toast
  toastContainer: {
    position: "absolute",
    top: 16,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  toast: {
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
});

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
  const [isDownloading, setIsDownloading] = useState(false);

  const router = useRouter();
  const viewShotRef = useRef<any>(null);
  const flatListRef = useRef<FlatList>(null);

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
    if (!selectedBranchForQR) return;

    try {
      setIsDownloading(true);

      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        showToast("Permission needed to save images", "error");
        setIsDownloading(false);
        return;
      }

      if (viewShotRef.current) {
        const uri = await viewShotRef.current.capture();

        const filename = `${selectedBranchForQR.name
          .replace(/\s+/g, "_")
          .toLowerCase()}_qr_code.png`;

        const asset = await MediaLibrary.createAssetAsync(uri);
        await MediaLibrary.createAlbumAsync("QR Codes", asset, false);

        showToast("QR code saved to gallery!", "success");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error("Error downloading QR code:", error);
      showToast("Failed to save QR code", "error");
    } finally {
      setIsDownloading(false);
    }
  };

  const shareQRCodeImage = async () => {
    if (!selectedBranchForQR) return;

    try {
      if (viewShotRef.current) {
        const uri = await viewShotRef.current.capture();

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: "image/png",
            dialogTitle: `Share QR Code - ${selectedBranchForQR.name}`,
            UTI: "image/png",
          });
        } else {
          copyToClipboard();
        }
      }
    } catch (error) {
      console.error("Error sharing QR code:", error);
      showToast("Error sharing QR code", "error");
    }
  };

  const copyToClipboard = () => {
    if (!selectedBranchForQR) return;

    const studentRegistrationUrl = `${API_URL}/students/${selectedBranchForQR.id}`;
    Clipboard.setString(studentRegistrationUrl);
    showToast("URL copied to clipboard", "success");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
      color: colors.primary,
      bgColor: "rgba(139, 92, 246, 0.1)",
    },
    {
      icon: Activity,
      label: "Active",
      value: branches.filter((b) => b.status === "active").length.toString(),
      color: colors.success,
      bgColor: "rgba(16, 185, 129, 0.1)",
    },
    {
      icon: Users,
      label: "Organization",
      value: organization?.name || "N/A",
      color: colors.secondary,
      bgColor: "rgba(59, 130, 246, 0.1)",
    },
  ];

  const BranchCard = ({ branch }: { branch: Branch }) => {
    const StatusBadge = ({ status }: { status: "active" | "inactive" }) => (
      <View
        style={[
          styles.badge,
          status === "active" ? styles.badgeActive : styles.badgeInactive,
        ]}
      >
        {status === "active" ? (
          <CheckCircle size={12} color={colors.success} />
        ) : (
          <XCircle size={12} color={colors.textSecondary} />
        )}
        <Text
          style={{
            fontSize: 11,
            fontWeight: "600",
            marginLeft: 4,
            color: status === "active" ? colors.success : colors.textSecondary,
          }}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Text>
      </View>
    );

    return (
      <Animated.View
        entering={FadeIn.duration(300)}
        exiting={FadeOut.duration(200)}
        style={styles.branchCard}
      >
        <View style={styles.branchHeader}>
          <View style={{ flexDirection: "row", flex: 1 }}>
            <View style={styles.branchIconContainer}>
              <Building2 size={24} color={colors.primary} />
            </View>
            <View style={styles.branchTitleContainer}>
              <Text style={styles.branchName} numberOfLines={1}>
                {branch.name}
              </Text>
              <StatusBadge status={branch.status} />
            </View>
          </View>

          <TouchableOpacity
            onPress={() =>
              setOpenDropdownId(openDropdownId === branch.id ? null : branch.id)
            }
            style={{
              padding: 8,
              borderRadius: 10,
              backgroundColor: colors.cardLight,
            }}
          >
            <MoreVertical size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {openDropdownId === branch.id && (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            style={styles.dropdownMenu}
          >
            <TouchableOpacity
              onPress={() => {
                openEditModal(branch);
                setOpenDropdownId(null);
              }}
              style={styles.dropdownItem}
            >
              <Edit size={18} color={colors.text} />
              <Text style={[styles.text, { marginLeft: 10, fontSize: 14 }]}>
                Edit Branch
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                openQRModal(branch);
                setOpenDropdownId(null);
              }}
              style={styles.dropdownItem}
            >
              <QrCode size={18} color={colors.text} />
              <Text style={[styles.text, { marginLeft: 10, fontSize: 14 }]}>
                QR Code
              </Text>
            </TouchableOpacity>

            <View
              style={{
                height: 1,
                backgroundColor: colors.border,
                marginVertical: 4,
              }}
            />

            <TouchableOpacity
              onPress={() => {
                handleToggleStatus(branch.id, branch.status);
                setOpenDropdownId(null);
              }}
              style={styles.dropdownItem}
            >
              {branch.status === "active" ? (
                <>
                  <EyeOff size={18} color={colors.warning} />
                  <Text
                    style={[
                      styles.text,
                      { marginLeft: 10, fontSize: 14, color: colors.warning },
                    ]}
                  >
                    Deactivate
                  </Text>
                </>
              ) : (
                <>
                  <Eye size={18} color={colors.success} />
                  <Text
                    style={[
                      styles.text,
                      { marginLeft: 10, fontSize: 14, color: colors.success },
                    ]}
                  >
                    Activate
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                handleDeleteBranch(branch.id);
                setOpenDropdownId(null);
              }}
              style={styles.dropdownItem}
            >
              <Trash2 size={18} color={colors.danger} />
              <Text
                style={[
                  styles.text,
                  { marginLeft: 10, fontSize: 14, color: colors.danger },
                ]}
              >
                Delete Branch
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        <View style={styles.branchInfoContainer}>
          <View style={styles.branchInfoRow}>
            <MapPin size={16} color={colors.textSecondary} />
            <Text style={[styles.textSecondary, { flex: 1, fontSize: 14 }]}>
              {branch.location}
            </Text>
          </View>

          <View style={styles.branchInfoRow}>
            <Mail size={16} color={colors.textSecondary} />
            <Text style={[styles.textSecondary, { flex: 1, fontSize: 14 }]}>
              {branch.email}
            </Text>
          </View>

          {branch.contactNumber && (
            <View style={styles.branchInfoRow}>
              <Phone size={16} color={colors.textSecondary} />
              <Text style={[styles.textSecondary, { flex: 1, fontSize: 14 }]}>
                {branch.contactNumber}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.branchFooter}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Calendar size={14} color={colors.textMuted} />
            <Text style={[styles.textMuted, { marginLeft: 6, fontSize: 12 }]}>
              {formatDate(branch.createdAt)}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => openQRModal(branch)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 12,
              paddingVertical: 8,
              backgroundColor: "rgba(139, 92, 246, 0.1)",
              borderRadius: 10,
              gap: 6,
            }}
          >
            <QrCode size={16} color={colors.primary} />
            <Text
              style={[styles.textPrimary, { fontSize: 13, fontWeight: "500" }]}
            >
              QR Code
            </Text>
            <ChevronRight size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  const StatsCard = ({
    icon: Icon,
    label,
    value,
    color,
    bgColor,
  }: {
    icon: any;
    label: string;
    value: string | number;
    color: string;
    bgColor: string;
  }) => (
    <View style={styles.statCard}>
      <View style={[styles.statIconContainer, { backgroundColor: bgColor }]}>
        <Icon size={24} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  if (loading && branches.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: "center" }]}>
        <View style={{ alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.text, { marginTop: 20, fontSize: 16 }]}>
            Loading branches...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Toast Notification */}
      {toast && (
        <Animated.View
          entering={SlideInDown.duration(300)}
          exiting={SlideOutDown.duration(200)}
          style={styles.toastContainer}
        >
          <LinearGradient
            colors={
              toast.type === "success"
                ? colors.gradientSuccess
                : toast.type === "error"
                  ? colors.gradientDanger
                  : colors.gradientPrimary
            }
            style={styles.toast}
          >
            <Text style={[styles.text, { fontWeight: "500", flex: 1 }]}>
              {toast.message}
            </Text>
            <TouchableOpacity
              onPress={() => setToast(null)}
              style={{ padding: 4 }}
            >
              <X size={20} color="#ffffff" />
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <View>
            <Text style={styles.headerTitle}>Branches</Text>
            <Text style={styles.headerSubtitle}>
              Manage your organization branches
            </Text>
          </View>

          {currentUser?.role === "admin" && (
            <TouchableOpacity
              onPress={openCreateModal}
              disabled={
                organization &&
                organization.activeBranchesCount >= organization.maxBranches
              }
              style={styles.btnPrimary}
            >
              <Plus size={20} color="#ffffff" />
              <Text style={styles.btnText}>Add Branch</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={20} color={colors.textSecondary} />
          <TextInput
            placeholder="Search branches..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
        >
          {[
            { id: "all", label: "All Branches", icon: Building2 },
            { id: "active", label: "Active", icon: CheckCircle },
            { id: "inactive", label: "Inactive", icon: XCircle },
          ].map((filter) => (
            <TouchableOpacity
              key={filter.id}
              onPress={() => setFilterStatus(filter.id)}
              style={[
                styles.filterChip,
                filterStatus === filter.id
                  ? styles.filterChipActive
                  : styles.filterChipInactive,
              ]}
            >
              <filter.icon
                size={14}
                color={
                  filterStatus === filter.id
                    ? colors.primary
                    : colors.textSecondary
                }
              />
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "500",
                  color:
                    filterStatus === filter.id
                      ? colors.primary
                      : colors.textSecondary,
                }}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Stats Overview */}
      <View style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <StatsCard
            key={index}
            icon={stat.icon}
            label={stat.label}
            value={stat.value}
            color={stat.color}
            bgColor={stat.bgColor}
          />
        ))}
      </View>

      {/* Branches List */}
      <FlatList
        ref={flatListRef}
        data={filteredBranches}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <BranchCard branch={item} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
            progressBackgroundColor={colors.card}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Building2
              size={64}
              color={colors.textMuted}
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyTitle}>
              {searchQuery ? "No matching branches" : "No branches yet"}
            </Text>
            <Text style={styles.emptyDescription}>
              {searchQuery
                ? "Try a different search term or clear filters"
                : currentUser?.role === "admin"
                  ? "Get started by creating your first branch"
                  : "No branches have been created yet"}
            </Text>
            {!searchQuery && currentUser?.role === "admin" && (
              <TouchableOpacity
                onPress={openCreateModal}
                style={[styles.btnPrimary, { marginTop: 24 }]}
              >
                <Text style={styles.btnText}>Create First Branch</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        contentContainerStyle={{ paddingBottom: 40 }}
      />

      {/* Branch Form Modal */}
      <Modal visible={isModalOpen} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => setIsModalOpen(false)}
            activeOpacity={1}
          />
          <Animated.View
            entering={SlideInDown.duration(300)}
            exiting={SlideOutDown.duration(200)}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingBranch ? "Edit Branch" : "New Branch"}
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
                style={{
                  padding: 8,
                  borderRadius: 10,
                  backgroundColor: colors.card,
                }}
              >
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {organization && !editingBranch && (
                <View
                  style={{
                    marginBottom: 20,
                    padding: 16,
                    backgroundColor: "rgba(59, 130, 246, 0.1)",
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: "rgba(59, 130, 246, 0.3)",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: colors.secondary,
                      marginBottom: 8,
                    }}
                  >
                    Organization Capacity
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                      {organization.activeBranchesCount} /{" "}
                      {organization.maxBranches} branches
                    </Text>
                    {organization.activeBranchesCount >=
                    organization.maxBranches ? (
                      <Text
                        style={{
                          color: colors.danger,
                          fontSize: 12,
                          fontWeight: "500",
                        }}
                      >
                        Limit Reached
                      </Text>
                    ) : (
                      <Text
                        style={{
                          color: colors.success,
                          fontSize: 12,
                          fontWeight: "500",
                        }}
                      >
                        {organization.maxBranches -
                          organization.activeBranchesCount}{" "}
                        available
                      </Text>
                    )}
                  </View>
                </View>
              )}

              <View style={{ gap: 4 }}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Branch Name *</Text>
                  <TextInput
                    placeholder="Enter branch name"
                    placeholderTextColor={colors.textMuted}
                    value={branchFormData.name}
                    onChangeText={(text) => {
                      setBranchFormData({ ...branchFormData, name: text });
                      if (formErrors.name)
                        setFormErrors({ ...formErrors, name: "" });
                    }}
                    style={[styles.input, formErrors.name && styles.inputError]}
                  />
                  {formErrors.name && (
                    <Text
                      style={{
                        color: colors.danger,
                        fontSize: 12,
                        marginTop: 4,
                      }}
                    >
                      {formErrors.name}
                    </Text>
                  )}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Location *</Text>
                  <TextInput
                    placeholder="Enter branch location"
                    placeholderTextColor={colors.textMuted}
                    value={branchFormData.location}
                    onChangeText={(text) => {
                      setBranchFormData({ ...branchFormData, location: text });
                      if (formErrors.location)
                        setFormErrors({ ...formErrors, location: "" });
                    }}
                    style={[
                      styles.input,
                      formErrors.location && styles.inputError,
                    ]}
                  />
                  {formErrors.location && (
                    <Text
                      style={{
                        color: colors.danger,
                        fontSize: 12,
                        marginTop: 4,
                      }}
                    >
                      {formErrors.location}
                    </Text>
                  )}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Email *</Text>
                  <TextInput
                    placeholder="Enter branch email"
                    placeholderTextColor={colors.textMuted}
                    value={branchFormData.email}
                    onChangeText={(text) => {
                      setBranchFormData({ ...branchFormData, email: text });
                      if (formErrors.email)
                        setFormErrors({ ...formErrors, email: "" });
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={[
                      styles.input,
                      formErrors.email && styles.inputError,
                    ]}
                  />
                  {formErrors.email && (
                    <Text
                      style={{
                        color: colors.danger,
                        fontSize: 12,
                        marginTop: 4,
                      }}
                    >
                      {formErrors.email}
                    </Text>
                  )}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Contact Number</Text>
                  <TextInput
                    placeholder="Enter contact number"
                    placeholderTextColor={colors.textMuted}
                    value={branchFormData.contactNumber}
                    onChangeText={(text) =>
                      setBranchFormData({
                        ...branchFormData,
                        contactNumber: text,
                      })
                    }
                    keyboardType="phone-pad"
                    style={styles.input}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Status</Text>
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    {(["active", "inactive"] as const).map((status) => (
                      <TouchableOpacity
                        key={status}
                        onPress={() =>
                          setBranchFormData({ ...branchFormData, status })
                        }
                        style={{
                          flex: 1,
                          paddingVertical: 14,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor:
                            branchFormData.status === status
                              ? colors.primary
                              : colors.border,
                          backgroundColor:
                            branchFormData.status === status
                              ? "rgba(139, 92, 246, 0.1)"
                              : "transparent",
                          alignItems: "center",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "600",
                            color:
                              branchFormData.status === status
                                ? colors.primary
                                : colors.text,
                          }}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  gap: 12,
                  marginTop: 32,
                  marginBottom: 20,
                }}
              >
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
                  style={[styles.btnSecondary, { flex: 1 }]}
                >
                  <Text
                    style={[styles.btnText, { color: colors.textSecondary }]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveBranch}
                  disabled={
                    organization &&
                    !editingBranch &&
                    organization.activeBranchesCount >= organization.maxBranches
                  }
                  style={[
                    styles.btnPrimary,
                    { flex: 1 },
                    {
                      opacity:
                        organization &&
                        !editingBranch &&
                        organization.activeBranchesCount >=
                          organization.maxBranches
                          ? 0.5
                          : 1,
                    },
                  ]}
                >
                  <Text style={styles.btnText}>
                    {editingBranch ? "Update" : "Create"} Branch
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      {/* QR Code Modal */}
      <Modal visible={qrModalOpen} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => setQrModalOpen(false)}
            activeOpacity={1}
          />
          <Animated.View
            entering={SlideInDown.duration(300)}
            exiting={SlideOutDown.duration(200)}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Student Registration QR</Text>
                <Text
                  style={[styles.textSecondary, { marginTop: 4, fontSize: 14 }]}
                >
                  Scan for student registration
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setQrModalOpen(false);
                  setSelectedBranchForQR(null);
                }}
                style={{
                  padding: 8,
                  borderRadius: 10,
                  backgroundColor: colors.card,
                }}
              >
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ marginBottom: 20 }}
            >
              {selectedBranchForQR && (
                <>
                  <View style={{ alignItems: "center" }}>
                    {/* QR Code with ViewShot for capturing */}
                    <ViewShot
                      ref={viewShotRef}
                      options={{ format: "png", quality: 1 }}
                    >
                      <View style={styles.qrContainer}>
                        <QRCode
                          value={`${API_URL}/students/${selectedBranchForQR.id}`}
                          size={220}
                          backgroundColor="white"
                          color="#111111"
                          logoSize={40}
                          logoMargin={8}
                          logoBorderRadius={8}
                          logoBackgroundColor="white"
                        />
                        <Text style={styles.qrTitle}>
                          {selectedBranchForQR.name}
                        </Text>
                        <Text style={styles.qrSubtitle}>
                          Student Registration Portal
                        </Text>
                      </View>
                    </ViewShot>
                  </View>

                  {/* Branch Info Card */}
                  <View style={[styles.card, { marginBottom: 24 }]}>
                    <View style={styles.branchInfoRow}>
                      <Building2 size={20} color={colors.primary} />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text
                          style={[
                            styles.text,
                            { fontWeight: "600", fontSize: 16 },
                          ]}
                        >
                          {selectedBranchForQR.name}
                        </Text>
                        <Text
                          style={[
                            styles.textSecondary,
                            { fontSize: 14, marginTop: 2 },
                          ]}
                        >
                          {selectedBranchForQR.location}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View
                    style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}
                  >
                    <TouchableOpacity
                      onPress={copyToClipboard}
                      style={[styles.btnSecondary, { flex: 1 }]}
                    >
                      <Copy size={20} color={colors.text} />
                      <Text style={[styles.btnText, { marginLeft: 8 }]}>
                        Copy URL
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={shareQR}
                      style={[styles.btnSecondary, { flex: 1 }]}
                    >
                      <Share2 size={20} color={colors.text} />
                      <Text style={[styles.btnText, { marginLeft: 8 }]}>
                        Share Link
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    onPress={shareQRCodeImage}
                    style={[styles.btnPrimary, { marginBottom: 24 }]}
                  >
                    <QrCode size={20} color="#ffffff" />
                    <Text style={[styles.btnText, { marginLeft: 8 }]}>
                      Share QR Image
                    </Text>
                  </TouchableOpacity>

                  {/* Instructions */}
                  <View
                    style={{
                      padding: 20,
                      backgroundColor: colors.card,
                      borderRadius: 16,
                      marginBottom: 20,
                    }}
                  >
                    <Text
                      style={[
                        styles.text,
                        { fontWeight: "600", fontSize: 16, marginBottom: 12 },
                      ]}
                    >
                      How to use this QR code:
                    </Text>
                    <View style={{ gap: 10 }}>
                      {[
                        "Print and display at branch entrance",
                        "Students scan with phone camera",
                        "Direct access to registration form",
                        "Auto-redirects to branch-specific form",
                      ].map((instruction, index) => (
                        <View
                          key={index}
                          style={{
                            flexDirection: "row",
                            alignItems: "flex-start",
                            gap: 10,
                          }}
                        >
                          <View
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: colors.primary,
                              marginTop: 6,
                            }}
                          />
                          <Text
                            style={[
                              styles.textSecondary,
                              { flex: 1, fontSize: 14, lineHeight: 20 },
                            ]}
                          >
                            {instruction}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View
                    style={{
                      padding: 16,
                      backgroundColor: "rgba(139, 92, 246, 0.1)",
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: "rgba(139, 92, 246, 0.2)",
                    }}
                  >
                    <Text
                      style={[
                        styles.textSecondary,
                        { fontSize: 13, textAlign: "center" },
                      ]}
                    >
                      📱 Scan this QR code with any smartphone camera to open
                      the student registration form.
                    </Text>
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
