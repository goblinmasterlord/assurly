import * as React from "react"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface TermStepperProps {
  terms: string[]
  currentTerm: string
  onTermChange: (term: string) => void
  className?: string
  showDropdown?: boolean
}

export function TermStepper({
  terms,
  currentTerm,
  onTermChange,
  className,
  showDropdown = true,
}: TermStepperProps) {
  const currentIndex = terms.indexOf(currentTerm)
  const canGoNext = currentIndex > 0 // Newer terms are at index 0
  const canGoPrev = currentIndex < terms.length - 1 // Older terms are at higher indices
  
  const handleNext = () => {
    if (canGoNext) {
      onTermChange(terms[currentIndex - 1])
    }
  }

  const handlePrev = () => {
    if (canGoPrev) {
      onTermChange(terms[currentIndex + 1])
    }
  }

  const formatTermForDisplay = (term: string) => {
    const [termName, academicYear] = term.split(" ")
    return `${termName} ${academicYear}`
  }

  if (terms.length <= 1) {
    return null
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
        Academic Term:
      </span>
      
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrev}
          disabled={!canGoPrev}
          className="h-8 w-8 p-0"
          title="Previous term"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous term</span>
        </Button>

        {showDropdown ? (
          <Select value={currentTerm} onValueChange={onTermChange}>
            <SelectTrigger className="h-8 w-[220px] bg-white gap-1">
              <Calendar className="h-3.5 w-3.5 opacity-50" />
              <SelectValue>
                <span className="truncate">
                  {formatTermForDisplay(currentTerm)}
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent align="center">
              {terms.map((term) => (
                <SelectItem key={term} value={term}>
                  <div className="flex items-center gap-2">
                    <span>{formatTermForDisplay(term)}</span>
                    {term === terms[0] && (
                      <span className="text-xs text-muted-foreground">(Current)</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-muted/30 rounded-md w-[220px] justify-center">
            <Calendar className="h-3.5 w-3.5 opacity-70" />
            {formatTermForDisplay(currentTerm)}
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={!canGoNext}
          className="h-8 w-8 p-0"
          title="Next term"
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next term</span>
        </Button>
      </div>

      {terms.length > 1 && (
        <div className="text-xs text-muted-foreground">
          {currentIndex + 1} of {terms.length}
        </div>
      )}
    </div>
  )
} 