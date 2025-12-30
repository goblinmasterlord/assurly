# v4 Testing Checklist

**Status:** Ready for Testing  
**Last Updated:** Dec 30, 2025

Use this checklist to systematically test all v4 functionality.

---

## 🔐 Authentication

### Magic Link Flow
- [ ] Navigate to login page
- [ ] Enter email address
- [ ] Verify "Magic link sent" message appears
- [ ] Check email for magic link
- [ ] Click magic link
- [ ] Verify redirect to app with authentication
- [ ] Check user profile displays correct `full_name`
- [ ] Verify `mat_name` displays if available

### Session Management
- [ ] Refresh page - should stay logged in
- [ ] Open new tab - should be logged in
- [ ] Check `/api/auth/me` returns correct user data
- [ ] Logout works correctly
- [ ] After logout, redirects to login

**Console Commands to Test:**
```javascript
// Check current user
const response = await fetch('/api/auth/me', {
  headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
});
const user = await response.json();
console.log('Current user:', user);
// Should have: user_id, full_name, mat_id, mat_name, school_id, school_name
```

---

## 📊 Assessment Groups (List View)

### Basic Listing
- [ ] Navigate to assessments page
- [ ] Groups display correctly
- [ ] Each group shows: school name, aspect name, term, status
- [ ] Progress bars show correct completion
- [ ] Status badges show correct state (not_started/in_progress/completed)

### Filtering
- [ ] Filter by school - works
- [ ] Filter by aspect - works
- [ ] Filter by term - works
- [ ] Filter by status - works
- [ ] Multiple filters work together
- [ ] Clear filters works

### Group Details
- [ ] Click on group card opens detail view
- [ ] Group ID format: `{school}-{aspect}-{term}` (e.g., `cedar-park-primary-EDU-T1-2024-25`)
- [ ] Displays correct school name
- [ ] Displays correct aspect name
- [ ] Shows completion stats

**Console Commands to Test:**
```javascript
// Fetch all assessment groups
const groups = await assessmentService.getAssessments();
console.log('Assessment groups:', groups);

// Filter by school
const schoolGroups = await assessmentService.getAssessments({
  school_id: 'cedar-park-primary'
});
console.log('School groups:', schoolGroups);

// Filter by aspect and term
const filtered = await assessmentService.getAssessments({
  aspect_code: 'EDU',
  term_id: 'T1-2024-25'
});
console.log('Filtered:', filtered);
```

---

## 📝 Assessment Form (By Aspect)

### Form Loading
- [ ] Open assessment form for a group
- [ ] All standards for the aspect display
- [ ] Standards show in correct order (sort_order)
- [ ] Each standard shows: code, name, description
- [ ] Existing ratings display correctly
- [ ] Evidence comments display correctly

### Rating Standards
- [ ] Can select rating (1-4) for each standard
- [ ] Can enter evidence comments
- [ ] Can leave rating blank
- [ ] Form validation works
- [ ] Save button enabled when changes made

### Saving
- [ ] Save single standard - works
- [ ] Save all standards (bulk) - works
- [ ] Success message appears
- [ ] Data persists after refresh
- [ ] Completion progress updates
- [ ] Status updates correctly

**Console Commands to Test:**
```javascript
// Load form data
const formData = await assessmentService.getAssessmentsByAspect(
  'EDU',                    // aspect_code
  'cedar-park-primary',     // school_id
  'T1-2024-25'             // term_id
);
console.log('Form data:', formData);
console.log('Standards:', formData.standards);

// Update a standard
await assessmentService.updateAssessment(
  'cedar-park-primary-ES1-T1-2024-25',  // assessment_id
  4,                                     // rating
  'Excellent work'                       // evidence_comments
);

// Bulk update
await assessmentService.bulkUpdateAssessments([
  {
    assessment_id: 'cedar-park-primary-ES1-T1-2024-25',
    rating: 4,
    evidence_comments: 'Excellent'
  },
  {
    assessment_id: 'cedar-park-primary-ES2-T1-2024-25',
    rating: 3,
    evidence_comments: 'Good'
  }
]);
```

---

