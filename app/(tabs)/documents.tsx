// app/(tabs)/documents.tsx
import { API_URL } from "@/config";
import { Theme, themeConfigs } from "@/theme";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
    Check,
    Edit,
    FileText,
    FolderOpen,
    Plus,
    RefreshCw,
    Search,
    Trash2,
    X
} from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
    SlideInDown,
    SlideOutDown,
    ZoomIn,
    ZoomOut
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

interface DocumentTemplate {
  $id: string;
  templateName: string;
  templateItems: Array<{
    $id: string;
    itemName: string;
    required: boolean;
    description?: string;
    fileType?: string;
  }>;
  studentCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TemplateFormData {
  templateName: string;
  templateItems: Array<{
    itemName: string;
    required: boolean;
    description?: string;
    fileType?: string;
  }>;
  isActive: boolean;
}

export default function DocumentsPage() {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState({
    templates: true,
    delete: false,
    update: false,
    upload: false,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [theme, setTheme] = useState<Theme>("dark");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info" | "warning";
  } | null>(null);
  const [templateFormData, setTemplateFormData] = useState<TemplateFormData>({
    templateName: "",
    templateItems: [],
    isActive: true,
  });

  const router = useRouter();
  const currentTheme = themeConfigs[theme];
  const flatListRef = useRef<FlatList>(null);

  const showToast = useCallback((message: string, type: "success" | "error" | "info" | "warning") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
    Haptics.notificationAsync(
      type === "success"
        ? Haptics.NotificationFeedbackType.Success
        : type === "error"
        ? Haptics.NotificationFeedbackType.Error
        : Haptics.NotificationFeedbackType.Warning
    );
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, templates: true }));
      const response = await fetch(`${API_URL}/dashboard/documentTemplates`);
      const result = await response.json();

