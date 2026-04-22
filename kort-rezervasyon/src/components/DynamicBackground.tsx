"use client";

import { useTheme } from "@/lib/theme";

const themeBackgrounds: Record<string, string> = {
  theme1: "/court-bg.png",
  theme2: "/theme2-bg.png",
  theme3: "/theme3-app-bg.png",
};

export default function DynamicBackground() {
  const { theme } = useTheme();
  const bgImage = themeBackgrounds[theme] ?? themeBackgrounds.theme1;

  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: 0,
        backgroundImage: `url('${bgImage}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor: "#A3472E",
      }}
      aria-hidden="true"
    />
  );
}
