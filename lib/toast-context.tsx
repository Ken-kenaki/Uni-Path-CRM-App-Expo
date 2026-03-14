// lib/toast-context.tsx - Global toast notification system
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Dimensions, Text, View } from "react-native";
import Animated, { FadeIn, FadeOut, SlideInUp, SlideOutUp } from "react-native-reanimated";

const { width } = Dimensions.get("window");

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

const TOAST_COLORS: Record<ToastType, { bg: string; border: string; text: string; icon: string }> = {
  success: { bg: "bg-emerald-900/90", border: "border-emerald-500", text: "text-emerald-100", icon: "✓" },
  error: { bg: "bg-red-900/90", border: "border-red-500", text: "text-red-100", icon: "✕" },
  info: { bg: "bg-blue-900/90", border: "border-blue-500", text: "text-blue-100", icon: "ℹ" },
  warning: { bg: "bg-amber-900/90", border: "border-amber-500", text: "text-amber-100", icon: "⚠" },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev.slice(-2), { id, message, type }]);

    timeoutRef.current[id] = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      delete timeoutRef.current[id];
    }, 3000);
  }, []);

  useEffect(() => {
    return () => {
      Object.values(timeoutRef.current).forEach(clearTimeout);
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <View className="absolute top-14 left-0 right-0 z-50 items-center" pointerEvents="box-none">
        {toasts.map((toast) => {
          const colors = TOAST_COLORS[toast.type];
          return (
            <Animated.View
              key={toast.id}
              entering={SlideInUp.duration(300)}
              exiting={SlideOutUp.duration(200)}
              className={`mx-4 mb-2 px-4 py-3 rounded-xl border ${colors.bg} ${colors.border} flex-row items-center`}
              style={{ width: width - 32 }}
            >
              <Text className={`text-lg mr-2 ${colors.text}`}>{colors.icon}</Text>
              <Text className={`flex-1 text-sm font-medium ${colors.text}`} numberOfLines={2}>
                {toast.message}
              </Text>
            </Animated.View>
          );
        })}
      </View>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
