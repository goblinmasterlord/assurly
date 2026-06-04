import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  Users,
  School as SchoolIcon,
  ClipboardCheck,
  AlertTriangle,
  FileText,
  Target,
  Award,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useAssessments, useSchools } from "@/hooks/use-assessments";
import type { Assessment, Aspect, AspectCategory, TrendData } from "@/types/assessment";
import type { SchoolsDashboardResponse } from "@/types/dashboard";
import { calculateAverageRating } from "@/utils/rating-labels";
import {
  REQUIRES_ATTENTION_LABEL,
  REQUIRES_ATTENTION_SUBTITLE,
} from "@/lib/dashboard-labels";
import { TermStepper } from "@/components/ui/term-stepper";
import { assessmentService } from "@/services/enhanced-assessment-service";
import { parseUniqueTerm } from "@/lib/data-transformers";

const CHART_COLORS = {
  primary: "#1e40af",
  muted: "#94a3b8",
};

const ASPECT_CHART_PALETTE = [
  "#3b82f6",
  "#10b981",
  "#8b5cf6",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#84cc16",
  "#6366f1",
];

const RATING_COLORS = {
  1: "#dc2626",
  2: "#d97706",
  3: "#16a34a",
  4: "#1e40af",
};

const TERM_NAME_TO_ID: Record<string, string> = {
  Autumn: "T1",
  Spring: "T2",
  Summer: "T3",
};

const TERM_ID_TO_NAME: Record<string, string> = {
  T1: "Autumn",
  T2: "Spring",
  T3: "Summer",
};

const TERM_TRENDS_LIMIT = 5;

type DashboardView = "school" | "trust";
type AspectCategoryFilter = "all" | AspectCategory;

const ASPECT_FILTER_EMPTY_MESSAGE: Record<AspectCategory, string> = {
  strategic: "No strategic aspects configured for this MAT",
  operational: "No operational aspects configured for this MAT",
};

function compressAcademicYear(year: string): string {
  if (/^\d{4}-\d{2}$/.test(year)) return year;
  const match = year.match(/^(\d{4})-(\d{4})$/);
  if (!match) return year;
  return `${match[1]}-${match[2].slice(-2)}`;
}

function expandAcademicYearShort(year: string): string {
  if (/^\d{4}-\d{2}$/.test(year)) {
    const [start, end] = year.split("-");
    return `${start}-20${end}`;
  }
  return year;
}

function termLabelToUniqueTermId(termLabel: string): string | undefined {
  if (!termLabel) return undefined;
  const [termName, academicYearLong] = termLabel.split(" ");
  if (!termName || !academicYearLong) return undefined;
  const termId = TERM_NAME_TO_ID[termName];
  if (!termId) return undefined;
  return `${termId}-${compressAcademicYear(academicYearLong)}`;
}

function uniqueTermIdToLabel(uniqueTermId: string): string {
  try {
    const { termId, academicYear } = parseUniqueTerm(uniqueTermId);
    const termName = TERM_ID_TO_NAME[termId] || termId;
    return `${termName} ${expandAcademicYearShort(academicYear)}`;
  } catch {
    return uniqueTermId;
  }
}

function compareUniqueTermIds(a: string, b: string): number {
  try {
    const pa = parseUniqueTerm(a);
    const pb = parseUniqueTerm(b);
    const yearA = parseInt(pa.academicYear.split("-")[0], 10);
    const yearB = parseInt(pb.academicYear.split("-")[0], 10);
    if (yearA !== yearB) return yearA - yearB;
    const order: Record<string, number> = { T1: 1, T2: 2, T3: 3 };
    return (order[pa.termId] || 0) - (order[pb.termId] || 0);
  } catch {
    return a.localeCompare(b);
  }
}

function getSchoolPerformanceLabel(
  score: number | null,
  dashStatus: string
): string {
  if (score == null || score === 0) {
    if (dashStatus === "in_progress") return "In Progress";
    if (dashStatus === "completed") return "Healthy";
    return "Not Started";
  }
  if (score < 1.5) return "Critical";
  if (score < 2.0) return "Needs improvement";
  if (score >= 3.5) return "Strong";
  return "Healthy";
}

interface AspectAreaRating {
  aspectCode: string;
  category: string;
  aspectCategory?: AspectCategory;
  score: number;
  schoolCount: number;
}

