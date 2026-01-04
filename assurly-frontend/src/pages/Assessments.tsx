import { useState, useMemo, useEffect, useTransition, useCallback } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@/contexts/UserContext";
// import { getAssessments } from "@/services/assessment-service"; // REPLACED with optimized hook
import { useAssessments } from "@/hooks/use-assessments";
import { getSchools } from "@/services/assessment-service";
import type { School } from "@/types/assessment";
import { 
  AlertTriangle,
  Calendar, 
  CheckCircle2, 
  ChevronRight, 
  Clock,
  Eye,
  Filter, 
  Layers,
  ListChecks, 
  PlusCircle, 
  School as SchoolIcon, 
  Search,
  XCircle,
  BookOpen,
  Users,
  DollarSign,
  Building,
  Shield,
  Monitor,
  Settings,
  ClipboardCheck
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelect, type MultiSelectOption } from "@/components/ui/multi-select";
import { TermStepper } from "@/components/ui/term-stepper";
import { FilterBar } from "@/components/ui/filter-bar";
import type { Assessment, AssessmentCategory } from "@/types/assessment";
import { cn } from "@/lib/utils";
import { SchoolPerformanceView } from "@/components/SchoolPerformanceView";
import { DepartmentHeadTableSkeleton } from "@/components/ui/table-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { getAspectDisplayName } from "@/lib/assessment-utils";
import { Progress } from "@/components/ui/progress";
import { SortableTableHead, type SortDirection } from "@/components/ui/sortable-table-head";
import { assessmentCategories } from "@/lib/mock-data";
import { usePreload } from "@/hooks/use-preload";
import { debounce } from "@/lib/performance-utils";

