"use client";

import Image from "next/image";
import { useTheme } from "@/lib/theme";

const themeBackgrounds: Record<string, string> = {
  theme1: "/photos/court.jpeg",
  theme2: "/photos/theme2-bg.png",
  theme3: "/photos/theme3-auth-bg.png",
};

export default function CourtLines() {
  const { theme } = useTheme();
  const bgImage = themeBackgrounds[theme] ?? themeBackgrounds.theme1;

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }} aria-hidden="true">
      <Image
        src={bgImage}
        alt=""
        fill
        priority
        sizes="100vw"
        style={{ objectFit: "cover", objectPosition: "center" }}
      />
    </div>
  );
}
