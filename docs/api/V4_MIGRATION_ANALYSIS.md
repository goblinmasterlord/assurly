# v4 Backend Migration - Frontend Impact Analysis

**Date:** Dec 30, 2025  
**Status:** 🔄 In Progress

---

## Executive Summary

The v4 backend represents a **complete architectural redesign** with:
- ✅ Human-readable IDs throughout (no more UUIDs)
- ✅ Cleaner API structure with explicit grouping
- ✅ Simplified term handling (unified term IDs)
- ✅ Better separation of concerns (groups vs individual assessments)
- ✅ MAT-scoped resources with consistent naming

**Impact:** Frontend requires substantial updates across types, services, and components.

---

## Breaking Changes

### 1. ID Format Changes

| Entity | v3 (Previous) | v4 (New) |
|--------|---------------|----------|
| MAT | `OLT` | `OLT` ✅ (same) |
| School | UUID | `cedar-park-primary` (slug) |
| User | UUID | `user7` (simple) |
| Aspect (global) | `edu` | `EDU` (uppercase) |
| Standard (global) | UUID | `ES1` (code) |
| MAT Aspect | `mat_aspect_id` (UUID) | `OLT-EDU` (MAT-CODE) |
| MAT Standard | `mat_standard_id` (UUID) | `OLT-ES1` (MAT-CODE) |
| Term | `T1` + `2024-2025` (separate) | `T1-2024-25` (unified) |
| Assessment | `school-aspect-term-year` | `school-standard-term` |
| Assessment Group | N/A (new concept) | `school-aspect-term` |

### 2. Term Structure

**v3:**
```json
{
  "term_id": "T1",
  "academic_year": "2024-2025"
}
```

**v4:**
```json
{
  "unique_term_id": "T1-2024-25",
  "term_id": "T1",
  "academic_year": "2024-25"
}
```

### 3. Assessment Architecture

**v3:** Single concept - "Assessment"
- List endpoint returned assessments grouped somehow
- Detail endpoint returned one assessment with standards array

**v4:** Two concepts - "Assessment Groups" and "Assessments"
- **Assessment Group:** Represents all standards for a school/aspect/term
- **Assessment:** Individual standard rating within a group

**Endpoints:**
- `GET /api/assessments` → Returns `AssessmentGroup[]`
- `GET /api/assessments/{assessment_id}` → Returns single `Assessment`
- `GET /api/assessments/by-aspect/{aspect_code}` → Returns `AssessmentByAspect` (new!)

### 4. User Structure

**v3:**
```json
{
  "user_id": "uuid",
  "first_name": "Tom",
  "last_name": "Walch",
  "role_title": "mat-admin"
}
```

**v4:**
```json
{
  "user_id": "user7",
  "full_name": "Tom Walch",
  "role_title": "MAT Administrator"
}
```

### 5. Aspect/Standard Responses

**v3:**
```json
{
  "mat_aspect_id": "uuid",
  "aspect_code": "EDU",
  "aspect_name": "Education",
  "mat_id": "OLT"
}
```

**v4:**
```json
{
  "mat_aspect_id": "OLT-EDU",
  "aspect_code": "EDU",
  "aspect_name": "Education"
}
```

Note: `mat_id` is embedded in the ID itself!

---

## Frontend Changes Required

### 1. Type Definitions (`src/types/`)

#### `auth.ts` - User Interface
```typescript
// OLD
export interface User {
  user_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role_title: 'mat-admin' | 'department-head' | string;
  mat_id: string;
  school_id?: string;
  permissions?: string[];
}

// NEW
export interface User {
  user_id: string;           // "user7"
  email: string;
  full_name: string;         // "Tom Walch"
  mat_id: string;            // "OLT"
  mat_name?: string;         // "Opal Learning Trust"
  school_id: string | null;  // "cedar-park-primary" or null
  school_name?: string | null;
  role_title: string | null; // "MAT Administrator"
  is_active: boolean;
  last_login: string | null;
}
```

#### `assessment.ts` - Complete Overhaul

**Remove:**
- `MatAspect`, `MatStandard` (will be replaced)
- Old `Assessment` interface

