// Assessment categories
export type AssessmentCategory = 
  | "Education"
  | "Human Resources"
  | "Finance & Procurement"
  | "Estates"
  | "Governance"
  | "IT & Information Services"
  | "IT Strategy & Support";

// Rating scale 1-4
export type Rating = 1 | 2 | 3 | 4 | null;

// Rating labels for display
export const RatingLabels: Record<NonNullable<Rating>, string> = {
  1: "Basic",
  2: "Developing",
  3: "Established",
  4: "Leading"
};

// Assessment status
export type AssessmentStatus = 
  | "Not Started" 
  | "In Progress" 
  | "Completed"
  | "Overdue";

// Standard item within an assessment
export interface Standard {
  id: string;
  code: string;
  title: string;
  description: string;
  rating: Rating;
  evidence?: string;
  lastUpdated?: string;
}

// Group of standards for a category
export interface StandardGroup {
  id: string;
  category: AssessmentCategory;
  standards: Standard[];
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