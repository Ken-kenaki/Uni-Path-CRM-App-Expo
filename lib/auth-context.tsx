// lib/auth-context.tsx - Global auth state management
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useSegments } from "expo-router";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "./api";

export interface User {
  $id: string;
  userId: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  role: "admin" | "branchAdmin" | "staff" | "counselor" | "owner";
  organizationId: string;
  organizationName?: string;
  branches?: string[];
  contact?: string;
  avatar?: string;
  status?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => ({ success: false }),
  logout: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    try {
      const result = await api.getCurrentUser();
      if (result.success && result.data) {
        const userData = result.data;
        setUser(userData);
        await AsyncStorage.setItem("user", JSON.stringify(userData));
      } else {
        setUser(null);
        await AsyncStorage.removeItem("user");
      }
    } catch {
      setUser(null);
    }
  }, []);

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Try cached user first
        const cached = await AsyncStorage.getItem("user");
        if (cached) {
          setUser(JSON.parse(cached));
        }
        // Then verify with server
        await refreshUser();
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [refreshUser]);

  // Protect routes
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!user && !inAuthGroup) {
      router.replace("/(auth)");
    } else if (user && inAuthGroup) {
      router.replace("/(tabs)/dashboard");
    }
  }, [user, segments, isLoading, router]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const result = await api.login(email, password);
      if (result.success && result.data) {
        const profile = result.data.profile || result.data;
        setUser(profile);
        await AsyncStorage.setItem("user", JSON.stringify(profile));
        return { success: true };
      }
      return { success: false, error: result.error || "Login failed" };
    } catch (error: any) {
      return { success: false, error: error.message || "Login failed" };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.signout();
    } catch {
      // Ignore signout errors
    }
    setUser(null);
    await AsyncStorage.removeItem("user");
    await AsyncStorage.removeItem("session-cookie");
    router.replace("/(auth)");
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
