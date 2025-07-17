import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";

interface SkeletonProps {
  className?: string;
  shimmer?: boolean;
}

// Enhanced skeleton with shimmer effect
export function SkeletonBox({ className, shimmer = true }: SkeletonProps) {
  return (
    <Skeleton 
      className={cn(
        shimmer && "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
        className
      )} 
    />
  );
}

// Icon container skeleton (8x8)
export function IconSkeleton({ className }: { className?: string }) {
  return (
    <SkeletonBox className={cn("h-8 w-8 rounded-lg", className)} />
  );
}

// Badge skeleton
export function BadgeSkeleton({ className, width = "w-20" }: { className?: string; width?: string }) {
  return (
    <SkeletonBox className={cn("h-6 rounded-full", width, className)} />
  );
}

// Progress skeleton
export function ProgressSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <SkeletonBox className="h-4 w-8" />
      <SkeletonBox className="h-2 w-16 rounded-full" />
    </div>
  );
}

// MAT Admin School Performance Card Skeleton
export function SchoolCardSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <Card 
      className="transition-all duration-500 animate-in fade-in-0 slide-in-from-bottom-2"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <IconSkeleton />
            <div>
              <SkeletonBox className="h-5 w-32 mb-1" />
              <SkeletonBox className="h-3 w-20" />
            </div>
          </div>
          <div className="text-right">
            <SkeletonBox className="h-8 w-16 mb-1" />
            <SkeletonBox className="h-3 w-24" />
          </div>
        </div>
        
        {/* Performance badges */}
        <div className="flex gap-2 mb-3">
          <BadgeSkeleton width="w-24" />
          <BadgeSkeleton width="w-20" />
        </div>
        
        {/* Assessment categories */}
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SkeletonBox className="h-4 w-4 rounded" />
                <SkeletonBox className="h-4 w-24" />
              </div>
              <ProgressSkeleton />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// MAT Admin Table Row Skeleton
export function SchoolTableRowSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <TableRow 
      className="animate-in fade-in-0 slide-in-from-bottom-1"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      {/* Expand/Collapse button */}
      <TableCell className="w-12">
        <SkeletonBox className="h-6 w-6 mx-auto" />
      </TableCell>
      
      {/* School Name */}
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 border border-slate-200">
            <SkeletonBox className="h-4 w-4" />
          </div>
          <div>
            <SkeletonBox className="h-4 w-32 mb-1" />
            <SkeletonBox className="h-3 w-16" />
          </div>
        </div>
      </TableCell>
      
      {/* Ratings Progress */}
      <TableCell className="text-center">
        <div className="flex items-center justify-center gap-2">
          <SkeletonBox className="h-4 w-8" />
          <SkeletonBox className="h-2 w-16 rounded-full" />
        </div>
      </TableCell>
      
      {/* Overall Score */}
      <TableCell className="text-center">
        <BadgeSkeleton className="mx-auto" width="w-16" />
      </TableCell>
      
      {/* Previous 3 Terms Graph */}
      <TableCell className="text-center">
        <SkeletonBox className="h-7 w-20 mx-auto rounded" />
      </TableCell>
      
      {/* Intervention Required */}
      <TableCell className="text-center">
        <BadgeSkeleton className="mx-auto" width="w-12" />
      </TableCell>
      
      {/* Last Updated */}
      <TableCell className="text-center">
        <SkeletonBox className="h-4 w-24 mx-auto" />
      </TableCell>
    </TableRow>
  );
}

// Complete MAT Admin Table Skeleton (returns only tbody content)
export function SchoolPerformanceTableSkeleton() {
  return (
    <>
      {[0, 1, 2, 3, 4].map((i) => (
        <SchoolTableRowSkeleton key={i} delay={i * 80} />
      ))}
    </>
  );
}

// Filter Bar Skeleton
export function FilterBarSkeleton() {
  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <div className="flex items-center justify-between">
        <SkeletonBox className="h-5 w-16" />
        <SkeletonBox className="h-4 w-20" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <SkeletonBox className="h-9 rounded-md" />
        <SkeletonBox className="h-9 rounded-md" />
        <SkeletonBox className="h-9 rounded-md" />
        <SkeletonBox className="h-9 rounded-md" />
        <SkeletonBox className="h-9 rounded-md" />
      </div>
    </div>
  );
}

// Term Navigation Skeleton
export function TermNavigationSkeleton() {
  return (
    <div className="flex items-center gap-2">
      <SkeletonBox className="h-8 w-8 rounded-md" />
      <SkeletonBox className="h-9 w-48 rounded-md" />
      <SkeletonBox className="h-8 w-8 rounded-md" />
    </div>
  );
}

// Assessment Detail Page Skeleton
export function AssessmentDetailSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in-0 duration-500">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <SkeletonBox className="h-8 w-64 mb-2" />
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <IconSkeleton className="h-5 w-5" />
              <SkeletonBox className="h-4 w-32" />
            </div>
            <BadgeSkeleton />
          </div>
        </div>
        <SkeletonBox className="h-9 w-32" />
      </div>

      {/* Progress Card */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <SkeletonBox className="h-5 w-24" />
              <SkeletonBox className="h-4 w-16" />
            </div>
            <SkeletonBox className="h-2 w-full rounded-full" />
            <div className="grid grid-cols-3 gap-4">
              <SkeletonBox className="h-16 rounded-md" />
              <SkeletonBox className="h-16 rounded-md" />
              <SkeletonBox className="h-16 rounded-md" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Standards List */}
      <div className="grid md:grid-cols-[300px_1fr] gap-6">
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div 
              key={i} 
              className="p-3 rounded-lg border animate-in fade-in-0 slide-in-from-left-2"
              style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}
            >
              <div className="flex items-center justify-between">
                <SkeletonBox className="h-4 w-24" />
                <SkeletonBox className="h-5 w-5 rounded-full" />
              </div>
            </div>
          ))}
        </div>
        
        <Card>
          <CardContent className="p-6">
            <SkeletonBox className="h-6 w-48 mb-2" />
            <SkeletonBox className="h-4 w-full mb-4" />
            <SkeletonBox className="h-4 w-3/4 mb-6" />
            
            <div className="space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <SkeletonBox key={i} className="h-24 rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Inline refresh skeleton for data updates
export function InlineRefreshSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg", className)}>
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 bg-slate-400 rounded-full animate-pulse" />
        <div className="h-2 w-2 bg-slate-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
        <div className="h-2 w-2 bg-slate-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}