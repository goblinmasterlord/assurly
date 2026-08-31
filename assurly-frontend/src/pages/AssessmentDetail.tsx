import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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
import { useAssessment } from "@/hooks/use-assessments"; // Optimized assessment fetching
import { getStatusLabel, isOverdue } from "@/utils/assessment";
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
import { type Rating, type Standard, type Assessment, type FileAttachment, type StandardType, type Aspect, type AspectCategory } from "@/types/assessment";
import { getAspects } from "@/services/assessment-service";
import { AspectCategoryBadge } from "@/components/AspectCategoryBadge";
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
import {
  getActions,
  createAction,
  updateAction,
  deleteAction,
  type UiAction,
} from "@/services/actions-service";
import { getRagBadgeClasses } from "@/utils/rag";
import {
  RATING_OPTIONS,
  getRatingLabel,
  getRatingDescription,
  calculateAverageRating,
} from "@/utils/rating-labels";
import { StandardTypeBadge } from "@/components/StandardTypeBadge";

type StandardWithAssessmentId = Standard & { assessment_id?: string };

function resolveStandardAssessmentId(
  standard: StandardWithAssessmentId | undefined,
  assessment: Assessment,
  urlId?: string
): string | undefined {
  if (!standard) return undefined;

  if (standard.assessment_id) {
    return standard.assessment_id;
  }

  if (assessment.school_id && standard.standard_code) {
    const termId =
      assessment.unique_term_id ||
      (urlId ? urlId.split("-").slice(-2).join("-") : undefined);
    if (termId) {
      return `${assessment.school_id}-${standard.standard_code}-${termId}`;
    }
  }

  return standard.id || standard.mat_standard_id;
}

function getSortedStandards(standards: Standard[]) {
  return standards.slice().sort((a, b) => {
    const aCode = a.code || "";
    const bCode = b.code || "";
    const aMatch = aCode.match(/([A-Z]+)(\d+)/);
    const bMatch = bCode.match(/([A-Z]+)(\d+)/);

    if (aMatch && bMatch) {
      const aPrefix = aMatch[1];
      const bPrefix = bMatch[1];
      const aNum = parseInt(aMatch[2], 10);
      const bNum = parseInt(bMatch[2], 10);

      if (aPrefix !== bPrefix) {
        return aPrefix.localeCompare(bPrefix);
      }

      return aNum - bNum;
    }

    return aCode.localeCompare(bCode);
  });
}

function getGroupedStandards(standards: Standard[]) {
  const sorted = getSortedStandards(standards);
  return {
    assurance: sorted.filter(
      (s) => (s.standard_type || "assurance") === "assurance"
    ),
    risk: sorted.filter((s) => s.standard_type === "risk"),
  };
}

function getNavigationStandards(standards: Standard[]) {
  const { assurance, risk } = getGroupedStandards(standards);
  return [...assurance, ...risk];
}

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

const ADMIN_STANDARD_DESC_MAX = 50;

function AdminStandardDescription({ description }: { description?: string | null }) {
  const full = (description ?? "").trim();
  if (!full) return null;

  const isTruncated = full.length > ADMIN_STANDARD_DESC_MAX;
  const display = isTruncated
    ? `${full.slice(0, ADMIN_STANDARD_DESC_MAX)}...`
    : full;

  return (
    <p className="text-sm text-slate-500 leading-snug flex items-center gap-1">
      <span className="truncate">{display}</span>
      {isTruncated && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="inline-flex shrink-0 text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
              aria-label="View full standard description"
            >
              <Info className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-sm whitespace-pre-wrap">
            {full}
          </TooltipContent>
        </Tooltip>
      )}
    </p>
  );
}

