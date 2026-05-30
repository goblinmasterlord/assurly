// src/utils/assessment.ts

import type { Assessment, AssessmentGroup, AssessmentStatus, AssessmentStandard, AssessmentByAspect } from '../types/assessment';
import {
  calculatePolarityAwareAverage,
  getRatingLabel as getPolarityRatingLabel,
} from './rating-labels';

/**
 * Check if an assessment is overdue
 */
export function isOverdue(item: { status: AssessmentStatus; due_date: string | null }): boolean {
    if (!item.due_date) return false;
    if (item.status === 'completed' || item.status === 'approved') return false;
    return new Date() > new Date(item.due_date);
}

/**
 * Get display status including overdue check
 */
export function getDisplayStatus(item: { status: AssessmentStatus; due_date: string | null }): string {
    if (isOverdue(item)) return 'overdue';
    return item.status;
}

/**
 * Get human-readable status label
 */
export function getStatusLabel(status: AssessmentStatus | 'overdue'): string {
    const labels: Record<string, string> = {
        'not_started': 'Not Started',
        'in_progress': 'In Progress',
        'completed': 'Completed',
        'approved': 'Approved',
        'overdue': 'Overdue'
    };
    return labels[status] || status;
}

/**
 * Get status color for badges/chips
 */
export function getStatusColor(status: AssessmentStatus | 'overdue'): string {
    const colors: Record<string, string> = {
        'not_started': 'gray',
        'in_progress': 'yellow',
        'completed': 'green',
        'approved': 'blue',
        'overdue': 'red'
    };
    return colors[status] || 'gray';
}

/**
 * Generate display name for an assessment
 */
export function getAssessmentDisplayName(
    assessment: Assessment | AssessmentGroup | AssessmentByAspect
): string {
    const aspectName = assessment.aspect_name;
    const termId = 'term_id' in assessment ? assessment.term_id : '';
    const year = assessment.academic_year;
    return `${aspectName} - ${termId} ${year}`;
}

/**
 * Calculate progress percentage
 */
export function calculateProgress(group: AssessmentGroup | AssessmentByAspect): number {
    if (group.total_standards === 0) return 0;
    return Math.round((group.completed_standards / group.total_standards) * 100);
}

/**
 * Calculate average rating from assessment standards
 */
export function calculateAverageRating(standards: AssessmentStandard[]): number | null {
    return calculatePolarityAwareAverage(standards);
}

/** @deprecated Prefer getRatingLabel from @/utils/rating-labels with standardType */
export function getRatingLabel(rating: number | null, standardType?: AssessmentStandard['standard_type']): string {
    return getPolarityRatingLabel(rating, standardType);
}

/**
 * Get rating color
 */
export function getRatingColor(rating: number | null): string {
    if (rating === null) return 'gray';
    const colors: Record<number, string> = {
        1: 'red',
        2: 'orange',
        3: 'green',
        4: 'blue',
    };
    return colors[rating] || 'gray';
}