      if (result.success) {
        setTemplates(Array.isArray(result.data) ? result.data : []);
      } else {
        showToast("Failed to fetch templates", "error");
      }
    } catch (error) {
      showToast("Error fetching templates", "error");
    } finally {
      setLoading(prev => ({ ...prev, templates: false }));
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    showToast("Refreshing templates...", "info");
    fetchTemplates();
  }, [fetchTemplates, showToast]);

  const createTemplate = async () => {
    try {
      setLoading(prev => ({ ...prev, templates: true }));
      const response = await fetch(`${API_URL}/dashboard/documentTemplates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(templateFormData),
      });

      const result = await response.json();
      if (result.success) {
        showToast("Template created successfully", "success");
        setShowTemplatesModal(false);
        setTemplateFormData({
          templateName: "",
          templateItems: [],
          isActive: true,
        });
        fetchTemplates();
      } else {
        showToast(result.error || "Failed to create template", "error");
      }
    } catch (error) {
      showToast("Error creating template", "error");
    } finally {
      setLoading(prev => ({ ...prev, templates: false }));
    }
  };

  const updateTemplate = async () => {
    if (!selectedTemplate) return;
    try {
      setLoading(prev => ({ ...prev, templates: true }));
      const response = await fetch(`${API_URL}/dashboard/documentTemplates/${selectedTemplate.$id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(templateFormData),
      });

      const result = await response.json();
      if (result.success) {
        showToast("Template updated successfully", "success");
        setShowTemplatesModal(false);
        setSelectedTemplate(null);
        setTemplateFormData({
          templateName: "",
          templateItems: [],
          isActive: true,
        });
        fetchTemplates();
      } else {
        showToast(result.error || "Failed to update template", "error");
      }
    } catch (error) {
      showToast("Error updating template", "error");
    } finally {
      setLoading(prev => ({ ...prev, templates: false }));
    }
  };

  const deleteTemplate = async (id: string) => {
    Alert.alert(
      "Delete Template",
      "Are you sure you want to delete this template? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(prev => ({ ...prev, templates: true }));
              const response = await fetch(`${API_URL}/dashboard/documentTemplates/${id}`, {
                method: "DELETE",
              });

              const result = await response.json();
              if (result.success) {
                showToast("Template deleted successfully", "success");
                fetchTemplates();
              } else {
                showToast(result.error || "Failed to delete template", "error");
              }
            } catch (error) {
              showToast("Error deleting template", "error");
            } finally {
              setLoading(prev => ({ ...prev, templates: false }));
            }
          },
        },
      ]
    );
  };

  const openEditTemplate = (template: DocumentTemplate) => {
    setSelectedTemplate(template);
    setTemplateFormData({
      templateName: template.templateName,
      templateItems: template.templateItems || [],
      isActive: template.isActive,
    });
    setShowTemplatesModal(true);
  };

  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const templateName = template.templateName?.toLowerCase() || "";
      const templateItems = template.templateItems || [];
      
      const matchesSearch = templateName.includes(searchQuery.toLowerCase());
      
      const matchesItems = templateItems.some((item: any) => 
        item.itemName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      return matchesSearch || matchesItems;
    });
  }, [templates, searchQuery]);

  const TemplateCard = ({ template }: { template: DocumentTemplate }) => (
    <Animated.View 
      entering={ZoomIn.duration(300)}
      exiting={ZoomOut.duration(300)}
      className={`m-2 p-4 rounded-2xl ${currentTheme.card} border ${currentTheme.border}`}
      style={{ width: (width - 32) / 2 - 8 }}
    >
      <View className="flex-row justify-between items-start mb-4">
        <View className="flex-row items-center gap-3">
          <View className="p-2 bg-purple-100 dark:bg-purple-500/10 rounded-lg">
            <FolderOpen size={20} color="#8b5cf6" />
          </View>
          <View>
            <Text className={`font-semibold ${currentTheme.text}`}>
              {template.templateName}
            </Text>
            <Text className={`text-sm ${currentTheme.textMuted}`}>
              {template.studentCount || 0} student{template.studentCount !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
        <View className={`px-2 py-1 rounded ${
          template.isActive
            ? "bg-green-100 dark:bg-green-500/10"
            : "bg-gray-100 dark:bg-gray-500/10"
        }`}>
          <Text className={`text-xs ${
            template.isActive
              ? "text-green-600 dark:text-green-400"
              : "text-gray-600 dark:text-gray-400"
          }`}>
            {template.isActive ? "Active" : "Inactive"}
          </Text>
        </View>
      </View>

      <View className="space-y-2 mb-4">
        {template.templateItems?.slice(0, 3).map((doc: any) => (
          <View key={doc.$id || doc.id} className="flex-row items-center gap-2">
            <FileText size={16} color="#10b981" />
            <Text className={`flex-1 text-sm ${currentTheme.text}`} numberOfLines={1}>
              {doc.itemName}
            </Text>
            {doc.required && (
              <Text className="text-xs text-red-500 dark:text-red-400">
                Required
              </Text>
            )}
          </View>
        ))}
        {template.templateItems?.length > 3 && (
          <Text className={`text-sm ${currentTheme.textMuted} pt-1`}>
            +{template.templateItems.length - 3} more item{template.templateItems.length - 3 !== 1 ? 's' : ''}
          </Text>
        )}
        {(!template.templateItems || template.templateItems.length === 0) && (
          <Text className={`text-sm ${currentTheme.textMuted} italic`}>
            No items in this template
          </Text>
        )}
      </View>

      <View className={`flex-row justify-between items-center pt-3 border-t ${currentTheme.border}`}>
        <Text className={`text-xs ${currentTheme.textMuted}`}>
          {template.templateItems?.length || 0} item{template.templateItems?.length !== 1 ? 's' : ''}
        </Text>
        <View className="flex-row gap-1">
          <TouchableOpacity
            onPress={() => openEditTemplate(template)}
            className="p-1.5 rounded"
          >
            <Edit size={16} color="#10b981" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => deleteTemplate(template.$id)}
            className="p-1.5 rounded"
          >
            <Trash2 size={16} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );

  if (loading.templates && templates.length === 0) {
    return (
      <SafeAreaView className={`flex-1 ${currentTheme.background} items-center justify-center`}>
        <ActivityIndicator size="large" color={currentTheme.primary} />
        <Text className={`mt-4 ${currentTheme.text}`}>Loading templates...</Text>
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
              toast.type === "success" ? ["#10b981", "#059669"] :
              toast.type === "error" ? ["#ef4444", "#dc2626"] :
              toast.type === "info" ? ["#3b82f6", "#2563eb"] :
              ["#f59e0b", "#d97706"]
            }
            className="rounded-xl px-6 py-4 flex-row items-center justify-between shadow-2xl"
          >
            <Text className="text-white font-medium flex-1">{toast.message}</Text>
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
              Document Templates
            </Text>
            <Text className={`text-sm ${currentTheme.textMuted} mt-1`}>
              {templates.length} template{templates.length !== 1 ? 's' : ''}
            </Text>
          </View>
          
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={onRefresh}
              className="p-2.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <RefreshCw size={20} color={currentTheme.textMuted} />
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => setShowTemplatesModal(true)}
              className="flex-row items-center gap-2 px-4 py-2.5 bg-purple-600 rounded-lg"
            >
              <Plus size={20} color="white" />
              <Text className="text-white font-medium">Create</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View className="relative mb-6">
          <Search
            size={20}
            color={currentTheme.textMuted}
            className="absolute left-3 top-3 z-10"
          />
          <TextInput
            placeholder="Search templates..."
            placeholderTextColor={currentTheme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            className={`pl-10 pr-4 py-3 ${currentTheme.card} rounded-xl border ${currentTheme.border} ${currentTheme.text}`}
          />
        </View>
      </View>

      {/* Templates Grid */}
      <FlatList
        ref={flatListRef}
        data={filteredTemplates}
        numColumns={2}
        keyExtractor={(item) => item.$id}
        renderItem={({ item }) => <TemplateCard template={item} />}
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
            <FolderOpen size={48} color={currentTheme.textMuted} />
            <Text className={`text-lg font-medium mt-4 ${currentTheme.text}`}>
              {searchQuery ? "No matching templates found" : "No templates yet"}
            </Text>
            <Text className={`text-sm ${currentTheme.textMuted} mt-2 text-center`}>
              {searchQuery 
                ? "Try a different search term" 
                : "Create your first document template to get started"}
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                onPress={() => setShowTemplatesModal(true)}
                className="mt-4 px-4 py-2 bg-purple-600 rounded-lg"
              >
                <Text className="text-white">Create Template</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* Template Form Modal */}
      <Modal
        visible={showTemplatesModal}
        animationType="slide"
        transparent={true}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <Animated.View 
            entering={SlideInDown.duration(300)}
            exiting={SlideOutDown.duration(200)}
            className={`${currentTheme.card} rounded-t-3xl p-6 max-h-[85vh]`}
          >
            <View className="flex-row justify-between items-center mb-6">
              <Text className={`text-xl font-bold ${currentTheme.text}`}>
                {selectedTemplate ? "Edit Template" : "Create Template"}
              </Text>
              <TouchableOpacity onPress={() => {
                setShowTemplatesModal(false);
                setSelectedTemplate(null);
                setTemplateFormData({
                  templateName: "",
                  templateItems: [],
                  isActive: true,
                });
              }}>
                <X size={24} color={currentTheme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="space-y-4">
                <View>
                  <Text className={`font-medium mb-2 ${currentTheme.text}`}>
                    Template Name *
                  </Text>
                  <TextInput
                    placeholder="Enter template name"
                    placeholderTextColor={currentTheme.textMuted}
                    value={templateFormData.templateName}
                    onChangeText={(text) => setTemplateFormData({
                      ...templateFormData,
                      templateName: text
                    })}
                    className={`px-4 py-3 rounded-xl border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                  />
                </View>

                <View>
                  <View className="flex-row justify-between items-center mb-4">
                    <Text className={`font-medium ${currentTheme.text}`}>
                      Template Items *
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setTemplateFormData({
                          ...templateFormData,
                          templateItems: [
                            ...templateFormData.templateItems,
                            {
                              itemName: "",
                              required: false,
                              description: "",
                              fileType: "any",
                            },
                          ],
                        });
                      }}
                      className="flex-row items-center gap-2 px-3 py-1.5 bg-purple-600 rounded-lg"
                    >
                      <Plus size={16} color="white" />
                      <Text className="text-white text-sm">Add Item</Text>
                    </TouchableOpacity>
                  </View>

                  <ScrollView className="max-h-60">
                    {templateFormData.templateItems.map((item, index) => (
                      <View
                        key={`item-${index}`}
                        className={`p-4 mb-3 ${currentTheme.border} rounded-lg border`}
                      >
                        <View className="flex-row justify-between items-center mb-3">
                          <Text className={`font-medium ${currentTheme.text}`}>
                            Item {index + 1}
                          </Text>
                          <TouchableOpacity
                            onPress={() => {
                              const newItems = [...templateFormData.templateItems];
                              newItems.splice(index, 1);
                              setTemplateFormData({
                                ...templateFormData,
                                templateItems: newItems,
                              });
                            }}
                          >
                            <Trash2 size={18} color="#ef4444" />
                          </TouchableOpacity>
                        </View>

                        <View className="space-y-3">
                          <View>
                            <Text className={`text-sm ${currentTheme.textMuted} mb-1`}>
                              Item Name *
                            </Text>
                            <TextInput
                              placeholder="Enter item name"
                              placeholderTextColor={currentTheme.textMuted}
                              value={item.itemName}
                              onChangeText={(text) => {
                                const newItems = [...templateFormData.templateItems];
                                newItems[index].itemName = text;
                                setTemplateFormData({
                                  ...templateFormData,
                                  templateItems: newItems,
                                });
                              }}
                              className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                            />
                          </View>

                          <View className="flex-row items-center gap-2">
                            <TouchableOpacity
                              onPress={() => {
                                const newItems = [...templateFormData.templateItems];
                                newItems[index].required = !item.required;
                                setTemplateFormData({
                                  ...templateFormData,
                                  templateItems: newItems,
                                });
                              }}
                              className="flex-row items-center gap-2"
                            >
                              <View className={`w-5 h-5 rounded border ${
                                item.required 
                                  ? "bg-purple-600 border-purple-600" 
                                  : currentTheme.border
                              } items-center justify-center`}>
                                {item.required && <Check size={12} color="white" />}
                              </View>
                              <Text className={currentTheme.text}>Required</Text>
                            </TouchableOpacity>
                          </View>

                          <View>
                            <Text className={`text-sm ${currentTheme.textMuted} mb-1`}>
                              Description (optional)
                            </Text>
                            <TextInput
                              placeholder="Enter description"
                              placeholderTextColor={currentTheme.textMuted}
                              value={item.description}
                              onChangeText={(text) => {
                                const newItems = [...templateFormData.templateItems];
                                newItems[index].description = text;
                                setTemplateFormData({
                                  ...templateFormData,
                                  templateItems: newItems,
                                });
                              }}
                              className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.text} ${currentTheme.card}`}
                            />
                          </View>
                        </View>
                      </View>
                    ))}
                  </ScrollView>

                  {templateFormData.templateItems.length === 0 && (
                    <View className={`py-8 ${currentTheme.border} rounded-lg border-dashed items-center`}>
                      <FileText size={32} color={currentTheme.textMuted} />
                      <Text className={`${currentTheme.textMuted} mt-3`}>
                        No items added yet
                      </Text>
                    </View>
                  )}
                </View>

                <View className="flex-row items-center gap-2">
                  <TouchableOpacity
                    onPress={() => setTemplateFormData({
                      ...templateFormData,
                      isActive: !templateFormData.isActive
                    })}
                    className={`w-6 h-6 rounded border ${
                      templateFormData.isActive 
                        ? "bg-purple-600 border-purple-600" 
                        : currentTheme.border
                    } items-center justify-center`}
                  >
                    {templateFormData.isActive && <Check size={12} color="white" />}
                  </TouchableOpacity>
                  <Text className={currentTheme.text}>
                    Active Template
                  </Text>
                </View>
              </View>
            </ScrollView>

            <View className="flex-row gap-3 mt-6">
              <TouchableOpacity
                onPress={() => {
                  setShowTemplatesModal(false);
                  setSelectedTemplate(null);
                  setTemplateFormData({
                    templateName: "",
                    templateItems: [],
                    isActive: true,
                  });
                }}
                className={`flex-1 py-3 rounded-xl border ${currentTheme.border} items-center`}
              >
                <Text className={currentTheme.textMuted}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={selectedTemplate ? updateTemplate : createTemplate}
                disabled={loading.templates || templateFormData.templateItems.length === 0}
                className="flex-1 bg-purple-600 py-3 rounded-xl items-center"
              >
                {loading.templates ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-medium">
                    {selectedTemplate ? "Update" : "Create"} Template
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}