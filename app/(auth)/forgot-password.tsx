import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { AlertCircle, CheckCircle, ChevronLeft } from 'lucide-react-native';
import React, { useState } from 'react';
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

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      setSuccess(true);
      setEmail('');

      // Auto-redirect after success
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message);
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

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
                Reset Password
              </Text>
              <Text className="text-gray-400 text-base">
                Enter your email to receive a reset link
              </Text>
            </View>

            {success ? (
              <View className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                <View className="flex-row items-start">
                  <CheckCircle size={24} color="#34d399" className="mr-3 mt-1" />
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-green-400">
                      Check your email!
                    </Text>
                    <Text className="text-green-300 text-sm mt-1">
                      If an account exists with {email}, you will receive password reset instructions shortly.
                    </Text>
                    <Text className="text-green-400/80 text-xs mt-3">
                      Redirecting to login in 3 seconds...
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              <>
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

                {/* Email Input */}
                <View className="mb-6">
                  <Text className="text-gray-300 text-sm mb-2">Email Address</Text>
                  <TextInput
                    placeholder="you@example.com"
                    placeholderTextColor="#6b7280"
                    value={email}
                    onChangeText={setEmail}
                    className="bg-white/5 border border-cyan-500/30 rounded-xl px-4 py-4 text-white"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!loading}
                  />
                </View>

                {/* Instructions */}
                <View className="mb-6 p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
                  <Text className="text-cyan-300 text-sm">
                    <Text className="font-medium">Note:</Text> Check your spam folder if you don't see the email within a few minutes.
                  </Text>
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
                      Send Reset Link
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