import React, { useState } from 'react'
import { Check, ChevronDown, X, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'


export interface MultiSelectOption {
  label: string
  value: string
  icon?: React.ReactNode
}

interface MultiSelectProps {
  options: MultiSelectOption[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  className?: string
  maxSelected?: number
  disabled?: boolean
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select items...",
  searchPlaceholder = "Search...",
  emptyText = "No items found",
  className,
  maxSelected,
  disabled = false,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")

  // Filter options based on search
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchValue.toLowerCase())
  )

  const handleSelect = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(item => item !== value))
    } else {
      if (maxSelected && selected.length >= maxSelected) {
        return
      }
      onChange([...selected, value])
    }
  }

  const handleRemove = (value: string, e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    onChange(selected.filter(item => item !== value))
  }

  const handleClearAll = () => {
    onChange([])
    setSearchValue("")
  }

  const getSelectedOptions = () => {
    return options.filter(option => selected.includes(option.value))
  }

  return (
    <div className="relative">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "h-9 justify-between text-left font-normal",
              className
            )}
            disabled={disabled}
          >
            <div className="flex flex-wrap items-center gap-1 flex-1 mr-2">
              {selected.length === 0 ? (
                <span className="text-muted-foreground">{placeholder}</span>
              ) : selected.length === 1 ? (
                <span className="text-sm font-medium text-foreground">
                  {getSelectedOptions()[0].label}
                </span>
              ) : (
                <span className="text-sm font-medium text-foreground">
                  {selected.length} selected
                </span>
              )}
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <div className="flex flex-col">
            {/* Search Header */}
            <div className="flex items-center border-b px-3 py-2">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <Input
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            
            {/* Options List */}
            <div className="max-h-[200px] overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  {emptyText}
                </div>
              ) : (
                <div className="p-1">
                  {filteredOptions.map((option) => {
                    const isSelected = selected.includes(option.value)
                    return (
                      <div
                        key={option.value}
                        className={cn(
                          "flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground",
                          isSelected && "bg-accent/50"
                        )}
                        onClick={() => handleSelect(option.value)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            isSelected ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {option.icon && <span className="mr-2">{option.icon}</span>}
                        <span className="flex-1">{option.label}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            
            {/* Clear All Footer */}
            {selected.length > 0 && (
              <>
                <div className="border-t" />
                <div className="p-1">
                  <button
                    type="button"
                    className="w-full flex items-center justify-center rounded-sm px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    onClick={handleClearAll}
                  >
                    <X className="mr-2 h-3 w-3" />
                    Clear all ({selected.length})
                  </button>
                </div>
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
} 