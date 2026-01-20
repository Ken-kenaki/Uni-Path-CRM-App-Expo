import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
    Archive,
    ChevronLeft,
    ChevronRight,
    Download,
    Inbox,
    Key,
    Paperclip,
    Plus,
    Search,
    Send,
    Star,
    Trash2,
    XCircle,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    SafeAreaView,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface Email {
  id: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  read: boolean;
  starred: boolean;
  hasAttachments: boolean;
}

export default function GmailScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [labels, setLabels] = useState([
    { id: "INBOX", name: "Inbox", count: 0, icon: Inbox },
    { id: "STARRED", name: "Starred", count: 0, icon: Star },
    { id: "SENT", name: "Sent", count: 0, icon: Send },
    { id: "DRAFT", name: "Drafts", count: 0, icon: FileText },
  ]);
  const [selectedLabel, setSelectedLabel] = useState("INBOX");
  const router = useRouter();

  // Check authentication status
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/dashboard/gmail/auth/status`,
      );
      const data = await response.json();

      if (data.success && data.authenticated) {
        setIsAuthenticated(true);
        setUserEmail(data.email || "");
        fetchEmails();
      }
    } catch (error) {
      console.error("Auth check failed:", error);
    }
  };

  const handleGmailLogin = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/dashboard/gmail/auth/login`,
      );
      const data = await response.json();

      if (data.success && data.authUrl) {
        Alert.alert(
          "Gmail Login",
          "You will be redirected to Google login. Please authorize the app to access your Gmail.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Continue",
              onPress: async () => {
                // Simulate login process
                setIsAuthenticated(true);
                setUserEmail("user@gmail.com");
                fetchEmails();
                setIsLoading(false);
              },
            },
          ],
        );
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to connect to Gmail");
      setIsLoading(false);
    }
  };

  const fetchEmails = async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    try {
      // Mock data for demo
      const mockEmails: Email[] = [
        {
          id: "1",
          subject: "Welcome to Our Service",
          from: "support@company.com",
          date: "2024-01-15T10:30:00Z",
          snippet: "Thank you for joining our service...",
          read: true,
          starred: false,
          hasAttachments: false,
        },
        {
          id: "2",
          subject: "Important Update",
          from: "notifications@system.com",
          date: "2024-01-14T14:20:00Z",
          snippet: "Please review the latest updates...",
          read: false,
          starred: true,
          hasAttachments: true,
        },
        {
          id: "3",
          subject: "Weekly Report",
          from: "reports@analytics.com",
          date: "2024-01-13T09:15:00Z",
          snippet: "Your weekly performance report...",
          read: true,
          starred: false,
          hasAttachments: true,
        },
      ];

      setEmails(mockEmails);
    } catch (error) {
      Alert.alert("Error", "Failed to fetch emails");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays === 0) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  const getSenderInitials = (from: string) => {
    const name = from.split("@")[0];
    return name.substring(0, 2).toUpperCase();
  };

  const getSenderName = (from: string) => {
    return from.split("@")[0];
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <LinearGradient
        colors={["#1e1b4b", "#0f172a", "#581c87"]}
        className="flex-1"
      >
        {/* Header */}
        <View className="px-6 pt-12 pb-4">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={() => router.back()}
                className="w-10 h-10 rounded-full bg-white/10 items-center justify-center mr-3"
              >
                <ChevronLeft size={24} color="white" />
              </TouchableOpacity>
              <View>
                <Text className="text-2xl font-bold text-white">Gmail</Text>
                <Text className="text-gray-400 text-sm">
                  {isAuthenticated ? userEmail : "Connect your account"}
                </Text>
              </View>
            </View>

            {isAuthenticated ? (
              <TouchableOpacity
                onPress={() => setComposeOpen(true)}
                className="bg-gradient-to-r from-purple-600 to-blue-500 rounded-full px-4 py-2 flex-row items-center"
              >
                <Plus size={20} color="white" />
                <Text className="text-white ml-2 font-semibold">Compose</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleGmailLogin}
                className="bg-gradient-to-r from-red-600 to-red-500 rounded-full px-4 py-2 flex-row items-center"
                disabled={isLoading}
              >
                <Key size={20} color="white" />
                <Text className="text-white ml-2 font-semibold">Sign In</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Search Bar */}
          <View className="mb-4">
            <View className="relative">
              <TextInput
                placeholder="Search emails"
                placeholderTextColor="#6b7280"
                value={searchQuery}
                onChangeText={setSearchQuery}
                className="bg-white/5 border border-gray-700 rounded-full px-4 py-3 text-white pl-12"
              />
              <Search
                size={20}
                color="#9ca3af"
                className="absolute left-4 top-3.5"
              />
            </View>
          </View>

          {/* Labels */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-4"
          >
            <View className="flex-row gap-2">
              {labels.map((label) => (
                <TouchableOpacity
                  key={label.id}
                  onPress={() => setSelectedLabel(label.id)}
                  className={`px-4 py-2 rounded-full flex-row items-center ${
                    selectedLabel === label.id ? "bg-purple-600" : "bg-gray-800"
                  }`}
                >
                  <label.icon size={16} color="white" />
                  <Text className="text-white ml-2">{label.name}</Text>
                  {label.count > 0 && (
                    <Text className="text-white ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                      {label.count}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Main Content */}
        <ScrollView className="flex-1 px-6">
          {!isAuthenticated ? (
            <View className="items-center justify-center py-12">
              <Key size={64} color="#9ca3af" />
              <Text className="text-white text-xl font-bold mt-6">
                Sign in to Gmail
              </Text>
              <Text className="text-gray-400 text-center mt-2 mb-8">
                Connect your Gmail account to view and manage your emails
              </Text>
              <TouchableOpacity
                onPress={handleGmailLogin}
                className="bg-gradient-to-r from-red-600 to-red-500 rounded-full px-8 py-3 flex-row items-center"
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Key size={20} color="white" />
                    <Text className="text-white ml-2 font-semibold text-lg">
                      Sign in with Google
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Email List */}
              {emails.length === 0 ? (
                <View className="items-center justify-center py-12">
                  <Inbox size={64} color="#9ca3af" />
                  <Text className="text-white text-xl font-bold mt-6">
                    No emails
                  </Text>
                  <Text className="text-gray-400 text-center mt-2">
                    Your{" "}
                    {labels
                      .find((l) => l.id === selectedLabel)
                      ?.name?.toLowerCase()}{" "}
                    is empty
                  </Text>
                </View>
              ) : (
                <View className="space-y-2">
                  {emails
                    .filter(
                      (email) =>
                        searchQuery === "" ||
                        email.subject
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase()) ||
                        email.from
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase()) ||
                        email.snippet
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase()),
                    )
                    .map((email) => (
                      <TouchableOpacity
                        key={email.id}
                        onPress={() => setSelectedEmail(email)}
                        className="bg-white/5 rounded-xl p-4 border border-gray-800"
                      >
                        <View className="flex-row items-start">
                          {/* Sender Avatar */}
                          <View className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 items-center justify-center mr-3">
                            <Text className="text-white font-bold">
                              {getSenderInitials(email.from)}
                            </Text>
                          </View>

                          {/* Email Content */}
                          <View className="flex-1">
                            <View className="flex-row justify-between items-start mb-1">
                              <Text
                                className={`text-white font-semibold flex-1 ${email.read ? "opacity-80" : ""}`}
                              >
                                {getSenderName(email.from)}
                              </Text>
                              <Text className="text-gray-400 text-sm">
                                {formatDate(email.date)}
                              </Text>
                            </View>

                            <Text
                              className={`text-white font-medium mb-1 ${email.read ? "opacity-90" : ""}`}
                            >
                              {email.subject}
                            </Text>

                            <Text
                              className="text-gray-400 text-sm mb-2"
                              numberOfLines={1}
                            >
                              {email.snippet}
                            </Text>

                            <View className="flex-row items-center justify-between">
                              <View className="flex-row items-center space-x-3">
                                {email.starred && (
                                  <Star
                                    size={16}
                                    color="#fbbf24"
                                    fill="#fbbf24"
                                  />
                                )}
                                {email.hasAttachments && (
                                  <Paperclip size={16} color="#9ca3af" />
                                )}
                                {!email.read && (
                                  <View className="w-2 h-2 rounded-full bg-blue-500" />
                                )}
                              </View>
                              <ChevronRight size={16} color="#9ca3af" />
                            </View>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                </View>
              )}
            </>
          )}
        </ScrollView>

        {/* Email Detail Modal */}
        <Modal
          visible={selectedEmail !== null}
          animationType="slide"
          transparent={true}
        >
          <View className="flex-1 bg-black">
            <LinearGradient
              colors={["#1e1b4b", "#0f172a", "#581c87"]}
              className="flex-1"
            >
              {/* Header */}
              <View className="pt-12 px-6 pb-4">
                <View className="flex-row items-center justify-between mb-4">
                  <TouchableOpacity
                    onPress={() => setSelectedEmail(null)}
                    className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"
                  >
                    <ChevronLeft size={24} color="white" />
                  </TouchableOpacity>
                  <View className="flex-row space-x-2">
                    <TouchableOpacity className="w-10 h-10 rounded-full bg-white/10 items-center justify-center">
                      <Archive size={20} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity className="w-10 h-10 rounded-full bg-white/10 items-center justify-center">
                      <Trash2 size={20} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {selectedEmail && (
                <ScrollView className="flex-1 px-6">
                  {/* Email Header */}
                  <View className="mb-6">
                    <Text className="text-white text-2xl font-bold mb-4">
                      {selectedEmail.subject}
                    </Text>

                    <View className="flex-row items-start mb-6">
                      <View className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 items-center justify-center mr-3">
                        <Text className="text-white font-bold text-lg">
                          {getSenderInitials(selectedEmail.from)}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-white font-semibold text-base">
                          {getSenderName(selectedEmail.from)}
                        </Text>
                        <Text className="text-gray-400 text-sm">
                          {selectedEmail.from}
                        </Text>
                        <Text className="text-gray-400 text-sm mt-1">
                          {new Date(selectedEmail.date).toLocaleString()}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Email Body */}
                  <View className="bg-white/5 rounded-xl p-4 mb-6">
                    <Text className="text-white text-base leading-6">
                      Dear User,
                    </Text>
                    <Text className="text-white text-base leading-6 mt-4">
                      {selectedEmail.snippet}
                    </Text>
                    <Text className="text-white text-base leading-6 mt-4">
                      This is a preview of the email content. In a real
                      implementation, the full email body would be displayed
                      here.
                    </Text>
                    <Text className="text-white text-base leading-6 mt-4">
                      Best regards,
                    </Text>
                    <Text className="text-white text-base leading-6 mt-2">
                      {getSenderName(selectedEmail.from)}
                    </Text>
                  </View>

                  {/* Attachments */}
                  {selectedEmail.hasAttachments && (
                    <View className="mb-6">
                      <Text className="text-white font-semibold mb-3">
                        Attachments
                      </Text>
                      <TouchableOpacity className="bg-white/5 rounded-xl p-4 flex-row items-center">
                        <Paperclip size={20} color="#60a5fa" />
                        <Text className="text-white ml-3 flex-1">
                          document.pdf
                        </Text>
                        <Download size={20} color="#60a5fa" />
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Actions */}
                  <View className="flex-row justify-between mb-8">
                    <TouchableOpacity className="flex-1 bg-gray-800 rounded-xl p-3 items-center mr-2">
                      <Text className="text-white">Reply</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="flex-1 bg-gray-800 rounded-xl p-3 items-center mx-2">
                      <Text className="text-white">Forward</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="flex-1 bg-gray-800 rounded-xl p-3 items-center ml-2">
                      <Star
                        size={20}
                        color={selectedEmail.starred ? "#fbbf24" : "white"}
                      />
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              )}
            </LinearGradient>
          </View>
        </Modal>

        {/* Compose Modal */}
        <Modal visible={composeOpen} animationType="slide" transparent={true}>
          <View className="flex-1 bg-black/80">
            <View className="flex-1 bg-gray-900 mt-20 rounded-t-3xl">
              {/* Header */}
              <View className="p-6 border-b border-gray-800">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-white text-xl font-bold">
                    New Message
                  </Text>
                  <TouchableOpacity onPress={() => setComposeOpen(false)}>
                    <XCircle size={24} color="#9ca3af" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Compose Form */}
              <ScrollView className="flex-1 p-6">
                <View className="space-y-4">
                  <View>
                    <Text className="text-gray-300 text-sm mb-2">To</Text>
                    <TextInput
                      placeholder="recipient@example.com"
                      placeholderTextColor="#6b7280"
                      className="bg-gray-800 rounded-xl px-4 py-3 text-white border border-gray-700"
                    />
                  </View>

                  <View>
                    <Text className="text-gray-300 text-sm mb-2">Subject</Text>
                    <TextInput
                      placeholder="Enter subject"
                      placeholderTextColor="#6b7280"
                      className="bg-gray-800 rounded-xl px-4 py-3 text-white border border-gray-700"
                    />
                  </View>

                  <View>
                    <Text className="text-gray-300 text-sm mb-2">Message</Text>
                    <TextInput
                      placeholder="Type your message here..."
                      placeholderTextColor="#6b7280"
                      multiline
                      numberOfLines={8}
                      className="bg-gray-800 rounded-xl px-4 py-3 text-white border border-gray-700 h-40"
                      textAlignVertical="top"
                    />
                  </View>
                </View>
              </ScrollView>

              {/* Footer */}
              <View className="p-6 border-t border-gray-800">
                <TouchableOpacity className="bg-gradient-to-r from-purple-600 to-blue-500 rounded-xl py-3 items-center">
                  <Text className="text-white font-semibold text-lg">Send</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </SafeAreaView>
  );
}
