import * as React from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PageHeroProps {
  badge?: string;
  badgeIcon?: React.ComponentType<{ className?: string }>;
  title: React.ReactNode;
  description: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function PageHero({
  badge,
  badgeIcon: BadgeIcon = Sparkles,
  title,
  description,
  children,
  className,
}: PageHeroProps) {
  return (
    <div className={cn("typeset typeset-notes max-w-[48em] mb-8", className)}>
      {badge && (
        <div className="not-typeset inline-flex items-center gap-2 px-3 py-0.5 rounded-full text-xs font-mono font-medium bg-secondary text-muted-foreground border border-border mb-3 shadow-2xs">
          <BadgeIcon className="w-3.5 h-3.5 text-foreground" />
          <span>{badge}</span>
        </div>
      )}
      <h1 className="tracking-tight text-foreground font-bold text-2xl sm:text-3xl lg:text-4xl mb-2 leading-tight">{title}</h1>
      <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">{description}</p>
      {children}
    </div>
  );
}
