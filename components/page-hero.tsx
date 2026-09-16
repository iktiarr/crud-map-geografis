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
        <div className="not-typeset inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-border mb-3 shadow-xs">
          <BadgeIcon className="w-3.5 h-3.5 text-primary" />
          <span>{badge}</span>
        </div>
      )}
      <h1 className="tracking-tight text-foreground mb-2">{title}</h1>
      <p className="text-muted-foreground">{description}</p>
      {children}
    </div>
  );
}
