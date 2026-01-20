import { API_URL } from "@/config";
import { Theme, themeConfigs } from "@/theme";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
    AlertTriangle,
    ArrowLeft,
    Calendar,
    Check,
    ChevronDown,
    ChevronUp,
    Clock,
    DollarSign,
    Flag,
    Globe,
    GraduationCap,
    Home,
    Languages,
    Mail,
    MoreVertical,
    Phone,
    RefreshCw,
    School,
    Search,
    Tag,
    Target,
    TrendingUp,
    User,
    UserCheck,
    UserPlus,
    Users,
    X
} from "lucide-react-native";
import React, {
    useCallback,
    useEffect,
    useMemo,
    useState
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
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

// ============ TYPES ============
interface Lead {
  id: string;
  $id: string;
  firstName: string;
  lastName: string;
  email: string;
  contact: string;
  leadStatus:
    | "new"
    | "contacted"
    | "qualified"
    | "converted"
    | "lost"
    | "disqualified";
  status: "new" | "in_process" | "qualified" | "rejected";
  $createdAt: string;
  gender?: string;
  dateOfBirth?: string;
  interestedArea?: string;
  followUpDate?: string;
  previousEducation?: string;
  intendedStartDate?: string;
  countries?: string;
  budgetRange?: string;
  notes?: string;
  source?: string;
  referralSource?: string;
  leadSource?: string;
  campaign?: string;
  educationLevel?: string;
  englishProficiency?: string;
  priorityScore?: number;
  engagementScore?: number;
  followUpPriority?: "low" | "medium" | "high" | "urgent";
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  tags?: string[];
  conversionDate?: string;
  canConvert?: boolean;
  isConverted?: boolean;
  contactAttempts?: number;
  analytics?: {
    followUpRequired: boolean;
  };
}

interface User {
  id: string;
  $id: string;
  name: string;
  email: string;
  role: string;
  organizationId: string;
}

// ============ COMPONENTS ============

// Toast Component
const Toast = ({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error" | "info" | "warning";
  onClose: () => void;
}) => {
  const getColors = () => {
    switch (type) {
      case "success":
        return ["#10b981", "#059669"];
      case "error":
        return ["#ef4444", "#dc2626"];
      case "warning":
        return ["#f59e0b", "#d97706"];
      default:
        return ["#3b82f6", "#2563eb"];
    }
  };

  return (
    <Animated.View
      entering={SlideInDown.duration(300)}
      exiting={SlideOutDown.duration(200)}
      className="absolute top-4 left-4 right-4 z-50"
    >
      <LinearGradient
        colors={getColors()}
        className="rounded-xl px-6 py-4 flex-row items-center justify-between shadow-2xl"
      >
        <Text className="text-white font-medium flex-1">{message}</Text>
        <TouchableOpacity onPress={onClose}>
          <X size={20} color="white" />
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );
};

// Confirmation Modal Component
const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = "warning",
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  type?: "warning" | "danger";
}) => {
  const [theme] = useState<"dark">("dark");
  const currentTheme = themeConfigs[theme];

  if (!isOpen) return null;

  return (
    <Modal visible={isOpen} animationType="fade" transparent={true}>
      <View className="flex-1 bg-black/50 backdrop-blur-sm items-center justify-center p-4">
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          className={`${currentTheme.card} rounded-2xl border ${currentTheme.border} w-full max-w-md`}
        >
          <View className="p-6">
            <View
              className={`w-12 h-12 rounded-full ${
                type === "danger"
                  ? "bg-red-100 dark:bg-red-900/20"
                  : "bg-yellow-100 dark:bg-yellow-900/20"
              } items-center justify-center mb-4 self-center`}
            >
              <AlertTriangle
                size={24}
                color={type === "danger" ? "#ef4444" : "#f59e0b"}
              />
            </View>

            <Text
              className={`text-xl font-bold text-center ${currentTheme.text} mb-2`}
            >
              {title}
            </Text>
            <Text className={`text-center ${currentTheme.textMuted} mb-6`}>
              {message}
            </Text>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={onClose}
                className="flex-1 py-3 rounded-xl border border-gray-300 dark:border-gray-600 items-center"
              >
                <Text className={currentTheme.text}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onConfirm}
                className={`flex-1 py-3 rounded-xl items-center ${
                  type === "danger" ? "bg-red-600" : "bg-yellow-600"
                }`}
              >
                <Text className="text-white font-medium">Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

// Lead Modal Component
const LeadModal = ({
  lead,
  isOpen,
  onClose,
  onSave,
}: {
  lead?: Lead;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}) => {
  const [theme] = useState<"dark">("dark");
  const currentTheme = themeConfigs[theme];
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    contact: "",
    gender: "",
    dateOfBirth: "",
    interestedArea: "",
    followUpDate: "",
    previousEducation: "",
    intendedStartDate: "",
    countries: "",
    budgetRange: "",
    notes: "",
    source: "manual",
    referralSource: "direct",
    leadSource: "",
    campaign: "",
    educationLevel: "",
    englishProficiency: "",
    priorityScore: 10,
    engagementScore: 0,
    followUpPriority: "medium",
    utmSource: "",
    utmMedium: "",
    utmCampaign: "",
    utmTerm: "",
    utmContent: "",
    tags: [] as string[],
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    if (lead) {
      setFormData({
        firstName: lead.firstName || "",
        lastName: lead.lastName || "",
        email: lead.email || "",
        contact: lead.contact || "",
        gender: lead.gender || "",
        dateOfBirth: lead.dateOfBirth?.split("T")[0] || "",
        interestedArea: lead.interestedArea || "",
        followUpDate: lead.followUpDate?.split("T")[0] || "",
        previousEducation: lead.previousEducation || "",
        intendedStartDate: lead.intendedStartDate?.split("T")[0] || "",
        countries: lead.countries || "",
        budgetRange: lead.budgetRange || "",
        notes: lead.notes || "",
        source: lead.source || "manual",
        referralSource: lead.referralSource || "direct",
        leadSource: lead.leadSource || "",
        campaign: lead.campaign || "",
        educationLevel: lead.educationLevel || "",
        englishProficiency: lead.englishProficiency || "",
        priorityScore: lead.priorityScore || 10,
        engagementScore: lead.engagementScore || 0,
        followUpPriority: lead.followUpPriority || "medium",
        utmSource: lead.utmSource || "",
        utmMedium: lead.utmMedium || "",
        utmCampaign: lead.utmCampaign || "",
        utmTerm: lead.utmTerm || "",
        utmContent: lead.utmContent || "",
        tags: lead.tags || [],
      });
    } else {
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        contact: "",
        gender: "",
        dateOfBirth: "",
        interestedArea: "",
        followUpDate: "",
        previousEducation: "",
        intendedStartDate: "",
        countries: "",
        budgetRange: "",
        notes: "",
        source: "manual",
        referralSource: "direct",
        leadSource: "",
        campaign: "",
        educationLevel: "",
        englishProficiency: "",
        priorityScore: 10,
        engagementScore: 0,
        followUpPriority: "medium",
        utmSource: "",
        utmMedium: "",
        utmCampaign: "",
        utmTerm: "",
        utmContent: "",
        tags: [],
      });
    }
    setErrors({});
    setTagInput("");
  }, [lead, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!formData.contact.trim()) {
      newErrors.contact = "Contact number is required";
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email address";
    }

    if (formData.priorityScore < 1 || formData.priorityScore > 100) {
      newErrors.priorityScore = "Priority score must be between 1-100";
    }

    if (formData.engagementScore < 0 || formData.engagementScore > 100) {
      newErrors.engagementScore = "Engagement score must be between 0-100";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSaving(true);

      const submissionData = {
        ...formData,
        dateOfBirth: formData.dateOfBirth || null,
        followUpDate: formData.followUpDate || null,
        intendedStartDate: formData.intendedStartDate || null,
        priorityScore: parseInt(formData.priorityScore.toString()),
        engagementScore: parseInt(formData.engagementScore.toString()),
      };

      await onSave(submissionData);
    } catch (error) {
      console.error("Error saving lead:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      handleChange("tags", [...formData.tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    handleChange(
      "tags",
      formData.tags.filter((tag) => tag !== tagToRemove),
    );
  };

  if (!isOpen) return null;

  return (
    <Modal visible={isOpen} animationType="slide" transparent={true}>
      <View className="flex-1 bg-black/50 justify-end">
        <Animated.View
          entering={SlideInDown.duration(300)}
          exiting={SlideOutDown.duration(200)}
          className={`${currentTheme.card} rounded-t-3xl p-6 max-h-[90vh]`}
        >
          <View className="flex-row justify-between items-center mb-6">
            <View>
              <Text className={`text-xl font-bold ${currentTheme.text}`}>
                {lead ? "Edit Lead" : "Add New Lead"}
              </Text>
              <Text className={`text-sm ${currentTheme.textMuted} mt-1`}>
                {lead
                  ? "Update lead information"
                  : "Enter lead details for potential student"}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} disabled={isSaving}>
              <X size={24} color={currentTheme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="space-y-6">
              {/* Personal Information */}
              <View>
                <View className="flex-row items-center gap-2 mb-4">
                  <User size={20} color={currentTheme.text} />
                  <Text className={`text-lg font-medium ${currentTheme.text}`}>
                    Personal Information
                  </Text>
                </View>

                <View className="space-y-4">
                  <View className="flex-row gap-4">
                    <View className="flex-1">
                      <Text className={`font-medium ${currentTheme.text} mb-2`}>
                        First Name *
                      </Text>
                      <TextInput
                        value={formData.firstName}
                        onChangeText={(text) => handleChange("firstName", text)}
                        className={`px-3 py-2 rounded-lg border ${
                          errors.firstName
                            ? "border-red-500"
                            : currentTheme.border
                        } ${currentTheme.text} ${currentTheme.card}`}
                        placeholder="Enter first name"
                      />
                      {errors.firstName && (
                        <Text className="text-red-500 text-xs mt-1">
                          {errors.firstName}
                        </Text>
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className={`font-medium ${currentTheme.text} mb-2`}>
                        Last Name *
                      </Text>
                      <TextInput
                        value={formData.lastName}
                        onChangeText={(text) => handleChange("lastName", text)}
                        className={`px-3 py-2 rounded-lg border ${
                          errors.lastName
                            ? "border-red-500"
                            : currentTheme.border
                        } ${currentTheme.text} ${currentTheme.card}`}
                        placeholder="Enter last name"
                      />
                      {errors.lastName && (
                        <Text className="text-red-500 text-xs mt-1">
                          {errors.lastName}
                        </Text>
                      )}
                    </View>
                  </View>

                  <View className="flex-row gap-4">
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2 mb-2">
                        <Mail size={16} color={currentTheme.textMuted} />
                        <Text className={`font-medium ${currentTheme.text}`}>
                          Email Address
                        </Text>
                      </View>
                      <TextInput
                        value={formData.email}
                        onChangeText={(text) => handleChange("email", text)}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        className={`px-3 py-2 rounded-lg border ${
                          errors.email ? "border-red-500" : currentTheme.border
                        } ${currentTheme.text} ${currentTheme.card}`}
                        placeholder="Enter email address"
                      />
                      {errors.email && (
                        <Text className="text-red-500 text-xs mt-1">
                          {errors.email}
                        </Text>
                      )}
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2 mb-2">
                        <Phone size={16} color={currentTheme.textMuted} />
                        <Text className={`font-medium ${currentTheme.text}`}>
                          Contact Number *
                        </Text>
                      </View>
                      <TextInput
                        value={formData.contact}
                        onChangeText={(text) => handleChange("contact", text)}
                        keyboardType="phone-pad"
                        className={`px-3 py-2 rounded-lg border ${
                          errors.contact
                            ? "border-red-500"
                            : currentTheme.border
                        } ${currentTheme.text} ${currentTheme.card}`}
                        placeholder="Enter phone number"
                      />
                      {errors.contact && (
                        <Text className="text-red-500 text-xs mt-1">
                          {errors.contact}
                        </Text>
                      )}
                    </View>
                  </View>

                  <View className="flex-row gap-4">
                    <View className="flex-1">
                      <Text className={`font-medium ${currentTheme.text} mb-2`}>
                        Gender
                      </Text>
                      <View className="flex-row gap-2">
                        {["male", "female", "other"].map((gender) => (
                          <TouchableOpacity
                            key={gender}
                            onPress={() => handleChange("gender", gender)}
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
                    <View className="flex-1">
                      <Text className={`font-medium ${currentTheme.text} mb-2`}>
                        Date of Birth
                      </Text>
                      <TextInput
                        value={formData.dateOfBirth}
                        onChangeText={(text) =>
                          handleChange("dateOfBirth", text)
                        }
                        placeholder="YYYY-MM-DD"
                        className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                      />
                    </View>
                  </View>
                </View>
              </View>

              {/* Academic & Interest Information */}
              <View>
                <View className="flex-row items-center gap-2 mb-4">
                  <GraduationCap size={20} color={currentTheme.text} />
                  <Text className={`text-lg font-medium ${currentTheme.text}`}>
                    Academic Information
                  </Text>
                </View>

                <View className="space-y-4">
                  <View className="flex-row gap-4">
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2 mb-2">
                        <BookOpen size={16} color={currentTheme.textMuted} />
                        <Text className={`font-medium ${currentTheme.text}`}>
                          Interest Area
                        </Text>
                      </View>
                      <TextInput
                        value={formData.interestedArea}
                        onChangeText={(text) =>
                          handleChange("interestedArea", text)
                        }
                        className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                        placeholder="e.g., Engineering, Business, Medicine"
                      />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2 mb-2">
                        <Globe size={16} color={currentTheme.textMuted} />
                        <Text className={`font-medium ${currentTheme.text}`}>
                          Target Country
                        </Text>
                      </View>
                      <TextInput
                        value={formData.countries}
                        onChangeText={(text) => handleChange("countries", text)}
                        className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                        placeholder="e.g., USA, UK, Canada"
                      />
                    </View>
                  </View>

                  <View className="flex-row gap-4">
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2 mb-2">
                        <DollarSign size={16} color={currentTheme.textMuted} />
                        <Text className={`font-medium ${currentTheme.text}`}>
                          Budget Range
                        </Text>
                      </View>
                      <View className="border rounded-lg p-2">
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                        >
                          <View className="flex-row gap-2">
                            {[
                              { value: "under_10000", label: "Under $10,000" },
                              {
                                value: "10000_25000",
                                label: "$10,000 - $25,000",
                              },
                              {
                                value: "25000_50000",
                                label: "$25,000 - $50,000",
                              },
                              {
                                value: "50000_100000",
                                label: "$50,000 - $100,000",
                              },
                              { value: "over_100000", label: "Over $100,000" },
                            ].map((option) => (
                              <TouchableOpacity
                                key={option.value}
                                onPress={() =>
                                  handleChange("budgetRange", option.value)
                                }
                                className={`px-3 py-1.5 rounded-lg ${
                                  formData.budgetRange === option.value
                                    ? "bg-purple-600"
                                    : "bg-gray-100 dark:bg-gray-800"
                                }`}
                              >
                                <Text
                                  className={
                                    formData.budgetRange === option.value
                                      ? "text-white"
                                      : currentTheme.text
                                  }
                                >
                                  {option.label}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </ScrollView>
                      </View>
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2 mb-2">
                        <School size={16} color={currentTheme.textMuted} />
                        <Text className={`font-medium ${currentTheme.text}`}>
                          Education Level
                        </Text>
                      </View>
                      <View className="border rounded-lg p-2">
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                        >
                          <View className="flex-row gap-2">
                            {[
                              { value: "high_school", label: "High School" },
                              { value: "associate", label: "Associate" },
                              { value: "bachelor", label: "Bachelor's" },
                              { value: "master", label: "Master's" },
                              { value: "phd", label: "PhD" },
                              { value: "other", label: "Other" },
                            ].map((option) => (
                              <TouchableOpacity
                                key={option.value}
                                onPress={() =>
                                  handleChange("educationLevel", option.value)
                                }
                                className={`px-3 py-1.5 rounded-lg ${
                                  formData.educationLevel === option.value
                                    ? "bg-purple-600"
                                    : "bg-gray-100 dark:bg-gray-800"
                                }`}
                              >
                                <Text
                                  className={
                                    formData.educationLevel === option.value
                                      ? "text-white"
                                      : currentTheme.text
                                  }
                                >
                                  {option.label}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </ScrollView>
                      </View>
                    </View>
                  </View>

                  <View className="flex-row gap-4">
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2 mb-2">
                        <Languages size={16} color={currentTheme.textMuted} />
                        <Text className={`font-medium ${currentTheme.text}`}>
                          English Proficiency
                        </Text>
                      </View>
                      <View className="flex-row gap-2">
                        {[
                          { value: "beginner", label: "Beginner" },
                          { value: "intermediate", label: "Intermediate" },
                          { value: "advanced", label: "Advanced" },
                          { value: "native", label: "Native" },
                        ].map((option) => (
                          <TouchableOpacity
                            key={option.value}
                            onPress={() =>
                              handleChange("englishProficiency", option.value)
                            }
                            className={`flex-1 py-2 rounded-lg border items-center ${
                              formData.englishProficiency === option.value
                                ? "border-purple-600 bg-purple-100 dark:bg-purple-500/20"
                                : currentTheme.border
                            }`}
                          >
                            <Text
                              className={
                                formData.englishProficiency === option.value
                                  ? "text-purple-600 dark:text-purple-400 font-medium"
                                  : currentTheme.text
                              }
                            >
                              {option.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2 mb-2">
                        <Calendar size={16} color={currentTheme.textMuted} />
                        <Text className={`font-medium ${currentTheme.text}`}>
                          Intended Start Date
                        </Text>
                      </View>
                      <TextInput
                        value={formData.intendedStartDate}
                        onChangeText={(text) =>
                          handleChange("intendedStartDate", text)
                        }
                        placeholder="YYYY-MM-DD"
                        className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                      />
                    </View>
                  </View>

                  <View>
                    <Text className={`font-medium ${currentTheme.text} mb-2`}>
                      Previous Education
                    </Text>
                    <TextInput
                      value={formData.previousEducation}
                      onChangeText={(text) =>
                        handleChange("previousEducation", text)
                      }
                      multiline
                      numberOfLines={3}
                      className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                      placeholder="Describe previous education, degrees, certificates, etc."
                    />
                  </View>
                </View>
              </View>

              {/* Lead Scoring & Follow-up */}
              <View>
                <View className="flex-row items-center gap-2 mb-4">
                  <Target size={20} color={currentTheme.text} />
                  <Text className={`text-lg font-medium ${currentTheme.text}`}>
                    Lead Scoring & Follow-up
                  </Text>
                </View>

                <View className="space-y-4">
                  <View className="flex-row gap-4">
                    <View className="flex-1">
                      <Text className={`font-medium ${currentTheme.text} mb-2`}>
                        Priority Score (1-100)
                      </Text>
                      <TextInput
                        value={formData.priorityScore.toString()}
                        onChangeText={(text) =>
                          handleChange("priorityScore", parseInt(text) || 0)
                        }
                        keyboardType="numeric"
                        className={`px-3 py-2 rounded-lg border ${
                          errors.priorityScore
                            ? "border-red-500"
                            : currentTheme.border
                        } ${currentTheme.text} ${currentTheme.card}`}
                      />
                      {errors.priorityScore && (
                        <Text className="text-red-500 text-xs mt-1">
                          {errors.priorityScore}
                        </Text>
                      )}
                    </View>

                    <View className="flex-1">
                      <Text className={`font-medium ${currentTheme.text} mb-2`}>
                        Engagement Score (0-100)
                      </Text>
                      <TextInput
                        value={formData.engagementScore.toString()}
                        onChangeText={(text) =>
                          handleChange("engagementScore", parseInt(text) || 0)
                        }
                        keyboardType="numeric"
                        className={`px-3 py-2 rounded-lg border ${
                          errors.engagementScore
                            ? "border-red-500"
                            : currentTheme.border
                        } ${currentTheme.text} ${currentTheme.card}`}
                      />
                      {errors.engagementScore && (
                        <Text className="text-red-500 text-xs mt-1">
                          {errors.engagementScore}
                        </Text>
                      )}
                    </View>
                  </View>

                  <View>
                    <Text className={`font-medium ${currentTheme.text} mb-2`}>
                      Follow-up Priority
                    </Text>
                    <View className="flex-row gap-2">
                      {[
                        {
                          value: "low",
                          label: "Low",
                          color: "bg-green-100 text-green-600",
                        },
                        {
                          value: "medium",
                          label: "Medium",
                          color: "bg-yellow-100 text-yellow-600",
                        },
                        {
                          value: "high",
                          label: "High",
                          color: "bg-orange-100 text-orange-600",
                        },
                        {
                          value: "urgent",
                          label: "Urgent",
                          color: "bg-red-100 text-red-600",
                        },
                      ].map((option) => (
                        <TouchableOpacity
                          key={option.value}
                          onPress={() =>
                            handleChange("followUpPriority", option.value)
                          }
                          className={`flex-1 py-2 rounded-lg border items-center ${
                            formData.followUpPriority === option.value
                              ? "border-purple-600"
                              : currentTheme.border
                          }`}
                        >
                          <Text
                            className={
                              formData.followUpPriority === option.value
                                ? "text-purple-600 dark:text-purple-400 font-medium"
                                : currentTheme.text
                            }
                          >
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View>
                    <Text className={`font-medium ${currentTheme.text} mb-2`}>
                      Follow-up Date
                    </Text>
                    <TextInput
                      value={formData.followUpDate}
                      onChangeText={(text) =>
                        handleChange("followUpDate", text)
                      }
                      placeholder="YYYY-MM-DD"
                      className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                    />
                  </View>
                </View>
              </View>

              {/* Source & Tracking */}
              <View>
                <View className="flex-row items-center gap-2 mb-4">
                  <Tag size={20} color={currentTheme.text} />
                  <Text className={`text-lg font-medium ${currentTheme.text}`}>
                    Source & Tracking
                  </Text>
                </View>

                <View className="space-y-4">
                  <View className="flex-row gap-4">
                    <View className="flex-1">
                      <Text className={`font-medium ${currentTheme.text} mb-2`}>
                        Source
                      </Text>
                      <View className="flex-row gap-2 flex-wrap">
                        {[
                          "manual",
                          "website",
                          "referral",
                          "social_media",
                          "email",
                          "event",
                          "partner",
                          "other",
                        ].map((source) => (
                          <TouchableOpacity
                            key={source}
                            onPress={() => handleChange("source", source)}
                            className={`px-3 py-1.5 rounded-lg ${
                              formData.source === source
                                ? "bg-purple-600"
                                : "bg-gray-100 dark:bg-gray-800"
                            }`}
                          >
                            <Text
                              className={
                                formData.source === source
                                  ? "text-white"
                                  : currentTheme.text
                              }
                            >
                              {source.replace("_", " ")}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>

                  <View className="flex-row gap-4">
                    <View className="flex-1">
                      <Text className={`font-medium ${currentTheme.text} mb-2`}>
                        Lead Source
                      </Text>
                      <TextInput
                        value={formData.leadSource}
                        onChangeText={(text) =>
                          handleChange("leadSource", text)
                        }
                        className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                        placeholder="e.g., Facebook Ad, Google Search"
                      />
                    </View>

                    <View className="flex-1">
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

                  {/* UTM Parameters */}
                  <View>
                    <Text className={`font-medium ${currentTheme.text} mb-2`}>
                      UTM Parameters
                    </Text>
                    <View className="space-y-2">
                      <View className="flex-row gap-2">
                        <View className="flex-1">
                          <Text
                            className={`text-xs ${currentTheme.textMuted} mb-1`}
                          >
                            UTM Source
                          </Text>
                          <TextInput
                            value={formData.utmSource}
                            onChangeText={(text) =>
                              handleChange("utmSource", text)
                            }
                            className={`px-3 py-1.5 rounded-lg border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                            placeholder="Source"
                          />
                        </View>
                        <View className="flex-1">
                          <Text
                            className={`text-xs ${currentTheme.textMuted} mb-1`}
                          >
                            UTM Medium
                          </Text>
                          <TextInput
                            value={formData.utmMedium}
                            onChangeText={(text) =>
                              handleChange("utmMedium", text)
                            }
                            className={`px-3 py-1.5 rounded-lg border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                            placeholder="Medium"
                          />
                        </View>
                      </View>
                      <View className="flex-row gap-2">
                        <View className="flex-1">
                          <Text
                            className={`text-xs ${currentTheme.textMuted} mb-1`}
                          >
                            UTM Campaign
                          </Text>
                          <TextInput
                            value={formData.utmCampaign}
                            onChangeText={(text) =>
                              handleChange("utmCampaign", text)
                            }
                            className={`px-3 py-1.5 rounded-lg border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                            placeholder="Campaign"
                          />
                        </View>
                        <View className="flex-1">
                          <Text
                            className={`text-xs ${currentTheme.textMuted} mb-1`}
                          >
                            UTM Term
                          </Text>
                          <TextInput
                            value={formData.utmTerm}
                            onChangeText={(text) =>
                              handleChange("utmTerm", text)
                            }
                            className={`px-3 py-1.5 rounded-lg border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                            placeholder="Term"
                          />
                        </View>
                        <View className="flex-1">
                          <Text
                            className={`text-xs ${currentTheme.textMuted} mb-1`}
                          >
                            UTM Content
                          </Text>
                          <TextInput
                            value={formData.utmContent}
                            onChangeText={(text) =>
                              handleChange("utmContent", text)
                            }
                            className={`px-3 py-1.5 rounded-lg border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                            placeholder="Content"
                          />
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Tags */}
                  <View>
                    <Text className={`font-medium ${currentTheme.text} mb-2`}>
                      Tags
                    </Text>
                    <View className="flex-wrap flex-row gap-2 mb-2">
                      {formData.tags.map((tag, index) => (
                        <View
                          key={index}
                          className="flex-row items-center gap-1 px-3 py-1.5 rounded-full bg-purple-100 dark:bg-purple-900"
                        >
                          <Text className="text-purple-600 dark:text-purple-300 text-xs">
                            {tag}
                          </Text>
                          <TouchableOpacity
                            onPress={() => handleRemoveTag(tag)}
                          >
                            <X size={12} color="#8b5cf6" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                    <View className="flex-row gap-2">
                      <TextInput
                        value={tagInput}
                        onChangeText={setTagInput}
                        className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Add a tag"
                      />
                      <TouchableOpacity
                        onPress={handleAddTag}
                        className="px-4 py-2 bg-purple-100 dark:bg-purple-800 rounded-lg"
                      >
                        <Text className="text-purple-700 dark:text-purple-300">
                          Add
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>

              {/* Notes */}
              <View>
                <Text
                  className={`text-lg font-medium ${currentTheme.text} mb-4`}
                >
                  Notes
                </Text>
                <TextInput
                  value={formData.notes}
                  onChangeText={(text) => handleChange("notes", text)}
                  multiline
                  numberOfLines={4}
                  className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                  placeholder="Add any additional notes about this lead..."
                />
              </View>
            </View>
          </ScrollView>

          <View className="flex-row gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <TouchableOpacity
              onPress={onClose}
              disabled={isSaving}
              className="flex-1 py-3 rounded-xl border border-gray-300 dark:border-gray-600 items-center"
            >
              <Text className={currentTheme.text}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSaving}
              className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-500 rounded-xl items-center"
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-white font-medium">
                  {lead ? "Update Lead" : "Create Lead"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

// Convert Lead Modal Component
const ConvertLeadModal = ({
  lead,
  isOpen,
  onClose,
  onSave,
}: {
  lead?: Lead;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}) => {
  const [theme] = useState<"dark">("dark");
  const currentTheme = themeConfigs[theme];
  const [formData, setFormData] = useState({
    address: "",
    city: "",
    state: "",
    zipCode: "",
    nationality: "",
    emergencyContact: "",
    emergencyContactPhone: "",
    dateOfBirth: "",
    lastDegree: "",
    degreeGPA: "",
    currentInstitution: "",
    currentCourse: "",
    graduationYear: "",
    status: "new",
    notes: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (lead) {
      setFormData((prev) => ({
        ...prev,
        dateOfBirth: lead.dateOfBirth ? lead.dateOfBirth.split("T")[0] : "",
        notes: `Converted from lead on ${new Date().toLocaleDateString()}.\nPrevious interest: ${
          lead.interestedArea || "Not specified"
        }.\nBudget: ${lead.budgetRange || "Not specified"}\nSource: ${
          lead.source || "manual"
        }`,
      }));
    }
  }, [lead, isOpen]);

  const validateStep = (stepNumber: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (stepNumber === 1) {
      if (!formData.address.trim()) newErrors.address = "Address is required";
      if (!formData.city.trim()) newErrors.city = "City is required";
      if (!formData.state.trim()) newErrors.state = "State is required";
      if (!formData.dateOfBirth.trim())
        newErrors.dateOfBirth = "Date of birth is required";
      if (!formData.nationality.trim())
        newErrors.nationality = "Nationality is required";
      if (!formData.emergencyContact.trim())
        newErrors.emergencyContact = "Emergency contact is required";
      if (!formData.emergencyContactPhone.trim())
        newErrors.emergencyContactPhone = "Emergency contact phone is required";
    } else if (stepNumber === 2) {
      if (!formData.lastDegree)
        newErrors.lastDegree = "Last degree is required";
      if (formData.degreeGPA) {
        const gpa = parseFloat(formData.degreeGPA);
        if (isNaN(gpa) || gpa < 0 || gpa > 4.0) {
          newErrors.degreeGPA = "GPA must be between 0 and 4.0";
        }
      }
      if (formData.graduationYear) {
        const year = parseInt(formData.graduationYear);
        const currentYear = new Date().getFullYear();
        if (isNaN(year) || year < 1950 || year > currentYear + 5) {
          newErrors.graduationYear = "Invalid graduation year";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateStep(1) || !validateStep(2)) {
      setStep(1);
      return;
    }

    try {
      setIsSaving(true);
      await onSave(formData);
    } catch (error) {
      console.error("Error converting to student:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  if (!isOpen || !lead) return null;

  const steps = [
    { number: 1, title: "Lead Review", description: "Check lead details" },
    { number: 2, title: "Student Info", description: "Add student details" },
    { number: 3, title: "Confirmation", description: "Complete conversion" },
  ];

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <View className="space-y-6">
            <View className="bg-purple-100 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <View className="flex-row items-center gap-3 mb-2">
                <UserCheck size={20} color="#8b5cf6" />
                <Text className="text-lg font-semibold text-purple-800 dark:text-purple-400">
                  Convert Lead to Student
                </Text>
              </View>
              <Text className="text-sm text-purple-700 dark:text-purple-300">
                You are about to convert{" "}
                <Text className="font-bold">
                  {lead.firstName} {lead.lastName}
                </Text>{" "}
                from a lead to a full student. Review the lead details below
                before proceeding.
              </Text>
            </View>

            <View className="space-y-4">
              <Text className="font-medium text-gray-900 dark:text-white">
                Lead Qualification Summary:
              </Text>
              <View className="space-y-3">
                <View className="flex-row items-center gap-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <View className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 items-center justify-center">
                    <Text className="text-white font-medium text-lg">
                      {lead.firstName?.[0] || "L"}
                      {lead.lastName?.[0] || "D"}
                    </Text>
                  </View>
                  <View>
                    <Text className="font-semibold text-gray-900 dark:text-white">
                      {lead.firstName} {lead.lastName}
                    </Text>
                    <Text className="text-gray-600 dark:text-gray-400">
                      {lead.email || "No email"} • {lead.contact}
                    </Text>
                  </View>
                </View>

                <View className="grid grid-cols-2 gap-3">
                  <View>
                    <Text className="text-gray-500 dark:text-gray-400 text-sm">
                      Lead Status:
                    </Text>
                    <Text className="font-medium text-gray-900 dark:text-white">
                      {lead.leadStatus || "new"}
                    </Text>
                  </View>
                  <View>
                    <Text className="text-gray-500 dark:text-gray-400 text-sm">
                      Priority:
                    </Text>
                    <Text className="font-medium text-gray-900 dark:text-white">
                      {lead.followUpPriority || "medium"}
                    </Text>
                  </View>
                  <View className="col-span-2">
                    <View className="flex-row items-center gap-1">
                      <Target size={14} color={currentTheme.textMuted} />
                      <Text className="text-gray-500 dark:text-gray-400 text-sm">
                        Target Country & Interest:
                      </Text>
                    </View>
                    <Text className="font-medium text-gray-900 dark:text-white">
                      {lead.countries || "Not specified"} •{" "}
                      {lead.interestedArea || "Not specified"}
                    </Text>
                  </View>
                  <View className="col-span-2">
                    <View className="flex-row items-center gap-1">
                      <DollarSign size={14} color={currentTheme.textMuted} />
                      <Text className="text-gray-500 dark:text-gray-400 text-sm">
                        Budget Range:
                      </Text>
                    </View>
                    <Text className="font-medium text-gray-900 dark:text-white">
                      {lead.budgetRange || "Not specified"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View className="bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <Text className="text-sm text-blue-700 dark:text-blue-300">
                <Text className="font-bold">Next:</Text> You'll need to add
                additional student-specific information such as address,
                nationality, emergency contacts, and academic details.
              </Text>
            </View>
          </View>
        );

      case 2:
        return (
          <View className="space-y-6">
            <View>
              <View className="flex-row items-center gap-2 mb-4">
                <Home size={20} color={currentTheme.text} />
                <Text className="text-lg font-medium text-gray-900 dark:text-white">
                  Student Personal Information
                </Text>
              </View>

              <View className="space-y-4">
                <View>
                  <Text className={`font-medium ${currentTheme.text} mb-2`}>
                    Address *
                  </Text>
                  <TextInput
                    value={formData.address}
                    onChangeText={(text) => handleChange("address", text)}
                    className={`px-3 py-2 rounded-lg border ${
                      errors.address ? "border-red-500" : currentTheme.border
                    } ${currentTheme.text} ${currentTheme.card}`}
                    placeholder="Enter full address"
                  />
                  {errors.address && (
                    <Text className="text-red-500 text-xs mt-1">
                      {errors.address}
                    </Text>
                  )}
                </View>

                <View className="flex-row gap-4">
                  <View className="flex-1">
                    <Text className={`font-medium ${currentTheme.text} mb-2`}>
                      City *
                    </Text>
                    <TextInput
                      value={formData.city}
                      onChangeText={(text) => handleChange("city", text)}
                      className={`px-3 py-2 rounded-lg border ${
                        errors.city ? "border-red-500" : currentTheme.border
                      } ${currentTheme.text} ${currentTheme.card}`}
                      placeholder="Enter city"
                    />
                    {errors.city && (
                      <Text className="text-red-500 text-xs mt-1">
                        {errors.city}
                      </Text>
                    )}
                  </View>

                  <View className="flex-1">
                    <Text className={`font-medium ${currentTheme.text} mb-2`}>
                      State/Province *
                    </Text>
                    <TextInput
                      value={formData.state}
                      onChangeText={(text) => handleChange("state", text)}
                      className={`px-3 py-2 rounded-lg border ${
                        errors.state ? "border-red-500" : currentTheme.border
                      } ${currentTheme.text} ${currentTheme.card}`}
                      placeholder="Enter state or province"
                    />
                    {errors.state && (
                      <Text className="text-red-500 text-xs mt-1">
                        {errors.state}
                      </Text>
                    )}
                  </View>
                </View>

                <View className="flex-row gap-4">
                  <View className="flex-1">
                    <Text className={`font-medium ${currentTheme.text} mb-2`}>
                      ZIP/Postal Code
                    </Text>
                    <TextInput
                      value={formData.zipCode}
                      onChangeText={(text) => handleChange("zipCode", text)}
                      className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                      placeholder="Enter ZIP or postal code"
                    />
                  </View>

                  <View className="flex-1">
                    <Text className={`font-medium ${currentTheme.text} mb-2`}>
                      Date of Birth *
                    </Text>
                    <TextInput
                      value={formData.dateOfBirth}
                      onChangeText={(text) => handleChange("dateOfBirth", text)}
                      className={`px-3 py-2 rounded-lg border ${
                        errors.dateOfBirth
                          ? "border-red-500"
                          : currentTheme.border
                      } ${currentTheme.text} ${currentTheme.card}`}
                      placeholder="YYYY-MM-DD"
                    />
                    {errors.dateOfBirth && (
                      <Text className="text-red-500 text-xs mt-1">
                        {errors.dateOfBirth}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            </View>

            <View>
              <View className="flex-row items-center gap-2 mb-4">
                <Flag size={20} color={currentTheme.text} />
                <Text className="text-lg font-medium text-gray-900 dark:text-white">
                  Nationality & Emergency Contacts
                </Text>
              </View>

              <View className="space-y-4">
                <View className="flex-row gap-4">
                  <View className="flex-1">
                    <Text className={`font-medium ${currentTheme.text} mb-2`}>
                      Nationality *
                    </Text>
                    <TextInput
                      value={formData.nationality}
                      onChangeText={(text) => handleChange("nationality", text)}
                      className={`px-3 py-2 rounded-lg border ${
                        errors.nationality
                          ? "border-red-500"
                          : currentTheme.border
                      } ${currentTheme.text} ${currentTheme.card}`}
                      placeholder="Enter nationality"
                    />
                    {errors.nationality && (
                      <Text className="text-red-500 text-xs mt-1">
                        {errors.nationality}
                      </Text>
                    )}
                  </View>

                  <View className="flex-1">
                    <Text className={`font-medium ${currentTheme.text} mb-2`}>
                      Emergency Contact Name *
                    </Text>
                    <TextInput
                      value={formData.emergencyContact}
                      onChangeText={(text) =>
                        handleChange("emergencyContact", text)
                      }
                      className={`px-3 py-2 rounded-lg border ${
                        errors.emergencyContact
                          ? "border-red-500"
                          : currentTheme.border
                      } ${currentTheme.text} ${currentTheme.card}`}
                      placeholder="Enter emergency contact name"
                    />
                    {errors.emergencyContact && (
                      <Text className="text-red-500 text-xs mt-1">
                        {errors.emergencyContact}
                      </Text>
                    )}
                  </View>
                </View>

                <View>
                  <View className="flex-row items-center gap-2 mb-2">
                    <Phone size={16} color={currentTheme.textMuted} />
                    <Text className={`font-medium ${currentTheme.text}`}>
                      Emergency Contact Phone *
                    </Text>
                  </View>
                  <TextInput
                    value={formData.emergencyContactPhone}
                    onChangeText={(text) =>
                      handleChange("emergencyContactPhone", text)
                    }
                    keyboardType="phone-pad"
                    className={`px-3 py-2 rounded-lg border ${
                      errors.emergencyContactPhone
                        ? "border-red-500"
                        : currentTheme.border
                    } ${currentTheme.text} ${currentTheme.card}`}
                    placeholder="Enter emergency contact phone number"
                  />
                  {errors.emergencyContactPhone && (
                    <Text className="text-red-500 text-xs mt-1">
                      {errors.emergencyContactPhone}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            <View>
              <View className="flex-row items-center gap-2 mb-4">
                <GraduationCap size={20} color={currentTheme.text} />
                <Text className="text-lg font-medium text-gray-900 dark:text-white">
                  Academic Information
                </Text>
              </View>

              <View className="space-y-4">
                <View>
                  <Text className={`font-medium ${currentTheme.text} mb-2`}>
                    Last Degree Earned *
                  </Text>
                  <View className="border rounded-lg p-2">
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                    >
                      <View className="flex-row gap-2">
                        {[
                          { value: "high_school", label: "High School" },
                          { value: "associate", label: "Associate Degree" },
                          { value: "bachelor", label: "Bachelor's Degree" },
                          { value: "master", label: "Master's Degree" },
                          { value: "phd", label: "PhD/Doctorate" },
                          { value: "other", label: "Other" },
                        ].map((option) => (
                          <TouchableOpacity
                            key={option.value}
                            onPress={() =>
                              handleChange("lastDegree", option.value)
                            }
                            className={`px-3 py-1.5 rounded-lg ${
                              formData.lastDegree === option.value
                                ? "bg-purple-600"
                                : "bg-gray-100 dark:bg-gray-800"
                            }`}
                          >
                            <Text
                              className={
                                formData.lastDegree === option.value
                                  ? "text-white"
                                  : currentTheme.text
                              }
                            >
                              {option.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                  {errors.lastDegree && (
                    <Text className="text-red-500 text-xs mt-1">
                      {errors.lastDegree}
                    </Text>
                  )}
                </View>

                <View className="flex-row gap-4">
                  <View className="flex-1">
                    <Text className={`font-medium ${currentTheme.text} mb-2`}>
                      Degree GPA (0-4.0)
                    </Text>
                    <TextInput
                      value={formData.degreeGPA}
                      onChangeText={(text) => handleChange("degreeGPA", text)}
                      keyboardType="decimal-pad"
                      className={`px-3 py-2 rounded-lg border ${
                        errors.degreeGPA
                          ? "border-red-500"
                          : currentTheme.border
                      } ${currentTheme.text} ${currentTheme.card}`}
                      placeholder="e.g., 3.5"
                    />
                    {errors.degreeGPA && (
                      <Text className="text-red-500 text-xs mt-1">
                        {errors.degreeGPA}
                      </Text>
                    )}
                  </View>

                  <View className="flex-1">
                    <Text className={`font-medium ${currentTheme.text} mb-2`}>
                      Graduation Year
                    </Text>
                    <TextInput
                      value={formData.graduationYear}
                      onChangeText={(text) =>
                        handleChange("graduationYear", text)
                      }
                      keyboardType="numeric"
                      className={`px-3 py-2 rounded-lg border ${
                        errors.graduationYear
                          ? "border-red-500"
                          : currentTheme.border
                      } ${currentTheme.text} ${currentTheme.card}`}
                      placeholder="e.g., 2023"
                    />
                    {errors.graduationYear && (
                      <Text className="text-red-500 text-xs mt-1">
                        {errors.graduationYear}
                      </Text>
                    )}
                  </View>
                </View>

                <View className="flex-row gap-4">
                  <View className="flex-1">
                    <Text className={`font-medium ${currentTheme.text} mb-2`}>
                      Current Institution
                    </Text>
                    <TextInput
                      value={formData.currentInstitution}
                      onChangeText={(text) =>
                        handleChange("currentInstitution", text)
                      }
                      className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                      placeholder="Current school/university"
                    />
                  </View>

                  <View className="flex-1">
                    <Text className={`font-medium ${currentTheme.text} mb-2`}>
                      Current Course/Program
                    </Text>
                    <TextInput
                      value={formData.currentCourse}
                      onChangeText={(text) =>
                        handleChange("currentCourse", text)
                      }
                      className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                      placeholder="Current course of study"
                    />
                  </View>
                </View>
              </View>
            </View>

            <View>
              <Text className={`font-medium ${currentTheme.text} mb-2`}>
                Conversion Notes
              </Text>
              <TextInput
                value={formData.notes}
                onChangeText={(text) => handleChange("notes", text)}
                multiline
                numberOfLines={3}
                className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                placeholder="Add any additional notes about this conversion..."
              />
            </View>

            <View className="bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <View className="flex-row items-start gap-2">
                <AlertTriangle size={16} color="#f59e0b" />
                <Text className="text-sm text-yellow-700 dark:text-yellow-300 flex-1">
                  <Text className="font-bold">Important:</Text> After
                  conversion, the lead will become a student with access to all
                  student management features including document upload, payment
                  processing, and portal access.
                </Text>
              </View>
            </View>
          </View>
        );

      case 3:
        return (
          <View className="space-y-6">
            <View className="bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 items-center">
              <View className="w-16 h-16 bg-green-200 dark:bg-green-800 rounded-full items-center justify-center mb-4">
                <Check size={32} color="#10b981" />
              </View>
              <Text className="text-xl font-semibold text-green-800 dark:text-green-400 mb-2">
                Ready to Convert!
              </Text>
              <Text className="text-sm text-green-700 dark:text-green-300 mb-4 text-center">
                {lead.firstName} {lead.lastName} will be converted from lead to
                student.
              </Text>
              <View className="flex-row items-center gap-2 px-4 py-2 bg-green-200 dark:bg-green-800 rounded-full">
                <UserCheck size={16} color="#10b981" />
                <Text className="text-sm font-medium text-green-700 dark:text-green-300">
                  Student ID will be generated upon conversion
                </Text>
              </View>
            </View>

            <View className="space-y-4">
              <Text className="font-medium text-gray-900 dark:text-white">
                Conversion Summary:
              </Text>

              <View className="space-y-3">
                <View className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <Text className="text-gray-500 dark:text-gray-400 text-sm mb-1">
                    Lead Information
                  </Text>
                  <Text className="font-medium text-gray-900 dark:text-white">
                    {lead.firstName} {lead.lastName}
                  </Text>
                  <Text className="text-gray-600 dark:text-gray-400 text-xs">
                    {lead.email || "No email"} • {lead.contact}
                  </Text>
                </View>

                <View className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <Text className="text-gray-500 dark:text-gray-400 text-sm mb-1">
                    Student Status
                  </Text>
                  <Text className="font-medium text-gray-900 dark:text-white">
                    {formData.status === "in_process"
                      ? "In Process"
                      : "New Student"}
                  </Text>
                  <Text className="text-gray-600 dark:text-gray-400 text-xs">
                    Portal access will be enabled
                  </Text>
                </View>

                <View className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <Text className="text-gray-500 dark:text-gray-400 text-sm mb-1">
                    Nationality
                  </Text>
                  <Text className="font-medium text-gray-900 dark:text-white">
                    {formData.nationality || "Not specified"}
                  </Text>
                </View>

                <View className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <Text className="text-gray-500 dark:text-gray-400 text-sm mb-1">
                    Emergency Contact
                  </Text>
                  <Text className="font-medium text-gray-900 dark:text-white">
                    {formData.emergencyContact}
                  </Text>
                  <Text className="text-gray-600 dark:text-gray-400 text-xs">
                    {formData.emergencyContactPhone}
                  </Text>
                </View>
              </View>

              <View className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Text className="text-purple-700 dark:text-purple-300 text-sm">
                  <Text className="font-bold">Conversion Date:</Text>{" "}
                  {new Date().toLocaleDateString()} at{" "}
                  {new Date().toLocaleTimeString()}
                </Text>
              </View>
            </View>

            <View className="bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <Text className="text-sm text-blue-700 dark:text-blue-300">
                <Text className="font-bold">Next Steps:</Text> After conversion,
                you can:
              </Text>
              <View className="mt-2 space-y-1">
                <View className="flex-row items-center gap-2">
                  <View className="w-1.5 h-1.5 rounded-full bg-blue-500"></View>
                  <Text className="text-sm text-blue-700 dark:text-blue-300">
                    Assign document templates
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <View className="w-1.5 h-1.5 rounded-full bg-blue-500"></View>
                  <Text className="text-sm text-blue-700 dark:text-blue-300">
                    Set up payment plans
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <View className="w-1.5 h-1.5 rounded-full bg-blue-500"></View>
                  <Text className="text-sm text-blue-700 dark:text-blue-300">
                    Generate student portal credentials
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <View className="w-1.5 h-1.5 rounded-full bg-blue-500"></View>
                  <Text className="text-sm text-blue-700 dark:text-blue-300">
                    Begin enrollment process
                  </Text>
                </View>
              </View>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal visible={isOpen} animationType="slide" transparent={true}>
      <View className="flex-1 bg-black/50 justify-end">
        <Animated.View
          entering={SlideInDown.duration(300)}
          exiting={SlideOutDown.duration(200)}
          className={`${currentTheme.card} rounded-t-3xl p-6 max-h-[90vh]`}
        >
          <View className="flex-row justify-between items-center mb-6">
            <View>
              <Text className={`text-xl font-bold ${currentTheme.text}`}>
                Convert Lead to Student
              </Text>
              <Text className={`text-sm ${currentTheme.textMuted} mt-1`}>
                Step {step} of 3: {steps[step - 1]?.description}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} disabled={isSaving}>
              <X size={24} color={currentTheme.text} />
            </TouchableOpacity>
          </View>

          {/* Progress Steps */}
          <View className="mb-8">
            <View className="flex-row items-center justify-between">
              {steps.map((stepItem, index) => (
                <View key={stepItem.number} className="items-center flex-1">
                  <View
                    className={`w-10 h-10 rounded-full items-center justify-center ${
                      step > stepItem.number
                        ? "bg-green-500"
                        : step === stepItem.number
                          ? "bg-gradient-to-r from-purple-600 to-pink-500"
                          : "bg-gray-200 dark:bg-gray-700"
                    }`}
                  >
                    {step > stepItem.number ? (
                      <Check size={20} color="white" />
                    ) : (
                      <Text
                        className={`text-sm font-medium ${
                          step === stepItem.number
                            ? "text-white"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {stepItem.number}
                      </Text>
                    )}
                  </View>
                  <View className="mt-2 items-center">
                    <Text
                      className={`text-xs font-medium ${
                        step >= stepItem.number
                          ? "text-purple-600 dark:text-purple-400"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {stepItem.title}
                    </Text>
                    <Text className="text-xs text-gray-400 mt-1">
                      {stepItem.description}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
            <View className="flex-row mt-4">
              <View
                className={`h-0.5 flex-1 mx-2 ${step > 1 ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"}`}
              />
              <View
                className={`h-0.5 flex-1 mx-2 ${step > 2 ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"}`}
              />
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {renderStepContent()}
          </ScrollView>

          <View className="flex-row justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            {step > 1 ? (
              <TouchableOpacity
                onPress={() => setStep(step - 1)}
                disabled={isSaving}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600"
              >
                <Text className={currentTheme.text}>Previous</Text>
              </TouchableOpacity>
            ) : (
              <View />
            )}

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={onClose}
                disabled={isSaving}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600"
              >
                <Text className={currentTheme.text}>Cancel</Text>
              </TouchableOpacity>
              {step < 3 ? (
                <TouchableOpacity
                  onPress={() => {
                    if (validateStep(step)) {
                      setStep(step + 1);
                    }
                  }}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-500 rounded-lg"
                >
                  <Text className="text-white font-medium">Next</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={isSaving}
                  className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-500 rounded-lg"
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className="text-white font-medium">
                      Complete Conversion
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

// Lead Card Component
const LeadCard = ({
  lead,
  isExpanded,
  onExpand,
  onEdit,
  onConvert,
  onDelete,
  onQualify,
  onMarkContacted,
  actionLoading,
}: {
  lead: Lead;
  isExpanded: boolean;
  onExpand: () => void;
  onEdit: () => void;
  onConvert: () => void;
  onDelete: () => void;
  onQualify: () => void;
  onMarkContacted: () => void;
  actionLoading: string | null;
}) => {
  const [theme] = useState<"dark">("dark");
  const currentTheme = themeConfigs[theme];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400";
      case "contacted":
        return "bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400";
      case "qualified":
        return "bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400";
      case "converted":
        return "bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400";
      case "disqualified":
      case "lost":
        return "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400";
      default:
        return "bg-gray-100 dark:bg-gray-500/20 text-gray-600 dark:text-gray-400";
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "high":
        return "text-red-600 dark:text-red-400";
      case "medium":
        return "text-yellow-600 dark:text-yellow-400";
      case "low":
        return "text-green-600 dark:text-green-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  return (
    <View
      className={`m-2 rounded-2xl ${currentTheme.card} border ${currentTheme.border}`}
    >
      {/* Lead Header */}
      <View className="p-4">
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 items-center justify-center">
              <Text className="text-white font-bold">
                {getInitials(lead.firstName, lead.lastName)}
              </Text>
            </View>
            <View className="flex-1">
              <Text className={`font-semibold ${currentTheme.text}`}>
                {lead.firstName} {lead.lastName}
              </Text>
              <Text className={`text-sm ${currentTheme.textMuted}`}>
                {lead.email || "No email"}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                "Lead Actions",
                "Choose an action",
                [
                  { text: "View Details", onPress: onExpand },
                  { text: "Edit", onPress: onEdit },
                  lead.canConvert && !lead.isConverted
                    ? { text: "Convert to Student", onPress: onConvert }
                    : null,
                  { text: "Delete", style: "destructive", onPress: onDelete },
                  { text: "Cancel", style: "cancel" },
                ].filter(Boolean) as any[],
              );
            }}
          >
            <MoreVertical size={20} color={currentTheme.textMuted} />
          </TouchableOpacity>
        </View>

        <View className="space-y-2 mb-3">
          <View className="flex-row items-center">
            <Phone size={14} color={currentTheme.textMuted} />
            <Text className={`text-sm ${currentTheme.textMuted} ml-2`}>
              {lead.contact}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Calendar size={14} color={currentTheme.textMuted} />
            <Text className={`text-sm ${currentTheme.textMuted} ml-2`}>
              Added: {new Date(lead.$createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <View className="flex-row justify-between items-center">
          <View
            className={`px-3 py-1 rounded-full ${getStatusColor(lead.leadStatus || "new")}`}
          >
            <Text className="text-xs font-medium">
              {lead.leadStatus ? lead.leadStatus.replace("_", " ") : "New"}
            </Text>
          </View>
          <TouchableOpacity onPress={onExpand}>
            {isExpanded ? (
              <ChevronUp size={20} color={currentTheme.textMuted} />
            ) : (
              <ChevronDown size={20} color={currentTheme.textMuted} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Expanded Details */}
      {isExpanded && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700 pt-4"
        >
          <View className="space-y-4">
            <View className="grid grid-cols-2 gap-3">
              <View>
                <Text className={`text-xs ${currentTheme.textMuted} mb-1`}>
                  Interest Area
                </Text>
                <Text className={`text-sm ${currentTheme.text}`}>
                  {lead.interestedArea || "Not specified"}
                </Text>
              </View>
              <View>
                <Text className={`text-xs ${currentTheme.textMuted} mb-1`}>
                  Target Country
                </Text>
                <Text className={`text-sm ${currentTheme.text}`}>
                  {lead.countries || "Not specified"}
                </Text>
              </View>
              <View>
                <Text className={`text-xs ${currentTheme.textMuted} mb-1`}>
                  Budget Range
                </Text>
                <Text className={`text-sm ${currentTheme.text}`}>
                  {lead.budgetRange || "Not specified"}
                </Text>
              </View>
              <View>
                <Text className={`text-xs ${currentTheme.textMuted} mb-1`}>
                  Priority Score
                </Text>
                <Text
                  className={`text-sm ${getPriorityColor(lead.followUpPriority)}`}
                >
                  {lead.followUpPriority || "medium"}
                </Text>
              </View>
            </View>

            {lead.previousEducation && (
              <View>
                <Text className={`text-xs ${currentTheme.textMuted} mb-1`}>
                  Previous Education
                </Text>
                <Text className={`text-sm ${currentTheme.text}`}>
                  {lead.previousEducation}
                </Text>
              </View>
            )}

            {lead.notes && (
              <View>
                <Text className={`text-xs ${currentTheme.textMuted} mb-1`}>
                  Notes
                </Text>
                <Text className={`text-sm ${currentTheme.text}`}>
                  {lead.notes}
                </Text>
              </View>
            )}

            {/* Quick Actions */}
            {!lead.isConverted && (
              <View className="flex-row gap-2 pt-2">
                {lead.leadStatus !== "qualified" && (
                  <TouchableOpacity
                    onPress={onQualify}
                    disabled={actionLoading === lead.$id}
                    className="flex-1 py-2 bg-green-600 rounded-lg items-center"
                  >
                    {actionLoading === lead.$id ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text className="text-white text-sm font-medium">
                        Qualify
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
                {lead.leadStatus !== "contacted" && (
                  <TouchableOpacity
                    onPress={onMarkContacted}
                    disabled={actionLoading === lead.$id}
                    className="flex-1 py-2 bg-yellow-600 rounded-lg items-center"
                  >
                    {actionLoading === lead.$id ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text className="text-white text-sm font-medium">
                        Contacted
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </Animated.View>
      )}
    </View>
  );
};

// ============ MAIN PAGE COMPONENT ============
export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [theme] = useState<Theme>("dark");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info" | "warning";
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: "warning" | "danger";
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    type: "warning",
  });
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const router = useRouter();
  const currentTheme = themeConfigs[theme];

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info" | "warning") => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3000);
      Haptics.notificationAsync(
        type === "success"
          ? Haptics.NotificationFeedbackType.Success
          : type === "error"
            ? Haptics.NotificationFeedbackType.Error
            : type === "warning"
              ? Haptics.NotificationFeedbackType.Warning
              : Haptics.NotificationFeedbackType.Success,
      );
    },
    [],
  );

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (statusFilter !== "all") {
        if (statusFilter === "followup") {
          params.append("needsFollowUp", "true");
        } else if (statusFilter === "converted") {
          params.append("converted", "true");
        } else if (statusFilter === "active") {
          params.append("converted", "false");
        } else {
          params.append("leadStatus", statusFilter);
        }
      }

      const response = await fetch(`${API_URL}/dashboard/leads?${params}`);
      const result = await response.json();

      if (result.success) {
        setLeads(result.data || []);
      } else {
        showToast("Failed to fetch leads", "error");
        setLeads([]);
      }
    } catch (error) {
      showToast("Error fetching leads", "error");
      setLeads([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
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

  useEffect(() => {
    fetchCurrentUser();
    fetchLeads();
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [searchQuery, statusFilter]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    showToast("Refreshing leads...", "info");
    fetchLeads();
  }, [fetchLeads]);

  const handleCreateLead = () => {
    setSelectedLead(null);
    setIsModalOpen(true);
  };

  const handleEditLead = (lead: Lead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  const handleConvertToStudent = (lead: Lead) => {
    setSelectedLead(lead);
    setIsConvertModalOpen(true);
  };

  const handleDeleteLead = (leadId: string) => {
    setConfirmationModal({
      isOpen: true,
      title: "Delete Lead",
      message:
        "Are you sure you want to delete this lead? This action cannot be undone.",
      onConfirm: async () => {
        try {
          const response = await fetch(
            `${API_URL}/dashboard/leads?id=${leadId}`,
            {
              method: "DELETE",
            },
          );

          const result = await response.json();

          if (result.success) {
            showToast("Lead deleted successfully", "success");
            fetchLeads();
          } else {
            showToast(result.error || "Failed to delete lead", "error");
          }
        } catch (error) {
          showToast("Error deleting lead", "error");
        }
        setConfirmationModal({ ...confirmationModal, isOpen: false });
      },
      type: "danger",
    });
  };

  const handleLeadAction = async (
    leadId: string,
    action: string,
    data?: any,
  ) => {
    try {
      setActionLoading(leadId);

      const response = await fetch(`${API_URL}/dashboard/leads`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leadId,
          action,
          ...data,
        }),
      });

      const result = await response.json();

      if (result.success) {
        showToast(result.data?.message || "Action successful", "success");
        fetchLeads();
      } else {
        showToast(result.error || "Failed to update lead", "error");
      }
    } catch (error) {
      showToast("Error updating lead", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveLead = async (formData: any) => {
    try {
      const url = `${API_URL}/dashboard/leads`;
      const method = selectedLead ? "PATCH" : "POST";

      const requestData = selectedLead
        ? { leadId: selectedLead.$id, ...formData }
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
          selectedLead
            ? "Lead updated successfully"
            : "Lead created successfully",
          "success",
        );
        setIsModalOpen(false);
        setSelectedLead(null);
        fetchLeads();
      } else {
        showToast(result.error || "Failed to save lead", "error");
      }
    } catch (error) {
      showToast("Error saving lead", "error");
    }
  };

  const handleConvertToStudentSave = async (formData: any) => {
    try {
      const response = await fetch(`${API_URL}/dashboard/leads`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leadId: selectedLead?.$id,
          convertToStudent: true,
          ...formData,
        }),
      });

      const result = await response.json();

      if (result.success) {
        showToast("Lead converted to student successfully", "success");
        setIsConvertModalOpen(false);
        setSelectedLead(null);
        fetchLeads();
      } else {
        showToast(result.error || "Failed to convert lead", "error");
      }
    } catch (error) {
      showToast("Error converting lead", "error");
    }
  };

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (statusFilter !== "all") {
        if (statusFilter === "followup" && !lead.analytics?.followUpRequired) {
          return false;
        }
        if (statusFilter === "converted" && !lead.conversionDate) {
          return false;
        }
        if (statusFilter === "active" && lead.conversionDate) {
          return false;
        }
        if (
          !["followup", "converted", "active"].includes(statusFilter) &&
          lead.leadStatus !== statusFilter
        ) {
          return false;
        }
      }
      if (!searchQuery) return true;

      const searchLower = searchQuery.toLowerCase();
      return (
        lead.firstName.toLowerCase().includes(searchLower) ||
        lead.lastName.toLowerCase().includes(searchLower) ||
        (lead.email && lead.email.toLowerCase().includes(searchLower)) ||
        (lead.contact && lead.contact.toLowerCase().includes(searchLower)) ||
        (lead.interestedArea &&
          lead.interestedArea.toLowerCase().includes(searchLower)) ||
        (lead.countries && lead.countries.toLowerCase().includes(searchLower))
      );
    });
  }, [leads, searchQuery, statusFilter]);

  const stats = [
    {
      icon: Users,
      label: "Total Leads",
      value: leads.length.toString(),
      color: "bg-purple-500",
    },
    {
      icon: TrendingUp,
      label: "Qualified Leads",
      value: leads
        .filter((l) => l.leadStatus === "qualified")
        .length.toString(),
      color: "bg-green-500",
    },
    {
      icon: Clock,
      label: "Needs Follow-up",
      value: leads
        .filter((l) => l.analytics?.followUpRequired)
        .length.toString(),
      color: "bg-yellow-500",
    },
    {
      icon: UserCheck,
      label: "Converted",
      value: leads.filter((l) => l.conversionDate).length.toString(),
      color: "bg-blue-500",
    },
  ];

  const statusFilters = [
    { value: "all", label: "All Leads" },
    { value: "new", label: "New" },
    { value: "contacted", label: "Contacted" },
    { value: "qualified", label: "Qualified" },
    { value: "converted", label: "Converted" },
    { value: "followup", label: "Needs Follow-up" },
    { value: "active", label: "Active (Not Converted)" },
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

  if (loading && leads.length === 0) {
    return (
      <SafeAreaView
        className={`flex-1 ${currentTheme.background} items-center justify-center`}
      >
        <ActivityIndicator size="large" color={currentTheme.primary} />
        <Text className={`mt-4 ${currentTheme.text}`}>Loading leads...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${currentTheme.background}`}>
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={() =>
          setConfirmationModal({ ...confirmationModal, isOpen: false })
        }
        onConfirm={confirmationModal.onConfirm}
        title={confirmationModal.title}
        message={confirmationModal.message}
        type={confirmationModal.type}
      />

      <LeadModal
        lead={selectedLead}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedLead(null);
        }}
        onSave={handleSaveLead}
      />

      <ConvertLeadModal
        lead={selectedLead}
        isOpen={isConvertModalOpen}
        onClose={() => {
          setIsConvertModalOpen(false);
          setSelectedLead(null);
        }}
        onSave={handleConvertToStudentSave}
      />

      {/* Header */}
      <View className="p-4">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-3 p-2 rounded-lg bg-gray-100 dark:bg-gray-800"
          >
            <ArrowLeft size={20} color={currentTheme.text} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className={`text-2xl font-bold ${currentTheme.text}`}>
              Leads Management
            </Text>
            <Text className={`text-sm ${currentTheme.textMuted} mt-1`}>
              {leads.length} potential students • Realtime Active
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
                className={refreshing ? "rotate-180" : ""}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleCreateLead}
              className="flex-row items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-500 rounded-lg"
            >
              <UserPlus size={20} color="white" />
              <Text className="text-white font-medium">Add Lead</Text>
            </TouchableOpacity>
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
            placeholder="Search leads..."
            placeholderTextColor={currentTheme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            className={`pl-10 pr-4 py-3 ${currentTheme.card} rounded-xl border ${currentTheme.border} ${currentTheme.text}`}
          />
        </View>

        {/* Status Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-4"
        >
          <View className="flex-row gap-2">
            {statusFilters.map((filter) => (
              <TouchableOpacity
                key={filter.value}
                onPress={() => setStatusFilter(filter.value)}
                className={`px-3 py-1.5 rounded-lg ${
                  statusFilter === filter.value
                    ? "bg-gradient-to-r from-purple-600 to-pink-500"
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

      {/* Leads List */}
      <FlatList
        data={filteredLeads}
        keyExtractor={(item) => item.$id}
        renderItem={({ item }) => (
          <LeadCard
            lead={item}
            isExpanded={expandedLead === item.$id}
            onExpand={() =>
              setExpandedLead(expandedLead === item.$id ? null : item.$id)
            }
            onEdit={() => handleEditLead(item)}
            onConvert={() => handleConvertToStudent(item)}
            onDelete={() => handleDeleteLead(item.$id)}
            onQualify={() =>
              handleLeadAction(item.$id, "qualify", {
                notes: "Lead qualified for conversion",
              })
            }
            onMarkContacted={() =>
              handleLeadAction(item.$id, "contact", { notes: "Contacted lead" })
            }
            actionLoading={actionLoading}
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
              {searchQuery ? "No matching leads found" : "No leads yet"}
            </Text>
            <Text
              className={`text-sm ${currentTheme.textMuted} mt-2 text-center`}
            >
              {searchQuery
                ? "Try a different search term"
                : "Get started by creating your first lead"}
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                onPress={handleCreateLead}
                className="mt-4 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-500 rounded-lg"
              >
                <Text className="text-white">Create Lead</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        className="px-2"
      />
    </SafeAreaView>
  );
}
