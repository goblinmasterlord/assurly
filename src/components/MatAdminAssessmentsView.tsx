import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
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
import type { Assessment, AssessmentCategory } from "@/types/assessment";
import { cn } from "@/lib/utils";
import { 
  Calendar, 
  ChevronRight, 
  Filter,
  School as SchoolIcon, 
  Search,
  Clock3,
  CheckSquare,
  SendHorizonal,
  TableIcon,
  LayoutGrid,
  ClipboardList,
  CalendarCheck,
  UserCheck,
  Tag,
  Check
} from "lucide-react";
import { mockSchools } from "@/lib/mock-data";
import { AssessmentInvitationSheet } from "@/components/AssessmentInvitationSheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import * as AssessmentUtils from "@/lib/assessment-utils";

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

  // Card view for assessments
  const renderCardView = (assessment: Assessment, isCompleted: boolean) => {
    const categoryAverages = AssessmentUtils.calculateCategoryAverages(assessment);
    const overallAverage = AssessmentUtils.calculateOverallAverage(assessment);
    
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
                    <div className={`flex items-center justify-center h-9 w-9 rounded-md ${AssessmentUtils.getRatingColor(overallAverage)} border border-white/20`}>
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
                    <Badge className={cn("gap-1 font-medium", AssessmentUtils.getStatusColor(assessment.status))}>
                      {AssessmentUtils.getStatusIcon(assessment.status)}
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
                    <span className="font-medium text-slate-900">{AssessmentUtils.getAssignedUsers(assessment)}</span>
                  </div>
                </div>
                
                {/* Performance Summary */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-slate-900">Performance by Area</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {Object.entries(categoryAverages).map(([key, { average, title }]) => (
                      <div key={key} className={`flex items-center gap-3 p-3.5 border rounded-lg ${AssessmentUtils.getRatingGradient(average)} hover:border-primary transition-colors`}>
                        <div className={`flex items-center justify-center h-9 w-9 rounded-md ${AssessmentUtils.getRatingColor(average)}`}>
                          <span className="text-white font-medium">{average.toFixed(1)}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm text-slate-900">{title}</span>
                          <span className={`text-xs ${AssessmentUtils.getRatingTextColor(average)}`}>
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
                {AssessmentUtils.hasCriticalStandards(assessment) && (
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
                    <Badge className={cn("gap-1 font-medium", AssessmentUtils.getStatusColor(assessment.status))}>
                      {AssessmentUtils.getStatusIcon(assessment.status)}
                      {assessment.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Assigned to:</span>
                    <span className="font-medium text-slate-900">{AssessmentUtils.getAssignedUsers(assessment)}</span>
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
              colSpan={8}
              className="h-24 text-center"
            >
              No assessments found.
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
                    <div className={`flex items-center justify-center h-7 w-7 rounded-full ${AssessmentUtils.getRatingColor(AssessmentUtils.calculateOverallAverage(assessment))}`}>
                      <span className="text-white font-medium text-xs">{AssessmentUtils.calculateOverallAverage(assessment).toFixed(1)}</span>
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
                <Badge className={cn("gap-1 font-medium", AssessmentUtils.getStatusColor(assessment.status))}>
                  {AssessmentUtils.getStatusIcon(assessment.status)}
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