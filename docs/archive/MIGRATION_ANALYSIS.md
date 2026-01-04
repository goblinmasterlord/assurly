# API v3.0 Migration Analysis & Action Plan

**Date:** December 22, 2025  
**Status:** 🔴 Critical - Breaking Changes Identified  
**Migration Type:** v2.x → v3.0 (Multi-Tenant Architecture)

---

## Executive Summary

The backend has been completely redesigned with a **multi-tenant architecture** featuring MAT (Multi-Academy Trust) isolation, immutable versioning, and copy-on-write customization. This requires significant frontend updates across authentication, data models, API calls, and UI components.

### Critical Breaking Changes
1. ✅ **Authentication:** JWT payload structure changed (added `mat_id`, `school_id`, renamed `role` → `role_title`)
2. ✅ **Aspects:** Renamed from `aspect_id` → `mat_aspect_id` with MAT isolation
3. ✅ **Standards:** Renamed from `standard_id` → `mat_standard_id` with versioning system
4. ✅ **Soft Deletes:** All entities now use `is_active` flags instead of hard deletes
5. ✅ **Copy-on-Write:** New `source_aspect_id` and `source_standard_id` tracking

---

## Current State Analysis

### ✅ What's Already Compatible

1. **Authentication Service** (`src/services/auth-service.ts`)
   - ✅ Magic link flow structure is compatible
   - ✅ Token storage using localStorage
   - ✅ JWT token handling in place
   - ⚠️ **NEEDS UPDATE:** User mapping for new fields

2. **API Client** (`src/lib/api-client.ts`)
   - ✅ Bearer token authentication working
   - ✅ Error handling comprehensive
   - ✅ Request/response interceptors in place

3. **Assessment Service** (`src/services/assessment-service.ts`)
   - ✅ Endpoint structure mostly compatible
   - ⚠️ **NEEDS UPDATE:** Field name mappings

### ❌ What Needs Migration

#### 1. **User Type Definitions** (`src/types/auth.ts`)

**Current:**
```typescript
export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'mat-admin' | 'department-head';  // ❌ Should be role_title
  schools?: string[];                       // ❌ Should be school_id (singular)
  permissions?: string[];
}
```

**Required:**
```typescript
export interface User {
  user_id: string;                          // ✅ Match backend field name
  email: string;
  first_name?: string;                      // ✅ Split name field
  last_name?: string;                       // ✅ Split name field
  role_title: 'Teacher' | 'Administrator' | 'Head of Department'; // ✅ New field
  mat_id: string;                          // ✅ REQUIRED - MAT isolation
  school_id: string | null;                // ✅ Nullable for MAT-wide users
}
```

#### 2. **Assessment Types** (`src/types/assessment.ts`)

**Current Issues:**
```typescript
export interface Aspect {
  id: string;                    // ❌ Should be mat_aspect_id
  code: string;
  name: string;
  description: string;
  isCustom: boolean;            // ✅ Already present (map to is_custom)
  standardCount: number;
}

export interface Standard {
  id: string;                    // ❌ Should be mat_standard_id
  code: string;
  title: string;                 // ❌ Should be standard_name
  description: string;
  rating: Rating;
  evidence?: string;
  aspectId?: string;             // ❌ Should be mat_aspect_id
  // ❌ MISSING: version_number, version_id, is_custom, is_modified
}
```

**Required Updates:**
```typescript
export interface Aspect {
  mat_aspect_id: string;         // ✅ New MAT-scoped ID
  mat_id: string;                // ✅ Tenant isolation
  aspect_code: string;
  aspect_name: string;
  aspect_description?: string;
  sort_order?: number;
  source_aspect_id?: string;     // ✅ Copy-on-write tracking
  is_custom: boolean;            // ✅ Created by this MAT
  is_modified: boolean;          // ✅ Customized from source
  standards_count: number;
  is_active: boolean;            // ✅ Soft delete flag
  created_at: string;
  updated_at: string;
}

export interface Standard {
  mat_standard_id: string;       // ✅ New MAT-scoped ID
  mat_id: string;                // ✅ Tenant isolation
  mat_aspect_id: string;         // ✅ MAT-scoped aspect reference
  standard_code: string;
  standard_name: string;         // ✅ Renamed from 'title'
  standard_description?: string;
  sort_order?: number;
  source_standard_id?: string;   // ✅ Copy-on-write tracking
  is_custom: boolean;            // ✅ Created by this MAT
  is_modified: boolean;          // ✅ Customized from source
  version_number: number;        // ✅ Current version
  version_id: string;            // ✅ Current version record ID
  aspect_code?: string;          // ✅ For display
  aspect_name?: string;          // ✅ For display
  is_active: boolean;            // ✅ Soft delete flag
  created_at: string;
  updated_at: string;
  
  // Assessment-specific fields (when in assessment context)
  rating?: Rating;
  evidence_comments?: string;
  submitted_at?: string;
  submitted_by?: string;
}

export interface StandardVersion {
  version_id: string;
  mat_standard_id: string;
  version_number: number;
  standard_code: string;
  standard_name: string;
  standard_description?: string;
  effective_from: string;
  effective_to: string | null;   // null = current version
  created_by_user_id: string;
  change_reason?: string;
  created_at: string;
}
```

