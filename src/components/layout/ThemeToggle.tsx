"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Laptop } from "lucide-react";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="w-8 h-8" />;

  const toggleTheme = () => {
    if (resolvedTheme === "dark") {
      setTheme("light");
    } else {
      setTheme("dark");
    }
  };

  if (compact) {
    return (
      <button
        onClick={toggleTheme}
        aria-label="Toggle theme"
        className="p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50"
      >
        {resolvedTheme === "dark" ? (
          <Moon className="w-4 h-4 text-indigo-400" />
        ) : (
          <Sun className="w-4 h-4 text-amber-500" />
        )}
      </button>
    );
  }

  return (
    <>
      {/* Mobile single icon toggle */}
      <button
        onClick={toggleTheme}
        aria-label="Toggle theme"
        className="sm:hidden p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50"
      >
        {resolvedTheme === "dark" ? (
          <Moon className="w-4 h-4 text-indigo-400" />
        ) : (
          <Sun className="w-4 h-4 text-amber-500" />
        )}
      </button>

      {/* Desktop 3-state segmented control */}
      <div className="hidden sm:flex items-center gap-0.5 bg-zinc-100 dark:bg-zinc-800/90 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs">
        <button
          onClick={() => setTheme("light")}
          aria-label="Light theme"
          className={`p-1.5 rounded-lg transition-all ${
            theme === "light"
              ? "bg-white dark:bg-zinc-700 text-indigo-600 shadow-xs font-semibold"
              : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          }`}
        >
          <Sun className="w-3.5 h-3.5" />
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
          <Moon className="w-3.5 h-3.5" />
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
          <Laptop className="w-3.5 h-3.5" />
        </button>
      </div>
    </>
  );
}
