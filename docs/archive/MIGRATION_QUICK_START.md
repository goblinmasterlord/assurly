# API v3.0 Migration - Developer Quick Start

**Purpose:** Get started with migration in 5 minutes  
**Date:** December 22, 2025

---

## Before You Start

### ✅ Pre-Migration Checklist

- [ ] Read `/docs/api/FRONTEND_MIGRATION_GUIDE.md` (provided by backend)
- [ ] Review `/docs/MIGRATION_EXECUTIVE_SUMMARY.md` (business context)
- [ ] Access to staging environment with v3.0 API
- [ ] Git branch created: `git checkout -b feature/api-v3-migration`
- [ ] Backup current working state: `git stash`

### 📚 Quick Reference Documents

| Document | Purpose | When to Use |
|----------|---------|-------------|
| `MIGRATION_ANALYSIS.md` | Detailed analysis of changes | Planning & understanding scope |
| `MIGRATION_IMPLEMENTATION_GUIDE.md` | Step-by-step code changes | During development |
| `FIELD_MAPPING_REFERENCE.md` | Field name lookup table | While coding |
| `MIGRATION_EXECUTIVE_SUMMARY.md` | High-level overview | For stakeholders |

---

## Phase 1: Type Definitions (2 hours)

### Step 1.1: Update `src/types/auth.ts`

```bash
# Open file
code src/types/auth.ts
```

**Replace entire `User` interface:**

```typescript
export interface User {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role_title: string;
  mat_id: string;
  school_id: string | null;
  created_at?: string;
  updated_at?: string;
}
```

### Step 1.2: Update `src/types/assessment.ts`

```bash
# Open file
code src/types/assessment.ts
```

**Add new types at end of file:**

```typescript
// Copy from MIGRATION_IMPLEMENTATION_GUIDE.md Phase 1
// - MatAspect interface
// - MatStandard interface
// - StandardVersion interface
// - Type aliases: Aspect = MatAspect, Standard = MatStandard
```

### ✅ Checkpoint 1: TypeScript Compilation

```bash
npm run build
# Should have compilation errors in auth/assessment services - that's expected!
```

---

## Phase 2: Authentication (4 hours)

### Step 2.1: Update `src/services/auth-service.ts`

**Find and replace (2 locations):**

```bash
# Line ~65 in verifyToken()
# Line ~110 in getCurrentSession()
```

**Search for:**
```typescript
const user: User = {
  id: user.user_id || user.id || 'unknown',
```

**Replace with:** (see MIGRATION_IMPLEMENTATION_GUIDE.md Phase 2)

### Step 2.2: Update User Display Components

**Search for user.name usage:**

```bash
grep -r "user\.name" src/
```

**Replace with:**
```typescript
`${user.first_name} ${user.last_name}`
```

**Search for user.role usage:**

```bash
grep -r "user\.role" src/
```

**Replace with:**
```typescript
user.role_title
```

### ✅ Checkpoint 2: Authentication Test

```bash
# Start dev server
npm run dev

# Test login flow
# 1. Navigate to /auth/login
# 2. Request magic link
# 3. Verify user data in console
# Expected: user.mat_id should be present
```

---

## Phase 3: API Services (6 hours)

### Step 3.1: Update `src/services/assessment-service.ts`

**Functions to update (in order):**

1. ✅ `getAspects()` - Lines 227-242
2. ✅ `createAspect()` - Lines 244-264
3. ✅ `updateAspect()` - Lines 266-283
4. ✅ `getStandards()` - Lines 107-120
5. ✅ `createStandard()` - Lines 296-311
6. ✅ `updateStandardDefinition()` - Lines 313-333

**For each function:**
- Open `MIGRATION_IMPLEMENTATION_GUIDE.md` Phase 3
- Find the function
- Copy the "AFTER (v3.0)" version
- Replace the old version

### Step 3.2: Add New Versioning Function

**Add to end of file:**

```typescript
export const getStandardVersions = async (matStandardId: string): Promise<StandardVersion[]> => {
  // Copy from MIGRATION_IMPLEMENTATION_GUIDE.md Phase 3
};
```

