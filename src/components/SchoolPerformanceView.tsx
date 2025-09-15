import React, { useMemo, useState, useEffect, useTransition, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelect, type MultiSelectOption } from "@/components/ui/multi-select";
import { TermStepper } from "@/components/ui/term-stepper";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { AnimatedProgress } from "@/components/ui/animated-progress";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { SortableTableHead, type SortDirection } from "@/components/ui/sortable-table-head";
import type { Assessment, AssessmentCategory, SchoolPerformance, AcademicTerm, School } from "@/types/assessment";
import { cn } from "@/lib/utils";
import { 
  AlertTriangle, 
  CheckCircle2, 
  ChevronDown,
  ChevronRight, 
  Clock,
  School as SchoolIcon, 
  Eye,
  BookOpen,
  ClipboardCheck,
  Users,
  DollarSign,
  Building,
  Shield,
  Monitor,
  Settings,
  ArrowUp,
  ArrowDown,
  Loader2
} from "lucide-react";
import { AssessmentInvitationSheet } from "@/components/AssessmentInvitationSheet";
import { MiniTrendChart, type TrendDataPoint } from "@/components/ui/mini-trend-chart";
import { 
  SchoolPerformanceTableSkeleton, 
  FilterBarSkeleton, 
  TermNavigationSkeleton,
  InlineRefreshSkeleton 
} from "@/components/ui/skeleton-loaders";
import { getAspectDisplayName, calculateSchoolStatus, getStatusColor, getStatusIcon } from "@/lib/assessment-utils";
import { assessmentCategories } from "@/lib/mock-data";
import { FilterBar } from "@/components/ui/filter-bar";
import { getSchools } from "@/services/assessment-service";
import { useOptimisticFilter } from "@/hooks/use-optimistic-filter";
import { useInlineLoading } from "@/hooks/use-inline-loading";
import { useLocalStorage } from "@/hooks/use-local-storage";

type SchoolPerformanceViewProps = {
  assessments: Assessment[];
  refreshAssessments?: () => Promise<void>;
  isLoading?: boolean;
  isRefreshing?: boolean;
}

// Helper type for historical data
type HistoricalData = {
  term: string;
  overallScore: number;
  categoryScores: Map<AssessmentCategory, number>;
}

const TERM_STORAGE_KEY = "assurly_selected_term_mat_admin";

