// app/(tabs)/students.tsx
import { API_URL } from "@/config";
import { Theme, themeConfigs } from "@/theme";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import * as MediaLibrary from "expo-media-library";
import { useRouter } from "expo-router";
import {
    AlertTriangle,
    Award,
    Calendar,
    Check,
    Copy,
    CreditCard,
    Download,
    Eye,
    FileText,
    Filter,
    Mail,
    MoreVertical,
    Phone,
    Plus,
    QrCode,
    RefreshCw,
    Search,
    Share2,
    Trash2,
    User,
    UserCheck,
    UserPlus,
    Users,
    X,
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
    Image,
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
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

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
  status: "new" | "in_process" | "qualified" | "rejected";
  $createdAt: string;
  country?: any;
  university?: any;
  nationality?: string;
  type?: "student" | "lead" | "visitor";
  gender?: string;
  dateOfBirth?: string;
  passportNumber?: string;
  branches?: string;
  userId?: string;
  userIds?: string[];
  courses?: string[];
  documentsTemplates?: string;
  paymentTemplates?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  emergencyContact?: string;
  emergencyContactPhone?: string;
  previousEducation?: string;
  intendedStartDate?: string;
  avatar?: string;
  lastDegree?: string;
  degreeGPA?: number;
  highSchoolGPA?: number;
  plusTwoGPA?: number;
  currentInstitution?: string;
  currentCourse?: string;
  graduationYear?: number;
  academicQualification?: string;
  testScores?: any;
  achievements?: string;
  extracurricularActivities?: string;
  workExperience?: string;
  studentAccessToken?: string;
  accessTokenExpiry?: string;
  documentsTemplatesFull?: any;
  paymentTemplateFull?: any;
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

interface DocumentTemplate {
  id: string;
  $id: string;
  templateName: string;
  templateItems: any[];
  isActive: boolean;
}

interface PaymentTemplate {
  id: string;
  $id: string;
  templateName: string;
  items: any[];
  isActive: boolean;
  totalAmount?: number;
}

interface StudentFormData {
  firstName: string;
  lastName: string;
  email: string;
  contact: string;
  dateOfBirth: string;
  passportNumber: string;
  branches: string;
  userId: string;
  status: "new" | "in_process" | "qualified" | "rejected";
  countries: string;
  universities: string;
  courses: string[];
  documentsTemplates: string;
  paymentTemplates: string;
  gender: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  nationality: string;
  emergencyContact: string;
  emergencyContactPhone: string;
  previousEducation: string;
  intendedStartDate: string;
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
}

interface StatusUpdatePayload {
  status: "in_process";
  paymentTemplateId: string;
  documentTemplateId: string;
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

// Status Badge Component
const StatusBadge = ({ status }: { status: string }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400";
      case "in_process":
      case "in_progress":
        return "bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400";
      case "qualified":
        return "bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400";
      case "approved":
        return "bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400";
      case "rejected":
        return "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400";
      default:
        return "bg-gray-100 dark:bg-gray-500/20 text-gray-600 dark:text-gray-400";
    }
  };

  const getStatusText = (status: string) => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <View className={`px-3 py-1 rounded-full ${getStatusColor(status)}`}>
      <Text className="text-xs font-medium">{getStatusText(status)}</Text>
    </View>
  );
};

