import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type PageHeroProps = {
  title: string;
  description?: string;
  badge?: string;
  leading?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
  containerClassName?: string;
};

export function PageHero({
  title,
  description,
  badge,
  leading,
  meta,
  actions,
  className,
  containerClassName,
}: PageHeroProps) {
  return (
    <div className={cn("relative w-full", containerClassName)}>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[360px] -translate-y-1/3 overflow-hidden">
        <div
          className="mx-auto h-full max-w-7xl bg-gradient-to-br from-blue-500/20 via-purple-500/10 to-cyan-400/20 opacity-40 blur-3xl dark:from-blue-500/10 dark:via-slate-900/30 dark:to-emerald-400/5"
          aria-hidden
        />
      </div>
      <div className={cn("relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pt-10 pb-6 sm:px-6 lg:px-8", className)}>
        <div className="flex flex-col gap-6 rounded-3xl border border-border/70 bg-card/80 p-6 shadow-lg shadow-primary/10 backdrop-blur-xl transition dark:border-white/10 dark:bg-slate-950/60 md:flex-row md:items-center md:justify-between lg:p-8">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {leading}
              {badge && (
                <span className="rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground/70">
                  {badge}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
              {description && <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">{description}</p>}
            </div>
            {meta && (
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground/80 sm:text-sm">
                {meta}
              </div>
            )}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
        </div>
      </div>
    </div>
  );
}