## 🎯 Standards Management

### Aspects Tab

#### Listing
- [ ] All aspects display
- [ ] Shows aspect code, name, description
- [ ] Shows standards count
- [ ] Custom aspects show badge
- [ ] Sort order correct

#### Create Aspect
- [ ] Click "Create Aspect" button
- [ ] Modal opens
- [ ] Enter aspect code (e.g., "CUSTOM")
- [ ] Enter aspect name
- [ ] Enter description
- [ ] Save - aspect appears in list
- [ ] Standards count shows 0

#### Edit Aspect
- [ ] Click edit on aspect
- [ ] Modal opens with current data
- [ ] Change name/description
- [ ] Save - changes persist
- [ ] Aspect updates in list

#### Delete Aspect
- [ ] Click delete on aspect (with no standards)
- [ ] Confirmation modal appears
- [ ] Confirm delete
- [ ] Aspect removed from list
- [ ] Try deleting aspect with standards - should show error

### Standards Tab

#### Listing
- [ ] Select an aspect from sidebar
- [ ] Standards for that aspect display
- [ ] Shows standard code, name, version
- [ ] Custom/modified badges show correctly
- [ ] Sort order correct

#### Create Standard
- [ ] Click "Create Standard"
- [ ] Modal opens
- [ ] Select aspect
- [ ] Enter standard code (e.g., "ES7")
- [ ] Enter name and description
- [ ] Save - standard appears in list
- [ ] Version shows as v1
- [ ] Aspect standards count increases

#### Edit Standard
- [ ] Click edit on standard
- [ ] Modal opens with current data
- [ ] Change name/description
- [ ] Enter change reason
- [ ] Save - new version created
- [ ] Version number increments
- [ ] "Modified" badge appears

#### Version History
- [ ] Click history icon on standard
- [ ] Modal shows all versions
- [ ] Each version shows: number, date, reason
- [ ] Latest version highlighted
- [ ] Can view details of each version

#### Drag & Drop Reorder
- [ ] Drag a standard up/down in list
- [ ] Drop in new position
- [ ] Order updates immediately (optimistic)
- [ ] Refresh page - order persists
- [ ] Other standards shift correctly

#### Delete Standard
- [ ] Click delete on standard (not in use)
- [ ] Confirmation modal appears
- [ ] Confirm delete
- [ ] Standard removed from list
- [ ] Aspect standards count decreases
- [ ] Try deleting in-use standard - should show error

**Console Commands to Test:**
```javascript
// List aspects
const aspects = await assessmentService.getAspects();
console.log('Aspects:', aspects);

// List standards for aspect
const standards = await assessmentService.getStandards('EDU');
console.log('EDU Standards:', standards);

// Get standard with history
const standard = await assessmentService.getStandardById('OLT-ES1');
console.log('Standard detail:', standard);
console.log('Version history:', standard.version_history);

// Create standard
const newStandard = await assessmentService.createStandard({
  mat_aspect_id: 'OLT-EDU',
  standard_code: 'ES7',
  standard_name: 'Test Standard',
  standard_description: 'Test description',
  sort_order: 7
});
console.log('Created:', newStandard);

// Update standard (creates new version)
await assessmentService.updateStandard('OLT-ES1', {
  standard_name: 'Updated Name',
  standard_description: 'Updated description',
  change_reason: 'Testing v4 migration'
});

// Reorder
await assessmentService.reorderStandards([
  { mat_standard_id: 'OLT-ES1', sort_order: 0 },
  { mat_standard_id: 'OLT-ES2', sort_order: 1 }
]);
```

---

## 🏫 Schools & Terms

### Schools
- [ ] Schools list loads
- [ ] Shows all schools for MAT
- [ ] Central office shows if enabled
- [ ] Can filter assessments by school

### Terms
- [ ] Terms list loads
- [ ] Shows current term highlighted
- [ ] Shows all terms for year
- [ ] Term format: `T1-2024-25`
- [ ] Can filter by academic year

