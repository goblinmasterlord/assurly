import React, { useMemo, useState, useEffect } from "react";
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
import { SortableTableHead, type SortDirection } from "@/components/ui/sortable-table-head";
import type { Assessment, AssessmentCategory, SchoolPerformance, AcademicTerm } from "@/types/assessment";
import { cn } from "@/lib/utils";
import { 
  AlertTriangle, 
  Calendar, 
  CheckCircle2, 
  ChevronDown,
  ChevronRight, 
  Clock,
  Filter,
  School as SchoolIcon, 
  Search,
  XCircle,
  Eye,
  BookOpen,
  ClipboardCheck,
  Users,
  DollarSign,
  Building,
  Shield,
  Monitor,
  Settings,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Minus
} from "lucide-react";
import { AssessmentInvitationSheet } from "@/components/AssessmentInvitationSheet";
import { MiniTrendChart, type TrendDataPoint } from "@/components/ui/mini-trend-chart";
import { SchoolPerformanceTableSkeleton } from "@/components/ui/table-skeleton";
import { getAspectDisplayName } from "@/lib/assessment-utils";
import { assessmentCategories } from "@/lib/mock-data";
import { FilterBar } from "@/components/ui/filter-bar";

type SchoolPerformanceViewProps = {
  assessments: Assessment[];
  refreshAssessments?: () => Promise<void>;
  isLoading?: boolean;
}

// Helper type for historical data
type HistoricalData = {
  term: string;
  overallScore: number;
  categoryScores: Map<AssessmentCategory, number>;
}

