// Assessment categories
export type AssessmentCategory = 
  | "Education"
  | "Human Resources"
  | "Finance & Procurement"
  | "Estates"
  | "Governance"
  | "IT & Information Services"
  | "IT Strategy & Support";

// Academic terms
export type AcademicTerm = 
  | "Autumn"
  | "Spring"
  | "Summer";

// Academic years
export type AcademicYear = string; // Format: "2023-2024"

// Rating scale 1-4
export type Rating = 1 | 2 | 3 | 4 | null;

// Rating labels for display
export const RatingLabels: Record<NonNullable<Rating>, string> = {
  1: "Inadequate",
  2: "Requires Improvement",
  3: "Good",
  4: "Outstanding"
};

// Rating descriptions for each level
export const RatingDescriptions: Record<NonNullable<Rating>, string> = {
  1: "Significant weaknesses requiring immediate intervention and urgent improvement",
  2: "Basic standards met with notable areas for development and improvement",
  3: "Consistent, effective practice with some areas of strength",
  4: "Exemplary, sector-leading practice with evidence of sustained impact"
};

// Assessment status
export type AssessmentStatus = 
  | "Not Started" 
  | "In Progress" 
  | "Completed"
  | "Overdue";

// File attachment interface
export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  url?: string; // For actual file URL in production
}

// Standard item within an assessment
export interface Standard {
  id: string;
  code: string;
  title: string;
  description: string;
  rating: Rating;
  evidence?: string;
  lastUpdated?: string;
  attachments?: FileAttachment[];
}

// Group of standards for a category
export interface StandardGroup {
  id: string;
  category: AssessmentCategory;
  standards: Standard[];
}

// School performance summary for the new school-centric view
export interface SchoolPerformance {
  school: School;
  overallScore: number;
  assessmentsByCategory: Array<{
    category: AssessmentCategory;
    assessment: Assessment;
    averageScore: number;
    criticalStandardsCount: number;
  }>;
  criticalStandardsTotal: number;
  lastUpdated: string;
}

// Assessment model
export interface Assessment {
  id: string;
  name: string;
  category: AssessmentCategory;
  school: School;
  completedStandards: number;
  totalStandards: number;
  lastUpdated: string;
  status: AssessmentStatus;
  dueDate?: string;
  assignedTo?: User[];
  standards?: Standard[];
  term?: AcademicTerm;
  academicYear?: AcademicYear;
}

// School model
export interface School {
  id: string;
  name: string;
  code?: string;
}

// User model
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
} 