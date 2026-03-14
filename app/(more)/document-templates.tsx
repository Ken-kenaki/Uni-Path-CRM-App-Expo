// app/(more)/document-templates.tsx
import { api } from "@/lib/api";
import { useToast } from "@/lib/toast-context";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  CheckCircle,
  FileText,
  Plus,
  Search,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

interface DocTemplate {
  $id: string;
  templateName: string;
  description?: string;
  documents?: any[];
  isRequired?: boolean;
  $createdAt: string;
}

export default function DocumentTemplatesScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [templates, setTemplates] = useState<DocTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const fetchTemplates = useCallback(async () => {
    try {
      const result = await api.getDocumentTemplates();
      if (result.success && result.data) {
        const items = Array.isArray(result.data)
          ? result.data
          : result.data.documents || [];
        setTemplates(items);
      }
    } catch {
      showToast("Failed to load templates", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const filtered = templates.filter(
    (t) => !search || t.templateName?.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item }: { item: DocTemplate }) => (
    <Animated.View entering={FadeIn.duration(300)}>
      <View className="mx-4 mb-3 p-4 rounded-2xl bg-[#111111] border border-[#1f1f1f]">
        <View className="flex-row items-center">
          <View className="w-10 h-10 rounded-xl bg-purple-500/15 items-center justify-center">
            <FileText size={18} color="#8b5cf6" />
          </View>
          <View className="flex-1 ml-3">
            <Text className="text-white font-semibold text-[15px]">{item.templateName}</Text>
            {item.description && (
              <Text className="text-gray-500 text-xs mt-0.5" numberOfLines={1}>
                {item.description}
              </Text>
            )}
          </View>
          {item.documents && (
            <View className="px-2 py-0.5 rounded-full bg-[#1a1a1a]">
              <Text className="text-gray-400 text-xs">
                {item.documents.length} docs
              </Text>
            </View>
          )}
        </View>
        {item.documents && item.documents.length > 0 && (
          <View className="mt-3 pt-3 border-t border-[#1f1f1f]">
            {item.documents.slice(0, 3).map((doc: any, idx: number) => (
              <View key={idx} className="flex-row items-center mb-1.5">
                <CheckCircle size={12} color="#6b7280" />
                <Text className="text-gray-400 text-xs ml-2">{doc.name || doc.documentName || `Document ${idx + 1}`}</Text>
              </View>
            ))}
            {item.documents.length > 3 && (
              <Text className="text-gray-600 text-xs ml-5">
                +{item.documents.length - 3} more
              </Text>
            )}
          </View>
        )}
      </View>
    </Animated.View>
  );

  if (loading) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-row items-center px-4 pt-2 pb-4">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <ArrowLeft size={22} color="white" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-xl font-bold text-white">Document Templates</Text>
          <Text className="text-gray-500 text-xs">{templates.length} templates</Text>
        </View>
      </View>

      <View className="mx-4 mb-4 flex-row items-center bg-[#111111] border border-[#1f1f1f] rounded-xl px-3">
        <Search size={18} color="#6b7280" />
        <TextInput
          className="flex-1 text-white py-3 px-2 text-sm"
          placeholder="Search templates..."
          placeholderTextColor="#6b7280"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.$id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchTemplates(); }}
            tintColor="#8b5cf6"
          />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <FileText size={48} color="#374151" />
            <Text className="text-gray-500 mt-4">No document templates found</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