export function AssessmentsPage() {
  const { role } = useUser();
  const isMatAdmin = role === "mat-admin";

  // 🚀 OPTIMIZED: Using enhanced assessments hook with caching, deduplication, and background refresh
  const { 
    assessments, 
    isLoading, 
    error, 
    refreshAssessments,
    isRefreshing 
  } = useAssessments();
  
  // Define all hooks unconditionally here
  const [searchTerm, setSearchTerm] = useState("");
  const [isPending, startTransition] = useTransition();
  
  // Individual filter states for optimistic updates - start with empty, will restore after options load
  const [filters, setFilters] = useState({ category: [] as string[], status: [] as string[], school: [] as string[] });
  const [optimisticFilters, setOptimisticFilters] = useState({ category: [] as string[], status: [] as string[], school: [] as string[] });
  const [filtersRestored, setFiltersRestored] = useState(false);
  const [view, setView] = useState<"table" | "cards">("table");
  const [selectedTerm, setSelectedTerm] = useState<string>(""); // Will be set to first available term
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: SortDirection }>({
    key: "",
    direction: null
  });
  const [schools, setSchools] = useState<School[]>([]);
  const [schoolsLoading, setSchoolsLoading] = useState(true);
  const { preloadRoute, cancelPreload } = usePreload();
  
  // Optimistic filter update handlers with persistence
  const updateFilter = useCallback((filterType: keyof typeof filters, value: string[]) => {
    const newFilters = { ...filters, [filterType]: value };
    
    // Save to localStorage
    try {
      localStorage.setItem('assurly_assessment_filters', JSON.stringify(newFilters));
    } catch (error) {
      console.error('Failed to save filters to localStorage', error);
    }
    
    // Immediate optimistic update
    setOptimisticFilters((prev: typeof filters) => ({ ...prev, [filterType]: value }));
    
    // Deferred actual update with transition
    startTransition(() => {
      setFilters((prev: typeof filters) => ({ ...prev, [filterType]: value }));
    });
  }, [filters]);

  const handleCategoryFilterChange = (newValue: string[]) => {
    updateFilter('category', newValue);
  };

  const handleStatusFilterChange = (newValue: string[]) => {
    updateFilter('status', newValue);
  };

  const handleSchoolFilterChange = (newValue: string[]) => {
    updateFilter('school', newValue);
  };
  
  const clearFilters = useCallback(() => {
    const emptyFilters = { category: [], status: [], school: [] };
    
    // Clear from localStorage
    try {
      localStorage.setItem('assurly_assessment_filters', JSON.stringify(emptyFilters));
    } catch (error) {
      console.error('Failed to clear filters from localStorage', error);
    }
    
    setSearchTerm("");
    setOptimisticFilters(emptyFilters);
    startTransition(() => {
      setFilters(emptyFilters);
    });
  }, []);
  
  // Fetch schools from API
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        setSchoolsLoading(true);
        const schoolsData = await getSchools();
        setSchools(schoolsData);
      } catch (error) {
        console.error('Failed to fetch schools:', error);
        // Fallback to empty array to prevent crashes
        setSchools([]);
      } finally {
        setSchoolsLoading(false);
      }
    };
    
    fetchSchools();
  }, []);
  
  // Get available terms from assessments (for department head view)
  const availableTerms = useMemo(() => {
    if (isMatAdmin) return [];
    const termSet = new Set<string>();
    assessments.forEach(assessment => {
      if (assessment.term && assessment.academicYear) {
        termSet.add(`${assessment.term} ${assessment.academicYear}`);
      }
    });
    
    // Convert to array and sort chronologically (newest first)
    // Academic year order: Autumn (Sept) → Spring (Jan) → Summer (May)
    const terms = Array.from(termSet).sort((a, b) => {
      const [termA, yearA] = a.split(" ");
      const [termB, yearB] = b.split(" ");
      
      // First compare academic years
      const yearNumA = parseInt(yearA.split("-")[0]);
      const yearNumB = parseInt(yearB.split("-")[0]);
      
      if (yearNumA !== yearNumB) {
        return yearNumB - yearNumA; // Newest year first
      }
      
      // Same academic year - order by term position in the year
      // Autumn (Sept) = 1, Spring (Jan) = 2, Summer (May) = 3
      // Higher number = later in year, so reverse for newest first
      const termOrder = { "Autumn": 1, "Spring": 2, "Summer": 3 };
      const termOrderA = termOrder[termA as keyof typeof termOrder] ?? 99;
      const termOrderB = termOrder[termB as keyof typeof termOrder] ?? 99;

      return termOrderB - termOrderA; // Reverse order for newest first
    });
    
    return terms;
  }, [assessments, isMatAdmin]);

  // Auto-select the first (newest) available term for department head view
  useEffect(() => {
    if (!isMatAdmin && availableTerms.length > 0) {
      // Always update to the newest term if we don't have a selection or if the current selection isn't available
      if (!selectedTerm || !availableTerms.includes(selectedTerm)) {
        setSelectedTerm(availableTerms[0]); // First item is always the newest due to sorting
      }
    }
  }, [availableTerms, selectedTerm, isMatAdmin]);

  // Filter assessments by selected term first (for department head view)
  const termFilteredAssessments = useMemo(() => {
    if (isMatAdmin) return assessments;
    if (!selectedTerm) return []; // No term selected yet
    const [term, academicYear] = selectedTerm.split(" ");
    return assessments.filter(assessment => 
      assessment.term === term && assessment.academicYear === academicYear
    );
  }, [assessments, selectedTerm, isMatAdmin]);
  
  // Show all schools from API - same as MAT admin view
  const schoolOptions: MultiSelectOption[] = schools.map(school => ({
    label: school.name,
    value: school.id
  }));
  
  // Create filter options for multi-select components - SHOW ALL ASPECTS
  const categoryOptions: MultiSelectOption[] = assessmentCategories.map(categoryInfo => ({
    label: getAspectDisplayName(categoryInfo.value),
    value: categoryInfo.value
  }));
  
  // Category options for multi-select

  const statusOptions: MultiSelectOption[] = [
    { label: "Completed", value: "completed" },
    { label: "In Progress", value: "in-progress" },
    { label: "Not Started", value: "not-started" },
    { label: "Overdue", value: "overdue" }
  ];
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Optimal for table view UX

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key ? 
        (prev.direction === "asc" ? "desc" : prev.direction === "desc" ? null : "asc") :
        "asc"
    }));
  };

  const filteredAssessments = useMemo(() => {
    // Use optimistic filters when pending, otherwise use actual filters
    const activeFilters = isPending ? optimisticFilters : filters;
    
    if (!isMatAdmin) {
      let filtered = termFilteredAssessments.filter((assessment) => {
        // Search term filter
        const matchesSearch = 
          assessment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          assessment.school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          assessment.category.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Category filter
        const matchesCategory = activeFilters.category.length === 0 || activeFilters.category.includes(assessment.category);
        
        // Status filter
        const matchesStatus = activeFilters.status.length === 0 || activeFilters.status.some((status: string) => {
          switch (status) {
            case "completed": return assessment.status === "Completed";
            case "in-progress": return assessment.status === "In Progress";
            case "not-started": return assessment.status === "Not Started";
            case "overdue": return assessment.status === "Overdue";
            default: return false;
          }
        });
        
        // School filter  
        const matchesSchool = activeFilters.school.length === 0 || activeFilters.school.includes(assessment.school.id);

        return matchesSearch && matchesCategory && matchesStatus && matchesSchool;
      });

      // Apply sorting
      if (sortConfig.key && sortConfig.direction) {
        filtered = [...filtered].sort((a, b) => {
          let aValue: any;
          let bValue: any;

          switch (sortConfig.key) {
            case "assessment":
              aValue = a.name;
              bValue = b.name;
              break;
            case "school":
              aValue = a.school.name;
              bValue = b.school.name;
              break;
            case "aspect":
              aValue = getAspectDisplayName(a.category);
              bValue = getAspectDisplayName(b.category);
              break;
            case "completion":
              aValue = a.completedStandards / a.totalStandards;
              bValue = b.completedStandards / b.totalStandards;
              break;
            case "dueDate":
              aValue = a.dueDate ? new Date(a.dueDate).getTime() : 0;
              bValue = b.dueDate ? new Date(b.dueDate).getTime() : 0;
              break;
            case "status":
              const statusOrder = { "Overdue": 0, "In Progress": 1, "Not Started": 2, "Completed": 3 };
              aValue = statusOrder[a.status as keyof typeof statusOrder] ?? 4;
              bValue = statusOrder[b.status as keyof typeof statusOrder] ?? 4;
              break;
            default:
              return 0;
          }

          if (typeof aValue === "string" && typeof bValue === "string") {
            return sortConfig.direction === "asc" ? 
              aValue.localeCompare(bValue) : 
              bValue.localeCompare(aValue);
          }

          if (typeof aValue === "number" && typeof bValue === "number") {
            return sortConfig.direction === "asc" ? 
              aValue - bValue : 
              bValue - aValue;
          }

          return 0;
        });
      }

      return filtered;
    }
    return [];
  }, [isMatAdmin, termFilteredAssessments, searchTerm, filters, optimisticFilters, isPending, sortConfig]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredAssessments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAssessments = filteredAssessments.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm, filters.category, filters.status, filters.school, selectedTerm]);
  
  // Calculate how many assessments are overdue or in-progress (based on term-filtered assessments)
  // Restore filters from localStorage AFTER options are loaded
  useEffect(() => {
    if (!filtersRestored && schools.length > 0 && assessmentCategories.length > 0) {
      try {
        const saved = localStorage.getItem('assurly_assessment_filters');
        if (saved) {
          const savedFilters = JSON.parse(saved);
          // Validate that saved filter values exist in current options
          const validatedFilters = {
            category: savedFilters.category?.filter((c: string) => 
              assessmentCategories.some(cat => cat.value === c)
            ) || [],
            status: savedFilters.status || [],
            school: savedFilters.school?.filter((s: string) => 
              schools.some(school => school.id === s)
            ) || []
          };
          setFilters(validatedFilters);
          setOptimisticFilters(validatedFilters);
        }
      } catch (error) {
        console.error('Failed to restore filters from localStorage', error);
      }
      setFiltersRestored(true);
    }
  }, [schools, assessmentCategories, filtersRestored]);
  
  const overdueCount = useMemo(() => {
    return termFilteredAssessments.filter(a => a.status === "Overdue").length;
  }, [termFilteredAssessments]);
  
  const inProgressCount = useMemo(() => {
    return termFilteredAssessments.filter(a => a.status === "In Progress").length;
  }, [termFilteredAssessments]);
  
  const getCategoryIcon = (category: string) => {
    // Normalize category to lowercase to handle any case variations
    const normalizedCategory = category.toLowerCase().trim();
    
    switch (normalizedCategory) {
      case "education":
        return <BookOpen className="h-4 w-4" />;
      case "hr":
      case "human resources":
        return <Users className="h-4 w-4" />;
      case "finance":
      case "finance & procurement":
        return <DollarSign className="h-4 w-4" />;
      case "estates":
        return <Building className="h-4 w-4" />;
      case "governance":
        return <Shield className="h-4 w-4" />;
      case "is":
      case "it & information services":
        return <Monitor className="h-4 w-4" />;
      case "it":
      case "it (digital aspects)":
        return <Settings className="h-4 w-4" />;
      default:
        console.warn(`Unknown category: "${category}" (normalized: "${normalizedCategory}")`);
        return <ClipboardCheck className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100";
      case "In Progress":
        return "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100";
      case "Not Started":
        return "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100";
      case "Overdue":
        return "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100";
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return <CheckCircle2 className="h-4 w-4" />;
      case "In Progress":
        return <Clock className="h-4 w-4" />;
      case "Not Started":
        return <ListChecks className="h-4 w-4" />;
      case "Overdue":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const clearAllFilters = clearFilters;
  
  if (error) {
    return (
      <div className="container py-10 flex justify-center items-center h-64">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }
  
  // Now that all hooks are defined, we can use conditional rendering
  if (isMatAdmin) {
    return (
      <div className="container py-10">
        <SchoolPerformanceView 
          assessments={assessments} 
          refreshAssessments={refreshAssessments} 
          isLoading={isLoading}
          isRefreshing={isRefreshing}
        />
        {/* 🚀 OPTIMIZED: Background refresh indicator */}
        {isRefreshing && (
          <div className="fixed bottom-4 right-4 bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded-lg shadow-sm text-sm">
            Refreshing data...
          </div>
        )}
      </div>
    );
  }
  
  // Department Head view
  return (
    <div className="container py-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
                      <h1 className="text-3xl font-bold tracking-tight">My Ratings</h1>
          <div className="text-muted-foreground">
            {isLoading ? (
              <Skeleton className="h-4 w-64" />
            ) : (
              <p>You have {overdueCount} overdue and {inProgressCount} in-progress ratings.</p>
            )}
          </div>
        </div>
        {/* Academic Term Stepper */}
        {isLoading ? (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Academic Term:</span>
            <Skeleton className="h-8 w-[200px]" />
          </div>
        ) : (
          availableTerms.length > 1 && (
            <TermStepper
              terms={availableTerms}
              currentTerm={selectedTerm}
              onTermChange={setSelectedTerm}
            />
          )
        )}
      </div>

      <div className="space-y-5">
        <FilterBar
          title="Filters"
          layout="department-head"
          onClearAll={clearFilters}
          isFiltering={isPending}
          filters={[
            {
              type: 'search',
              placeholder: 'Search ratings...',
              value: searchTerm,
              onChange: setSearchTerm
            },
            {
              type: 'multiselect' as const,
              placeholder: 'Schools',
              value: optimisticFilters.school,
              onChange: handleSchoolFilterChange,
              options: schoolOptions
            },
            {
              type: 'multiselect' as const,
              placeholder: 'Aspects',
              value: optimisticFilters.category,
              onChange: handleCategoryFilterChange,
              options: categoryOptions
            },
            {
              type: 'multiselect' as const,
              placeholder: 'Status',
              value: optimisticFilters.status,
              onChange: handleStatusFilterChange,
              options: statusOptions
            }
          ]}
        />

        {/* Assessment Table */}
        <Card className="border-slate-200">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 border-b border-slate-200">
                  <SortableTableHead 
                    sortKey="school"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    className="text-left"
                  >
                    SCHOOL
                  </SortableTableHead>
                  <SortableTableHead 
                    sortKey="aspect"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    className="text-left"
                  >
                    ASPECT
                  </SortableTableHead>
                  <SortableTableHead 
                    className="text-center"
                    sortKey="status"
                    currentSort={sortConfig}
                    onSort={handleSort}
                  >
                    STATUS
                  </SortableTableHead>
                  <SortableTableHead 
                    className="text-center"
                    sortKey="completion"
                    currentSort={sortConfig}
                    onSort={handleSort}
                  >
                    PROGRESS
                  </SortableTableHead>
                  <SortableTableHead 
                    className="text-center"
                    sortKey="dueDate"
                    currentSort={sortConfig}
                    onSort={handleSort}
                  >
                    DUE DATE
                  </SortableTableHead>
                  <TableHead className="text-right pr-6">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <DepartmentHeadTableSkeleton />
                ) : paginatedAssessments.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-24 text-center"
                    >
                      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <XCircle className="h-10 w-10 mb-2 opacity-20" />
                        <p>No ratings found matching your filters.</p>
                        <Button 
                          variant="link" 
                          className="mt-2"
                          onClick={clearFilters}
                        >
                          Clear all filters
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedAssessments.map((assessment) => (
                    <TableRow 
                      key={assessment.id} 
                      className="hover:bg-slate-50"
                      onMouseEnter={() => preloadRoute(`/assessments/${assessment.id}`, { priority: 'low' })}
                      onMouseLeave={() => cancelPreload(`/assessments/${assessment.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 border border-slate-200 flex-shrink-0">
                            <SchoolIcon className="h-4 w-4 text-slate-600" />
                          </div>
                          <span className="text-sm text-slate-700 font-medium truncate">
                            {assessment.school.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 border border-slate-200 flex-shrink-0">
                            {getCategoryIcon(assessment.category)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-slate-900 leading-tight">
                              {getAspectDisplayName(assessment.category)}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {assessment.name}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={cn("gap-1.5 font-medium text-xs", getStatusColor(assessment.status))}>
                          {getStatusIcon(assessment.status)}
                          {assessment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-sm font-semibold text-slate-700 tabular-nums">{assessment.completedStandards}/{assessment.totalStandards}</span>
                          <Progress value={(assessment.completedStandards / assessment.totalStandards) * 100} className="w-16 h-2" />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {assessment.dueDate ? (
                          <div 
                            className={cn(
                              "inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium",
                              assessment.status === "Overdue" ? "bg-rose-50 text-rose-700 border border-rose-100" : "bg-amber-50 text-amber-700 border border-amber-100"
                            )}
                          >
                            <Calendar className="h-3.5 w-3.5" />
                            <span>
                              {assessment.dueDate}
                              {assessment.status === "Overdue" && " (Overdue)"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">No deadline</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Button asChild variant="outline" size="sm" className="h-8 px-3">
                          <Link to={`/app/assessments/${assessment.id}`}>
                            {assessment.status === "Completed" ? (
                              <>
                                <Eye className="mr-1.5 h-3.5 w-3.5" />
                                View
                              </>
                            ) : (
                              <>
                                <ChevronRight className="mr-1 h-3.5 w-3.5" />
                                Continue
                              </>
                            )}
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* 🚀 OPTIMIZED: Background refresh indicator */}
        {isRefreshing && (
          <div className="fixed bottom-4 right-4 bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded-lg shadow-sm text-sm">
            Refreshing data...
          </div>
        )}
      </div>
    </div>
  );
} 