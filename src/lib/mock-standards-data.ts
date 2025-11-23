import type { AssessmentCategory } from '@/types/assessment';

export interface StandardVersion {
    id: string;
    version: number;
    text: string;
    description?: string;
    createdAt: string;
    createdBy: string;
    changeType: 'created' | 'edited' | 'restored';
}

export interface Standard {
    id: string;
    code: string;
    title: string;
    description: string;
    category: AssessmentCategory;
    version: number;
    status: 'active' | 'archived' | 'draft';
    lastModified: string;
    lastModifiedBy: string;
    orderIndex: number;
    versions: StandardVersion[];
}

export interface Aspect {
    id: string;
    code: AssessmentCategory;
    name: string;
    description: string;
    isCustom: boolean;
    standardCount: number;
}

export const MOCK_ASPECTS: Aspect[] = [
    {
        id: 'education',
        code: 'education',
        name: 'Quality of Education',
        description: 'Curriculum, teaching quality, and outcomes.',
        isCustom: false,
        standardCount: 12
    },
    {
        id: 'governance',
        code: 'governance',
        name: 'Governance & Leadership',
        description: 'Trustees, local governors, and leadership structure.',
        isCustom: false,
        standardCount: 8
    },
    {
        id: 'hr',
        code: 'hr',
        name: 'Human Resources',
        description: 'Staffing, wellbeing, and employment compliance.',
        isCustom: false,
        standardCount: 10
    },
    {
        id: 'finance',
        code: 'finance',
        name: 'Finance & Operations',
        description: 'Budgeting, procurement, and estate management.',
        isCustom: false,
        standardCount: 15
    },
    {
        id: 'safeguarding',
        code: 'safeguarding',
        name: 'Safeguarding',
        description: 'Child protection and safety procedures.',
        isCustom: false,
        standardCount: 6
    },
    {
        id: 'custom-faith',
        code: 'faith',
        name: 'Catholic Life',
        description: 'Religious character and collective worship.',
        isCustom: true,
        standardCount: 4
    }
];

export const MOCK_STANDARDS: Standard[] = [
    {
        id: 'std-1',
        code: 'ED1',
        title: 'Curriculum Intent',
        description: 'The curriculum is ambitious and designed to give all pupils, particularly disadvantaged pupils and including pupils with SEND, the knowledge and cultural capital they need to succeed in life.',
        category: 'education',
        version: 2,
        status: 'active',
        lastModified: '2025-10-15T10:30:00Z',
        lastModifiedBy: 'Sarah Smith',
        orderIndex: 0,
        versions: [
            {
                id: 'v2',
                version: 2,
                text: 'The curriculum is ambitious and designed to give all pupils, particularly disadvantaged pupils and including pupils with SEND, the knowledge and cultural capital they need to succeed in life.',
                createdAt: '2025-10-15T10:30:00Z',
                createdBy: 'Sarah Smith',
                changeType: 'edited'
            },
            {
                id: 'v1',
                version: 1,
                text: 'The curriculum is ambitious and designed to give all pupils the knowledge they need.',
                createdAt: '2024-09-01T09:00:00Z',
                createdBy: 'System',
                changeType: 'created'
            }
        ]
    },
    {
        id: 'std-2',
        code: 'ED2',
        title: 'Curriculum Implementation',
        description: 'Teachers have good knowledge of the subject(s) and courses they teach. Leaders provide effective support for those teaching outside their main area of expertise.',
        category: 'education',
        version: 1,
        status: 'active',
        lastModified: '2024-09-01T09:00:00Z',
        lastModifiedBy: 'System',
        orderIndex: 1,
        versions: []
    },
    {
        id: 'std-3',
        code: 'ED3',
        title: 'Reading Priority',
        description: 'A rigorous approach to the teaching of reading develops learners\' confidence and enjoyment in reading.',
        category: 'education',
        version: 1,
        status: 'active',
        lastModified: '2024-09-01T09:00:00Z',
        lastModifiedBy: 'System',
        orderIndex: 2,
        versions: []
    },
    {
        id: 'std-4',
        code: 'GOV1',
        title: 'Strategic Direction',
        description: 'Those responsible for governance ensure that the school has a clear vision and strategy and that resources are managed well.',
        category: 'governance',
        version: 3,
        status: 'active',
        lastModified: '2025-11-01T14:20:00Z',
        lastModifiedBy: 'James Wilson',
        orderIndex: 0,
        versions: []
    },
    {
        id: 'std-5',
        code: 'CL1',
        title: 'Prayer and Liturgy',
        description: 'The quality of prayer and liturgy is outstanding and central to the life of the school.',
        category: 'faith',
        version: 1,
        status: 'active',
        lastModified: '2025-01-10T11:00:00Z',
        lastModifiedBy: 'Fr. Peter',
        orderIndex: 0,
        versions: []
    }
];