export function AnalyticsPage() {
  const { assessments, isLoading: assessmentsLoading } = useAssessments();
  const { schools, isLoading: schoolsLoading } = useSchools();
  const [selectedTerm, setSelectedTerm] = useState<string>("");
  const [dashboardView, setDashboardView] = useState<DashboardView>("school");
  const [aspectCategoryFilter, setAspectCategoryFilter] =
    useState<AspectCategoryFilter>("all");
  const [aspects, setAspects] = useState<Aspect[]>([]);
  const [aspectsLoading, setAspectsLoading] = useState(true);
  const [schoolsDashboard, setSchoolsDashboard] = useState<SchoolsDashboardResponse | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [trendsData, setTrendsData] = useState<TrendData | null>(null);
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [aspectAreaRatings, setAspectAreaRatings] = useState<AspectAreaRating[]>([]);
  const [aspectRatingsLoading, setAspectRatingsLoading] = useState(false);

  const viewSchools = useMemo(
    () =>
      dashboardView === "trust"
        ? schools.filter((s) => s.is_central_office)
        : schools.filter((s) => !s.is_central_office),
    [schools, dashboardView]
  );

  const viewSchoolIds = useMemo(() => {
    const ids = new Set<string>();
    viewSchools.forEach((s) => {
      const id = s.school_id || s.id;
      if (id) ids.add(id);
    });
    return ids;
  }, [viewSchools]);

  const centralOfficeSchoolId = useMemo(() => {
    const central = schools.find((s) => s.is_central_office);
    return central?.school_id || central?.id;
  }, [schools]);

  const availableTerms = useMemo(() => {
    const termSet = new Set<string>();
    assessments.forEach((assessment) => {
      if (assessment.unique_term_id) {
        termSet.add(uniqueTermIdToLabel(assessment.unique_term_id));
      } else if (assessment.term && assessment.academicYear) {
        termSet.add(`${assessment.term} ${assessment.academicYear}`);
      }
    });

    return Array.from(termSet).sort((a, b) => {
      const idA = termLabelToUniqueTermId(a);
      const idB = termLabelToUniqueTermId(b);
      if (idA && idB) return compareUniqueTermIds(idB, idA);
      return b.localeCompare(a);
    });
  }, [assessments]);

  useEffect(() => {
    if (availableTerms.length === 0) return;
    if (selectedTerm && availableTerms.includes(selectedTerm)) return;
    setSelectedTerm(availableTerms[0]);
  }, [availableTerms, selectedTerm]);

  const selectedUniqueTermId = useMemo(
    () => termLabelToUniqueTermId(selectedTerm),
    [selectedTerm]
  );

  const termFilteredAssessments = useMemo(() => {
    if (!selectedUniqueTermId) return [];
    return assessments.filter(
      (a) =>
        a.unique_term_id === selectedUniqueTermId &&
        viewSchoolIds.has(a.school_id || a.school?.id || "")
    );
  }, [assessments, selectedUniqueTermId, viewSchoolIds]);

  const loadDashboard = useCallback(async () => {
    if (!selectedUniqueTermId) {
      setSchoolsDashboard(null);
      return;
    }
    setDashboardLoading(true);
    try {
      const data = await assessmentService.getSchoolsDashboard(
        selectedUniqueTermId,
        dashboardView
      );
      setSchoolsDashboard(data);
    } catch (err) {
      console.error("Failed to load analytics dashboard:", err);
      setSchoolsDashboard(null);
    } finally {
      setDashboardLoading(false);
    }
  }, [selectedUniqueTermId, dashboardView]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    let cancelled = false;
    setTrendsLoading(true);

    const filters: {
      school_id?: string;
    } = {};
    if (dashboardView === "trust" && centralOfficeSchoolId) {
      filters.school_id = centralOfficeSchoolId;
    }

    assessmentService
      .getAnalyticsTrends(filters)
      .then((data) => {
        if (!cancelled) setTrendsData(data);
      })
      .catch((err) => {
        console.error("Failed to load analytics trends:", err);
        if (!cancelled) setTrendsData(null);
      })
      .finally(() => {
        if (!cancelled) setTrendsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [dashboardView, centralOfficeSchoolId]);

  useEffect(() => {
    let cancelled = false;
    const fetchAspects = async () => {
      setAspectsLoading(true);
      try {
        const data = await assessmentService.getAspects();
        if (!cancelled) setAspects(data);
      } catch (err) {
        console.error("Failed to load aspects:", err);
        if (!cancelled) setAspects([]);
      } finally {
        if (!cancelled) setAspectsLoading(false);
      }
    };
    void fetchAspects();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedUniqueTermId || aspects.length === 0 || viewSchools.length === 0) {
      setAspectAreaRatings([]);
      return;
    }

    let cancelled = false;
    setAspectRatingsLoading(true);

    const loadAspectRatings = async () => {
      try {
        const sortedAspects = [...aspects].sort(
          (a, b) => a.sort_order - b.sort_order
        );

        const ratings = await Promise.all(
          sortedAspects.map(async (aspect) => {
            const schoolScores: number[] = [];
            await Promise.all(
              viewSchools.map(async (school) => {
                const schoolId = school.school_id || school.id;
                if (!schoolId) return;
                try {
                  const data = await assessmentService.getAssessmentsByAspect(
                    aspect.aspect_code,
                    schoolId,
                    selectedUniqueTermId
                  );
                  const avg = calculateAverageRating(data.standards);
                  if (avg != null) schoolScores.push(avg);
                } catch {
                  // School may not have this aspect for the term
                }
              })
            );

            const score =
              schoolScores.length > 0
                ? schoolScores.reduce((sum, s) => sum + s, 0) / schoolScores.length
                : 0;

            return {
              aspectCode: aspect.aspect_code,
              category: aspect.aspect_name,
              aspectCategory: aspect.aspect_category,
              score,
              schoolCount: schoolScores.length,
            };
          })
        );

        if (!cancelled) setAspectAreaRatings(ratings);
      } finally {
        if (!cancelled) setAspectRatingsLoading(false);
      }
    };

    void loadAspectRatings();
    return () => {
      cancelled = true;
    };
  }, [selectedUniqueTermId, aspects, viewSchools]);

  const filteredAspectAreaRatings = useMemo(() => {
    if (aspectCategoryFilter === "all") return aspectAreaRatings;
    return aspectAreaRatings.filter(
      (r) => r.aspectCategory === aspectCategoryFilter
    );
  }, [aspectAreaRatings, aspectCategoryFilter]);

  const aspectsConfiguredInFilter = useMemo(() => {
    if (aspectCategoryFilter === "all") return aspects.length;
    return aspects.filter((a) => a.aspect_category === aspectCategoryFilter)
      .length;
  }, [aspects, aspectCategoryFilter]);

  const trustAssurlyScore = useMemo(() => {
    const scores = (schoolsDashboard?.schools ?? [])
      .map((s) => s.current_score)
      .filter((s): s is number => s != null);
    if (scores.length === 0) return null;
    const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    return Math.round(avg * 100) / 100;
  }, [schoolsDashboard]);

  const totalInterventionRequired = useMemo(() => {
    return (schoolsDashboard?.schools ?? []).reduce(
      (sum, s) => sum + (s.intervention_required ?? 0),
      0
    );
  }, [schoolsDashboard]);

  const activeAssessments = useMemo(() => {
    return termFilteredAssessments.filter(
      (a) => a.status === "in_progress" || a.status === "not_started"
    ).length;
  }, [termFilteredAssessments]);

  const completionRate = useMemo(() => {
    const rows = schoolsDashboard?.schools ?? [];
    if (rows.length > 0) {
      const completed = rows.reduce((sum, s) => sum + s.completed_standards, 0);
      const total = rows.reduce((sum, s) => sum + s.total_standards, 0);
      return total > 0 ? (completed / total) * 100 : 0;
    }
    const completed = termFilteredAssessments.filter(
      (a) => a.status === "completed"
    ).length;
    return termFilteredAssessments.length > 0
      ? (completed / termFilteredAssessments.length) * 100
      : 0;
  }, [schoolsDashboard, termFilteredAssessments]);

  const termTrends = useMemo(() => {
    const trends = trendsData?.trends ?? [];
    const withRatings = trends
      .filter((t) => t.average_rating != null)
      .sort((a, b) => compareUniqueTermIds(a.unique_term_id, b.unique_term_id));

    const recent = withRatings.slice(-TERM_TRENDS_LIMIT);

    return recent.map((t) => ({
      term: uniqueTermIdToLabel(t.unique_term_id),
      score: t.average_rating as number,
    }));
  }, [trendsData]);

  const schoolPerformance = useMemo(() => {
    if (!schoolsDashboard?.schools?.length) return [];

    return [...schoolsDashboard.schools]
      .map((dash) => {
        const score = dash.current_score;
        return {
          school: dash.school_name,
          overallScore: score ?? 0,
          completedAssessments: dash.completed_standards,
          totalAssessments: dash.total_standards,
          status: getSchoolPerformanceLabel(score, dash.status),
          interventionRequired: (dash.intervention_required ?? 0) > 0,
        };
      })
      .sort((a, b) => b.overallScore - a.overallScore);
  }, [schoolsDashboard]);

  const recentActivity = useMemo(() => {
    const categoryNames: Record<string, string> = {
      education: "Education",
      finance: "Finance & Procurement",
      hr: "Human Resources",
      estates: "Estates",
      governance: "Governance",
      it: "IT",
      is: "Information Standards",
    };

    const isAssessmentComplete = (assessment: Assessment): boolean => {
      if (
        assessment.completedStandards !== undefined &&
        assessment.totalStandards !== undefined
      ) {
        return (
          assessment.completedStandards === assessment.totalStandards &&
          assessment.totalStandards > 0
        );
      }
      return false;
    };

    return termFilteredAssessments
      .filter((a) => a.lastUpdated && a.lastUpdated !== "-")
      .map((a) => {
        const isComplete =
          a.status === "completed" || isAssessmentComplete(a);
        const type = isComplete
          ? "Assessment Completed"
          : a.status === "in_progress"
            ? "Assessment Updated"
            : "Assessment Started";

        return {
          type,
          school: a.school?.name || a.school_name || "",
          assessment:
            a.aspect_name ||
            categoryNames[a.category ?? ""] ||
            a.category ||
            "",
          timestamp: a.last_updated || a.lastUpdated || "",
          status: a.status,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.timestamp || 0).getTime() -
          new Date(a.timestamp || 0).getTime()
      )
      .slice(0, 5);
  }, [termFilteredAssessments]);

  const totalSchools = viewSchools.length;
  const assurlyScoreSubtitle =
    dashboardView === "trust"
      ? "Central office average (1–4 scale)"
      : "Schools average (1–4 scale)";
  const totalSchoolsSubtitle =
    dashboardView === "trust"
      ? "Central office for this trust"
      : "Across the Multi-Academy Trust";
  const rankingsTitle =
    dashboardView === "trust"
      ? "Trust Performance"
      : "School Performance Rankings";
  const rankingsDescription =
    dashboardView === "trust"
      ? "Central office performance and completion for the selected term"
      : "Overall performance and completion status by school";

  const aspectRatingsEmptyMessage = useMemo(() => {
    if (aspectCategoryFilter !== "all" && aspectsConfiguredInFilter === 0) {
      return ASPECT_FILTER_EMPTY_MESSAGE[aspectCategoryFilter];
    }
    if (filteredAspectAreaRatings.length === 0) {
      return "No aspect ratings for this term yet";
    }
    return null;
  }, [
    aspectCategoryFilter,
    aspectsConfiguredInFilter,
    filteredAspectAreaRatings.length,
  ]);

  const isLoading =
    assessmentsLoading ||
    schoolsLoading ||
    aspectsLoading ||
    dashboardLoading ||
    trendsLoading ||
    aspectRatingsLoading;

  if (isLoading) {
    return (
      <div className="container max-w-7xl py-6 md:py-10">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading analytics data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl py-6 md:py-10">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive insights and performance metrics across your Multi-Academy Trust
          </p>
        </div>
        <div className="flex flex-col space-y-2 md:flex-row md:items-center md:space-y-0 md:space-x-3">
          <Tabs
            value={dashboardView}
            onValueChange={(v) => setDashboardView(v as DashboardView)}
          >
            <TabsList className="h-10">
              <TabsTrigger value="school">Schools</TabsTrigger>
              <TabsTrigger value="trust">Trust</TabsTrigger>
            </TabsList>
          </Tabs>
          {availableTerms.length > 0 && (
            <TermStepper
              terms={availableTerms}
              currentTerm={selectedTerm}
              onTermChange={setSelectedTerm}
            />
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Schools</CardTitle>
            <SchoolIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSchools}</div>
            <p className="text-xs text-muted-foreground">{totalSchoolsSubtitle}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Assessments</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAssessments}</div>
            <p className="text-xs text-muted-foreground">
              {completionRate.toFixed(0)}% standards completion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{REQUIRES_ATTENTION_LABEL}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInterventionRequired}</div>
            <p className="text-xs text-muted-foreground">
              {REQUIRES_ATTENTION_SUBTITLE}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assurly® Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {trustAssurlyScore != null ? trustAssurlyScore.toFixed(2) : "—"}
            </div>
            <p className="text-xs text-muted-foreground">{assurlyScoreSubtitle}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Term-over-Term Performance
          </CardTitle>
          <CardDescription>
            Average rating across the most recent {TERM_TRENDS_LIMIT} terms
            {dashboardView === "trust" ? " (central office)" : " (all schools)"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={termTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="term" stroke="#64748b" fontSize={12} />
                <YAxis domain={[1, 4]} stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                  }}
                  formatter={(value: number) => [value.toFixed(2), "Score"]}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke={CHART_COLORS.primary}
                  strokeWidth={3}
                  dot={{ fill: CHART_COLORS.primary, strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Ratings by Aspects
              </CardTitle>
              <CardDescription>
                Average rating per assessment area for the selected term and view
              </CardDescription>
            </div>
            <Tabs
              value={aspectCategoryFilter}
              onValueChange={(v) =>
                setAspectCategoryFilter(v as AspectCategoryFilter)
              }
            >
              <TabsList className="h-9">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="strategic">Strategic</TabsTrigger>
                <TabsTrigger value="operational">Operational</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {aspectRatingsEmptyMessage ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              {aspectRatingsEmptyMessage}
            </p>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={filteredAspectAreaRatings}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="category"
                    stroke="#64748b"
                    fontSize={11}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis domain={[0, 4]} stroke="#64748b" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "6px",
                    }}
                    formatter={(value: number) => [
                      `${value.toFixed(1)}/4.0`,
                      "Average Rating",
                    ]}
                  />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                    {filteredAspectAreaRatings.map((entry, index) => (
                      <Cell
                        key={entry.aspectCode}
                        fill={
                          ASPECT_CHART_PALETTE[
                            index % ASPECT_CHART_PALETTE.length
                          ]
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {rankingsTitle}
            </CardTitle>
            <CardDescription>{rankingsDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>School</TableHead>
                  <TableHead>Current Score</TableHead>
                  <TableHead>Completion Rate</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schoolPerformance.map((school) => (
                  <TableRow key={school.school}>
                    <TableCell className="font-medium">{school.school}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">
                          {school.overallScore > 0
                            ? school.overallScore.toFixed(2)
                            : "N/A"}
                        </span>
                        {school.overallScore > 0 && (
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor:
                                school.overallScore >= 3.5
                                  ? RATING_COLORS[4]
                                  : school.overallScore >= 2.5
                                    ? RATING_COLORS[3]
                                    : school.overallScore >= 1.5
                                      ? RATING_COLORS[2]
                                      : RATING_COLORS[1],
                            }}
                          />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {school.completedAssessments}/{school.totalAssessments}
                        <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                          <div
                            className="bg-primary h-1.5 rounded-full transition-all"
                            style={{
                              width: `${
                                school.totalAssessments > 0
                                  ? (school.completedAssessments /
                                      school.totalAssessments) *
                                    100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          school.status === "Critical"
                            ? "destructive"
                            : school.status === "Needs improvement"
                              ? "secondary"
                              : school.status === "Strong"
                                ? "default"
                                : "outline"
                        }
                        className={
                          school.status === "Strong"
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : ""
                        }
                      >
                        {school.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest assessment updates and submissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3 text-sm">
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2" />
                    <div className="flex-1">
                      <p className="font-medium">{activity.type}</p>
                      <p className="text-muted-foreground">
                        {activity.school} - {activity.assessment}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {activity.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No recent activity</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
