# v4 Quick Start Guide

**For Developers** - Quick reference for working with v4 API

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Type check
npm run typecheck
```

---

## 📦 Key Imports

```typescript
// Types
import type { 
  Assessment,
  AssessmentGroup,
  AssessmentByAspect,
  Standard,
  Aspect,
  School,
  Term,
  Rating
} from '@/types/assessment';

import type { User } from '@/types/auth';

// Services
import { assessmentService } from '@/services/enhanced-assessment-service';
import * as api from '@/services/assessment-service';

// Transformers (rarely needed - v4 responses are frontend-ready)
import { 
  transformAssessment,
  parseAssessmentId,
  parseGroupId
} from '@/lib/data-transformers';
```

---

## 🆔 ID Formats (v4)

```typescript
// Human-readable IDs throughout!
const examples = {
  mat: 'OLT',
  school: 'cedar-park-primary',
  user: 'user7',
  aspect: 'EDU',                           // Global code
  matAspect: 'OLT-EDU',                    // MAT-scoped
  standard: 'ES1',                         // Global code  
  matStandard: 'OLT-ES1',                  // MAT-scoped
  version: 'OLT-ES1-v1',                   // Version ID
  term: 'T1-2024-25',                      // Unified term
  assessment: 'cedar-park-primary-ES1-T1-2024-25',
  group: 'cedar-park-primary-EDU-T1-2024-25'
};
```

---

## 📊 Common Patterns

### Fetch Assessment Groups (List View)

```typescript
// Get all assessment groups for the MAT
const groups = await assessmentService.getAssessments();

// Filter by school
const schoolGroups = await assessmentService.getAssessments({
  school_id: 'cedar-park-primary'
});

// Filter by aspect and term
const filtered = await assessmentService.getAssessments({
  aspect_code: 'EDU',
  term_id: 'T1-2024-25',
  status: 'in_progress'
});
```

### Fetch Assessment Form (All Standards for Aspect)

```typescript
// Get all standards for a school/aspect/term (form view)
const formData = await assessmentService.getAssessmentsByAspect(
  'EDU',                    // aspect_code
  'cedar-park-primary',     // school_id
  'T1-2024-25'             // term_id (unique_term_id)
);

// formData.standards contains all standards with ratings
formData.standards.forEach(standard => {
  console.log(standard.standard_name, standard.rating);
});
```

### Update Assessment Rating

```typescript
// Update single assessment
await assessmentService.updateAssessment(
  'cedar-park-primary-ES1-T1-2024-25',  // assessment_id
  4,                                     // rating (1-4)
  'Excellent implementation...'          // evidence_comments
);

// Bulk update multiple assessments
await assessmentService.bulkUpdateAssessments([
  {
    assessment_id: 'cedar-park-primary-ES1-T1-2024-25',
    rating: 4,
    evidence_comments: 'Excellent'
  },
  {
    assessment_id: 'cedar-park-primary-ES2-T1-2024-25',
    rating: 3,
    evidence_comments: 'Good progress'
  }
]);
```

### Create Assessments

```typescript
// Create assessments for multiple schools
await assessmentService.createAssessments({
  school_ids: ['cedar-park-primary', 'oak-hill-academy'],
  aspect_code: 'EDU',
  term_id: 'T1-2025-26',
  due_date: '2025-12-20',
  assigned_to: 'user7'
});
```

### Standards Management

```typescript
// List all standards
const allStandards = await assessmentService.getStandards();

// List standards for specific aspect
const eduStandards = await assessmentService.getStandards('EDU');

// Get standard with version history
const standard = await assessmentService.getStandardById('OLT-ES1');
console.log(standard.version_history);

// Create custom standard
const newStandard = await assessmentService.createStandard({
  mat_aspect_id: 'OLT-EDU',
  standard_code: 'ES7',
  standard_name: 'New Custom Standard',
  standard_description: 'Description here',
  sort_order: 7
});

// Update standard (creates new version)
await assessmentService.updateStandard('OLT-ES1', {
  standard_name: 'Updated Name',
  standard_description: 'Updated description',
  change_reason: 'Clarified requirements'
});

// Reorder standards
await assessmentService.reorderStandards([
  { mat_standard_id: 'OLT-ES1', sort_order: 0 },
  { mat_standard_id: 'OLT-ES2', sort_order: 1 },
  { mat_standard_id: 'OLT-ES3', sort_order: 2 }
]);
```

### Aspects Management

```typescript
// List all aspects
const aspects = await assessmentService.getAspects();

