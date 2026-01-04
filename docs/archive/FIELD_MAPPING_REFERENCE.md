# API v3.0 Field Mapping Quick Reference

**Purpose:** Quick lookup table for developers during migration  
**Date:** December 22, 2025

---

## User / Authentication

| v2.x Field | v3.0 Field | Type | Notes |
|------------|------------|------|-------|
| `id` | `user_id` | string | Primary identifier |
| `name` | `first_name` + `last_name` | string | Split into two fields |
| `full_name` | `first_name` + `last_name` | string | Computed from parts |
| `role` | `role_title` | string | e.g., "Teacher", "Administrator" |
| `schools` (array) | `school_id` (nullable) | string \| null | Single school or null for MAT-wide |
| ❌ Not present | `mat_id` | string | **REQUIRED** - tenant isolation |

### JWT Token Payload

| v2.x Field | v3.0 Field | Type | Notes |
|------------|------------|------|-------|
| `sub` | `sub` | string | ✅ Same - user_id |
| `email` | `email` | string | ✅ Same |
| `exp` | `exp` | number | ✅ Same |
| ❌ Not present | `mat_id` | string | **NEW** - tenant context |
| ❌ Not present | `school_id` | string \| null | **NEW** - school context |
| ❌ Not present | `iat` | number | **NEW** - issued at timestamp |
| ❌ Not present | `type` | string | **NEW** - token type ("access") |

---

## Aspects

| v2.x Field | v3.0 Field | Type | Notes |
|------------|------------|------|-------|
| `id` | `mat_aspect_id` | string | MAT-scoped identifier |
| `aspect_id` | `aspect_code` | string | Unique code within MAT |
| `name` | `aspect_name` | string | Display name |
| `description` | `aspect_description` | string | Optional description |
| `isCustom` | `is_custom` | boolean | Created by this MAT |
| `standardCount` | `standards_count` | number | Count of active standards |
| ❌ Not present | `mat_id` | string | **NEW** - owner MAT |
| ❌ Not present | `sort_order` | number | **NEW** - display order |
| ❌ Not present | `source_aspect_id` | string | **NEW** - copy-on-write source |
| ❌ Not present | `is_modified` | boolean | **NEW** - customized from source |
| ❌ Not present | `is_active` | boolean | **NEW** - soft delete flag |
| ❌ Not present | `created_at` | string | **NEW** - ISO timestamp |
| ❌ Not present | `updated_at` | string | **NEW** - ISO timestamp |

---

## Standards

| v2.x Field | v3.0 Field | Type | Notes |
|------------|------------|------|-------|
| `id` | `mat_standard_id` | string | MAT-scoped identifier |
| `standard_id` | `standard_code` | string | Unique code within MAT |
| `title` | `standard_name` | string | Display name |
| `description` | `standard_description` | string | Optional description |
| `aspectId` | `mat_aspect_id` | string | Parent aspect reference |
| `rating` | `rating` | number \| null | ✅ Same (1-4 or null) |
| `evidence` | `evidence_comments` | string | Evidence text |
| `lastUpdated` | `updated_at` | string | Last modification time |
| ❌ Not present | `mat_id` | string | **NEW** - owner MAT |
| ❌ Not present | `sort_order` | number | **NEW** - display order |
| ❌ Not present | `source_standard_id` | string | **NEW** - copy-on-write source |
| ❌ Not present | `is_custom` | boolean | **NEW** - created by this MAT |
| ❌ Not present | `is_modified` | boolean | **NEW** - customized from source |
| ❌ Not present | `version_number` | number | **NEW** - current version (1, 2, 3...) |
| ❌ Not present | `version_id` | string | **NEW** - current version record ID |
| ❌ Not present | `is_active` | boolean | **NEW** - soft delete flag |
| ❌ Not present | `created_at` | string | **NEW** - ISO timestamp |
| ❌ Not present | `aspect_code` | string | **NEW** - for display |
| ❌ Not present | `aspect_name` | string | **NEW** - for display |
| ❌ Not present | `submitted_at` | string | **NEW** - submission timestamp |
| ❌ Not present | `submitted_by` | string | **NEW** - submitter user_id |

---

## Standard Versions (NEW in v3.0)

| Field | Type | Description |
|-------|------|-------------|
| `version_id` | string | Unique version identifier |
| `mat_standard_id` | string | Parent standard reference |
| `version_number` | number | Sequential version (1, 2, 3...) |
| `standard_code` | string | Code at this version |
| `standard_name` | string | Name at this version |
| `standard_description` | string | Description at this version |
| `effective_from` | string | When version became active |
| `effective_to` | string \| null | When version was superseded (null = current) |
| `created_by_user_id` | string | User who created this version |
| `change_reason` | string | Why this version was created |
| `created_at` | string | Creation timestamp |

