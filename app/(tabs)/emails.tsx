import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
    ChevronRight,
    Inbox,
    Key,
    LogOut,
    Mail,
    Send,
    Sparkles,
    Users
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export default function EmailDashboardScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  // Check if user is authenticated with Gmail
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        setUserEmail(user.profile?.email || '');
      }

      // Check Gmail auth status
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/dashboard/gmail/auth/status`);
      const data = await response.json();
      
      if (data.success && data.authenticated) {
        setIsAuthenticated(true);
        if (data.email) {
          setUserEmail(data.email);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    }
  };

  const handleGmailLogin = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/dashboard/gmail/auth/login`);
      const data = await response.json();
      
      if (data.success && data.authUrl) {
        // For mobile, you might need to use WebView or deep linking
        Alert.alert(
          'Gmail Login',
          'You will be redirected to Google login. Please authorize the app to access your Gmail.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Continue', 
              onPress: () => {
                // In a real app, you would use Linking.openURL or WebView
                // For now, we'll simulate success after a delay
                setTimeout(() => {
                  setIsAuthenticated(true);
                  setIsLoading(false);
                  router.push('/dashboard/email/gmail');
                }, 1500);
              }
            }
          ]
        );
      } else {
        throw new Error(data.error || 'Login failed');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to connect to Gmail');
      setIsLoading(false);
    }
  };

  const handleGmailLogout = async () => {
    Alert.alert(
      'Logout from Gmail',
      'Are you sure you want to disconnect your Gmail account?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/dashboard/gmail/auth/logout`, {
                method: 'POST',
              });
              const data = await response.json();
              
              if (data.success) {
                setIsAuthenticated(false);
                Alert.alert('Success', 'Logged out from Gmail successfully');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to logout from Gmail');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <LinearGradient
        colors={['#1e1b4b', '#0f172a', '#581c87']}
        className="flex-1"
      >
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View className="px-6 pt-12 pb-8">
            <View className="mb-10">
              <Text className="text-4xl font-bold text-white mb-2">Email Center</Text>
              <Text className="text-gray-400 text-base">
                Manage your emails and campaigns in one place
              </Text>
            </View>

            {/* User Info Card */}
            {userEmail ? (
              <View className="mb-8 p-4 bg-white/5 rounded-2xl border border-cyan-500/20">
                <View className="flex-row items-center">
                  <View className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-blue-500 items-center justify-center mr-3">
                    <Text className="text-white font-bold text-lg">
                      {userEmail[0]?.toUpperCase() || 'U'}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-semibold text-base">
                      {userEmail.split('@')[0]}
                    </Text>
                    <Text className="text-gray-400 text-sm">{userEmail}</Text>
                  </View>
                  {isAuthenticated && (
                    <TouchableOpacity
                      onPress={handleGmailLogout}
                      className="p-2"
                    >
                      <LogOut size={20} color="#9ca3af" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ) : null}

            {/* Email Services Grid */}
            <View className="mb-8">
              <Text className="text-white text-lg font-semibold mb-4">Email Services</Text>
              
              <View className="space-y-4">
                {/* Gmail Card */}
                <TouchableOpacity
                  onPress={() => {
                    if (isAuthenticated) {
                      router.push('/dashboard/email/gmail');
                    } else {
                      handleGmailLogin();
                    }
                  }}
                  className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-2xl p-5 border border-purple-500/20"
                  disabled={isLoading}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <View className="w-14 h-14 rounded-xl bg-gradient-to-r from-red-500 to-red-400 items-center justify-center mr-4">
                        <Mail size={28} color="white" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-white font-bold text-lg">Gmail</Text>
                        <Text className="text-gray-400 text-sm mt-1">
                          {isAuthenticated ? 'Access your inbox' : 'Connect your Gmail account'}
                        </Text>
                        <View className="flex-row items-center mt-2">
                          {isAuthenticated ? (
                            <View className="flex-row items-center">
                              <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                              <Text className="text-green-400 text-xs">Connected</Text>
                            </View>
                          ) : (
                            <View className="flex-row items-center">
                              <Key size={14} color="#9ca3af" />
                              <Text className="text-gray-400 text-xs ml-1">Sign in required</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                    <ChevronRight size={24} color="#9ca3af" />
                  </View>
                </TouchableOpacity>

                {/* Bulk Email Card */}
                <TouchableOpacity
                  onPress={() => router.push('/dashboard/email/bulk')}
                  className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 rounded-2xl p-5 border border-blue-500/20"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <View className="w-14 h-14 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 items-center justify-center mr-4">
                        <Send size={28} color="white" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-white font-bold text-lg">Bulk Email</Text>
                        <Text className="text-gray-400 text-sm mt-1">
                          Send campaigns to multiple recipients
                        </Text>
                        <View className="flex-row items-center mt-2">
                          <Users size={14} color="#9ca3af" />
                          <Text className="text-gray-400 text-xs ml-1">Targeted campaigns</Text>
                        </View>
                      </View>
                    </View>
                    <ChevronRight size={24} color="#9ca3af" />
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Stats Grid */}
            <View className="mb-8">
              <Text className="text-white text-lg font-semibold mb-4">Quick Stats</Text>
              <View className="grid grid-cols-2 gap-4">
                <View className="bg-white/5 rounded-xl p-4">
                  <View className="flex-row items-center mb-2">
                    <Inbox size={20} color="#60a5fa" />
                    <Text className="text-blue-400 text-sm ml-2">Inbox</Text>
                  </View>
                  <Text className="text-white text-2xl font-bold">
                    {isAuthenticated ? '--' : '0'}
                  </Text>
                  <Text className="text-gray-400 text-xs">Unread emails</Text>
                </View>
                
                <View className="bg-white/5 rounded-xl p-4">
                  <View className="flex-row items-center mb-2">
                    <Send size={20} color="#a78bfa" />
                    <Text className="text-purple-400 text-sm ml-2">Campaigns</Text>
                  </View>
                  <Text className="text-white text-2xl font-bold">0</Text>
                  <Text className="text-gray-400 text-xs">This month</Text>
                </View>
              </View>
            </View>

            {/* Tips Section */}
            <View className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-2xl p-5 border border-pink-500/20">
              <View className="flex-row items-start">
                <Sparkles size={24} color="#f472b6" className="mr-3 mt-1" />
                <View className="flex-1">
                  <Text className="text-white font-semibold text-base mb-2">
                    Pro Tips
                  </Text>
                  <Text className="text-gray-400 text-sm">
                    • Connect Gmail to access your inbox directly{'\n'}
                    • Use bulk email for marketing campaigns{'\n'}
                    • Personalize emails with {`{name}`} placeholders{'\n'}
                    • Schedule emails for optimal delivery times
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Loading Overlay */}
          {isLoading && (
            <View className="absolute inset-0 bg-black/70 items-center justify-center">
              <View className="bg-gray-900 p-6 rounded-2xl items-center">
                <ActivityIndicator size="large" color="#8b5cf6" />
                <Text className="text-white mt-4">Connecting to Gmail...</Text>
              </View>
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}