import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface MicroLoaderProps {
  className?: string;
}

// Tiny spinner for buttons and inline actions
export function ButtonLoader({ className }: MicroLoaderProps) {
  return (
    <Loader2 className={cn("h-3 w-3 animate-spin", className)} />
  );
}

// Dots loader for subtle loading states
export function DotsLoader({ className }: MicroLoaderProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="h-1.5 w-1.5 bg-current rounded-full animate-pulse" />
      <div className="h-1.5 w-1.5 bg-current rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
      <div className="h-1.5 w-1.5 bg-current rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
    </div>
  );
}

// Inline text loader that preserves layout
export function TextLoader({ className, width = "w-20" }: MicroLoaderProps & { width?: string }) {
  return (
    <span className={cn("inline-block", width, className)}>
      <span className="block h-4 bg-slate-200 rounded animate-pulse" />
    </span>
  );
}

// Badge loader that maintains size
export function BadgeLoader({ className }: MicroLoaderProps) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
      "bg-slate-100 text-transparent animate-pulse h-6 w-16",
      className
    )}>
      <span className="invisible">Loading</span>
    </span>
  );
}

// Progress bar loader
export function ProgressLoader({ className }: MicroLoaderProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
        <div className="h-full w-1/3 bg-slate-300 rounded-full animate-shimmer" />
      </div>
    </div>
  );
}

// Cell loader for table cells
export function CellLoader({ className, align = "left" }: MicroLoaderProps & { align?: "left" | "center" | "right" }) {
  const alignClass = {
    left: "mr-auto",
    center: "mx-auto",
    right: "ml-auto"
  }[align];
  
  return (
    <div className={cn("h-4 w-24 bg-slate-200 rounded animate-pulse", alignClass, className)} />
  );
}

// Icon button loader
export function IconButtonLoader({ className }: MicroLoaderProps) {
  return (
    <div className={cn("h-8 w-8 bg-slate-200 rounded animate-pulse", className)} />
  );
}

// Overlay loader for cards and sections
export function OverlayLoader({ 
  className, 
  message,
  blur = true 
}: MicroLoaderProps & { 
  message?: string;
  blur?: boolean;
}) {
  return (
    <div className={cn(
      "absolute inset-0 z-10 flex items-center justify-center rounded-lg",
      blur ? "bg-white/70 backdrop-blur-sm" : "bg-white/90",
      className
    )}>
      <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-md shadow-sm border">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-600" />
        {message && <span className="text-sm text-slate-600">{message}</span>}
      </div>
    </div>
  );
}

// Skeleton text with multiple lines
export function ParagraphLoader({ 
  lines = 3, 
  className 
}: MicroLoaderProps & { 
  lines?: number;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div 
          key={i} 
          className={cn(
            "h-4 bg-slate-200 rounded animate-pulse",
            i === lines - 1 ? "w-3/4" : "w-full"
          )}
        />
      ))}
    </div>
  );
}

// Stat loader for metric displays
export function StatLoader({ className }: MicroLoaderProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <div className="h-8 w-16 bg-slate-200 rounded animate-pulse" />
      <div className="h-3 w-24 bg-slate-100 rounded animate-pulse" />
    </div>
  );
}

// Avatar loader
export function AvatarLoader({ 
  size = "default",
  className 
}: MicroLoaderProps & { 
  size?: "sm" | "default" | "lg";
}) {
  const sizeClasses = {
    sm: "h-8 w-8",
    default: "h-10 w-10",
    lg: "h-12 w-12"
  };
  
  return (
    <div className={cn(
      "rounded-full bg-slate-200 animate-pulse",
      sizeClasses[size],
      className
    )} />
  );
}

// Action button with loading state
export function ActionButtonLoader({ 
  loading, 
  children,
  className
}: { 
  loading: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("relative inline-flex items-center gap-2", className)}>
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center bg-inherit rounded">
          <ButtonLoader />
        </span>
      )}
      <span className={cn(loading && "invisible")}>{children}</span>
    </span>
  );
}