export function SchoolPerformanceView({ assessments, refreshAssessments, isLoading = false }: SchoolPerformanceViewProps) {
  
  const [searchTerm, setSearchTerm] = useState("");
  const [performanceFilter, setPerformanceFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [criticalFilter, setCriticalFilter] = useState<boolean>(false);
  const [invitationSheetOpen, setInvitationSheetOpen] = useState(false);
  const [expandedSchools, setExpandedSchools] = useState<Set<string>>(new Set());
  const [expandedHistoric, setExpandedHistoric] = useState<Set<string>>(new Set());
  const [selectedTerm, setSelectedTerm] = useState<string>(""); // Will be set to first available term
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: SortDirection }>({
    key: "",
    direction: null
  });

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

  // Auto-select the first available term if none is selected
  useEffect(() => {
    if (availableTerms.length > 0 && !selectedTerm) {
      const firstTerm = availableTerms[0];
      // console.debug('Auto-selecting first available term:', firstTerm);
      setSelectedTerm(firstTerm);
    }
  }, [availableTerms, selectedTerm]);

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
    { label: "High Performance", value: "high" },
    { label: "Medium Performance", value: "medium" },
    { label: "Low Performance", value: "low" }
  ];

  const statusOptions: MultiSelectOption[] = [
    { label: "Completed", value: "completed" },
    { label: "In Progress", value: "in-progress" },
    { label: "Not Started", value: "not-started" },
    { label: "Overdue", value: "overdue" }
  ];

  const uniqueCategories = [...new Set(filteredByTermAssessments.map(a => a.category))];
  const categoryOptions: MultiSelectOption[] = assessmentCategories.map(categoryInfo => ({
    label: getAspectDisplayName(categoryInfo.value),
    value: categoryInfo.value
  }));

  // DEBUG: Add debugging wrappers for filter state changes
  const handlePerformanceFilterChange = (newValue: string[]) => {
    setPerformanceFilter(newValue);
  };

  const handleStatusFilterChange = (newValue: string[]) => {
    setStatusFilter(newValue);
  };

  const handleCategoryFilterChange = (newValue: string[]) => {
    setCategoryFilter(newValue);
  };

  // Group assessments by school and calculate performance metrics
  const schoolPerformanceData = useMemo(() => {
    const schoolMap = new Map<string, SchoolPerformance & { previousOverallScore?: number; changesByCategory?: Map<string, any> }>();

    // Process current term assessments
    filteredByTermAssessments.forEach(assessment => {
      const schoolId = assessment.school.id;
      
      if (!schoolMap.has(schoolId)) {
        schoolMap.set(schoolId, {
          school: assessment.school,
          overallScore: 0,
          assessmentsByCategory: [],
          criticalStandardsTotal: 0,
          lastUpdated: assessment.lastUpdated,
          previousOverallScore: undefined, // Start with undefined instead of 0
          changesByCategory: new Map(),
        });
      }

      const schoolData = schoolMap.get(schoolId)!;
      
      // Calculate overall score based on completed assessments
      const averageScore = assessment.overallScore || 0; // Use the overallScore from the assessment
      
      // Count critical standards (ratings of 1 or 2)
      const criticalCount = assessment.standards?.filter(s => s.rating === 1 || s.rating === 2).length || 0;

      schoolData.assessmentsByCategory.push({
        category: assessment.category,
        assessment,
        averageScore,
        criticalStandardsCount: criticalCount,
      });

      schoolData.criticalStandardsTotal += criticalCount;
      
      // Update last updated if this assessment is more recent
      if (assessment.lastUpdated > schoolData.lastUpdated) {
        schoolData.lastUpdated = assessment.lastUpdated;
      }
    });

    // Calculate overall scores and previous term comparisons
    schoolMap.forEach((schoolData, schoolId) => {
      const completedAssessments = schoolData.assessmentsByCategory.filter(
        cat => cat.assessment.status === "Completed"
      );
      
      if (completedAssessments.length > 0) {
        const totalScore = completedAssessments.reduce((sum, cat) => sum + cat.averageScore, 0);
        schoolData.overallScore = totalScore / completedAssessments.length;
      }

      // Find previous term data for comparison
      const previousSchoolAssessments = previousTermAssessments.filter(
        a => a.school.id === schoolId
      );

      if (previousSchoolAssessments.length > 0) {
        const prevCompletedAssessments = previousSchoolAssessments.filter(a => a.status === "Completed");
        if (prevCompletedAssessments.length > 0) {
          const prevTotalScore = prevCompletedAssessments.reduce((sum, a) => sum + (a.overallScore || 0), 0);
          schoolData.previousOverallScore = prevTotalScore / prevCompletedAssessments.length;
        }

        // Calculate changes by category
        schoolData.assessmentsByCategory.forEach(categoryData => {
          const prevCategoryAssessment = previousSchoolAssessments.find(
            a => a.category === categoryData.category && a.status === "Completed"
          );
          if (prevCategoryAssessment) {
            const change = calculateChange(categoryData.averageScore, prevCategoryAssessment.overallScore || 0);
            schoolData.changesByCategory!.set(categoryData.category, change);
          }
        });
      }
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
    let filtered = schoolPerformanceData.filter(school => {
      const matchesSearch = searchTerm === "" ||
        school.school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (school.school.code && school.school.code.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesPerformance = performanceFilter.length === 0 || performanceFilter.some(filter => {
        switch (filter) {
          case "excellent": return school.overallScore >= 3.5;
          case "good": return school.overallScore >= 2.5 && school.overallScore < 3.5;
          case "requires-improvement": return school.overallScore >= 1.5 && school.overallScore < 2.5;
          case "inadequate": return school.overallScore < 1.5 && school.overallScore > 0;
          case "no-data": return school.overallScore === 0;
          default: return false;
        }
      });

      const matchesStatus = statusFilter.length === 0 || statusFilter.some(status => {
        return school.assessmentsByCategory.some(cat => {
          switch (status) {
            case "completed": return cat.assessment.status === "Completed";
            case "in-progress": return cat.assessment.status === "In Progress";
            case "not-started": return cat.assessment.status === "Not Started";
            case "overdue": return cat.assessment.status === "Overdue";
            default: return false;
          }
        });
      });

      const matchesCategory = categoryFilter.length === 0 || categoryFilter.some(category => {
        return school.assessmentsByCategory.some(cat => cat.category === category);
      });

      const matchesCritical = !criticalFilter || school.criticalStandardsTotal > 0;

      return matchesSearch && matchesPerformance && matchesStatus && matchesCategory && matchesCritical;
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
            const aCompleted = a.assessmentsByCategory.filter(cat => cat.assessment.status === "Completed").length;
            const bCompleted = b.assessmentsByCategory.filter(cat => cat.assessment.status === "Completed").length;
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
            aValue = Math.max(...a.assessmentsByCategory.map(cat => new Date(cat.assessment.lastUpdated || '').getTime() || 0));
            bValue = Math.max(...b.assessmentsByCategory.map(cat => new Date(cat.assessment.lastUpdated || '').getTime() || 0));
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
  }, [schoolPerformanceData, searchTerm, performanceFilter, statusFilter, categoryFilter, criticalFilter, sortConfig]);

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm("");
    setPerformanceFilter([]);
    setStatusFilter([]);
    setCategoryFilter([]);
    setCriticalFilter(false);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Education":
        return <BookOpen className="h-4 w-4" />;
      case "Human Resources":
        return <Users className="h-4 w-4" />;
      case "Finance & Procurement":
        return <DollarSign className="h-4 w-4" />;
      case "Estates":
        return <Building className="h-4 w-4" />;
      case "Governance":
        return <Shield className="h-4 w-4" />;
      case "IT & Information Services":
        return <Monitor className="h-4 w-4" />;
      case "IT (Digital Aspects)":
        return <Settings className="h-4 w-4" />;
      default:
        return <ClipboardCheck className="h-4 w-4" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 3.5) return "text-emerald-600";
    if (score >= 2.5) return "text-indigo-600";
    if (score >= 1.5) return "text-amber-600";
    return "text-rose-600";
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

  const toggleSchoolExpansion = (schoolId: string) => {
    const newExpanded = new Set(expandedSchools);
    if (newExpanded.has(schoolId)) {
      newExpanded.delete(schoolId);
    } else {
      newExpanded.add(schoolId);
    }
    setExpandedSchools(newExpanded);
  };

  const toggleHistoricExpansion = (schoolId: string) => {
    const newExpanded = new Set(expandedHistoric);
    if (newExpanded.has(schoolId)) {
      newExpanded.delete(schoolId);
    } else {
      newExpanded.add(schoolId);
    }
    setExpandedHistoric(newExpanded);
  };

  // Helper function to render historical data view button
  const renderHistoricalButton = (schoolId: string, isSmall: boolean = false) => {
    const hasHistoricalData = historicalTermsData.has(schoolId) && historicalTermsData.get(schoolId)!.length > 0;
    const isExpanded = expandedHistoric.has(schoolId);
    
    if (!hasHistoricalData) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size={isSmall ? "icon" : "sm"}
              className={cn(
                "opacity-40 cursor-not-allowed",
                isSmall ? "h-5 w-5" : "h-6 w-6"
              )}
              disabled
            >
              <TrendingUp className={cn(isSmall ? "h-3 w-3" : "h-3.5 w-3.5")} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>No historical data available</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="ghost" 
            size={isSmall ? "icon" : "sm"}
            className={cn(
              "hover:bg-slate-100",
              isSmall ? "h-5 w-5" : "h-6 w-6",
              isExpanded && "bg-slate-100"
            )}
            onClick={(e) => {
              e.stopPropagation();
              toggleHistoricExpansion(schoolId);
            }}
          >
            <TrendingUp className={cn(
              isSmall ? "h-3 w-3" : "h-3.5 w-3.5",
              isExpanded ? "text-indigo-600" : "text-slate-600"
            )} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isExpanded ? 'Hide' : 'View'} historical performance</p>
        </TooltipContent>
      </Tooltip>
    );
  };

  // Helper function to render historical data rows
  const renderHistoricalDataRows = (schoolId: string, categoryData: any) => {
    const historicalData = historicalTermsData.get(schoolId) || [];
    if (historicalData.length === 0) return null;

    // Get historical scores for this category
    const categoryHistoricalScores = historicalData
      .map(termData => ({
        term: termData.term,
        score: termData.categoryScores.get(categoryData.category) || 0
      }))
      .filter(item => item.score > 0);

    if (categoryHistoricalScores.length === 0) {
      return (
        <TableRow className="bg-slate-25 border-l-4 border-l-slate-200">
          <TableCell colSpan={6} className="py-3 text-center text-sm text-slate-500">
            No historical data available for {getAspectDisplayName(categoryData.category)}
          </TableCell>
        </TableRow>
      );
    }

    // Prepare trend data for the mini chart
    const trendData: TrendDataPoint[] = categoryHistoricalScores.map(item => ({
      term: item.term,
      overallScore: item.score
    }));

    return (
      <TableRow className="bg-slate-25 border-l-4 border-l-indigo-200">
        <TableCell className="py-3">
          <div className="flex items-center space-x-3 ml-8">
            <div className="h-1 w-6 bg-slate-300 rounded"></div>
            <div>
              <p className="text-sm font-medium text-slate-700">Historical Performance</p>
              <p className="text-xs text-slate-500">Previous {categoryHistoricalScores.length} term{categoryHistoricalScores.length > 1 ? 's' : ''}</p>
            </div>
          </div>
        </TableCell>
        <TableCell className="text-center py-3">
          <span className="text-xs text-slate-500">—</span>
        </TableCell>
        <TableCell className="text-center py-3">
          <div className="flex items-center justify-center space-x-4">
            {/* Mini trend chart */}
            <MiniTrendChart data={trendData} width={100} height={24} />
            
            {/* Historical scores */}
            <div className="flex items-center space-x-3">
              {categoryHistoricalScores.slice(0, 3).map((item, index) => {
                const termParts = item.term.split(' ');
                const termShort = termParts[0]?.slice(0, 3) + ' ' + termParts[1]?.slice(-2);
                
                return (
                  <div key={index} className="text-center">
                    <div className="text-xs font-medium text-slate-700">{item.score.toFixed(1)}</div>
                    <div className="text-xs text-slate-400">{termShort}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </TableCell>
        <TableCell className="text-center py-3">
          <span className="text-xs text-slate-500">—</span>
        </TableCell>
        <TableCell className="text-center py-3">
          <span className="text-xs text-slate-500">—</span>
        </TableCell>
        <TableCell className="text-center py-3">
          <span className="text-xs text-slate-500">—</span>
        </TableCell>
      </TableRow>
    );
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
            <TermStepper
              terms={availableTerms}
              currentTerm={selectedTerm}
              onTermChange={setSelectedTerm}
              className="w-full md:w-auto"
            />
          <Button 
            onClick={() => setInvitationSheetOpen(true)}
            className="w-full md:w-auto"
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Request Rating
          </Button>
          </div>
        </div>

        {/* Enhanced Filters */}
        <FilterBar
          title="Filters"
          layout="mat-admin"
          onClearAll={clearAllFilters}
          filters={[
            {
              type: 'search',
              placeholder: 'Search schools...',
              value: searchTerm,
              onChange: setSearchTerm
            },
            {
              type: 'multiselect',
              placeholder: 'Performance',
              value: performanceFilter,
              onChange: handlePerformanceFilterChange,
              options: performanceOptions
            },
            {
              type: 'multiselect',
              placeholder: 'Status', 
              value: statusFilter,
              onChange: handleStatusFilterChange,
              options: statusOptions
            },
            {
              type: 'multiselect',
                              placeholder: 'Aspect',
              value: categoryFilter,
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

      {/* Schools Table */}
      <Card>
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
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="w-12"></TableHead>
                <SortableTableHead 
                  sortKey="school"
                  currentSort={sortConfig}
                  onSort={handleSort}
                >
                  School
                </SortableTableHead>
                <SortableTableHead 
                  className="text-center"
                  sortKey="assessments"
                  currentSort={sortConfig}
                  onSort={handleSort}
                >
                  Ratings
                </SortableTableHead>
                <SortableTableHead 
                  className="text-center"
                  sortKey="overallScore"
                  currentSort={sortConfig}
                  onSort={handleSort}
                >
                  Overall Score
                </SortableTableHead>
                <SortableTableHead 
                  className="text-center"
                  sortKey="criticalStandards"
                  currentSort={sortConfig}
                  onSort={handleSort}
                >
                  Intervention Required
                </SortableTableHead>
                <SortableTableHead 
                  className="text-center"
                  sortKey="lastUpdated"
                  currentSort={sortConfig}
                  onSort={handleSort}
                >
                  Last Updated
                </SortableTableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <SchoolPerformanceTableSkeleton />
              ) : (
                filteredSchoolData.map((school) => {
                const isExpanded = expandedSchools.has(school.school.id);
                const trend = getPerformanceTrend(school.overallScore, school.criticalStandardsTotal);
                const completedCount = school.assessmentsByCategory.filter(cat => cat.assessment.status === "Completed").length;
                const totalCount = school.assessmentsByCategory.length;

                return (
                  <React.Fragment key={school.school.id}>
                    <TableRow 
                      className="cursor-pointer hover:bg-slate-50"
                      onClick={() => toggleSchoolExpansion(school.school.id)}
                    >
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 border border-slate-100">
                            <SchoolIcon className="h-4 w-4 text-slate-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{school.school.name}</p>
                            {school.school.code && (
                              <p className="text-sm text-slate-500">{school.school.code}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <span className="text-sm font-medium">{completedCount}/{totalCount}</span>
                          <Progress value={(completedCount / totalCount) * 100} className="w-16 h-2" />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {school.overallScore > 0 ? (
                          <div className="flex items-center justify-center space-x-1.5">
                            <div className="flex items-center space-x-1">
                          <Badge variant="outline" className={getScoreBadgeColor(school.overallScore)}>
                            {school.overallScore.toFixed(1)}
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
                            {/* Historical data button for overall score */}
                            {renderHistoricalButton(school.school.id, true)}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center space-x-1.5">
                          <span className="text-slate-400">—</span>
                            {renderHistoricalButton(school.school.id, true)}
                          </div>
                        )}
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

                      <TableCell className="text-center text-sm text-slate-600">
                        {school.lastUpdated !== "-" ? new Date(school.lastUpdated).toLocaleDateString() : "—"}
                      </TableCell>
                    </TableRow>

                    {/* Historic Data Inline Expansion - School Level */}
                    {expandedHistoric.has(school.school.id) && (
                      <TableRow>
                        <TableCell colSpan={6} className="bg-slate-50/30 p-4">
                          {(() => {
                            const historicalData = historicalTermsData.get(school.school.id) || [];
                            if (historicalData.length === 0) {
                              return (
                                <div className="text-center text-sm text-slate-500">
                                  No historical data available for {school.school.name}
                                </div>
                              );
                            }

                            // Prepare trend data for school overall score
                            const schoolTrendData: TrendDataPoint[] = historicalData.map(termData => ({
                              term: termData.term,
                              overallScore: termData.overallScore
                            }));

                            return (
                              <div className="space-y-4">
                                <div className="flex items-center space-x-2">
                                  <TrendingUp className="h-4 w-4 text-indigo-600" />
                                  <h4 className="text-sm font-medium text-slate-900">
                                    Historical Performance - {school.school.name}
                                  </h4>
                                </div>
                                
                                <div className="flex items-center justify-center space-x-8 bg-white rounded-lg border p-4">
                                  {/* School Overall Trend Chart */}
                                  <div className="flex items-center space-x-4">
                                    <span className="text-sm font-medium text-slate-600">Overall Score Trend:</span>
                                    <MiniTrendChart data={schoolTrendData} width={160} height={40} />
                                  </div>
                                  
                                  {/* Historical Scores */}
                                  <div className="flex items-center space-x-6">
                                    {historicalData.slice(0, 3).map((termData, index) => {
                                      const termParts = termData.term.split(' ');
                                      const termShort = termParts[0]?.slice(0, 3) + ' ' + termParts[1]?.slice(-2);
                                      
                                      return (
                                        <div key={index} className="text-center">
                                          <div className="text-lg font-semibold text-slate-800">
                                            {termData.overallScore > 0 ? termData.overallScore.toFixed(1) : '—'}
                                          </div>
                                          <div className="text-xs text-slate-500">{termShort}</div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </TableCell>
                      </TableRow>
                    )}

                    {/* Expanded Content */}
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={6} className="bg-slate-50 p-0">
                          <div className="p-6 border-t">
                            <h4 className="text-sm font-medium text-slate-900 mb-4">Assessment Strategies</h4>
                            <div className="bg-white rounded-lg border">
                              <Table>
                                <TableHeader>
                                  <TableRow className="bg-slate-50">
                                    <TableHead>Aspect</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead className="text-center">Score</TableHead>
                                    <TableHead className="text-center">Completion Rate</TableHead>
                                    <TableHead className="text-center">Critical</TableHead>
                                    <TableHead className="text-center">Actions</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {school.assessmentsByCategory.map((categoryData) => {
                                    const categoryKey = `${school.school.id}-${categoryData.category}`;
                                    const isCategoryHistoricExpanded = expandedHistoric.has(categoryKey);

                                    return (
                                      <React.Fragment key={categoryData.category}>
                                        <TableRow className="hover:bg-slate-50">
                                      <TableCell>
                                        <div className="flex items-center space-x-3">
                                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 border border-slate-100">
                                            <div className="text-slate-600">
                                              {getCategoryIcon(categoryData.category)}
                                            </div>
                                          </div>
                                          <div>
                                            <p className="font-medium text-sm">{categoryData.category}</p>
                                            <p className="text-xs text-slate-500">
                                              {categoryData.assessment.assignedTo?.[0]?.name || "Unassigned"}
                                            </p>
                                          </div>
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-center">
                                        <Badge 
                                          variant="outline" 
                                          className={getStatusColor(categoryData.assessment.status)}
                                        >
                                          {categoryData.assessment.status}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-center">
                                        {categoryData.averageScore > 0 ? (
                                              <div className="flex items-center justify-center space-x-2">
                                          <Badge variant="outline" className={getScoreBadgeColor(categoryData.averageScore)}>
                                            {categoryData.averageScore.toFixed(1)}
                                          </Badge>
                                                {/* Category change indicator */}
                                                {school.changesByCategory && school.changesByCategory.has(categoryData.category) && (() => {
                                                  const previousScore = school.changesByCategory.get(categoryData.category);
                                                  if (!previousScore || previousScore === 0) return null;
                                                  const change = calculateChange(categoryData.averageScore, previousScore);
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
                                                {/* Historical data button for individual assessment */}
                                                <Tooltip>
                                                  <TooltipTrigger asChild>
                                                    <Button 
                                                      variant="ghost" 
                                                      size="icon"
                                                      className={cn(
                                                        "h-5 w-5 hover:bg-slate-100",
                                                        isCategoryHistoricExpanded && "bg-slate-100"
                                                      )}
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        const newExpanded = new Set(expandedHistoric);
                                                        if (newExpanded.has(categoryKey)) {
                                                          newExpanded.delete(categoryKey);
                                                        } else {
                                                          newExpanded.add(categoryKey);
                                                        }
                                                        setExpandedHistoric(newExpanded);
                                                      }}
                                                    >
                                                      <TrendingUp className={cn(
                                                        "h-3 w-3",
                                                        isCategoryHistoricExpanded ? "text-indigo-600" : "text-slate-600"
                                                      )} />
                                                    </Button>
                                                  </TooltipTrigger>
                                                  <TooltipContent>
                                                    <p>{isCategoryHistoricExpanded ? 'Hide' : 'View'} historical data for {getAspectDisplayName(categoryData.category)}</p>
                                                  </TooltipContent>
                                                </Tooltip>
                                              </div>
                                            ) : (
                                              <div className="flex items-center justify-center space-x-2">
                                          <span className="text-slate-400 text-sm">—</span>
                                                <Tooltip>
                                                  <TooltipTrigger asChild>
                                                    <Button 
                                                      variant="ghost" 
                                                      size="icon"
                                                      className="h-5 w-5 opacity-40 cursor-not-allowed"
                                                      disabled
                                                    >
                                                      <TrendingUp className="h-3 w-3" />
                                                    </Button>
                                                  </TooltipTrigger>
                                                  <TooltipContent>
                                                    <p>No current score to compare</p>
                                                  </TooltipContent>
                                                </Tooltip>
                                              </div>
                                        )}
                                      </TableCell>
                                      <TableCell className="text-center">
                                        <div className="flex items-center justify-center space-x-2">
                                          <span className="text-xs font-medium">
                                            {categoryData.assessment.completedStandards}/{categoryData.assessment.totalStandards}
                                          </span>
                                          <Progress 
                                            value={(categoryData.assessment.completedStandards / categoryData.assessment.totalStandards) * 100} 
                                            className="w-12 h-1.5"
                                          />
                                        </div>
                                      </TableCell>
                                                                             <TableCell className="text-center">
                                         {categoryData.criticalStandardsCount > 0 ? (
                                           <Tooltip>
                                             <TooltipTrigger asChild>
                                               <div className="flex items-center justify-center space-x-1 cursor-help">
                                                 <AlertTriangle className="h-3 w-3 text-rose-600" />
                                                 <span className="text-sm font-medium text-rose-700">
                                                   {categoryData.criticalStandardsCount}
                                                 </span>
                                               </div>
                                             </TooltipTrigger>
                                             <TooltipContent side="left" className="max-w-sm">
                                               <div className="space-y-1">
                                                 <p className="font-medium text-rose-800">Critical Standards:</p>
                                                 {categoryData.assessment.standards
                                                      ?.filter(s => s.rating === 1)
                                                   .slice(0, 3)
                                                   .map(standard => (
                                                     <div key={standard.id} className="text-xs">
                                                       <span className="font-medium">{standard.code}:</span> {standard.title}
                                                     </div>
                                                   ))}
                                                 {categoryData.criticalStandardsCount > 3 && (
                                                   <p className="text-xs text-slate-600">+{categoryData.criticalStandardsCount - 3} more...</p>
                                                 )}
                                               </div>
                                             </TooltipContent>
                                           </Tooltip>
                                         ) : (
                                           <span className="text-slate-400 text-sm">—</span>
                                         )}
                                       </TableCell>
                                      <TableCell className="text-center">
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          asChild
                                          className="h-7 px-2"
                                        >
                                          <Link to={`/assessments/${categoryData.assessment.id}?view=admin`}>
                                            <Eye className="mr-1 h-3 w-3" />
                                            View
                                          </Link>
                                        </Button>
                                      </TableCell>
                                    </TableRow>

                                        {/* Historical data row for this category */}
                                        {isCategoryHistoricExpanded && renderHistoricalDataRows(school.school.id, categoryData)}
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
                })
              )}
            </TableBody>
          </Table>

          {filteredSchoolData.length === 0 && (
            <div className="text-center py-12">
              <SchoolIcon className="mx-auto h-12 w-12 text-slate-400" />
              <h3 className="mt-4 text-sm font-medium text-slate-900">No schools found</h3>
              <p className="mt-2 text-sm text-slate-500">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assessment Invitation Sheet */}
      <AssessmentInvitationSheet 
        open={invitationSheetOpen} 
        onOpenChange={setInvitationSheetOpen} 
        onSuccess={refreshAssessments}
      />
    </div>
    </TooltipProvider>
  );
} 