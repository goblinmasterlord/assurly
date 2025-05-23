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
import { useUser } from "@/contexts/UserContext";
import {
  mockAssessmentsAdmin,
  mockAssessmentsForDeptHead,
} from "@/lib/mock-data";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle,
  ChevronRight,
  HelpCircle,
  Info,
  Loader2,
  Save,
  School,
  User,
  XCircle,
} from "lucide-react";
import { RatingLabels, RatingDescriptions, type Rating, type Standard } from "@/types/assessment";
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

export function AssessmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role } = useUser();
  const { toast } = useToast();
  
  // Get the assessment based on user role
  const isMatAdmin = role === "mat-admin";
  const assessments = isMatAdmin ? mockAssessmentsAdmin : mockAssessmentsForDeptHead;
  const assessment = assessments.find(a => a.id === id);
  
  // Get other assessments for the same category but different schools (for department heads)
  const relatedAssessments = role === "department-head" ? assessments.filter(a => 
    a.id !== id && 
    a.category === assessment?.category
  ) : [];
  
  const [activeStandard, setActiveStandard] = useState<Standard | null>(
    assessment?.standards && assessment.standards.length > 0
      ? assessment.standards[0]
      : null
  );
  
  const [ratings, setRatings] = useState<Record<string, Rating>>(
    assessment?.standards
      ? assessment.standards.reduce((acc, standard) => {
          acc[standard.id] = standard.rating;
          return acc;
        }, {} as Record<string, Rating>)
      : {}
  );
  
  const [evidence, setEvidence] = useState<Record<string, string>>(
    assessment?.standards
      ? assessment.standards.reduce((acc, standard) => {
          acc[standard.id] = standard.evidence || "";
          return acc;
        }, {} as Record<string, string>)
      : {}
  );

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

  if (!assessment) {
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
  
  const handleSave = () => {
    setSaving(true);
    // Simulate API call with timeout
    setTimeout(() => {
      setSaving(false);
      toast({
        title: "Progress saved",
        description: "Your assessment progress has been saved successfully",
        variant: "default",
      });
    }, 800);
  };
  
  const handleSubmit = () => {
    setSaving(true);
    // Simulate API call with timeout
    setTimeout(() => {
      setSaving(false);
      setShowSuccessDialog(true);
      toast({
        title: "Assessment submitted",
        description: "Your assessment has been submitted successfully",
        variant: "default",
      });
    }, 1000);
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
      
      {/* Assessment Header Card */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <CardTitle className="text-2xl font-bold">{assessment.name}</CardTitle>
              <CardDescription className="text-base">
                {assessment.school.name} • {assessment.category}
              </CardDescription>
            </div>
            <Badge className={cn(getStatusColor(assessment.status), "self-start whitespace-nowrap")}>
              {assessment.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-start space-x-4">
              <School className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">School</p>
                <p className="text-sm text-muted-foreground">
                  {assessment.school.name}
                </p>
              </div>
            </div>
            
            {assessment.assignedTo && assessment.assignedTo.length > 0 && (
              <div className="flex items-start space-x-4">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Assigned To</p>
                  <p className="text-sm text-muted-foreground">
                    {assessment.assignedTo[0].name}
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex items-start space-x-4">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Due Date</p>
                <p className="text-sm text-muted-foreground">
                  {assessment.dueDate || "No due date"}
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-full">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-sm font-medium">Progress</p>
                  <p className="text-sm font-medium">
                    <span className="text-primary">{completedCount}</span>/<span>{totalCount}</span>
                  </p>
                </div>
                <div className="relative">
                  <Progress 
                    value={progressPercentage} 
                    className="h-2.5" 
                    indicatorClassName={isCompleted ? "bg-green-600" : undefined}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Only show assessment form for department heads or in-progress assessments */}
      {(role === "department-head" || assessment.status !== "Completed") && assessment.standards && (
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
                  </div>
                </CardContent>
                
                {role === "department-head" && assessment.status !== "Completed" && (
                  <>
                    <CardFooter className="flex flex-col sm:flex-row justify-between gap-3 pt-0 px-6">
                      <Button 
                        variant="outline" 
                        className="w-full sm:w-auto"
                        onClick={handleSave}
                        disabled={saving}
                      >
                        {saving ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="mr-2 h-4 w-4" />
                        )}
                        Save Progress
                      </Button>
                      <div className="flex gap-3 w-full sm:w-auto">
                        {activeStandardIndex < totalCount - 1 ? (
                          <Button 
                            className="flex-1"
                            onClick={() => {
                              handleSave();
                              goToNextStandard();
                            }}
                            disabled={saving}
                          >
                            Save & Continue
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        ) : (
                          <Button 
                            className="flex-1"
                            onClick={handleSubmit}
                            disabled={!canSubmit || saving}
                            variant={canSubmit ? "default" : "outline"}
                          >
                            {saving ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="mr-2 h-4 w-4" />
                            )}
                            {isCompleted ? "Submit Assessment" : "Complete All Standards to Submit"}
                          </Button>
                        )}
                      </div>
                    </CardFooter>
                    <div className="px-6 pb-6">
                      <div className="border-t pt-3 mt-2">
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium">Keyboard shortcuts:</span>
                          <span className="flex flex-wrap gap-x-6 gap-y-1 mt-1">
                            {keyboardShortcuts.map((shortcut) => (
                              <span key={shortcut.key} className="flex items-center">
                                <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">{shortcut.key}</kbd>
                                <span className="mx-1">-</span>
                                <span>{shortcut.action}</span>
                              </span>
                            ))}
                          </span>
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </Card>
            )}
          </div>
        </div>
      )}
      
      {/* Show read-only view for completed assessments for MAT admins */}
      {role === "mat-admin" && assessment.status === "Completed" && assessment.standards && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Assessment Results</CardTitle>
            <CardDescription>
              Completed on {assessment.lastUpdated} by {assessment.assignedTo?.[0]?.name || "Unknown"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="space-y-4">
              {assessment.standards.map((standard) => (
                <AccordionItem 
                  key={standard.id} 
                  value={standard.id}
                  className="border rounded-lg px-0 overflow-hidden"
                >
                  <AccordionTrigger className="px-4 py-3 hover:bg-slate-50 [&>svg]:h-4 [&>svg]:w-4 [&[data-state=open]>svg]:rotate-180">
                    <div className="flex items-center gap-4">
                      <Badge variant={standard.rating ? "default" : "outline"} className="h-7 px-2">
                        {standard.rating ? `${standard.rating}: ${RatingLabels[standard.rating]}` : "Not Rated"}
                      </Badge>
                      <span className="font-medium">
                        {standard.code}: {standard.title}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-0">
                    <div className="space-y-3">
                      <p className="text-muted-foreground">{standard.description}</p>
                      {standard.evidence && (
                        <div className="bg-slate-50 p-3 rounded border">
                          <h4 className="text-sm font-medium mb-1">Evidence / Comments:</h4>
                          <p className="text-sm">{standard.evidence}</p>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
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