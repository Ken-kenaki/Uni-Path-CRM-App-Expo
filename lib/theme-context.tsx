import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Theme, ThemeConfig, themeConfigs } from "../theme";

interface ThemeContextType {
    theme: Theme;
    themeConfig: ThemeConfig;
    setTheme: (theme: Theme) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>("dark");

    useEffect(() => {
        const loadTheme = async () => {
            try {
                const savedTheme = await AsyncStorage.getItem("app_theme");
                if (savedTheme && (savedTheme in themeConfigs)) {
                    setThemeState(savedTheme as Theme);
                }
            } catch (error) {
                console.error("Failed to load theme", error);
            }
        };
        loadTheme();
    }, []);

    const setTheme = async (newTheme: Theme) => {
        try {
            await AsyncStorage.setItem("app_theme", newTheme);
            setThemeState(newTheme);
        } catch (error) {
            console.error("Failed to save theme", error);
        }
    };

    return (
        <ThemeContext.Provider
            value={{
                theme,
                themeConfig: themeConfigs[theme],
                setTheme,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
}

export function useAppTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useAppTheme must be used within a ThemeProvider");
    }
    return context;
}
