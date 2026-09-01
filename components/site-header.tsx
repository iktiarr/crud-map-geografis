import Link from "next/link";
import { ArrowLeft, Globe2, Map as MapIcon, Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { StorageManagerDialog } from "@/components/storage-manager-dialog";

export interface SiteHeaderProps {
  variant?: "home" | "subpage";
  title?: string;
  badge?: string;
  icon?: React.ComponentType<{ className?: string }>;
  backHref?: string;
  backLabel?: string;
  children?: React.ReactNode;
}

export function SiteHeader({
  variant = "home",
  title,
  badge,
  icon: Icon = Globe2,
  backHref = "/",
  backLabel = "Kembali ke Beranda",
  children,
}: SiteHeaderProps) {
  const isSubpage = variant === "subpage" || Boolean(title);

  return (
    <header className="border-b border-border/80 bg-background/80 backdrop-blur-md sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {isSubpage ? (
          /* Subpage Navigation (Back button + Module Title) */
          <div className="flex items-center gap-4">
            <Link
              href={backHref}
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: "inline-flex items-center gap-2 text-xs shadow-xs",
              })}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{backLabel}</span>
            </Link>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                <Icon className="w-4 h-4" />
              </div>
              {title && (
                <span className="font-semibold text-sm sm:text-base tracking-tight text-foreground">
                  {title}
                </span>
              )}
            </div>
          </div>
        ) : (
          /* Main Homepage Brand */
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-olive-drab-600 to-olive-drab-400 p-px shadow-sm group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-card rounded-[15px] flex items-center justify-center">
                  <Globe2 className="w-5 h-5 text-primary" />
                </div>
              </div>
              <div>
                <span className="font-bold text-base sm:text-lg tracking-tight bg-linear-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                  GeoSpatial Studio
                </span>
                <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground border border-border">
                  Olive GIS
                </span>
              </div>
            </Link>
          </div>
        )}

        {/* Right Side Actions, Storage Manager & Theme Toggle */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {children}

          {isSubpage ? (
            <>
              {badge && (
                <Badge variant="secondary" className="font-mono text-xs hidden sm:inline-flex">
                  {badge}
                </Badge>
              )}
            </>
          ) : (
            <>
              <Link
                href="/global-maps"
                className={buttonVariants({
                  variant: "outline",
                  size: "sm",
                  className: "hidden sm:inline-flex text-xs",
                })}
              >
                <MapIcon className="w-3.5 h-3.5 mr-1.5 text-primary" />
                Peta Global
              </Link>
              <Link
                href="/spatial-crud"
                className={buttonVariants({
                  size: "sm",
                  className: "text-xs shadow-xs",
                })}
              >
                <Database className="w-3.5 h-3.5 mr-1.5" />
                Data Spasial
              </Link>
            </>
          )}

          <StorageManagerDialog />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