---

## Assessments

| v2.x Field | v3.0 Field | Type | Notes |
|------------|------------|------|-------|
| `assessment_id` | `assessment_id` | string | ✅ Same - composite ID |
| `name` | `name` | string | ✅ Same |
| `category` | `category` | string | ✅ Same |
| `school_id` | `school_id` | string | ✅ Same |
| `school_name` | `school_name` | string | ✅ Same |
| `status` | `status` | string | ✅ Same |
| `term_id` | `term_id` | string | ✅ Same (T1, T2, T3) |
| `academic_year` | `academic_year` | string | ✅ Same (2024-25) |
| `mat_id` | `mat_id` | string | ✅ Already present |
| `standards` (array) | `standards` (array) | MatStandard[] | ⚠️ Now uses MatStandard type |

**Note:** Assessment structure is mostly compatible, but the standards array now contains v3.0 MatStandard objects with versioning information.

---

## Schools

| v2.x Field | v3.0 Field | Type | Notes |
|------------|------------|------|-------|
| `school_id` | `school_id` | string | ✅ Same |
| `school_name` | `school_name` | string | ✅ Same |
| `school_code` | `school_code` | string | ✅ Same |
| `mat_id` | `mat_id` | string | ✅ Same |
| `mat_name` | `mat_name` | string | ✅ Same |

**Note:** School structure is fully compatible - no changes needed.

---

## API Query Parameters

### Aspects Endpoints

| v2.x Parameter | v3.0 Parameter | Notes |
|----------------|----------------|-------|
| N/A | N/A | No query params - returns all for user's MAT |

### Standards Endpoints

| v2.x Parameter | v3.0 Parameter | Notes |
|----------------|----------------|-------|
| `aspect_id` | `mat_aspect_id` | **RENAMED** - filter by MAT aspect |

### Assessments Endpoints

| v2.x Parameter | v3.0 Parameter | Notes |
|----------------|----------------|-------|
| `school_id` | `school_id` | ✅ Same |
| `category` | `category` | ✅ Same |
| `term` | `term_id` | ✅ Same |
| `academic_year` | `academic_year` | ✅ Same |
| `status` | `status` | ✅ Same |

---

## API Request Payloads

### Create Aspect

```typescript
// v2.x
{
  aspect_id: "EDU",
  aspect_name: "Education"
}

// v3.0
{
  aspect_code: "EDU",
  aspect_name: "Education",
  aspect_description: "Optional description",
  sort_order: 1,
  source_aspect_id: "source-uuid-or-null"  // NEW - for copy-on-write
}
```

### Update Aspect

```typescript
// v2.x
{
  aspect_name: "Updated Name"
}

// v3.0
{
  aspect_name: "Updated Name",
  aspect_description: "Updated description",  // Optional
  sort_order: 2  // Optional
}
```

### Create Standard

```typescript
// v2.x
{
  standard_id: "ES1",
  standard_name: "Quality of Education",
  aspect_id: "education",
  description: "Description text"
}

// v3.0
{
  mat_aspect_id: "mat-aspect-uuid",
  standard_code: "ES1",
  standard_name: "Quality of Education",
  standard_description: "Description text",
  sort_order: 1,
  source_standard_id: "source-uuid-or-null",  // NEW - for copy-on-write
  change_reason: "Initial version"  // REQUIRED - for versioning
}
```

### Update Standard

```typescript
// v2.x
{
  standard_name: "Updated Name",
  description: "Updated description"
}

// v3.0
{
  standard_name: "Updated Name",
  standard_description: "Updated description",
  change_reason: "Updated based on feedback"  // REQUIRED - creates new version
}
```

### Submit Assessment

```typescript
// v2.x
{
  assessment_id: "composite-id",
  standards: [
    {
      standard_id: "ES1",  // ⚠️ Old field name
      rating: 4,
      evidence_comments: "Evidence text",
      submitted_by: "user1"
    }
  ]
}

// v3.0
{
  assessment_id: "composite-id",
  standards: [
    {
      standard_id: "mat-standard-uuid",  // ⚠️ Now uses mat_standard_id value
      rating: 4,
      evidence_comments: "Evidence text",
      submitted_by: "user1"
    }
  ]
}
```

**Note:** The field name in the payload is still `standard_id`, but the value should be the `mat_standard_id` from the v3.0 API.

