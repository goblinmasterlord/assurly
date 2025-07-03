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

// Mapping from short codes/abbreviations to full category names
export const categoryAbbreviationMap: Record<string, AssessmentCategory> = {
  "Ed": "Education",
  "Hr": "Human Resources", 
  "Fm": "Finance & Procurement",
  "Bo": "Estates", // Building Operations
  "Eg": "Governance", // Executive Governance
  "Is": "IT & Information Services", // Information Services
  "It": "IT (Digital Strategy)",
};

// Reverse mapping from full names to abbreviations
export const categoryToAbbreviation: Record<AssessmentCategory, string> = {
  "Education": "Ed",
  "Human Resources": "Hr",
  "Finance & Procurement": "Fm", 
  "Estates": "Bo",
  "Governance": "Eg",
  "IT & Information Services": "Is",
  "IT (Digital Strategy)": "It",
};

// Full category display names (for cases where we want more descriptive names)
export const categoryDisplayNames: Record<AssessmentCategory, string> = {
  "Education": "Education",
  "Human Resources": "Human Resources",
  "Finance & Procurement": "Finance & Procurement",
  "Estates": "Estates",
  "Governance": "Governance", 
  "IT & Information Services": "IT & Information Services",
  "IT (Digital Strategy)": "IT (Digital Strategy)",
};

// Category icons mapping
export const getCategoryIconComponent = (category: AssessmentCategory) => {
  switch (category) {
    case "Education":
      return <BookOpen className="h-4 w-4" />;
    case "Human Resources":
      return <Users className="h-4 w-4" />;
    case "Finance & Procurement":
      return <DollarSign className="h-4 w-4" />;
    case "Estates":
      return <Building className="h-4 w-4" />;
    case "Governance":
      return <Shield className="h-4 w-4" />;
    case "IT & Information Services":
      return <Monitor className="h-4 w-4" />;
    case "IT (Digital Strategy)":
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

// Enhanced function that can handle both full names and abbreviations
export const normalizeCategoryName = (input: string): AssessmentCategory | null => {
  // First check if it's already a full category name
  if (Object.keys(categoryDisplayNames).includes(input as AssessmentCategory)) {
    return input as AssessmentCategory;
  }
  
  // Then check if it's an abbreviation
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