**Add:**
```typescript
// Core Types
type AssessmentStatus = 'not_started' | 'in_progress' | 'completed' | 'approved';
type Rating = 1 | 2 | 3 | 4 | null;

// Assessment Group (summary view)
interface AssessmentGroup {
  group_id: string;               // cedar-park-primary-EDU-T1-2024-25
  school_id: string;              // cedar-park-primary
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

// Individual Assessment
interface Assessment {
  id: string;                     // UUID (internal DB ID)
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

// Assessment by Aspect (form view)
interface AssessmentByAspect {
  school_id: string;
  school_name: string;
  aspect_code: string;
  aspect_name: string;
  mat_aspect_id: string;
  term_id: string;                // T1-2024-25 (unique_term_id)
  academic_year: string;
  total_standards: number;
  completed_standards: number;
  status: AssessmentStatus;
  standards: AssessmentStandard[];
}

interface AssessmentStandard {
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

// Standard (management view)
interface Standard {
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

// Aspect
interface Aspect {
  mat_aspect_id: string;          // OLT-EDU
  aspect_code: string;            // EDU
  aspect_name: string;
  aspect_description: string;
  sort_order: number;
  is_custom: boolean;
  standards_count: number;
}

// Term
interface Term {
  unique_term_id: string;         // T1-2024-25
  term_id: string;                // T1
  term_name: string;              // "Autumn Term"
  start_date: string;
  end_date: string;
  academic_year: string;          // 2024-25
  is_current: boolean;
}

// School
interface School {
  school_id: string;              // cedar-park-primary
  school_name: string;
  school_type: 'primary' | 'secondary' | 'all_through' | 'special' | 'central';
  is_central_office: boolean;
  is_active: boolean;
}
```

### 2. Data Transformers (`src/lib/data-transformers.ts`)

**Status:** Almost complete rewrite needed

**Remove:**
- All v3 transformer functions
- Term mapping logic (simplified in v4)
- Category normalization (no longer needed)

**Replace with:**
- Direct pass-through for most v4 responses (they're already frontend-ready!)
- Simple ID extraction helpers
- Status mapping (if needed)

### 3. Services

#### `auth-service.ts`
- Update `verifyToken` to handle `full_name` instead of `first_name` + `last_name`
- Update user object mapping

#### `assessment-service.ts`
- Replace ALL endpoints with v4 equivalents
- Add new `getAssessmentsByAspect()` function
- Update payload structures for create/update

#### `enhanced-assessment-service.ts`
- Update caching keys (new ID formats)
- Update optimistic updates

### 4. Components

#### Standards Management (`src/pages/admin/StandardsManagement.tsx`)
- Update to use new ID format: `OLT-ES1` instead of UUIDs
- Update aspect filtering logic
- Update field references

#### Modals
- `CreateStandardModal.tsx` - Update ID generation
- `CreateAspectModal.tsx` - Update ID references
- `VersionHistoryModal.tsx` - Update version display

### 5. Hooks

#### `useStandardsPersistence.ts`
- Update type references
- Update service calls

---

## Migration Strategy

### Phase 1: Type Definitions ✅
1. Update `src/types/auth.ts`
2. Update `src/types/assessment.ts`
3. Run type check

### Phase 2: Data Layer
1. Update `src/lib/data-transformers.ts`
2. Update `src/services/auth-service.ts`
3. Update `src/services/assessment-service.ts`
4. Update `src/services/enhanced-assessment-service.ts`

### Phase 3: Hooks
1. Update `src/hooks/use-standards-persistence.ts`
2. Update `src/hooks/use-assessments.ts`

### Phase 4: Components
1. Update `src/pages/admin/StandardsManagement.tsx`
2. Update modal components
3. Update assessment pages

### Phase 5: Testing
1. Test authentication flow
2. Test standards management
3. Test assessment CRUD
4. Test filtering and search

---

## Benefits of v4

1. **Simpler IDs** - Human-readable, easier to debug
2. **Better structure** - Clear separation of groups vs assessments
3. **Unified terms** - No more combining `term_id` + `academic_year`
4. **Cleaner responses** - Less transformation needed
5. **Better caching** - Predictable IDs for cache keys

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking changes to existing UI | High | Systematic phase-by-phase update |
| Data migration for existing state | Medium | Clear local storage on deploy |
| ID format changes breaking bookmarks | Low | Add redirects if needed |
| Type errors during transition | High | Fix all TypeScript errors before deploy |

---

## Next Steps

1. ✅ Create this analysis document
2. ⏳ Update type definitions
3. ⏳ Update services layer
4. ⏳ Update components
5. ⏳ Test thoroughly
6. ⏳ Deploy with migration notes

---

**Estimated Time:** 4-6 hours for complete migration
**Complexity:** High (architectural change)
**Risk Level:** Medium (comprehensive spec reduces unknowns)