export function AssessmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role } = useUser();
  const { toast } = useToast();
  
  const formatStatus = useCallback((status: string): string => {
    const normalized = status
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "_")
      .replace(/-/g, "_");
    return getStatusLabel(normalized as any);
  }, []);
  
  // Check for admin view mode from URL params
  const searchParams = new URLSearchParams(window.location.search);
  const isAdminView = searchParams.get('view') === 'admin' && role === 'mat-admin';
  
  // 🚀 OPTIMIZED: Using enhanced assessment hook with caching and automatic refresh
      const {
      assessment,
      isLoading,
      error,
      refreshAssessment,
      submitAssessment,
    } = useAssessment(id || '');
  
  // Legacy fetchAssessment function for compatibility (just calls refreshAssessment)
  const fetchAssessment = useCallback(async (showLoading = true) => {
    // The hook already handles loading states, so we just trigger refresh
    if (id) {
      await refreshAssessment();
    }
  }, [id, refreshAssessment]);
  
  // Get other assessments for the same category but different schools (for department heads)
  // This will need to be updated later to also use API data
  const relatedAssessments: Assessment[] = [];
  
  const [activeStandard, setActiveStandard] = useState<Standard | null>(null);
  const [aspects, setAspects] = useState<Aspect[]>([]);

  useEffect(() => {
    getAspects()
      .then(setAspects)
      .catch((err) => console.error("Failed to load aspects:", err));
  }, []);

  const aspectCategory = useMemo((): AspectCategory | undefined => {
    if (!assessment) return undefined;
    const code = (assessment.aspect_code || assessment.category || "").toUpperCase();
    const meta = aspects.find(
      (a) => a.aspect_code.toUpperCase() === code
    );
    return meta?.aspect_category;
  }, [assessment, aspects]);

  const activeStandardInitializedFor = useRef<string | null>(null);

  // Set the initial standard once per assessment — not on every refresh after save.
  useEffect(() => {
    if (!id || !assessment?.standards?.length) return;
    if (activeStandardInitializedFor.current === id) return;
    activeStandardInitializedFor.current = id;
    setActiveStandard(getNavigationStandards(assessment.standards)[0]);
  }, [assessment, id]);
  
  const [ratings, setRatings] = useState<Record<string, Rating>>({});
  const [evidence, setEvidence] = useState<Record<string, string>>({});
  const [attachments, setAttachments] = useState<Record<string, FileAttachment[]>>({});
  
  // Actions state - per standard
  const [actions, setActions] = useState<Record<string, UiAction[]>>({});
  const [newActionText, setNewActionText] = useState<Record<string, string>>({});
  const [actionsLoadError, setActionsLoadError] = useState<string | null>(null);
  const [actionsError, setActionsError] = useState<string | null>(null);
  const [actionsMutating, setActionsMutating] = useState<Record<string, boolean>>({});

  // Initialize form state when assessment loads
  useEffect(() => {
    if (assessment?.standards) {
      setRatings(assessment.standards.reduce((acc, standard) => {
        if (standard.id && standard.rating) acc[standard.id] = standard.rating;
        return acc;
      }, {} as Record<string, Rating>));

      setEvidence(assessment.standards.reduce((acc, standard) => {
        if (standard.id) acc[standard.id] = standard.evidence || "";
        return acc;
      }, {} as Record<string, string>));

      setAttachments(assessment.standards.reduce((acc, standard) => {
        if (standard.id) acc[standard.id] = [];
        return acc;
      }, {} as Record<string, FileAttachment[]>));
    }
  }, [assessment]);

  useEffect(() => {
    if (!assessment?.standards) return;

    let cancelled = false;

    const loadActions = async () => {
      setActionsLoadError(null);
      const emptyActions = assessment.standards!.reduce((acc, standard) => {
        if (standard.id) acc[standard.id] = [];
        return acc;
      }, {} as Record<string, UiAction[]>);

      try {
        const entries = await Promise.all(
          assessment.standards!.map(async (standard) => {
            if (!standard.id) return null;
            const assessmentId = resolveStandardAssessmentId(
              standard as StandardWithAssessmentId,
              assessment,
              id
            );
            if (!assessmentId) return [standard.id, [] as UiAction[]] as const;
            const items = await getActions(assessmentId);
            return [standard.id, items] as const;
          })
        );

        if (cancelled) return;

        const loaded = { ...emptyActions };
        for (const entry of entries) {
          if (entry) {
            loaded[entry[0]] = entry[1];
          }
        }
        setActions(loaded);
      } catch (error) {
        console.error("Failed to load actions:", error);
        if (!cancelled) {
          setActionsLoadError("Failed to load action items. Please refresh the page.");
          setActions(emptyActions);
        }
      }
    };

    loadActions();

    return () => {
      cancelled = true;
    };
  }, [assessment, id]);

  const [saving, setSaving] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [activeStandardIndex, setActiveStandardIndex] = useState(0);

  const standardsRatingInputs = useMemo(() => {
    if (!assessment?.standards) return [];
    return getSortedStandards(assessment.standards).map((s) => ({
      rating: s.id ? ratings[s.id] ?? s.rating : s.rating,
      standard_type: s.standard_type,
    }));
  }, [assessment?.standards, ratings]);

  const overallAvg = useMemo(
    () => calculateAverageRating(standardsRatingInputs),
    [standardsRatingInputs]
  );
  const assuranceAvg = useMemo(
    () =>
      calculateAverageRating(
        standardsRatingInputs.filter(
          (s) => (s.standard_type || "assurance") === "assurance"
        )
      ),
    [standardsRatingInputs]
  );
  const riskAvg = useMemo(
    () =>
      calculateAverageRating(
        standardsRatingInputs.filter((s) => s.standard_type === "risk")
      ),
    [standardsRatingInputs]
  );

  const groupedStandards = useMemo(() => {
    if (!assessment?.standards) return { assurance: [] as Standard[], risk: [] as Standard[] };
    return getGroupedStandards(assessment.standards);
  }, [assessment?.standards]);

  const navigationStandards = useMemo(() => {
    if (!assessment?.standards) return [] as Standard[];
    return getNavigationStandards(assessment.standards);
  }, [assessment?.standards]);
  
  // Edit mode state for completed assessments
  const [isEditMode, setIsEditMode] = useState(false);
  const [originalRatings, setOriginalRatings] = useState<Record<string, Rating>>({});
  const [originalEvidence, setOriginalEvidence] = useState<Record<string, string>>({});
  const [originalAttachments, setOriginalAttachments] = useState<Record<string, FileAttachment[]>>({});
  
  useEffect(() => {
    if (assessment?.standards && activeStandard) {
      const index = navigationStandards.findIndex((s) => s.id === activeStandard.id);
      if (index !== -1) {
        setActiveStandardIndex(index);
      }
    }
  }, [activeStandard, assessment, navigationStandards]);

  const goToNextStandard = () => {
    if (navigationStandards.length > 0 && activeStandardIndex < navigationStandards.length - 1) {
      setActiveStandard(navigationStandards[activeStandardIndex + 1]);
    }
  };

  const goToPreviousStandard = () => {
    if (navigationStandards.length > 0 && activeStandardIndex > 0) {
      setActiveStandard(navigationStandards[activeStandardIndex - 1]);
    }
  };

  const findNextUnratedStandard = useCallback(
    (fromStandardId: string | undefined): Standard | null => {
      if (!fromStandardId) return null;
      const startIndex = navigationStandards.findIndex((s) => s.id === fromStandardId);
      if (startIndex === -1) return null;

      const isRated = (standard: Standard) => {
        const standardId = standard.id;
        if (!standardId) return true;
        if (ratings[standardId] != null) return true;
        return standard.rating != null;
      };

      for (let i = startIndex + 1; i < navigationStandards.length; i++) {
        if (!isRated(navigationStandards[i])) {
          return navigationStandards[i];
        }
      }
      return null;
    },
    [navigationStandards, ratings]
  );

  // Edit mode functions
  const handleEnterEditMode = () => {
    // Store original values for cancellation
    setOriginalRatings({ ...ratings });
    setOriginalEvidence({ ...evidence });
    setOriginalAttachments({ ...attachments });
    setIsEditMode(true);
    
    toast({
      title: "Edit mode enabled",
      description: "You can now modify this completed assessment. Don't forget to save your changes.",
    });
  };

  const handleCancelEdit = () => {
    // Restore original values
    setRatings(originalRatings);
    setEvidence(originalEvidence);
    setAttachments(originalAttachments);
    setIsEditMode(false);
    
    toast({
      title: "Changes cancelled",
      description: "All modifications have been reverted to the original values.",
    });
  };

  const handleRatingChange = useCallback((standardId: string, value: Rating) => {
    setRatings((prev) => ({
      ...prev,
      [standardId]: value,
    }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!assessment || !id) return;

    setSaving(true);
    try {
      const standardsWithData = new Set<string>();

      Object.entries(ratings).forEach(([standardId, rating]) => {
        if (rating !== null) {
          standardsWithData.add(standardId);
        }
      });

      Object.entries(evidence).forEach(([standardId, evidenceText]) => {
        if (evidenceText && evidenceText.trim().length > 0) {
          standardsWithData.add(standardId);
        }
      });

      const standards = Array.from(standardsWithData).map((standardId) => ({
        standardId,
        rating: ratings[standardId] || null,
        evidence: evidence[standardId] || "",
      }));

      if (standards.length === 0) {
        toast({
          title: "Nothing to save",
          description:
            "Please add a rating or evidence to at least one standard before saving.",
          variant: "destructive",
        });
        return;
      }

      await submitAssessment(standards);
      await refreshAssessment();

      toast({
        title: "Progress saved",
        description: `Successfully saved progress for ${standards.length} standard${standards.length > 1 ? "s" : ""}`,
        variant: "default",
      });
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "Save failed",
        description: "There was an error saving your progress. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }, [assessment, id, ratings, evidence, submitAssessment, refreshAssessment, toast]);

  const handleSaveAndContinue = useCallback(async () => {
    const currentStandardId = activeStandard?.id;
    await handleSave();
    const nextStandard = findNextUnratedStandard(currentStandardId);
    if (nextStandard) {
      setActiveStandard(nextStandard);
      return;
    }
    toast({
      title: "All standards rated",
      description:
        "No further unrated standards remain. You can submit the assessment when ready.",
    });
  }, [activeStandard?.id, findNextUnratedStandard, handleSave, toast]);

  const handleSaveEdit = async () => {
    await handleSave();
    setIsEditMode(false);

    toast({
      title: "Assessment updated",
      description: "Your changes have been saved successfully.",
    });
  };

  const canEditForShortcuts =
    !!assessment &&
    (role === "department-head" || role === "mat-admin") &&
    (assessment.status !== "completed" || isEditMode);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activeStandard || !canEditForShortcuts) return;

      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (e.key === "ArrowRight" || (e.key.toLowerCase() === "j" && (e.ctrlKey || e.metaKey))) {
        e.preventDefault();
        goToNextStandard();
      } else if (e.key === "ArrowLeft" || (e.key.toLowerCase() === "k" && (e.ctrlKey || e.metaKey))) {
        e.preventDefault();
        goToPreviousStandard();
      } else if (
        !isTyping &&
        ["1", "2", "3", "4"].includes(e.key) &&
        !e.ctrlKey &&
        !e.metaKey &&
        activeStandard?.id
      ) {
        handleRatingChange(activeStandard.id, parseInt(e.key, 10) as Rating);
      } else if (e.key.toLowerCase() === "s" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        void handleSave();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    activeStandard,
    canEditForShortcuts,
    goToNextStandard,
    goToPreviousStandard,
    handleRatingChange,
    handleSave,
  ]);

  // Update the UI for keyboard shortcuts help
  const keyboardShortcuts = [
    { key: "→ / ⌘J", action: "Next standard" },
    { key: "← / ⌘K", action: "Previous standard" },
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
            Back to Ratings
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
              <Link to="/app/assessments">Return to Ratings</Link>
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
  
  const findStandardById = (standardId: string) =>
    assessment?.standards?.find(
      (std) => std.mat_standard_id === standardId || std.id === standardId
    );

  const getAssessmentIdForStandard = (standardId: string) => {
    const standard = findStandardById(standardId);
    return resolveStandardAssessmentId(
      standard as StandardWithAssessmentId | undefined,
      assessment!,
      id
    );
  };

  const setStandardMutating = (standardId: string, mutating: boolean) => {
    setActionsMutating((prev) => ({ ...prev, [standardId]: mutating }));
  };

  const handleAddAction = async (standardId: string) => {
    const text = newActionText[standardId]?.trim();
    if (!text || !assessment) return;

    const assessmentId = getAssessmentIdForStandard(standardId);
    if (!assessmentId) {
      setActionsError("Could not resolve assessment for this standard.");
      return;
    }

    setActionsError(null);
    setStandardMutating(standardId, true);
    try {
      const newAction = await createAction(assessmentId, text);
      setActions((prev) => ({
        ...prev,
        [standardId]: [...(prev[standardId] || []), newAction],
      }));
      setNewActionText((prev) => ({
        ...prev,
        [standardId]: "",
      }));
    } catch (error) {
      setActionsError(
        error instanceof Error ? error.message : "Failed to add action item."
      );
    } finally {
      setStandardMutating(standardId, false);
    }
  };

  const handleToggleAction = async (standardId: string, actionId: string) => {
    if (!assessment) return;

    const current = actions[standardId]?.find((a) => a.id === actionId);
    if (!current) return;

    const assessmentId = getAssessmentIdForStandard(standardId);
    if (!assessmentId) {
      setActionsError("Could not resolve assessment for this standard.");
      return;
    }

    setActionsError(null);
    setStandardMutating(standardId, true);
    try {
      const updated = await updateAction(assessmentId, actionId, {
        is_completed: !current.completed,
      });
      setActions((prev) => ({
        ...prev,
        [standardId]: (prev[standardId] || []).map((action) =>
          action.id === actionId ? updated : action
        ),
      }));
    } catch (error) {
      setActionsError(
        error instanceof Error ? error.message : "Failed to update action item."
      );
    } finally {
      setStandardMutating(standardId, false);
    }
  };

  const handleDeleteAction = async (standardId: string, actionId: string) => {
    if (!assessment) return;

    const assessmentId = getAssessmentIdForStandard(standardId);
    if (!assessmentId) {
      setActionsError("Could not resolve assessment for this standard.");
      return;
    }

    setActionsError(null);
    setStandardMutating(standardId, true);
    try {
      await deleteAction(assessmentId, actionId);
      setActions((prev) => ({
        ...prev,
        [standardId]: (prev[standardId] || []).filter(
          (action) => action.id !== actionId
        ),
      }));
    } catch (error) {
      setActionsError(
        error instanceof Error ? error.message : "Failed to delete action item."
      );
    } finally {
      setStandardMutating(standardId, false);
    }
  };
  
  const handleSubmit = async () => {
    if (!assessment || !id) return;
    
    const standardIds = assessment.standards?.map(s => s.id).filter((id): id is string => !!id) || [];
    const unratedStandards = standardIds.filter(id => ratings[id] === null || ratings[id] === undefined);
    
    if (unratedStandards.length > 0) {
      toast({
        title: "Cannot submit",
        description: "Please rate all standards before submitting the assessment.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const standards = standardIds.map(standardId => ({
        standardId,
        rating: ratings[standardId] || null,
        evidence: evidence[standardId] || '',
      }));

      await submitAssessment(standards);
      await refreshAssessment();

      setShowSuccessDialog(true);
    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: "Submit failed",
        description: "There was an error submitting your assessment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getStandardStatus = (standard: Standard) => {
    if (!standard.id) return "incomplete";
    const rating = ratings[standard.id];
    
    if (rating !== null && rating !== undefined) {
      return "complete";
    } else if (evidence[standard.id] && evidence[standard.id].length > 0) {
      return "partial";
    } else {
      return "incomplete";
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case "not_started":
        return "bg-slate-100 text-slate-800 hover:bg-slate-200";
      case "overdue":
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
        return <CheckCircle className="h-5 w-5 text-slate-300" />; // Grey checkmark for not rated
      default:
        return null;
    }
  };

  const isCompleted = progressPercentage === 100;
  const canSubmit = isCompleted && (role === "department-head" || role === "mat-admin") && (assessment.status !== "completed" || isEditMode);
  const canEdit = canEditForShortcuts;

  return (
    <div className="container max-w-7xl py-6 md:py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/app/assessments")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Ratings
        </Button>
        
        <div className="flex items-center gap-4">
          {/* Edit Ratings Button for MAT Admins in Admin View */}
          {role === "mat-admin" && isAdminView && (
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                // Switch to Department Head view by removing ?view=admin
                const newUrl = window.location.pathname;
                navigate(newUrl);
              }}
              className="gap-2"
            >
              <span className="text-xs">✏️</span>
              Edit Ratings
            </Button>
          )}
          
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
                      {ra.school?.name || ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Edit Assessment Button for Department Heads */}
          {role === "department-head" && assessment.status === "completed" && !isEditMode && !isAdminView && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleEnterEditMode}
              className="gap-2"
            >
              <span className="text-xs">✏️</span>
              Edit Assessment
            </Button>
          )}
        </div>
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
                  {assessment.school?.name || ''} • {assessment.category}
                </p>
              </div>
            </div>
            
            {aspectCategory && (
              <div className="mt-4">
                <AspectCategoryBadge category={aspectCategory} />
              </div>
            )}
          </div>
          
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6 min-w-0 lg:min-w-[480px]">
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
                  {(assessment.last_updated || assessment.lastUpdated) && assessment.lastUpdated !== "-" 
                    ? new Date(assessment.last_updated || assessment.lastUpdated!).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short'
                      })
                    : "Never"
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-4 w-4 text-slate-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Status
                </p>
                <Badge
                  className={cn(
                    "mt-0.5 px-2 py-0.5 text-xs font-medium border",
                    assessment.status === "completed" && "bg-emerald-100 text-emerald-700 border-emerald-200",
                    assessment.status === "in_progress" && "bg-blue-100 text-blue-700 border-blue-200",
                    assessment.status === "not_started" && "bg-slate-100 text-slate-700 border-slate-200",
                    isOverdue(assessment) && "bg-red-100 text-red-700 border-red-200"
                  )}
                >
                  {formatStatus(assessment.status)}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                <ClipboardCheck className="h-4 w-4 text-slate-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Completion
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="w-14 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all duration-300",
                        progressPercentage === 100 ? "bg-emerald-500" : "bg-slate-400"
                      )}
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-slate-900">
                    {completedCount}/{totalCount}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Only show assessment form for department heads and mat admins in non-admin view */}
      {(role === "department-head" || role === "mat-admin") && !isAdminView && assessment.standards && (
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
                {([
                  {
                    key: "assurance" as const,
                    title: "Assurance",
                    standards: groupedStandards.assurance,
                    headerClass: "text-green-800",
                  },
                  {
                    key: "risk" as const,
                    title: "Risk",
                    standards: groupedStandards.risk,
                    headerClass: "text-red-800",
                  },
                ] as const)
                  .filter((section) => section.standards.length > 0)
                  .map((section) => (
                    <div key={section.key} className="space-y-1">
                      <p
                        className={cn(
                          "text-xs font-medium px-3 pt-2 pb-1",
                          section.headerClass
                        )}
                      >
                        {section.title}
                      </p>
                      {section.standards.map((standard, index) => (
                        <Button
                          key={standard.id}
                          variant="ghost"
                          className={cn(
                            "w-full justify-between rounded-lg px-4 py-3 h-auto border transition-colors",
                            activeStandard?.id === standard.id
                              ? "border-primary/70 bg-primary/5"
                              : "border-transparent hover:bg-slate-50"
                          )}
                          onClick={() => setActiveStandard(standard)}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={cn(
                                "text-slate-700 rounded-full w-6 h-6 flex-shrink-0 flex items-center justify-center text-xs font-medium",
                                activeStandard?.id === standard.id
                                  ? "bg-primary/10 text-primary"
                                  : "bg-slate-200"
                              )}
                            >
                              {index + 1}
                            </div>
                            <div className="text-left min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                  className={cn(
                                    "font-medium text-sm",
                                    activeStandard?.id === standard.id ? "text-primary" : ""
                                  )}
                                >
                                  {standard.code}
                                </span>
                                <StandardTypeBadge
                                  type={standard.standard_type || "assurance"}
                                  className="text-[9px] px-1 py-0 h-4 leading-4"
                                />
                              </div>
                              <span
                                className={cn(
                                  "text-xs truncate max-w-[150px] block",
                                  activeStandard?.id === standard.id
                                    ? "text-foreground"
                                    : "text-muted-foreground"
                                )}
                              >
                                {standard.title}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center flex-shrink-0">
                            {getStatusIcon(getStandardStatus(standard))}
                          </div>
                        </Button>
                      ))}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
            
          {/* Standard Detail - Main Content */}
          <div className="md:col-span-8 lg:col-span-9">
            {activeStandard && activeStandard.id && (
              <Card className="h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-primary border-primary">
                        Standard {activeStandardIndex + 1} of {totalCount}
                      </Badge>
                      <StandardTypeBadge
                        type={activeStandard.standard_type || "assurance"}
                        className="text-[10px] h-5 px-1.5 py-0.5"
                      />
                    </div>
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
                              {RATING_OPTIONS.map((rating) => (
                                <p key={rating}>
                                  {rating}: {getRatingLabel(rating, activeStandard.standard_type)} —{' '}
                                  {getRatingDescription(rating, activeStandard.standard_type)}
                                </p>
                              ))}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
                        {RATING_OPTIONS.map((rating) => {
                          const isSelected = ratings[activeStandard.id!] === rating;
                          const standardType = activeStandard.standard_type;
                          return (
                            <div 
                              key={rating}
                              className={cn(
                                "border rounded-lg px-4 py-3 cursor-pointer transition-all relative",
                                isSelected 
                                  ? "border-primary bg-primary/5" 
                                  : "hover:border-slate-400",
                                !canEdit
                                  ? "opacity-60 pointer-events-none" 
                                  : ""
                              )}
                              onClick={() => canEdit && 
                                handleRatingChange(activeStandard.id!, rating as Rating)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-medium">{rating}:</span>
                                  <span className="font-medium">{getRatingLabel(rating, standardType)}</span>
                                </div>
                                {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1.5">
                                {getRatingDescription(rating, standardType)}
                              </p>
                              {role === "department-head" && assessment.status !== "completed" && (
                                <span className="absolute top-2 right-2 text-xs font-mono text-muted-foreground bg-gray-50 px-1.5 py-0.5 rounded">
                                  {rating}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Comments & Actions Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Comments Section */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-base font-medium">Comments <span className="text-xs text-muted-foreground">(Optional)</span></h3>
                          <span className="text-xs text-muted-foreground">
                            {evidence[activeStandard.id!]?.length || 0} / 500
                          </span>
                        </div>
                        <Textarea
                          placeholder="Provide specific evidence to support your rating (optional)..."
                          value={evidence[activeStandard.id!] || ""}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                            handleEvidenceChange(activeStandard.id!, e.target.value)
                          }
                          disabled={!canEdit}
                          className="min-h-[150px] resize-y"
                          maxLength={500}
                        />
                        <p className="mt-2 text-sm text-muted-foreground">
                          <Info className="inline h-3.5 w-3.5 mr-1" />
                          Provide specific examples to support your rating
                        </p>
                      </div>
                      
                      {/* Actions Section */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-base font-medium">Actions <span className="text-xs text-muted-foreground">(Optional)</span></h3>
                          <span className="text-xs text-muted-foreground">
                            {actions[activeStandard.id!]?.filter((a) => a.completed).length || 0} / {actions[activeStandard.id!]?.length || 0} completed
                          </span>
                        </div>

                        {(actionsLoadError || actionsError) && (
                          <div className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                            {actionsError || actionsLoadError}
                          </div>
                        )}
                        
                        {/* Add Action Input */}
                        {canEdit && (
                          <div className="flex gap-2 mb-3">
                            <Input
                              placeholder="Add an action item..."
                              value={newActionText[activeStandard.id!] || ""}
                              onChange={(e) => setNewActionText(prev => ({
                                ...prev,
                                [activeStandard.id!]: e.target.value
                              }))}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddAction(activeStandard.id!);
                                }
                              }}
                              disabled={!!actionsMutating[activeStandard.id!]}
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => activeStandard?.id && handleAddAction(activeStandard.id)}
                              disabled={
                                !activeStandard?.id ||
                                !newActionText[activeStandard.id]?.trim() ||
                                !!actionsMutating[activeStandard.id!]
                              }
                            >
                              Add
                            </Button>
                          </div>
                        )}
                        
                        {/* Actions List */}
                        <div className="space-y-2 min-h-[150px] max-h-[200px] overflow-y-auto border rounded-md p-3">
                          {!activeStandard?.id || !actions[activeStandard.id] || actions[activeStandard.id].length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">
                              No actions added yet
                            </p>
                          ) : (
                            actions[activeStandard.id].map((action) => (
                              <div key={action.id} className="flex items-start gap-2 group">
                                <Checkbox
                                  checked={action.completed}
                                  onCheckedChange={() => activeStandard?.id && handleToggleAction(activeStandard.id, action.id)}
                                  disabled={!canEdit || !!actionsMutating[activeStandard.id!]}
                                  className="mt-1"
                                />
                                <span className={`flex-1 text-sm ${action.completed ? 'line-through text-muted-foreground' : ''}`}>
                                  {action.text}
                                </span>
                                {canEdit && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => activeStandard?.id && handleDeleteAction(activeStandard.id, action.id)}
                                    disabled={!!actionsMutating[activeStandard.id!]}
                                  >
                                    <XCircle className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                        
                        <p className="mt-2 text-sm text-muted-foreground">
                          <Info className="inline h-3.5 w-3.5 mr-1" />
                          Track follow-up actions required for this standard
                        </p>
                      </div>
                    </div>

                    {/* File Upload Section */}
                    {canEdit && (
                      <div>
                        <h3 className="text-base font-medium mb-3">Supporting Documents <span className="text-xs text-muted-foreground">(Optional)</span></h3>
                        <FileUpload
                          onFilesChange={(files) => activeStandard.id && handleAttachmentsChange(activeStandard.id, files)}
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
                    {(isAdminView || assessment.status === "completed") && 
                     activeStandard?.id &&
                     attachments[activeStandard.id] && 
                     attachments[activeStandard.id].length > 0 && (
                      <div>
                        <h3 className="text-base font-medium mb-3">Supporting Documents</h3>
                        <div className="space-y-2">
                          {activeStandard?.id && attachments[activeStandard.id].map((file: any) => (
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
                
                {(role === "department-head" || role === "mat-admin") && (assessment.status !== "completed" || isEditMode) && (
                  <div className="pb-24">
                    {/* Add padding to account for sticky bottom bar */}
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>
      )}
      
      {/* Sticky Bottom Navigation Bar for Department Heads and MAT Admins */}
      {(role === "department-head" || role === "mat-admin") && (assessment.status !== "completed" || isEditMode) && !isAdminView && (
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
                {isEditMode ? (
                  // Edit mode buttons
                  <>
                    <Button 
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={saving}
                      className="gap-2"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSaveEdit}
                      disabled={saving}
                      className="gap-2"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </>
                ) : activeStandardIndex < totalCount - 1 ? (
                  <Button 
                    onClick={() => void handleSaveAndContinue()}
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
                  <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">⌘J/⌘K</kbd>
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
        <TooltipProvider delayDuration={200}>
        <div className="space-y-6">
          {/* Compact Metrics Bar */}
          <Card className="border-slate-200/60">
            <CardContent className="px-6 py-4 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <span className="text-slate-700 font-semibold text-sm">
                      {overallAvg != null ? overallAvg.toFixed(1) : "—"}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Average Score</p>
                    <p className="text-sm font-semibold text-slate-900">Overall Rating</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-lg bg-green-50 border border-green-100 flex items-center justify-center">
                    <span className="text-green-800 font-semibold text-sm">
                      {assuranceAvg != null ? assuranceAvg.toFixed(1) : "—"}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-green-700/70 font-medium">Average Score</p>
                    <p className="text-sm font-semibold text-slate-900">Assurance Avg</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center">
                    <span className="text-red-800 font-semibold text-sm">
                      {riskAvg != null ? riskAvg.toFixed(1) : "—"}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-red-700/70 font-medium">Average Score</p>
                    <p className="text-sm font-semibold text-slate-900">Risk Avg</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200/60 pt-4 grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <span className="text-slate-700 font-semibold text-sm">
                      {Math.round(((assessment.completedStandards || 0) / (assessment.totalStandards || 1)) * 100)}%
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Completion Rate</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {assessment.completedStandards || 0}/{assessment.totalStandards || 0} Standards
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
                      {assessment.last_updated ? new Date(assessment.last_updated).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short'
                      }) : 'N/A'}
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
                      {formatStatus(assessment.status)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <User className="h-4 w-4 text-slate-700" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Updated by</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {/* REQ-047: no fallback. updated_by is written only on edit, so
                          its absence means nobody has edited this — and the assignee,
                          the submitter and a raw user id are all answers to a
                          different question. An em dash is the true one. */}
                      {assessment.updated_by_name || "—"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Standards Table — grouped by standard type */}
          <Card className="border-slate-200/60">
            {([
              {
                key: "assurance" as const,
                title: "Assurance Standards",
                standards: groupedStandards.assurance,
                headerClass: "text-green-800",
              },
              {
                key: "risk" as const,
                title: "Risk Standards",
                standards: groupedStandards.risk,
                headerClass: "text-red-800",
              },
            ] as const)
              .filter((section) => section.standards.length > 0)
              .map((section, sectionIndex) => (
                <div
                  key={section.key}
                  className={cn(sectionIndex > 0 && "border-t border-slate-200/60")}
                >
                  <div className="px-6 pt-4 pb-2">
                    <h3
                      className={cn(
                        "text-sm font-medium text-slate-600",
                        section.headerClass
                      )}
                    >
                      {section.title}
                    </h3>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-200/60">
                        <TableHead className="w-12 text-center font-semibold text-slate-600">#</TableHead>
                        <TableHead className="w-24 text-center font-semibold text-slate-600">Type</TableHead>
                        <TableHead className="font-semibold text-slate-600">Standard</TableHead>
                        <TableHead className="w-24 text-center font-semibold text-slate-600">Rating</TableHead>
                        <TableHead className="w-20 text-center font-semibold text-slate-600">Status</TableHead>
                        <TableHead className="w-80 font-semibold text-slate-600">Comments</TableHead>
                        <TableHead className="w-20 font-semibold text-slate-600">Files</TableHead>
                        <TableHead className="w-20 text-center font-semibold text-slate-600">Actions</TableHead>
                        <TableHead className="w-36 font-semibold text-slate-600">Updated by</TableHead>
                        <TableHead className="w-24 text-right font-semibold text-slate-600">Updated</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {section.standards.map((standard, index) => (
                        <TableRow
                          key={standard.id}
                          className="border-slate-200/60 hover:bg-slate-50/50 transition-colors"
                        >
                          <TableCell className="text-center">
                            <span className="text-sm font-medium text-slate-500">
                              {index + 1}
                            </span>
                          </TableCell>

                          <TableCell className="text-center">
                            <StandardTypeBadge
                              type={standard.standard_type || "assurance"}
                              className="text-[10px] px-1.5 py-0.5"
                            />
                          </TableCell>

                          <TableCell className="py-4">
                            <div className="space-y-1">
                              <h4 className="font-medium text-slate-900 leading-tight">
                                {standard.title}
                              </h4>
                              <AdminStandardDescription
                                description={
                                  standard.description ?? standard.standard_description
                                }
                              />
                            </div>
                          </TableCell>

                          <TableCell className="text-center">
                            {standard.rating && (
                              <div className="flex justify-center">
                                <div
                                  className={cn(
                                    "inline-flex items-center justify-center h-8 w-8 rounded-full text-sm font-semibold",
                                    getRagBadgeClasses(standard.rating, standard.standard_type)
                                  )}
                                >
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
                              <span className="text-sm text-slate-400 italic">No comments provided</span>
                            )}
                          </TableCell>

                          <TableCell className="text-center">
                            <span className="text-sm text-slate-500">
                              {standard.id ? (attachments[standard.id]?.length || 0) : 0}
                            </span>
                          </TableCell>

                          <TableCell className="text-center">
                            {(() => {
                              const actionCount = standard.id
                                ? (actions[standard.id]?.length ?? 0)
                                : 0;
                              return (
                                <span
                                  className={cn(
                                    "inline-flex min-w-[1.5rem] justify-center rounded-full px-2 py-0.5 text-sm font-semibold tabular-nums",
                                    actionCount > 0
                                      ? "bg-amber-100 text-amber-800 border border-amber-200"
                                      : "text-slate-400"
                                  )}
                                >
                                  {actionCount}
                                </span>
                              );
                            })()}
                          </TableCell>

                          <TableCell>
                            <span className="text-sm text-slate-600">
                              {/* REQ-047: see the "Updated by" card above — no fallback
                                  to the assignee, who is not the editor. */}
                              {(standard as any).updated_by_name || "—"}
                            </span>
                          </TableCell>

                          <TableCell className="text-right">
                            <span className="text-sm text-slate-500">
                              {(() => {
                                const s: any = standard as any;
                                const ts = s.last_updated || s.updated_at || s.updatedAt;
                                if (!ts) return "—";
                                const date = new Date(ts);
                                if (Number.isNaN(date.getTime())) return "—";
                                return date.toLocaleDateString("en-GB", {
                                  day: "numeric",
                                  month: "short",
                                });
                              })()}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}
          </Card>
        </div>
        </TooltipProvider>
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
              Thank you for completing the {assessment.name} for {assessment.school?.name || ''}.
            </DialogDescription>
          </DialogHeader>

          {assessment.standards && assessment.standards.length > 0 && (
            <div className="space-y-2 my-2">
              <h4 className="text-sm font-medium">Assessment Summary:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {RATING_OPTIONS.flatMap((rating) => {
                  const standardsAtRating = assessment.standards!.filter(
                    (s) => s.id && ratings[s.id] === rating
                  );
                  if (standardsAtRating.length === 0) return [];

                  const byType = new Map<StandardType | 'assurance', typeof standardsAtRating>();
                  for (const s of standardsAtRating) {
                    const type = s.standard_type || 'assurance';
                    const group = byType.get(type) || [];
                    group.push(s);
                    byType.set(type, group);
                  }

                  return Array.from(byType.entries()).map(([type, stds]) => (
                    <div key={`${rating}-${type}`} className="flex items-center gap-1.5">
                      <span className="font-medium text-slate-700">
                        {stds.length}× {getRatingLabel(rating, type)}
                      </span>
                    </div>
                  ));
                })}
              </div>
            </div>
          )}
          
          <p className="text-sm">
            Your assessment has been submitted and will be reviewed by the MAT administrators.
                          You can view your submission at any time from the ratings dashboard.
          </p>
          <DialogFooter>
            <Button onClick={() => {
              setShowSuccessDialog(false);
              navigate("/app/assessments");
            }}>
                              Return to Ratings
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