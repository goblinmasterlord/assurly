# Schema Analysis: Actual vs Frontend Expectations

**Date:** Dec 22, 2025  
**Status:** 🔴 **CRITICAL MISMATCH FOUND**

## Problem Summary

The frontend was migrated to expect **MAT-scoped UUID-based** aspect/standard IDs, but the **actual backend** uses **simple string-based** IDs for assessments.

---

## Actual Backend Schema (from ASSESSMENT_API_SPECIFICATION.md)

### Assessments Table
```sql
CREATE TABLE assessments (
    id VARCHAR(36) PRIMARY KEY,
    school_id VARCHAR(36) NOT NULL,
    standard_id VARCHAR(36) NOT NULL,      -- UUID reference to standards table
    term_id VARCHAR(10) NOT NULL,          -- "T1", "T2", "T3"
    academic_year VARCHAR(20) NOT NULL,    -- "2024-2025"
    rating INT DEFAULT 0,
    ...
);
```

### Standards Table
```sql
CREATE TABLE standards (
    standard_id VARCHAR(36) PRIMARY KEY,           -- UUID
    aspect_id VARCHAR(10) NOT NULL,                -- Simple string: "edu", "gov", "safe"
    standard_code VARCHAR(50) NOT NULL,
    standard_name VARCHAR(200) NOT NULL,
    ...
);
```

### Aspects Table
```sql
CREATE TABLE aspects (
    aspect_id VARCHAR(10) PRIMARY KEY,             -- Simple string: "edu", "gov", "safe"
    aspect_code VARCHAR(50) NOT NULL,              -- "EDU", "GOV", "SAFE"
    aspect_name VARCHAR(200) NOT NULL,             -- "Education", "Governance"
    ...
);
```

### Assessment API Response
```json
{
  "assessment_id": "school-uuid-edu-T1-2024-2025",
  "school_id": "school-uuid",
  "aspect_id": "edu",                    // ← Simple string
  "aspect_code": "EDU",
  "aspect_name": "Education",
  "term_id": "T1",
  "academic_year": "2024-2025",
  "standards": [
    {
      "standard_id": "uuid",             // ← UUID, but NOT mat_standard_id
      "standard_name": "...",
      "area_id": "edu",                  // ← Simple string
      "rating": 3
    }
  ]
}
```

---

## Frontend Current Expectations (After Migration)

### Types (types/assessment.ts)
```typescript
export interface MatAspect {
  mat_aspect_id: string;       // ← Expects UUID
  mat_id: string;
  aspect_code: string;
  aspect_name: string;
  ...
}

export interface MatStandard {
  mat_standard_id: string;     // ← Expects UUID
  mat_aspect_id: string;       // ← Expects UUID
  standard_code: string;
  standard_name: string;
  ...
}

export type Aspect = MatAspect;
export type Standard = MatStandard;
```

### Data Transformers
Currently expect backend to return:
- `mat_aspect_id` (UUID)
- `mat_standard_id` (UUID)
- `mat_id` on all records

---

## The Disconnect

### Two Different Schemas?

**Option A:** Backend has TWO separate schemas:
1. **Assessment Schema** - Uses simple `aspect_id` ("edu", "gov") and `standard_id` (UUID)
2. **Standards Management Schema** - Uses MAT-scoped `mat_aspect_id` and `mat_standard_id` (UUIDs)

**Option B:** Backend uses ONE schema:
- Simple `aspect_id` and `standard_id` everywhere
- Frontend was incorrectly migrated to expect MAT-scoped IDs

---

## Questions for Backend

### 1. Aspects API (`/api/aspects`)
What does `GET /api/aspects` actually return?

**Expected by Frontend (current):**
```json
{
  "mat_aspect_id": "uuid",
  "mat_id": "OLT",
  "aspect_code": "EDU",
  "aspect_name": "Education",
  "is_custom": false,
  "standards_count": 41
}
```

**OR Actual:**
```json
{
  "aspect_id": "edu",
  "aspect_code": "EDU",
  "aspect_name": "Education"
}
```

### 2. Standards API (`/api/standards`)
What does `GET /api/standards` actually return?

**Expected by Frontend (current):**
```json
{
  "mat_standard_id": "uuid",
  "mat_aspect_id": "uuid",
  "mat_id": "OLT",
  "standard_code": "ES1",
  "standard_name": "Quality of Education",
  "version_number": 1,
  "is_custom": false
}
```

**OR Actual:**
```json
{
  "standard_id": "uuid",
  "aspect_id": "edu",
  "standard_code": "ES1",
  "standard_name": "Quality of Education"
}
```

### 3. Are Aspects/Standards MAT-scoped?
- Does each MAT have its own copy of aspects/standards with UUID IDs?
- OR is there one global set of aspects (with simple IDs like "edu") shared across all MATs?

---

## Impact on Frontend

### If Backend Uses Simple IDs Everywhere

**Changes Needed:**
1. ✅ Assessment transformers - Already compatible (just need field mapping)
2. ❌ Aspects management - Currently expects MAT-scoped IDs
3. ❌ Standards management - Currently expects MAT-scoped IDs
4. ❌ Type definitions - Need to support both schemas or switch to simple schema

### If Backend Uses Two Schemas

**Changes Needed:**
1. Keep MAT-scoped types for standards management
2. Add separate types for assessment context
3. Update transformers to handle both
4. More complex, but doable

---

## Recommended Actions

### Immediate (User to Confirm)

1. **Test `/api/aspects` endpoint** - What fields does it return?
   ```bash
   curl -H "Authorization: Bearer $TOKEN" https://your-api.com/api/aspects
   ```

2. **Test `/api/standards` endpoint** - What fields does it return?
   ```bash
   curl -H "Authorization: Bearer $TOKEN" https://your-api.com/api/standards
   ```

3. **Confirm architecture**:
   - Are aspects/standards MAT-scoped (each MAT has own copy)?
   - OR globally shared (one set of aspects for all MATs)?

### Once Confirmed

**If Simple Schema:**
- Revert frontend migration to simple IDs
- Update types to use `aspect_id`, `standard_id`
- Simplify transformers

**If MAT-Scoped Schema:**
- Keep current frontend types
- Update assessment transformers to map `aspect_id` → `mat_aspect_id`
- Add field mapping layer

---

## Current State Summary

| Component | Schema Expected | Schema Actual | Status |
|-----------|----------------|---------------|---------|
| Assessments API | Mixed (was migrated to MAT) | Simple IDs | ❌ Mismatch |
| Aspects Management | MAT-scoped UUIDs | Unknown | ⚠️ Need to test |
| Standards Management | MAT-scoped UUIDs | Unknown | ⚠️ Need to test |
| Frontend Types | MAT-scoped | N/A | ⚠️ May need revert |

---

## Next Steps

1. **YOU:** Test `/api/aspects` and `/api/standards` endpoints - send me the response
2. **YOU:** Confirm if aspects/standards are MAT-scoped or global
3. **ME:** Update frontend to match actual backend schema
4. **ME:** Fix data transformers and types
5. **BOTH:** Test end-to-end

---

**Critical Question:** When you tested aspects/standards management and said "don't work properly", what specifically happened? Did the API return data but the UI didn't display it? Or did the API call fail?


