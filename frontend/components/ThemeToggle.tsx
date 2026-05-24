"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { FiSun, FiMoon } from "react-icons/fi";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        className="p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-[#401508]"
        aria-label="Toggle theme"
      >
        <div className="w-5 h-5" />
      </button>
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors "
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <FiMoon className="w-5 h-5 text-[#68220D] dark:text-neutral-200" />
      ) : (
        <FiSun className="w-5 h-5 text-[#68220D] dark:text-neutral-200" />
      )}
    </button>
  );
}
