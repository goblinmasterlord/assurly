import React, { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users, 
  School as SchoolIcon,
  ClipboardCheck,
  AlertTriangle,
  Calendar,
  FileText,
  Target,
  Award
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
  PieChart,
  Pie
} from "recharts";
import { useAssessments, useSchools } from "@/hooks/use-assessments";
import type { Assessment, AssessmentCategory, School } from "@/types/assessment";
import { RatingLabels } from "@/types/assessment";
import { TermStepper } from "@/components/ui/term-stepper";

// Professional education sector color scheme
const CHART_COLORS = {
  primary: '#1e40af', // Blue
  secondary: '#64748b', // Slate
  success: '#16a34a', // Green
  warning: '#d97706', // Amber
  danger: '#dc2626', // Red
  info: '#0ea5e9', // Sky blue
  muted: '#94a3b8' // Light slate
};

// Harmonious colors for each assessment category
const CATEGORY_COLORS: Partial<Record<AssessmentCategory, string>> = {
  'education': '#3b82f6', // Blue
  'finance': '#10b981', // Emerald
  'hr': '#8b5cf6', // Violet
  'estates': '#f59e0b', // Amber
  'governance': '#ef4444', // Red
  'it': '#06b6d4', // Cyan
  'is': '#84cc16' // Lime
};

const RATING_COLORS = {
  1: '#dc2626', // Inadequate - Red
  2: '#d97706', // Requires Improvement - Amber
  3: '#16a34a', // Good - Green
  4: '#1e40af', // Outstanding - Blue
};

const ASSESSMENT_CATEGORIES: AssessmentCategory[] = [
  'education',
  'finance', 
  'hr',
  'estates',
  'governance',
  'it',
  'is'
];

// Helper to convert backend category codes to display names
const getCategoryDisplayName = (category: AssessmentCategory): string => {
  const displayNames: Partial<Record<AssessmentCategory, string>> = {
    'education': 'Education',
    'finance': 'Finance &\nProcurement',
    'hr': 'Human\nResources',
    'estates': 'Estates',
    'governance': 'Governance',
    'it': 'IT & Info\nServices',
    'is': 'Information\nServices'
  };
  return displayNames[category] || category;
};

interface AnalyticsData {
  totalSchools: number;
  activeAssessments: number;
  completionRate: number;
  averageScore: number;
  previousAverageScore: number;
  schoolsRequiringIntervention: number;
  complianceStatus: number;
  termTrends: Array<{
    term: string;
    score: number;
  }>;
  categoryPerformance: Array<{
    category: string;
    score: number;
    assessments: number;
  }>;
  schoolPerformance: Array<{
    school: string;
    overallScore: number;
    completedAssessments: number;
    totalAssessments: number;
    status: string;
    interventionRequired: boolean;
  }>;
  recentActivity: Array<{
    type: string;
    school: string;
    assessment: string;
    timestamp: string;
    status: string;
  }>;
}

