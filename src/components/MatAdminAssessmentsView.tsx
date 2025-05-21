import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import type { Assessment, AssessmentCategory, Standard } from "@/types/assessment";
import { RatingLabels } from "@/types/assessment";
import { cn } from "@/lib/utils";
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
  XCircle,
  Clock3,
  CheckSquare,
  Users,
  FileText,
  BookOpen,
  ClipboardCheck,
  SendHorizonal
} from "lucide-react";
import { mockSchools, mockUsers } from "@/lib/mock-data";
import { AssessmentInvitationSheet } from "@/components/AssessmentInvitationSheet";

type AssessmentsViewProps = {
  assessments: Assessment[];
}

export function MatAdminAssessmentsView({ assessments }: AssessmentsViewProps) {
  const [activeTab, setActiveTab] = useState("completed");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<AssessmentCategory | "all">("all");
  const [schoolFilter, setSchoolFilter] = useState<string>("all");
  const [invitationSheetOpen, setInvitationSheetOpen] = useState(false);

  // Get unique schools from assessments
  const uniqueSchools = useMemo(() => {
    const schools = [...new Set(assessments.map(a => a.school.id))];
    return mockSchools.filter(school => schools.includes(school.id));
  }, [assessments]);

  // Get unique categories from assessments
  const uniqueCategories = [...new Set(assessments.map(a => a.category))];

  // Filter assessments based on search, category, and school
  const filteredAssessments = useMemo(() => {
    return assessments.filter((assessment) => {
      // First filter by status based on active tab
      const matchesStatus = 
        (activeTab === "completed" && assessment.status === "Completed") ||
        (activeTab === "ongoing" && ["In Progress", "Not Started", "Overdue"].includes(assessment.status));
      
      if (!matchesStatus) return false;
      
      // Then apply other filters
      const matchesSearch = 
        assessment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assessment.school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assessment.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = categoryFilter === "all" || assessment.category === categoryFilter;
      const matchesSchool = schoolFilter === "all" || assessment.school.id === schoolFilter;
      
      return matchesSearch && matchesCategory && matchesSchool;
    });
  }, [assessments, activeTab, searchTerm, categoryFilter, schoolFilter]);

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

  // Calculate average rating for each standard category in a specific assessment
  const calculateCategoryAverages = (assessment: Assessment) => {
    if (!assessment.standards || assessment.standards.length === 0) {
      return {};
    }

    const standardsByCode: Record<string, Standard[]> = {};
    
    // Group standards by their code prefix (e.g., ES1, ES2 into ES)
    assessment.standards.forEach(standard => {
      const prefix = standard.code.substring(0, 2);
      if (!standardsByCode[prefix]) {
        standardsByCode[prefix] = [];
      }
      standardsByCode[prefix].push(standard);
    });

    // Calculate average for each group
    const averages: Record<string, { average: number, count: number, title: string }> = {};
    
    Object.entries(standardsByCode).forEach(([prefix, standards]) => {
      const validStandards = standards.filter(s => s.rating !== null);
      if (validStandards.length > 0) {
        const sum = validStandards.reduce((acc, s) => acc + (s.rating || 0), 0);
        averages[prefix] = {
          average: sum / validStandards.length,
          count: validStandards.length,
          // Use the title from the first standard as the category title
          title: standards[0].title.split(' ')[0] + ' ' + standards[0].title.split(' ')[1]
        };
      }
    });

    return averages;
  };

  // Calculate overall average rating for an assessment
  const calculateOverallAverage = (assessment: Assessment) => {
    if (!assessment.standards || assessment.standards.length === 0) {
      return 0;
    }

    const validStandards = assessment.standards.filter(s => s.rating !== null);
    if (validStandards.length === 0) return 0;
    
    const sum = validStandards.reduce((acc, s) => acc + (s.rating || 0), 0);
    return sum / validStandards.length;
  };

  // Helper function to get the color for a rating
  const getRatingColor = (rating: number) => {
    if (rating < 2) return "bg-rose-500";
    if (rating < 3) return "bg-amber-500";
    if (rating < 4) return "bg-emerald-500";
    return "bg-indigo-600";
  };

  // Helper function to get the text color for a rating
  const getRatingTextColor = (rating: number) => {
    if (rating < 2) return "text-rose-700";
    if (rating < 3) return "text-amber-700";
    if (rating < 4) return "text-emerald-700";
    return "text-indigo-700";
  };
  
  // Helper to get the category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Education":
        return <BookOpen className="h-4 w-4" />;
      case "Human Resources":
        return <Users className="h-4 w-4" />;
      case "Finance & Procurement":
        return <FileText className="h-4 w-4" />;
      case "Governance":
        return <ClipboardCheck className="h-4 w-4" />;
      default:
        return null;
    }
  };

  // Helper to get assigned users for display
  const getAssignedUsers = (assessment: Assessment) => {
    if (!assessment.assignedTo || assessment.assignedTo.length === 0) return "Unassigned";
    
    if (assessment.assignedTo.length === 1) {
      return assessment.assignedTo[0].name;
    }
    
    return `${assessment.assignedTo[0].name} + ${assessment.assignedTo.length - 1} more`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Assessments</h1>
        <Button 
          onClick={() => setInvitationSheetOpen(true)} 
          className="gap-2"
        >
          <SendHorizonal className="h-4 w-4" />
          Request Assessment
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="mb-8 border-b">
          <TabsList className="w-full justify-start rounded-none border-b-0 bg-transparent p-0">
            <TabsTrigger 
              value="completed" 
              className="relative rounded-none border-b-2 border-transparent px-4 py-3 font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                Completed
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="ongoing" 
              className="relative rounded-none border-b-2 border-transparent px-4 py-3 font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              <div className="flex items-center gap-2">
                <Clock3 className="h-4 w-4" />
                Ongoing
              </div>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Completed Assessments Tab with drill-down capability */}
        <TabsContent value="completed" className="mt-0">
          <Card className="border-slate-200">
            <CardHeader className="p-5 pb-3">
              <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
                <div className="flex flex-1 items-center space-x-2">
                  <div className="relative flex-1 md:max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search completed assessments..."
                      className="pl-9"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  {uniqueSchools.length > 1 && (
                    <Select value={schoolFilter} onValueChange={setSchoolFilter}>
                      <SelectTrigger className="h-9 w-full md:w-[180px] bg-white gap-1.5">
                        <SchoolIcon className="h-3.5 w-3.5 text-muted-foreground opacity-70" />
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
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-5 pt-0 pb-5">
              {filteredAssessments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <XCircle className="h-12 w-12 mb-3 opacity-20" />
                  <p>No completed assessments found matching your filters.</p>
                  <Button 
                    variant="link" 
                    className="mt-2"
                    onClick={() => {
                      setSearchTerm("");
                      setCategoryFilter("all");
                      setSchoolFilter("all");
                    }}
                  >
                    Clear all filters
                  </Button>
                </div>
              ) : (
                <div className="space-y-5">
                  {filteredAssessments.map((assessment) => {
                    const categoryAverages = calculateCategoryAverages(assessment);
                    const overallAverage = calculateOverallAverage(assessment);
                    
                    return (
                      <Accordion 
                        type="single" 
                        collapsible 
                        key={assessment.id}
                        className="border rounded-lg overflow-hidden shadow-sm hover:shadow transition-shadow"
                      >
                        <AccordionItem value="item-1" className="border-0">
                          <AccordionTrigger className="px-5 py-4 hover:bg-slate-50 data-[state=open]:bg-slate-50">
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-50 border border-emerald-100">
                                  <SchoolIcon className="h-5 w-5 text-emerald-600" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <div className="font-medium text-base truncate">{assessment.school.name}</div>
                                  <div className="flex items-center flex-wrap gap-2 text-xs text-slate-600 mt-0.5">
                                    <Badge variant="outline" className="bg-slate-50 font-normal text-xs py-0 h-5">
                                      {assessment.category}
                                    </Badge>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      Completed {assessment.lastUpdated}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-5">
                                <div className="flex items-center gap-2.5">
                                  <div className={`flex items-center justify-center h-9 w-9 rounded-full ${getRatingColor(overallAverage)} ring-4 ring-opacity-20 ${getRatingColor(overallAverage).replace('bg-', 'ring-')}`}>
                                    <span className="text-white font-medium text-sm">{overallAverage.toFixed(1)}</span>
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-xs font-medium">Overall Score</span>
                                    <span className="text-xs text-slate-500">
                                      {assessment.completedStandards}/{assessment.totalStandards} Standards
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-5 pb-5 pt-0 border-t">
                            <div className="space-y-6">
                              {/* Assessment metadata */}
                              <div className="flex flex-wrap gap-5 text-sm pt-5 pb-1 text-slate-600">
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground">Assessment:</span>
                                  <span className="font-medium text-slate-900">{assessment.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground">Completed on:</span>
                                  <span className="font-medium text-slate-900">{assessment.lastUpdated}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground">Assigned to:</span>
                                  <span className="font-medium text-slate-900">{getAssignedUsers(assessment)}</span>
                                </div>
                              </div>
                              
                              {/* Performance Summary */}
                              <div>
                                <h3 className="text-sm font-medium mb-3 text-slate-900">Performance by Area</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                  {Object.entries(categoryAverages).map(([key, { average, title }]) => (
                                    <div key={key} className="flex items-center gap-3 p-3.5 border rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                                      <div className={`flex items-center justify-center h-11 w-11 rounded-full ${getRatingColor(average)} ring-4 ring-opacity-20 ${getRatingColor(average).replace('bg-', 'ring-')}`}>
                                        <span className="text-white font-medium">{average.toFixed(1)}</span>
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="font-medium text-sm text-slate-900">{title}</span>
                                        <span className={`text-xs ${getRatingTextColor(average)}`}>
                                          {average >= 3.5 ? "Outstanding" : 
                                           average >= 2.5 ? "Good" : 
                                           average >= 1.5 ? "Requires Improvement" : "Inadequate"}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              {/* Standards table */}
                              <div>
                                <h3 className="text-sm font-medium mb-3 text-slate-900">Standards Rating Summary</h3>
                                <div className="rounded-lg overflow-hidden border">
                                  <Table>
                                    <TableHeader>
                                      <TableRow className="bg-slate-50">
                                        <TableHead className="w-[90px]">Standard</TableHead>
                                        <TableHead>Title</TableHead>
                                        <TableHead className="text-center w-[90px]">Rating</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {assessment.standards && assessment.standards.map((standard) => (
                                        <TableRow key={standard.id} className="group">
                                          <TableCell className="font-medium">{standard.code}</TableCell>
                                          <TableCell>
                                            <div className="flex flex-col">
                                              <span className="group-hover:text-primary transition-colors">{standard.title}</span>
                                              <span className="text-xs text-muted-foreground line-clamp-1">
                                                {standard.description}
                                              </span>
                                            </div>
                                          </TableCell>
                                          <TableCell className="text-center">
                                            {standard.rating ? (
                                              <div className="flex justify-center">
                                                <div className={`flex items-center justify-center h-8 w-8 rounded-full ${getRatingColor(standard.rating)}`}>
                                                  <span className="text-white font-medium">{standard.rating}</span>
                                                </div>
                                              </div>
                                            ) : (
                                              <span className="text-sm text-muted-foreground">-</span>
                                            )}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                      {(!assessment.standards || assessment.standards.length === 0) && (
                                        <TableRow>
                                          <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                            No standards data available
                                          </TableCell>
                                        </TableRow>
                                      )}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                              
                              <div className="flex justify-end">
                                <Button
                                  size="sm"
                                  className="gap-1.5"
                                  asChild
                                >
                                  <Link to={`/assessments/${assessment.id}`}>
                                    View Full Assessment
                                    <ChevronRight className="h-4 w-4" />
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ongoing Assessments Tab */}
        <TabsContent value="ongoing" className="mt-0">
          <Card className="border-slate-200">
            <CardHeader className="p-5 pb-3">
              <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
                <div className="flex flex-1 items-center space-x-2">
                  <div className="relative flex-1 md:max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search ongoing assessments..."
                      className="pl-9"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  {uniqueSchools.length > 1 && (
                    <Select value={schoolFilter} onValueChange={setSchoolFilter}>
                      <SelectTrigger className="h-9 w-full md:w-[180px] bg-white gap-1.5">
                        <SchoolIcon className="h-3.5 w-3.5 text-muted-foreground opacity-70" />
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
                            <Progress 
                              value={(assessment.completedStandards / assessment.totalStandards) * 100} 
                              className="w-20 h-2"
                              indicatorClassName={
                                assessment.completedStandards === 0 ? "bg-slate-200" :
                                assessment.completedStandards === assessment.totalStandards ? "bg-emerald-500" :
                                assessment.status === "Overdue" ? "bg-rose-500" : "bg-indigo-500"
                              }
                            />
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
                              View
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
        </TabsContent>
      </Tabs>
      
      {/* Assessment Invitation Sheet */}
      <AssessmentInvitationSheet 
        open={invitationSheetOpen} 
        onOpenChange={setInvitationSheetOpen} 
      />
    </div>
  );
} 