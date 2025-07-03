import React from 'react'
import { Filter, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { MultiSelect, type MultiSelectOption } from '@/components/ui/multi-select'

interface FilterConfig {
  type: 'search' | 'multiselect' | 'checkbox'
  label?: string
  placeholder?: string
  value?: string | string[] | boolean
  onChange?: (value: any) => void
  options?: MultiSelectOption[]
  id?: string
  className?: string
}

interface FilterBarProps {
  title?: string
  filters: FilterConfig[]
  onClearAll?: () => void
  className?: string
  layout?: 'mat-admin' | 'department-head' // Different layouts for different views
}

export function FilterBar({ 
  title = "Filters", 
  filters, 
  onClearAll, 
  className,
  layout = 'department-head'
}: FilterBarProps) {
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

  const renderFilter = (filter: FilterConfig, index: number) => {
    switch (filter.type) {
      case 'search':
        return (
          <div key={index} className={filter.className || ""}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder={filter.placeholder || "Search..."}
                value={filter.value as string || ""}
                onChange={(e) => filter.onChange?.(e.target.value)}
                className="pl-10 h-9"
              />
            </div>
          </div>
        )
      
      case 'multiselect':
        return (
          <MultiSelect
            key={index}
            options={filter.options || []}
            selected={filter.value as string[] || []}
            onChange={filter.onChange || (() => {})}
            placeholder={filter.placeholder || "Select..."}
            className="h-9 w-full"
          />
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
                className="text-sm font-medium text-slate-700 whitespace-nowrap cursor-pointer"
              >
                {filter.label}
              </label>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  // Get grid layout based on view type
  const getGridLayout = () => {
    if (layout === 'mat-admin') {
      // MAT admin: Search (larger) + 3 filters + checkbox
      return "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4"
    } else {
      // Department head: Search + 2-3 filters (no checkbox)
      const filterCount = filters.filter(f => f.type === 'multiselect').length
      if (filterCount === 2) {
        return "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-8 gap-4"
      } else {
        return "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-10 gap-4"
      }
    }
  }

  // Get column spans for each element type
  const getColumnSpan = (filter: FilterConfig, index: number) => {
    if (layout === 'mat-admin') {
      if (filter.type === 'search') return 'lg:col-span-4'
      if (filter.type === 'multiselect') return 'lg:col-span-2'
      if (filter.type === 'checkbox') return 'lg:col-span-2'
    } else {
      // department-head
      if (filter.type === 'search') return 'lg:col-span-4'
      if (filter.type === 'multiselect') {
        const multiselectCount = filters.filter(f => f.type === 'multiselect').length
        return multiselectCount === 2 ? 'lg:col-span-2' : 'lg:col-span-2'
      }
    }
    return ''
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-600" />
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
          </div>
          {hasActiveFilters && onClearAll && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClearAll}
              className="text-xs text-slate-500 hover:text-slate-700 h-7 px-2"
            >
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className={getGridLayout()}>
          {filters.map((filter, index) => (
            <div key={index} className={getColumnSpan(filter, index)}>
              {renderFilter(filter, index)}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 