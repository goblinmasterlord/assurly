import * as React from "react"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { TableHead } from "./table"
import { Button } from "./button"

export type SortDirection = "asc" | "desc" | null

interface SortableTableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode
  sortKey?: string
  currentSort?: { key: string; direction: SortDirection }
  onSort?: (key: string) => void
  sortable?: boolean
}

const SortableTableHead = React.forwardRef<HTMLTableCellElement, SortableTableHeadProps>(
  ({ className, children, sortKey, currentSort, onSort, sortable = true, ...props }, ref) => {
    const isActive = currentSort?.key === sortKey
    const direction = isActive ? currentSort?.direction : null

    const handleSort = () => {
      if (sortable && sortKey && onSort) {
        onSort(sortKey)
      }
    }

    const SortIcon = direction === "asc" ? ArrowUp : direction === "desc" ? ArrowDown : ArrowUpDown

    if (!sortable || !sortKey) {
      return (
        <TableHead ref={ref} className={className} {...props}>
          {children}
        </TableHead>
      )
    }

    return (
      <TableHead ref={ref} className={cn("p-0", className)} {...props}>
        <Button
          variant="ghost"
          onClick={handleSort}
          className={cn(
            "h-10 px-2 font-medium text-muted-foreground hover:text-foreground justify-start w-full",
            isActive && "text-foreground"
          )}
        >
          <span className="flex items-center gap-2">
            {children}
            <SortIcon className={cn(
              "h-4 w-4 transition-opacity",
              isActive ? "opacity-100" : "opacity-0 group-hover:opacity-50"
            )} />
          </span>
        </Button>
      </TableHead>
    )
  }
)
SortableTableHead.displayName = "SortableTableHead"

export { SortableTableHead } 