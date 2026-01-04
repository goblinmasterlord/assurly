# Frontend Migration Guide: v3 → v4

**Date:** 2025-12-29  
**Reference:** `FRONTEND_API_SPECIFICATION.md`  
**Estimated Effort:** 2-4 hours depending on codebase size

---

## Overview

This guide provides step-by-step instructions to migrate the Assurly frontend from v3 API patterns to v4. The main changes are:

1. **Property names:** camelCase → snake_case
2. **Status values:** Title Case strings → lowercase with underscores
3. **Field renames:** Several fields renamed for clarity
4. **Structural changes:** Some properties moved or removed

---

## Table of Contents

1. [Step 1: Replace Type Definitions](#step-1-replace-type-definitions)
2. [Step 2: Global Find/Replace (Property Names)](#step-2-global-findreplace-property-names)
3. [Step 3: Global Find/Replace (Status Values)](#step-3-global-findreplace-status-values)
4. [Step 4: Fix Standard/Assessment Field Renames](#step-4-fix-standardassessment-field-renames)
5. [Step 5: Handle Removed/Changed Properties](#step-5-handle-removedchanged-properties)
6. [Step 6: Update API Calls](#step-6-update-api-calls)
7. [Step 7: Update Component Display Logic](#step-7-update-component-display-logic)
8. [Step 8: Fix Specific Component Patterns](#step-8-fix-specific-component-patterns)
9. [Step 9: Recommended Migration Order](#step-9-recommended-migration-order)
10. [Step 10: Verification Checklist](#step-10-verification-checklist)
11. [Quick Reference Card](#quick-reference-card)

---

## Step 1: Replace Type Definitions

Copy the following types into your `src/types/assessment.ts` (or equivalent). This becomes your source of truth.

```typescript
// ============================================================================
// src/types/assessment.ts - COMPLETE v4 TYPE DEFINITIONS
// ============================================================================

// Core Types
export type AssessmentStatus = 'not_started' | 'in_progress' | 'completed' | 'approved';
export type Rating = 1 | 2 | 3 | 4 | null;
export type SchoolType = 'primary' | 'secondary' | 'all_through' | 'special' | 'central';
export type TrendDirection = 'improving' | 'declining' | 'stable' | 'no_data';

// ============================================================================
// User & Auth
// ============================================================================

export interface User {
    user_id: string;
    email: string;
    full_name: string;
    mat_id: string;
    mat_name?: string;
    school_id: string | null;
    school_name?: string | null;
    role_title: string | null;
    is_active: boolean;
    last_login: string | null;
}

export interface AuthResponse {
    access_token: string;
    token_type: 'bearer';
    user: User;
}

// ============================================================================
// Assessments
// ============================================================================

export interface AssessmentGroup {
    group_id: string;               // cedar-park-primary-EDU-T1-2024-25
    school_id: string;
    school_name: string;
    mat_aspect_id: string;          // OLT-EDU
    aspect_code: string;            // EDU
    aspect_name: string;
    term_id: string;                // T1
    academic_year: string;          // 2024-25
    status: AssessmentStatus;
    total_standards: number;
    completed_standards: number;
    due_date: string | null;
    last_updated: string;
}

export interface Assessment {
    id: string;
    assessment_id: string;          // cedar-park-primary-ES1-T1-2024-25
    school_id: string;
    school_name: string;
    mat_standard_id: string;        // OLT-ES1
    standard_code: string;          // ES1
    standard_name: string;
    standard_description: string;
    mat_aspect_id: string;          // OLT-EDU
    aspect_code: string;            // EDU
    aspect_name: string;
    version_id: string;             // OLT-ES1-v1
    version_number: number;
    unique_term_id: string;         // T1-2024-25
    academic_year: string;          // 2024-25
    rating: Rating;
    evidence_comments: string | null;
    status: AssessmentStatus;
    due_date: string | null;
    assigned_to: string | null;
    assigned_to_name: string | null;
    submitted_at: string | null;
    submitted_by: string | null;
    submitted_by_name: string | null;
    last_updated: string;
}

export interface AssessmentByAspect {
    school_id: string;
    school_name: string;
    aspect_code: string;
    aspect_name: string;
    mat_aspect_id: string;
    term_id: string;
    academic_year: string;
    total_standards: number;
    completed_standards: number;
    status: AssessmentStatus;
    standards: AssessmentStandard[];
}

export interface AssessmentStandard {
    assessment_id: string;
    mat_standard_id: string;
    standard_code: string;
    standard_name: string;
    standard_description: string;
    sort_order: number;
    rating: Rating;
    evidence_comments: string | null;
    version_id: string;
    version_number: number;
    status: AssessmentStatus;
}

export interface AssessmentUpdate {
    rating: Rating;
    evidence_comments: string;
}

export interface AssessmentCreate {
    school_ids: string[];
    aspect_code: string;
    term_id: string;                // unique_term_id format: T1-2024-25
    due_date?: string;
    assigned_to?: string;
}

export interface BulkUpdate {
    assessment_id: string;
    rating: Rating;
    evidence_comments: string;
}

// ============================================================================
// Standards
// ============================================================================

export interface Standard {
    mat_standard_id: string;        // OLT-ES1
    standard_code: string;          // ES1
    standard_name: string;
    standard_description: string;
    sort_order: number;
    is_custom: boolean;
    is_modified: boolean;
    mat_aspect_id: string;          // OLT-EDU
    aspect_code: string;            // EDU
    aspect_name: string;
    current_version_id: string;     // OLT-ES1-v1
    current_version: number;
}

export interface StandardDetail extends Standard {
    created_at: string;
    updated_at: string;
    current_version: StandardVersion;
    version_history: StandardVersion[];
}

export interface StandardVersion {
    version_id: string;             // OLT-ES1-v1
    version_number: number;
    standard_name: string;
    standard_description: string;
    effective_from: string;
    effective_to: string | null;
    change_reason: string | null;
    created_by_name: string | null;
}

export interface StandardUpdate {
    standard_name: string;
    standard_description: string;
    change_reason?: string;
}

// ============================================================================
// Aspects
// ============================================================================

export interface Aspect {
    mat_aspect_id: string;          // OLT-EDU
    aspect_code: string;            // EDU
    aspect_name: string;
    aspect_description: string;
    sort_order: number;
    is_custom: boolean;
    standards_count: number;
}

// ============================================================================
// Schools
// ============================================================================

export interface School {
    school_id: string;              // cedar-park-primary
    school_name: string;
    school_type: SchoolType;
    is_central_office: boolean;
    is_active: boolean;
}

// ============================================================================
// Terms
// ============================================================================

export interface Term {
    unique_term_id: string;         // T1-2024-25
    term_id: string;                // T1
    term_name: string;              // Autumn Term
    start_date: string;
    end_date: string;
    academic_year: string;          // 2024-25
    is_current: boolean;
}

// ============================================================================
// Analytics
// ============================================================================

export interface TrendData {
    mat_id: string;
    filters: {
        school_id: string | null;
        aspect_code: string | null;
        from_term: string | null;
        to_term: string | null;
    };
    summary: {
        total_terms: number;
        overall_average: number;
        trend_direction: TrendDirection;
        improvement: number;
    };
    trends: TermTrend[];
}

export interface TermTrend {
    unique_term_id: string;
    term_id: string;
    academic_year: string;
    assessments_count: number;
    rated_count: number;
    average_rating: number | null;
    min_rating: number | null;
    max_rating: number | null;
    rating_distribution: RatingDistribution;
}

export interface RatingDistribution {
    inadequate: number;
    requires_improvement: number;
    good: number;
    outstanding: number;
}

// ============================================================================
// API Responses
// ============================================================================

export interface ApiSuccess<T = void> {
    message: string;
    data?: T;
}

export interface ApiError {
    detail: string;
    error_code?: string;
}

export interface CreateAssessmentResponse {
    message: string;
    assessments_created: number;
    schools: string[];
    aspect_code: string;
    term_id: string;
}

export interface UpdateAssessmentResponse {
    message: string;
    assessment_id: string;
    status: AssessmentStatus;
}

export interface BulkUpdateResponse {
    message: string;
    updated_count: number;
    failed_count: number;
}

export interface UpdateStandardResponse {
    message: string;
    mat_standard_id: string;
    new_version_id: string;
    version_number: number;
    previous_version_id: string;
}
```

---

## Step 2: Global Find/Replace (Property Names)

Run these replacements across all `.ts` and `.tsx` files in your `src/` directory.

### Property Access Patterns

| Find | Replace |
|------|---------|
| `.dueDate` | `.due_date` |
| `.academicYear` | `.academic_year` |
| `.lastUpdated` | `.last_updated` |
| `.assignedTo` | `.assigned_to` |
| `.submittedAt` | `.submitted_at` |
| `.submittedBy` | `.submitted_by` |
| `.schoolId` | `.school_id` |
| `.schoolName` | `.school_name` |
| `.aspectCode` | `.aspect_code` |
| `.aspectName` | `.aspect_name` |
| `.standardCode` | `.standard_code` |
| `.standardName` | `.standard_name` |
| `.standardDescription` | `.standard_description` |
| `.evidenceComments` | `.evidence_comments` |
| `.termId` | `.term_id` |
| `.termName` | `.term_name` |
| `.startDate` | `.start_date` |
| `.endDate` | `.end_date` |
| `.userId` | `.user_id` |
| `.fullName` | `.full_name` |
| `.matId` | `.mat_id` |
| `.matName` | `.mat_name` |
| `.roleTitle` | `.role_title` |
| `.isActive` | `.is_active` |
| `.lastLogin` | `.last_login` |
| `.isCurrent` | `.is_current` |
| `.sortOrder` | `.sort_order` |
| `.isCustom` | `.is_custom` |
| `.isModified` | `.is_modified` |
| `.versionId` | `.version_id` |
| `.versionNumber` | `.version_number` |
| `.totalStandards` | `.total_standards` |
| `.completedStandards` | `.completed_standards` |
| `.matAspectId` | `.mat_aspect_id` |
| `.matStandardId` | `.mat_standard_id` |
| `.groupId` | `.group_id` |
| `.assessmentId` | `.assessment_id` |
| `.uniqueTermId` | `.unique_term_id` |
| `.currentVersionId` | `.current_version_id` |
| `.currentVersion` | `.current_version` |
| `.standardsCount` | `.standards_count` |
| `.isCentralOffice` | `.is_central_office` |
| `.schoolType` | `.school_type` |
| `.assignedToName` | `.assigned_to_name` |
| `.submittedByName` | `.submitted_by_name` |

### Destructuring Patterns

Also search for destructuring patterns and update them:

| Find | Replace |
|------|---------|
| `{ dueDate }` | `{ due_date }` |
| `{ dueDate,` | `{ due_date,` |
| `, dueDate }` | `, due_date }` |
| `, dueDate,` | `, due_date,` |

Repeat this pattern for all properties in the table above.

### Object Property Shorthand

If you use shorthand like `{ schoolId }`, change to:

```typescript
// OLD
const params = { schoolId, termId };

// NEW
const params = { school_id: schoolId, term_id: termId };
// OR rename your variables
const params = { school_id, term_id };
```

---

## Step 3: Global Find/Replace (Status Values)

| Find | Replace |
|------|---------|
| `"Completed"` | `"completed"` |
| `'Completed'` | `'completed'` |
| `"In Progress"` | `"in_progress"` |
| `'In Progress'` | `'in_progress'` |
| `"Not Started"` | `"not_started"` |
| `'Not Started'` | `'not_started'` |
| `"Approved"` | `"approved"` |
| `'Approved'` | `'approved'` |

### Handling "Overdue" Status

"Overdue" is no longer a stored status - it's derived from `due_date` and current `status`.

Create a utility file:

```typescript
// src/utils/assessment.ts

import { Assessment, AssessmentGroup, AssessmentStatus } from '../types/assessment';

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
```

Update components to use these utilities:

```typescript
// OLD
<Badge color={status === 'Overdue' ? 'red' : 'green'}>{status}</Badge>

// NEW
import { getDisplayStatus, getStatusLabel, getStatusColor } from '../utils/assessment';

const displayStatus = getDisplayStatus(assessment);
<Badge color={getStatusColor(displayStatus)}>{getStatusLabel(displayStatus)}</Badge>
```

---

## Step 4: Fix Standard/Assessment Field Renames

These are structural renames, not just casing changes:

| Old (v3) | New (v4) | Context |
|----------|----------|---------|
| `standard.id` | `standard.mat_standard_id` | Standard identifier |
| `standard.code` | `standard.standard_code` | Short code like "ES1" |
| `standard.title` | `standard.standard_name` | Display name |
| `standard.description` | `standard.standard_description` | Full description |
| `standard.evidence` | `standard.evidence_comments` | Only on AssessmentStandard |
| `assessment.category` | `assessment.aspect_name` | Display name of aspect |
| `assessment.categoryCode` | `assessment.aspect_code` | Short code like "EDU" |
| `assessment.categoryId` | `assessment.mat_aspect_id` | Aspect identifier |

### Find/Replace for Structural Changes

| Find | Replace |
|------|---------|
| `standard.id` | `standard.mat_standard_id` |
| `standard.code` | `standard.standard_code` |
| `standard.title` | `standard.standard_name` |
| `standard.description` | `standard.standard_description` |
| `standard.evidence` | `standard.evidence_comments` |
| `.category` | `.aspect_name` |
| `.categoryCode` | `.aspect_code` |
| `.categoryId` | `.mat_aspect_id` |

**Be careful with `.category`** - review each match to ensure it's an assessment property, not a different variable.

---

## Step 5: Handle Removed/Changed Properties

### Properties That No Longer Exist

| Old Property | Solution |
|--------------|----------|
| `assessment.name` | Derive from other fields |
| `assessment.overallScore` | Calculate from ratings or use analytics endpoint |
| `assessment.standards` | Only on `AssessmentByAspect` response |
| `standard.rating` | Only on `AssessmentStandard`, not base `Standard` |
| `standard.evidence` | Only on `AssessmentStandard` as `evidence_comments` |

### Add Helper Functions

Add these to your `src/utils/assessment.ts`:

```typescript
import { 
    Assessment, 
    AssessmentGroup, 
    AssessmentStandard,
    AssessmentByAspect 
} from '../types/assessment';

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
```

### Update Component Usage

```typescript
// OLD
<h1>{assessment.name}</h1>
<p>Score: {assessment.overallScore}</p>

// NEW
import { getAssessmentDisplayName, calculateAverageRating } from '../utils/assessment';

<h1>{getAssessmentDisplayName(assessment)}</h1>
<p>Score: {calculateAverageRating(standards) ?? 'N/A'}</p>
```

---

## Step 6: Update API Calls

### Query Parameters

```typescript
// OLD: camelCase params
const response = await api.get('/assessments', {
    params: { schoolId, termId, academicYear, status }
});

// NEW: snake_case params
const response = await api.get('/assessments', {
    params: { 
        school_id: schoolId, 
        term_id: termId, 
        academic_year: academicYear,
        status 
    }
});
```

### Request Bodies

```typescript
// OLD: Create assessment
await api.post('/assessments', {
    schoolIds: ['cedar-park-primary'],
    aspectCode: 'EDU',
    termId: 'T1-2024-25',
    dueDate: '2024-12-20',
    assignedTo: 'user7'
});

// NEW: snake_case body
await api.post('/assessments', {
    school_ids: ['cedar-park-primary'],
    aspect_code: 'EDU',
    term_id: 'T1-2024-25',
    due_date: '2024-12-20',
    assigned_to: 'user7'
});
```

```typescript
// OLD: Update assessment
await api.put(`/assessments/${id}/standards/${standardId}`, {
    rating: 4,
    evidenceComments: 'Excellent work'
});

// NEW: Update by assessment_id directly
await api.put(`/assessments/${assessmentId}`, {
    rating: 4,
    evidence_comments: 'Excellent work'
});
```

```typescript
// OLD: Bulk update
await api.post('/assessments/bulk-update', {
    updates: items.map(item => ({
        standardId: item.id,
        rating: item.rating,
        evidenceComments: item.evidence
    }))
});

// NEW: Use assessment_id
await api.post('/assessments/bulk-update', {
    updates: items.map(item => ({
        assessment_id: item.assessment_id,
        rating: item.rating,
        evidence_comments: item.evidence_comments
    }))
});
```

### New Endpoint: Get Assessments by Aspect

```typescript
// NEW: Load all standards for an aspect (assessment form)
const data = await api.get<AssessmentByAspect>(
    `/assessments/by-aspect/${aspectCode}`,
    {
        params: {
            school_id: schoolId,
            term_id: termId  // unique_term_id format: T1-2024-25
        }
    }
);
```

---

## Step 7: Update Component Display Logic

### Status Badge Component

```typescript
// OLD
interface StatusBadgeProps {
    status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
    const colorMap: Record<string, string> = {
        'Completed': 'bg-green-100 text-green-800',
        'In Progress': 'bg-yellow-100 text-yellow-800',
        'Not Started': 'bg-gray-100 text-gray-800',
        'Overdue': 'bg-red-100 text-red-800',
    };
    
    return (
        <span className={`px-2 py-1 rounded ${colorMap[status]}`}>
            {status}
        </span>
    );
};

// NEW
import { AssessmentStatus } from '../types/assessment';
import { getStatusLabel, getStatusColor, getDisplayStatus } from '../utils/assessment';

interface StatusBadgeProps {
    status: AssessmentStatus;
    dueDate?: string | null;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, dueDate }) => {
    const displayStatus = dueDate 
        ? getDisplayStatus({ status, due_date: dueDate })
        : status;
    
    const colorMap: Record<string, string> = {
        'completed': 'bg-green-100 text-green-800',
        'in_progress': 'bg-yellow-100 text-yellow-800',
        'not_started': 'bg-gray-100 text-gray-800',
        'approved': 'bg-blue-100 text-blue-800',
        'overdue': 'bg-red-100 text-red-800',
    };
    
    return (
        <span className={`px-2 py-1 rounded ${colorMap[displayStatus]}`}>
            {getStatusLabel(displayStatus)}
        </span>
    );
};
```

### Rating Badge Component

```typescript
// NEW
import { Rating } from '../types/assessment';
import { getRatingLabel, getRatingColor } from '../utils/assessment';

interface RatingBadgeProps {
    rating: Rating;
}

const RatingBadge: React.FC<RatingBadgeProps> = ({ rating }) => {
    const colorMap: Record<string, string> = {
        'red': 'bg-red-100 text-red-800',
        'orange': 'bg-orange-100 text-orange-800',
        'green': 'bg-green-100 text-green-800',
        'blue': 'bg-blue-100 text-blue-800',
        'gray': 'bg-gray-100 text-gray-800',
    };
    
    const color = getRatingColor(rating);
    
    return (
        <span className={`px-2 py-1 rounded ${colorMap[color]}`}>
            {getRatingLabel(rating)}
        </span>
    );
};
```

### Progress Bar Component

```typescript
// NEW
import { AssessmentGroup } from '../types/assessment';
import { calculateProgress } from '../utils/assessment';

interface ProgressBarProps {
    group: AssessmentGroup;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ group }) => {
    const progress = calculateProgress(group);
    
    return (
        <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${progress}%` }}
            />
            <span className="text-sm text-gray-600">
                {group.completed_standards}/{group.total_standards} ({progress}%)
            </span>
        </div>
    );
};
```

---

## Step 8: Fix Specific Component Patterns

### Assessment List/Table

```tsx
// OLD
{assessments.map(a => (
    <TableRow key={a.id}>
        <TableCell>{a.schoolName}</TableCell>
        <TableCell>{a.category}</TableCell>
        <TableCell>{a.termId} {a.academicYear}</TableCell>
        <TableCell>
            <StatusBadge status={a.status} />
        </TableCell>
        <TableCell>{a.completedStandards}/{a.totalStandards}</TableCell>
    </TableRow>
))}

// NEW
{assessments.map(a => (
    <TableRow key={a.group_id}>
        <TableCell>{a.school_name}</TableCell>
        <TableCell>{a.aspect_name}</TableCell>
        <TableCell>{a.term_id} {a.academic_year}</TableCell>
        <TableCell>
            <StatusBadge status={a.status} dueDate={a.due_date} />
        </TableCell>
        <TableCell>{a.completed_standards}/{a.total_standards}</TableCell>
    </TableRow>
))}
```

### Assessment Detail Page

```tsx
// OLD
const AssessmentDetail: React.FC<{ assessmentId: string }> = ({ assessmentId }) => {
    const [assessment, setAssessment] = useState<Assessment | null>(null);
    
    useEffect(() => {
        api.get(`/assessments/${assessmentId}`).then(setAssessment);
    }, [assessmentId]);
    
    if (!assessment) return <Loading />;
    
    return (
        <div>
            <h1>{assessment.name}</h1>
            <p>School: {assessment.schoolName}</p>
            <p>Category: {assessment.category}</p>
            <p>Due: {assessment.dueDate}</p>
        </div>
    );
};

// NEW
import { getAssessmentDisplayName } from '../utils/assessment';

const AssessmentDetail: React.FC<{ assessmentId: string }> = ({ assessmentId }) => {
    const [assessment, setAssessment] = useState<Assessment | null>(null);
    
    useEffect(() => {
        api.get<Assessment>(`/assessments/${assessmentId}`).then(setAssessment);
    }, [assessmentId]);
    
    if (!assessment) return <Loading />;
    
    return (
        <div>
            <h1>{getAssessmentDisplayName(assessment)}</h1>
            <p>School: {assessment.school_name}</p>
            <p>Aspect: {assessment.aspect_name}</p>
            <p>Due: {assessment.due_date}</p>
        </div>
    );
};
```

### Assessment Form (Rate All Standards)

```tsx
// OLD
const AssessmentForm: React.FC = () => {
    const [standards, setStandards] = useState<Standard[]>([]);
    
    const handleSave = async (standardId: string, rating: number, evidence: string) => {
        await api.put(`/assessments/${assessmentId}/standards/${standardId}`, {
            rating,
            evidenceComments: evidence
        });
    };
    
    return (
        <div>
            {standards.map(s => (
                <StandardRow 
                    key={s.id}
                    title={s.title}
                    rating={s.rating}
                    evidence={s.evidence}
                    onSave={(r, e) => handleSave(s.id, r, e)}
                />
            ))}
        </div>
    );
};

// NEW
const AssessmentForm: React.FC<{ 
    schoolId: string; 
    aspectCode: string; 
    termId: string;
}> = ({ schoolId, aspectCode, termId }) => {
    const [data, setData] = useState<AssessmentByAspect | null>(null);
    
    useEffect(() => {
        api.get<AssessmentByAspect>(
            `/assessments/by-aspect/${aspectCode}`,
            { params: { school_id: schoolId, term_id: termId } }
        ).then(setData);
    }, [schoolId, aspectCode, termId]);
    
    const handleSave = async (assessmentId: string, rating: number, evidence: string) => {
        await api.put(`/assessments/${assessmentId}`, {
            rating,
            evidence_comments: evidence
        });
        // Refresh data
        // ...
    };
    
    if (!data) return <Loading />;
    
    return (
        <div>
            <h1>{data.aspect_name} - {data.school_name}</h1>
            <p>{data.term_id} {data.academic_year}</p>
            <ProgressBar group={data} />
            
            {data.standards.map(s => (
                <StandardRow 
                    key={s.mat_standard_id}
                    code={s.standard_code}
                    title={s.standard_name}
                    description={s.standard_description}
                    rating={s.rating}
                    evidence={s.evidence_comments}
                    onSave={(r, e) => handleSave(s.assessment_id, r, e)}
                />
            ))}
        </div>
    );
};
```

### Bulk Save

```tsx
// OLD
const handleBulkSave = async () => {
    const updates = standards
        .filter(s => s.rating !== null)
        .map(s => ({
            standardId: s.id,
            rating: s.rating,
            evidenceComments: s.evidence
        }));
    
    await api.post('/assessments/bulk-update', { updates });
};

// NEW
const handleBulkSave = async () => {
    const updates = data.standards
        .filter(s => s.rating !== null)
        .map(s => ({
            assessment_id: s.assessment_id,
            rating: s.rating,
            evidence_comments: s.evidence_comments || ''
        }));
    
    const result = await api.post<BulkUpdateResponse>(
        '/assessments/bulk-update', 
        { updates }
    );
    
    toast.success(`Saved ${result.updated_count} assessments`);
};
```

---

## Step 9: Recommended Migration Order

To minimize cascading errors, update files in this order:

### Phase 1: Foundation (Do First)
1. `src/types/assessment.ts` - Replace all type definitions
2. `src/types/index.ts` - Update exports if needed
3. `src/utils/assessment.ts` - Create helper functions

### Phase 2: API Layer
4. `src/api/client.ts` or `src/services/api.ts` - Base API client
5. `src/api/assessments.ts` - Assessment API calls
6. `src/api/standards.ts` - Standards API calls
7. `src/api/schools.ts` - Schools API calls

### Phase 3: State Management
8. `src/context/` or `src/store/` - Any state management files
9. `src/hooks/` - Custom hooks

### Phase 4: Shared Components
10. `src/components/StatusBadge.tsx`
11. `src/components/RatingBadge.tsx`
12. `src/components/ProgressBar.tsx`
13. Other shared components

### Phase 5: Pages/Views
14. `src/pages/Dashboard.tsx`
15. `src/pages/AssessmentList.tsx`
16. `src/pages/AssessmentDetail.tsx`
17. `src/pages/AssessmentForm.tsx`
18. Other page components

### Phase 6: Cleanup
19. Run `npm run build` and fix any remaining errors
20. Run `npm run lint` and fix warnings
21. Test all flows manually

---

## Step 10: Verification Checklist

After migration, verify each item:

### Build & Types
- [ ] `npm run build` completes with 0 errors
- [ ] `npm run typecheck` passes (if separate command)
- [ ] No TypeScript errors in IDE

### Authentication
- [ ] Login flow works
- [ ] User data displays correctly
- [ ] Token refresh works (if applicable)

### Assessment List
- [ ] List loads without errors
- [ ] All columns display correctly
- [ ] Status badges show correct colors
- [ ] Progress shows correctly
- [ ] Filters work (school, aspect, term, status)

### Assessment Detail
- [ ] Detail page loads
- [ ] All fields display correctly
- [ ] Aspect/school/term info correct

### Assessment Form
- [ ] Form loads all standards
- [ ] Existing ratings/evidence display
- [ ] Save individual rating works
- [ ] Bulk save works
- [ ] Progress updates after save

### Standards Management
- [ ] Standards list loads
- [ ] Standard detail loads
- [ ] Edit standard works (if implemented)

### Analytics
- [ ] Trends chart loads
- [ ] Filters work
- [ ] Data displays correctly

### Edge Cases
- [ ] Empty states display correctly
- [ ] Error states handled
- [ ] Loading states show
- [ ] Overdue detection works

---

## Quick Reference Card

Print this out or keep it visible during migration:

```
================================================================================
                        v3 → v4 QUICK REFERENCE
================================================================================

PROPERTY MAPPINGS (camelCase → snake_case)
------------------------------------------
dueDate           → due_date
academicYear      → academic_year
lastUpdated       → last_updated
assignedTo        → assigned_to
schoolId          → school_id
schoolName        → school_name
aspectCode        → aspect_code
aspectName        → aspect_name
standardCode      → standard_code
standardName      → standard_name
evidenceComments  → evidence_comments
totalStandards    → total_standards
completedStandards → completed_standards

STATUS VALUES
-------------
"Completed"       → "completed"
"In Progress"     → "in_progress"
"Not Started"     → "not_started"
"Overdue"         → derive from due_date + status

STRUCTURAL RENAMES
------------------
standard.id       → standard.mat_standard_id
standard.code     → standard.standard_code
standard.title    → standard.standard_name
assessment.category → assessment.aspect_name
assessment.name   → derive: `${aspect_name} - ${term_id} ${academic_year}`

KEY TYPES
---------
AssessmentGroup    - List view (grouped by aspect)
Assessment         - Single assessment detail
AssessmentByAspect - Form view (all standards in aspect)
AssessmentStandard - Standard within form (has rating)
Standard           - Reference data only (no rating)

API ENDPOINTS
-------------
GET  /assessments                         - List grouped
GET  /assessments/{assessment_id}         - Single detail
GET  /assessments/by-aspect/{aspect_code} - Form view
PUT  /assessments/{assessment_id}         - Update rating
POST /assessments                         - Create new
POST /assessments/bulk-update             - Bulk save

ID FORMATS
----------
Assessment: cedar-park-primary-ES1-T1-2024-25
Group:      cedar-park-primary-EDU-T1-2024-25
Standard:   OLT-ES1
Aspect:     OLT-EDU
Version:    OLT-ES1-v1
Term:       T1-2024-25

================================================================================
```

---

## Troubleshooting Common Errors

### "Property 'dueDate' does not exist"
You missed a find/replace. Search for `dueDate` and replace with `due_date`.

### "Type 'string' is not assignable to type 'AssessmentStatus'"
You're using old status strings. Replace `"Completed"` with `"completed"` etc.

### "Property 'standards' does not exist on type 'Assessment'"
`standards` only exists on `AssessmentByAspect`. Use the `/assessments/by-aspect/{code}` endpoint.

### "Property 'rating' does not exist on type 'Standard'"
`rating` only exists on `AssessmentStandard`. Make sure you're using the right type.

### "Cannot find name 'getAssessmentDisplayName'"
You need to create the utility file `src/utils/assessment.ts` and import the function.

---

## Summary

The migration involves:

1. **185 errors → 0 errors** by following this guide
2. **~30 minutes** for find/replace operations
3. **~1-2 hours** for component updates
4. **~30 minutes** for testing and verification

The key insight is that the API now returns snake_case consistently, and your TypeScript types should match exactly what the API returns. No transformation layer needed.

---

**Document Version:** 1.0.0  
**Created:** 2025-12-29  
**Reference:** FRONTEND_API_SPECIFICATION.md
