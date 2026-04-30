import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScreenHeaderProps {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  trailing?: React.ReactNode;
  large?: boolean;
  className?: string;
}

export function ScreenHeader({ title, subtitle, onBack, trailing, large, className }: ScreenHeaderProps) {
  return (
    <header className={cn("flex items-start justify-between px-5 pt-3 pb-2", className)}>
      <div className="flex items-start gap-2 min-w-0">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full text-foreground hover:bg-muted"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
        <div className="min-w-0 pt-1">
          {title && (
            <h1 className={cn("font-display font-semibold text-foreground", large ? "text-3xl" : "text-xl")}>
              {title}
            </h1>
          )}
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {trailing && <div className="flex items-center pt-1">{trailing}</div>}
    </header>
  );
}
