import * as React from "react";
import { cn } from "@/lib/utils";

interface AnimatedProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  className?: string;
  indicatorClassName?: string;
  showAnimation?: boolean;
  delay?: number;
}

const AnimatedProgress = React.forwardRef<HTMLDivElement, AnimatedProgressProps>(
  ({ className, value = 0, max = 100, indicatorClassName, showAnimation = true, delay = 0, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState(showAnimation ? 0 : value);
    const percentage = (displayValue / max) * 100;

    React.useEffect(() => {
      if (!showAnimation) {
        setDisplayValue(value);
        return;
      }

      // Animate the progress value
      const timer = setTimeout(() => {
        setDisplayValue(value);
      }, delay);

      return () => clearTimeout(timer);
    }, [value, showAnimation, delay]);

    return (
      <div
        ref={ref}
        className={cn(
          "relative h-2 w-full overflow-hidden rounded-full bg-slate-100",
          className
        )}
        {...props}
      >
        <div
          className={cn(
            "h-full w-full flex-1 bg-slate-900 transition-all duration-700 ease-out",
            indicatorClassName
          )}
          style={{
            transform: `translateX(-${100 - percentage}%)`,
          }}
        />
      </div>
    );
  }
);

AnimatedProgress.displayName = "AnimatedProgress";

export { AnimatedProgress };