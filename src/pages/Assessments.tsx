import { useState, useMemo } from "react";
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
  mockAssessmentsAdmin,
  mockAssessmentsForDeptHead,
  mockSchools,
} from "@/lib/mock-data";
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
import type { Assessment, AssessmentCategory } from "@/types/assessment";
import { cn } from "@/lib/utils";

export function AssessmentsPage() {
  const { role } = useUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<AssessmentCategory | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "in-progress" | "not-started" | "overdue">("all");
  const [schoolFilter, setSchoolFilter] = useState<string>("all");
  const [view, setView] = useState<"table" | "cards">("table");
  
  const isMatAdmin = role === "mat-admin";
  const assessments = isMatAdmin ? mockAssessmentsAdmin : mockAssessmentsForDeptHead;
  
  const uniqueSchools = useMemo(() => {
    const schools = [...new Set(assessments.map(a => a.school.id))];
    return mockSchools.filter(school => schools.includes(school.id));
  }, [assessments]);

  const filteredAssessments = assessments.filter((assessment) => {
    // Search term filter
    const matchesSearch = 
      assessment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assessment.school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assessment.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Category filter
    const matchesCategory = categoryFilter === "all" || assessment.category === categoryFilter;
    
    // Status filter
    const matchesStatus = 
      statusFilter === "all" || 
      (statusFilter === "completed" && assessment.status === "Completed") ||
      (statusFilter === "in-progress" && assessment.status === "In Progress") ||
      (statusFilter === "not-started" && assessment.status === "Not Started") ||
      (statusFilter === "overdue" && assessment.status === "Overdue");
    
    // School filter
    const matchesSchool = schoolFilter === "all" || assessment.school.id === schoolFilter;

    return matchesSearch && matchesCategory && matchesStatus && matchesSchool;
  });

  const uniqueCategories = [...new Set(assessments.map(a => a.category))];
  
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

  // Calculate how many assessments are overdue or in-progress
  const overdueCount = assessments.filter(a => a.status === "Overdue").length;
  const inProgressCount = assessments.filter(a => a.status === "In Progress").length;
  
  return (
    <div className="container py-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isMatAdmin ? "All Assessments" : "My Assessments"}
          </h1>
          <p className="text-muted-foreground">
            {isMatAdmin
              ? "View and manage assessments across all schools."
              : `You have ${overdueCount} overdue and ${inProgressCount} in-progress assessments.`}
          </p>
        </div>
        <Button className="flex items-center gap-2 self-start">
          <PlusCircle className="h-4 w-4" />
          New Assessment
        </Button>
      </div>

      <div className="space-y-5">
        <Card className="border-slate-200">
          <CardHeader className="p-4 pb-2">
            <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
              <div className="flex flex-1 items-center space-x-2">
                <div className="relative flex-1 md:max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search assessments..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-1">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className={cn(
                      "h-9 w-9 p-0", 
                      view === "table" ? "bg-slate-50" : ""
                    )}
                    onClick={() => setView("table")}
                  >
                    <Layers className="h-4 w-4" />
                    <span className="sr-only">Table view</span>
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {uniqueSchools.length > 1 && (
                  <Select value={schoolFilter} onValueChange={setSchoolFilter}>
                    <SelectTrigger className="h-9 w-full md:w-[180px] bg-white gap-1">
                      <SchoolIcon className="h-4 w-4 text-muted-foreground opacity-70" />
                      <SelectValue placeholder="All Schools" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Schools</SelectItem>
                      {uniqueSchools.map((school) => (
                        <SelectItem key={school.id} value={school.id}>
                          {school.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as AssessmentCategory | "all")}>
                  <SelectTrigger className="h-9 w-full md:w-[180px] bg-white">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {uniqueCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter as any}>
                  <SelectTrigger className="h-9 w-full md:w-[180px] bg-white">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="not-started">Not Started</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="py-3">Assessment</TableHead>
                  <TableHead>School</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssessments.length === 0 ? (
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
                          onClick={() => {
                            setSearchTerm("");
                            setCategoryFilter("all");
                            setStatusFilter("all");
                            setSchoolFilter("all");
                          }}
                        >
                          Clear all filters
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAssessments.map((assessment) => (
                    <TableRow key={assessment.id} className="group">
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span className="group-hover:text-primary transition-colors">
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
                          {assessment.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div 
                              className={cn(
                                "h-full rounded-full", 
                                assessment.completedStandards === 0 ? "bg-slate-200" :
                                assessment.completedStandards === assessment.totalStandards ? "bg-emerald-500" :
                                assessment.status === "Overdue" ? "bg-rose-500" : "bg-indigo-500"
                              )} 
                              style={{ 
                                width: `${(assessment.completedStandards / assessment.totalStandards) * 100}%` 
                              }}
                            ></div>
                          </div>
                          <span className="text-sm whitespace-nowrap">
                            {assessment.completedStandards}/{assessment.totalStandards}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div 
                          className={cn(
                            "inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium",
                            assessment.status === "Overdue" ? "bg-rose-50 text-rose-700 border border-rose-100" : 
                            assessment.dueDate ? "bg-amber-50 text-amber-700 border border-amber-100" : "bg-slate-50 text-slate-600 border border-slate-100"
                          )}
                        >
                          <Calendar className="h-3.5 w-3.5" />
                          <span>
                            {assessment.dueDate || "No deadline"}
                            {assessment.status === "Overdue" && " (Overdue)"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("gap-1 font-medium", getStatusColor(assessment.status))}>
                          {getStatusIcon(assessment.status)}
                          {assessment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 group-hover:border-primary group-hover:text-primary transition-colors"
                          asChild
                        >
                          <Link to={`/assessments/${assessment.id}`}>
                            {assessment.status === "Not Started" || assessment.status === "In Progress"
                              ? (role === "department-head" ? "Continue" : "View")
                              : "View"}
                            <ChevronRight className="h-4 w-4" />
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

        {role === "department-head" && filteredAssessments.length > 0 && (
          <p className="text-xs text-muted-foreground italic">
            Tip: Click on any assessment to view details or continue your progress. You can filter by school, category, or status.
          </p>
        )}
      </div>
    </div>
  );
} 