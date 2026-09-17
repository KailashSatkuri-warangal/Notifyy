"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Laptop } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="w-8 h-8" />;

  return (
    <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs">
      <button
        onClick={() => setTheme("light")}
        aria-label="Light theme"
        className={`p-1.5 rounded-lg transition-all ${
          theme === "light"
            ? "bg-white dark:bg-zinc-700 text-indigo-600 shadow-xs font-semibold"
            : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
        }`}
      >
        <Sun className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme("dark")}
        aria-label="Dark theme"
        className={`p-1.5 rounded-lg transition-all ${
          theme === "dark"
            ? "bg-white dark:bg-zinc-700 text-indigo-400 shadow-xs font-semibold"
            : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
        }`}
      >
        <Moon className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme("system")}
        aria-label="System theme"
        className={`p-1.5 rounded-lg transition-all ${
          theme === "system"
            ? "bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-xs font-semibold"
            : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
        }`}
      >
        <Laptop className="w-4 h-4" />
      </button>
    </div>
  );
}
