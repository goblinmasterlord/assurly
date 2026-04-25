# Frontend Implementation: Schools Dashboard

**Date:** 2025-01-25  
**Endpoint:** `GET /api/dashboard/schools`

---

## API Reference

### Request

```
GET /api/dashboard/schools?term_id=T2-2025-26
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `term_id` | string | No | Current term (e.g., `T2-2025-26`). If omitted, uses most recent term with assessments. |

### Response

```json
{
    "current_term": "T2-2025-26",
    "schools": [
        {
            "school_id": "ermine-primary-academy",
            "school_name": "Ermine Primary Academy",
            "current_term": "T2-2025-26",
            "status": "in_progress",
            "current_score": 3.2,
            "previous_terms": [
                {"term_id": "T1-2025-26", "academic_year": "2025-26", "avg_score": 3.0},
                {"term_id": "T3-2024-25", "academic_year": "2024-25", "avg_score": 2.8},
                {"term_id": "T2-2024-25", "academic_year": "2024-25", "avg_score": 2.5}
            ],
            "intervention_required": 3,
            "completed_standards": 15,
            "total_standards": 41,
            "completion_rate": "15/41",
            "last_updated": "2026-01-18T18:28:22Z"
        }
    ]
}
```

---

## Type Definitions

```typescript
// src/types/dashboard.ts

interface PreviousTerm {
    term_id: string;
    academic_year: string;
    avg_score: number | null;
}

interface SchoolDashboardItem {
    school_id: string;
    school_name: string;
    current_term: string;
    status: 'not_started' | 'in_progress' | 'completed';
    current_score: number | null;
    previous_terms: PreviousTerm[];
    intervention_required: number;
    completed_standards: number;
    total_standards: number;
    completion_rate: string;
    last_updated: string | null;
}

interface SchoolsDashboardResponse {
    current_term: string | null;
    schools: SchoolDashboardItem[];
}
```

---

## API Service

```typescript
// src/api/dashboard.ts

export async function getSchoolsDashboard(termId?: string): Promise<SchoolsDashboardResponse> {
    const params = new URLSearchParams();
    if (termId) params.set('term_id', termId);
    
    const url = `/api/dashboard/schools${params.toString() ? `?${params}` : ''}`;
    return api.get(url);
}
```

---

## Dashboard Component

```tsx
// src/pages/Dashboard/SchoolAssessmentOverview.tsx

import React, { useEffect, useState } from 'react';
import { getSchoolsDashboard } from '../../api/dashboard';
import { SchoolsDashboardResponse, SchoolDashboardItem } from '../../types/dashboard';
import { StatusBadge } from '../../components/StatusBadge';
import { TrendSparkline } from '../../components/TrendSparkline';
import { InterventionBadge } from '../../components/InterventionBadge';

