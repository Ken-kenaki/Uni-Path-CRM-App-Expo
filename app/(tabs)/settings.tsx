// app/(tabs)/settings.tsx - Settings & Profile screen
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useAppTheme } from "@/lib/theme-context";
import { useToast } from "@/lib/toast-context";
import {
  Bell,
  CheckCircle,
  ChevronRight,
  HelpCircle,
  Info,
  Key,
  LogOut,
  Palette,
  Shield
} from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Theme, themeConfigs } from "../../theme";

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const { theme, setTheme, themeConfig } = useAppTheme();
  const [showThemeModal, setShowThemeModal] = useState(false);

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: logout,
      },
    ]);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      showToast("Please fill all fields", "warning");
      return;
    }
    if (newPassword.length < 8) {
      showToast("Password must be at least 8 characters", "warning");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("Passwords don't match", "error");
      return;
    }

    setChangingPassword(true);
    try {
      const result = await api.changePassword(currentPassword, newPassword);
      if (result.success) {
        showToast("Password changed successfully", "success");
        setShowPasswordModal(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        showToast(result.error || "Failed to change password", "error");
      }
    } catch {
      showToast("Failed to change password", "error");
    } finally {
      setChangingPassword(false);
    }
  };

  const getInitials = () => {
    const name = user?.name || user?.firstName || "";
    const parts = name.split(" ");
    return parts.map((p: string) => p[0]).join("").toUpperCase().slice(0, 2) || "U";
  };

  const getRoleBadge = () => {
    const roleMap: Record<string, { label: string; color: string }> = {
      admin: { label: "Admin", color: "bg-purple-500/20 text-purple-400" },
      branchAdmin: { label: "Branch Admin", color: "bg-blue-500/20 text-blue-400" },
      staff: { label: "Staff", color: "bg-green-500/20 text-green-400" },
      counselor: { label: "Counselor", color: "bg-amber-500/20 text-amber-400" },
      owner: { label: "Owner", color: "bg-red-500/20 text-red-400" },
    };
    return roleMap[user?.role || ""] || { label: "User", color: "bg-gray-500/20 text-gray-400" };
  };

  const roleBadge = getRoleBadge();

  const settingsSections = [
    {
      title: "Account",
      items: [
        {
          icon: Key,
          label: "Change Password",
          color: "#f59e0b",
          onPress: () => setShowPasswordModal(true),
        },
        {
          icon: Bell,
          label: "Notifications",
          color: "#3b82f6",
          onPress: () => showToast("Coming soon", "info"),
        },
        {
          icon: Palette,
          label: "Appearance",
          color: "#8b5cf6",
          subtitle: themeConfig.label,
          onPress: () => setShowThemeModal(true),
        },
      ],
    },
    {
      title: "About",
      items: [
        {
          icon: Shield,
          label: "Privacy Policy",
          color: "#10b981",
          onPress: () => Linking.openURL("https://aestheracrm.aesthera.uk/privacy-policy"),
        },
        {
          icon: HelpCircle,
          label: "Help & Support",
          color: "#06b6d4",
          onPress: () => showToast("Coming soon", "info"),
        },
        {
          icon: Info,
          label: "About Aesthera CRM",
          color: "#6b7280",
          subtitle: "Version 1.0.0",
          onPress: () => { },
        },
      ],
    },
  ];

  return (
    <SafeAreaView className={`flex-1 ${themeConfig.background}`}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-4 pt-2 pb-6">
          <Text className={`text-2xl font-bold ${themeConfig.text}`}>Settings</Text>
        </View>

        {/* Profile Card */}
        <View className={`mx-4 mb-6 p-5 rounded-2xl ${themeConfig.card} border ${themeConfig.border}`}>
          <View className="flex-row items-center">
            <View className={`w-16 h-16 rounded-2xl ${themeConfig.primary.replace("text-", "bg-")} items-center justify-center`}>
              <Text className="text-white text-xl font-bold">{getInitials()}</Text>
            </View>
            <View className="ml-4 flex-1">
              <Text className={`${themeConfig.text} font-bold text-lg`}>
                {user?.name || user?.firstName || "User"}
              </Text>
              <Text className={`${themeConfig.textMuted} text-sm`}>{user?.email}</Text>
              <View className="flex-row items-center mt-1.5">
                <View className={`px-2.5 py-0.5 rounded-full ${roleBadge.color.split(" ")[0]}`}>
                  <Text className={`text-xs font-semibold ${roleBadge.color.split(" ")[1]}`}>
                    {roleBadge.label}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Settings Sections */}
        {settingsSections.map((section) => (
          <View key={section.title} className="mb-6">
            <Text className={`${themeConfig.textMuted} text-xs font-semibold uppercase tracking-wider px-4 mb-2`}>
              {section.title}
            </Text>
            <View className={`mx-4 rounded-2xl ${themeConfig.card} border ${themeConfig.border} overflow-hidden`}>
              {section.items.map((item, index) => {
                const Icon = item.icon;
                return (
                  <TouchableOpacity
                    key={item.label}
                    onPress={item.onPress}
                    className={`flex-row items-center p-4 ${index < section.items.length - 1 ? `border-b ${themeConfig.border}` : ""
                      }`}
                    activeOpacity={0.6}
                  >
                    <View
                      className="w-9 h-9 rounded-xl items-center justify-center"
                      style={{ backgroundColor: `${item.color}20` }}
                    >
                      <Icon size={18} color={item.color} />
                    </View>
                    <View className="flex-1 ml-3">
                      <Text className={`${themeConfig.text} font-medium text-[15px]`}>{item.label}</Text>
                      {"subtitle" in item && item.subtitle && (
                        <Text className={`${themeConfig.textMuted} text-xs mt-0.5`}>{item.subtitle}</Text>
                      )}
                    </View>
                    <ChevronRight size={16} color="#4b5563" />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        {/* Sign Out */}
        <TouchableOpacity
          onPress={handleLogout}
          className="mx-4 mb-10 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex-row items-center justify-center"
          activeOpacity={0.7}
        >
          <LogOut size={18} color="#ef4444" />
          <Text className="text-red-400 font-semibold text-[15px] ml-2">Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Theme Selection Modal */}
      <Modal visible={showThemeModal} transparent animationType="slide">
        <View className="flex-1 bg-black/60 justify-end">
          <View className={`${themeConfig.card} rounded-t-3xl p-6 pb-10 border-t ${themeConfig.border}`}>
            <View className="flex-row items-center justify-between mb-6">
              <Text className={`${themeConfig.text} font-bold text-lg`}>Appearance</Text>
              <TouchableOpacity onPress={() => setShowThemeModal(false)}>
                <Text className={themeConfig.textMuted}>Done</Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row flex-wrap -mx-2">
              {(Object.keys(themeConfigs) as Theme[]).map((t) => {
                const config = themeConfigs[t];
                const isSelected = theme === t;
                return (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setTheme(t)}
                    className="w-1/2 px-2 mb-4"
                  >
                    <View
                      className={`p-4 rounded-2xl border-2 ${isSelected ? "border-purple-500 bg-purple-500/5" : themeConfig.border} ${config.background} items-center`}
                    >
                      <View className={`w-10 h-10 rounded-full mb-3 items-center justify-center ${config.background} border ${config.border}`}>
                        <Palette size={20} color={config.name === "dark" ? "white" : "#6b7280"} />
                      </View>
                      <Text className={`${isSelected ? "text-purple-600 font-bold" : config.text} text-sm`}>
                        {config.label}
                      </Text>
                      {isSelected && (
                        <View className="absolute top-2 right-2">
                          <CheckCircle size={14} color="#8b5cf6" />
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal visible={showPasswordModal} transparent animationType="slide">
        <View className="flex-1 bg-black/60 justify-end">
          <View className={`${themeConfig.card} rounded-t-3xl p-6 pb-10 border-t ${themeConfig.border}`}>
            <View className="flex-row items-center justify-between mb-6">
              <Text className={`${themeConfig.text} font-bold text-lg`}>Change Password</Text>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                <Text className={themeConfig.textMuted}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <View className="mb-4">
              <Text className={`${themeConfig.textMuted} text-sm mb-1.5`}>Current Password</Text>
              <TextInput
                className={`${theme === 'white' ? 'bg-gray-50' : 'bg-white/5'} border ${themeConfig.border} rounded-xl px-4 py-3 ${themeConfig.text}`}
                secureTextEntry
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter current password"
                placeholderTextColor="#6b7280"
              />
            </View>

            <View className="mb-4">
              <Text className={`${themeConfig.textMuted} text-sm mb-1.5`}>New Password</Text>
              <TextInput
                className={`${theme === 'white' ? 'bg-gray-50' : 'bg-white/5'} border ${themeConfig.border} rounded-xl px-4 py-3 ${themeConfig.text}`}
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                placeholderTextColor="#6b7280"
              />
            </View>

            <View className="mb-6">
              <Text className={`${themeConfig.textMuted} text-sm mb-1.5`}>Confirm Password</Text>
              <TextInput
                className={`${theme === 'white' ? 'bg-gray-50' : 'bg-white/5'} border ${themeConfig.border} rounded-xl px-4 py-3 ${themeConfig.text}`}
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                placeholderTextColor="#6b7280"
              />
            </View>

            <TouchableOpacity
              onPress={handleChangePassword}
              disabled={changingPassword}
              className="bg-purple-600 rounded-xl py-4 items-center"
              activeOpacity={0.8}
            >
              {changingPassword ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold">Update Password</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