export function SchoolPerformanceView({ assessments, refreshAssessments, isLoading = false, isRefreshing = false }: SchoolPerformanceViewProps) {
  
  // Optimistic filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [criticalFilter, setCriticalFilter] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();
  
  // Individual filter states for optimistic updates
  const [filters, setFilters] = useState({
    performance: [] as string[],
    status: [] as string[],
    category: [] as string[],
    school: [] as string[]
  });
  const [optimisticFilters, setOptimisticFilters] = useState({
    performance: [] as string[],
    status: [] as string[],
    category: [] as string[],
    school: [] as string[]
  });
  const [invitationSheetOpen, setInvitationSheetOpen] = useState(false);
  const [expandedSchools, setExpandedSchools] = useState<Set<string>>(new Set());
  const [selectedTerm, setSelectedTerm] = useState<string>(() => {
    // Initialize from localStorage
    return localStorage.getItem(TERM_STORAGE_KEY) || "";
  });
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: SortDirection }>({
    key: "",
    direction: null
  });
  const [schools, setSchools] = useState<School[]>([]);
  const [schoolsLoading, setSchoolsLoading] = useState(true);
  const inlineLoading = useInlineLoading();

  // Fetch schools from API
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        setSchoolsLoading(true);
        const schoolsData = await getSchools();
        setSchools(schoolsData);
      } catch (error) {
        console.error('Failed to fetch schools:', error);
        setSchools([]);
      } finally {
        setSchoolsLoading(false);
      }
    };
    
    fetchSchools();
  }, []);

  // Get available terms from assessments
  const availableTerms = useMemo(() => {
    const termSet = new Set<string>();
    assessments.forEach(assessment => {
      if (assessment.term && assessment.academicYear) {
        termSet.add(`${assessment.term} ${assessment.academicYear}`);
      }
    });
    
    // Convert to array and sort chronologically (not alphabetically)
    const terms = Array.from(termSet).sort((a, b) => {
      const [termA, yearA] = a.split(" ");
      const [termB, yearB] = b.split(" ");
      
      // First compare academic years (convert 2023-2024 format to numbers)
      const yearNumA = parseInt(yearA.split("-")[0]);
      const yearNumB = parseInt(yearB.split("-")[0]);
      
      if (yearNumA !== yearNumB) {
        return yearNumB - yearNumA; // Newest year first
      }
      
      // If same year, sort by term with custom order: Autumn (newest), Summer, Spring
      const termOrder = { "Autumn": 0, "Summer": 1, "Spring": 2 };
      const termOrderA = termOrder[termA as keyof typeof termOrder] ?? 99;
      const termOrderB = termOrder[termB as keyof typeof termOrder] ?? 99;

      return termOrderA - termOrderB; // Smaller means newer within same year
    });
    
    // console.debug('Available terms (chronologically sorted):', terms);
    return terms;
  }, [assessments]);

  // Auto-select the first available term if none is selected or if saved term is no longer available
  useEffect(() => {
    if (availableTerms.length > 0) {
      if (!selectedTerm || !availableTerms.includes(selectedTerm)) {
        const firstTerm = availableTerms[0];
        // console.debug('Auto-selecting first available term:', firstTerm);
        setSelectedTerm(firstTerm);
        localStorage.setItem(TERM_STORAGE_KEY, firstTerm);
      }
    }
  }, [availableTerms, selectedTerm]);
  
  // Persist term selection
  const handleTermChange = (term: string) => {
    setSelectedTerm(term);
    localStorage.setItem(TERM_STORAGE_KEY, term);
  };

  // Filter assessments by selected term
  const filteredByTermAssessments = useMemo(() => {
    const [term, academicYear] = selectedTerm.split(" ");
    const filtered = assessments.filter(assessment => 
      assessment.term === term && assessment.academicYear === academicYear
    );
    // console.debug(`Filtered assessments for ${selectedTerm}:`, filtered);
    return filtered;
  }, [assessments, selectedTerm]);

  // Get historical data for the previous 3 terms
  const historicalTermsData = useMemo(() => {
    if (!selectedTerm) return new Map<string, HistoricalData[]>();

    const currentIndex = availableTerms.indexOf(selectedTerm);
    if (currentIndex === -1) return new Map<string, HistoricalData[]>();

    const schoolHistoricalData = new Map<string, HistoricalData[]>();

    // Get up to 3 previous terms
    const previousTermsToShow = 3;
    for (let i = 1; i <= previousTermsToShow && currentIndex + i < availableTerms.length; i++) {
      const historicalTermString = availableTerms[currentIndex + i];
      const [historicalTerm, historicalYear] = historicalTermString.split(" ");

      const historicalAssessments = assessments.filter(
        a => a.term === historicalTerm && a.academicYear === historicalYear
      );

      // Group by school and calculate scores
      historicalAssessments.forEach(assessment => {
        const schoolId = assessment.school.id;
        
        if (!schoolHistoricalData.has(schoolId)) {
          schoolHistoricalData.set(schoolId, []);
        }

        const schoolData = schoolHistoricalData.get(schoolId)!;
        
        // Check if we already have data for this term
        let termData = schoolData.find(d => d.term === historicalTermString);
        if (!termData) {
          termData = {
            term: historicalTermString,
            overallScore: 0,
            categoryScores: new Map()
          };
          schoolData.push(termData);
        }

        // Add category score if assessment is completed
        if (assessment.status === "Completed" && assessment.overallScore) {
          termData.categoryScores.set(assessment.category, assessment.overallScore);
        }
      });
    }

    // Calculate overall scores for each term
    schoolHistoricalData.forEach((schoolData) => {
      schoolData.forEach(termData => {
        if (termData.categoryScores.size > 0) {
          const scores = Array.from(termData.categoryScores.values());
          termData.overallScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        }
      });

      // Sort by term chronologically (newest first)
      schoolData.sort((a, b) => {
        const indexA = availableTerms.indexOf(a.term);
        const indexB = availableTerms.indexOf(b.term);
        return indexA - indexB;
      });
    });

    return schoolHistoricalData;
  }, [assessments, availableTerms, selectedTerm]);

  // Get previous term assessments based on next item in ordered list
  const previousTermAssessments = useMemo(() => {
    if (!selectedTerm) return [];

    const currentIndex = availableTerms.indexOf(selectedTerm);
    if (currentIndex === -1 || currentIndex === availableTerms.length - 1) {
      return [];
    }

    const prevTermString = availableTerms[currentIndex + 1];
    const [prevTerm, prevYear] = prevTermString.split(" ");

    // console.debug(`Current term "${selectedTerm}" → Previous term: "${prevTermString}"`);

    return assessments.filter(
      a => a.term === prevTerm && a.academicYear === prevYear
    );
  }, [assessments, availableTerms, selectedTerm]);

  // Calculate change indicators
  const calculateChange = (currentScore: number, previousScore: number | undefined) => {
    // Return null if no previous data or previous score is 0/undefined
    if (!previousScore || previousScore === 0 || currentScore === 0) return null;
    
    const change = currentScore - previousScore;
    const percentChange = Math.abs(change / previousScore) * 100;
    
    // Only show change if it's significant (more than 0.1 difference)
    if (Math.abs(change) < 0.1) {
      return null; // Don't show neutral changes
    } else if (change > 0) {
      return { 
        type: "positive" as const, 
        value: change, 
        percentChange,
        icon: <ArrowUp className="h-3 w-3 text-emerald-600" /> 
      };
    } else {
      return { 
        type: "negative" as const, 
        value: Math.abs(change), 
        percentChange,
        icon: <ArrowDown className="h-3 w-3 text-rose-600" /> 
      };
    }
  };

  // Helper function - define before usage to avoid temporal dead zone
  const getPerformanceTrend = (score: number, criticalCount: number) => {
    if (score >= 3.5 && criticalCount === 0) {
      return "Excellent";
    } else if (score >= 3.0 && criticalCount <= 1) {
      return "Strong";
    } else if (score >= 2.5 && criticalCount <= 3) {
      return "Good";
    } else if (score >= 2.0 && criticalCount <= 5) {
      return "Satisfactory";
    } else if (score >= 1.5) {
      return "Needs Attention";
    } else {
      return "Requires Intervention";
    }
  };

  // Create filter options for multi-select components
  const performanceOptions: MultiSelectOption[] = [
    { label: "Excellent", value: "excellent" },
    { label: "Good", value: "good" },
    { label: "Requires Improvement", value: "requires-improvement" },
    { label: "Inadequate", value: "inadequate" },
    { label: "No Data", value: "no-data" }
  ];

  const statusOptions: MultiSelectOption[] = [
    { label: "Completed", value: "completed" },
    { label: "In Progress", value: "in-progress" },
    { label: "Not Started", value: "not-started" },
    { label: "Overdue", value: "overdue" }
  ];

  const categoryOptions: MultiSelectOption[] = assessmentCategories.map(categoryInfo => ({
    label: getAspectDisplayName(categoryInfo.value),
    value: categoryInfo.value
  }));

  const uniqueSchools = [...new Set(filteredByTermAssessments.map(a => a.school.id))];
  const schoolOptions: MultiSelectOption[] = schools
    .map((school: School) => ({
      label: school.name,
      value: school.id
    }));

  // Optimistic filter update handlers
  const updateFilter = useCallback((filterType: keyof typeof filters, value: string[]) => {
    // Immediate optimistic update
    setOptimisticFilters(prev => ({ ...prev, [filterType]: value }));
    
    // Deferred actual update with transition
    startTransition(() => {
      setFilters(prev => ({ ...prev, [filterType]: value }));
    });
  }, []);

  const handlePerformanceFilterChange = (newValue: string[]) => {
    updateFilter('performance', newValue);
  };

  const handleStatusFilterChange = (newValue: string[]) => {
    updateFilter('status', newValue);
  };

  const handleCategoryFilterChange = (newValue: string[]) => {
    updateFilter('category', newValue);
  };

  const handleSchoolFilterChange = (newValue: string[]) => {
    updateFilter('school', newValue);
  };
  
  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setCriticalFilter(false);
    setOptimisticFilters({
      performance: [],
      status: [],
      category: [],
      school: []
    });
    startTransition(() => {
      setFilters({
        performance: [],
        status: [],
        category: [],
        school: []
      });
    });
  }, []);

  // Group assessments by school and calculate performance metrics
  const schoolPerformanceData = useMemo(() => {
    const schoolMap = new Map<string, SchoolPerformance & { previousOverallScore?: number; changesByCategory?: Map<string, any>; aspectsWithInterventionRequired?: Set<string> }>();

    // Process current term assessments
    filteredByTermAssessments.forEach(assessment => {
      const schoolId = assessment.school.id;
      
      if (!schoolMap.has(schoolId)) {
        schoolMap.set(schoolId, {
          school: assessment.school,
          overallScore: 0,
          status: "Not Started", // Will be calculated after all assessments are processed
          assessmentsByCategory: [],
          criticalStandardsTotal: 0,
          lastUpdated: assessment.lastUpdated,
          completedAssessments: 0,
          totalAssessments: 0,
          previousOverallScore: undefined,
          changesByCategory: new Map(),
          aspectsWithInterventionRequired: new Set()
        });
      }

      const schoolData = schoolMap.get(schoolId)!;
      schoolData.totalAssessments++;

      // Only process COMPLETED assessments for scoring and critical standards
      if (assessment.status === 'Completed') {
        schoolData.completedAssessments++;
        
        // Check if this aspect requires intervention (score <= 1.5 means it has 1-rated standards)
        if (assessment.overallScore && assessment.overallScore <= 1.5) {
          schoolData.aspectsWithInterventionRequired!.add(assessment.category);
        }
        
        schoolData.overallScore += assessment.overallScore || 0;
        
        // Update last updated if this assessment is more recent
        if (assessment.lastUpdated && assessment.lastUpdated > schoolData.lastUpdated) {
          schoolData.lastUpdated = assessment.lastUpdated;
        }
      }

      // Add to assessments by category (for all assessments, not just completed)
      schoolData.assessmentsByCategory.push({
        category: assessment.category,
        name: assessment.name,
        status: assessment.status,
        completedStandards: assessment.completedStandards,
        totalStandards: assessment.totalStandards,
        overallScore: assessment.overallScore || 0,
        lastUpdated: assessment.lastUpdated,
        dueDate: assessment.dueDate,
        assignedTo: assessment.assignedTo,
        id: assessment.id
      });
    });

    // Calculate previous term scores for each school
    previousTermAssessments.forEach(assessment => {
      const schoolId = assessment.school.id;
      const schoolData = schoolMap.get(schoolId);
      
      if (schoolData && assessment.status === 'Completed' && assessment.overallScore) {
        // Initialize previous score tracking if needed
        if (!schoolData.previousOverallScore) {
          schoolData.previousOverallScore = 0;
          schoolData.changesByCategory = new Map();
        }
        
        // Add to previous overall score sum
        schoolData.previousOverallScore += assessment.overallScore;
        
        // Track previous score by category
        schoolData.changesByCategory!.set(assessment.category, assessment.overallScore);
      }
    });

    // Calculate average scores for schools (only from completed assessments)
    schoolMap.forEach((schoolData, schoolId) => {
      if (schoolData.completedAssessments > 0) {
        schoolData.overallScore = schoolData.overallScore / schoolData.completedAssessments;
      }
      
      // Calculate average previous overall score
      if (schoolData.previousOverallScore && schoolData.previousOverallScore > 0) {
        const prevCompletedCount = previousTermAssessments.filter(
          a => a.school.id === schoolId && a.status === 'Completed'
        ).length;
        if (prevCompletedCount > 0) {
          schoolData.previousOverallScore = schoolData.previousOverallScore / prevCompletedCount;
        }
      }
      
      // Set the intervention required count to the number of aspects that need intervention
      schoolData.criticalStandardsTotal = schoolData.aspectsWithInterventionRequired!.size;
      
      // Calculate school-level status based on individual assessment statuses
      schoolData.status = calculateSchoolStatus(schoolData.assessmentsByCategory);
    });

    return Array.from(schoolMap.values());
  }, [filteredByTermAssessments, previousTermAssessments]);

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key ? 
        (prev.direction === "asc" ? "desc" : prev.direction === "desc" ? null : "asc") :
        "asc"
    }));
  };

  const filteredSchoolData = useMemo(() => {
    // Use optimistic filters when pending, otherwise use actual filters
    const activeFilters = isPending ? optimisticFilters : filters;
    
    let filtered = schoolPerformanceData.filter(school => {
      const matchesSearch = searchTerm === "" ||
        school.school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (school.school.code && school.school.code.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesPerformance = activeFilters.performance.length === 0 || activeFilters.performance.some(filter => {
        switch (filter) {
          case "excellent": return school.overallScore >= 3.5;
          case "good": return school.overallScore >= 2.5 && school.overallScore < 3.5;
          case "requires-improvement": return school.overallScore >= 1.5 && school.overallScore < 2.5;
          case "inadequate": return school.overallScore < 1.5 && school.overallScore > 0;
          case "no-data": return school.overallScore === 0;
          default: return false;
        }
      });

      const matchesStatus = activeFilters.status.length === 0 || activeFilters.status.some(status => {
        return school.assessmentsByCategory.some(cat => {
          switch (status) {
            case "completed": return cat.status === "Completed";
            case "in-progress": return cat.status === "In Progress";
            case "not-started": return cat.status === "Not Started";
            case "overdue": return cat.status === "Overdue";
            default: return false;
          }
        });
      });

      const matchesCategory = activeFilters.category.length === 0 || activeFilters.category.some(category => {
        return school.assessmentsByCategory.some(cat => cat.category === category);
      });

      const matchesSchool = activeFilters.school.length === 0 || activeFilters.school.includes(school.school.id);
      
      const matchesCritical = !criticalFilter || school.criticalStandardsTotal > 0;

      return matchesSearch && matchesPerformance && matchesStatus && matchesCategory && matchesSchool && matchesCritical;
    });

    // Apply sorting
    if (sortConfig.key && sortConfig.direction) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortConfig.key) {
          case "school":
            aValue = a.school.name;
            bValue = b.school.name;
            break;
          case "assessments":
            const aCompleted = a.assessmentsByCategory.filter(cat => cat.status === "Completed").length;
            const bCompleted = b.assessmentsByCategory.filter(cat => cat.status === "Completed").length;
            const aTotal = a.assessmentsByCategory.length;
            const bTotal = b.assessmentsByCategory.length;
            aValue = aTotal > 0 ? (aCompleted / aTotal) : 0;
            bValue = bTotal > 0 ? (bCompleted / bTotal) : 0;
            break;
          case "overallScore":
            aValue = a.overallScore;
            bValue = b.overallScore;
            break;
          case "criticalStandards":
            aValue = a.criticalStandardsTotal;
            bValue = b.criticalStandardsTotal;
            break;
          case "lastUpdated":
            aValue = Math.max(...a.assessmentsByCategory.map(cat => new Date(cat.lastUpdated || '').getTime() || 0));
            bValue = Math.max(...b.assessmentsByCategory.map(cat => new Date(cat.lastUpdated || '').getTime() || 0));
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
  }, [schoolPerformanceData, searchTerm, filters, optimisticFilters, isPending, criticalFilter, sortConfig]);

  // Clear all filters
  const clearAllFilters = clearFilters;

  const getCategoryIcon = (category: string) => {
    // Handle both lowercase keys and display names
    const normalizedCategory = category.toLowerCase();
    
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
        return <ClipboardCheck className="h-4 w-4" />;
    }
  };


  const getScoreBadgeColor = (score: number) => {
    if (score >= 3.5) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (score >= 2.5) return "bg-indigo-50 text-indigo-700 border-indigo-200";
    if (score >= 1.5) return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-rose-50 text-rose-700 border-rose-200";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "In Progress":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "Not Started":
        return "bg-slate-50 text-slate-700 border-slate-200";
      case "Overdue":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const toggleSchoolExpansion = async (schoolId: string) => {
    await inlineLoading.withLoading(`expand-${schoolId}`, async () => {
      const newExpanded = new Set(expandedSchools);
      if (newExpanded.has(schoolId)) {
        newExpanded.delete(schoolId);
      } else {
        newExpanded.add(schoolId);
      }
      setExpandedSchools(newExpanded);
      // Simulate loading delay for smooth animation
      await new Promise(resolve => setTimeout(resolve, 200));
    });
  };




  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">School Performance Dashboard</h2>
            <p className="text-muted-foreground">
              Monitor assessment progress and performance across all schools in your trust
            </p>
          </div>
          <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-3">
            {isLoading ? (
              <TermNavigationSkeleton />
            ) : (
              <TermStepper
                terms={availableTerms}
                currentTerm={selectedTerm}
                onTermChange={handleTermChange}
                className="w-full md:w-auto"
              />
            )}
            <Button 
              onClick={() => setInvitationSheetOpen(true)}
              className="w-full md:w-auto"
              disabled={isLoading}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Request Rating
            </Button>
          </div>
        </div>

        {/* Enhanced Filters */}
        {isLoading ? (
          <FilterBarSkeleton />
        ) : (
          <FilterBar
            title="Filters"
            layout="mat-admin"
            onClearAll={clearAllFilters}
            isFiltering={isPending}
            filters={[
            {
              type: 'search',
              placeholder: 'Search schools...',
              value: searchTerm,
              onChange: setSearchTerm
            },
            {
              type: 'multiselect',
              placeholder: 'Schools',
              value: optimisticFilters.school,
              onChange: handleSchoolFilterChange,
              options: schoolOptions
            },
            {
              type: 'multiselect',
              placeholder: 'Performance',
              value: optimisticFilters.performance,
              onChange: handlePerformanceFilterChange,
              options: performanceOptions
            },
            {
              type: 'multiselect',
              placeholder: 'Status', 
              value: optimisticFilters.status,
              onChange: handleStatusFilterChange,
              options: statusOptions
            },
            {
              type: 'multiselect',
              placeholder: 'Aspect',
              value: optimisticFilters.category,
              onChange: handleCategoryFilterChange,
              options: categoryOptions
            },
            {
              type: 'checkbox',
              label: 'Intervention Required Only',
              value: criticalFilter,
              onChange: setCriticalFilter,
              id: 'critical-filter'
            }
          ]}
        />
        )}

      {/* Schools Table */}
      <Card className="relative">
        {/* Loading overlay when refreshing */}
        {isRefreshing && !isLoading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border">
              <Loader2 className="h-4 w-4 animate-spin text-slate-600" />
              <span className="text-sm text-slate-600">Updating assessments...</span>
            </div>
          </div>
        )}
        
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <SchoolIcon className="h-5 w-5" />
            <span>School Assessment Overview</span>
          </CardTitle>
          <CardDescription>
            Click on a school to view detailed assessment breakdowns by category
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80 border-b border-slate-200">
                    <TableHead className="w-12"></TableHead>
                    <TableHead>SCHOOL</TableHead>
                    <TableHead className="text-center">SUBMITTED RATINGS</TableHead>
                    <TableHead className="text-center">OVERALL SCORE</TableHead>
                    <TableHead className="text-center">PREVIOUS 3 TERMS</TableHead>
                    <TableHead className="text-center">INTERVENTION REQ</TableHead>
                    <TableHead className="text-center">LAST UPDATED</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <SchoolPerformanceTableSkeleton />
                </TableBody>
              </Table>
            </div>
          ) : filteredSchoolData.length === 0 ? (
            <div className="text-center py-12">
              <SchoolIcon className="mx-auto h-12 w-12 text-slate-400" />
              <h3 className="mt-4 text-sm font-medium text-slate-900">No schools found</h3>
              <p className="mt-2 text-sm text-slate-500">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 border-b border-slate-200">
                  <TableHead className="w-12"></TableHead>
                  <SortableTableHead 
                    sortKey="school"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    className="text-left"
                  >
                    SCHOOL
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
                    sortKey="overallScore"
                    currentSort={sortConfig}
                    onSort={handleSort}
                  >
                    CURRENT SCORE
                  </SortableTableHead>
                  <TableHead className="text-center">PREVIOUS 3 TERMS</TableHead>
                  <SortableTableHead 
                    className="text-center"
                    sortKey="criticalStandards"
                    currentSort={sortConfig}
                    onSort={handleSort}
                  >
                    INTERVENTION REQUIRED
                  </SortableTableHead>
                  <SortableTableHead 
                    className="text-center"
                    sortKey="assessments"
                    currentSort={sortConfig}
                    onSort={handleSort}
                  >
                    COMPLETION RATE
                  </SortableTableHead>
                  <SortableTableHead 
                    className="text-center"
                    sortKey="lastUpdated"
                    currentSort={sortConfig}
                    onSort={handleSort}
                  >
                    LAST UPDATED
                  </SortableTableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSchoolData.map((school, index) => {
                const isExpanded = expandedSchools.has(school.school.id);
                const completedCount = school.assessmentsByCategory.filter(cat => cat.status === "Completed").length;
                const totalCount = school.assessmentsByCategory.length;

                return (
                  <React.Fragment key={school.school.id}>
                    <TableRow 
                      className="cursor-pointer hover:bg-slate-50 transition-colors duration-200 animate-in fade-in-0 slide-in-from-bottom-1"
                      style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'both' }}
                      onClick={() => toggleSchoolExpansion(school.school.id)}
                    >
                      <TableCell className="w-12 px-2">
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 mx-auto">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 border border-slate-200 flex-shrink-0">
                            <SchoolIcon className="h-4 w-4 text-slate-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-slate-900 leading-tight">{school.school.name}</p>
                            {school.school.code && (
                              <p className="text-xs text-slate-500 mt-0.5">{school.school.code}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={getStatusColor(school.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(school.status)}
                            <span className="text-xs font-medium">{school.status}</span>
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {school.overallScore > 0 ? (
                          <div className="flex items-center justify-center space-x-1">
                          <Badge variant="outline" className={getScoreBadgeColor(school.overallScore)}>
                            <AnimatedNumber value={school.overallScore} delay={index * 80 + 300} />
                          </Badge>
                              {/* More compact change indicator */}
                              {(() => {
                              const change = calculateChange(school.overallScore, school.previousOverallScore);
                              if (!change) return null;
                              return (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className={cn(
                                        "flex items-center px-1 py-0.5 rounded text-xs font-medium",
                                        change.type === "positive" && "bg-emerald-50 text-emerald-600",
                                        change.type === "negative" && "bg-rose-50 text-rose-600"
                                    )}>
                                      {change.icon}
                                        <span className="text-xs">{Math.abs(change.value).toFixed(1)}</span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>
                                        {change.type === "positive" ? "Improved" : "Declined"} from previous term
                                        ({Math.abs(change.value).toFixed(1)} points)
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              );
                            })()}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {(() => {
                          const historicalData = historicalTermsData.get(school.school.id) || [];
                          if (historicalData.length === 0) {
                            return <span className="text-sm text-slate-400">—</span>;
                          }
                          
                          // Prepare trend data for previous 3 terms only (chronological order: oldest to newest)
                          // Take the most recent 3 terms and reverse to show oldest first
                          const trendData: TrendDataPoint[] = historicalData.slice(0, 3).reverse().filter(d => d.overallScore > 0);
                          
                          if (trendData.length < 2) {
                            return <span className="text-sm text-slate-400">—</span>;
                          }
                          
                          // For better clarity, show values directly with trend indicator
                          return (
                            <div className="flex items-center justify-center gap-1">
                              <MiniTrendChart data={trendData} width={80} height={28} />
                              <div className="flex items-center gap-0.5 text-xs">
                                {trendData[trendData.length - 1].overallScore > trendData[0].overallScore ? (
                                  <ArrowUp className="h-3 w-3 text-emerald-600" />
                                ) : trendData[trendData.length - 1].overallScore < trendData[0].overallScore ? (
                                  <ArrowDown className="h-3 w-3 text-rose-600" />
                                ) : (
                                  <span className="text-slate-400">—</span>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="text-center">
                        {school.criticalStandardsTotal > 0 ? (
                          <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">
                            {school.criticalStandardsTotal}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                            0
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-sm font-semibold text-slate-700 tabular-nums">{completedCount}/{totalCount}</span>
                          <AnimatedProgress value={(completedCount / totalCount) * 100} className="w-16 h-2" delay={index * 80 + 200} />
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-sm text-slate-600">
                        {school.lastUpdated !== "-" ? new Date(school.lastUpdated).toLocaleDateString() : "—"}
                      </TableCell>
                    </TableRow>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={8} className="bg-slate-50 p-0">
                          <div className="p-6 border-t">
                            <h4 className="text-sm font-medium text-slate-900 mb-4">Assessment Strategies</h4>
                            <div className="bg-white rounded-lg border">
                              <Table>
                                <TableHeader>
                                  <TableRow className="bg-slate-50/80 border-b border-slate-200">
                                    <TableHead>ASPECT</TableHead>
                                    <TableHead className="text-center">STATUS</TableHead>
                                    <TableHead className="text-center">CURRENT SCORE</TableHead>
                                    <TableHead className="text-center">PREVIOUS 3 TERMS</TableHead>
                                    <TableHead className="text-center">INTERVENTION REQUIRED</TableHead>
                                    <TableHead className="text-center">COMPLETION RATE</TableHead>
                                    <TableHead className="text-center pr-6">ACTIONS</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {school.assessmentsByCategory.map((categoryData, catIndex) => {
                                    return (
                                      <React.Fragment key={categoryData.category}>
                                        <TableRow 
                                          className="hover:bg-slate-50 transition-colors duration-200 animate-in fade-in-0 slide-in-from-left-2"
                                          style={{ animationDelay: `${catIndex * 60}ms`, animationFillMode: 'both' }}>
                                      <TableCell>
                                        <div className="flex items-center gap-3">
                                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 border border-slate-200 flex-shrink-0">
                                            {getCategoryIcon(categoryData.category)}
                                          </div>
                                          <div className="min-w-0">
                                            <p className="font-medium text-sm text-slate-900 leading-tight">{getAspectDisplayName(categoryData.category)}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                              {categoryData.assignedTo?.[0]?.name || "Unassigned"}
                                            </p>
                                          </div>
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-center">
                                        <Badge 
                                          variant="outline" 
                                          className={cn("text-xs font-medium", getStatusColor(categoryData.status))}
                                        >
                                          {categoryData.status}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-center">
                                        {categoryData.overallScore > 0 ? (
                                              <div className="flex items-center justify-center space-x-1">
                                          <Badge variant="outline" className={getScoreBadgeColor(categoryData.overallScore)}>
                                            {categoryData.overallScore.toFixed(1)}
                                          </Badge>
                                                {/* Category change indicator */}
                                                {school.changesByCategory && school.changesByCategory.has(categoryData.category) && (() => {
                                                  const previousScore = school.changesByCategory.get(categoryData.category);
                                                  if (!previousScore || previousScore === 0) return null;
                                                  const change = calculateChange(categoryData.overallScore, previousScore);
                                                  if (!change) return null;
                                                  return (
                                                    <Tooltip>
                                                      <TooltipTrigger asChild>
                                                        <div className={cn(
                                                          "flex items-center space-x-1 px-1 py-0.5 rounded text-xs font-medium",
                                                          change.type === "positive" && "bg-emerald-50 text-emerald-700",
                                                          change.type === "negative" && "bg-rose-50 text-rose-700"
                                                        )}>
                                                          {change.icon}
                                                            <span className="text-xs">{change.value.toFixed(1)}</span>
                                                        </div>
                                                      </TooltipTrigger>
                                                      <TooltipContent>
                                                        <p>
                                                          {change.type === "positive" ? "Improved" : "Declined"} from previous term
                                                          ({change.value.toFixed(1)} points)
                                                        </p>
                                                      </TooltipContent>
                                                    </Tooltip>
                                                  );
                                                })()}
                                              </div>
                                            ) : (
                                          <span className="text-slate-400 text-sm">—</span>
                                        )}
                                      </TableCell>
                                      <TableCell className="text-center">
                                        {(() => {
                                          const historicalData = historicalTermsData.get(school.school.id) || [];
                                          const categoryHistoricalData = historicalData
                                            .map(termData => ({
                                              term: termData.term,
                                              overallScore: termData.categoryScores.get(categoryData.category) || 0
                                            }))
                                            .filter(d => d.overallScore > 0);
                                          
                                          if (categoryHistoricalData.length === 0) {
                                            return <span className="text-sm text-slate-400">—</span>;
                                          }
                                          
                                          // Prepare trend data for previous 3 terms only (chronological order: oldest to newest)
                                          // Take the most recent 3 terms and reverse to show oldest first
                                          const trendData: TrendDataPoint[] = categoryHistoricalData.slice(0, 3).reverse().filter(d => d.overallScore > 0);
                                          
                                          if (trendData.length < 2) {
                                            return <span className="text-sm text-slate-400">—</span>;
                                          }
                                          
                                          // Simple value sequence with mini chart
                                          return (
                                            <div className="flex items-center justify-center">
                                              <MiniTrendChart data={trendData} width={80} height={24} />
                                            </div>
                                          );
                                        })()}
                                      </TableCell>
                                      <TableCell className="text-center">
                                        {categoryData.overallScore && categoryData.overallScore <= 1.5 && categoryData.status === 'Completed' ? (
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Badge 
                                                variant="outline" 
                                                className="bg-rose-50 text-rose-700 border-rose-200 cursor-help"
                                              >
                                                <AlertTriangle className="h-3 w-3 mr-1" />
                                                Yes
                                              </Badge>
                                            </TooltipTrigger>
                                            <TooltipContent side="top" align="center" className="max-w-xs">
                                              <div className="space-y-2">
                                                <p className="font-medium text-sm">Intervention Required</p>
                                                <p className="text-xs leading-relaxed">
                                                  This aspect has an overall score of {categoryData.overallScore.toFixed(1)}, indicating that one or more standards are rated as inadequate and require immediate attention.
                                                </p>
                                              </div>
                                            </TooltipContent>
                                          </Tooltip>
                                        ) : (
                                          <span className="text-slate-400 text-sm">—</span>
                                        )}
                                      </TableCell>
                                      <TableCell className="text-center">
                                        <div className="flex items-center justify-center gap-2">
                                          <span className="text-sm font-semibold text-slate-700 tabular-nums">
                                            {categoryData.completedStandards}/{categoryData.totalStandards}
                                          </span>
                                          <AnimatedProgress 
                                            value={(categoryData.completedStandards / categoryData.totalStandards) * 100} 
                                            className="w-14 h-2"
                                            delay={catIndex * 60 + 200}
                                          />
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-center pr-6">
                                        <Button 
                                          asChild 
                                          variant="outline" 
                                          size="sm" 
                                          className="h-8 px-3"
                                        >
                                          <Link to={`/assessments/${categoryData.id}?view=admin`}>
                                            <Eye className="mr-1.5 h-3.5 w-3.5" />
                                            View
                                          </Link>
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                      </React.Fragment>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
                })}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>

      {/* Assessment Invitation Sheet */}
      <AssessmentInvitationSheet 
        open={invitationSheetOpen} 
        onOpenChange={setInvitationSheetOpen} 
        onSuccess={refreshAssessments}
      />

        {/* Performance Zones Legend */}
        <div className="mt-6 py-3 border-t border-slate-200">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <span className="text-xs text-slate-500 font-medium">Performance Zones:</span>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-2 bg-emerald-500 rounded-sm opacity-60"></div>
              <span className="text-xs text-slate-600">
                <span className="font-medium text-emerald-700">Outstanding</span> (3.5-4.0)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-2 bg-indigo-500 rounded-sm opacity-60"></div>
              <span className="text-xs text-slate-600">
                <span className="font-medium text-indigo-700">Good</span> (2.5-3.4)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-2 bg-amber-500 rounded-sm opacity-60"></div>
              <span className="text-xs text-slate-600">
                <span className="font-medium text-amber-700">Requires Improvement</span> (1.5-2.4)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-2 bg-red-500 rounded-sm opacity-60"></div>
              <span className="text-xs text-slate-600">
                <span className="font-medium text-red-700">Inadequate</span> (1.0-1.4)
              </span>
            </div>
          </div>
        </div>
    </div>
    </TooltipProvider>
  );
} 