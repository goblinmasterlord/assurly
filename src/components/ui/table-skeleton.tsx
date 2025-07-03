import { Skeleton } from "@/components/ui/skeleton";
import { TableRow, TableCell } from "@/components/ui/table";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  columnWidths?: string[];
}

export function TableSkeleton({ 
  rows = 5, 
  columns = 6, 
  columnWidths = [] 
}: TableSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <TableRow key={rowIndex}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <TableCell key={colIndex}>
              <Skeleton 
                className={`h-4 ${columnWidths[colIndex] || 'w-full'}`} 
              />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

// Specific skeleton for MAT Admin School Performance View
export function SchoolPerformanceTableSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, index) => (
        <TableRow key={index}>
          {/* Expandable button */}
          <TableCell className="w-12">
            <Skeleton className="h-6 w-6" />
          </TableCell>
          
          {/* School Name & Code */}
          <TableCell>
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                <Skeleton className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </TableCell>
          
          {/* Assessments Progress */}
          <TableCell className="text-center">
            <div className="flex items-center justify-center space-x-2">
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-2 w-16" />
            </div>
          </TableCell>
          
          {/* Overall Score */}
          <TableCell className="text-center">
            <div className="flex items-center justify-center space-x-1.5">
              <Skeleton className="h-6 w-12 rounded-full" />
              <Skeleton className="h-4 w-4" />
            </div>
          </TableCell>
          
          {/* Intervention Required */}
          <TableCell className="text-center">
            <Skeleton className="h-6 w-8 rounded-full" />
          </TableCell>
          
          {/* Last Updated */}
          <TableCell className="text-center">
            <Skeleton className="h-4 w-20" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

// Specific skeleton for Department Head Assessment View
export function DepartmentHeadTableSkeleton() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, index) => (
        <TableRow key={index}>
          {/* Assessment Name */}
          <TableCell>
            <div className="space-y-1">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
          </TableCell>
          
          {/* School */}
          <TableCell>
            <Skeleton className="h-4 w-32" />
          </TableCell>
          
          {/* Category */}
          <TableCell>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-20" />
            </div>
          </TableCell>
          
          {/* Progress */}
          <TableCell>
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-2 w-full" />
            </div>
          </TableCell>
          
          {/* Due Date */}
          <TableCell>
            <Skeleton className="h-4 w-20" />
          </TableCell>
          
          {/* Status */}
          <TableCell>
            <Skeleton className="h-6 w-24 rounded-full" />
          </TableCell>
          
          {/* Actions */}
          <TableCell>
            <Skeleton className="h-8 w-20" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
} 