// Create custom aspect
const newAspect = await assessmentService.createAspect({
  aspect_code: 'CUSTOM',
  aspect_name: 'Custom Aspect',
  aspect_description: 'Description',
  sort_order: 10
});

// Update aspect
await assessmentService.updateAspect('OLT-EDU', {
  aspect_name: 'Education (Updated)',
  aspect_description: 'Updated description',
  sort_order: 1
});
```

### Schools & Terms

```typescript
// Get schools
const schools = await assessmentService.getSchools();

// Include central office
const allSchools = await assessmentService.getSchools(true);

// Get terms
const terms = await assessmentService.getTerms();

// Get terms for specific year
const termsForYear = await assessmentService.getTerms('2024-25');

// Find current term
const currentTerm = terms.find(t => t.is_current);
```

---

## 🎨 UI Component Patterns

### Display Standard Card

```typescript
<StandardCard
  key={standard.mat_standard_id}
  code={standard.standard_code}
  name={standard.standard_name}
  description={standard.standard_description}
  version={standard.current_version}
  isCustom={standard.is_custom}
  isModified={standard.is_modified}
  onEdit={() => handleEdit(standard)}
  onDelete={() => handleDelete(standard.mat_standard_id)}
/>
```

### Filter Standards by Aspect

```typescript
const filteredStandards = standards.filter(
  s => s.mat_aspect_id === selectedAspect.mat_aspect_id
);
```

### Display Rating

```typescript
import { RatingLabels } from '@/types/assessment';

const ratingLabel = assessment.rating 
  ? RatingLabels[assessment.rating]
  : 'Not Rated';

// Rating scale: 1 = Inadequate, 2 = Requires Improvement, 
//               3 = Good, 4 = Outstanding
```

---

## 🔄 Subscriptions & Real-time Updates

```typescript
// Subscribe to assessment updates
useEffect(() => {
  const unsubscribe = assessmentService.subscribeToAssessments(
    (assessments) => {
      setAssessments(assessments);
    }
  );
  
  return unsubscribe;
}, []);

// Subscribe to standards updates
useEffect(() => {
  const unsubscribe = assessmentService.subscribeToStandards(
    (standards) => {
      setStandards(standards);
    },
    'EDU'  // optional: aspect code filter
  );
  
  return unsubscribe;
}, []);
```

---

## 🐛 Debugging Tips

### Enable Detailed Logging

```typescript
// Services already have detailed console.log statements
// Check browser console for:
// [EnhancedService] ...
// [useStandardsPersistence] ...
```

### Check Cache Status

```typescript
const stats = assessmentService.getCacheStats();
console.log('Cache stats:', stats);

// Refresh all data
await assessmentService.refreshAllData();

// Clear specific cache
assessmentService.invalidateAssessment(assessmentId);
```

### Parse Composite IDs

```typescript
import { parseAssessmentId, parseGroupId } from '@/lib/data-transformers';

const parts = parseAssessmentId('cedar-park-primary-ES1-T1-2024-25');
// { schoolId, standardCode, termId, academicYear }

const groupParts = parseGroupId('cedar-park-primary-EDU-T1-2024-25');
// { schoolId, aspectCode, termId, academicYear }
```

---

## ⚠️ Common Mistakes

### ❌ Don't use UUIDs

```typescript
// WRONG - v3 style
const aspectId = "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d";

// CORRECT - v4 style
const aspectId = "OLT-EDU";
```

### ❌ Don't split term ID

```typescript
// WRONG - v3 style
const params = { term_id: "T1", academic_year: "2024-2025" };

// CORRECT - v4 style
const params = { term_id: "T1-2024-25" };
```

### ❌ Don't use old field names

```typescript
// WRONG - v3 style
standard.title;
standard.description;
user.first_name;

// CORRECT - v4 style
standard.standard_name;
standard.standard_description;
user.full_name;
```

---

## 📞 Need Help?

1. Check `docs/api/FRONTEND_API_SPECIFICATION_v4.md` for complete API reference
2. Check `docs/V4_MIGRATION_COMPLETE.md` for migration notes
3. Check TypeScript types in `src/types/assessment.ts`
4. Look at existing components for patterns

---

**Happy Coding!** 🎉

