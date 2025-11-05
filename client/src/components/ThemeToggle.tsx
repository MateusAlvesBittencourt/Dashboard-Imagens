import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { motion, Transition } from "framer-motion";
import { MoonStar, SunMedium } from "lucide-react";
import { useMemo } from "react";

type ThemeToggleProps = {
  className?: string;
};

const spring: Transition = {
  type: "spring",
  stiffness: 320,
  damping: 24,
};

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme, switchable } = useTheme();
  const isDark = theme === "dark";

  const label = useMemo(() => (isDark ? "Modo escuro" : "Modo claro"), [isDark]);

  if (!switchable || !toggleTheme) return null;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "group relative flex h-10 items-center rounded-full border border-border bg-background/80 px-2 pl-2 pr-3 text-sm font-medium text-muted-foreground shadow-sm backdrop-blur transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:border-white/10 dark:bg-background/60",
        className
      )}
      aria-label={label}
    >
      <motion.span
        layout
        transition={spring}
        className="absolute inset-1 rounded-full bg-linear-to-r from-blue-500/15 via-violet-500/20 to-blue-500/15 opacity-0 blur-0 transition-opacity group-hover:opacity-100"
        aria-hidden
      />

      <motion.span
        layout
        transition={spring}
        className={cn(
          "relative flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-slate-100 to-slate-200 text-slate-900 shadow-sm transition group-hover:shadow",
          isDark && "from-slate-900 via-slate-800 to-slate-900 text-blue-100 shadow-lg"
        )}
      >
        {isDark ? (
          <MoonStar className="h-4 w-4" aria-hidden />
        ) : (
          <SunMedium className="h-4 w-4" aria-hidden />
        )}
      </motion.span>

      <motion.span
        layout
        transition={spring}
        className="relative ml-3 hidden whitespace-nowrap text-xs font-semibold uppercase tracking-wide text-muted-foreground/80 sm:inline"
      >
        {isDark ? "Dark" : "Light"}
      </motion.span>
    </button>
  );
}