### ✅ Checkpoint 3: API Service Test

```bash
# Test in browser console after login:
import { getAspects, getStandards } from '@/services/assessment-service';

// Should return v3.0 format data
const aspects = await getAspects();
console.log(aspects[0]);  // Check for mat_aspect_id

const standards = await getStandards();
console.log(standards[0]);  // Check for mat_standard_id, version_number
```

---

## Phase 4: Data Transformers (4 hours)

### Step 4.1: Check if `src/lib/data-transformers.ts` exists

```bash
ls src/lib/data-transformers.ts
```

**If exists:** Update transformer functions (see MIGRATION_IMPLEMENTATION_GUIDE.md Phase 4)

**If not exists:** Transformations are inline in assessment-service.ts (already updated in Phase 3)

### ✅ Checkpoint 4: Data Display Test

```bash
# Navigate to /app/standards-management
# Verify aspects list loads
# Verify standards list loads
# Check browser console for errors
```

---

## Phase 5: UI Components (8 hours)

### Step 5.1: Update Standards Management Components

**Files to update:**

```bash
src/components/admin/standards/*.tsx
```

**Changes needed:**
- Replace `aspect.id` → `aspect.mat_aspect_id`
- Replace `standard.id` → `standard.mat_standard_id`
- Replace `standard.title` → `standard.standard_name`
- Add `change_reason` field to edit forms

### Step 5.2: Add New UI Components

**Create version badge:**

```bash
code src/components/ui/version-badge.tsx
# Copy from MIGRATION_IMPLEMENTATION_GUIDE.md Phase 5
```

**Create custom badge:**

```bash
code src/components/ui/custom-badge.tsx
# Copy from MIGRATION_IMPLEMENTATION_GUIDE.md Phase 5
```

### Step 5.3: Update Assessment Components

**Files to check:**

```bash
src/pages/AssessmentDetail.tsx
src/pages/Assessments.tsx
src/components/SchoolPerformanceView.tsx
```

**Changes needed:**
- Update standard ID references
- Add version display
- Add customization badges

### ✅ Checkpoint 5: Full UI Test

```bash
# Test each feature:
# 1. Standards Management - Create/Edit/Delete/Reorder
# 2. Assessments List - Load and filter
# 3. Assessment Detail - Complete assessment
# 4. User profile - Display name and role
```

---

## Phase 6: Testing (8 hours)

### Step 6.1: Manual Testing

**Use this checklist:**

```markdown
Authentication
- [ ] Login with magic link
- [ ] User profile shows first_name, last_name, role_title
- [ ] User profile shows MAT name
- [ ] Session persists after refresh

Aspects
- [ ] List aspects for user's MAT
- [ ] Create new aspect
- [ ] Edit aspect
- [ ] Delete aspect (soft delete)
- [ ] Verify is_custom badge displays

Standards
- [ ] List standards for aspect
- [ ] Create standard with change_reason
- [ ] Edit standard (requires change_reason)
- [ ] View version history
- [ ] Delete standard
- [ ] Reorder standards
- [ ] Verify version number displays

Assessments
- [ ] Load assessment list
- [ ] Filter by school/category/term
- [ ] Open assessment detail
- [ ] Complete assessment
- [ ] Submit assessment
- [ ] View completed assessment

MAT Isolation
- [ ] User can only see their MAT's data
- [ ] Attempting to access other MAT's data returns 403
```

### Step 6.2: Browser Console Check

```bash
# In browser console, check for:
# ✅ No JavaScript errors
# ✅ No 404 errors in Network tab
# ✅ API responses have correct field names
# ✅ No warnings about missing fields
```

### Step 6.3: TypeScript Compilation

```bash
# Should have zero errors
npm run build

# Check for any remaining issues
npx tsc --noEmit
```

### ✅ Checkpoint 6: Production Build Test

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Test full flow in production mode
```

---

## Common Issues & Solutions

### Issue 1: "mat_aspect_id is undefined"

**Cause:** Still using old field name somewhere

**Solution:**
```bash
# Find all references
grep -r "aspect\.id" src/
grep -r "aspect_id" src/

