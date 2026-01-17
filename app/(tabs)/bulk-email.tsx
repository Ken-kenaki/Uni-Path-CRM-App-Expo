import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
    AlertCircle,
    Bookmark,
    CheckCircle,
    ChevronDown,
    ChevronLeft,
    Eye,
    Filter,
    X
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

export default function BulkEmailScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    country: '',
    gender: '',
    program: ''
  });
  const [emailData, setEmailData] = useState({
    subject: '',
    htmlContent: '',
    textContent: '',
    replyTo: ''
  });
  const [recipientCount, setRecipientCount] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);
  const router = useRouter();

  // Email templates
  const emailTemplates = [
    {
      id: 1,
      name: "Welcome - New Visitor",
      category: "visitor",
      description: "Welcome email for new website visitors",
      subject: "Welcome to Our Consultancy - Your Education Journey Starts Here!",
      htmlContent: `<h2>Welcome to Our Education Family!</h2>
<p>Dear {firstName},</p>
<p>Welcome to our consultancy! We're excited to help you achieve your educational goals.</p>`
    },
    {
      id: 2,
      name: "Application Follow-up",
      category: "student",
      description: "Follow-up email for incomplete applications",
      subject: "Complete Your Application - Just a Few Steps Left!",
      htmlContent: `<h2>Complete Your Application</h2>
<p>Dear {firstName},</p>
<p>We noticed you started an application but haven't completed it yet. Let us help you finish!</p>`
    }
  ];

  // Fetch recipient count based on filters
  const fetchRecipientCount = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/dashboard/bulk-send?${queryParams}`
      );
      const data = await response.json();
      
      if (data.success) {
        setRecipientCount(data.recipientCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch count:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipientCount();
  }, [filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setError('');
    setResult(null);
  };

  const handleEmailChange = (key: string, value: string) => {
    setEmailData(prev => ({ ...prev, [key]: value }));
    setError('');
  };

  const applyTemplate = (template: any) => {
    setEmailData({
      subject: template.subject,
      htmlContent: template.htmlContent,
      textContent: template.description,
      replyTo: emailData.replyTo
    });
    setShowTemplates(false);
  };

  const handleSendEmails = async () => {
    if (!emailData.subject || !emailData.htmlContent) {
      Alert.alert('Error', 'Subject and email content are required');
      return;
    }

    if (recipientCount === 0) {
      Alert.alert('Error', 'No recipients match the selected filters');
      return;
    }

    setIsSending(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/dashboard/bulk-send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...emailData,
          filters: Object.fromEntries(
            Object.entries(filters).filter(([_, v]) => v !== '')
          )
        })
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
        Alert.alert('Success', `Sent ${data.sentCount || 0} emails successfully!`);
      } else {
        throw new Error(data.error || 'Failed to send emails');
      }
    } catch (err: any) {
      setError(err.message);
      Alert.alert('Error', err.message);
    } finally {
      setIsSending(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      status: '',
      country: '',
      gender: '',
      program: ''
    });
  };

  const clearEmail = () => {
    setEmailData({
      subject: '',
      htmlContent: '',
      textContent: '',
      replyTo: ''
    });
    setError('');
    setResult(null);
  };

  // Filter options
  const filterOptions = {
    type: [
      { label: 'All Types', value: '' },
      { label: 'Student', value: 'student' },
      { label: 'Lead', value: 'lead' },
      { label: 'Visitor', value: 'visitor' },
      { label: 'Alumni', value: 'alumni' }
    ],
    status: [
      { label: 'All Statuses', value: '' },
      { label: 'New', value: 'new' },
      { label: 'In Process', value: 'in_process' },
      { label: 'Qualified', value: 'qualified' },
      { label: 'Enrolled', value: 'enrolled' }
    ],
    country: [
      { label: 'All Countries', value: '' },
      { label: 'USA', value: 'usa' },
      { label: 'Canada', value: 'canada' },
      { label: 'UK', value: 'uk' },
      { label: 'Australia', value: 'australia' }
    ],
    program: [
      { label: 'All Programs', value: '' },
      { label: 'Undergraduate', value: 'undergraduate' },
      { label: 'Masters', value: 'masters' },
      { label: 'MBA', value: 'mba' },
      { label: 'PhD', value: 'phd' }
    ]
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <LinearGradient
        colors={['#1e1b4b', '#0f172a', '#581c87']}
        className="flex-1"
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View className="px-6 pt-12 pb-4">
              <View className="flex-row items-center justify-between mb-6">
                <View className="flex-row items-center">
                  <TouchableOpacity
                    onPress={() => router.back()}
                    className="w-10 h-10 rounded-full bg-white/10 items-center justify-center mr-3"
                  >
                    <ChevronLeft size={24} color="white" />
                  </TouchableOpacity>
                  <View>
                    <Text className="text-2xl font-bold text-white">Bulk Email</Text>
                    <Text className="text-gray-400 text-sm">Send targeted campaigns</Text>
                  </View>
                </View>
                
                <TouchableOpacity
                  onPress={() => setShowPreview(true)}
                  disabled={!emailData.subject && !emailData.htmlContent}
                  className="p-2 bg-blue-500/20 rounded-lg"
                >
                  <Eye size={20} color={emailData.subject ? "#60a5fa" : "#6b7280"} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Filters Bar */}
            <View className="px-6 mb-6">
              <TouchableOpacity
                onPress={() => setShowFilters(true)}
                className="bg-white/5 rounded-xl p-4 border border-cyan-500/20"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Filter size={20} color="#60a5fa" />
                    <Text className="text-white ml-3 text-base">Filters</Text>
                    {Object.values(filters).some(v => v) && (
                      <View className="ml-3 px-2 py-1 bg-purple-500/20 rounded-full">
                        <Text className="text-purple-300 text-xs">
                          {Object.values(filters).filter(v => v).length} active
                        </Text>
                      </View>
                    )}
                  </View>
                  <ChevronDown size={20} color="#9ca3af" />
                </View>
                
                {/* Quick filter summary */}
                {Object.values(filters).some(v => v) ? (
                  <View className="mt-3">
                    <Text className="text-gray-400 text-sm mb-2">Selected filters:</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {Object.entries(filters).map(([key, value]) => {
                        if (!value) return null;
                        return (
                          <View key={key} className="px-3 py-1 bg-gray-800/50 rounded-full">
                            <Text className="text-gray-300 text-xs">
                              {key}: {value}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                ) : (
                  <Text className="text-gray-500 text-sm mt-2">Tap to select filters</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Recipient Count Card */}
            <View className="px-6 mb-6">
              <View className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-xl p-4 border border-purple-500/20">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-white font-semibold">Recipients Found</Text>
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#8b5cf6" />
                  ) : (
                    <Text className="text-2xl font-bold text-white">{recipientCount}</Text>
                  )}
                </View>
                <Text className="text-gray-400 text-sm">
                  Emails will be sent to {recipientCount} recipient{recipientCount !== 1 ? 's' : ''}
                </Text>
                {recipientCount > 100 && (
                  <Text className="text-amber-400 text-xs mt-2">
                    ⚠️ Will be sent in batches of 100
                  </Text>
                )}
              </View>
            </View>

            {/* Email Composer */}
            <View className="px-6 mb-8">
              <View className="bg-white/5 rounded-2xl p-5 border border-blue-500/20">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-white text-lg font-bold">Compose Email</Text>
                  <TouchableOpacity onPress={() => setShowTemplates(true)}>
                    <Bookmark size={20} color="#60a5fa" />
                  </TouchableOpacity>
                </View>

                {/* Placeholders */}
                <View className="mb-4 p-3 bg-gray-900/50 rounded-lg">
                  <Text className="text-gray-400 text-sm mb-2">Placeholders:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row gap-2">
                      {['{firstName}', '{lastName}', '{email}', '{university}', '{program}'].map(placeholder => (
                        <TouchableOpacity
                          key={placeholder}
                          onPress={() => {
                            // Add placeholder to content
                            setEmailData(prev => ({
                              ...prev,
                              htmlContent: prev.htmlContent + placeholder
                            }));
                          }}
                          className="px-3 py-1 bg-gray-800 rounded-full"
                        >
                          <Text className="text-cyan-400 text-sm">{placeholder}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                {/* Subject */}
                <View className="mb-4">
                  <Text className="text-gray-300 text-sm mb-2">Subject *</Text>
                  <TextInput
                    placeholder="Enter email subject"
                    placeholderTextColor="#6b7280"
                    value={emailData.subject}
                    onChangeText={(text) => handleEmailChange('subject', text)}
                    className="bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-white"
                  />
                </View>

                {/* Email Content */}
                <View className="mb-4">
                  <Text className="text-gray-300 text-sm mb-2">Content *</Text>
                  <TextInput
                    placeholder="Type your email content here..."
                    placeholderTextColor="#6b7280"
                    value={emailData.htmlContent}
                    onChangeText={(text) => handleEmailChange('htmlContent', text)}
                    multiline
                    numberOfLines={8}
                    className="bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-white h-40"
                    textAlignVertical="top"
                  />
                </View>

                {/* Reply To (Optional) */}
                <View className="mb-6">
                  <Text className="text-gray-300 text-sm mb-2">Reply To (Optional)</Text>
                  <TextInput
                    placeholder="reply@yourdomain.com"
                    placeholderTextColor="#6b7280"
                    value={emailData.replyTo}
                    onChangeText={(text) => handleEmailChange('replyTo', text)}
                    className="bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-white"
                    keyboardType="email-address"
                  />
                </View>

                {/* Error/Success Messages */}
                {error ? (
                  <View className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <View className="flex-row items-center">
                      <AlertCircle size={16} color="#f87171" />
                      <Text className="text-red-400 text-sm ml-2">{error}</Text>
                    </View>
                  </View>
                ) : null}

                {result ? (
                  <View className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <View className="flex-row items-center mb-2">
                      <CheckCircle size={16} color="#34d399" />
                      <Text className="text-green-400 text-sm ml-2">Campaign completed!</Text>
                    </View>
                    <View className="flex-row justify-between">
                      <View className="items-center">
                        <Text className="text-white text-lg font-bold">{result.sentCount || 0}</Text>
                        <Text className="text-gray-400 text-xs">Sent</Text>
                      </View>
                      <View className="items-center">
                        <Text className="text-white text-lg font-bold">{result.failedCount || 0}</Text>
                        <Text className="text-gray-400 text-xs">Failed</Text>
                      </View>
                      <View className="items-center">
                        <Text className="text-white text-lg font-bold">{recipientCount}</Text>
                        <Text className="text-gray-400 text-xs">Total</Text>
                      </View>
                    </View>
                  </View>
                ) : null}

                {/* Action Buttons */}
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={clearEmail}
                    className="flex-1 py-3 bg-gray-800 rounded-xl items-center"
                  >
                    <Text className="text-white">Clear</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSendEmails}
                    disabled={isSending || recipientCount === 0 || !emailData.subject || !emailData.htmlContent}
                    className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-blue-500 rounded-xl items-center disabled:opacity-50"
                  >
                    {isSending ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text className="text-white font-semibold">
                        Send ({recipientCount})
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Filters Modal */}
          <Modal
            visible={showFilters}
            animationType="slide"
            transparent={true}
          >
            <View className="flex-1 bg-black/80 justify-end">
              <View className="bg-gray-900 rounded-t-3xl p-6 max-h-3/4">
                <View className="flex-row items-center justify-between mb-6">
                  <Text className="text-white text-xl font-bold">Filter Recipients</Text>
                  <TouchableOpacity onPress={() => setShowFilters(false)}>
                    <X size={24} color="#9ca3af" />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  {Object.entries(filterOptions).map(([key, options]) => (
                    <View key={key} className="mb-6">
                      <Text className="text-white text-sm font-medium mb-3 capitalize">
                        {key}
                      </Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
                        <View className="flex-row gap-2">
                          {options.map(option => (
                            <TouchableOpacity
                              key={option.value}
                              onPress={() => handleFilterChange(key, option.value)}
                              className={`px-4 py-2 rounded-full ${
                                filters[key] === option.value
                                  ? 'bg-purple-600'
                                  : 'bg-gray-800'
                              }`}
                            >
                              <Text className="text-white text-sm">{option.label}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </ScrollView>
                    </View>
                  ))}
                </ScrollView>

                <View className="flex-row gap-3 mt-6 pt-4 border-t border-gray-800">
                  <TouchableOpacity
                    onPress={clearFilters}
                    className="flex-1 py-3 bg-gray-800 rounded-xl items-center"
                  >
                    <Text className="text-white">Clear All</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setShowFilters(false)}
                    className="flex-1 py-3 bg-purple-600 rounded-xl items-center"
                  >
                    <Text className="text-white font-semibold">Apply Filters</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Templates Modal */}
          <Modal
            visible={showTemplates}
            animationType="slide"
            transparent={true}
          >
            <View className="flex-1 bg-black/80 justify-end">
              <View className="bg-gray-900 rounded-t-3xl p-6 max-h-3/4">
                <View className="flex-row items-center justify-between mb-6">
                  <Text className="text-white text-xl font-bold">Email Templates</Text>
                  <TouchableOpacity onPress={() => setShowTemplates(false)}>
                    <X size={24} color="#9ca3af" />
                  </TouchableOpacity>
                </View>

                <FlatList
                  data={emailTemplates}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => applyTemplate(item)}
                      className="bg-gray-800/50 rounded-xl p-4 mb-3"
                    >
                      <Text className="text-white font-semibold text-base mb-1">
                        {item.name}
                      </Text>
                      <Text className="text-gray-400 text-sm mb-2">
                        {item.description}
                      </Text>
                      <Text className="text-cyan-400 text-xs" numberOfLines={1}>
                        Subject: {item.subject}
                      </Text>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <Text className="text-gray-500 text-center py-8">
                      No templates available
                    </Text>
                  }
                />
              </View>
            </View>
          </Modal>

          {/* Preview Modal */}
          <Modal
            visible={showPreview}
            animationType="slide"
            transparent={true}
          >
            <View className="flex-1 bg-black/80">
              <View className="flex-1 bg-gray-900 m-4 rounded-2xl p-6 mt-12">
                <View className="flex-row items-center justify-between mb-6">
                  <Text className="text-white text-xl font-bold">Email Preview</Text>
                  <TouchableOpacity onPress={() => setShowPreview(false)}>
                    <X size={24} color="#9ca3af" />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  <View className="mb-6 p-4 bg-gray-800/50 rounded-xl">
                    <Text className="text-white font-semibold mb-1">From: Your Consultancy</Text>
                    <Text className="text-gray-400 text-sm mb-3">Subject: {emailData.subject || 'No subject'}</Text>
                    <Text className="text-cyan-400 text-sm">
                      To: {recipientCount} recipient{recipientCount !== 1 ? 's' : ''}
                    </Text>
                  </View>

                  <View className="bg-gray-800/30 rounded-xl p-4 min-h-[200px]">
                    {emailData.htmlContent ? (
                      <Text className="text-white">{emailData.htmlContent}</Text>
                    ) : (
                      <Text className="text-gray-500 italic">No content to preview</Text>
                    )}
                  </View>

                  <View className="mt-6 p-4 bg-blue-900/20 rounded-xl border border-blue-500/30">
                    <Text className="text-blue-400 font-medium mb-2">
                      Personalization Note:
                    </Text>
                    <Text className="text-gray-400 text-sm">
                      Placeholders like {'{firstName}'}, {'{lastName}'}, etc. will be replaced with each recipient's information.
                    </Text>
                  </View>
                </ScrollView>

                <TouchableOpacity
                  onPress={() => setShowPreview(false)}
                  className="mt-6 py-3 bg-purple-600 rounded-xl items-center"
                >
                  <Text className="text-white font-semibold">Close Preview</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}