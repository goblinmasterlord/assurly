import React, { useState } from 'react'
import { Filter, Search, ChevronDown, ChevronUp, TrendingUp, Users, School, BookOpen, DollarSign, Building, Shield, Monitor, Settings, AlertTriangle, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { MultiSelect, type MultiSelectOption } from '@/components/ui/multi-select'
import { cn } from '@/lib/utils'

interface FilterConfig {
  type: 'search' | 'multiselect' | 'checkbox'
  label?: string
  placeholder?: string
  value?: string | string[] | boolean
  onChange?: (value: any) => void
  options?: MultiSelectOption[]
  id?: string
  className?: string
  icon?: React.ReactNode
}

interface FilterBarProps {
  title?: string
  filters: FilterConfig[]
  onClearAll?: () => void
  className?: string
  layout?: 'mat-admin' | 'department-head'
  isFiltering?: boolean
}

export function FilterBar({ 
  title = "Filters", 
  filters, 
  onClearAll, 
  className,
  layout = 'department-head',
  isFiltering = false
}: FilterBarProps) {
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
  
  // Check if any filters have values to show clear all button
  const hasActiveFilters = filters.some(filter => {
    if (filter.type === 'search' && typeof filter.value === 'string') {
      return filter.value.length > 0
    }
    if (filter.type === 'multiselect' && Array.isArray(filter.value)) {
      return filter.value.length > 0
    }
    if (filter.type === 'checkbox') {
      return filter.value === true
    }
    return false
  })

  // Auto-expand search if there's a search value
  React.useEffect(() => {
    const searchFilter = filters.find(f => f.type === 'search')
    if (searchFilter && typeof searchFilter.value === 'string' && searchFilter.value.length > 0) {
      setIsSearchExpanded(true)
    }
  }, [filters])

  const getFilterIcon = (placeholder?: string) => {
    switch (placeholder?.toLowerCase()) {
      case 'schools':
        return <School className="h-4 w-4 text-slate-500" />
      case 'aspects':
      case 'aspect':
        return <BookOpen className="h-4 w-4 text-slate-500" />
      case 'status':
        return <TrendingUp className="h-4 w-4 text-slate-500" />
      case 'performance':
        return <TrendingUp className="h-4 w-4 text-slate-500" />
      default:
        return <Filter className="h-4 w-4 text-slate-500" />
    }
  }

  const renderFilter = (filter: FilterConfig, index: number) => {
    switch (filter.type) {
      case 'search':
        if (!isSearchExpanded) return null
        return (
          <div key={index} className={cn("col-span-full", filter.className)}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder={filter.placeholder || "Search..."}
                value={filter.value as string || ""}
                onChange={(e) => filter.onChange?.(e.target.value)}
                className="pl-10 h-9 bg-white"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-slate-100"
                onClick={() => {
                  setIsSearchExpanded(false)
                  filter.onChange?.("")
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )
      
      case 'multiselect':
        return (
          <div key={index} className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2">
              {getFilterIcon(filter.placeholder)}
              <span className="text-sm font-medium text-slate-600">{filter.placeholder}</span>
            </div>
            <MultiSelect
              options={filter.options || []}
              selected={filter.value as string[] || []}
              onChange={filter.onChange || (() => {})}
              placeholder={`Select ${filter.placeholder?.toLowerCase()}...`}
              className="h-9 w-full"
            />
          </div>
        )
      
      case 'checkbox':
        return (
          <div key={index} className="flex items-center justify-start h-9">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={filter.id}
                checked={filter.value as boolean || false}
                onChange={(e) => filter.onChange?.(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
              />
              <label 
                htmlFor={filter.id} 
                className="text-sm font-medium text-slate-700 whitespace-nowrap cursor-pointer flex items-center space-x-2"
              >
                <AlertTriangle className="h-4 w-4 text-rose-500" />
                <span>{filter.label}</span>
              </label>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  // Get grid layout based on view type and filter count
  const getGridLayout = () => {
    const multiselectCount = filters.filter(f => f.type === 'multiselect').length
    
    if (layout === 'mat-admin') {
      // MAT admin: 4 dropdowns + 1 checkbox
      if (multiselectCount === 4) {
        return "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      } else if (multiselectCount === 3) {
        return "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      }
      return "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    } else {
      // Department head: 3 dropdowns should be in single row
      return "grid grid-cols-1 md:grid-cols-3 gap-4"
    }
  }

  const searchFilter = filters.find(f => f.type === 'search')
  const otherFilters = filters.filter(f => f.type !== 'search')

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Filter className="h-4 w-4 text-slate-600" />
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
            {isFiltering && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Filtering...</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Search Toggle Button */}
            {searchFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSearchExpanded(!isSearchExpanded)}
                className={cn(
                  "h-8 px-2 text-xs transition-all duration-200",
                  isSearchExpanded ? "bg-slate-100 text-slate-700" : "text-slate-500 hover:text-slate-700"
                )}
              >
                <Search className="h-3 w-3 mr-1" />
                Search
                {isSearchExpanded ? (
                  <ChevronUp className="h-3 w-3 ml-1" />
                ) : (
                  <ChevronDown className="h-3 w-3 ml-1" />
                )}
              </Button>
            )}
            
            {hasActiveFilters && onClearAll && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClearAll}
                className="text-xs text-slate-500 hover:text-slate-700 h-7 px-2"
              >
                Clear all
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {/* Search Filter (when expanded) */}
        {isSearchExpanded && searchFilter && (
          <div className="animate-in slide-in-from-top-2 duration-200">
            {renderFilter(searchFilter, 0)}
          </div>
        )}
        
        {/* Other Filters */}
        <div className={getGridLayout()}>
          {otherFilters.map((filter, index) => (
            <div key={index}>
              {renderFilter(filter, index)}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 