# Frontend Build Issues - V4 API Migration

**Date**: January 4, 2026  
**Status**: 🔴 Build Failing - 185 TypeScript Errors  
**Root Cause**: Type definitions updated to v4 API but frontend code still uses v3 patterns

## Problem Summary

The frontend build is failing with 185 TypeScript errors because:

1. **Type definitions were updated to v4 API** (`src/types/assessment.ts`)
   - Uses snake_case: `due_date`, `academic_year`, `last_updated`
   - Uses v4 status values: `not_started`, `in_progress`, `completed`
   - Uses v4 field names: `mat_standard_id`, `standard_code`, etc.

2. **Frontend code still uses v3 patterns**
   - Uses camelCase: `dueDate`, `academicYear`, `lastUpdated`
   - Uses v3 status values: `"Not Started"`, `"In Progress"`, `"Completed"`
   - Uses v3 field names: `id`, `code`, `title`, etc.

## Error Categories

### 1. Property Name Mismatches (Most Common)
- `assessment.dueDate` → should be `assessment.due_date`
- `assessment.academicYear` → should be `assessment.academic_year`
- `assessment.lastUpdated` → should be `assessment.last_updated`
- `assessment.assignedTo` → should be `assessment.assigned_to`
- `standard.id` → should be `standard.mat_standard_id`
- `standard.code` → should be `standard.standard_code`
- `standard.title` → should be `standard.standard_name`

### 2. Status Value Mismatches
- `"Completed"` → should be `"completed"`
- `"In Progress"` → should be `"in_progress"`
- `"Not Started"` → should be `"not_started"`
- `"Overdue"` → no v4 equivalent

### 3. Missing Properties
- `assessment.standards` - not in v4 Assessment type
- `assessment.name` - not in v4 Assessment type
- `assessment.overallScore` - not in v4 Assessment type
- `standard.rating` - not in v4 Standard type (only in AssessmentStandard)
- `standard.evidence` - not in v4 Standard type

### 4. Type Incompatibilities
- `User.id` is optional in v4 but required in v3 code
- `School.name` is optional but code expects it required
- `Assessment.category` is optional but code expects it required

## Attempted Fixes

### 1. Added Backward Compatibility Fields ✅
Added optional v3-style fields to types:
```typescript
export interface Assessment {
  // v4 fields
  due_date: string | null;
  academic_year: string;
  last_updated: string;
  
  // Backward compatibility
  dueDate?: string | null;
  academicYear?: string;
  lastUpdated?: string;
  name?: string;
  category?: string;
  standards?: Standard[];
  overallScore?: number;
}
```

### 2. Extended AssessmentStatus Type ✅
```typescript
export type AssessmentStatus = 
  | 'not_started' | 'in_progress' | 'completed' | 'approved'  // v4
  | 'Not Started' | 'In Progress' | 'Completed' | 'Overdue';  // v3
```

### 3. Created V4 Adapter Module ✅
Created `src/lib/v4-adapter.ts` to convert between v4 API and v3 frontend format.

### 4. Fixed Data Transformers ✅
Updated `src/lib/data-transformers.ts` to handle both v3 and v4 status values.

## Remaining Issues (185 Errors)

### Files with Most Errors
1. `src/pages/AssessmentDetail.tsx` - ~150 errors
   - Uses `standard.id`, `standard.code`, `standard.title` throughout
   - Uses `assessment.standards` array
   - Uses `assessment.status === "Completed"` comparisons

2. `src/pages/Assessments.tsx` - ~30 errors
   - Uses `assessment.dueDate`, `assessment.academicYear`
   - Uses `assessment.name`, `assessment.category`
   - Uses v3 status string comparisons

3. `src/components/SchoolPerformanceView.tsx` - ~40 errors
   - Uses `assessment.overallScore`
   - Uses `assessment.school.name` (possibly undefined)
   - Uses v3 field names throughout

4. `src/components/AssessmentInvitationSheet.tsx` - ~10 errors
   - Uses v3 API request format
   - Uses `User.id` (now optional)

5. `src/hooks/use-assessments.ts` - ~5 errors
   - Uses v3 API method signatures
   - Missing `submitAssessment` method

## Solutions

### Option 1: Complete Frontend Migration to V4 (Recommended)
**Effort**: 2-3 days  
**Impact**: Clean, future-proof solution

Steps:
1. Update all components to use v4 field names
2. Update all status comparisons to use v4 values
3. Update API service methods to match v4 endpoints
4. Add data transformers at API boundary
5. Update tests

### Option 2: Add Runtime Data Transformation
**Effort**: 1 day  
**Impact**: Quick fix, technical debt

Steps:
1. Intercept all API responses
2. Transform v4 data to v3 format
3. Keep frontend code unchanged
4. Plan future migration

### Option 3: Revert Type Definitions to V3
**Effort**: 1 hour  
**Impact**: Temporary fix, blocks v4 adoption

Steps:
1. Revert `src/types/assessment.ts` to v3 format
2. Keep v4 types in separate file
3. Gradually migrate components

## Recommended Action Plan

### Immediate (Today)
1. ✅ Document the issue (this file)
2. ⏳ Choose migration strategy
3. ⏳ Create feature branch for v4 migration
4. ⏳ Commit current progress

### Short Term (This Week)
1. Implement Option 2 (Runtime transformation)
2. Get build working
3. Deploy to staging
4. Verify functionality

### Long Term (Next Sprint)
1. Plan full v4 migration
2. Update components one by one
3. Remove transformation layer
4. Deploy to production

## Files Modified So Far

1. `src/types/assessment.ts` - Added backward compatibility fields
2. `src/lib/v4-adapter.ts` - Created adapter module
3. `src/lib/data-transformers.ts` - Fixed status mapping
4. `src/services/auth-service.ts` - Added token_type field

## Next Steps

1. **Decision needed**: Choose migration strategy (Option 1, 2, or 3)
2. **If Option 2**: Implement API response interceptor
3. **If Option 1**: Create migration plan and timeline
4. **If Option 3**: Revert types and plan gradual migration

## Testing Requirements

Once build is fixed:
1. Test authentication flow
2. Test assessment listing
3. Test assessment detail view
4. Test assessment creation
5. Test assessment submission
6. Test all user roles
7. Test all status transitions

## Related Documentation

- V4 API Spec: `docs/api/FRONTEND_API_SPECIFICATION_v4.md`
- V4 Migration Summary: `docs/api/V4_MIGRATION_SUMMARY.md`
- Backend API: `assurly-backend/API_DOCUMENTATION.md`
- Project Structure: `docs/api/PROJECT_STRUCTURE.md`

---

**Status**: Awaiting decision on migration strategy  
**Priority**: 🔴 Critical - Blocks deployment  
**Owner**: Development Team

