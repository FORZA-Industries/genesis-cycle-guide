import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  showMark?: boolean;
}

export function BrandLogo({ className, showMark = true }: BrandLogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      {showMark && <BrandOrb className="h-6 w-6" />}
      <span className="font-display text-xl font-semibold tracking-tight text-foreground">
        Genesyx
      </span>
    </div>
  );
}

export function BrandOrb({ className }: { className?: string }) {
  return <div className={cn("gx-orb rounded-full", className)} aria-hidden />;
}
