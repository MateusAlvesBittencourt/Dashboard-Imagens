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
    <div className={cn("relative w-full border-b border-border/80 bg-background/90", containerClassName)}>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[360px] -translate-y-1/3 overflow-hidden">
        <div
          className="mx-auto h-full max-w-7xl bg-gradient-to-br from-blue-500/15 via-purple-500/5 to-cyan-400/10 opacity-30 blur-3xl dark:from-blue-500/10 dark:via-slate-900/20 dark:to-emerald-400/5"
          aria-hidden
        />
      </div>
      <div className={cn("relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pt-8 pb-8 sm:px-6 lg:px-8", className)}>
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-4">
              {leading}
              {badge && (
                <span className="rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground/80">
                  {badge}
                </span>
              )}
            </div>
            <div className="space-y-1.5">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
              {description && <p className="max-w-2xl text-base text-muted-foreground">{description}</p>}
            </div>
            {meta && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                {meta}
              </div>
            )}
          </div>
          {actions && <div className="shrink-0 ml-auto md:ml-12 lg:ml-16">{actions}</div>}
        </div>
      </div>
    </div>
  );
}
