import type { AssessmentGroup, Assessment, Standard, AssessmentStatus } from "@/types/assessment";
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
import { getDisplayStatus, getStatusLabel } from "@/utils/assessment";

// #region Status and Color Helpers

export const getStatusColor = (status: string) => {
  const displayStatus = status.replace('_', ' ').toLowerCase();
  
  switch (displayStatus) {
    case "completed":
    case "approved":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100";
    case "in progress":
    case "in_progress":
      return "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100";
    case "not started":
    case "not_started":
      return "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100";
    case "overdue":
      return "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100";
  }
};

export const getStatusIcon = (status: string) => {
  const displayStatus = status.replace('_', ' ').toLowerCase();
  
  switch (displayStatus) {
    case "completed":
    case "approved":
      return <CheckCircle2 className="h-4 w-4" />;
    case "in progress":
    case "in_progress":
      return <Clock className="h-4 w-4" />;
    case "not started":
    case "not_started":
      return <ListChecks className="h-4 w-4" />;
    case "overdue":
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
export const calculateSchoolStatus = (assessments: Array<{status: AssessmentStatus; due_date: string | null}>): AssessmentStatus => {
  if (assessments.length === 0) return "not_started";

  const displayStatuses = assessments.map(a => getDisplayStatus(a));
  const uniqueStatuses = [...new Set(displayStatuses)];
  
  // If any assessment is overdue, the school is overdue
  if (displayStatuses.includes("overdue")) return "not_started"; // Map overdue to a base status
  
  // If any assessment is explicitly in progress, the school is in progress
  if (displayStatuses.includes("in_progress")) return "in_progress";
  
  // If all assessments are completed, the school is completed
  if (displayStatuses.every(status => status === "completed" || status === "approved")) return "completed";
  
  // If all assessments are not started, the school is not started
  if (displayStatuses.every(status => status === "not_started")) return "not_started";
  
  // If there's a mix of statuses (some completed, some not started), show in progress
  if (uniqueStatuses.length > 1) return "in_progress";
  
  // Default fallback
  return "not_started";
};

// #endregion

// #region Data Calculation and Formatting Helpers

export const calculateCategoryAverages = (standards: Standard[]) => {
  if (!standards || standards.length === 0) {
    return {};
  }

  const standardsByCode: Record<string, Standard[]> = {};
  
  standards.forEach(standard => {
    const prefix = standard.standard_code.substring(0, 2);
    if (!standardsByCode[prefix]) {
      standardsByCode[prefix] = [];
    }
    standardsByCode[prefix].push(standard);
  });

  const averages: Record<string, { average: number, count: number, title: string }> = {};
  
  Object.entries(standardsByCode).forEach(([prefix, stds]) => {
    const validStandards = stds.filter(s => s.current_version !== null);
    if (validStandards.length > 0) {
      const sum = validStandards.reduce((acc, s) => acc + (s.current_version || 0), 0);
      averages[prefix] = {
        average: sum / validStandards.length,
        count: validStandards.length,
        title: stds[0].standard_name.split(' ')[0] + ' ' + stds[0].standard_name.split(' ')[1]
      };
    }
  });

  return averages;
};

export const calculateOverallAverage = (standards: Standard[]) => {
  if (!standards || standards.length === 0) {
    return 0;
  }

  const validStandards = standards.filter(s => s.current_version !== null);
  if (validStandards.length === 0) return 0;
  
  const sum = validStandards.reduce((acc, s) => acc + (s.current_version || 0), 0);
  return sum / validStandards.length;
};

export const hasCriticalStandards = (standards: Standard[]) => {
  if (!standards) return false;
  return standards.some(standard => standard.current_version === 1);
};

export const countCriticalStandards = (standards: Standard[]) => {
  if (!standards) return 0;
  return standards.filter(standard => standard.current_version === 1).length;
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
    case "Finance & Procurement":
      return <FileText className="h-4 w-4" />;
    case "Governance":
      return <ClipboardCheck className="h-4 w-4" />;
    case "Estates":
      return <ClipboardCheck className="h-4 w-4" />;
    case "Information Standards":
    case "IT":
    case "IT & Information Services":
      return <ClipboardCheck className="h-4 w-4" />;
    default:
      return <ClipboardCheck className="h-4 w-4" />;
  }
};

/**
 * Maps aspect category codes to their full display names
 * Updated to match v4 API exactly
 */
export const getAspectDisplayName = (category: string): string => {
  const aspectMap: Record<string, string> = {
    // v4 API aspect codes (uppercase)
    "EDU": "Education",
    "EST": "Estates", 
    "FIN": "Finance",
    "GOV": "Governance",
    "HR": "Human Resources",
    "IS": "Information Standards",
    "IT": "IT",
    
    // Display name variations (case-insensitive support)
    "Education": "Education",
    "Estates": "Estates",
    "Finance": "Finance", 
    "Governance": "Governance",
    "Human Resources": "Human Resources",
    "Information Standards": "Information Standards",
    
    // Legacy support for existing data
    "Finance & Procurement": "Finance",
    "IT & Information Services": "IT",
    "IT (Digital Aspects)": "Information Standards",
  };
  
  return aspectMap[category] || category;
};

/**
 * Gets the short display code for an aspect category
 */
export const getAspectShortCode = (category: string): string => {
  const codeMap: Record<string, string> = {
    // Backend API aspect codes to short codes
    "EDU": "ED",
    "EST": "ES", 
    "FIN": "FN",
    "GOV": "GV",
    "HR": "HR",
    "IS": "IS",
    "IT": "IT",
    
    // Display name to short codes
    "Education": "ED",
    "Estates": "ES",
    "Finance": "FN",
    "Governance": "GV",
    "Human Resources": "HR",
    "Information Standards": "IS",
    
    // Legacy support
    "Finance & Procurement": "FN",
    "IT & Information Services": "IT",
    "IT (Digital Aspects)": "IS",
  };
  
  return codeMap[category] || category;
};

// #endregion
