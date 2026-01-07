import { Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-9 w-[76px] items-center rounded-full border border-border bg-muted/50" />
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex h-9 items-center gap-1 rounded-full border border-border bg-muted/50 px-1 transition-colors hover:bg-muted"
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-full transition-all ${
          !isDark ? "bg-primary text-primary-foreground" : "text-muted-foreground"
        }`}
      >
        <Sun className="h-4 w-4" />
      </span>
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-full transition-all ${
          isDark ? "bg-primary text-primary-foreground" : "text-muted-foreground"
        }`}
      >
        <Moon className="h-4 w-4" />
      </span>
    </button>
  );
}
