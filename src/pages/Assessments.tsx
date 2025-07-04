import { useState, useMemo, useEffect } from "react";
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
import {
  mockSchools,
} from "@/lib/mock-data";
// import { getAssessments } from "@/services/assessment-service"; // REPLACED with optimized hook
import { useAssessments } from "@/hooks/use-assessments";
import { 
  AlertTriangle,
  Calendar, 
  CheckCircle2, 
  ChevronRight, 
  Clock,
  Filter, 
  Layers,
  ListChecks, 
  PlusCircle, 
  School as SchoolIcon, 
  Search,
  XCircle
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
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [schoolFilter, setSchoolFilter] = useState<string[]>([]);
  const [view, setView] = useState<"table" | "cards">("table");
  const [selectedTerm, setSelectedTerm] = useState<string>(""); // Will be set to first available term
  
  // Get available terms from assessments (for department head view)
  const availableTerms = useMemo(() => {
    if (isMatAdmin) return [];
    const termSet = new Set<string>();
    assessments.forEach(assessment => {
      if (assessment.term && assessment.academicYear) {
        termSet.add(`${assessment.term} ${assessment.academicYear}`);
      }
    });
    
    // Convert to array and sort chronologically
    const terms = Array.from(termSet).sort((a, b) => {
      const [termA, yearA] = a.split(" ");
      const [termB, yearB] = b.split(" ");
      
      // First compare academic years
      const yearNumA = parseInt(yearA.split("-")[0]);
      const yearNumB = parseInt(yearB.split("-")[0]);
      
      if (yearNumA !== yearNumB) {
        return yearNumB - yearNumA; // Newest year first
      }
      
      // If same year, sort by term with custom order: Autumn (newest), Summer, Spring
      const termOrder = { "Autumn": 0, "Summer": 1, "Spring": 2 };
      const termOrderA = termOrder[termA as keyof typeof termOrder] ?? 99;
      const termOrderB = termOrder[termB as keyof typeof termOrder] ?? 99;

      return termOrderA - termOrderB;
    });
    
    return terms;
  }, [assessments, isMatAdmin]);

  // Auto-select the first available term for department head view
  useEffect(() => {
    if (!isMatAdmin && availableTerms.length > 0 && !selectedTerm) {
      setSelectedTerm(availableTerms[0]);
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
  
  const uniqueSchools = useMemo(() => {
    const schools = [...new Set(termFilteredAssessments.map(a => a.school.id))];
    return mockSchools.filter(school => schools.includes(school.id));
  }, [termFilteredAssessments]);
  
  const uniqueCategories = [...new Set(termFilteredAssessments.map(a => a.category))];
  
  // Create filter options for multi-select components
  const categoryOptions: MultiSelectOption[] = uniqueCategories.map(category => ({
    label: getAspectDisplayName(category),
    value: category
  }));

  const statusOptions: MultiSelectOption[] = [
    { label: "Completed", value: "completed" },
    { label: "In Progress", value: "in-progress" },
    { label: "Not Started", value: "not-started" },
    { label: "Overdue", value: "overdue" }
  ];

  const schoolOptions: MultiSelectOption[] = uniqueSchools.map(school => ({
    label: school.name,
    value: school.id,
    icon: <SchoolIcon className="h-4 w-4" />
  }));
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Optimal for table view UX

  const filteredAssessments = useMemo(() => {
    if (!isMatAdmin) {
      return termFilteredAssessments.filter((assessment) => {
        // Search term filter
        const matchesSearch = 
          assessment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          assessment.school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          assessment.category.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Category filter
        const matchesCategory = categoryFilter.length === 0 || categoryFilter.includes(assessment.category);
        
        // Status filter
        const matchesStatus = statusFilter.length === 0 || statusFilter.some(status => {
          switch (status) {
            case "completed": return assessment.status === "Completed";
            case "in-progress": return assessment.status === "In Progress";
            case "not-started": return assessment.status === "Not Started";
            case "overdue": return assessment.status === "Overdue";
            default: return false;
          }
        });
        
        // School filter  
        const matchesSchool = schoolFilter.length === 0 || schoolFilter.includes(assessment.school.id);

        return matchesSearch && matchesCategory && matchesStatus && matchesSchool;
      });
    }
    return [];
  }, [isMatAdmin, termFilteredAssessments, searchTerm, categoryFilter, statusFilter, schoolFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredAssessments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAssessments = filteredAssessments.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, statusFilter, schoolFilter, selectedTerm]);
  
  // Calculate how many assessments are overdue or in-progress (based on term-filtered assessments)
  const overdueCount = useMemo(() => {
    return termFilteredAssessments.filter(a => a.status === "Overdue").length;
  }, [termFilteredAssessments]);
  
  const inProgressCount = useMemo(() => {
    return termFilteredAssessments.filter(a => a.status === "In Progress").length;
  }, [termFilteredAssessments]);
  
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

  const clearAllFilters = () => {
    setSearchTerm("");
    setCategoryFilter([]);
    setStatusFilter([]);
    setSchoolFilter([]);
  };
  
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
          <h1 className="text-3xl font-bold tracking-tight">My Assessments</h1>
          <div className="text-muted-foreground">
            {isLoading ? (
              <Skeleton className="h-4 w-64" />
            ) : (
              <p>You have {overdueCount} overdue and {inProgressCount} in-progress assessments.</p>
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
          onClearAll={clearAllFilters}
          filters={[
            {
              type: 'search',
              placeholder: 'Search assessments...',
              value: searchTerm,
              onChange: setSearchTerm
            },
            ...(uniqueSchools.length > 1 ? [{
              type: 'multiselect' as const,
              placeholder: 'Schools',
              value: schoolFilter,
              onChange: setSchoolFilter,
              options: schoolOptions
            }] : []),
            {
              type: 'multiselect' as const,
              placeholder: 'Strategies',
              value: categoryFilter,
              onChange: setCategoryFilter,
              options: categoryOptions
            },
            {
              type: 'multiselect' as const,
              placeholder: 'Status',
              value: statusFilter,
              onChange: setStatusFilter,
              options: statusOptions
            }
          ]}
        />

        {/* Assessment Table */}
        <Card className="border-slate-200">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="py-3">Assessment</TableHead>
                  <TableHead>School</TableHead>
                  <TableHead>Aspect</TableHead>
                  <TableHead>Completion Rate</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                        <p>No assessments found matching your filters.</p>
                        <Button 
                          variant="link" 
                          className="mt-2"
                          onClick={clearAllFilters}
                        >
                          Clear all filters
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedAssessments.map((assessment) => (
                    <TableRow key={assessment.id} className="group">
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span className="transition-colors">
                            {assessment.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Last updated: {assessment.lastUpdated !== "-" ? assessment.lastUpdated : "Never"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-50">
                            <SchoolIcon className="h-3.5 w-3.5 text-violet-500" />
                          </div>
                          <span>{assessment.school.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-slate-50 font-normal">
                          {getAspectDisplayName(assessment.category)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  "h-full", 
                                  assessment.status === "Completed" ? "bg-emerald-500" :
                                  assessment.status === "Overdue" ? "bg-rose-500" : "bg-indigo-500"
                                )}
                                style={{
                                  width: `${(assessment.completedStandards / assessment.totalStandards) * 100}%`,
                                }}
                              />
                            </div>
                            <span className="text-sm">
                              {assessment.completedStandards}/{assessment.totalStandards}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
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
                      <TableCell>
                        <Badge className={cn("gap-1 font-medium", getStatusColor(assessment.status))}>
                          {getStatusIcon(assessment.status)}
                          {assessment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {assessment.status === "Completed" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 group-hover:border-primary group-hover:text-primary transition-colors"
                            asChild
                          >
                            <Link to={`/assessments/${assessment.id}`}>
                              View
                              <ChevronRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        ) : (
                          <Button
                            variant={assessment.status === "Overdue" ? "default" : "outline"}
                            size="sm"
                            className={cn(
                              "gap-1",
                              assessment.status !== "Overdue" && "group-hover:border-primary group-hover:text-primary transition-colors"
                            )}
                            asChild
                          >
                            <Link to={`/assessments/${assessment.id}`}>
                              Continue
                              <ChevronRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
          {/* Modern Pagination Component */}
          {totalPages > 1 && (
            <div className="border-t bg-slate-50/50">
              <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center text-sm text-muted-foreground">
                  <span>
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredAssessments.length)} of{" "}
                    {filteredAssessments.length} results
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNumber = i + 1;
                      return (
                        <Button
                          key={pageNumber}
                          variant={currentPage === pageNumber ? "default" : "outline"}
                          size="sm"
                          className="w-9"
                          onClick={() => setCurrentPage(pageNumber)}
                        >
                          {pageNumber}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
} 