// Student Card Component
const StudentCard = ({
  student,
  isSelected,
  onSelect,
  onPress,
  onMorePress,
}: {
  student: Student;
  isSelected: boolean;
  onSelect: () => void;
  onPress: () => void;
  onMorePress: () => void;
}) => {
  const [theme] = useState<Theme>("dark");
  const currentTheme = themeConfigs[theme];

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`m-2 p-4 rounded-2xl ${currentTheme.card} border ${currentTheme.border}`}
      style={{ width: (width - 32) / 2 - 8 }}
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
              className={`w-5 h-5 rounded border ${isSelected ? "bg-purple-600 border-purple-600" : currentTheme.border} items-center justify-center`}
            >
              {isSelected && <Check size={12} color="white" />}
            </View>
          </TouchableOpacity>

          <View className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 items-center justify-center">
            <Text className="text-white font-bold">
              {getInitials(student.firstName, student.lastName)}
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
          <MoreVertical size={20} color={currentTheme.textMuted} />
        </TouchableOpacity>
      </View>

      <Text
        className={`font-semibold ${currentTheme.text} mb-2`}
        numberOfLines={1}
      >
        {student.firstName} {student.lastName}
      </Text>

      <View className="space-y-2 mb-3">
        <View className="flex-row items-center">
          <Mail size={14} color={currentTheme.textMuted} />
          <Text
            className={`text-xs ${currentTheme.textMuted} ml-2 flex-1`}
            numberOfLines={1}
          >
            {student.email}
          </Text>
        </View>

        <View className="flex-row items-center">
          <Phone size={14} color={currentTheme.textMuted} />
          <Text
            className={`text-xs ${currentTheme.textMuted} ml-2 flex-1`}
            numberOfLines={1}
          >
            {student.contact || "N/A"}
          </Text>
        </View>
      </View>

      <View className="flex-row justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
        <StatusBadge status={student.status || "new"} />

        <View className="flex-row items-center">
          <Calendar size={12} color={currentTheme.textMuted} />
          <Text className={`text-xs ${currentTheme.textMuted} ml-1`}>
            {new Date(student.$createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Student Detail Modal Component
const StudentDetailModal = ({
  student,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onUpgrade,
  onGeneratePortal,
}: {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (student: Student) => void;
  onDelete: (id: string) => void;
  onUpgrade: (student: Student) => void;
  onGeneratePortal: (student: Student) => void;
}) => {
  const [theme] = useState<Theme>("dark");
  const currentTheme = themeConfigs[theme];
  const [activeTab, setActiveTab] = useState<
    "overview" | "academic" | "documents" | "payments"
  >("overview");

  if (!student) return null;

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
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
                Student Details
              </Text>
              <Text className={`text-sm ${currentTheme.textMuted} mt-1`}>
                View and manage student information
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={currentTheme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Student Header */}
            <View className="items-center mb-6">
              <View className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 items-center justify-center mb-3">
                <Text className="text-white text-2xl font-bold">
                  {getInitials(student.firstName, student.lastName)}
                </Text>
              </View>
              <Text className={`text-xl font-bold ${currentTheme.text}`}>
                {student.firstName} {student.lastName}
              </Text>
              <Text className={`text-sm ${currentTheme.textMuted}`}>
                {student.email}
              </Text>
              <StatusBadge status={student.status || "new"} />
            </View>

            {/* Tabs */}
            <View className="flex-row border-b border-gray-200 dark:border-gray-700 mb-4">
              {(["overview", "academic", "documents", "payments"] as const).map(
                (tab) => (
                  <TouchableOpacity
                    key={tab}
                    onPress={() => setActiveTab(tab)}
                    className={`flex-1 py-2 items-center border-b-2 ${activeTab === tab ? "border-purple-600" : "border-transparent"}`}
                  >
                    <Text
                      className={`text-sm font-medium ${activeTab === tab ? "text-purple-600 dark:text-purple-400" : currentTheme.textMuted}`}
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
                      {student.contact || "N/A"}
                    </Text>
                  </View>
                  <View className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
                    <Text className={`text-xs ${currentTheme.textMuted}`}>
                      Gender
                    </Text>
                    <Text className={`font-medium ${currentTheme.text}`}>
                      {student.gender || "N/A"}
                    </Text>
                  </View>
                  <View className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
                    <Text className={`text-xs ${currentTheme.textMuted}`}>
                      Date of Birth
                    </Text>
                    <Text className={`font-medium ${currentTheme.text}`}>
                      {student.dateOfBirth || "N/A"}
                    </Text>
                  </View>
                  <View className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
                    <Text className={`text-xs ${currentTheme.textMuted}`}>
                      Passport
                    </Text>
                    <Text className={`font-medium ${currentTheme.text}`}>
                      {student.passportNumber || "N/A"}
                    </Text>
                  </View>
                </View>

                {student.address && (
                  <View>
                    <Text className={`font-medium ${currentTheme.text} mb-2`}>
                      Address
                    </Text>
                    <Text className={`text-sm ${currentTheme.text}`}>
                      {student.address}
                      {student.city && `, ${student.city}`}
                      {student.state && `, ${student.state}`}
                      {student.zipCode && ` ${student.zipCode}`}
                    </Text>
                  </View>
                )}

                {student.emergencyContact && (
                  <View>
                    <Text className={`font-medium ${currentTheme.text} mb-2`}>
                      Emergency Contact
                    </Text>
                    <Text className={`text-sm ${currentTheme.text}`}>
                      {student.emergencyContact} -{" "}
                      {student.emergencyContactPhone}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {activeTab === "academic" && (
              <View className="space-y-4">
                <View className="grid grid-cols-2 gap-3">
                  <View className="p-3 rounded-lg bg-blue-100 dark:bg-blue-500/20">
                    <Text
                      className={`text-xs text-blue-600 dark:text-blue-400`}
                    >
                      Highest Degree
                    </Text>
                    <Text className={`font-medium ${currentTheme.text}`}>
                      {student.lastDegree || "N/A"}
                    </Text>
                  </View>
                  <View className="p-3 rounded-lg bg-green-100 dark:bg-green-500/20">
                    <Text
                      className={`text-xs text-green-600 dark:text-green-400`}
                    >
                      Bachelor GPA
                    </Text>
                    <Text className={`font-medium ${currentTheme.text}`}>
                      {student.degreeGPA || "N/A"}
                    </Text>
                  </View>
                  <View className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-500/20">
                    <Text
                      className={`text-xs text-yellow-600 dark:text-yellow-400`}
                    >
                      +2 GPA
                    </Text>
                    <Text className={`font-medium ${currentTheme.text}`}>
                      {student.plusTwoGPA || "N/A"}
                    </Text>
                  </View>
                  <View className="p-3 rounded-lg bg-purple-100 dark:bg-purple-500/20">
                    <Text
                      className={`text-xs text-purple-600 dark:text-purple-400`}
                    >
                      High School GPA
                    </Text>
                    <Text className={`font-medium ${currentTheme.text}`}>
                      {student.highSchoolGPA || "N/A"}
                    </Text>
                  </View>
                </View>

                {student.currentInstitution && (
                  <View>
                    <Text className={`font-medium ${currentTheme.text} mb-2`}>
                      Current Institution
                    </Text>
                    <Text className={`text-sm ${currentTheme.text}`}>
                      {student.currentInstitution}
                    </Text>
                  </View>
                )}

                {student.academicQualification && (
                  <View>
                    <Text className={`font-medium ${currentTheme.text} mb-2`}>
                      Academic Qualification
                    </Text>
                    <Text className={`text-sm ${currentTheme.text}`}>
                      {student.academicQualification}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {activeTab === "documents" && (
              <View className="space-y-4">
                {student.documentsTemplatesFull ? (
                  <View>
                    <Text className={`font-medium ${currentTheme.text} mb-2`}>
                      Document Template
                    </Text>
                    <View className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
                      <Text className={`font-medium ${currentTheme.text}`}>
                        {student.documentsTemplatesFull.templateName}
                      </Text>
                      <Text
                        className={`text-xs ${currentTheme.textMuted} mt-1`}
                      >
                        {student.documentsTemplatesFull.templateItems?.length ||
                          0}{" "}
                        required items
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View className="items-center py-8">
                    <FileText size={48} color={currentTheme.textMuted} />
                    <Text
                      className={`text-lg font-medium mt-4 ${currentTheme.text}`}
                    >
                      No Document Template
                    </Text>
                    <Text
                      className={`text-sm ${currentTheme.textMuted} mt-2 text-center`}
                    >
                      Assign a document template to track required documents
                    </Text>
                  </View>
                )}
              </View>
            )}

            {activeTab === "payments" && (
              <View className="space-y-4">
                {student.paymentTemplateFull ? (
                  <View>
                    <Text className={`font-medium ${currentTheme.text} mb-2`}>
                      Payment Template
                    </Text>
                    <View className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800 mb-4">
                      <Text className={`font-medium ${currentTheme.text}`}>
                        {student.paymentTemplateFull.templateName}
                      </Text>
                      <Text
                        className={`text-xs ${currentTheme.textMuted} mt-1`}
                      >
                        {student.paymentTemplateFull.items?.length || 0} payment
                        items
                      </Text>
                      <Text
                        className={`text-sm font-bold text-green-600 dark:text-green-400 mt-2`}
                      >
                        Total:{" "}
                        {formatCurrency(
                          student.paymentTemplateFull.totalAmount ||
                            student.paymentTemplateFull.items?.reduce(
                              (sum: number, item: any) =>
                                sum + (item.amount || 0),
                              0,
                            ) ||
                            0,
                        )}
                      </Text>
                    </View>

                    {student.paymentTemplateFull.items?.map(
                      (item: any, index: number) => (
                        <View
                          key={index}
                          className="flex-row justify-between items-center p-3 border-b border-gray-200 dark:border-gray-700"
                        >
                          <Text className={`text-sm ${currentTheme.text}`}>
                            {item.label || item.name}
                          </Text>
                          <Text
                            className={`text-sm font-medium ${currentTheme.text}`}
                          >
                            {formatCurrency(item.amount || 0)}
                          </Text>
                        </View>
                      ),
                    )}
                  </View>
                ) : (
                  <View className="items-center py-8">
                    <CreditCard size={48} color={currentTheme.textMuted} />
                    <Text
                      className={`text-lg font-medium mt-4 ${currentTheme.text}`}
                    >
                      No Payment Template
                    </Text>
                    <Text
                      className={`text-sm ${currentTheme.textMuted} mt-2 text-center`}
                    >
                      Assign a payment template to track payments
                    </Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View className="flex-row gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <TouchableOpacity
              onPress={() => onEdit(student)}
              className="flex-1 py-3 bg-blue-600 rounded-xl items-center"
            >
              <Text className="text-white font-medium">Edit</Text>
            </TouchableOpacity>

            {student.status === "new" && (
              <TouchableOpacity
                onPress={() => onUpgrade(student)}
                className="flex-1 py-3 bg-yellow-600 rounded-xl items-center"
              >
                <Text className="text-white font-medium">Upgrade</Text>
              </TouchableOpacity>
            )}

            {student.status === "in_process" && (
              <TouchableOpacity
                onPress={() => onGeneratePortal(student)}
                className="flex-1 py-3 bg-purple-600 rounded-xl items-center"
              >
                <Text className="text-white font-medium">Portal</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={() => onDelete(student.$id)}
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

// Student Modal Component
const StudentModal = ({
  student,
  isOpen,
  onClose,
  onSave,
  users,
  branches,
  countries,
  universities,
  courses,
  documentTemplates,
  paymentTemplates,
  mode = "create",
  onUpgradeToInProcess,
  isSaving = false,
}: {
  student?: Student;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: StudentFormData & { avatar?: File }) => void;
  users: User[];
  branches: Branch[];
  countries: any[];
  universities: any[];
  courses: any[];
  documentTemplates: DocumentTemplate[];
  paymentTemplates: PaymentTemplate[];
  mode?: "create" | "edit" | "upgrade";
  onUpgradeToInProcess?: (
    studentId: string,
    templateData: { paymentTemplateId: string; documentTemplateId: string },
  ) => void;
  isSaving?: boolean;
}) => {
  const [theme] = useState<Theme>("dark");
  const currentTheme = themeConfigs[theme];
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<StudentFormData>({
    firstName: "",
    lastName: "",
    email: "",
    contact: "",
    dateOfBirth: "",
    passportNumber: "",
    branches: "",
    userId: "",
    status: "new",
    countries: "",
    universities: "",
    courses: [],
    documentsTemplates: "",
    paymentTemplates: "",
    gender: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    nationality: "",
    emergencyContact: "",
    emergencyContactPhone: "",
    previousEducation: "",
    intendedStartDate: "",
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
  });
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [selectedDocumentTemplate, setSelectedDocumentTemplate] =
    useState<string>("");
  const [selectedPaymentTemplate, setSelectedPaymentTemplate] =
    useState<string>("");
  const [skipUniversity, setSkipUniversity] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const getSteps = () => {
    if (mode === "upgrade") {
      return [
        {
          title: "Templates",
          description: "Assign document & payment templates",
        },
        { title: "Review", description: "Confirm upgrade to in_process" },
      ];
    }

    return [
      { title: "Personal Info", description: "Basic details & avatar" },
      { title: "Academic Info", description: "Education history & GPA" },
      { title: "Contact & Address", description: "Contact information" },
      { title: "Target Study", description: "Study preferences" },
      { title: "Templates", description: "Document & payment templates" },
      { title: "Review", description: "Final review & submission" },
    ];
  };

  const steps = getSteps();

  useEffect(() => {
    if (student) {
      setFormData({
        firstName: student.firstName || "",
        lastName: student.lastName || "",
        email: student.email || "",
        contact: student.contact || "",
        dateOfBirth: student.dateOfBirth || "",
        passportNumber: student.passportNumber || "",
        branches: student.branches || "",
        userId: student.userId || student.userIds?.[0] || "",
        status: student.status || "new",
        countries: student.country?.$id || "",
        universities: student.university?.$id || "",
        courses: student.courses || [],
        documentsTemplates: student.documentsTemplates || "",
        paymentTemplates: student.paymentTemplates || "",
        gender: student.gender || "",
        address: student.address || "",
        city: student.city || "",
        state: student.state || "",
        zipCode: student.zipCode || "",
        nationality: student.nationality || "",
        emergencyContact: student.emergencyContact || "",
        emergencyContactPhone: student.emergencyContactPhone || "",
        previousEducation: student.previousEducation || "",
        intendedStartDate: student.intendedStartDate || "",
        lastDegree: student.lastDegree || "",
        degreeGPA: student.degreeGPA?.toString() || "",
        highSchoolGPA: student.highSchoolGPA?.toString() || "",
        plusTwoGPA: student.plusTwoGPA?.toString() || "",
        currentInstitution: student.currentInstitution || "",
        currentCourse: student.currentCourse || "",
        graduationYear: student.graduationYear?.toString() || "",
        academicQualification: student.academicQualification || "",
        testScores:
          typeof student.testScores === "object"
            ? JSON.stringify(student.testScores)
            : student.testScores || "",
        achievements: student.achievements || "",
        extracurricularActivities: student.extracurricularActivities || "",
        workExperience: student.workExperience || "",
      });
      setSelectedCourses(student.courses || []);
      setSelectedDocumentTemplate(student.documentsTemplates || "");
      setSelectedPaymentTemplate(student.paymentTemplates || "");
      setSkipUniversity(!student.university?.$id);
      setCurrentStep(0);
    }
  }, [student, isOpen, mode]);

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert(
        "Permission required",
        "Permission to access camera roll is required!",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      const response = await fetch(result.assets[0].uri);
      const blob = await response.blob();
      const file = new File([blob], "avatar.jpg", { type: blob.type });
      setAvatarFile(file);
      setAvatarPreview(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (mode === "upgrade") {
      if (currentStep === steps.length - 1 && student && onUpgradeToInProcess) {
        onUpgradeToInProcess(student.$id, {
          paymentTemplateId: selectedPaymentTemplate,
          documentTemplateId: selectedDocumentTemplate,
        });
      } else {
        nextStep();
      }
    } else {
      if (currentStep === steps.length - 1) {
        const dataToSave = {
          ...formData,
          courses: selectedCourses,
          documentsTemplates: selectedDocumentTemplate,
          paymentTemplates: selectedPaymentTemplate,
        };
        onSave({
          ...dataToSave,
          avatar: avatarFile || undefined,
        });
      } else {
        nextStep();
      }
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

  const renderStepContent = () => {
    if (mode === "upgrade") {
      switch (currentStep) {
        case 0:
          return (
            <View className="space-y-6">
              <View className="p-4 bg-yellow-100 dark:bg-yellow-500/20 rounded-lg border border-yellow-200 dark:border-yellow-800 mb-4">
                <View className="flex-row items-center gap-2 mb-2">
                  <AlertTriangle size={20} color="#f59e0b" />
                  <Text className="text-lg font-semibold text-yellow-800 dark:text-yellow-300">
                    Upgrade Student to In-Process
                  </Text>
                </View>
                <Text className="text-sm text-yellow-700 dark:text-yellow-400">
                  You are about to move{" "}
                  <Text className="font-bold">
                    {student?.firstName} {student?.lastName}
                  </Text>{" "}
                  to <Text className="font-bold">In-Process</Text> status.
                </Text>
              </View>

              <View>
                <View className="flex-row justify-between items-center mb-3">
                  <Text className={`font-medium ${currentTheme.text}`}>
                    Document Template *
                  </Text>
                  <TouchableOpacity className="flex-row items-center gap-2 px-3 py-1 bg-purple-600 rounded-lg">
                    <Plus size={16} color="white" />
                    <Text className="text-white text-sm">Create New</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView className="max-h-48 border rounded-lg p-3 space-y-2 bg-gray-100 dark:bg-gray-800">
                  {documentTemplates.filter((t) => t.isActive).length === 0 ? (
                    <Text className="text-sm text-center p-2 text-gray-500">
                      No document templates available
                    </Text>
                  ) : (
                    documentTemplates
                      .filter((t) => t.isActive)
                      .map((template) => (
                        <TouchableOpacity
                          key={template.$id}
                          onPress={() =>
                            setSelectedDocumentTemplate(template.$id)
                          }
                          className={`p-3 rounded-lg border ${
                            selectedDocumentTemplate === template.$id
                              ? "bg-purple-100 dark:bg-purple-500/20 border-purple-300 dark:border-purple-700"
                              : "border-transparent"
                          }`}
                        >
                          <View className="flex-row items-center gap-3">
                            <View
                              className={`w-4 h-4 rounded-full border ${
                                selectedDocumentTemplate === template.$id
                                  ? "bg-purple-600 border-purple-600"
                                  : "border-gray-400"
                              } items-center justify-center`}
                            >
                              {selectedDocumentTemplate === template.$id && (
                                <Check size={10} color="white" />
                              )}
                            </View>
                            <View className="flex-1">
                              <Text
                                className={`font-medium ${currentTheme.text}`}
                              >
                                {template.templateName}
                              </Text>
                              <Text
                                className={`text-xs ${currentTheme.textMuted}`}
                              >
                                {template.templateItems?.length || 0} items
                              </Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      ))
                  )}
                </ScrollView>
              </View>

              <View>
                <View className="flex-row justify-between items-center mb-3">
                  <Text className={`font-medium ${currentTheme.text}`}>
                    Payment Template *
                  </Text>
                  <TouchableOpacity className="flex-row items-center gap-2 px-3 py-1 bg-purple-600 rounded-lg">
                    <Plus size={16} color="white" />
                    <Text className="text-white text-sm">Create New</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView className="max-h-48 border rounded-lg p-3 space-y-2 bg-gray-100 dark:bg-gray-800">
                  {paymentTemplates.filter((t) => t.isActive).length === 0 ? (
                    <Text className="text-sm text-center p-2 text-gray-500">
                      No payment templates available
                    </Text>
                  ) : (
                    paymentTemplates
                      .filter((t) => t.isActive)
                      .map((template) => (
                        <TouchableOpacity
                          key={template.$id}
                          onPress={() =>
                            setSelectedPaymentTemplate(template.$id)
                          }
                          className={`p-3 rounded-lg border ${
                            selectedPaymentTemplate === template.$id
                              ? "bg-purple-100 dark:bg-purple-500/20 border-purple-300 dark:border-purple-700"
                              : "border-transparent"
                          }`}
                        >
                          <View className="flex-row items-center gap-3">
                            <View
                              className={`w-4 h-4 rounded-full border ${
                                selectedPaymentTemplate === template.$id
                                  ? "bg-purple-600 border-purple-600"
                                  : "border-gray-400"
                              } items-center justify-center`}
                            >
                              {selectedPaymentTemplate === template.$id && (
                                <Check size={10} color="white" />
                              )}
                            </View>
                            <View className="flex-1">
                              <Text
                                className={`font-medium ${currentTheme.text}`}
                              >
                                {template.templateName}
                              </Text>
                              <Text
                                className={`text-xs ${currentTheme.textMuted}`}
                              >
                                {template.items?.length || 0} items • Total: $
                                {template.totalAmount || 0}
                              </Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      ))
                  )}
                </ScrollView>
              </View>
            </View>
          );
        case 1:
          return (
            <View className="space-y-6">
              <View className="p-4 bg-blue-100 dark:bg-blue-500/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <Text className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-3">
                  Ready to Upgrade Student
                </Text>
                <View className="space-y-3">
                  <View className="flex-row justify-between">
                    <Text className={`font-medium ${currentTheme.text}`}>
                      Student:
                    </Text>
                    <Text className={`font-semibold ${currentTheme.text}`}>
                      {student?.firstName} {student?.lastName}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className={`font-medium ${currentTheme.text}`}>
                      Current Status:
                    </Text>
                    <StatusBadge status={student?.status || "new"} />
                  </View>
                  <View className="flex-row justify-between">
                    <Text className={`font-medium ${currentTheme.text}`}>
                      New Status:
                    </Text>
                    <View className="px-3 py-1 bg-yellow-100 dark:bg-yellow-500/20 rounded-full">
                      <Text className="text-yellow-800 dark:text-yellow-400 font-semibold">
                        in_process
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          );
        default:
          return null;
      }
    }

    // Original steps for create/edit
    return (
      <ScrollView>
        <Text className={`text-lg font-bold ${currentTheme.text} mb-4`}>
          {steps[currentStep].title}
        </Text>
        <Text className={`text-sm ${currentTheme.textMuted} mb-6`}>
          {steps[currentStep].description}
        </Text>

        {currentStep === 0 && (
          <View className="space-y-4">
            <View className="items-center">
              <TouchableOpacity onPress={pickImage} className="mb-4">
                {avatarPreview ? (
                  <Image
                    source={{ uri: avatarPreview }}
                    className="w-32 h-32 rounded-full"
                  />
                ) : (
                  <View className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-700 items-center justify-center">
                    <User size={48} color={currentTheme.textMuted} />
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={pickImage}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg"
              >
                <Text className={currentTheme.text}>Upload Photo</Text>
              </TouchableOpacity>
            </View>

            <View className="grid grid-cols-2 gap-4">
              <View>
                <Text className={`font-medium ${currentTheme.text} mb-2`}>
                  First Name *
                </Text>
                <TextInput
                  value={formData.firstName}
                  onChangeText={(text) =>
                    setFormData({ ...formData, firstName: text })
                  }
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
                  onChangeText={(text) =>
                    setFormData({ ...formData, lastName: text })
                  }
                  className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                  placeholder="Enter last name"
                />
              </View>
            </View>

            <View>
              <Text className={`font-medium ${currentTheme.text} mb-2`}>
                Email *
              </Text>
              <TextInput
                value={formData.email}
                onChangeText={(text) =>
                  setFormData({ ...formData, email: text })
                }
                keyboardType="email-address"
                autoCapitalize="none"
                className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                placeholder="Enter email address"
              />
            </View>

            <View>
              <Text className={`font-medium ${currentTheme.text} mb-2`}>
                Gender *
              </Text>
              <View className="flex-row gap-2">
                {["male", "female", "other"].map((gender) => (
                  <TouchableOpacity
                    key={gender}
                    onPress={() => setFormData({ ...formData, gender })}
                    className={`flex-1 py-2 rounded-lg border items-center ${
                      formData.gender === gender
                        ? "border-purple-600 bg-purple-100 dark:bg-purple-500/20"
                        : currentTheme.border
                    }`}
                  >
                    <Text
                      className={
                        formData.gender === gender
                          ? "text-purple-600 dark:text-purple-400 font-medium"
                          : currentTheme.text
                      }
                    >
                      {gender.charAt(0).toUpperCase() + gender.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {currentStep === 1 && (
          <View className="space-y-4">
            <View>
              <Text className={`font-medium ${currentTheme.text} mb-2`}>
                Highest Degree
              </Text>
              <TextInput
                value={formData.lastDegree}
                onChangeText={(text) =>
                  setFormData({ ...formData, lastDegree: text })
                }
                className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                placeholder="e.g., Bachelor's Degree"
              />
            </View>

            <View className="grid grid-cols-2 gap-4">
              <View>
                <Text className={`font-medium ${currentTheme.text} mb-2`}>
                  Bachelor's GPA
                </Text>
                <TextInput
                  value={formData.degreeGPA}
                  onChangeText={(text) =>
                    setFormData({ ...formData, degreeGPA: text })
                  }
                  keyboardType="numeric"
                  className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                  placeholder="e.g., 3.5"
                />
              </View>
              <View>
                <Text className={`font-medium ${currentTheme.text} mb-2`}>
                  +2 GPA
                </Text>
                <TextInput
                  value={formData.plusTwoGPA}
                  onChangeText={(text) =>
                    setFormData({ ...formData, plusTwoGPA: text })
                  }
                  keyboardType="numeric"
                  className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                  placeholder="e.g., 3.2"
                />
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    );
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
                {mode === "upgrade"
                  ? "Upgrade Student"
                  : student
                    ? "Edit Student"
                    : "Add New Student"}
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
                        ? "bg-purple-600"
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
                  className={`text-xs mt-2 ${index === currentStep ? "text-purple-600 dark:text-purple-400 font-medium" : currentTheme.textMuted}`}
                >
                  {step.title}
                </Text>
              </View>
            ))}
          </View>

          {renderStepContent()}

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
              className="flex-1 bg-purple-600 py-3 rounded-xl items-center"
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-white font-medium">
                  {currentStep === steps.length - 1
                    ? mode === "upgrade"
                      ? "Upgrade Student"
                      : student
                        ? "Update Student"
                        : "Create Student"
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

// Portal Link Modal Component
const PortalLinkModal = ({
  student,
  isOpen,
  onClose,
}: {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [theme] = useState<Theme>("dark");
  const currentTheme = themeConfigs[theme];
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const qrCodeRef = useRef<any>(null);

  if (!student) return null;

  const portalUrl = student.studentAccessToken
    ? `${API_URL}/students/portal/${student.studentAccessToken}`
    : "";

  const copyToClipboard = () => {
    if (!portalUrl) return;
    Clipboard.setString(portalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const downloadQRCode = async () => {
    if (!qrCodeRef.current || !portalUrl) return;

    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Permission needed to save images");
        return;
      }

      setDownloading(true);
      // QR Code download implementation
      // Note: react-native-qrcode doesn't have toDataURL method
      // You would need to use a different approach for downloading QR codes
      Alert.alert("Info", "QR Code download feature requires additional setup");
    } catch (error) {
      console.error("Error downloading QR code:", error);
      Alert.alert("Error", "Failed to download QR code");
    } finally {
      setDownloading(false);
    }
  };

  const sharePortal = async () => {
    if (!portalUrl) return;

    try {
      await Share.share({
        title: `Student Portal - ${student.firstName} ${student.lastName}`,
        message: `Access the student portal: ${portalUrl}`,
        url: portalUrl,
      });
    } catch (error) {
      console.error("Error sharing:", error);
      copyToClipboard();
    }
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
                {showQR ? "QR Code" : "Student Portal"}
              </Text>
              <Text className={`text-sm ${currentTheme.textMuted} mt-1`}>
                {showQR
                  ? "Scan to access portal"
                  : "Manage student portal access"}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={currentTheme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="items-center mb-6">
              <View className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 items-center justify-center mb-3">
                <Text className="text-white text-xl font-bold">
                  {student.firstName?.[0]}
                  {student.lastName?.[0]}
                </Text>
              </View>
              <Text className={`text-lg font-bold ${currentTheme.text}`}>
                {student.firstName} {student.lastName}
              </Text>
              <Text className={`text-sm ${currentTheme.textMuted}`}>
                Document Portal Access
              </Text>
            </View>

            {!portalUrl ? (
              <View className="items-center py-6">
                <AlertTriangle size={48} color={currentTheme.textMuted} />
                <Text
                  className={`text-lg font-medium mt-4 ${currentTheme.text}`}
                >
                  No Portal Access
                </Text>
                <Text
                  className={`text-sm ${currentTheme.textMuted} mt-2 text-center`}
                >
                  This student doesn't have portal access enabled yet.
                </Text>
              </View>
            ) : !showQR ? (
              <View>
                <Text className={`font-medium ${currentTheme.text} mb-2`}>
                  Portal Link
                </Text>
                <View className="flex-row gap-2 mb-4">
                  <TextInput
                    value={portalUrl}
                    editable={false}
                    className={`flex-1 px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                  />
                  <TouchableOpacity
                    onPress={copyToClipboard}
                    className={`px-4 py-2 rounded-lg ${
                      copied ? "bg-green-600" : "bg-purple-600"
                    }`}
                  >
                    <Text className="text-white font-medium">
                      {copied ? "Copied!" : "Copy"}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View className="grid grid-cols-3 gap-2 mb-6">
                  <TouchableOpacity
                    onPress={() => setShowQR(true)}
                    className="items-center p-3 bg-blue-600 rounded-lg"
                  >
                    <QrCode size={20} color="white" />
                    <Text className="text-white text-xs font-medium mt-1">
                      QR Code
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={sharePortal}
                    className="items-center p-3 bg-green-600 rounded-lg"
                  >
                    <Share2 size={20} color="white" />
                    <Text className="text-white text-xs font-medium mt-1">
                      Share
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {}}
                    className="items-center p-3 bg-purple-600 rounded-lg"
                  >
                    <Eye size={20} color="white" />
                    <Text className="text-white text-xs font-medium mt-1">
                      Preview
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View className="items-center">
                <View className="bg-white p-4 rounded-lg shadow-lg mb-4">
                  <QRCode
                    value={portalUrl}
                    size={200}
                    bgColor="white"
                    fgColor="#7c3aed"
                  />
                </View>

                <View className="grid grid-cols-2 gap-2 w-full">
                  <TouchableOpacity
                    onPress={downloadQRCode}
                    disabled={downloading}
                    className="flex-row items-center justify-center gap-2 p-3 bg-purple-600 rounded-lg"
                  >
                    {downloading ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Download size={20} color="white" />
                    )}
                    <Text className="text-white font-medium">Download QR</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={copyToClipboard}
                    className={`flex-row items-center justify-center gap-2 p-3 rounded-lg ${
                      copied ? "bg-green-600" : "bg-blue-600"
                    }`}
                  >
                    <Copy size={20} color="white" />
                    <Text className="text-white font-medium">
                      {copied ? "Copied!" : "Copy Link"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>

          <View className="flex-row justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            {showQR && portalUrl && (
              <TouchableOpacity
                onPress={() => setShowQR(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
              >
                <Text className={currentTheme.text}>← Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={onClose}
              className="ml-auto px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
            >
              <Text className={currentTheme.text}>Close</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

// ============ MAIN PAGE COMPONENT ============
export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [universities, setUniversities] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [documentTemplates, setDocumentTemplates] = useState<
    DocumentTemplate[]
  >([]);
  const [paymentTemplates, setPaymentTemplates] = useState<PaymentTemplate[]>(
    [],
  );
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [theme, setTheme] = useState<Theme>("dark");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | undefined>();
  const [modalMode, setModalMode] = useState<"create" | "edit" | "upgrade">(
    "create",
  );
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedStudentDetail, setSelectedStudentDetail] =
    useState<Student | null>(null);
  const [portalModalOpen, setPortalModalOpen] = useState(false);
  const [isCreatingStudent, setIsCreatingStudent] = useState(false);
  const [isUpgradingStudent, setIsUpgradingStudent] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [dontShowDeleteConfirm, setDontShowDeleteConfirm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const router = useRouter();
  const currentTheme = themeConfigs[theme];
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

  const fetchStudents = async (isBackgroundUpdate = false) => {
    try {
      if (!isBackgroundUpdate) {
        setLoading(true);
      }

      const cacheKey = `students:${searchQuery}:${statusFilter}`;
      const url = `/dashboard/students${
        searchQuery || statusFilter !== "all"
          ? `?${new URLSearchParams({
              ...(searchQuery && { search: searchQuery }),
              ...(statusFilter !== "all" && { status: statusFilter }),
            })}`
          : ""
      }`;

      const studentsData = await cachedFetch<Student[]>(
        url,
        cacheKey,
        2 * 60 * 1000,
      );
      setStudents(studentsData || []);
      setSelectedStudents([]);
    } catch (error) {
      console.error("Error fetching students:", error);
      showToast("Failed to fetch students", "error");
      setStudents([]);
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

  const fetchBranches = async () => {
    try {
      const branchesData = await cachedFetch<Branch[]>(
        "/dashboard/branches/list",
        "branches",
        30 * 60 * 1000,
      );
      setBranches(branchesData || []);
    } catch (error) {
      console.error("Error fetching branches:", error);
      setBranches([]);
    }
  };

  const fetchCountries = async () => {
    try {
      const countriesData = await cachedFetch<any[]>(
        "/dashboard/countries",
        "countries",
        30 * 60 * 1000,
      );
      setCountries(countriesData || []);
    } catch (error) {
      console.error("Error fetching countries:", error);
      setCountries([]);
    }
  };

  const fetchDocumentTemplates = async () => {
    try {
      const templatesData = await cachedFetch<DocumentTemplate[]>(
        "/dashboard/documentTemplates",
        "documentTemplates",
        5 * 60 * 1000,
      );
      setDocumentTemplates(templatesData || []);
    } catch (error) {
      console.error("Error fetching document templates:", error);
      setDocumentTemplates([]);
    }
  };

  const fetchPaymentTemplates = async () => {
    try {
      const templatesData = await cachedFetch<PaymentTemplate[]>(
        "/dashboard/paymentsTemplates",
        "paymentTemplates",
        5 * 60 * 1000,
      );
      setPaymentTemplates(templatesData || []);
    } catch (error) {
      console.error("Error fetching payment templates:", error);
      setPaymentTemplates([]);
    }
  };

  const fetchEssentialData = useCallback(async () => {
    await Promise.all([
      fetchStudents(false),
      fetchUsers(),
      fetchBranches(),
      fetchCountries(),
      fetchDocumentTemplates(),
      fetchPaymentTemplates(),
    ]);
  }, [searchQuery, statusFilter]);

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

  useEffect(() => {
    fetchCurrentUser();
    fetchEssentialData();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [searchQuery, statusFilter]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    showToast("Refreshing students...", "info");
    cacheManager.delete("students");
    fetchStudents();
  }, [fetchStudents]);

  const handleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map((s) => s.$id));
    }
  };

  const handleSelectStudent = (studentId: string) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter((id) => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

  const handleBulkDelete = () => {
    if (selectedStudents.length === 0) {
      showToast("Please select at least one student to delete", "warning");
      return;
    }

    if (dontShowDeleteConfirm) {
      performBulkDelete();
      return;
    }

    Alert.alert(
      "Delete Multiple Students",
      `Are you sure you want to delete ${selectedStudents.length} selected student(s)? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => performBulkDelete(),
        },
      ],
    );
  };

  const performBulkDelete = async () => {
    try {
      setIsBulkDeleting(true);
      const response = await fetch(
        `${API_URL}/dashboard/students/bulk-delete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ studentIds: selectedStudents }),
        },
      );

      const result = await response.json();

      if (result.success) {
        showToast(
          `Successfully deleted ${result.data.deletedCount} student(s)`,
          "success",
        );
        setSelectedStudents([]);
        cacheManager.delete("students");
        fetchEssentialData();
      } else {
        showToast(result.error || "Failed to delete students", "error");
      }
    } catch (error) {
      console.error("Error deleting students:", error);
      showToast("Error deleting students", "error");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleCreateStudent = async (
    formData: StudentFormData & { avatar?: File },
  ) => {
    try {
      setIsCreatingStudent(true);

      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formDataToSend.append(key, value.toString());
        }
      });

      if (formData.avatar) {
        formDataToSend.append("avatar", formData.avatar);
      }

      const response = await fetch(`${API_URL}/dashboard/students`, {
        method: "POST",
        body: formDataToSend,
      });

      const result = await response.json();

      if (result.success) {
        showToast("Student created successfully", "success");
        setIsModalOpen(false);
        cacheManager.delete("students");
        fetchEssentialData();
      } else {
        showToast(result.error || "Failed to create student", "error");
      }
    } catch (error) {
      console.error("Error creating student:", error);
      showToast("Error creating student", "error");
    } finally {
      setIsCreatingStudent(false);
    }
  };

  const handleEditStudent = async (
    formData: StudentFormData & { avatar?: File },
  ) => {
    if (!editingStudent) return;

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("studentId", editingStudent.$id);
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formDataToSend.append(key, value.toString());
        }
      });

      if (formData.avatar) {
        formDataToSend.append("avatar", formData.avatar);
      }

      const response = await fetch(
        `${API_URL}/dashboard/students/${editingStudent.$id}`,
        {
          method: "PATCH",
          body: formDataToSend,
        },
      );

      const result = await response.json();

      if (result.success) {
        showToast("Student updated successfully", "success");
        setIsModalOpen(false);
        setEditingStudent(undefined);
        cacheManager.delete("students");
        fetchEssentialData();
      } else {
        showToast(result.error || "Failed to update student", "error");
      }
    } catch (error) {
      console.error("Error updating student:", error);
      showToast("Error updating student", "error");
    }
  };

  const handleUpgradeToInProcess = async (
    studentId: string,
    templateData: { paymentTemplateId: string; documentTemplateId: string },
  ) => {
    try {
      setIsUpgradingStudent(true);
      const payload: StatusUpdatePayload = {
        status: "in_process",
        paymentTemplateId: templateData.paymentTemplateId,
        documentTemplateId: templateData.documentTemplateId,
      };

      const response = await fetch(
        `${API_URL}/dashboard/students/${studentId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const result = await response.json();

      if (result.success) {
        showToast("Student upgraded to in_process status", "success");
        setIsModalOpen(false);
        setEditingStudent(undefined);
        cacheManager.delete("students");
        setTimeout(() => {
          fetchEssentialData();
        }, 1500);
      } else {
        showToast(result.error || "Failed to upgrade student", "error");
      }
    } catch (error) {
      console.error("Error upgrading student:", error);
      showToast("Error upgrading student", "error");
    } finally {
      setIsUpgradingStudent(false);
    }
  };

  const handleModalSave = async (
    formData: StudentFormData & { avatar?: File },
  ) => {
    if (modalMode === "upgrade" && editingStudent) {
      await handleUpgradeToInProcess(editingStudent.$id, {
        paymentTemplateId: formData.paymentTemplates,
        documentTemplateId: formData.documentsTemplates,
      });
    } else if (editingStudent) {
      await handleEditStudent(formData);
    } else {
      await handleCreateStudent(formData);
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (dontShowDeleteConfirm) {
      performDelete(studentId);
      return;
    }

    Alert.alert(
      "Delete Student",
      "Are you sure you want to delete this student? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => performDelete(studentId),
        },
      ],
    );
  };

  const performDelete = async (studentId: string) => {
    try {
      const response = await fetch(
        `${API_URL}/dashboard/students/${studentId}`,
        {
          method: "DELETE",
        },
      );

      const result = await response.json();

      if (result.success) {
        showToast("Student deleted successfully", "success");
        cacheManager.delete("students");
        fetchEssentialData();
        setDetailModalOpen(false);
        setSelectedStudentDetail(null);
      } else {
        showToast(result.error || "Failed to delete student", "error");
      }
    } catch (error) {
      console.error("Error deleting student:", error);
      showToast("Error deleting student", "error");
    }
  };

  const openCreateModal = () => {
    setEditingStudent(undefined);
    setModalMode("create");
    setIsModalOpen(true);
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const openUpgradeModal = (student: Student) => {
    if (student.status === "new") {
      setEditingStudent(student);
      setModalMode("upgrade");
      setIsModalOpen(true);
    } else {
      showToast(`Student is already in ${student.status} status`, "warning");
    }
  };

  const openDetailModal = (student: Student) => {
    setSelectedStudentDetail(student);
    setDetailModalOpen(true);
  };

  const openPortalModal = (student: Student) => {
    setSelectedStudentDetail(student);
    setPortalModalOpen(true);
  };

  const handleStudentPress = (student: Student) => {
    openDetailModal(student);
  };

  const handleStudentMorePress = (student: Student) => {
    Alert.alert("Student Actions", "Choose an action", [
      { text: "View Details", onPress: () => openDetailModal(student) },
      { text: "Edit", onPress: () => openEditModal(student) },
      { text: "Upgrade", onPress: () => openUpgradeModal(student) },
      { text: "Generate Portal", onPress: () => openPortalModal(student) },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => handleDeleteStudent(student.$id),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      if (statusFilter !== "all" && student.status !== statusFilter)
        return false;
      if (!searchQuery) return true;

      const searchLower = searchQuery.toLowerCase();
      return (
        student.firstName.toLowerCase().includes(searchLower) ||
        student.lastName.toLowerCase().includes(searchLower) ||
        student.email.toLowerCase().includes(searchLower) ||
        (student.contact &&
          student.contact.toLowerCase().includes(searchLower)) ||
        (student.passportNumber &&
          student.passportNumber.toLowerCase().includes(searchLower))
      );
    });
  }, [students, searchQuery, statusFilter]);

  const stats = [
    {
      icon: Users,
      label: "Total Students",
      value: students.length.toString(),
      color: "bg-purple-500",
    },
    {
      icon: UserPlus,
      label: "New",
      value: students.filter((s) => s.status === "new").length.toString(),
      color: "bg-blue-500",
    },
    {
      icon: UserCheck,
      label: "In Process",
      value: students
        .filter((s) => s.status === "in_process")
        .length.toString(),
      color: "bg-yellow-500",
    },
    {
      icon: Award,
      label: "Qualified",
      value: students.filter((s) => s.status === "qualified").length.toString(),
      color: "bg-green-500",
    },
  ];

  const statusFilters = [
    { value: "all", label: "All Students" },
    { value: "new", label: "New" },
    { value: "in_process", label: "In Process" },
    { value: "qualified", label: "Qualified" },
    { value: "rejected", label: "Rejected" },
  ];

  const StatsCard = ({ icon: Icon, title, value, color }: any) => (
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

  if (loading && students.length === 0) {
    return (
      <SafeAreaView
        className={`flex-1 ${currentTheme.background} items-center justify-center`}
      >
        <ActivityIndicator size="large" color={currentTheme.primary} />
        <Text className={`mt-4 ${currentTheme.text}`}>Loading students...</Text>
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
              Students Management
            </Text>
            <Text className={`text-sm ${currentTheme.textMuted} mt-1`}>
              Manage your organization students
            </Text>
          </View>

          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={onRefresh}
              className="p-2.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <RefreshCw
                size={20}
                color={currentTheme.textMuted}
                className={refreshing ? "animate-spin" : ""}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowFilters(!showFilters)}
              className="p-2.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <Filter size={20} color={currentTheme.textMuted} />
            </TouchableOpacity>

            {currentUser?.role === "admin" && (
              <TouchableOpacity
                onPress={openCreateModal}
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
            placeholder="Search students..."
            placeholderTextColor={currentTheme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            className={`pl-10 pr-4 py-3 ${currentTheme.card} rounded-xl border ${currentTheme.border} ${currentTheme.text}`}
          />
        </View>

        {/* Bulk Selection Info */}
        {selectedStudents.length > 0 && (
          <Animated.View
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(200)}
            className="mb-4 p-4 bg-purple-100 dark:bg-purple-500/20 rounded-xl border border-purple-200 dark:border-purple-800"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <View className="w-8 h-8 rounded-full bg-purple-600 items-center justify-center">
                  <Check size={16} color="white" />
                </View>
                <View>
                  <Text className={`font-medium ${currentTheme.text}`}>
                    {selectedStudents.length} student
                    {selectedStudents.length !== 1 ? "s" : ""} selected
                  </Text>
                  <TouchableOpacity onPress={() => setSelectedStudents([])}>
                    <Text className="text-sm text-purple-600 dark:text-purple-400">
                      Clear selection
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity
                onPress={handleBulkDelete}
                disabled={isBulkDeleting}
                className="flex-row items-center gap-2 px-4 py-2 bg-red-600 rounded-lg"
              >
                {isBulkDeleting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Trash2 size={16} color="white" />
                )}
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
                {statusFilters.map((filter) => (
                  <TouchableOpacity
                    key={filter.value}
                    onPress={() => setStatusFilter(filter.value)}
                    className={`px-3 py-1.5 rounded-lg ${
                      statusFilter === filter.value
                        ? "bg-purple-600"
                        : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    <Text
                      className={
                        statusFilter === filter.value
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

      {/* Students Grid */}
      <FlatList
        ref={flatListRef}
        data={filteredStudents}
        numColumns={2}
        keyExtractor={(item) => item.$id}
        renderItem={({ item }) => (
          <StudentCard
            student={item}
            isSelected={selectedStudents.includes(item.$id)}
            onSelect={() => handleSelectStudent(item.$id)}
            onPress={() => handleStudentPress(item)}
            onMorePress={() => handleStudentMorePress(item)}
          />
        )}
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
            <Users size={48} color={currentTheme.textMuted} />
            <Text className={`text-lg font-medium mt-4 ${currentTheme.text}`}>
              {searchQuery ? "No matching students found" : "No students yet"}
            </Text>
            <Text
              className={`text-sm ${currentTheme.textMuted} mt-2 text-center`}
            >
              {searchQuery
                ? "Try a different search term"
                : "Get started by creating your first student"}
            </Text>
            {!searchQuery && currentUser?.role === "admin" && (
              <TouchableOpacity
                onPress={openCreateModal}
                className="mt-4 px-4 py-2 bg-purple-600 rounded-lg"
              >
                <Text className="text-white">Create Student</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* Student Detail Modal */}
      <StudentDetailModal
        student={selectedStudentDetail}
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedStudentDetail(null);
        }}
        onEdit={openEditModal}
        onDelete={handleDeleteStudent}
        onUpgrade={openUpgradeModal}
        onGeneratePortal={openPortalModal}
      />

      {/* Student Form Modal */}
      <StudentModal
        student={editingStudent}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingStudent(undefined);
        }}
        onSave={handleModalSave}
        users={users}
        branches={branches}
        countries={countries}
        universities={universities}
        courses={courses}
        documentTemplates={documentTemplates}
        paymentTemplates={paymentTemplates}
        mode={modalMode}
        onUpgradeToInProcess={handleUpgradeToInProcess}
        isSaving={isCreatingStudent || isUpgradingStudent}
      />

      {/* Portal Link Modal */}
      <PortalLinkModal
        student={selectedStudentDetail}
        isOpen={portalModalOpen}
        onClose={() => {
          setPortalModalOpen(false);
          setSelectedStudentDetail(null);
        }}
      />
    </SafeAreaView>
  );
}