const SchoolAssessmentOverview: React.FC = () => {
    const [data, setData] = useState<SchoolsDashboardResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedTerm, setSelectedTerm] = useState<string | undefined>();
    const [expandedSchool, setExpandedSchool] = useState<string | null>(null);

    useEffect(() => {
        loadDashboard();
    }, [selectedTerm]);

    const loadDashboard = async () => {
        setLoading(true);
        try {
            const response = await getSchoolsDashboard(selectedTerm);
            setData(response);
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string | null): string => {
        if (!dateString) return '—';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB'); // DD/MM/YYYY
    };

    const formatScore = (score: number | null): string => {
        if (score === null) return '—';
        return score.toFixed(1);
    };

    if (loading) {
        return <div className="animate-pulse">Loading...</div>;
    }

    if (!data || data.schools.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                No assessment data available
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow">
            {/* Header */}
            <div className="px-6 py-4 border-b">
                <div className="flex items-center gap-2">
                    <span className="text-xl">🏫</span>
                    <h2 className="text-lg font-semibold">School Assessment Overview</h2>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                    Click on a school to view detailed assessment breakdowns by category
                </p>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                School
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Current Score
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Previous 3 Terms
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Intervention Required
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Completion Rate
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Last Updated
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {data.schools.map((school) => (
                            <SchoolRow
                                key={school.school_id}
                                school={school}
                                isExpanded={expandedSchool === school.school_id}
                                onToggle={() => setExpandedSchool(
                                    expandedSchool === school.school_id ? null : school.school_id
                                )}
                                formatDate={formatDate}
                                formatScore={formatScore}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SchoolAssessmentOverview;
```

---

## School Row Component

```tsx
// src/components/Dashboard/SchoolRow.tsx

interface SchoolRowProps {
    school: SchoolDashboardItem;
    isExpanded: boolean;
    onToggle: () => void;
    formatDate: (date: string | null) => string;
    formatScore: (score: number | null) => string;
}

const SchoolRow: React.FC<SchoolRowProps> = ({
    school,
    isExpanded,
    onToggle,
    formatDate,
    formatScore
}) => {
    return (
        <>
            <tr 
                className="hover:bg-gray-50 cursor-pointer"
                onClick={onToggle}
            >
                {/* Expand Arrow + School Name */}
                <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                        <span className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                            ›
                        </span>
                        <span className="p-2 bg-gray-100 rounded">🏫</span>
                        <span className="font-medium text-gray-900">
                            {school.school_name}
                        </span>
                    </div>
                </td>

                {/* Status */}
                <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={school.status} />
                </td>

                {/* Current Score */}
                <td className="px-6 py-4 whitespace-nowrap">
                    <ScoreDisplay score={school.current_score} />
                </td>

                {/* Previous 3 Terms */}
                <td className="px-6 py-4 whitespace-nowrap">
                    <TrendSparkline terms={school.previous_terms} />
                </td>

                {/* Intervention Required */}
                <td className="px-6 py-4 whitespace-nowrap">
                    <InterventionBadge count={school.intervention_required} />
                </td>

                {/* Completion Rate */}
                <td className="px-6 py-4 whitespace-nowrap">
                    <CompletionRate 
                        completed={school.completed_standards}
                        total={school.total_standards}
                    />
                </td>

                {/* Last Updated */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(school.last_updated)}
                </td>
            </tr>

            {/* Expanded Detail Row */}
            {isExpanded && (
                <tr>
                    <td colSpan={7} className="px-6 py-4 bg-gray-50">
                        <SchoolDetailPanel schoolId={school.school_id} />
                    </td>
                </tr>
            )}
        </>
    );
};
```

---

## Supporting Components

### Status Badge

```tsx
// src/components/StatusBadge.tsx

interface StatusBadgeProps {
    status: 'not_started' | 'in_progress' | 'completed';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
    const config = {
        not_started: {
            label: 'Not Started',
            icon: '○',
            className: 'bg-gray-100 text-gray-800'
        },
        in_progress: {
            label: 'In Progress',
            icon: '◔',
            className: 'bg-yellow-100 text-yellow-800'
        },
        completed: {
            label: 'Completed',
            icon: '✓',
            className: 'bg-green-100 text-green-800'
        }
    };

    const { label, icon, className } = config[status];

    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
            <span>{icon}</span>
            <span>{label}</span>
        </span>
    );
};
```

### Score Display

```tsx
// src/components/ScoreDisplay.tsx

interface ScoreDisplayProps {
    score: number | null;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ score }) => {
    if (score === null) {
        return <span className="text-gray-400">—</span>;
    }

    // Color based on score (1-5 scale)
    const getColor = (score: number): string => {
        if (score >= 4) return 'text-green-600';
        if (score >= 3) return 'text-yellow-600';
        if (score >= 2) return 'text-orange-600';
        return 'text-red-600';
    };

    return (
        <span className={`text-lg font-semibold ${getColor(score)}`}>
            {score.toFixed(1)}
        </span>
    );
};
```

### Trend Sparkline

```tsx
// src/components/TrendSparkline.tsx

interface PreviousTerm {
    term_id: string;
    academic_year: string;
    avg_score: number | null;
}

interface TrendSparklineProps {
    terms: PreviousTerm[];
}

const TrendSparkline: React.FC<TrendSparklineProps> = ({ terms }) => {
    if (terms.length === 0) {
        return <span className="text-gray-400">—</span>;
    }

    // Reverse to show oldest to newest (left to right)
    const orderedTerms = [...terms].reverse();

    // Calculate trend direction
    const scores = orderedTerms
        .map(t => t.avg_score)
        .filter((s): s is number => s !== null);
    
    const trend = scores.length >= 2 
        ? scores[scores.length - 1] - scores[0] 
        : 0;

    const getTrendIcon = () => {
        if (trend > 0.2) return '↗';
        if (trend < -0.2) return '↘';
        return '→';
    };

    const getTrendColor = () => {
        if (trend > 0.2) return 'text-green-600';
        if (trend < -0.2) return 'text-red-600';
        return 'text-gray-600';
    };

    return (
        <div className="flex items-center gap-2">
            {/* Mini bars */}
            <div className="flex items-end gap-1 h-6">
                {orderedTerms.map((term, index) => {
                    const score = term.avg_score;
                    if (score === null) {
                        return (
                            <div
                                key={term.term_id}
                                className="w-2 h-1 bg-gray-200 rounded"
                                title={`${term.term_id}: No data`}
                            />
                        );
                    }
                    
                    // Height based on score (1-5 scale, map to 4-24px)
                    const height = Math.max(4, (score / 5) * 24);
                    
                    // Color based on score
                    const getBarColor = (s: number) => {
                        if (s >= 4) return 'bg-green-500';
                        if (s >= 3) return 'bg-yellow-500';
                        if (s >= 2) return 'bg-orange-500';
                        return 'bg-red-500';
                    };

                    return (
                        <div
                            key={term.term_id}
                            className={`w-2 rounded ${getBarColor(score)}`}
                            style={{ height: `${height}px` }}
                            title={`${term.term_id}: ${score.toFixed(1)}`}
                        />
                    );
                })}
            </div>
            
            {/* Trend arrow */}
            <span className={`text-sm font-medium ${getTrendColor()}`}>
                {getTrendIcon()}
            </span>
        </div>
    );
};
```

### Intervention Badge

```tsx
// src/components/InterventionBadge.tsx

interface InterventionBadgeProps {
    count: number;
}

const InterventionBadge: React.FC<InterventionBadgeProps> = ({ count }) => {
    if (count === 0) {
        return (
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-800 text-xs font-medium">
                0
            </span>
        );
    }

    return (
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-800 text-xs font-medium">
            {count}
        </span>
    );
};
```

### Completion Rate

```tsx
// src/components/CompletionRate.tsx

interface CompletionRateProps {
    completed: number;
    total: number;
}

const CompletionRate: React.FC<CompletionRateProps> = ({ completed, total }) => {
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return (
        <div className="flex items-center gap-2">
            {/* Progress bar */}
            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                />
            </div>
            
            {/* Text */}
            <span className="text-sm text-gray-600">
                {completed}/{total}
            </span>
        </div>
    );
};
```

---

## Expanded School Detail Panel

When a school row is expanded, show breakdown by aspect:

```tsx
// src/components/Dashboard/SchoolDetailPanel.tsx

import { useEffect, useState } from 'react';
import { getAssessments } from '../../api/assessments';
import { AssessmentGroup } from '../../types/assessment';

interface SchoolDetailPanelProps {
    schoolId: string;
}

const SchoolDetailPanel: React.FC<SchoolDetailPanelProps> = ({ schoolId }) => {
    const [aspects, setAspects] = useState<AssessmentGroup[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSchoolAspects();
    }, [schoolId]);

    const loadSchoolAspects = async () => {
        setLoading(true);
        try {
            const data = await getAssessments({ school_id: schoolId });
            setAspects(data);
        } catch (error) {
            console.error('Failed to load school aspects:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="py-4 text-center text-gray-500">Loading...</div>;
    }

    if (aspects.length === 0) {
        return <div className="py-4 text-center text-gray-500">No assessments found</div>;
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {aspects.map(aspect => (
                <div 
                    key={aspect.group_id}
                    className="p-4 bg-white rounded border hover:shadow-md transition-shadow cursor-pointer"
                >
                    <h4 className="font-medium text-gray-900">{aspect.aspect_name}</h4>
                    <div className="mt-2 flex items-center justify-between">
                        <StatusBadge status={aspect.status} />
                        <span className="text-sm text-gray-500">
                            {aspect.completed_standards}/{aspect.total_standards}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
};
```

---

## Term Selector (Optional Enhancement)

```tsx
// src/components/Dashboard/TermSelector.tsx

interface TermSelectorProps {
    currentTerm: string | null;
    onChange: (termId: string) => void;
}

const TermSelector: React.FC<TermSelectorProps> = ({ currentTerm, onChange }) => {
    const [terms, setTerms] = useState<Term[]>([]);

    useEffect(() => {
        getTerms().then(setTerms);
    }, []);

    return (
        <select
            value={currentTerm || ''}
            onChange={(e) => onChange(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
        >
            {terms.map(term => (
                <option key={term.unique_term_id} value={term.unique_term_id}>
                    {term.term_name} {term.academic_year}
                </option>
            ))}
        </select>
    );
};
```

---

## Usage Example

```tsx
// src/pages/Dashboard/index.tsx

import SchoolAssessmentOverview from './SchoolAssessmentOverview';
import TermSelector from '../../components/Dashboard/TermSelector';

const DashboardPage: React.FC = () => {
    const [selectedTerm, setSelectedTerm] = useState<string | undefined>();

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Dashboard</h1>
                <TermSelector 
                    currentTerm={selectedTerm} 
                    onChange={setSelectedTerm} 
                />
            </div>

            <SchoolAssessmentOverview termId={selectedTerm} />
        </div>
    );
};

export default DashboardPage;
```

---

## Summary

| Component | Purpose |
|-----------|---------|
| `SchoolAssessmentOverview` | Main table component |
| `SchoolRow` | Individual school row with expand/collapse |
| `StatusBadge` | Status indicator (not_started/in_progress/completed) |
| `ScoreDisplay` | Current score with color coding |
| `TrendSparkline` | Mini bar chart for previous 3 terms |
| `InterventionBadge` | Count of standards needing intervention |
| `CompletionRate` | Progress bar with X/Y text |
| `SchoolDetailPanel` | Expanded view showing aspects |
| `TermSelector` | Dropdown to change term |

---

**Document Version:** 1.0.0  
**Last Updated:** 2025-01-25
