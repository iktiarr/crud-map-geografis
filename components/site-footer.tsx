import { Globe2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SiteFooterProps {
  className?: string;
}

export function SiteFooter({ className }: SiteFooterProps) {
  return (
    <footer
      className={cn(
        "mt-auto border-t border-border/80 bg-background/60 py-8 px-4 sm:px-6 lg:px-8 text-center text-xs text-muted-foreground transition-colors",
        className
      )}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Globe2 className="w-4 h-4 text-primary" />
          <span className="font-semibold text-foreground">GeoSpatial Studio</span>
          <span>- Global Maps & Geographic Management Suite</span>
        </div>
        <div>
          Built with Next.js, Tailwind CSS & shadcn/typeset (Olive Theme)
        </div>
      </div>
    </footer>
  );
}