#### 3. **Auth Context** (`src/contexts/AuthContext.tsx`)

**Lines 66-72 Need Update:**
```typescript
// OLD - Mapping backend user incorrectly
mappedUser = {
  id: user.user_id || user.id || 'unknown',
  email: user.email,
  name: user.full_name || user.name || null,
  role: (user.role === 'mat_admin' || user.role === 'mat-admin') ? 'mat-admin' : 'department-head',
  schools: user.school_id ? [user.school_id] : []
};
```

**Should Be:**
```typescript
// NEW - Proper v3.0 mapping
mappedUser = {
  user_id: backendUser.user_id,
  email: backendUser.email,
  first_name: backendUser.first_name,
  last_name: backendUser.last_name,
  role_title: backendUser.role_title,
  mat_id: backendUser.mat_id,          // REQUIRED
  school_id: backendUser.school_id     // nullable
};
```

#### 4. **Assessment Service** (`src/services/assessment-service.ts`)

**Lines 227-242 - `getAspects()` Mapping:**
```typescript
// OLD - Using wrong field names
return response.data.map((a: any) => ({
  id: a.aspect_id,                    // ❌ Should be mat_aspect_id
  code: a.aspect_id,
  name: a.aspect_name,
  description: a.description,
  isCustom: a.is_custom !== false,
  standardCount: a.standards_count || 0
}));
```

**Should Be:**
```typescript
// NEW - v3.0 field names
return response.data.map((a: any) => ({
  mat_aspect_id: a.mat_aspect_id,
  mat_id: a.mat_id,
  aspect_code: a.aspect_code,
  aspect_name: a.aspect_name,
  aspect_description: a.aspect_description,
  sort_order: a.sort_order,
  source_aspect_id: a.source_aspect_id,
  is_custom: a.is_custom,
  is_modified: a.is_modified,
  standards_count: a.standards_count || 0,
  is_active: a.is_active,
  created_at: a.created_at,
  updated_at: a.updated_at
}));
```

**Lines 107-120 - `getStandards()` Mapping:**
Needs complete rewrite to use `mat_standard_id`, `mat_aspect_id`, versioning fields.

**Lines 244-264 - `createAspect()` Payload:**
```typescript
// OLD
const payload = {
  aspect_id: aspect.code,            // ❌ Wrong field
  aspect_name: aspect.name
};
```

**Should Be:**
```typescript
// NEW - v3.0 structure
const payload = {
  aspect_code: aspect.aspect_code,
  aspect_name: aspect.aspect_name,
  aspect_description: aspect.aspect_description,
  sort_order: aspect.sort_order,
  source_aspect_id: aspect.source_aspect_id  // For copy-on-write
};
```

**Lines 296-310 - `createStandard()` Payload:**
```typescript
// OLD
const payload = {
  standard_id: standard.code,        // ❌ Wrong field
  standard_name: standard.title,     // ❌ 'title' doesn't exist in new type
  aspect_id: standard.aspectId,      // ❌ Should be mat_aspect_id
  description: standard.description || ''
};
```

**Should Be:**
```typescript
// NEW - v3.0 structure
const payload = {
  mat_aspect_id: standard.mat_aspect_id,
  standard_code: standard.standard_code,
  standard_name: standard.standard_name,
  standard_description: standard.standard_description,
  sort_order: standard.sort_order,
  source_standard_id: standard.source_standard_id,  // For copy-on-write
  change_reason: 'Initial version'                  // REQUIRED for versioning
};
```

#### 5. **Data Transformers** (`src/lib/data-transformers.ts`)

This file likely needs major updates to transform API responses. Need to check if it exists and update all transformers.

#### 6. **Standards Persistence Hook** (`src/hooks/use-standards-persistence.ts`)

**Lines 44-75 - `addStandard()` Function:**
Currently creates standards with old field names. Needs update for v3.0 payload structure.

**Lines 78-101 - `updateStandard()` Function:**
Missing `change_reason` field required for versioning.

#### 7. **Assessment Endpoints**

Assessment endpoints return standards with ratings. These need to map:
- `standard_id` → `mat_standard_id`
- Include version information
- Handle MAT isolation

---

## API Endpoint Mapping

### Aspects

| Old Endpoint | New Endpoint | Changes |
|--------------|--------------|---------|
| `GET /api/aspects` | `GET /api/aspects` | ✅ Same path |
| Response field: `aspect_id` | Response field: `mat_aspect_id` | ❌ Breaking |
| - | Response includes: `source_aspect_id`, `is_custom`, `is_modified` | ✅ New fields |

