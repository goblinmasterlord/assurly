# Assurly v5 Frontend Changes

**Date:** 2025-01-10  
**Version:** 5.0.0

This document outlines the frontend changes required to support the v5 backend API updates.

---

## Summary of Changes

| Feature | Change Type | Priority |
|---------|-------------|----------|
| Rating scale 1-5 | UI + Types | High |
| Standard type (Risk/Assurance) | New field + Filter | High |
| Aspect category (Ofsted/Operational) | New field + Filter | High |
| Description max length | UI tweak | Low |

---

## 1. Rating Scale: 1-4 → 1-5

### Update Type Definition

```typescript
// src/types/assessment.ts

// OLD
type Rating = 1 | 2 | 3 | 4 | null;

// NEW
type Rating = 1 | 2 | 3 | 4 | 5 | null;
```

### Update Rating Labels

```typescript
// src/utils/assessment.ts

// OLD
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

// NEW
export function getRatingLabel(rating: number | null): string {
    if (rating === null) return 'Not Rated';
    const labels: Record<number, string> = {
        1: 'Inadequate',
        2: 'Requires Improvement',
        3: 'Good',
        4: 'Outstanding',
        5: 'Exceptional'
    };
    return labels[rating] || 'Unknown';
}
```

### Update Rating Colors

```typescript
// src/utils/assessment.ts

// NEW
export function getRatingColor(rating: number | null): string {
    if (rating === null) return 'gray';
    const colors: Record<number, string> = {
        1: 'red',
        2: 'orange',
        3: 'yellow',
        4: 'green',
        5: 'blue'  // Or 'purple', 'indigo' - choose your brand color
    };
    return colors[rating] || 'gray';
}
```

### Update Rating Selector Component

```tsx
// Wherever you have rating selection (radio buttons, dropdown, etc.)

// OLD
const ratingOptions = [
    { value: 1, label: 'Inadequate' },
    { value: 2, label: 'Requires Improvement' },
    { value: 3, label: 'Good' },
    { value: 4, label: 'Outstanding' },
];

// NEW
const ratingOptions = [
    { value: 1, label: 'Inadequate', color: 'red' },
    { value: 2, label: 'Requires Improvement', color: 'orange' },
    { value: 3, label: 'Good', color: 'yellow' },
    { value: 4, label: 'Outstanding', color: 'green' },
    { value: 5, label: 'Exceptional', color: 'blue' },
];
```

### Update Any Validation

```typescript
// If you have frontend validation
const isValidRating = (rating: number) => rating >= 1 && rating <= 5;
```

---

## 2. Standard Type: Risk vs Assurance

### Update Type Definitions

```typescript
// src/types/assessment.ts

// ADD new type
type StandardType = 'assurance' | 'risk';

// UPDATE Standard interface
interface Standard {
    mat_standard_id: string;
    standard_code: string;
    standard_name: string;
    standard_description: string;
    standard_type: StandardType;  // ADD THIS
    sort_order: number;
    is_custom: boolean;
    is_modified: boolean;
    mat_aspect_id: string;
    aspect_code: string;
    aspect_name: string;
    current_version_id: string;
    current_version: number;
}

// UPDATE AssessmentStandard interface
interface AssessmentStandard {
    assessment_id: string;
    mat_standard_id: string;
    standard_code: string;
    standard_name: string;
    standard_description: string;
    standard_type: StandardType;  // ADD THIS
    sort_order: number;
    rating: Rating;
    evidence_comments: string | null;
    version_id: string;
    version_number: number;
    status: AssessmentStatus;
}

// UPDATE StandardCreate interface (for creating new standards)
interface StandardCreate {
    mat_aspect_id: string;
    standard_code: string;
    standard_name: string;
    standard_description?: string;
    standard_type?: StandardType;  // ADD THIS - defaults to 'assurance'
    sort_order?: number;
}
```

### Add Standard Type Filter

```tsx
// src/components/StandardsFilter.tsx (or wherever you filter standards)

interface StandardsFilterProps {
    onFilterChange: (filters: StandardFilters) => void;
}

interface StandardFilters {
    aspect_code?: string;
    standard_type?: 'assurance' | 'risk' | 'all';
}

const StandardsFilter: React.FC<StandardsFilterProps> = ({ onFilterChange }) => {
    const [standardType, setStandardType] = useState<string>('all');
    
    return (
        <div className="flex gap-4">
            {/* Existing aspect filter */}
            
            {/* NEW: Standard type filter */}
            <Select
                value={standardType}
                onChange={(e) => {
                    setStandardType(e.target.value);
                    onFilterChange({ 
                        standard_type: e.target.value === 'all' ? undefined : e.target.value 
                    });
                }}
            >
                <option value="all">All Standards</option>
                <option value="assurance">Assurance Only</option>
                <option value="risk">Risk Only</option>
            </Select>
        </div>
    );
};
```

### Add Standard Type Badge

