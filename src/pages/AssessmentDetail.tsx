import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useUser } from "@/contexts/UserContext";
import { getAssessmentById, saveAssessmentProgress, submitAssessment } from "@/services/assessment-service";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock,
  HelpCircle,
  Info,
  Loader2,
  Save,
  School,
  User,
  XCircle,
} from "lucide-react";
import { RatingLabels, RatingDescriptions, type Rating, type Standard, type Assessment, type FileAttachment } from "@/types/assessment";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FileUpload } from "@/components/ui/file-upload";

// Evidence Cell Component with smart text handling
const EvidenceCell = ({ evidence }: { evidence: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldTruncate = evidence.length > 120;
  
  if (!shouldTruncate) {
    return (
      <p className="text-sm text-slate-700 leading-relaxed">
        {evidence}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-slate-700 leading-relaxed">
        {isExpanded ? evidence : `${evidence.slice(0, 120)}...`}
      </p>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-xs text-slate-500 hover:text-slate-700 font-medium transition-colors"
      >
        {isExpanded ? 'Show less' : 'Show more'}
      </button>
    </div>
  );
};

export function AssessmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role } = useUser();
  const { toast } = useToast();
  
  // State for assessment data
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Check for admin view mode from URL params
  const searchParams = new URLSearchParams(window.location.search);
  const isAdminView = searchParams.get('view') === 'admin' || role === 'mat-admin';
  
  // Fetch assessment data
  const fetchAssessment = useCallback(async () => {
    if (!id) {
      setError("No assessment ID provided");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const data = await getAssessmentById(id);
      if (data) {
        setAssessment(data);
      } else {
        setError("Assessment not found");
      }
    } catch (err) {
      setError("Failed to load assessment");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAssessment();
  }, [fetchAssessment]);
  
  // Get other assessments for the same category but different schools (for department heads)
  // This will need to be updated later to also use API data
  const relatedAssessments: Assessment[] = [];
  
  const [activeStandard, setActiveStandard] = useState<Standard | null>(null);
  
  // Update activeStandard when assessment loads
  useEffect(() => {
    if (assessment?.standards && assessment.standards.length > 0) {
      setActiveStandard(assessment.standards[0]);
    }
  }, [assessment]);
  
  const [ratings, setRatings] = useState<Record<string, Rating>>({});
  const [evidence, setEvidence] = useState<Record<string, string>>({});
  const [attachments, setAttachments] = useState<Record<string, FileAttachment[]>>({});

  // Initialize form state when assessment loads
  useEffect(() => {
    if (assessment?.standards) {
      setRatings(assessment.standards.reduce((acc, standard) => {
        acc[standard.id] = standard.rating;
        return acc;
      }, {} as Record<string, Rating>));

      setEvidence(assessment.standards.reduce((acc, standard) => {
        acc[standard.id] = standard.evidence || "";
        return acc;
      }, {} as Record<string, string>));

      setAttachments(assessment.standards.reduce((acc, standard) => {
        acc[standard.id] = standard.attachments || [];
        return acc;
      }, {} as Record<string, FileAttachment[]>));
    }
  }, [assessment]);

  const [saving, setSaving] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [activeStandardIndex, setActiveStandardIndex] = useState(0);
  
  useEffect(() => {
    if (assessment?.standards && activeStandard) {
      const index = assessment.standards.findIndex(s => s.id === activeStandard.id);
      if (index !== -1) {
        setActiveStandardIndex(index);
      }
    }
  }, [activeStandard, assessment]);

  const goToNextStandard = () => {
    if (assessment?.standards && activeStandardIndex < assessment.standards.length - 1) {
      setActiveStandard(assessment.standards[activeStandardIndex + 1]);
    }
  };

  const goToPreviousStandard = () => {
    if (assessment?.standards && activeStandardIndex > 0) {
      setActiveStandard(assessment.standards[activeStandardIndex - 1]);
    }
  };
  
  // Add keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only activate keyboard shortcuts when we're in the assessment detail view
      if (!activeStandard || role !== "department-head" || assessment?.status === "Completed") return;

      // Arrow right or 'j': Next standard
      if ((e.key === "ArrowRight" || e.key.toLowerCase() === "j") && !e.ctrlKey && !e.metaKey) {
        goToNextStandard();
      }
      // Arrow left or 'k': Previous standard
      else if ((e.key === "ArrowLeft" || e.key.toLowerCase() === "k") && !e.ctrlKey && !e.metaKey) {
        goToPreviousStandard();
      }
      // Numbers 1-4: Set rating for current standard
      else if (["1", "2", "3", "4"].includes(e.key) && !e.ctrlKey && !e.metaKey) {
        handleRatingChange(activeStandard.id, parseInt(e.key) as Rating);
      }
      // 's': Save progress
      else if (e.key.toLowerCase() === "s" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault(); // Prevent browser save dialog
        handleSave();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeStandard, activeStandardIndex, assessment, role]);

  // Update the UI for keyboard shortcuts help
  const keyboardShortcuts = [
    { key: "→ / J", action: "Next standard" },
    { key: "← / K", action: "Previous standard" },
    { key: "1-4", action: "Set rating" },
    { key: "⌘S / Ctrl+S", action: "Save progress" }
  ];

  if (isLoading) {
    return (
      <div className="container py-10 flex justify-center items-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <p className="text-muted-foreground">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="container py-10">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/assessments")}
            className="mr-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Assessments
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Assessment Not Found</CardTitle>
            <CardDescription>
              The assessment you're looking for doesn't exist or you don't have access to it.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild>
              <Link to="/assessments">Return to Assessments</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Calculate progress
  const completedCount = Object.values(ratings).filter(r => r !== null).length;
  const totalCount = assessment.standards?.length || 0;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  
  const handleRatingChange = (standardId: string, value: Rating) => {
    setRatings(prev => ({
      ...prev,
      [standardId]: value,
    }));
  };
  
  const handleEvidenceChange = (standardId: string, value: string) => {
    setEvidence(prev => ({
      ...prev,
      [standardId]: value,
    }));
  };

  const handleAttachmentsChange = (standardId: string, files: FileAttachment[]) => {
    setAttachments(prev => ({
      ...prev,
      [standardId]: files,
    }));
  };
  
  const handleSave = async () => {
    if (!assessment || !id) return;
    
    setSaving(true);
    try {
      const success = await saveAssessmentProgress(id, ratings, evidence);
      
      if (success) {
        // Refetch the assessment to get updated data
        await fetchAssessment();
        toast({
          title: "Progress saved",
          description: "Your assessment progress has been saved successfully",
          variant: "default",
        });
      } else {
        toast({
          title: "Save failed",
          description: "There was an error saving your progress. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Save failed",
        description: "There was an error saving your progress. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };
  
  const handleSubmit = async () => {
    if (!assessment || !id) return;
    
    setSaving(true);
    try {
      const success = await submitAssessment(id, ratings, evidence);
      
      if (success) {
        // Refetch the assessment to get updated data
        await fetchAssessment();
        setShowSuccessDialog(true);
        toast({
          title: "Assessment submitted",
          description: "Your assessment has been submitted successfully",
          variant: "default",
        });
      } else {
        toast({
          title: "Submission failed",
          description: "There was an error submitting your assessment. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: "Submission failed",
        description: "There was an error submitting your assessment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getStandardStatus = (standard: Standard) => {
    const rating = ratings[standard.id];
    
    if (rating !== null) {
      return "complete";
    } else if (evidence[standard.id] && evidence[standard.id].length > 0) {
      return "partial";
    } else {
      return "incomplete";
    }
  };
  
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "complete":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "partial":
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case "incomplete":
        return <XCircle className="h-5 w-5 text-slate-300" />;
      default:
        return null;
    }
  };

  const isCompleted = progressPercentage === 100;
  const canSubmit = isCompleted && role === "department-head" && assessment.status !== "Completed";
  
  return (
    <div className="container max-w-7xl py-6 md:py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/assessments")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Assessments
        </Button>
        
        {/* Related assessments dropdown for department heads */}
        {role === "department-head" && relatedAssessments.length > 0 && (
          <div className="flex items-center">
            <p className="text-sm text-muted-foreground mr-2 hidden sm:block">Switch to another school:</p>
            <Select 
              onValueChange={(value) => navigate(`/assessments/${value}`)}
            >
              <SelectTrigger className="w-[180px] h-9">
                <School className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Change School" />
              </SelectTrigger>
              <SelectContent>
                {relatedAssessments.map(ra => (
                  <SelectItem key={ra.id} value={ra.id}>
                    {ra.school.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      
      {/* Assessment Header */}
      <div className="bg-white border border-slate-200/60 rounded-xl p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          {/* Title and Description */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <ClipboardCheck className="h-5 w-5 text-slate-700" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 leading-tight">
                  {assessment.name}
                </h1>
                <p className="text-sm text-slate-600 font-medium">
                  {assessment.school.name} • {assessment.category}
                </p>
              </div>
            </div>
            
            {/* Status and Progress */}
            <div className="flex items-center gap-4 mt-4">
              <Badge 
                className={cn(
                  "px-3 py-1 text-sm font-medium border",
                  assessment.status === "Completed" && "bg-emerald-100 text-emerald-700 border-emerald-200",
                  assessment.status === "In Progress" && "bg-blue-100 text-blue-700 border-blue-200",
                  assessment.status === "Not Started" && "bg-slate-100 text-slate-700 border-slate-200",
                  assessment.status === "Overdue" && "bg-red-100 text-red-700 border-red-200"
                )}
              >
                {assessment.status}
              </Badge>
              
              <div className="flex items-center gap-2">
                <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all duration-300",
                      progressPercentage === 100 ? "bg-emerald-500" : "bg-slate-400"
                    )}
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-slate-700">
                  {completedCount}/{totalCount}
                </span>
              </div>
            </div>
          </div>
          
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 min-w-0 lg:min-w-[400px]">
            {assessment.assignedTo && assessment.assignedTo.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-slate-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Assigned To
                  </p>
                  <p className="text-sm text-slate-900 font-medium truncate">
                    {assessment.assignedTo[0].name}
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Calendar className="h-4 w-4 text-slate-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Due Date
                </p>
                <p className="text-sm text-slate-900 font-medium">
                  {assessment.dueDate 
                    ? new Date(assessment.dueDate).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })
                    : "No due date"
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Clock className="h-4 w-4 text-slate-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Last Updated
                </p>
                <p className="text-sm text-slate-900 font-medium">
                  {assessment.lastUpdated !== "-" 
                    ? new Date(assessment.lastUpdated).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short'
                      })
                    : "Never"
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Only show assessment form for department heads and non-admin view */}
      {role === "department-head" && !isAdminView && assessment.standards && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Standards List - Sidebar */}
          <Card className="md:col-span-4 lg:col-span-3 h-fit">
            <CardHeader className="py-4 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold">Standards</CardTitle>
                  <CardDescription className="text-sm">
                    Complete all standards below
                  </CardDescription>
                </div>
                <Badge variant="outline" className="whitespace-nowrap">
                  {completedCount}/{totalCount}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="px-2 py-2 max-h-[60vh] overflow-y-auto">
              <div className="space-y-1">
                {assessment.standards.map((standard, index) => {
                  const status = getStatusStatus(standard);
                  return (
                    <Button
                      key={standard.id}
                      variant="ghost"
                      className={cn(
                        "w-full justify-between rounded-lg px-4 py-3 h-auto border transition-colors",
                        activeStandard?.id === standard.id 
                          ? "border-primary/70 bg-primary/5" 
                          : "border-transparent hover:bg-slate-50",
                      )}
                      onClick={() => setActiveStandard(standard)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "text-slate-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium",
                          activeStandard?.id === standard.id ? "bg-primary/10 text-primary" : "bg-slate-200"
                        )}>
                          {index + 1}
                        </div>
                        <div className="text-left">
                          <span className={cn("font-medium block text-sm", activeStandard?.id === standard.id ? "text-primary" : "")}>{standard.code}</span>
                          <span className={cn("text-xs truncate max-w-[150px] block", activeStandard?.id === standard.id ? "text-foreground" : "text-muted-foreground")}>{standard.title}</span>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {getStatusIcon(getStandardStatus(standard))}
                      </div>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
            
          {/* Standard Detail - Main Content */}
          <div className="md:col-span-8 lg:col-span-9">
            {activeStandard && (
              <Card className="h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-primary border-primary">
                      Standard {activeStandardIndex + 1} of {totalCount}
                    </Badge>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={goToPreviousStandard}
                        disabled={activeStandardIndex === 0}
                        className="h-8 px-2"
                      >
                        Previous
                      </Button>
                      <span className="mx-2">|</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={goToNextStandard}
                        disabled={activeStandardIndex === totalCount - 1}
                        className="h-8 px-2"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                  
                  {/* Improved title and description layout */}
                  <div className="mb-2">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-lg font-semibold text-slate-500">{activeStandard.code}:</span>
                      <h2 className="text-2xl font-bold leading-tight">{activeStandard.title}</h2>
                    </div>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-md mt-2">
                    <p className="text-base text-slate-600 leading-relaxed">{activeStandard.description}</p>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-8">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-base font-medium">Rating</h3>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <span className="sr-only">Rating help</span>
                                <HelpCircle className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-sm">
                              <p>1: Inadequate - {RatingDescriptions[1]}</p>
                              <p>2: Requires Improvement - {RatingDescriptions[2]}</p>
                              <p>3: Good - {RatingDescriptions[3]}</p>
                              <p>4: Outstanding - {RatingDescriptions[4]}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
                        {[1, 2, 3, 4].map((rating) => {
                          const isSelected = ratings[activeStandard.id] === rating;
                          return (
                            <div 
                              key={rating}
                              className={cn(
                                "border rounded-lg px-4 py-3 cursor-pointer transition-all relative",
                                isSelected 
                                  ? "border-primary bg-primary/5" 
                                  : "hover:border-slate-400",
                                role !== "department-head" || assessment.status === "Completed" 
                                  ? "opacity-60 pointer-events-none" 
                                  : ""
                              )}
                              onClick={() => role === "department-head" && assessment.status !== "Completed" && 
                                handleRatingChange(activeStandard.id, rating as Rating)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-medium">{rating}:</span>
                                  <span className="font-medium">{RatingLabels[rating as 1 | 2 | 3 | 4]}</span>
                                </div>
                                {/* Fixed checkmark position */}
                                {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1.5">
                                {RatingDescriptions[rating as 1 | 2 | 3 | 4]}
                              </p>
                              {role === "department-head" && assessment.status !== "Completed" && (
                                <span className="absolute top-2 right-2 text-xs font-mono text-muted-foreground bg-gray-50 px-1.5 py-0.5 rounded">
                                  {rating}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-base font-medium">Evidence / Comments <span className="text-xs text-muted-foreground">(Optional)</span></h3>
                        <span className="text-xs text-muted-foreground">
                          {evidence[activeStandard.id]?.length || 0} / 500 characters
                        </span>
                      </div>
                      <Textarea
                        placeholder="Provide specific evidence to support your rating (optional)..."
                        value={evidence[activeStandard.id] || ""}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                          handleEvidenceChange(activeStandard.id, e.target.value)
                        }
                        disabled={role !== "department-head" || assessment.status === "Completed"}
                        className="min-h-[150px] resize-y"
                        maxLength={500}
                      />
                      <p className="mt-2 text-sm text-muted-foreground">
                        <Info className="inline h-3.5 w-3.5 mr-1" />
                        Please provide specific examples and relevant details to support your rating
                      </p>
                    </div>

                    {/* File Upload Section */}
                    {role === "department-head" && assessment.status !== "Completed" && (
                      <div>
                        <h3 className="text-base font-medium mb-3">Supporting Documents <span className="text-xs text-muted-foreground">(Optional)</span></h3>
                        <FileUpload
                          onFilesChange={(files) => handleAttachmentsChange(activeStandard.id, files)}
                          existingFiles={attachments[activeStandard.id] || []}
                          maxFiles={3}
                          acceptedTypes={[".pdf", ".doc", ".docx", ".xls", ".xlsx", ".jpg", ".jpeg", ".png"]}
                          maxSize={10}
                        />
                        <p className="mt-2 text-sm text-muted-foreground">
                          <Info className="inline h-3.5 w-3.5 mr-1" />
                          Upload supporting documents such as policies, reports, or evidence files
                        </p>
                      </div>
                    )}

                    {/* Show attachments in read-only mode for completed assessments or admin view */}
                    {(isAdminView || assessment.status === "Completed") && 
                     attachments[activeStandard.id] && 
                     attachments[activeStandard.id].length > 0 && (
                      <div>
                        <h3 className="text-base font-medium mb-3">Supporting Documents</h3>
                        <div className="space-y-2">
                          {attachments[activeStandard.id].map((file) => (
                            <div
                              key={file.id}
                              className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg"
                            >
                              <div className="flex items-center space-x-2">
                                <div className="h-8 w-8 bg-indigo-100 rounded flex items-center justify-center">
                                  <span className="text-xs font-medium text-indigo-600">
                                    {file.name.split('.').pop()?.toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-slate-900">{file.name}</p>
                                  <p className="text-xs text-slate-500">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB • {new Date(file.uploadedAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <Button variant="ghost" size="sm" className="text-slate-500">
                                <span className="text-xs">View</span>
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
                
                {role === "department-head" && assessment.status !== "Completed" && (
                  <div className="pb-24">
                    {/* Add padding to account for sticky bottom bar */}
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>
      )}
      
      {/* Sticky Bottom Navigation Bar for Department Heads */}
      {role === "department-head" && assessment.status !== "Completed" && !isAdminView && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200/60 shadow-lg z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              {/* Left side - Progress and navigation */}
              <div className="flex items-center gap-4">
                {/* Standard navigation */}
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={goToPreviousStandard}
                    disabled={activeStandardIndex === 0}
                    className="h-9 w-9 p-0"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg">
                    <span className="text-sm font-medium text-slate-700">
                      {activeStandardIndex + 1}
                    </span>
                    <span className="text-sm text-slate-500">of</span>
                    <span className="text-sm font-medium text-slate-700">
                      {totalCount}
                    </span>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={goToNextStandard}
                    disabled={activeStandardIndex === totalCount - 1}
                    className="h-9 w-9 p-0"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* Progress indicator */}
                <div className="hidden sm:flex items-center gap-2">
                  <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-400 transition-all duration-300"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-slate-600 font-medium">
                    {completedCount}/{totalCount} complete
                  </span>
                </div>
              </div>

              {/* Center - Current standard info */}
              <div className="hidden md:flex items-center gap-2 max-w-md">
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {activeStandard?.code}: {activeStandard?.title}
                  </p>
                  <p className="text-xs text-slate-500">
                    {ratings[activeStandard?.id || ''] ? 'Rated' : 'Not rated'}
                  </p>
                </div>
              </div>

              {/* Right side - Save actions */}
              <div className="flex items-center gap-3">
                {/* Quick save */}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleSave}
                  disabled={saving}
                  className="hidden sm:flex"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                </Button>

                {/* Primary action */}
                {activeStandardIndex < totalCount - 1 ? (
                  <Button 
                    onClick={() => {
                      handleSave();
                      goToNextStandard();
                    }}
                    disabled={saving}
                    className="gap-2"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Save & Continue
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button 
                    onClick={handleSubmit}
                    disabled={!canSubmit || saving}
                    variant={canSubmit ? "default" : "outline"}
                    className="gap-2"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        {canSubmit ? "Submit Assessment" : "Complete All Standards"}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Keyboard shortcuts hint */}
            <div className="border-t border-slate-200/60 py-2">
              <div className="flex items-center justify-center gap-6 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">J/K</kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">1-4</kbd>
                  Rate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">⌘S</kbd>
                  Save
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Admin View - Completed Assessment Overview */}
      {isAdminView && assessment.standards && (
        <div className="space-y-6">
          {/* Compact Metrics Bar */}
          <Card className="border-slate-200/60">
            <CardContent className="px-6 py-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <span className="text-slate-700 font-semibold text-sm">
                      {(() => {
                        const averageRating = assessment.standards
                          .filter(s => s.rating !== null)
                          .reduce((sum, s) => sum + (s.rating || 0), 0) / 
                          assessment.standards.filter(s => s.rating !== null).length;
                        return averageRating ? averageRating.toFixed(1) : '—';
                      })()}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Average Score</p>
                    <p className="text-sm font-semibold text-slate-900">Overall Rating</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <span className="text-slate-700 font-semibold text-sm">
                      {Math.round((assessment.completedStandards / assessment.totalStandards) * 100)}%
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Completion Rate</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {assessment.completedStandards}/{assessment.totalStandards} Standards
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-slate-700" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Last Updated</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {new Date(assessment.lastUpdated).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short'
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-slate-700" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Status</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {assessment.status}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Standards Table */}
          <Card className="border-slate-200/60">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200/60">
                  <TableHead className="w-12 text-center font-semibold text-slate-600">#</TableHead>
                  <TableHead className="font-semibold text-slate-600">Standard</TableHead>
                  <TableHead className="w-24 text-center font-semibold text-slate-600">Rating</TableHead>
                  <TableHead className="w-20 text-center font-semibold text-slate-600">Status</TableHead>
                  <TableHead className="w-80 font-semibold text-slate-600">Evidence</TableHead>
                  <TableHead className="w-20 font-semibold text-slate-600">Files</TableHead>
                  <TableHead className="w-24 text-right font-semibold text-slate-600">Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assessment.standards.map((standard, index) => (
                  <TableRow 
                    key={standard.id} 
                    className="border-slate-200/60 hover:bg-slate-50/50 transition-colors"
                  >
                    <TableCell className="text-center">
                      <span className="text-sm font-medium text-slate-500">
                        {index + 1}
                      </span>
                    </TableCell>
                    
                    <TableCell className="py-4">
                      <div className="space-y-1">
                        <h4 className="font-medium text-slate-900 leading-tight">
                          {standard.title}
                        </h4>
                        <p className="text-sm text-slate-500 leading-relaxed">
                          {standard.description}
                        </p>
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-center">
                      {standard.rating && (
                        <div className="flex justify-center">
                          <div className={`
                            inline-flex items-center justify-center h-8 w-8 rounded-full text-sm font-semibold
                            ${standard.rating === 4 ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : ''}
                            ${standard.rating === 3 ? 'bg-blue-100 text-blue-700 border border-blue-200' : ''}
                            ${standard.rating === 2 ? 'bg-amber-100 text-amber-700 border border-amber-200' : ''}
                            ${standard.rating === 1 ? 'bg-red-100 text-red-700 border border-red-200' : ''}
                          `}>
                            {standard.rating}
                          </div>
                        </div>
                      )}
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        {standard.rating ? (
                          <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center">
                            <CheckCircle className="h-4 w-4 text-emerald-600" />
                          </div>
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center">
                            <Clock className="h-3 w-3 text-slate-400" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      {standard.evidence ? (
                        <EvidenceCell evidence={standard.evidence} />
                      ) : (
                        <span className="text-sm text-slate-400 italic">No evidence provided</span>
                      )}
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <span className="text-sm text-slate-500">
                        {Math.floor(Math.random() * 3)}
                      </span>
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <span className="text-sm text-slate-500">
                        {standard.rating ? new Date().toLocaleDateString('en-GB', { 
                          day: 'numeric', 
                          month: 'short' 
                        }) : '—'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}
      
      {/* Submission Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Assessment Submitted Successfully
            </DialogTitle>
            <DialogDescription>
              Thank you for completing the {assessment.name} for {assessment.school.name}.
            </DialogDescription>
          </DialogHeader>

          {assessment.standards && assessment.standards.length > 0 && (
            <div className="space-y-2 my-2">
              <h4 className="text-sm font-medium">Assessment Summary:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {[1, 2, 3, 4].map(rating => {
                  const count = assessment.standards!.filter(s => ratings[s.id] === rating).length;
                  if (count === 0) return null;
                  
                  const color = rating === 1 ? "text-red-600" :
                              rating === 2 ? "text-amber-600" :
                              rating === 3 ? "text-blue-600" :
                              "text-green-600";
                  
                  return (
                    <div key={rating} className="flex items-center gap-1.5">
                      <span className={cn("font-medium", color)}>
                        {count}× {RatingLabels[rating as 1|2|3|4]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          <p className="text-sm">
            Your assessment has been submitted and will be reviewed by the MAT administrators.
            You can view your submission at any time from the assessments dashboard.
          </p>
          <DialogFooter>
            <Button onClick={() => {
              setShowSuccessDialog(false);
              navigate("/assessments");
            }}>
              Return to Assessments
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper function to get the status of a standard based on its completion state
const getStatusStatus = (standard: Standard) => {
  if (standard.rating) {
    return "complete";
  } else if (standard.evidence) {
    return "partial";
  } else {
    return "incomplete";
  }
}; 