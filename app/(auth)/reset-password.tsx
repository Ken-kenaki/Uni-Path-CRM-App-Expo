import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AlertCircle, Check, CheckCircle, ChevronLeft, Eye, EyeOff } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const router = useRouter();
  const params = useLocalSearchParams();

  const userId = params.userId as string;
  const secret = params.secret as string;
  const expire = params.expire as string;

  useEffect(() => {
    if (userId && secret) {
      if (expire) {
        const expireDate = new Date(decodeURIComponent(expire));
        if (expireDate < new Date()) {
          setError('This reset link has expired. Please request a new one.');
        }
      }
    } else {
      setError('Invalid or expired reset link');
    }
    
    setIsValidating(false);
  }, [userId, secret, expire]);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!strongPasswordRegex.test(password)) {
      setError('Password must contain at least: 1 uppercase, 1 lowercase, 1 number, and 1 special character (@$!%*?&)');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId, 
          secret, 
          password,
          passwordRepeat: confirmPassword
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setSuccess(true);

      setTimeout(() => {
        router.replace('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message);
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  if (isValidating) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <LinearGradient
          colors={['#1e1b4b', '#0f172a', '#581c87']}
          className="flex-1 items-center justify-center"
        >
          <ActivityIndicator size="large" color="#22d3ee" />
          <Text className="text-gray-400 mt-4">Validating reset link...</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (!userId && !secret && !success && error.includes('Invalid')) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <LinearGradient
          colors={['#1e1b4b', '#0f172a', '#581c87']}
          className="flex-1 items-center justify-center px-6"
        >
          <View className="w-full max-w-md">
            <View className="p-6 bg-red-500/10 border border-red-500/30 rounded-xl mb-6">
              <AlertCircle size={48} color="#f87171" className="mx-auto mb-4" />
              <Text className="text-2xl font-bold text-red-400 text-center mb-2">
                Invalid Reset Link
              </Text>
              <Text className="text-gray-300 text-center">
                This password reset link is invalid or has expired.
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/forgot-password')}
              className="bg-cyan-600 rounded-xl py-3 items-center"
            >
              <Text className="text-white font-medium">Request a new reset link</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      <LinearGradient
        colors={['#1e1b4b', '#0f172a', '#581c87']}
        className="flex-1"
      >
        <ScrollView className="flex-1">
          <View className="px-6 pt-12 pb-8">
            {/* Back Button */}
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-white/10 items-center justify-center mb-8"
            >
              <ChevronLeft size={24} color="white" />
            </TouchableOpacity>

            {/* Header */}
            <View className="mb-10">
              <Text className="text-4xl font-bold text-white mb-2">
                Set New Password
              </Text>
              <Text className="text-gray-400 text-base">
                Create a strong new password for your account
              </Text>
            </View>

            {success ? (
              <View className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                <View className="flex-row items-start">
                  <CheckCircle size={24} color="#34d399" className="mr-3 mt-1" />
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-green-400">
                      Password Reset Successful!
                    </Text>
                    <Text className="text-green-300 text-sm mt-1">
                      Your password has been updated successfully.
                    </Text>
                    <Text className="text-green-400/80 text-xs mt-3">
                      Redirecting to login in 3 seconds...
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              <>
                {/* Password Requirements */}
                <View className="mb-6 p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
                  <Text className="text-cyan-300 font-medium text-sm mb-2">
                    Password Requirements:
                  </Text>
                  {[
                    'At least 8 characters long',
                    '1 uppercase letter (A-Z)',
                    '1 lowercase letter (a-z)',
                    '1 number (0-9)',
                    '1 special character (@$!%*?&)',
                  ].map((req, index) => (
                    <View key={index} className="flex-row items-center mb-1">
                      <Check size={16} color="#22d3ee" className="mr-2" />
                      <Text className="text-gray-300 text-sm">{req}</Text>
                    </View>
                  ))}
                </View>

                {/* Error Message */}
                {error ? (
                  <View className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                    <View className="flex-row items-center">
                      <AlertCircle size={20} color="#f87171" className="mr-3" />
                      <View>
                        <Text className="text-sm font-medium text-red-400">Error</Text>
                        <Text className="text-red-400 text-sm mt-1">{error}</Text>
                      </View>
                    </View>
                  </View>
                ) : null}

                {/* New Password Input */}
                <View className="mb-4">
                  <Text className="text-gray-300 text-sm mb-2">New Password</Text>
                  <View className="relative">
                    <TextInput
                      placeholder="Enter new password"
                      placeholderTextColor="#6b7280"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      className="bg-white/5 border border-cyan-500/30 rounded-xl px-4 py-4 text-white pr-12"
                      editable={!loading}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-4"
                    >
                      {showPassword ? (
                        <EyeOff size={20} color="#9ca3af" />
                      ) : (
                        <Eye size={20} color="#9ca3af" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Confirm Password Input */}
                <View className="mb-6">
                  <Text className="text-gray-300 text-sm mb-2">Confirm Password</Text>
                  <View className="relative">
                    <TextInput
                      placeholder="Confirm new password"
                      placeholderTextColor="#6b7280"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showConfirmPassword}
                      className="bg-white/5 border border-cyan-500/30 rounded-xl px-4 py-4 text-white pr-12"
                      editable={!loading}
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-4"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={20} color="#9ca3af" />
                      ) : (
                        <Eye size={20} color="#9ca3af" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={loading}
                  className={`bg-purple-600 rounded-xl py-4 items-center ${loading ? 'opacity-70' : ''}`}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white font-semibold text-base">
                      Reset Password
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Back to Login */}
                <View className="mt-8 pt-6 border-t border-gray-800">
                  <Text className="text-gray-400 text-center">
                    Remember your password?{' '}
                    <Text
                      className="text-cyan-400 font-semibold"
                      onPress={() => router.push('/login')}
                    >
                      Back to login
                    </Text>
                  </Text>
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}