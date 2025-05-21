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
import { Calendar, Filter, Plus, School, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Assessment, AssessmentCategory } from "@/types/assessment";

export function AssessmentsPage() {
  const { role } = useUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<AssessmentCategory | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "in-progress" | "not-started" | "overdue">("all");
  const [schoolFilter, setSchoolFilter] = useState<string>("all");
  
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
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "In Progress":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case "Not Started":
        return "bg-slate-100 text-slate-800 hover:bg-slate-200";
      case "Overdue":
        return "bg-red-100 text-red-800 hover:bg-red-200";
      default:
        return "bg-slate-100 text-slate-800 hover:bg-slate-200";
    }
  };
  
  return (
    <div className="container py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isMatAdmin ? "All Assessments" : "My Assessments"}
          </h1>
          <p className="text-muted-foreground">
            {isMatAdmin
              ? "View and manage assessments across all schools."
              : "View and complete your assigned assessments."}
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Assessment
        </Button>
      </div>

      <Card>
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
              <Button variant="outline" size="sm" className="h-10">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {uniqueSchools.length > 1 && (
                <Select value={schoolFilter} onValueChange={setSchoolFilter}>
                  <SelectTrigger className="w-[180px]">
                    <School className="mr-2 h-4 w-4 text-muted-foreground" />
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
                <SelectTrigger className="w-[180px]">
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
                <SelectTrigger className="w-[180px]">
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
              <TableRow>
                <TableHead>Assessment</TableHead>
                <TableHead>School</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Progress</TableHead>
                {isMatAdmin && <TableHead>Assigned To</TableHead>}
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssessments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={isMatAdmin ? 8 : 7}
                    className="h-24 text-center"
                  >
                    No assessments found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredAssessments.map((assessment) => (
                  <TableRow key={assessment.id}>
                    <TableCell className="font-medium">
                      {assessment.name}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <School className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>{assessment.school.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{assessment.category}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="bg-slate-100 w-16 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-blue-500 h-full rounded-full" 
                            style={{ 
                              width: `${(assessment.completedStandards / assessment.totalStandards) * 100}%` 
                            }}
                          ></div>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {assessment.completedStandards}/{assessment.totalStandards}
                        </span>
                      </div>
                    </TableCell>
                    {isMatAdmin && (
                      <TableCell>
                        {assessment.assignedTo && assessment.assignedTo.length > 0
                          ? assessment.assignedTo[0].name
                          : "Unassigned"}
                      </TableCell>
                    )}
                    <TableCell>
                      {assessment.dueDate ? (
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>{assessment.dueDate}</span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(assessment.status)}>
                        {assessment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <Link to={`/assessments/${assessment.id}`}>
                            {assessment.status === "Not Started" || assessment.status === "In Progress"
                              ? (role === "department-head" ? "Continue" : "View")
                              : "View"}
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 