import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ChevronLeft, Eye, EyeOff } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        },
      );

      const data = await response.json();

      console.log("Login API Response:", data); // Debug log

      if (!response.ok) {
        throw new Error(data.error || `Login failed: ${response.status}`);
      }

      // Check if login was successful
      if (!data.success) {
        throw new Error(data.error || "Login failed");
      }

      // Store user data in AsyncStorage
      if (data.data && data.data.profile) {
        await AsyncStorage.setItem("user", JSON.stringify(data.data));
        console.log("User data stored:", data.data.profile.email);
      }

      // ⚠️ CRITICAL FIX: The role is in data.data.profile, not data.user
      // Your API returns: data.data.profile.role, not data.user.role

      // Get the user role from the profile data
      const userRole = data.data?.profile?.role;

      if (!userRole) {
        console.error("No role found in response:", data);
        throw new Error("User role not found in response");
      }

      console.log("Login successful, user role:", userRole);

      // Redirect based on user role
      if (userRole === "admin") {
        router.replace("/(tabs)/dashboard");
      } else if (userRole === "owner") {
        router.replace("/(tabs)/dashboard");
      } else if (userRole === "staff" || userRole === "user") {
        router.replace("/(tabs)/dashboard");
      } else {
        console.warn("Unknown role:", userRole);
        // Default to dashboard for unknown roles
        router.replace("/(tabs)/dashboard");
      }
    } catch (err: any) {
      console.error("Login error details:", err);
      console.error("Full error object:", JSON.stringify(err, null, 2));

      let errorMessage = err.message || "An unexpected error occurred";

      if (err.message.includes("Invalid email or password")) {
        errorMessage = "Invalid email or password";
      } else if (err.message.includes("Account not activated")) {
        errorMessage = "Your account is not activated. Please contact support.";
      } else if (err.message.includes("Organization disabled")) {
        errorMessage = "Your organization account has been disabled.";
      } else if (err.message.includes("User profile not found")) {
        errorMessage = "User profile not found. Please contact support.";
      } else if (
        err.message.includes("fetch failed") ||
        err.message.includes("network")
      ) {
        errorMessage = "Network error. Please check your connection.";
      }

      setError(errorMessage);
      Alert.alert("Login Failed", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 gap-2 bg-black">
      <LinearGradient
        colors={["#1e1b4b", "#0f172a", "#581c87"]}
        className="flex-1"
      >
        <ScrollView className="flex-1">
          {/* Header */}
          <View className="px-6 pt-12 pb-8">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-white/10 items-center justify-center mb-8"
            >
              <ChevronLeft size={24} color="white" />
            </TouchableOpacity>

            <View className="mb-10">
              <Text className="text-4xl font-bold text-white mb-2">
                Welcome Back
              </Text>
              <Text className="text-gray-400 text-base">
                Sign in to continue to your account
              </Text>
            </View>

            {error ? (
              <View className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <Text className="text-red-400 text-sm">{error}</Text>
              </View>
            ) : null}

            {/* Login Form */}
            <View className="space-y-6">
              {/* Email Input */}
              <View>
                <Text className="text-gray-300 text-sm mb-2">
                  Email Address
                </Text>
                <TextInput
                  placeholder="you@example.com"
                  placeholderTextColor="#6b7280"
                  value={email}
                  onChangeText={setEmail}
                  className="bg-white/5 border border-cyan-500/30 rounded-xl px-4 py-4 my-2 text-white"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isLoading}
                />
              </View>

              {/* Password Input */}
              <View>
                <Text className="text-gray-300 text-sm mb-2">Password</Text>
                <View className="relative">
                  <TextInput
                    placeholder="Enter your password"
                    placeholderTextColor="#6b7280"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    className="bg-white/5 border border-cyan-500/30 rounded-xl px-4 py-4 my-2 text-white pr-12"
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-6"
                  >
                    {showPassword ? (
                      <EyeOff size={20} color="#9ca3af" />
                    ) : (
                      <Eye size={20} color="#9ca3af" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Remember & Forgot */}
              <View className="flex-row justify-between items-center my-2">
                <TouchableOpacity
                  onPress={() => setRemember(!remember)}
                  className="flex-row items-center"
                  disabled={isLoading}
                >
                  <View
                    className={`w-5 h-5 rounded border-2 ${remember ? "bg-cyan-500 border-cyan-500" : "border-gray-500"} mr-2 items-center justify-center`}
                  >
                    {remember && <Text className="text-white text-xs">✓</Text>}
                  </View>
                  <Text className="text-gray-400">Remember me</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push("/forgot-password")}
                  disabled={isLoading}
                >
                  <Text className="text-cyan-400">Forgot Password?</Text>
                </TouchableOpacity>
              </View>

              {/* Login Button */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isLoading}
                className={`bg-purple-600 rounded-xl py-4 items-center ${isLoading ? "opacity-70" : ""}`}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-semibold text-base">
                    Continue
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Links */}
        <View className="px-6 py-4 border-t border-gray-800">
          <View className="flex-row justify-center space-x-6">
            <TouchableOpacity>
              <Text className="text-gray-500 text-sm">Help</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text className="text-gray-500 text-sm">Privacy</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text className="text-gray-500 text-sm">Terms</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}