```tsx
// src/components/StandardTypeBadge.tsx

interface StandardTypeBadgeProps {
    type: 'assurance' | 'risk';
}

const StandardTypeBadge: React.FC<StandardTypeBadgeProps> = ({ type }) => {
    const styles = {
        assurance: 'bg-green-100 text-green-800',
        risk: 'bg-red-100 text-red-800'
    };
    
    const labels = {
        assurance: 'Assurance',
        risk: 'Risk'
    };
    
    return (
        <span className={`px-2 py-1 text-xs font-medium rounded ${styles[type]}`}>
            {labels[type]}
        </span>
    );
};
```

### Update Standards List Display

```tsx
// In your standards list/table component

<TableRow key={standard.mat_standard_id}>
    <TableCell>{standard.standard_code}</TableCell>
    <TableCell>{standard.standard_name}</TableCell>
    <TableCell>
        <StandardTypeBadge type={standard.standard_type} />  {/* ADD THIS */}
    </TableCell>
    <TableCell>{standard.aspect_name}</TableCell>
</TableRow>
```

### Update Standard Create/Edit Form

```tsx
// In your standard creation form

<form onSubmit={handleSubmit}>
    {/* Existing fields */}
    <Input name="standard_code" label="Code" required />
    <Input name="standard_name" label="Name" required />
    <Textarea name="standard_description" label="Description" maxLength={500} />
    
    {/* NEW: Standard type selector */}
    <Select name="standard_type" label="Type" defaultValue="assurance">
        <option value="assurance">Assurance</option>
        <option value="risk">Risk</option>
    </Select>
    
    <Button type="submit">Save Standard</Button>
</form>
```

### Update API Calls

```typescript
// src/api/standards.ts

// GET with filter
export async function getStandards(filters?: {
    aspect_code?: string;
    standard_type?: 'assurance' | 'risk';
}): Promise<Standard[]> {
    const params = new URLSearchParams();
    if (filters?.aspect_code) params.set('aspect_code', filters.aspect_code);
    if (filters?.standard_type) params.set('standard_type', filters.standard_type);
    
    return api.get(`/api/standards?${params}`);
}

// POST with standard_type
export async function createStandard(data: StandardCreate): Promise<Standard> {
    return api.post('/api/standards', {
        ...data,
        standard_type: data.standard_type || 'assurance'
    });
}
```

---

## 3. Aspect Category: Ofsted vs Operational

### Update Type Definitions

```typescript
// src/types/assessment.ts

// ADD new type
type AspectCategory = 'ofsted' | 'operational';

// UPDATE Aspect interface
interface Aspect {
    mat_aspect_id: string;
    aspect_code: string;
    aspect_name: string;
    aspect_description: string;
    aspect_category: AspectCategory;  // ADD THIS
    sort_order: number;
    is_custom: boolean;
    standards_count: number;
}
```

### Add Aspect Category Filter

```tsx
// src/components/AspectsFilter.tsx

const AspectsFilter: React.FC = () => {
    const [category, setCategory] = useState<string>('all');
    
    return (
        <div className="flex gap-2">
            <Button 
                variant={category === 'all' ? 'primary' : 'outline'}
                onClick={() => setCategory('all')}
            >
                All Aspects
            </Button>
            <Button 
                variant={category === 'ofsted' ? 'primary' : 'outline'}
                onClick={() => setCategory('ofsted')}
            >
                Ofsted
            </Button>
            <Button 
                variant={category === 'operational' ? 'primary' : 'outline'}
                onClick={() => setCategory('operational')}
            >
                Operational
            </Button>
        </div>
    );
};
```

### Add Aspect Category Badge

```tsx
// src/components/AspectCategoryBadge.tsx

interface AspectCategoryBadgeProps {
    category: 'ofsted' | 'operational';
}

const AspectCategoryBadge: React.FC<AspectCategoryBadgeProps> = ({ category }) => {
    const styles = {
        ofsted: 'bg-purple-100 text-purple-800',
        operational: 'bg-blue-100 text-blue-800'
    };
    
    const labels = {
        ofsted: 'Ofsted',
        operational: 'Operational'
    };
    
    return (
        <span className={`px-2 py-1 text-xs font-medium rounded ${styles[category]}`}>
            {labels[category]}
        </span>
    );
};
```

### Update Aspects Display

```tsx
// In your aspects list/navigation

{aspects.map(aspect => (
    <div key={aspect.mat_aspect_id} className="flex items-center gap-2">
        <span>{aspect.aspect_name}</span>
        <AspectCategoryBadge category={aspect.aspect_category} />
        <span className="text-gray-500">({aspect.standards_count})</span>
    </div>
))}
```

### Update API Calls

```typescript
// src/api/aspects.ts

export async function getAspects(filters?: {
    aspect_category?: 'ofsted' | 'operational';
}): Promise<Aspect[]> {
    const params = new URLSearchParams();
    if (filters?.aspect_category) params.set('aspect_category', filters.aspect_category);
    
    return api.get(`/api/aspects?${params}`);
}
```

