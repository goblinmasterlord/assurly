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
import type { SchoolsDashboardResponse, SchoolDashboardItem } from "@/types/dashboard";
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
import { EnhancedTrendChart, type TrendDataPoint } from "@/components/ui/enhanced-trend-chart";
import { 
  SchoolPerformanceTableSkeleton, 
  FilterBarSkeleton, 
  TermNavigationSkeleton,
  InlineRefreshSkeleton 
} from "@/components/ui/skeleton-loaders";
import { getAspectDisplayName, calculateSchoolStatus, getStatusColor, getStatusIcon } from "@/lib/assessment-utils";
import { getStatusLabel } from "@/utils/assessment";
import { FilterBar } from "@/components/ui/filter-bar";
import { getSchools, getAspects } from "@/services/assessment-service";
import { getSchoolsDashboard } from "@/services/dashboard-service";
import { assessmentService } from "@/services/enhanced-assessment-service";
import type { Aspect } from "@/types/assessment";
import type { AssessmentByAspect, Rating, AssessmentStatus } from "@/types/assessment";
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

// NOTE: MAT admin dashboard should default to the latest term each time the
// assessments list refreshes, to keep the view pinned to "latest" by default.

const TERM_NAME_TO_ID: Record<string, string> = {
  Autumn: "T1",
  Spring: "T2",
  Summer: "T3",
};

function compressAcademicYear(year: string): string {
  // Accept either short (2025-26) or long (2025-2026)
  if (/^\d{4}-\d{2}$/.test(year)) return year;
  const match = year.match(/^(\d{4})-(\d{4})$/);
  if (!match) return year;
  return `${match[1]}-${match[2].slice(-2)}`;
}