**Console Commands to Test:**
```javascript
// Get schools
const schools = await assessmentService.getSchools();
console.log('Schools:', schools);

// Include central office
const allSchools = await assessmentService.getSchools(true);
console.log('All schools:', allSchools);

// Get terms
const terms = await assessmentService.getTerms();
console.log('Terms:', terms);

// Find current term
const currentTerm = terms.find(t => t.is_current);
console.log('Current term:', currentTerm);
```

---

## 📈 Analytics

### Trends View
- [ ] Navigate to analytics
- [ ] Chart displays data
- [ ] Shows rating trends over time
- [ ] Filter by school - works
- [ ] Filter by aspect - works
- [ ] Filter by date range - works
- [ ] Summary stats display correctly

**Console Commands to Test:**
```javascript
// Get trends
const trends = await assessmentService.getAnalyticsTrends();
console.log('Trends:', trends);

// Filter by school
const schoolTrends = await assessmentService.getAnalyticsTrends({
  school_id: 'cedar-park-primary'
});
console.log('School trends:', schoolTrends);

// Filter by aspect and date range
const filtered = await assessmentService.getAnalyticsTrends({
  aspect_code: 'EDU',
  from_term: 'T1-2023-24',
  to_term: 'T1-2025-26'
});
console.log('Filtered trends:', filtered);
```

---

## 🔍 Data Validation

### ID Formats
- [ ] User IDs: `user7` (not UUIDs)
- [ ] School IDs: `cedar-park-primary` (slugs)
- [ ] MAT IDs: `OLT` (codes)
- [ ] MAT Aspect IDs: `OLT-EDU` (MAT-CODE)
- [ ] MAT Standard IDs: `OLT-ES1` (MAT-CODE)
- [ ] Version IDs: `OLT-ES1-v1` (MAT-CODE-v#)
- [ ] Term IDs: `T1-2024-25` (unified)
- [ ] Assessment IDs: `school-standard-term` format
- [ ] Group IDs: `school-aspect-term` format

### Field Names
- [ ] User has `full_name` (not `first_name` + `last_name`)
- [ ] User has `mat_name` and `school_name`
- [ ] Standards use `standard_name` (not `title`)
- [ ] Aspects use `aspect_name` (not `title`)
- [ ] Ratings are 1-4 (not 0-4)
- [ ] Status is lowercase: `in_progress`, `completed`, `not_started`

---

## 🐛 Error Handling

### Network Errors
- [ ] Disconnect network - shows error message
- [ ] Reconnect - data loads
- [ ] Retry button works

### API Errors
- [ ] 401 Unauthorized - redirects to login
- [ ] 404 Not Found - shows appropriate message
- [ ] 500 Server Error - shows error message
- [ ] Validation errors - shows field errors

### Edge Cases
- [ ] Empty lists - shows empty state
- [ ] No results from filter - shows empty state
- [ ] Concurrent edits - handles gracefully
- [ ] Long text - truncates/wraps correctly
- [ ] Special characters - displays correctly

---

## 🚀 Performance

### Loading Speed
- [ ] Initial page load < 2s
- [ ] Assessment list loads quickly
- [ ] Standards list loads quickly
- [ ] No unnecessary refetching

### Caching
- [ ] Data cached after first fetch
- [ ] Navigating back doesn't refetch
- [ ] Manual refresh updates data
- [ ] Cache invalidates after mutations

### Optimistic Updates
- [ ] Rating updates appear immediately
- [ ] Standard reorder happens instantly
- [ ] Reverts on error

---

## ✅ Final Checks

- [ ] No console errors
- [ ] No console warnings (or only expected ones)
- [ ] TypeScript compiles with no errors
- [ ] All tests pass (if applicable)
- [ ] No broken links
- [ ] All images load
- [ ] Responsive on mobile
- [ ] Works in Chrome
- [ ] Works in Firefox
- [ ] Works in Safari

---

## 📝 Notes

Record any issues found during testing:

```
Issue #1:
Description: 
Steps to reproduce:
Expected: 
Actual:

Issue #2:
...
```

---

**Testing Status:** [ ] Not Started / [ ] In Progress / [ ] Complete

**Issues Found:** 0

**Tested By:** _____________

**Date:** _____________