export function AnalyticsPage() {
  const { assessments, isLoading: assessmentsLoading } = useAssessments();
  const { schools, isLoading: schoolsLoading } = useSchools();
  const [selectedTerm, setSelectedTerm] = React.useState<string>("Autumn 2025-2026");

  const isLoading = assessmentsLoading || schoolsLoading;

  // Extract available terms from assessments
  const availableTerms = useMemo(() => {
    const termSet = new Set<string>();
    assessments.forEach(assessment => {
      if (assessment.term && assessment.academicYear) {
        termSet.add(`${assessment.term} ${assessment.academicYear}`);
      }
    });
    
    // Convert to array and sort (newest first)
    const terms = Array.from(termSet).sort((a, b) => {
      const termOrder: Record<string, number> = { 'Autumn': 3, 'Spring': 2, 'Summer': 1 };
      const [termA, yearA] = a.split(' ');
      const [termB, yearB] = b.split(' ');
      
      // Compare years first (descending)
      if (yearA !== yearB) {
        return yearB.localeCompare(yearA);
      }
      // Then compare terms (descending within year)
      return (termOrder[termB] || 0) - (termOrder[termA] || 0);
    });
    
    return terms;
  }, [assessments]);

  // Auto-select term
  React.useEffect(() => {
    if (availableTerms.length > 0 && !availableTerms.includes(selectedTerm)) {
      // Try to find Autumn 2025-2026, otherwise use first available
      const defaultTerm = availableTerms.find(t => t === "Autumn 2025-2026") || availableTerms[0];
      setSelectedTerm(defaultTerm);
    }
  }, [availableTerms, selectedTerm]);

  // Filter assessments by selected term
  const termFilteredAssessments = useMemo(() => {
    if (!selectedTerm) return [];
    const [term, academicYear] = selectedTerm.split(" ");
    return assessments.filter(assessment => 
      assessment.term === term && assessment.academicYear === academicYear
    );
  }, [assessments, selectedTerm]);

  // Calculate analytics data from real assessment data
  const analyticsData: AnalyticsData = useMemo(() => {
    if (termFilteredAssessments.length === 0 || schools.length === 0) {
      // Return minimal data structure if no data available
      return {
        totalSchools: 0,
        activeAssessments: 0,
        completionRate: 0,
        averageScore: 0,
        previousAverageScore: 0,
        schoolsRequiringIntervention: 0,
        complianceStatus: 0,
        termTrends: [],
        categoryPerformance: [],
        schoolPerformance: [],
        recentActivity: []
      };
    }
    
    // Use term-filtered assessments for current term calculations
    const currentTermAssessments = termFilteredAssessments;

    // Helper: Calculate average score from standards ratings
    const calculateAssessmentScore = (assessment: Assessment): number => {
      if (!assessment.standards || assessment.standards.length === 0) return 0;
      const ratedStandards = assessment.standards.filter(s => s.rating !== null);
      if (ratedStandards.length === 0) return 0;
      const sum = ratedStandards.reduce((acc, s) => acc + (s.rating || 0), 0);
      return sum / ratedStandards.length;
    };

    // Helper: Determine if school needs intervention (any completed assessment with avg score < 2.0)
    const needsIntervention = (schoolAssessments: Assessment[]): boolean => {
      return schoolAssessments.some(a => {
        if (a.status !== 'Completed') return false;
        const score = calculateAssessmentScore(a);
        return score < 2.0;
      });
    };

    // Helper: Get status label for school
    const getSchoolStatus = (avgScore: number, hasOverdue: boolean): string => {
      if (avgScore === 0) return 'Not Started';
      if (avgScore < 1.5) return 'Critical';
      if (avgScore < 2.0 || hasOverdue) return 'Needs Attention';
      if (avgScore >= 3.5) return 'Excellent';
      return 'Good';
    };

    // 1. Calculate basic metrics
    const totalSchools = schools.length;
    const activeAssessments = currentTermAssessments.filter(a => a.status === 'In Progress' || a.status === 'Overdue').length;
    const completedAssessments = currentTermAssessments.filter(a => a.status === 'Completed').length;
    const completionRate = currentTermAssessments.length > 0 
      ? (completedAssessments / currentTermAssessments.length) * 100 
      : 0;

    // 2. Calculate current average score from completed assessments
    const completedWithRatings = currentTermAssessments.filter(a => a.status === 'Completed');
    const currentScores = completedWithRatings.map(calculateAssessmentScore).filter(s => s > 0);
    const averageScore = currentScores.length > 0
      ? currentScores.reduce((sum, s) => sum + s, 0) / currentScores.length
      : 0;

    // 3. Calculate previous term average for comparison
    const previousTermAssessments = assessments.filter(a => a.term === 'Spring' && a.academicYear === '2024-2025');
    const previousCompleted = previousTermAssessments.filter(a => a.status === 'Completed');
    const previousScores = previousCompleted.map(calculateAssessmentScore).filter(s => s > 0);
    const previousAverageScore = previousScores.length > 0
      ? previousScores.reduce((sum, s) => sum + s, 0) / previousScores.length
      : averageScore - 0.2; // Fallback if no historical data

    // 4. Calculate term trends (group by term/year)
    const termMap = new Map<string, number[]>();
    assessments.forEach(assessment => {
      if (assessment.status === 'Completed' && assessment.term && assessment.academicYear) {
        const key = `${assessment.term} ${assessment.academicYear.split('-')[0].slice(-2)}-${assessment.academicYear.split('-')[1].slice(-2)}`;
        const score = calculateAssessmentScore(assessment);
        if (score > 0) {
          if (!termMap.has(key)) termMap.set(key, []);
          termMap.get(key)!.push(score);
        }
      }
    });
    
    const termTrends = Array.from(termMap.entries())
      .map(([term, scores]) => ({
        term,
        score: scores.reduce((sum, s) => sum + s, 0) / scores.length
      }))
      .sort((a, b) => {
        // Sort chronologically
        const termOrder = { 'Autumn': 1, 'Spring': 2, 'Summer': 3 };
        const [termA, yearA] = a.term.split(' ');
        const [termB, yearB] = b.term.split(' ');
        if (yearA !== yearB) return yearA.localeCompare(yearB);
        return (termOrder[termA as keyof typeof termOrder] || 0) - (termOrder[termB as keyof typeof termOrder] || 0);
      });

    // 5. Calculate category performance
    const categoryMap = new Map<AssessmentCategory, { scores: number[], count: number }>();
    ASSESSMENT_CATEGORIES.forEach(cat => categoryMap.set(cat, { scores: [], count: 0 }));
    
    currentTermAssessments.forEach(assessment => {
      const catData = categoryMap.get(assessment.category);
      if (catData) {
        catData.count++;
        if (assessment.status === 'Completed') {
          const score = calculateAssessmentScore(assessment);
          if (score > 0) catData.scores.push(score);
        }
      }
    });

    const categoryPerformance = ASSESSMENT_CATEGORIES.map(cat => {
      const catData = categoryMap.get(cat)!;
      const avgScore = catData.scores.length > 0
        ? catData.scores.reduce((sum, s) => sum + s, 0) / catData.scores.length
        : 0;
      return {
        category: getCategoryDisplayName(cat),
        score: avgScore,
        assessments: catData.count
      };
    });

    // 6. Calculate school performance
    const schoolMap = new Map<string, Assessment[]>();
    schools.forEach(school => schoolMap.set(school.id, []));
    currentTermAssessments.forEach(assessment => {
      const schoolAssessments = schoolMap.get(assessment.school.id);
      if (schoolAssessments) schoolAssessments.push(assessment);
    });

    const schoolPerformance = schools.map(school => {
      const schoolAssessments = schoolMap.get(school.id) || [];
      const completed = schoolAssessments.filter(a => a.status === 'Completed');
      const hasOverdue = schoolAssessments.some(a => a.status === 'Overdue');
      
      const scores = completed.map(calculateAssessmentScore).filter(s => s > 0);
      const overallScore = scores.length > 0
        ? Number((scores.reduce((sum, s) => sum + s, 0) / scores.length).toFixed(1))
        : 0;

      return {
        school: school.name,
        overallScore,
        completedAssessments: completed.length,
        totalAssessments: schoolAssessments.length,
        status: getSchoolStatus(overallScore, hasOverdue),
        interventionRequired: needsIntervention(schoolAssessments)
      };
    }).sort((a, b) => b.overallScore - a.overallScore); // Sort by score descending

    // 7. Calculate schools requiring intervention
    const schoolsRequiringIntervention = schoolPerformance.filter(s => s.interventionRequired).length;

    // 8. Generate recent activity from assessment updates
    const recentActivity = currentTermAssessments
      .filter(a => a.lastUpdated && a.lastUpdated !== '-')
      .map(a => {
        const type = a.status === 'Completed' ? 'Assessment Completed' :
                    a.status === 'In Progress' ? 'Assessment Updated' :
                    'Assessment Started';
        
        // Format category name for display
        const categoryNames: Record<string, string> = {
          'education': 'Education',
          'finance': 'Finance & Procurement',
          'hr': 'Human Resources',
          'estates': 'Estates',
          'governance': 'Governance',
          'it': 'IT & Information Services',
          'is': 'Information Services'
        };

        return {
          type,
          school: a.school.name,
          assessment: categoryNames[a.category] || a.category,
          timestamp: a.lastUpdated,
          status: a.status
        };
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5); // Show top 5 most recent

    return {
      totalSchools,
      activeAssessments,
      completionRate,
      averageScore,
      previousAverageScore,
      schoolsRequiringIntervention,
      complianceStatus: completionRate,
      termTrends,
      categoryPerformance,
      schoolPerformance,
      recentActivity
    };
  }, [termFilteredAssessments, assessments, schools]);

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

  const scoreChange = analyticsData.averageScore - analyticsData.previousAverageScore;
  const isImproving = scoreChange >= 0;

  return (
    <div className="container max-w-7xl py-6 md:py-10">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive insights and performance metrics across your Multi-Academy Trust
          </p>
        </div>
        {availableTerms.length > 0 && (
          <TermStepper
            terms={availableTerms}
            currentTerm={selectedTerm}
            onTermChange={setSelectedTerm}
          />
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Schools</CardTitle>
            <SchoolIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalSchools}</div>
            <p className="text-xs text-muted-foreground">
              Across the Multi-Academy Trust
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Assessments</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.activeAssessments}</div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.completionRate.toFixed(0)}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            {isImproving ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.averageScore.toFixed(1)}</div>
            <p className={`text-xs ${
              isImproving ? 'text-green-600' : 'text-red-600'
            }`}>
              {isImproving ? '+' : ''}{scoreChange.toFixed(1)} from previous term
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interventions Required</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.schoolsRequiringIntervention}</div>
            <p className="text-xs text-muted-foreground">
              Schools below threshold
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Status</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.complianceStatus.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">
              Assessment completion
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        
        {/* Term Performance Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Term-over-Term Performance
            </CardTitle>
            <CardDescription>
              Assessment scoring trends across the last 3 terms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analyticsData.termTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="term" 
                    stroke="#64748b"
                    fontSize={12}
                  />
                  <YAxis 
                    domain={[1, 4]}
                    stroke="#64748b"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px'
                    }}
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

        {/* Assessment Area Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Assessment Completion
            </CardTitle>
            <CardDescription>
              Progress across assessment areas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.categoryPerformance.map((cat, index) => {
                const category = ASSESSMENT_CATEGORIES[index];
                const color = CATEGORY_COLORS[category] || CHART_COLORS.muted;
                return (
                  <div key={cat.category} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{cat.category}</span>
                      <span className="text-muted-foreground">{cat.score}/4.0</span>
                    </div>
                    <Progress 
                      value={(cat.score / 4) * 100} 
                      className="h-2"
                      style={{ 
                        "--progress-foreground": color 
                      } as React.CSSProperties}
                    />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assessment Area Performance Chart */}
      <div className="grid gap-6 md:grid-cols-1 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Assessment Area Performance Breakdown
            </CardTitle>
            <CardDescription>
              Average scores across all 6 assessment areas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.categoryPerformance} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="category" 
                    stroke="#64748b"
                    fontSize={11}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    domain={[0, 4]}
                    stroke="#64748b"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px'
                    }}
                    formatter={(value: number) => [`${value.toFixed(1)}/4.0`, 'Average Score']}
                  />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                    {analyticsData.categoryPerformance.map((entry, index) => {
                      // Get category from ASSESSMENT_CATEGORIES array to match with colors
                      const category = ASSESSMENT_CATEGORIES[index];
                      const color = CATEGORY_COLORS[category] || CHART_COLORS.muted;
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* School Performance Table and Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        
        {/* School Performance Rankings */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              School Performance Rankings
            </CardTitle>
            <CardDescription>
              Overall performance and completion status by school
            </CardDescription>
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
                {analyticsData.schoolPerformance.map((school) => (
                  <TableRow key={school.school}>
                    <TableCell className="font-medium">{school.school}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">{school.overallScore || 'N/A'}</span>
                        {school.overallScore > 0 && (
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ 
                              backgroundColor: school.overallScore >= 3.5 ? RATING_COLORS[4] :
                                             school.overallScore >= 2.5 ? RATING_COLORS[3] :
                                             school.overallScore >= 1.5 ? RATING_COLORS[2] : RATING_COLORS[1]
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
                              width: `${school.totalAssessments > 0 ? (school.completedAssessments / school.totalAssessments) * 100 : 0}%` 
                            }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={school.status === 'Critical' ? 'destructive' : 
                                school.status === 'Needs Attention' ? 'secondary' :
                                school.status === 'Excellent' ? 'default' : 'outline'}
                        className={school.status === 'Excellent' ? 'bg-green-100 text-green-800 hover:bg-green-200' : ''}
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

        {/* Recent Activity */}
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
              {analyticsData.recentActivity.length > 0 ? (
                analyticsData.recentActivity.map((activity, index) => (
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
