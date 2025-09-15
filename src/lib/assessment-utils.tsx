import type { Assessment, AssessmentCategory, Standard, User, AssessmentStatus } from "@/types/assessment";
import { cn } from "@/lib/utils";
import { 
  AlertTriangle, 
  BookOpen, 
  CheckCircle2, 
  ClipboardCheck, 
  Clock, 
  FileText, 
  ListChecks, 
  Users 
} from "lucide-react";

// #region Status and Color Helpers

export const getStatusColor = (status: string) => {
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

export const getStatusIcon = (status: string) => {
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

export const getRatingColor = (rating: number) => {
  if (rating < 2) return "bg-rose-500";
  if (rating < 3) return "bg-amber-500";
  if (rating < 4) return "bg-emerald-500";
  return "bg-indigo-600";
};

export const getRatingTextColor = (rating: number) => {
  if (rating < 2) return "text-rose-700";
  if (rating < 3) return "text-amber-700";
  if (rating < 4) return "text-emerald-700";
  return "text-indigo-700";
};

export const getRatingGradient = (rating: number) => {
  if (rating < 2) return "bg-gradient-to-r from-rose-50 to-white";
  if (rating < 3) return "bg-gradient-to-r from-amber-50 to-white";
  if (rating < 4) return "bg-gradient-to-r from-emerald-50 to-white";
  return "bg-gradient-to-r from-indigo-50 to-white";
};

/**
 * Calculate the overall status for a school based on its individual assessment statuses
 * Priority: Overdue > In Progress > Mixed State > All Completed > All Not Started
 */
export const calculateSchoolStatus = (assessments: Array<{status: AssessmentStatus}>): AssessmentStatus => {
  if (assessments.length === 0) return "Not Started";

  const statuses = assessments.map(a => a.status);
  const uniqueStatuses = [...new Set(statuses)];
  
  // If any assessment is overdue, the school is overdue
  if (statuses.includes("Overdue")) return "Overdue";
  
  // If any assessment is explicitly in progress, the school is in progress
  if (statuses.includes("In Progress")) return "In Progress";
  
  // If all assessments are completed, the school is completed
  if (statuses.every(status => status === "Completed")) return "Completed";
  
  // If all assessments are not started, the school is not started
  if (statuses.every(status => status === "Not Started")) return "Not Started";
  
  // If there's a mix of statuses (some completed, some not started), show in progress
  if (uniqueStatuses.length > 1) return "In Progress";
  
  // Default fallback
  return "Not Started";
};

// #endregion

// #region Data Calculation and Formatting Helpers

export const calculateCategoryAverages = (assessment: Assessment) => {
  if (!assessment.standards || assessment.standards.length === 0) {
    return {};
  }

  const standardsByCode: Record<string, Standard[]> = {};
  
  assessment.standards.forEach(standard => {
    const prefix = standard.code.substring(0, 2);
    if (!standardsByCode[prefix]) {
      standardsByCode[prefix] = [];
    }
    standardsByCode[prefix].push(standard);
  });

  const averages: Record<string, { average: number, count: number, title: string }> = {};
  
  Object.entries(standardsByCode).forEach(([prefix, standards]) => {
    const validStandards = standards.filter(s => s.rating !== null);
    if (validStandards.length > 0) {
      const sum = validStandards.reduce((acc, s) => acc + (s.rating || 0), 0);
      averages[prefix] = {
        average: sum / validStandards.length,
        count: validStandards.length,
        title: standards[0].title.split(' ')[0] + ' ' + standards[0].title.split(' ')[1]
      };
    }
  });

  return averages;
};

export const calculateOverallAverage = (assessment: Assessment) => {
  if (!assessment.standards || assessment.standards.length === 0) {
    return 0;
  }

  const validStandards = assessment.standards.filter(s => s.rating !== null);
  if (validStandards.length === 0) return 0;
  
  const sum = validStandards.reduce((acc, s) => acc + (s.rating || 0), 0);
  return sum / validStandards.length;
};

export const getAssignedUsers = (assessment: Assessment) => {
  if (!assessment.assignedTo || assessment.assignedTo.length === 0) return "Unassigned";
  
  if (assessment.assignedTo.length === 1) {
    return assessment.assignedTo[0].name;
  }
  
  return `${assessment.assignedTo[0].name} + ${assessment.assignedTo.length - 1} more`;
};

export const hasCriticalStandards = (assessment: Assessment) => {
  if (!assessment.standards) return false;
  return assessment.standards.some(standard => standard.rating === 1);
};

export const countCriticalStandards = (assessment: Assessment) => {
  if (!assessment.standards) return 0;
  return assessment.standards.filter(standard => standard.rating === 1).length;
};

export const getCategoryIcon = (category: string) => {
  // Normalize to display name first
  const displayName = getAspectDisplayName(category);
  
  switch (displayName) {
    case "Education":
      return <BookOpen className="h-4 w-4" />;
    case "Human Resources":
      return <Users className="h-4 w-4" />;
    case "Finance":
      return <FileText className="h-4 w-4" />;
    case "Governance":
      return <ClipboardCheck className="h-4 w-4" />;
    case "Estates":
      return <ClipboardCheck className="h-4 w-4" />;
    case "Information Standards":
      return <ClipboardCheck className="h-4 w-4" />;
    case "IT":
      return <ClipboardCheck className="h-4 w-4" />;
    default:
      return <ClipboardCheck className="h-4 w-4" />;
  }
};

/**
 * Maps aspect category codes to their full display names
 * Updated to match backend API exactly
 */
export const getAspectDisplayName = (category: string): string => {
  const aspectMap: Record<string, string> = {
    // Backend API category mappings (lowercase codes to display names)
    "education": "Education",
    "estates": "Estates", 
    "finance": "Finance",
    "governance": "Governance",
    "hr": "Human Resources",
    "is": "Information Standards",
    "it": "IT",
    
    // Display name variations (case-insensitive support)
    "Education": "Education",
    "Estates": "Estates",
    "Finance": "Finance", 
    "Governance": "Governance",
    "Human Resources": "Human Resources",
    "Information Standards": "Information Standards",
    "IT": "IT",
    
    // Legacy support for existing data
    "Finance & Procurement": "Finance",
    "IT & Information Services": "IT",
    "IT (Digital Aspects)": "Information Standards",
    "Hr": "Human Resources",
    "It": "IT",
    "Is": "Information Standards",
  };
  
  return aspectMap[category] || category;
};

/**
 * Gets the short display code for an aspect category
 */
export const getAspectShortCode = (category: string): string => {
  const codeMap: Record<string, string> = {
    // Backend API category codes to short codes
    "education": "ED",
    "estates": "ES", 
    "finance": "FN",
    "governance": "GV",
    "hr": "HR",
    "is": "IS",
    "it": "IT",
    
    // Display name to short codes
    "Education": "ED",
    "Estates": "ES",
    "Finance": "FN",
    "Governance": "GV",
    "Human Resources": "HR",
    "Information Standards": "IS",
    "IT": "IT",
    
    // Legacy support
    "Finance & Procurement": "FN",
    "IT & Information Services": "IT",
    "IT (Digital Aspects)": "IS",
  };
  
  return codeMap[category] || category;
};

// Backward compatibility aliases
// These aliases were removed to avoid naming conflicts

// #endregion
