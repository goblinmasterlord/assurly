# API v3.0 Migration - Implementation Guide

**Date:** December 22, 2025  
**Version:** 1.0  
**Target:** Frontend Migration to Multi-Tenant Architecture

This guide provides step-by-step instructions and code examples for migrating the Assurly frontend from API v2.x to v3.0.

---

## Table of Contents

1. [Phase 1: Type Definitions](#phase-1-type-definitions)
2. [Phase 2: Authentication Layer](#phase-2-authentication-layer)
3. [Phase 3: API Services](#phase-3-api-services)
4. [Phase 4: Data Transformers](#phase-4-data-transformers)
5. [Phase 5: UI Components](#phase-5-ui-components)
6. [Phase 6: Testing](#phase-6-testing)

---

## Phase 1: Type Definitions

### File: `src/types/auth.ts`

**Complete Replacement:**

```typescript
// src/types/auth.ts - v3.0 Compatible

export interface User {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role_title: string;  // e.g., "Teacher", "Administrator", "Head of Department"
  mat_id: string;      // REQUIRED - tenant isolation
  school_id: string | null;  // nullable for MAT-wide users
  created_at?: string;
  updated_at?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginRequest {
  email: string;
}

export interface VerifyTokenRequest {
  token: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface SessionResponse {
  user: User;
}

// JWT Token Payload (decoded)
export interface JWTPayload {
  sub: string;         // user_id
  email: string;
  mat_id: string;
  school_id: string | null;
  exp: number;
  iat: number;
  type: string;        // "access"
}
```

### File: `src/types/assessment.ts`

**Add New Types (append to existing file):**

```typescript
// src/types/assessment.ts - v3.0 Additions

// NEW: MAT-scoped Aspect
export interface MatAspect {
  mat_aspect_id: string;
  mat_id: string;
  aspect_code: string;
  aspect_name: string;
  aspect_description?: string;
  sort_order: number;
  source_aspect_id?: string;  // For copy-on-write tracking
  is_custom: boolean;         // Created by this MAT
  is_modified: boolean;       // Modified from source
  standards_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// NEW: MAT-scoped Standard with Versioning
export interface MatStandard {
  mat_standard_id: string;
  mat_id: string;
  mat_aspect_id: string;
  standard_code: string;
  standard_name: string;
  standard_description?: string;
  sort_order: number;
  source_standard_id?: string;  // For copy-on-write tracking
  is_custom: boolean;
  is_modified: boolean;
  version_number: number;
  version_id: string;
  aspect_code?: string;         // For display
  aspect_name?: string;         // For display
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // Assessment-specific fields (when in assessment context)
  rating?: Rating;
  evidence_comments?: string;
  submitted_at?: string;
  submitted_by?: string;
}

// NEW: Standard Version History
export interface StandardVersion {
  version_id: string;
  mat_standard_id: string;
  version_number: number;
  standard_code: string;
  standard_name: string;
  standard_description?: string;
  effective_from: string;
  effective_to: string | null;  // null = current version
  created_by_user_id: string;
  change_reason?: string;
  created_at: string;
}

// UPDATED: Assessment to use MAT-scoped standards
export interface AssessmentV3 extends Omit<Assessment, 'standards'> {
  standards?: MatStandard[];
}

// Legacy type alias for backward compatibility during migration
export type Aspect = MatAspect;
export type Standard = MatStandard;
```

---

## Phase 2: Authentication Layer

### File: `src/services/auth-service.ts`

**Update Lines 62-73 (verifyToken function):**

```typescript
// BEFORE (Lines 62-73):
let mappedUser: User | null = null;
if (response.data.user) {
  const user = response.data.user;
  mappedUser = {
    id: user.user_id || user.id || 'unknown',
    email: user.email,
    name: user.full_name || user.name || null,
    role: (user.role === 'mat_admin' || user.role === 'mat-admin') ? 'mat-admin' : 'department-head',
    schools: user.school_id ? [user.school_id] : []
  };
}

// AFTER (v3.0 compatible):
let mappedUser: User | null = null;
if (response.data.user) {
  const backendUser = response.data.user;
  mappedUser = {
    user_id: backendUser.user_id,
    email: backendUser.email,
    first_name: backendUser.first_name,
    last_name: backendUser.last_name,
    role_title: backendUser.role_title,
    mat_id: backendUser.mat_id,
    school_id: backendUser.school_id,
    created_at: backendUser.created_at,
    updated_at: backendUser.updated_at
  };
}
```

**Update Lines 106-118 (getCurrentSession function):**

```typescript
// BEFORE (Lines 106-118):
if (response.data) {
  const backendUser = response.data;
  const user: User = {
    id: backendUser.user_id,
    email: backendUser.email,
    name: backendUser.full_name,
    role: backendUser.role === 'mat_admin' ? 'mat-admin' : 'department-head',
    schools: backendUser.school_id ? [backendUser.school_id] : []
  };
  logger.debug('Session validated successfully', { userId: user.id, role: user.role });
  return { user };
}

// AFTER (v3.0 compatible):
if (response.data) {
  const backendUser = response.data;
  const user: User = {
    user_id: backendUser.user_id,
    email: backendUser.email,
    first_name: backendUser.first_name,
    last_name: backendUser.last_name,
    role_title: backendUser.role_title,
    mat_id: backendUser.mat_id,
    school_id: backendUser.school_id,
    created_at: backendUser.created_at,
    updated_at: backendUser.updated_at
  };
  logger.debug('Session validated successfully', { 
    userId: user.user_id, 
    role: user.role_title, 
    matId: user.mat_id 
  });
  return { user };
}
```

### File: `src/contexts/AuthContext.tsx`

**No changes needed** - already uses the correct User type from `src/types/auth.ts`.

---

## Phase 3: API Services

### File: `src/services/assessment-service.ts`

**Update `getAspects()` function (Lines 227-242):**

```typescript
// BEFORE:
export const getAspects = async (): Promise<Aspect[]> => {
  try {
    const response = await apiClient.get('/api/aspects');
    return response.data.map((a: any) => ({
      id: a.aspect_id,
      code: a.aspect_id,
      name: a.aspect_name,
      description: a.description,
      isCustom: a.is_custom !== false,
      standardCount: a.standards_count || 0
    }));
  } catch (error) {
    console.error('Failed to fetch aspects:', error);
    throw new Error('Failed to load aspects.');
  }
};

// AFTER (v3.0):
export const getAspects = async (): Promise<MatAspect[]> => {
  try {
    const response = await apiClient.get('/api/aspects');
    return response.data.map((a: any) => ({
      mat_aspect_id: a.mat_aspect_id,
      mat_id: a.mat_id,
      aspect_code: a.aspect_code,
      aspect_name: a.aspect_name,
      aspect_description: a.aspect_description,
      sort_order: a.sort_order ?? 0,
      source_aspect_id: a.source_aspect_id,
      is_custom: a.is_custom,
      is_modified: a.is_modified,
      standards_count: a.standards_count || 0,
      is_active: a.is_active ?? true,
      created_at: a.created_at,
      updated_at: a.updated_at
    }));
  } catch (error) {
    console.error('Failed to fetch aspects:', error);
    throw new Error('Failed to load aspects.');
  }
};
```

**Update `createAspect()` function (Lines 244-264):**

```typescript
// BEFORE:
export const createAspect = async (aspect: Omit<Aspect, 'id' | 'standardCount'>): Promise<Aspect> => {
  try {
    const payload = {
      aspect_id: aspect.code,
      aspect_name: aspect.name
    };
    const response = await apiClient.post('/api/aspects', payload);
    return {
      id: response.data.aspect_id,
      code: response.data.aspect_id,
      name: response.data.aspect_name,
      description: response.data.description,
      isCustom: true,
      standardCount: response.data.standards_count || 0
    };
  } catch (error: any) {
    console.error('Failed to create aspect:', error);
    const errorMsg = error.response?.data?.detail || 'Failed to create aspect.';
    throw new Error(errorMsg);
  }
};

// AFTER (v3.0):
export const createAspect = async (
  aspect: Omit<MatAspect, 'mat_aspect_id' | 'mat_id' | 'standards_count' | 'created_at' | 'updated_at'>
): Promise<MatAspect> => {
  try {
    const payload = {
      aspect_code: aspect.aspect_code,
      aspect_name: aspect.aspect_name,
      aspect_description: aspect.aspect_description,
      sort_order: aspect.sort_order,
      source_aspect_id: aspect.source_aspect_id  // For copy-on-write
    };
    const response = await apiClient.post('/api/aspects', payload);
    
    return {
      mat_aspect_id: response.data.mat_aspect_id,
      mat_id: response.data.mat_id,
      aspect_code: response.data.aspect_code,
      aspect_name: response.data.aspect_name,
      aspect_description: response.data.aspect_description,
      sort_order: response.data.sort_order,
      source_aspect_id: response.data.source_aspect_id,
      is_custom: response.data.is_custom,
      is_modified: response.data.is_modified,
      standards_count: response.data.standards_count || 0,
      is_active: response.data.is_active ?? true,
      created_at: response.data.created_at,
      updated_at: response.data.updated_at
    };
  } catch (error: any) {
    console.error('Failed to create aspect:', error);
    const errorMsg = error.response?.data?.detail || 'Failed to create aspect.';
    throw new Error(errorMsg);
  }
};
```

**Update `updateAspect()` function (Lines 266-283):**

```typescript
// BEFORE:
export const updateAspect = async (aspect: Aspect): Promise<Aspect> => {
  try {
    const payload = {
      aspect_name: aspect.name
    };
    const response = await apiClient.put(`/api/aspects/${aspect.id}`, payload);
    return {
      ...aspect,
      name: response.data.aspect_name,
      description: response.data.description,
      standardCount: response.data.standards_count || aspect.standardCount
    };
  } catch (error: any) {
    console.error('Failed to update aspect:', error);
    const errorMsg = error.response?.data?.detail || 'Failed to update aspect.';
    throw new Error(errorMsg);
  }
};

// AFTER (v3.0):
export const updateAspect = async (aspect: MatAspect): Promise<MatAspect> => {
  try {
    const payload = {
      aspect_name: aspect.aspect_name,
      aspect_description: aspect.aspect_description,
      sort_order: aspect.sort_order
    };
    const response = await apiClient.put(`/api/aspects/${aspect.mat_aspect_id}`, payload);
    
    return {
      mat_aspect_id: response.data.mat_aspect_id,
      mat_id: response.data.mat_id,
      aspect_code: response.data.aspect_code,
      aspect_name: response.data.aspect_name,
      aspect_description: response.data.aspect_description,
      sort_order: response.data.sort_order,
      source_aspect_id: response.data.source_aspect_id,
      is_custom: response.data.is_custom,
      is_modified: response.data.is_modified,
      standards_count: response.data.standards_count || 0,
      is_active: response.data.is_active ?? true,
      created_at: response.data.created_at,
      updated_at: response.data.updated_at
    };
  } catch (error: any) {
    console.error('Failed to update aspect:', error);
    const errorMsg = error.response?.data?.detail || 'Failed to update aspect.';
    throw new Error(errorMsg);
  }
};
```

**Update `deleteAspect()` function (Lines 285-292):**

```typescript
// No changes needed - just uses ID
export const deleteAspect = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`/api/aspects/${id}`);  // Soft delete on backend
  } catch (error) {
    console.error('Failed to delete aspect:', error);
    throw new Error('Failed to delete aspect.');
  }
};
```

**Update `getStandards()` function (Lines 107-120):**

```typescript
// BEFORE:
export const getStandards = async (aspectId?: string): Promise<Standard[]> => {
  try {
    let url = '/api/standards';
    if (aspectId) {
      url += `?aspect_id=${aspectId}`;
    }
    const response = await apiClient.get(url);
    return response.data.map(transformStandardResponse);
  } catch (error) {
    console.error('Failed to fetch standards:', error);
    throw new Error('Failed to load standards. Please try again.');
  }
};

// AFTER (v3.0):
export const getStandards = async (matAspectId?: string): Promise<MatStandard[]> => {
  try {
    let url = '/api/standards';
    if (matAspectId) {
      url += `?mat_aspect_id=${matAspectId}`;  // CHANGED: parameter name
    }
    const response = await apiClient.get(url);
    return response.data.map((s: any) => ({
      mat_standard_id: s.mat_standard_id,
      mat_id: s.mat_id,
      mat_aspect_id: s.mat_aspect_id,
      standard_code: s.standard_code,
      standard_name: s.standard_name,
      standard_description: s.standard_description,
      sort_order: s.sort_order ?? 0,
      source_standard_id: s.source_standard_id,
      is_custom: s.is_custom,
      is_modified: s.is_modified,
      version_number: s.version_number,
      version_id: s.version_id,
      aspect_code: s.aspect_code,
      aspect_name: s.aspect_name,
      is_active: s.is_active ?? true,
      created_at: s.created_at,
      updated_at: s.updated_at
    }));
  } catch (error) {
    console.error('Failed to fetch standards:', error);
    throw new Error('Failed to load standards. Please try again.');
  }
};
```

**Update `createStandard()` function (Lines 296-311):**

```typescript
// BEFORE:
export const createStandard = async (
  standard: Omit<Standard, 'id' | 'lastUpdated' | 'versions'> & { aspectId: string, orderIndex: number }
): Promise<Standard> => {
  try {
    const payload = {
      standard_id: standard.code,
      standard_name: standard.title,
      aspect_id: standard.aspectId,
      description: standard.description || ''
    };
    const response = await apiClient.post('/api/standards', payload);
    return transformStandardResponse(response.data);
  } catch (error: any) {
    console.error('Failed to create standard:', error);
    const errorMsg = error.response?.data?.detail || 'Failed to create standard.';
    throw new Error(errorMsg);
  }
};

// AFTER (v3.0):
export const createStandard = async (
  standard: Omit<MatStandard, 'mat_standard_id' | 'mat_id' | 'version_number' | 'version_id' | 'created_at' | 'updated_at'> & { 
    change_reason: string  // REQUIRED for versioning
  }
): Promise<MatStandard> => {
  try {
    const payload = {
      mat_aspect_id: standard.mat_aspect_id,
      standard_code: standard.standard_code,
      standard_name: standard.standard_name,
      standard_description: standard.standard_description,
      sort_order: standard.sort_order,
      source_standard_id: standard.source_standard_id,  // For copy-on-write
      change_reason: standard.change_reason  // REQUIRED
    };
    const response = await apiClient.post('/api/standards', payload);
    
    return {
      mat_standard_id: response.data.mat_standard_id,
      mat_id: response.data.mat_id,
      mat_aspect_id: response.data.mat_aspect_id,
      standard_code: response.data.standard_code,
      standard_name: response.data.standard_name,
      standard_description: response.data.standard_description,
      sort_order: response.data.sort_order,
      source_standard_id: response.data.source_standard_id,
      is_custom: response.data.is_custom,
      is_modified: response.data.is_modified,
      version_number: response.data.version_number,
      version_id: response.data.version_id,
      aspect_code: response.data.aspect_code,
      aspect_name: response.data.aspect_name,
      is_active: response.data.is_active ?? true,
      created_at: response.data.created_at,
      updated_at: response.data.updated_at
    };
  } catch (error: any) {
    console.error('Failed to create standard:', error);
    const errorMsg = error.response?.data?.detail || 'Failed to create standard.';
    throw new Error(errorMsg);
  }
};
```

**Update `updateStandardDefinition()` function (Lines 313-333):**

```typescript
// BEFORE:
export const updateStandardDefinition = async (standard: Standard): Promise<Standard> => {
  try {
    const payload: any = {
      standard_name: standard.title,
      description: standard.description || ''
    };
    
    if (standard.aspectId) {
      payload.aspect_id = standard.aspectId;
    }
    
    const response = await apiClient.put(`/api/standards/${standard.id}`, payload);
    return transformStandardResponse(response.data);
  } catch (error: any) {
    console.error('Failed to update standard:', error);
    const errorMsg = error.response?.data?.detail || 'Failed to update standard.';
    throw new Error(errorMsg);
  }
};

// AFTER (v3.0):
export const updateStandardDefinition = async (
  standard: MatStandard & { change_reason: string }  // REQUIRED for versioning
): Promise<MatStandard> => {
  try {
    const payload = {
      standard_name: standard.standard_name,
      standard_description: standard.standard_description,
      change_reason: standard.change_reason  // REQUIRED - creates new version
    };
    
    const response = await apiClient.put(`/api/standards/${standard.mat_standard_id}`, payload);
    
    return {
      mat_standard_id: response.data.mat_standard_id,
      mat_id: response.data.mat_id,
      mat_aspect_id: response.data.mat_aspect_id,
      standard_code: response.data.standard_code,
      standard_name: response.data.standard_name,
      standard_description: response.data.standard_description,
      sort_order: response.data.sort_order,
      source_standard_id: response.data.source_standard_id,
      is_custom: response.data.is_custom,
      is_modified: response.data.is_modified,
      version_number: response.data.version_number,  // Incremented
      version_id: response.data.version_id,          // New version ID
      aspect_code: response.data.aspect_code,
      aspect_name: response.data.aspect_name,
      is_active: response.data.is_active ?? true,
      created_at: response.data.created_at,
      updated_at: response.data.updated_at
    };
  } catch (error: any) {
    console.error('Failed to update standard:', error);
    const errorMsg = error.response?.data?.detail || 'Failed to update standard.';
    throw new Error(errorMsg);
  }
};
```

**ADD NEW: `getStandardVersions()` function:**

```typescript
// NEW FUNCTION - Get version history for a standard
export const getStandardVersions = async (matStandardId: string): Promise<StandardVersion[]> => {
  try {
    const response = await apiClient.get(`/api/standards/${matStandardId}/versions`);
    return response.data.map((v: any) => ({
      version_id: v.version_id,
      mat_standard_id: v.mat_standard_id,
      version_number: v.version_number,
      standard_code: v.standard_code,
      standard_name: v.standard_name,
      standard_description: v.standard_description,
      effective_from: v.effective_from,
      effective_to: v.effective_to,
      created_by_user_id: v.created_by_user_id,
      change_reason: v.change_reason,
      created_at: v.created_at
    }));
  } catch (error: any) {
    console.error('Failed to fetch standard versions:', error);
    throw new Error('Failed to load version history.');
  }
};
```

---

## Phase 4: Data Transformers

### File: `src/lib/data-transformers.ts`

Check if this file exists. If it does, update the transformer functions to handle v3.0 field names.

**Example transformer update:**

```typescript
// BEFORE:
export function transformStandardResponse(apiStandard: any): Standard {
  return {
    id: apiStandard.standard_id,
    code: apiStandard.code,
    title: apiStandard.standard_name,
    description: apiStandard.description,
    rating: apiStandard.rating,
    evidence: apiStandard.evidence_comments,
    aspectId: apiStandard.aspect_id
  };
}

// AFTER (v3.0):
export function transformStandardResponse(apiStandard: any): MatStandard {
  return {
    mat_standard_id: apiStandard.mat_standard_id,
    mat_id: apiStandard.mat_id,
    mat_aspect_id: apiStandard.mat_aspect_id,
    standard_code: apiStandard.standard_code,
    standard_name: apiStandard.standard_name,
    standard_description: apiStandard.standard_description,
    sort_order: apiStandard.sort_order ?? 0,
    source_standard_id: apiStandard.source_standard_id,
    is_custom: apiStandard.is_custom,
    is_modified: apiStandard.is_modified,
    version_number: apiStandard.version_number,
    version_id: apiStandard.version_id,
    aspect_code: apiStandard.aspect_code,
    aspect_name: apiStandard.aspect_name,
    is_active: apiStandard.is_active ?? true,
    created_at: apiStandard.created_at,
    updated_at: apiStandard.updated_at,
    // Assessment-specific fields (if present)
    rating: apiStandard.rating,
    evidence_comments: apiStandard.evidence_comments,
    submitted_at: apiStandard.submitted_at,
    submitted_by: apiStandard.submitted_by
  };
}
```

---

## Phase 5: UI Components

### Component Updates Needed

1. **Standards Management** (`src/components/admin/standards/`)
   - Update all references from `aspect_id` → `mat_aspect_id`
   - Update all references from `standard_id` → `mat_standard_id`
   - Add `change_reason` input field for standard edits
   - Add version history viewer

2. **Assessment Detail** (`src/pages/AssessmentDetail.tsx`)
   - Update standard ID references
   - Display version information
   - Show `is_custom` and `is_modified` badges

3. **User Profile/Header**
   - Display `first_name` and `last_name` instead of `name`
   - Show MAT name (if available)
   - Display `role_title` instead of `role`

### Example: Add Version Badge Component

```typescript
// src/components/ui/version-badge.tsx
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

interface VersionBadgeProps {
  versionNumber: number;
  isModified?: boolean;
}

export function VersionBadge({ versionNumber, isModified }: VersionBadgeProps) {
  return (
    <Badge variant="outline" className="text-xs">
      <Clock className="h-3 w-3 mr-1" />
      v{versionNumber}
      {isModified && <span className="ml-1 text-amber-600">●</span>}
    </Badge>
  );
}
```

### Example: Add Custom/Modified Indicator

```typescript
// src/components/ui/custom-badge.tsx
import { Badge } from '@/components/ui/badge';
import { Sparkles, Edit } from 'lucide-react';

interface CustomBadgeProps {
  isCustom: boolean;
  isModified: boolean;
}

export function CustomBadge({ isCustom, isModified }: CustomBadgeProps) {
  if (isCustom) {
    return (
      <Badge variant="outline" className="text-xs bg-teal-50 border-teal-200">
        <Sparkles className="h-3 w-3 mr-1" />
        Custom
      </Badge>
    );
  }
  
  if (isModified) {
    return (
      <Badge variant="outline" className="text-xs bg-amber-50 border-amber-200">
        <Edit className="h-3 w-3 mr-1" />
        Modified
      </Badge>
    );
  }
  
  return null;
}
```

---

## Phase 6: Testing

### Manual Testing Checklist

1. **Authentication Flow**
   ```bash
   # Test magic link login
   # Verify JWT token contains mat_id, school_id, role_title
   # Check user profile displays correct data
   ```

2. **Aspects Management**
   ```bash
   # List aspects - verify mat_aspect_id present
   # Create new aspect - verify is_custom = true
   # Edit aspect - verify is_modified flag
   # Delete aspect - verify soft delete (is_active = false)
   ```

3. **Standards Management**
   ```bash
   # List standards - verify mat_standard_id, version info
   # Create standard - require change_reason
   # Edit standard - verify new version created
   # View version history
   # Delete standard - verify soft delete
   ```

4. **MAT Isolation**
   ```bash
   # Test with two users from different MATs
   # Verify User A cannot see User B's aspects/standards
   # Test API returns 403 for cross-tenant access
   ```

### Automated Test Examples

```typescript
// tests/services/auth-service.test.ts
describe('AuthService - v3.0', () => {
  it('should map user correctly from v3.0 API', async () => {
    const mockResponse = {
      access_token: 'jwt-token',
      user: {
        user_id: 'user-123',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role_title: 'Teacher',
        mat_id: 'mat-456',
        school_id: 'school-789'
      }
    };
    
    // Test implementation...
    const user = mapUserFromAPI(mockResponse.user);
    
    expect(user.user_id).toBe('user-123');
    expect(user.mat_id).toBe('mat-456');
    expect(user.role_title).toBe('Teacher');
  });
});
```

---

## Common Pitfalls & Solutions

### Pitfall 1: Mixing Old and New Field Names

**Problem:**
```typescript
// Mixing old and new field names
const aspect = {
  mat_aspect_id: '123',
  name: 'Education',  // ❌ Should be aspect_name
  code: 'EDU'         // ❌ Should be aspect_code
};
```

**Solution:**
Always use v3.0 field names consistently throughout the codebase.

### Pitfall 2: Forgetting change_reason for Standard Updates

**Problem:**
```typescript
// Missing change_reason
await updateStandard({
  mat_standard_id: '123',
  standard_name: 'Updated Name'
  // ❌ Missing change_reason
});
```

**Solution:**
Always require `change_reason` for standard updates (creates new version).

### Pitfall 3: Not Handling Soft Deletes

**Problem:**
```typescript
// Not filtering out soft-deleted items
const aspects = allAspects;  // ❌ May include is_active = false
```

**Solution:**
Backend automatically filters by `is_active = true`, but verify in UI.

---

## Rollback Procedure

If critical issues are discovered during migration:

1. **Immediate (< 5 min):**
   ```bash
   git revert <migration-commit-hash>
   git push origin main
   ```

2. **Short-term (< 1 hour):**
   - Create compatibility layer that translates v3.0 to v2.x format
   - Deploy compatibility layer as hotfix

3. **Long-term (1+ day):**
   - Request backend team provide v2.x compatibility endpoints
   - Gradual migration with feature flags

---

## Success Criteria

Migration is complete when:

- ✅ All TypeScript compilation errors resolved
- ✅ No runtime errors in console
- ✅ Authentication flow works end-to-end
- ✅ Aspects CRUD operations work
- ✅ Standards CRUD operations work with versioning
- ✅ Assessments load and save correctly
- ✅ MAT isolation verified (no cross-tenant data leaks)
- ✅ UI displays version and customization indicators
- ✅ All automated tests pass
- ✅ Manual QA completed

---

## Support Resources

- **Frontend Migration Guide:** `/docs/api/FRONTEND_MIGRATION_GUIDE.md`
- **Migration Analysis:** `/docs/MIGRATION_ANALYSIS.md`
- **API Documentation:** `/API_DOCUMENTATION.md`
- **Backend Team Contact:** [Insert contact info]

---

**Document Version:** 1.0  
**Last Updated:** December 22, 2025  
**Maintained By:** Frontend Team


