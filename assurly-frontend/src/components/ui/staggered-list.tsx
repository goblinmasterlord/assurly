import * as React from "react";
import { cn } from "@/lib/utils";

interface StaggeredListProps {
  children: React.ReactNode;
  delay?: number;
  stagger?: number;
  className?: string;
  animationClassName?: string;
}

export function StaggeredList({
  children,
  delay = 0,
  stagger = 50,
  className,
  animationClassName = "animate-in fade-in-0 slide-in-from-bottom-2",
}: StaggeredListProps) {
  const childrenArray = React.Children.toArray(children);

  return (
    <div className={className}>
      {childrenArray.map((child, index) => (
        <div
          key={index}
          className={cn(animationClassName, "fill-mode-both")}
          style={{
            animationDelay: `${delay + index * stagger}ms`,
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}

interface StaggeredItemProps extends React.HTMLAttributes<HTMLDivElement> {
  delay?: number;
  animationClassName?: string;
}

export function StaggeredItem({
  children,
  delay = 0,
  animationClassName = "animate-in fade-in-0 slide-in-from-bottom-2",
  className,
  ...props
}: StaggeredItemProps) {
  return (
    <div
      className={cn(animationClassName, "fill-mode-both", className)}
      style={{
        animationDelay: `${delay}ms`,
      }}
      {...props}
    >
      {children}
    </div>
  );
}