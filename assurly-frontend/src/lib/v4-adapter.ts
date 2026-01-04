/**
 * v4 API Adapter - Converts between v4 snake_case API and v3 camelCase frontend
 * This bridges the gap until the full frontend migration to v4 is complete
 */

import type { Assessment as V4Assessment, AssessmentByAspect, AssessmentStandard, School as V4School } from '../types/assessment';

// Legacy v3 types used by the frontend
export interface LegacyAssessment {
  id: string;
  name: string;
  category: string;
  school: {
    id: string;
    name: string;
  };
  term: string;
  academicYear: string;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Overdue';
  dueDate: string | null;
  assignedTo: Array<{ id: string; name: string }> | null;
  lastUpdated: string;
  completedStandards: number;
  totalStandards: number;
  standards?: LegacyStandard[];
}

export interface LegacyStandard {
  id: string;
  code: string;
  title: string;
  description: string;
  rating: 1 | 2 | 3 | 4 | null;
  evidence: string | null;
  sort_order: number;
}

// Convert v4 status to v3 status
function convertStatus(v4Status: string): 'Not Started' | 'In Progress' | 'Completed' | 'Overdue' {
  switch (v4Status) {
    case 'not_started': return 'Not Started';
    case 'in_progress': return 'In Progress';
    case 'completed':
    case 'approved': return 'Completed';
    default: return 'Not Started';
  }
}

// Convert v3 status to v4 status
function convertStatusToV4(v3Status: string): string {
  switch (v3Status) {
    case 'Not Started': return 'not_started';
    case 'In Progress': return 'in_progress';
    case 'Completed': return 'completed';
    case 'Overdue': return 'not_started';
    default: return 'not_started';
  }
}

/**
 * Convert v4 Assessment to legacy frontend Assessment
 */
export function adaptAssessmentToLegacy(v4: V4Assessment): LegacyAssessment {
  return {
    id: v4.id,
    name: v4.standard_name,
    category: v4.aspect_code.toLowerCase(),
    school: {
      id: v4.school_id,
      name: v4.school_name
    },
    term: v4.unique_term_id.split('-')[0], // T1 from T1-2024-25
    academicYear: v4.academic_year,
    status: convertStatus(v4.status),
    dueDate: v4.due_date,
    assignedTo: v4.assigned_to_name ? [{
      id: v4.assigned_to || '',
      name: v4.assigned_to_name
    }] : null,
    lastUpdated: v4.last_updated,
    completedStandards: v4.completedStandards || 0,
    totalStandards: v4.totalStandards || 1
  };
}

/**
 * Convert v4 AssessmentByAspect to legacy frontend Assessment with standards
 */
export function adaptAssessmentByAspectToLegacy(v4: AssessmentByAspect): LegacyAssessment {
  return {
    id: v4.mat_aspect_id,
    name: v4.aspect_name,
    category: v4.aspect_code.toLowerCase(),
    school: {
      id: v4.school_id,
      name: v4.school_name
    },
    term: v4.term_id.split('-')[0], // T1 from T1-2024-25
    academicYear: v4.academic_year,
    status: convertStatus(v4.status),
    dueDate: null,
    assignedTo: null,
    lastUpdated: new Date().toISOString(),
    completedStandards: v4.completed_standards,
    totalStandards: v4.total_standards,
    standards: v4.standards.map(adaptStandardToLegacy)
  };
}

/**
 * Convert v4 AssessmentStandard to legacy Standard
 */
export function adaptStandardToLegacy(v4: AssessmentStandard): LegacyStandard {
  return {
    id: v4.mat_standard_id,
    code: v4.standard_code,
    title: v4.standard_name,
    description: v4.standard_description,
    rating: v4.rating,
    evidence: v4.evidence_comments,
    sort_order: v4.sort_order
  };
}

/**
 * Convert legacy School to v4 School
 */
export function adaptSchoolToV4(legacy: { id: string; name?: string }): V4School {
  return {
    school_id: legacy.id,
    school_name: legacy.name || '',
    id: legacy.id,
    name: legacy.name
  };
}

/**
 * Convert assessment update from frontend to v4 API format
 */
export function adaptAssessmentUpdateToV4(legacyUpdate: {
  rating: number | null;
  evidence: string;
}): {
  rating: 1 | 2 | 3 | 4 | null;
  evidence_comments: string;
} {
  return {
    rating: legacyUpdate.rating as 1 | 2 | 3 | 4 | null,
    evidence_comments: legacyUpdate.evidence
  };
}

/**
 * Batch convert v4 Assessments to legacy format
 */
export function adaptAssessmentsToLegacy(v4Assessments: V4Assessment[]): LegacyAssessment[] {
  return v4Assessments.map(adaptAssessmentToLegacy);
}