function termLabelToUniqueTermId(termLabel: string): string | undefined {
  // UI stores terms like: "Autumn 2025-2026"
  if (!termLabel) return undefined;
  const [termName, academicYearLong] = termLabel.split(" ");
  if (!termName || !academicYearLong) return undefined;
  const termId = TERM_NAME_TO_ID[termName];
  if (!termId) return undefined;
  const academicYear = compressAcademicYear(academicYearLong);
  return `${termId}-${academicYear}`;
}

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
  const [selectedTerm, setSelectedTerm] = useState<string>("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: SortDirection }>({
    key: "",
    direction: null
  });
  const [schools, setSchools] = useState<School[]>([]);
  const [schoolsLoading, setSchoolsLoading] = useState(true);
  const [aspects, setAspects] = useState<Aspect[]>([]);
  const [aspectsLoading, setAspectsLoading] = useState(true);
  const [schoolsDashboard, setSchoolsDashboard] = useState<SchoolsDashboardResponse | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const inlineLoading = useInlineLoading();
  const isPrimaryLoading = isLoading || (dashboardLoading && !schoolsDashboard);
  const isUpdating = isRefreshing || (dashboardLoading && !!schoolsDashboard);

  type AspectRowMetrics = {
    status: Extract<AssessmentStatus, "not_started" | "in_progress" | "completed">;
    current_score: number | null;
    previous_terms: Array<{ term_id: string; academic_year: string; avg_score: number | null }>;
    intervention_required: number;
    completed_standards: number;
    total_standards: number;
    last_updated: string | null;
  };

  const [aspectRowMetrics, setAspectRowMetrics] = useState<Record<string, AspectRowMetrics>>({});

  const formatStatus = useCallback((status: string): string => {
    // Accept DB formats: not_started / in_progress / completed
    // Accept UI formats: Not Started / In Progress / Completed
    const normalized = status
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "_")
      .replace(/-/g, "_");

    return getStatusLabel(normalized as any);
  }, []);

  // Fetch schools and aspects from API
  useEffect(() => {
    const fetchData = async () => {
      // Fetch schools
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

      // Fetch aspects (MAT-specific)
      try {
        setAspectsLoading(true);
        const aspectsData = await getAspects();
        setAspects(aspectsData);
      } catch (error) {
        console.error('Failed to fetch aspects:', error);
        setAspects([]);
      } finally {
        setAspectsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Fetch schools dashboard summary (bulk dashboard endpoint)
  const selectedUniqueTermId = useMemo(() => termLabelToUniqueTermId(selectedTerm), [selectedTerm]);

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      setDashboardLoading(true);
      setDashboardError(null);
      try {
        const data = await getSchoolsDashboard(selectedUniqueTermId);
        if (!cancelled) setSchoolsDashboard(data);
      } catch (err: any) {
        console.error("Failed to load schools dashboard:", err);
        const message = err?.userMessage || err?.message || "Failed to load dashboard data";
        if (!cancelled) setDashboardError(message);
      } finally {
        if (!cancelled) setDashboardLoading(false);
      }
    };

    loadDashboard();
    return () => {
      cancelled = true;
    };
  }, [selectedUniqueTermId]);

  const dashboardBySchoolId = useMemo(() => {
    const entries = schoolsDashboard?.schools?.map((s) => [s.school_id, s] as const) ?? [];
    return new Map<string, SchoolDashboardItem>(entries);
  }, [schoolsDashboard]);

  const computeAvgScore = useCallback((data: AssessmentByAspect): number | null => {
    const rated = data.standards.filter(s => s.rating !== null) as Array<{ rating: Exclude<Rating, null> }>;
    if (rated.length === 0) return null;
    const sum = rated.reduce((acc, s) => acc + (s.rating || 0), 0);
    return Math.round((sum / rated.length) * 10) / 10;
  }, []);

  const computeInterventionRequired = useCallback((data: AssessmentByAspect): number => {
    return data.standards.reduce((acc, s) => {
      const r = s.rating;
      return acc + (r === 1 || r === 2 ? 1 : 0);
    }, 0);
  }, []);

  const computeLastUpdated = useCallback((data: AssessmentByAspect): string | null => {
    const latest = data.standards
      .map(s => s.last_updated)
      .filter((d): d is string => typeof d === 'string' && d.length > 0)
      .sort((a, b) => (new Date(b).getTime() || 0) - (new Date(a).getTime() || 0))[0];
    return latest || null;
  }, []);

  // Get available terms from assessments
  const availableTerms = useMemo(() => {
    const termSet = new Set<string>();
    assessments.forEach(assessment => {
      if (assessment.term && assessment.academicYear) {
        termSet.add(`${assessment.term} ${assessment.academicYear}`);
      }
    });
    
    // Convert to array and sort chronologically (newest first)
    // Academic year order: Autumn (Sep-Dec) → Spring (Jan-Apr) → Summer (May-Aug)
    // So within each year: Autumn T1, Spring T2, Summer T3
    // But we want newest terms first overall
    const terms = Array.from(termSet).sort((a, b) => {
      const [termA, yearA] = a.split(" ");
      const [termB, yearB] = b.split(" ");
      
      // First compare academic years (2025-2026 vs 2024-2025)
      const yearNumA = parseInt(yearA.split("-")[0]);
      const yearNumB = parseInt(yearB.split("-")[0]);
      
      if (yearNumA !== yearNumB) {
        return yearNumB - yearNumA; // Newest year first
      }
      
      // Same academic year - sort by term chronologically within the year
      // Autumn (Sept) = 1, Spring (Jan) = 2, Summer (May) = 3
      // Within same year, Summer is most recent
      const termOrder = { "Autumn": 1, "Spring": 2, "Summer": 3 };
      const termOrderA = termOrder[termA as keyof typeof termOrder] ?? 99;
      const termOrderB = termOrder[termB as keyof typeof termOrder] ?? 99;

      return termOrderB - termOrderA; // Higher = more recent within year
    });
    
    return terms;
  }, [assessments]);

  // Always keep selection on the latest term when the term set refreshes.
  // Users can still change the dropdown, but any data refresh that changes the
  // available term list will snap back to the latest.
  useEffect(() => {
    if (availableTerms.length > 0) {
      const firstTerm = availableTerms[0];
      if (selectedTerm !== firstTerm) setSelectedTerm(firstTerm);
    }
  }, [availableTerms]);
  
  // Term selection (dropdown)
  const handleTermChange = (term: string) => {
    setSelectedTerm(term);
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
        const schoolId = assessment.school_id;
        
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
        if (assessment.status === "completed" && assessment.overallScore) {
          termData.categoryScores.set(assessment.category!, assessment.overallScore);
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
      return "Requires Attention";
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

  // Create filter options for multi-select components - USE MAT-SPECIFIC ASPECTS
  // Map aspect codes to category names for filtering compatibility with assessment.category
  const categoryOptions: MultiSelectOption[] = aspects.map(aspect => {
    // Map aspect_code to legacy category format (EDU -> education, HR -> hr, etc.)
    const aspectCode = aspect.aspect_code.toUpperCase();
    const categoryMap: Record<string, string> = {
      'EDU': 'education',
      'HR': 'hr',
      'FIN': 'finance',
      'EST': 'estates',
      'GOV': 'governance',
      'IT': 'it',
      'IS': 'is',
    };
    const categoryValue = categoryMap[aspectCode] || aspectCode.toLowerCase();
    
    return {
      label: aspect.aspect_name,
      value: categoryValue
    };
  });

  const uniqueSchools = [...new Set(filteredByTermAssessments.map(a => a.school?.id).filter(Boolean))];

  // Map "category value" (e.g. education/hr/ld) to aspect metadata (name/category).
  const categoryValueToAspect = useMemo(() => {
    const categoryMap: Record<string, string> = {
      EDU: "education",
      HR: "hr",
      FIN: "finance",
      EST: "estates",
      GOV: "governance",
      IT: "it",
      IS: "is",
    };

    const map = new Map<string, Aspect>();
    aspects.forEach((aspect) => {
      const aspectCode = aspect.aspect_code.toUpperCase();
      const categoryValue = (categoryMap[aspectCode] || aspectCode.toLowerCase()).toLowerCase();
      map.set(categoryValue, aspect);
    });
    return map;
  }, [aspects]);

  const formatAspectCategory = useCallback((category?: string) => {
    if (!category) return "—";
    const normalized = category.replace(/_/g, " ").toLowerCase();
    return normalized
      .split(" ")
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }, []);
  const schoolOptions: MultiSelectOption[] = schools
    .filter(school => school.name && school.id)
    .map((school: School) => ({
      label: school.name!,
      value: school.id!
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

  // Group assessments by school and calculate performance metrics (detail/expansion uses grouped assessments)
  const schoolPerformanceFromAssessments = useMemo(() => {
    const schoolMap = new Map<string, SchoolPerformance & { previousOverallScore?: number; changesByCategory?: Map<string, any>; aspectsWithInterventionRequired?: Set<string> }>();

    // Process current term assessments
    filteredByTermAssessments.forEach(assessment => {
      const schoolId = assessment.school_id;
      
      if (!schoolMap.has(schoolId)) {
        schoolMap.set(schoolId, {
          school: assessment.school || { school_id: assessment.school_id, school_name: assessment.school_name, id: assessment.school_id, name: assessment.school_name },
          overallScore: 0,
          status: "not_started", // Will be calculated after all assessments are processed
          assessmentsByCategory: [],
          criticalStandardsTotal: 0,
          lastUpdated: assessment.last_updated || assessment.lastUpdated || '',
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
      if (assessment.status === 'completed') {
        schoolData.completedAssessments++;
        
        schoolData.overallScore += assessment.overallScore || 0;
        
        // Update last updated if this assessment is more recent
        if (assessment.lastUpdated && assessment.lastUpdated > schoolData.lastUpdated) {
          schoolData.lastUpdated = assessment.lastUpdated;
        }
      }

      // Check if this aspect requires intervention (for both completed AND in-progress assessments)
      // Score <= 1.5 means it has 1-rated standards that need attention
      if ((assessment.status === 'completed' || assessment.status === 'in_progress') && 
          assessment.overallScore && assessment.overallScore <= 1.5) {
        schoolData.aspectsWithInterventionRequired!.add(assessment.category!);
      }

      // Add to assessments by category (for all assessments, not just completed)
      schoolData.assessmentsByCategory.push({
        category: assessment.category!,
        name: assessment.name!,
        status: assessment.status,
        completedStandards: assessment.completedStandards || 0,
        totalStandards: assessment.totalStandards || 0,
        overallScore: assessment.overallScore || 0,
        lastUpdated: assessment.last_updated || assessment.lastUpdated || '',
        dueDate: assessment.due_date || undefined,
        assignedTo: undefined,
        id: assessment.id!
      });
    });

    // Calculate previous term scores for each school
    previousTermAssessments.forEach(assessment => {
      const schoolId = assessment.school_id;
      const schoolData = schoolMap.get(schoolId);
      
      if (schoolData && assessment.status === 'completed' && assessment.overallScore) {
        // Initialize previous score tracking if needed
        if (!schoolData.previousOverallScore) {
          schoolData.previousOverallScore = 0;
          schoolData.changesByCategory = new Map();
        }
        
        // Add to previous overall score sum
        schoolData.previousOverallScore += assessment.overallScore;
        
        // Track previous score by category
        schoolData.changesByCategory!.set(assessment.category!, assessment.overallScore);
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
          a => a.school_id === schoolId && a.status === 'completed'
        ).length;
        if (prevCompletedCount > 0) {
          schoolData.previousOverallScore = schoolData.previousOverallScore / prevCompletedCount;
        }
      }
      
      // Set the intervention required count to the number of aspects that need intervention
      schoolData.criticalStandardsTotal = schoolData.aspectsWithInterventionRequired!.size;
      
      // Calculate school-level status based on individual assessment statuses
      schoolData.status = calculateSchoolStatus(schoolData.assessmentsByCategory.map(a => ({ status: a.status, due_date: a.dueDate || null })));
    });

    return Array.from(schoolMap.values());
  }, [filteredByTermAssessments, previousTermAssessments]);

  // Overlay dashboard summary fields (scores/trends/interventions/completion) when available
  const schoolPerformanceData = useMemo(() => {
    if (!schoolsDashboard) return schoolPerformanceFromAssessments;

    return schoolPerformanceFromAssessments.map((school) => {
      const schoolId = school.school?.id || school.school?.school_id || school.school?.code || '';
      const dash = dashboardBySchoolId.get(schoolId);
      if (!dash) return school;

      // The previous_terms[0] is the term immediately before the selected term
      // This is used for the trend indicator comparison
      const previousOverallScore = dash.previous_terms?.[0]?.avg_score ?? school.previousOverallScore;

      return {
        ...school,
        status: dash.status,
        overallScore: dash.current_score ?? 0,
        previousOverallScore: previousOverallScore ?? undefined,
        criticalStandardsTotal: dash.intervention_required,
        lastUpdated: dash.last_updated || school.lastUpdated,
      };
    });
  }, [schoolPerformanceFromAssessments, schoolsDashboard, dashboardBySchoolId]);

  const prefetchAspectRowMetricsForSchool = useCallback(async (schoolId: string) => {
    if (!selectedUniqueTermId) return;

    const currentIndex = availableTerms.indexOf(selectedTerm);
    const previousTermLabels = currentIndex >= 0 ? availableTerms.slice(currentIndex + 1, currentIndex + 4) : [];
    const previousUniqueTerms = previousTermLabels
      .map(termLabelToUniqueTermId)
      .filter((t): t is string => !!t);

    const school = schoolPerformanceData.find(s => (s.school?.id || s.school?.school_id) === schoolId);
    const categories = school?.assessmentsByCategory ?? [];

    await Promise.allSettled(categories.map(async (categoryData) => {
      const aspectMeta = categoryValueToAspect.get((categoryData.category || '').toLowerCase());
      const aspectCode = aspectMeta?.aspect_code;
      if (!aspectCode) return;

      const key = `${schoolId}:${aspectCode}:${selectedUniqueTermId}`;
      if (aspectRowMetrics[key]) return;

      const current = await assessmentService.getAssessmentsByAspect(aspectCode, schoolId, selectedUniqueTermId);
      const current_score = computeAvgScore(current);
      const intervention_required = computeInterventionRequired(current);
      const last_updated = computeLastUpdated(current);

      const previous_terms = await Promise.all(previousUniqueTerms.map(async (termId) => {
        const resp = await assessmentService.getAssessmentsByAspect(aspectCode, schoolId, termId);
        return {
          term_id: resp.term_id,
          academic_year: resp.academic_year,
          avg_score: computeAvgScore(resp),
        };
      }));

      setAspectRowMetrics(prev => ({
        ...prev,
        [key]: {
          status: current.status as any,
          current_score,
          previous_terms,
          intervention_required,
          completed_standards: current.completed_standards,
          total_standards: current.total_standards,
          last_updated,
        }
      }));
    }));
  }, [
    aspectRowMetrics,
    availableTerms,
    categoryValueToAspect,
    computeAvgScore,
    computeInterventionRequired,
    computeLastUpdated,
    schoolPerformanceData,
    selectedTerm,
    selectedUniqueTermId,
  ]);

  // If term changes while a school is expanded, refresh aspect rows for that term
  useEffect(() => {
    if (!selectedUniqueTermId) return;
    if (expandedSchools.size === 0) return;
    expandedSchools.forEach((schoolId) => {
      void prefetchAspectRowMetricsForSchool(schoolId);
    });
  }, [expandedSchools, prefetchAspectRowMetricsForSchool, selectedUniqueTermId]);

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
        (school.school?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (school.school?.code && school.school.code.toLowerCase().includes(searchTerm.toLowerCase()));

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
            case "completed": return cat.status === "completed";
            case "in-progress": return cat.status === "in_progress";
            case "not-started": return cat.status === "not_started";
            case "overdue": return cat.status === "not_started"; // Overdue is derived, not stored
            default: return false;
          }
        });
      });

      const matchesCategory = activeFilters.category.length === 0 || activeFilters.category.some(category => {
        return school.assessmentsByCategory.some(cat => cat.category === category);
      });

      const matchesSchool = activeFilters.school.length === 0 || activeFilters.school.includes(school.school?.id || '');
      
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
            const aCompleted = a.assessmentsByCategory.filter(cat => cat.status === "completed").length;
            const bCompleted = b.assessmentsByCategory.filter(cat => cat.status === "completed").length;
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
      if (!expandedSchools.has(schoolId)) {
        // When expanding, fetch aspect-level metrics so rows match the school summary
        await prefetchAspectRowMetricsForSchool(schoolId);
      }
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
            {dashboardError && (
              <p className="mt-1 text-sm text-amber-700">
                Dashboard summary unavailable (showing fallback data): {dashboardError}
              </p>
            )}
          </div>
          <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-3">
            {isPrimaryLoading ? (
              <TermNavigationSkeleton />
            ) : (
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Select value={selectedTerm} onValueChange={handleTermChange}>
                  <SelectTrigger className="w-full md:w-[220px] h-10">
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTerms.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button 
              onClick={() => setInvitationSheetOpen(true)}
              className="w-full md:w-auto"
              disabled={isPrimaryLoading}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Request Rating
            </Button>
          </div>
        </div>

        {/* Enhanced Filters */}
        {isPrimaryLoading ? (
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
              label: 'Requires attention only',
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
        {isUpdating && !isPrimaryLoading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border">
              <Loader2 className="h-4 w-4 animate-spin text-slate-600" />
              <span className="text-sm text-slate-600">Updating dashboard...</span>
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
          {isPrimaryLoading ? (
            <div className="p-6">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80 border-b border-slate-200">
                    <TableHead className="w-12"></TableHead>
                    <TableHead>SCHOOL</TableHead>
                    <TableHead className="text-center">SUBMITTED RATINGS</TableHead>
                    <TableHead className="text-center">OVERALL SCORE</TableHead>
                    <TableHead className="text-center">PREVIOUS 3 TERMS</TableHead>
                    <TableHead className="text-center">REQUIRES ATTENTION</TableHead>
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
                    REQUIRES ATTENTION
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
                const schoolId = school.school?.id || school.school?.school_id || '';
                const dashboardItem = schoolId ? dashboardBySchoolId.get(schoolId) : undefined;
                const isExpanded = expandedSchools.has(schoolId);

                // Completion rate: prefer backend dashboard (standards-level), fallback to aspects-level
                const completedCount = dashboardItem?.completed_standards ?? school.assessmentsByCategory.filter(cat => cat.status === "completed").length;
                const totalCount = dashboardItem?.total_standards ?? school.assessmentsByCategory.length;
                const completionPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

                return (
                  <React.Fragment key={schoolId || index}>
                    <TableRow 
                      className="cursor-pointer hover:bg-slate-50 transition-colors duration-200 animate-in fade-in-0 slide-in-from-bottom-1"
                      style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'both' }}
                      onClick={() => toggleSchoolExpansion(schoolId)}
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
                            <span className="text-xs font-medium">{formatStatus(school.status)}</span>
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
                          // Prefer backend-provided previous terms (bulk dashboard endpoint)
                          // These are already the 3 terms BEFORE the selected term
                          const previousTerms = dashboardItem?.previous_terms ?? [];
                          const dashTrendData: TrendDataPoint[] = previousTerms
                            .slice(0, 3) // Take up to 3 previous terms
                            .reverse() // Reverse to show oldest -> newest (left to right)
                            .map(t => ({ overallScore: t.avg_score ?? 0, term: t.term_id, academicYear: t.academic_year }))
                            .filter(d => d.overallScore > 0);

                          if (dashTrendData.length >= 2) {
                            return (
                              <div className="flex items-center justify-center gap-1">
                                <EnhancedTrendChart data={dashTrendData} width={80} height={28} />
                                <div className="flex items-center gap-0.5 text-xs">
                                  {dashTrendData[dashTrendData.length - 1].overallScore > dashTrendData[0].overallScore ? (
                                    <ArrowUp className="h-3 w-3 text-emerald-600" />
                                  ) : dashTrendData[dashTrendData.length - 1].overallScore < dashTrendData[0].overallScore ? (
                                    <ArrowDown className="h-3 w-3 text-rose-600" />
                                  ) : (
                                    <span className="text-slate-400">—</span>
                                  )}
                                </div>
                              </div>
                            );
                          }

                          // Fallback to client-calculated historical data (if needed)
                          const historicalData = historicalTermsData.get(schoolId) || [];
                          if (historicalData.length === 0) {
                            return <span className="text-sm text-slate-400">—</span>;
                          }

                          const trendData: TrendDataPoint[] = historicalData
                            .slice(0, 3) // Take up to 3 previous terms
                            .reverse() // Reverse to show oldest -> newest (left to right)
                            .filter(d => d.overallScore > 0);

                          if (trendData.length < 2) {
                            return <span className="text-sm text-slate-400">—</span>;
                          }

                          return (
                            <div className="flex items-center justify-center gap-1">
                              <EnhancedTrendChart data={trendData} width={80} height={28} />
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
                          <AnimatedProgress value={completionPercent} className="w-16 h-2" delay={index * 80 + 200} />
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
                                    <TableHead className="text-center">REQUIRES ATTENTION</TableHead>
                                    <TableHead className="text-center">COMPLETION RATE</TableHead>
                                    <TableHead className="text-center pr-6">ACTIONS</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {school.assessmentsByCategory.map((categoryData, catIndex) => {
                                    const aspectMeta = categoryValueToAspect.get((categoryData.category || '').toLowerCase());
                                    const aspectName = aspectMeta?.aspect_name || getAspectDisplayName(categoryData.category);
                                    const aspectCategory = formatAspectCategory(aspectMeta?.aspect_category);
                                    const aspectCode = aspectMeta?.aspect_code;
                                    const metricKey = (schoolId && aspectCode && selectedUniqueTermId)
                                      ? `${schoolId}:${aspectCode}:${selectedUniqueTermId}`
                                      : "";
                                    const metrics = metricKey ? aspectRowMetrics[metricKey] : undefined;

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
                                            <p className="font-medium text-sm text-slate-900 leading-tight">{aspectName}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                              {aspectCategory}
                                            </p>
                                          </div>
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-center">
                                        <Badge 
                                          variant="outline" 
                                          className={cn("text-xs font-medium", getStatusColor((metrics?.status as any) || categoryData.status))}
                                        >
                                          {formatStatus((metrics?.status as any) || categoryData.status)}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-center">
                                        {(() => {
                                          const score = metrics?.current_score ?? categoryData.overallScore ?? 0;
                                          if (!score || score <= 0) return <span className="text-slate-400 text-sm">—</span>;

                                          // Use the first previous term (immediately before selected term) for comparison
                                          const previousScore = metrics?.previous_terms?.[0]?.avg_score ?? null;
                                          const change = previousScore ? calculateChange(score, previousScore) : null;

                                          return (
                                            <div className="flex items-center justify-center space-x-1">
                                              <Badge variant="outline" className={getScoreBadgeColor(score)}>
                                                {score.toFixed(1)}
                                              </Badge>
                                              {change && (
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
                                              )}
                                            </div>
                                          );
                                        })()}
                                      </TableCell>
                                      <TableCell className="text-center">
                                        {(() => {
                                          // Prefer aspect-level previous terms derived from by-aspect endpoint
                                          // These are already the 3 terms BEFORE the selected term
                                          if (metrics?.previous_terms?.length) {
                                            const trendData: TrendDataPoint[] = metrics.previous_terms
                                              .slice(0, 3) // Take up to 3 previous terms
                                              .reverse() // Reverse to show oldest -> newest (left to right)
                                              .map(t => ({ overallScore: t.avg_score ?? 0, term: t.term_id, academicYear: t.academic_year }))
                                              .filter(d => d.overallScore > 0);
                                            if (trendData.length >= 2) {
                                              return (
                                                <div className="flex items-center justify-center">
                                                  <EnhancedTrendChart data={trendData} width={80} height={24} />
                                                </div>
                                              );
                                            }
                                          }

                                          // Fallback to client-calculated historical data
                                          const historicalData = historicalTermsData.get(school.school?.id || '') || [];
                                          const categoryHistoricalData = historicalData
                                            .map(termData => ({
                                              term: termData.term,
                                              overallScore: termData.categoryScores.get(categoryData.category) || 0
                                            }))
                                            .filter(d => d.overallScore > 0);
                                          
                                          if (categoryHistoricalData.length === 0) {
                                            return <span className="text-sm text-slate-400">—</span>;
                                          }
                                          
                                          // Take up to 3 previous terms and reverse to show oldest -> newest (left to right)
                                          const trendData: TrendDataPoint[] = categoryHistoricalData
                                            .slice(0, 3) // Take up to 3 previous terms
                                            .reverse() // Reverse to show oldest -> newest (left to right)
                                            .filter(d => d.overallScore > 0);
                                          
                                          if (trendData.length < 2) {
                                            return <span className="text-sm text-slate-400">—</span>;
                                          }
                                          
                                          // Simple value sequence with mini chart
                                          return (
                                            <div className="flex items-center justify-center">
                                              <EnhancedTrendChart data={trendData} width={80} height={24} />
                                            </div>
                                          );
                                        })()}
                                      </TableCell>
                                      <TableCell className="text-center">
                                        {typeof metrics?.intervention_required === 'number' ? (
                                          metrics.intervention_required > 0 ? (
                                            <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">
                                              {metrics.intervention_required}
                                            </Badge>
                                          ) : (
                                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                              0
                                            </Badge>
                                          )
                                        ) : categoryData.overallScore && categoryData.overallScore <= 1.5 && categoryData.status === 'completed' ? (
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
                                                <p className="font-medium text-sm">Requires attention</p>
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
                                            {(metrics?.completed_standards ?? categoryData.completedStandards)}/{(metrics?.total_standards ?? categoryData.totalStandards)}
                                          </span>
                                          <AnimatedProgress 
                                            value={(() => {
                                              const completed = metrics?.completed_standards ?? categoryData.completedStandards;
                                              const total = metrics?.total_standards ?? categoryData.totalStandards;
                                              return total > 0 ? (completed / total) * 100 : 0;
                                            })()} 
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
                                          <Link to={`/app/assessments/${categoryData.id}?view=admin`}>
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