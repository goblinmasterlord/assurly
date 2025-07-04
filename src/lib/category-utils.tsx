import React from "react";
import type { AssessmentCategory } from "@/types/assessment";
import { 
  BookOpen, 
  ClipboardCheck, 
  DollarSign, 
  Building, 
  Shield, 
  Monitor, 
  Settings,
  Users 
} from "lucide-react";

// Mapping from backend category values to display names
export const categoryDisplayNames: Record<AssessmentCategory, string> = {
  "education": "Education",
  "hr": "Human Resources",
  "finance": "Finance & Procurement",
  "estates": "Estates",
  "governance": "Governance",
  "is": "IT & Information Services",
  "it": "IT (Digital Aspects)",
};

// Mapping from short codes/abbreviations to backend category values
export const categoryAbbreviationMap: Record<string, AssessmentCategory> = {
  "Ed": "education",
  "Hr": "hr", 
  "Fm": "finance",
  "Bo": "estates", // Building Operations
  "Eg": "governance", // Executive Governance
  "Is": "is", // Information Services
  "It": "it",
};

// Reverse mapping from backend categories to abbreviations
export const categoryToAbbreviation: Record<AssessmentCategory, string> = {
  "education": "Ed",
  "hr": "Hr",
  "finance": "Fm", 
  "estates": "Bo",
  "governance": "Eg",
  "is": "Is",
  "it": "It",
};

// Category icons mapping using backend category values
export const getCategoryIconComponent = (category: AssessmentCategory) => {
  switch (category) {
    case "education":
      return <BookOpen className="h-4 w-4" />;
    case "hr":
      return <Users className="h-4 w-4" />;
    case "finance":
      return <DollarSign className="h-4 w-4" />;
    case "estates":
      return <Building className="h-4 w-4" />;
    case "governance":
      return <Shield className="h-4 w-4" />;
    case "is":
      return <Monitor className="h-4 w-4" />;
    case "it":
      return <Settings className="h-4 w-4" />;
    default:
      return null;
  }
};

// Utility functions
export const getCategoryFromAbbreviation = (abbreviation: string): AssessmentCategory | null => {
  return categoryAbbreviationMap[abbreviation] || null;
};

export const getAbbreviationFromCategory = (category: AssessmentCategory): string => {
  return categoryToAbbreviation[category] || category;
};

export const getCategoryDisplayName = (category: AssessmentCategory): string => {
  return categoryDisplayNames[category] || category;
};

export const getCategoryIcon = (category: AssessmentCategory) => {
  return getCategoryIconComponent(category);
};

// Enhanced function that can handle both display names and abbreviations
export const normalizeCategoryName = (input: string): AssessmentCategory | null => {
  // First check if it's already a backend category value
  if (Object.keys(categoryDisplayNames).includes(input as AssessmentCategory)) {
    return input as AssessmentCategory;
  }
  
  // Then check if it's a display name - reverse lookup
  const backendCategory = Object.entries(categoryDisplayNames).find(
    ([key, displayName]) => displayName === input
  )?.[0] as AssessmentCategory;
  
  if (backendCategory) {
    return backendCategory;
  }
  
  // Finally check if it's an abbreviation
  return getCategoryFromAbbreviation(input);
};

// Utility to get category info with both display name and icon
export const getCategoryInfo = (category: AssessmentCategory) => {
  return {
    name: getCategoryDisplayName(category),
    abbreviation: getAbbreviationFromCategory(category),
    icon: getCategoryIcon(category),
    fullCategory: category,
  };
}; 