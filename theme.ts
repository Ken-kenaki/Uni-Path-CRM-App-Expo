// theme.ts
export type Theme = "light" | "dark" | "girly" | "colorful";

export interface ThemeConfig {
  name: Theme;
  label: string;
  background: string;
  card: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  hover: string;
}

export const themeConfigs: Record<Theme, ThemeConfig> = {
  light: {
    name: "light",
    label: "Light",
    background: "bg-gray-50",
    card: "bg-white",
    text: "text-gray-900",
    textMuted: "text-gray-500",
    border: "border-gray-200",
    primary: "text-purple-600",
    hover: "hover:bg-gray-50",
  },
  dark: {
    name: "dark",
    label: "Dark",
    background: "bg-gray-900",
    card: "bg-gray-800",
    text: "text-white",
    textMuted: "text-gray-400",
    border: "border-gray-700",
    primary: "text-purple-400",
    hover: "hover:bg-gray-700",
  },
  girly: {
    name: "girly",
    label: "Girly",
    background: "bg-pink-50",
    card: "bg-white",
    text: "text-pink-900",
    textMuted: "text-pink-600",
    border: "border-pink-200",
    primary: "text-pink-600",
    hover: "hover:bg-pink-50",
  },
  colorful: {
    name: "colorful",
    label: "Colorful",
    background: "bg-gradient-to-br from-blue-50 via-green-50 to-purple-50",
    card: "bg-white/80 backdrop-blur-sm",
    text: "text-gray-800",
    textMuted: "text-gray-600",
    border: "border-gray-300/50",
    primary: "text-blue-600",
    hover: "hover:bg-white/50",
  },
};