### Standards

| Old Endpoint | New Endpoint | Changes |
|--------------|--------------|---------|
| `GET /api/standards` | `GET /api/standards` | ✅ Same path |
| Query param: `aspect_id` | Query param: `mat_aspect_id` | ❌ Breaking |
| Response field: `standard_id` | Response field: `mat_standard_id` | ❌ Breaking |
| - | Response includes: `version_number`, `version_id`, `is_custom`, `is_modified` | ✅ New fields |
| - | `GET /api/standards/{mat_standard_id}/versions` | ✅ New endpoint |

### Assessments

| Field | Changes |
|-------|---------|
| Standards array contains `standard_id` | Must use `mat_standard_id` | ❌ Breaking |
| - | Standards include version info | ✅ New data |

---

## Migration Priority Levels

### 🔴 **Critical (Blocks All Functionality)**
1. ✅ User type definition and auth context mapping
2. ✅ Aspect and Standard type definitions
3. ✅ Assessment service field mappings
4. ✅ Data transformer updates

### 🟡 **High (Breaks Specific Features)**
5. ✅ Standards Management UI (create/edit/delete)
6. ✅ Assessment detail page (standard display)
7. ✅ Standards persistence hook

### 🟢 **Medium (New Features)**
8. ✅ Version history UI for standards
9. ✅ Copy-on-write UI (copy from source aspect/standard)
10. ✅ Display `is_custom` and `is_modified` badges

---

## Testing Checklist

After migration, test the following:

### Authentication
- [ ] Login with magic link
- [ ] JWT token includes `mat_id`, `school_id`, `role_title`
- [ ] User profile displays correct MAT and school
- [ ] Session persists across page refresh

### Aspects
- [ ] List all aspects for user's MAT
- [ ] Create new aspect (custom)
- [ ] Copy aspect from another MAT (source_aspect_id set)
- [ ] Edit aspect name/description
- [ ] Delete aspect (soft delete - is_active = false)
- [ ] View `is_custom` and `is_modified` indicators

### Standards
- [ ] List standards filtered by aspect
- [ ] Create new standard with change_reason
- [ ] Edit standard (creates new version)
- [ ] View version history
- [ ] Delete standard (soft delete)
- [ ] Copy standard from source
- [ ] Reorder standards within aspect

### Assessments
- [ ] Load assessments with correct standard IDs
- [ ] Submit ratings using mat_standard_id
- [ ] View completed assessment with version info
- [ ] Filter assessments by school/MAT

### MAT Isolation
- [ ] User A (MAT 1) cannot see User B's (MAT 2) data
- [ ] API returns 403 for cross-tenant access attempts
- [ ] All data scoped to user's mat_id

---

## Rollback Plan

If migration causes critical issues:

1. **Immediate:** Revert to last working commit
2. **Short-term:** Run frontend with v2.x compatibility layer
3. **Long-term:** Backend provides v2.x compatibility endpoints

---

## Next Steps

1. ✅ Create updated type definitions
2. ✅ Update authentication service and context
3. ✅ Update assessment service API calls
4. ✅ Update data transformers
5. ✅ Update Standards Management UI
6. ✅ Test end-to-end with production API
7. ✅ Update documentation

---

## Questions for Backend Team

1. ✅ **Confirmed:** Is `mat_id` always present in JWT token?
2. ✅ **Confirmed:** Can users belong to multiple MATs? (No - one MAT per user)
3. ⚠️ **Clarify:** What happens when copying an aspect - are its standards also copied?
4. ⚠️ **Clarify:** Can we query standards by version_number for point-in-time views?
5. ⚠️ **Clarify:** Is there a batch endpoint for updating multiple standards' versions?
6. ⚠️ **Clarify:** How do we handle assessments that reference old standard versions?

---

## Estimated Migration Effort

| Task | Complexity | Time Estimate |
|------|-----------|---------------|
| Type definitions | Low | 2 hours |
| Auth service/context | Medium | 4 hours |
| Assessment service | High | 6 hours |
| Data transformers | Medium | 4 hours |
| Standards Management UI | High | 8 hours |
| Testing & QA | High | 8 hours |
| **Total** | | **32 hours** |

---

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| Breaking production auth | Critical | Medium | Test thoroughly in staging first |
| Data loss during migration | Critical | Low | Backend uses soft deletes |
| Cross-tenant data leak | Critical | Low | MAT isolation at DB level |
| Version conflicts | Medium | Medium | Clear version display in UI |
| Performance degradation | Medium | Low | Backend optimized for multi-tenant queries |

---

**Document Version:** 1.0  
**Last Updated:** December 22, 2025  
**Owner:** Frontend Team


