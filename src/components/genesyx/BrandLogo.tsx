import { cn } from "@/lib/utils";
import wordmark from "@/assets/genesyx-wordmark.png";

interface BrandLogoProps {
  className?: string;
  /** Wordmark height in px. Defaults to 18 (compact header). */
  size?: number;
}

export function BrandLogo({ className, size = 18 }: BrandLogoProps) {
  return (
    <div className={cn("inline-flex items-center", className)}>
      <img
        src={wordmark}
        alt="Genesyx"
        style={{ height: size, width: "auto" }}
        className="select-none object-contain"
        draggable={false}
      />
    </div>
  );
}

export function BrandOrb({ className }: { className?: string }) {
  return <div className={cn("gx-orb rounded-full", className)} aria-hidden />;
}