---

## API Response Status Codes

| Status | v2.x | v3.0 | Notes |
|--------|------|------|-------|
| 200 OK | ✅ | ✅ | Successful GET/PUT |
| 201 Created | ✅ | ✅ | Successful POST |
| 204 No Content | ✅ | ✅ | Successful DELETE |
| 400 Bad Request | ✅ | ✅ | Invalid request data |
| 401 Unauthorized | ✅ | ✅ | Missing/invalid token |
| 403 Forbidden | ⚠️ Rare | ✅ **Common** | **NEW** - Cross-tenant access |
| 404 Not Found | ✅ | ✅ | Resource not found |
| 500 Server Error | ✅ | ✅ | Server error |

**Important:** 403 errors are now common in v3.0 when trying to access resources from another MAT.

---

## TypeScript Type Changes

### Before (v2.x)

```typescript
interface User {
  id: string;
  email: string;
  name?: string;
  role: 'mat-admin' | 'department-head';
  schools?: string[];
}

interface Aspect {
  id: string;
  code: string;
  name: string;
  description: string;
  isCustom: boolean;
  standardCount: number;
}

interface Standard {
  id: string;
  code: string;
  title: string;
  description: string;
  rating: Rating;
  evidence?: string;
  aspectId?: string;
}
```

### After (v3.0)

```typescript
interface User {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role_title: string;
  mat_id: string;
  school_id: string | null;
}

interface MatAspect {
  mat_aspect_id: string;
  mat_id: string;
  aspect_code: string;
  aspect_name: string;
  aspect_description?: string;
  sort_order: number;
  source_aspect_id?: string;
  is_custom: boolean;
  is_modified: boolean;
  standards_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface MatStandard {
  mat_standard_id: string;
  mat_id: string;
  mat_aspect_id: string;
  standard_code: string;
  standard_name: string;
  standard_description?: string;
  sort_order: number;
  source_standard_id?: string;
  is_custom: boolean;
  is_modified: boolean;
  version_number: number;
  version_id: string;
  aspect_code?: string;
  aspect_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  rating?: Rating;
  evidence_comments?: string;
  submitted_at?: string;
  submitted_by?: string;
}
```

---

## Search & Replace Patterns

**WARNING:** Don't blindly find-and-replace! Review each change carefully.

| Search Pattern | Replace With | Context |
|----------------|--------------|---------|
| `aspect_id` | `mat_aspect_id` | In type definitions and API responses |
| `standard_id` | `mat_standard_id` | In type definitions and API responses |
| `user.role` | `user.role_title` | In user profile display |
| `user.name` | `${user.first_name} ${user.last_name}` | Display full name |
| `standard.title` | `standard.standard_name` | Standard display |
| `aspect.name` | `aspect.aspect_name` | Aspect display |
| `aspect.code` | `aspect.aspect_code` | Aspect code |

---

## Testing Quick Reference

### Check MAT Isolation

```typescript
// User A (MAT 1) - should see their data
const aspectsA = await getAspects();  // ✅ Returns MAT 1 aspects only

// User B (MAT 2) - should NOT see MAT 1 data
const aspectB = await getAspect(aspectsA[0].mat_aspect_id);  // ❌ Should return 403
```

### Check Versioning

```typescript
// Create standard - version 1
const standard = await createStandard({ 
  ...data, 
  change_reason: "Initial version" 
});
console.log(standard.version_number);  // Should be 1

// Update standard - version 2
const updated = await updateStandard({ 
  ...standard, 
  standard_name: "Updated",
  change_reason: "Updated name" 
});
console.log(updated.version_number);  // Should be 2

// Get version history
const versions = await getStandardVersions(standard.mat_standard_id);
console.log(versions.length);  // Should be 2
```

### Check Soft Deletes

```typescript
// Delete aspect
await deleteAspect(aspectId);

// Try to get aspect - should not return
const aspects = await getAspects();  // Should not include deleted aspect
```

---

## Quick Decision Tree

**Need to know which field name to use?**

```
Is it a User field?
├─ Yes → Use snake_case (user_id, first_name, mat_id, role_title)
└─ No → Continue

Is it an Aspect field?
├─ Yes → Use mat_aspect_id, aspect_name, aspect_code, aspect_description
└─ No → Continue

Is it a Standard field?
├─ Yes → Use mat_standard_id, standard_name, standard_code, standard_description
└─ No → Check API documentation
```

---

**Document Version:** 1.0  
**Last Updated:** December 22, 2025  
**Maintained By:** Frontend Team


