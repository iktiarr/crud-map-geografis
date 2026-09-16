import { Globe2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SiteFooterProps {
  className?: string;
}

export function SiteFooter({ className }: SiteFooterProps) {
  return (
    <footer
      className={cn(
        "mt-auto border-t border-border/80 bg-background/60 py-6 px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground transition-colors",
        className
      )}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Globe2 className="w-4 h-4 text-primary" />
          <span className="font-semibold text-foreground">Global Studio</span>
        </div>
        <div className="text-muted-foreground">
          &copy; 2026 · Developed &amp; Built by{" "}
          <a
            href="https://iktiarr.github.io/ByIktiarramadani/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-primary hover:underline underline-offset-2 transition-colors"
          >
            Iktiar Ramadani
          </a>
        </div>
      </div>
    </footer>
  );
}