### Create Grouped Aspects View (Optional)

```tsx
// src/components/GroupedAspects.tsx

interface GroupedAspectsProps {
    aspects: Aspect[];
}

const GroupedAspects: React.FC<GroupedAspectsProps> = ({ aspects }) => {
    const ofstedAspects = aspects.filter(a => a.aspect_category === 'ofsted');
    const operationalAspects = aspects.filter(a => a.aspect_category === 'operational');
    
    return (
        <div className="space-y-6">
            <section>
                <h2 className="text-lg font-semibold text-purple-800 mb-3">
                    Ofsted Aspects
                </h2>
                <div className="grid grid-cols-2 gap-4">
                    {ofstedAspects.map(aspect => (
                        <AspectCard key={aspect.mat_aspect_id} aspect={aspect} />
                    ))}
                </div>
            </section>
            
            <section>
                <h2 className="text-lg font-semibold text-blue-800 mb-3">
                    Operational Aspects
                </h2>
                <div className="grid grid-cols-2 gap-4">
                    {operationalAspects.map(aspect => (
                        <AspectCard key={aspect.mat_aspect_id} aspect={aspect} />
                    ))}
                </div>
            </section>
        </div>
    );
};
```

---

## 4. Description Field: 250 → 500 Characters

### Update Textarea Max Length

```tsx
// Wherever you have standard description input

// OLD
<Textarea 
    name="standard_description" 
    label="Description"
    maxLength={250}
    rows={3}
/>

// NEW
<Textarea 
    name="standard_description" 
    label="Description"
    maxLength={500}
    rows={5}  // Increase rows to accommodate more text
/>
```

### Update Character Counter (if you have one)

```tsx
// If you show remaining characters
<div className="text-sm text-gray-500">
    {description.length}/500 characters
</div>
```

---

## 5. Analytics Updates (Optional Enhancement)

### Add Category Filters to Analytics

```tsx
// src/pages/Analytics.tsx

const AnalyticsDashboard: React.FC = () => {
    const [filters, setFilters] = useState({
        school_id: null,
        aspect_code: null,
        aspect_category: null,  // ADD
        standard_type: null,    // ADD
        from_term: null,
        to_term: null
    });
    
    return (
        <div>
            {/* Filter controls */}
            <div className="flex gap-4 mb-6">
                <Select 
                    value={filters.aspect_category || ''} 
                    onChange={e => setFilters({...filters, aspect_category: e.target.value || null})}
                >
                    <option value="">All Aspect Categories</option>
                    <option value="ofsted">Ofsted Only</option>
                    <option value="operational">Operational Only</option>
                </Select>
                
                <Select 
                    value={filters.standard_type || ''} 
                    onChange={e => setFilters({...filters, standard_type: e.target.value || null})}
                >
                    <option value="">All Standard Types</option>
                    <option value="assurance">Assurance Only</option>
                    <option value="risk">Risk Only</option>
                </Select>
            </div>
            
            {/* Charts */}
            <TrendsChart filters={filters} />
        </div>
    );
};
```

---

## Migration Checklist

### Types & Interfaces
- [ ] Add `StandardType` type
- [ ] Add `AspectCategory` type  
- [ ] Update `Rating` type to include 5
- [ ] Update `Standard` interface with `standard_type`
- [ ] Update `AssessmentStandard` interface with `standard_type`
- [ ] Update `Aspect` interface with `aspect_category`
- [ ] Update `StandardCreate` interface

### Utility Functions
- [ ] Update `getRatingLabel()` with rating 5
- [ ] Update `getRatingColor()` with rating 5
- [ ] Add rating validation for 1-5

### Components
- [ ] Update rating selector with 5th option
- [ ] Create `StandardTypeBadge` component
- [ ] Create `AspectCategoryBadge` component
- [ ] Update standards list to show type badge
- [ ] Update aspects list to show category badge
- [ ] Update standard create/edit form with type selector
- [ ] Update description textarea maxLength to 500

### API Calls
- [ ] Update `getStandards()` to accept `standard_type` filter
- [ ] Update `getAspects()` to accept `aspect_category` filter
- [ ] Update `createStandard()` to include `standard_type`

### Pages
- [ ] Add standard type filter to Standards page
- [ ] Add aspect category filter to Aspects page
- [ ] Update Analytics filters (optional)


---

## API Changes Reference

| Endpoint | New Query Param | New Response Field |
|----------|-----------------|-------------------|
| `GET /api/standards` | `standard_type` | `standard_type` |
| `GET /api/aspects` | `aspect_category` | `aspect_category` |
| `POST /api/standards` | - | Request accepts `standard_type` |
| `PUT /api/standards/{id}` | - | Request accepts `standard_type` |
| `GET /api/analytics/trends` | `standard_type`, `aspect_category` | - |

---

**Document Version:** 5.0.0  
**Last Updated:** 2025-01-10
