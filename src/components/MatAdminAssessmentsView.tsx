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
  SendHorizonal,
  TableIcon,
  LayoutGrid,
  ClipboardList,
  CalendarCheck,
  UserCheck,
  AlertCircle,
  Tag,
  Check
} from "lucide-react";
import { mockSchools, mockUsers } from "@/lib/mock-data";
import { AssessmentInvitationSheet } from "@/components/AssessmentInvitationSheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";

type AssessmentsViewProps = {
  assessments: Assessment[];
}

export function MatAdminAssessmentsView({ assessments }: AssessmentsViewProps) {
  const [activeTab, setActiveTab] = useState("completed");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<AssessmentCategory | "all">("all");
  const [schoolFilter, setSchoolFilter] = useState<string>("all");
  const [invitationSheetOpen, setInvitationSheetOpen] = useState(false);
  const [completedView, setCompletedView] = useState<"cards" | "table">("cards");
  const [ongoingView, setOngoingView] = useState<"cards" | "table">("table");
  const [termFilter, setTermFilter] = useState<string[]>([]);
  const [termFilterOpen, setTermFilterOpen] = useState(false);

  // Get unique schools from assessments
  const uniqueSchools = useMemo(() => {
    const schools = [...new Set(assessments.map(a => a.school.id))];
    return mockSchools.filter(school => schools.includes(school.id));
  }, [assessments]);

  // Get unique categories from assessments
  const uniqueCategories = [...new Set(assessments.map(a => a.category))];

  // Get unique terms from assessments
  const uniqueTerms = useMemo(() => {
    const terms = [...new Set(assessments.map(a => a.term).filter(Boolean))] as string[];
    return terms.sort();
  }, [assessments]);

  // Filter assessments based on search, category, school, and term
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
      
      // New term filter logic
      const matchesTerm = termFilter.length === 0 || (assessment.term && termFilter.includes(assessment.term));

      return matchesSearch && matchesCategory && matchesSchool && matchesTerm;
    });
  }, [assessments, activeTab, searchTerm, categoryFilter, schoolFilter, termFilter]);

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

  // Helper to check if an assessment has any critical standards (rating = 1)
  const hasCriticalStandards = (assessment: Assessment) => {
    if (!assessment.standards) return false;
    return assessment.standards.some(standard => standard.rating === 1);
  };

  // Helper to count critical standards in an assessment
  const countCriticalStandards = (assessment: Assessment) => {
    if (!assessment.standards) return 0;
    return assessment.standards.filter(standard => standard.rating === 1).length;
  };

  // Helper function to get the background gradient for a rating card
  const getRatingGradient = (rating: number) => {
    if (rating < 2) return "bg-gradient-to-r from-rose-50 to-white";
    if (rating < 3) return "bg-gradient-to-r from-amber-50 to-white";
    if (rating < 4) return "bg-gradient-to-r from-emerald-50 to-white";
    return "bg-gradient-to-r from-indigo-50 to-white";
  };

  // Card view for assessments
  const renderCardView = (assessment: Assessment, isCompleted: boolean) => {
    const categoryAverages = calculateCategoryAverages(assessment);
    const overallAverage = calculateOverallAverage(assessment);
    
    return (
      <Accordion 
        type="single" 
        collapsible 
        key={assessment.id}
        className="border rounded-lg overflow-hidden hover:border-primary transition-all duration-200"
      >
        <AccordionItem value="item-1" className="border-0">
          <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-slate-50 data-[state=open]:bg-slate-50">
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
                    {assessment.term && assessment.academicYear && (
                      <Badge variant="outline" className="bg-slate-50 font-normal text-xs py-0 h-5">
                        <Tag className="h-3 w-3 mr-1" />
                        {assessment.term} {assessment.academicYear}
                      </Badge>
                    )}
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {isCompleted ? `Completed ${assessment.lastUpdated}` : assessment.dueDate ? `Due ${assessment.dueDate}` : "No deadline"}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-5">
                {isCompleted ? (
                  <div className="flex items-center gap-2.5">
                    <div className={`flex items-center justify-center h-9 w-9 rounded-md ${getRatingColor(overallAverage)} border border-white/20`}>
                      <span className="text-white font-medium text-sm">{overallAverage.toFixed(1)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium">Overall Score</span>
                      <span className="text-xs text-slate-500">
                        {assessment.completedStandards}/{assessment.totalStandards} Standards
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5">
                    <Badge className={cn("gap-1 font-medium", getStatusColor(assessment.status))}>
                      {getStatusIcon(assessment.status)}
                      {assessment.status}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </AccordionTrigger>
          {isCompleted && (
            <AccordionContent className="px-5 pb-5 pt-0 border-t">
              <div className="space-y-6">
                {/* Assessment metadata */}
                <div className="flex flex-wrap gap-5 text-sm pt-5 pb-1 text-slate-600">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Assessment:</span>
                    <span className="font-medium text-slate-900">{assessment.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Completed on:</span>
                    <span className="font-medium text-slate-900">{assessment.lastUpdated}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Assigned to:</span>
                    <span className="font-medium text-slate-900">{getAssignedUsers(assessment)}</span>
                  </div>
                </div>
                
                {/* Performance Summary */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-slate-900">Performance by Area</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {Object.entries(categoryAverages).map(([key, { average, title }]) => (
                      <div key={key} className={`flex items-center gap-3 p-3.5 border rounded-lg ${getRatingGradient(average)} hover:border-primary transition-colors`}>
                        <div className={`flex items-center justify-center h-9 w-9 rounded-md ${getRatingColor(average)}`}>
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
                
                {/* Show Problematic Standards */}
                {hasCriticalStandards(assessment) && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-900 mb-3">Critical Standards</h3>
                    <div className="border rounded-lg overflow-hidden">
                      {assessment.standards && assessment.standards
                        .filter(standard => standard.rating === 1)
                        .map(standard => (
                          <div key={standard.id} className="p-3 border-b last:border-b-0 bg-rose-50">
                            <div className="flex items-start gap-3">
                              <div className="flex items-center justify-center h-8 w-8 rounded-md bg-rose-500 mt-0.5 flex-shrink-0">
                                <span className="text-white font-medium text-sm">1</span>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-sm text-slate-900">{standard.code}: {standard.title}</span>
                                </div>
                                <p className="text-xs text-rose-700 mt-1 line-clamp-2">{standard.evidence || "No evidence provided."}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end border-t pt-4 mt-2">
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
          )}
          {!isCompleted && (
            <AccordionContent className="px-5 pb-5 pt-0 border-t">
              <div className="space-y-6">
                {/* Assessment metadata */}
                <div className="flex flex-wrap gap-5 text-sm pt-5 pb-1 text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Assessment:</span>
                    <span className="font-medium text-slate-900">{assessment.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge className={cn("gap-1 font-medium", getStatusColor(assessment.status))}>
                      {getStatusIcon(assessment.status)}
                      {assessment.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Assigned to:</span>
                    <span className="font-medium text-slate-900">{getAssignedUsers(assessment)}</span>
                  </div>
                </div>
                
                {/* Progress */}
                <div>
                  <h3 className="text-sm font-medium mb-3 text-slate-900">Completion Progress</h3>
                  <div className="p-4 border rounded-lg bg-slate-50">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {assessment.completedStandards} of {assessment.totalStandards} standards completed
                      </span>
                      <span className="text-sm font-medium">
                        {Math.round((assessment.completedStandards / assessment.totalStandards) * 100)}%
                      </span>
                    </div>
                    <Progress 
                      value={(assessment.completedStandards / assessment.totalStandards) * 100} 
                      className="h-2"
                      indicatorClassName={
                        assessment.completedStandards === 0 ? "bg-slate-200" :
                        assessment.completedStandards === assessment.totalStandards ? "bg-emerald-500" :
                        assessment.status === "Overdue" ? "bg-rose-500" : "bg-indigo-500"
                      }
                    />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    className="gap-1.5"
                    asChild
                  >
                    <Link to={`/assessments/${assessment.id}`}>
                      View Assessment
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </AccordionContent>
          )}
        </AccordionItem>
      </Accordion>
    );
  };

  // Render header with view toggle and filters
  const renderHeader = (
    placeholder: string, 
    view: "cards" | "table", 
    setView: (view: "cards" | "table") => void
  ) => (
    <CardHeader className="p-5 pb-3">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative flex-1 md:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder={placeholder}
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1.5 ml-2">
            <Button 
              variant="outline" 
              size="sm" 
              className={cn(
                "h-9 w-9 p-0", 
                view === "table" ? "border-primary bg-primary/5 text-primary" : ""
              )}
              onClick={() => setView("table")}
              title="Table view"
            >
              <TableIcon className="h-4 w-4" />
              <span className="sr-only">Table view</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className={cn(
                "h-9 w-9 p-0", 
                view === "cards" ? "border-primary bg-primary/5 text-primary" : ""
              )}
              onClick={() => setView("cards")}
              title="Card view"
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="sr-only">Card view</span>
            </Button>
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

          {/* Term Filter */}
          {uniqueTerms.length > 0 && (
            <Popover open={termFilterOpen} onOpenChange={setTermFilterOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 w-full md:w-[180px] bg-white gap-1.5"
                >
                  <Filter className="h-3.5 w-3.5 text-muted-foreground opacity-70" />
                  Term
                  {termFilter.length > 0 && (
                    <Badge variant="secondary" className="ml-1 rounded-sm px-1 font-normal lg:hidden">
                      {termFilter.length}
                    </Badge>
                  )}
                  {termFilter.length > 0 && (
                    <div className="hidden space-x-1 lg:flex">
                      {termFilter.length > 2 ? (
                        <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                          {termFilter.length} selected
                        </Badge>
                      ) : (
                        uniqueTerms
                          .filter((term) => termFilter.includes(term))
                          .map((term) => (
                            <Badge variant="secondary" key={term} className="rounded-sm px-1 font-normal">
                              {term}
                            </Badge>
                          ))
                      )}
                    </div>
                  )}
                  
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Filter terms..." />
                  <CommandEmpty>No terms found.</CommandEmpty>
                  <CommandGroup>
                    {uniqueTerms.map((term) => {
                      const isSelected = termFilter.includes(term);
                      return (
                        <CommandItem
                          key={term}
                          onSelect={() => {
                            if (isSelected) {
                              setTermFilter(prev => prev.filter(t => t !== term));
                            } else {
                              setTermFilter(prev => [...prev, term]);
                            }
                          }}
                        >
                          <div
                            className={cn(
                              "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                              isSelected
                                ? "bg-primary text-primary-foreground"
                                : "opacity-50 [&_svg]:invisible"
                            )}
                          >
                            <Check className={cn("h-4 w-4")} />
                          </div>
                          <span>{term}</span>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>
    </CardHeader>
  );

  // Table view for assessments
  const renderTableView = (isCompleted: boolean) => (
    <Table>
      <TableHeader>
        <TableRow className="bg-slate-50">
          <TableHead className="py-3">Assessment</TableHead>
          <TableHead>School</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Progress</TableHead>
          {isCompleted ? (
            <TableHead>Completed Date</TableHead>
          ) : (
            <TableHead>Due Date</TableHead>
          )}
          <TableHead>Status</TableHead>
          <TableHead>Term</TableHead>
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
                  {assessment.category}
                </Badge>
              </TableCell>
              <TableCell>
                {isCompleted ? (
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center justify-center h-7 w-7 rounded-full ${getRatingColor(calculateOverallAverage(assessment))}`}>
                      <span className="text-white font-medium text-xs">{calculateOverallAverage(assessment).toFixed(1)}</span>
                    </div>
                    <span className="text-sm whitespace-nowrap">
                      {assessment.completedStandards}/{assessment.totalStandards}
                    </span>
                  </div>
                ) : (
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
                )}
              </TableCell>
              <TableCell>
                {isCompleted ? (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-500" />
                    <span className="text-sm">{assessment.lastUpdated}</span>
                  </div>
                ) : (
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
                )}
              </TableCell>
              <TableCell>
                <Badge className={cn("gap-1 font-medium", getStatusColor(assessment.status))}>
                  {getStatusIcon(assessment.status)}
                  {assessment.status}
                </Badge>
              </TableCell>
              <TableCell>{assessment.term} {assessment.academicYear}</TableCell>
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
  );

  // Empty state component
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
      <XCircle className="h-12 w-12 mb-3 opacity-20" />
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
  );

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
        <div className="mb-6">
          <TabsList className="h-12 w-full justify-start rounded-md bg-slate-50 p-1">
            <TabsTrigger 
              value="completed" 
              className="rounded-md px-5 py-2.5 font-medium text-muted-foreground data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                Completed
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="ongoing" 
              className="rounded-md px-5 py-2.5 font-medium text-muted-foreground data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <div className="flex items-center gap-2">
                <Clock3 className="h-4 w-4" />
                Ongoing
              </div>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Completed Assessments Tab */}
        <TabsContent value="completed" className="mt-0">
          <Card className="border-slate-200">
            {renderHeader("Search completed assessments...", completedView, setCompletedView)}
            <CardContent className={completedView === "cards" ? "px-5 pt-0 pb-5" : "p-0"}>
              {filteredAssessments.length === 0 ? (
                renderEmptyState()
              ) : completedView === "cards" ? (
                <div className="space-y-5">
                  {filteredAssessments.map((assessment) => renderCardView(assessment, true))}
                </div>
              ) : (
                renderTableView(true)
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ongoing Assessments Tab */}
        <TabsContent value="ongoing" className="mt-0">
          <Card className="border-slate-200">
            {renderHeader("Search ongoing assessments...", ongoingView, setOngoingView)}
            <CardContent className={ongoingView === "cards" ? "px-5 pt-0 pb-5" : "p-0"}>
              {filteredAssessments.length === 0 ? (
                renderEmptyState()
              ) : ongoingView === "cards" ? (
                <div className="space-y-5">
                  {filteredAssessments.map((assessment) => renderCardView(assessment, false))}
                </div>
              ) : (
                renderTableView(false)
              )}
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