// src/utils/assessment.ts

import { Assessment, AssessmentGroup, AssessmentStatus, AssessmentStandard, AssessmentByAspect, Rating } from '../types/assessment';

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
    const rated = standards.filter(s => s.rating !== null);
    if (rated.length === 0) return null;
    const sum = rated.reduce((acc, s) => acc + (s.rating || 0), 0);
    return Math.round((sum / rated.length) * 10) / 10;
}

/**
 * Get rating label
 */
export function getRatingLabel(rating: number | null): string {
    if (rating === null) return 'Not Rated';
    const labels: Record<number, string> = {
        1: 'Inadequate',
        2: 'Requires Improvement',
        3: 'Good',
        4: 'Outstanding'
    };
    return labels[rating] || 'Unknown';
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
        4: 'blue'
    };
    return colors[rating] || 'gray';
}