# Should only find mat_aspect_id references
```

### Issue 2: "change_reason is required"

**Cause:** Forgot to add change_reason to standard create/update

**Solution:**
```typescript
// Add to form
<Input 
  name="change_reason" 
  placeholder="Reason for change"
  required 
/>

// Add to payload
await updateStandard({
  ...standard,
  change_reason: formData.change_reason
});
```

### Issue 3: "User name is undefined"

**Cause:** Using `user.name` instead of `user.first_name`

**Solution:**
```typescript
// Replace
user.name

// With
`${user.first_name} ${user.last_name}`
```

### Issue 4: "403 Forbidden on API call"

**Cause:** Trying to access resource from different MAT

**Solution:**
- Check that user is authenticated
- Verify user's `mat_id` in JWT token
- Ensure not hardcoding IDs from different MAT
- Check backend logs for tenant isolation violation

---

## Git Workflow

### During Development

```bash
# Commit frequently
git add .
git commit -m "feat: update user type definition for v3.0"

# Phase 1 complete
git commit -m "feat: migrate type definitions to v3.0"

# Phase 2 complete
git commit -m "feat: migrate authentication layer to v3.0"

# etc...
```

### Before Merge

```bash
# Run full test suite
npm run build
npm run test  # if tests exist

# Create PR
git push origin feature/api-v3-migration
# Open PR in GitHub/GitLab
```

### If Need to Rollback

```bash
# Rollback last commit
git revert HEAD

# Rollback to specific commit
git revert <commit-hash>

# Nuclear option - reset to main
git reset --hard origin/main
```

---

## Time Tracking

Use this to track your progress:

| Phase | Estimated | Actual | Status |
|-------|-----------|--------|--------|
| 1. Type Definitions | 2h | ___ | ⏳ |
| 2. Authentication | 4h | ___ | ⏳ |
| 3. API Services | 6h | ___ | ⏳ |
| 4. Data Transformers | 4h | ___ | ⏳ |
| 5. UI Components | 8h | ___ | ⏳ |
| 6. Testing | 8h | ___ | ⏳ |
| **Total** | **32h** | ___ | ⏳ |

---

## Help & Support

### When You're Stuck

1. **Check documentation:**
   - `FIELD_MAPPING_REFERENCE.md` - field name lookup
   - `MIGRATION_IMPLEMENTATION_GUIDE.md` - detailed code examples

2. **Search codebase:**
   ```bash
   # Find similar patterns
   grep -r "mat_aspect_id" src/
   ```

3. **Check browser console:**
   - Look for specific error messages
   - Check Network tab for API responses

4. **Ask for help:**
   - Team Slack channel
   - Backend team for API questions
   - Code review from senior dev

### Useful Commands

```bash
# Find all TypeScript files with compilation errors
npx tsc --noEmit | grep "error TS"

# Find all uses of old field names
grep -r "\.role[^_]" src/          # Find user.role (not role_title)
grep -r "aspect\.id[^:]" src/      # Find aspect.id (not mat_aspect_id)
grep -r "standard\.title" src/     # Find standard.title (not standard_name)

# Count remaining TODOs
grep -r "TODO.*v3" src/ | wc -l
```

---

## Success Criteria

You're done when:

- ✅ All TypeScript compilation errors resolved
- ✅ `npm run build` succeeds
- ✅ All manual tests pass
- ✅ No console errors in browser
- ✅ User can complete full assessment flow
- ✅ MAT isolation verified (tested with 2+ MATs)
- ✅ Code review approved
- ✅ PR merged to main

---

## Next Steps After Migration

1. **Monitor production:**
   - Watch error logs
   - Monitor API response times
   - Check user feedback

2. **Document lessons learned:**
   - Update this guide with issues encountered
   - Add to team knowledge base

3. **Plan enhancements:**
   - Version history UI
   - Copy-from-source UI
   - Enhanced customization features

---

**Good luck! You've got this! 🚀**

---

**Document Version:** 1.0  
**Last Updated:** December 22, 2025  
**Maintained By:** Frontend Team


