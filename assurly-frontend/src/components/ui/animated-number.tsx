import * as React from "react";
import { cn } from "@/lib/utils";

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  delay?: number;
  className?: string;
  formatter?: (value: number) => string;
  onComplete?: () => void;
}

export function AnimatedNumber({
  value,
  duration = 1000,
  delay = 0,
  className,
  formatter = (val) => val.toFixed(1),
  onComplete,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = React.useState(0);
  const [isAnimating, setIsAnimating] = React.useState(false);
  const prevValueRef = React.useRef(0);

  React.useEffect(() => {
    const startAnimation = () => {
      setIsAnimating(true);
      const startValue = prevValueRef.current;
      const endValue = value;
      const startTime = Date.now();
      
      const animate = () => {
        const now = Date.now();
        const progress = Math.min((now - startTime) / duration, 1);
        
        // Use easeOutCubic for smooth deceleration
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        const currentValue = startValue + (endValue - startValue) * easeOutCubic;
        
        setDisplayValue(currentValue);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
          prevValueRef.current = endValue;
          onComplete?.();
        }
      };
      
      requestAnimationFrame(animate);
    };

    const timer = setTimeout(startAnimation, delay);
    return () => clearTimeout(timer);
  }, [value, duration, delay, onComplete]);

  // Add color change effect based on score
  const getScoreColor = (score: number) => {
    if (score >= 3.5) return "text-emerald-600";
    if (score >= 2.5) return "text-indigo-600";
    if (score >= 1.5) return "text-amber-600";
    return "text-rose-600";
  };

  return (
    <span 
      className={cn(
        "tabular-nums transition-colors duration-300",
        getScoreColor(displayValue),
        isAnimating && "animate-pulse",
        className
      )}
    >
      {formatter(displayValue)}
    </span>
  );
}