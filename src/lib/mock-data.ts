import type { 
  Assessment, 
  AssessmentCategory, 
  AssessmentStatus, 
  School, 
  Standard, 
  User
} from "@/types/assessment";

// Mock Schools
export const mockSchools: School[] = [
  { id: "1", name: "Oak Hill Academy", code: "OHA" },
  { id: "2", name: "Maple Grove School", code: "MGS" },
  { id: "3", name: "Cedar Park Primary", code: "CPP" },
  { id: "4", name: "Willow High School", code: "WHS" },
  { id: "5", name: "Birch Tree College", code: "BTC" }
];

// Mock Users
export const mockUsers: User[] = [
  { id: "1", name: "Alex Johnson", email: "alex.johnson@oakhill.edu", role: "Head of Education" },
  { id: "2", name: "Sam Williams", email: "sam.williams@maplegroveschool.edu", role: "Finance Director" },
  { id: "3", name: "Jordan Smith", email: "jordan.smith@cedarpark.edu", role: "IT Manager" },
  { id: "4", name: "Taylor Brown", email: "taylor.brown@willowhigh.edu", role: "Head of HR" },
  { id: "5", name: "Casey Jones", email: "casey.jones@birchtree.edu", role: "Estates Manager" }
];

// Mock Education Standards
export const educationStandards: Standard[] = [
  {
    id: "es1",
    code: "ES1",
    title: "Quality of Education",
    description: "Curriculum intent, implementation, and impact. Focus on sequencing, ambition, progression, and outcomes across all key stages.",
    rating: null,
  },
  {
    id: "es2",
    code: "ES2",
    title: "Behaviour & Attitudes",
    description: "Standards of behaviour, attendance, punctuality, and attitudes to learning. Evidence of a safe and respectful learning environment.",
    rating: null,
  },
  {
    id: "es3",
    code: "ES3",
    title: "Personal Development",
    description: "Opportunities for spiritual, moral, social, and cultural development. Focus on character, citizenship, enrichment, and pupil wellbeing.",
    rating: null,
  },
  {
    id: "es4",
    code: "ES4",
    title: "Leadership & Management",
    description: "Visionary and ethical leadership at all levels. Effective governance, safeguarding, staff development, and accountability structures.",
    rating: null,
  },
  {
    id: "es5",
    code: "ES5",
    title: "Early Years Education",
    description: "High-quality early education provision. Emphasis on communication, physical development, literacy, and preparing children for Year 1.",
    rating: null,
  },
  {
    id: "es6",
    code: "ES6",
    title: "Sixth Form Provision",
    description: "Quality, ambition, and impact of post-16 education. Focus on destinations, progression pathways, curriculum breadth, and outcomes.",
    rating: null,
  },
];

// Mock Human Resources Standards
export const hrStandards: Standard[] = [
  {
    id: "hr1",
    code: "HR1",
    title: "Safer Recruitment Practice",
    description: "Compliance with safer recruitment policies, including pre-employment checks, DBS clearances, and reference validation. Evidence of policy implementation and audit trails.",
    rating: null,
  },
  {
    id: "hr2",
    code: "HR2",
    title: "Sickness Absence Management",
    description: "Monitoring of short- and long-term absence trends, with evidence of interventions, return-to-work processes, and supportive occupational health access.",
    rating: null,
  },
  {
    id: "hr3",
    code: "HR3",
    title: "People Conduct & Case Management",
    description: "Oversight of disciplinary, grievance, and capability procedures. Assurance of timely, fair, and legally compliant case handling.",
    rating: null,
  },
  {
    id: "hr4",
    code: "HR4",
    title: "Staff Retention & Engagement",
    description: "Annual turnover rates, pulse surveys, exit interview themes, and evidence of actions taken to improve employee satisfaction and retention.",
    rating: null,
  },
  {
    id: "hr5",
    code: "HR5",
    title: "Vacancy Rates & Recruitment Efficiency",
    description: "Vacancy levels by role and site, time-to-fill metrics, and the impact on service delivery. Evaluation of recruitment campaign success and strategic workforce planning.",
    rating: null,
  },
];

// Mock Finance Standards
export const financeStandards: Standard[] = [
  {
    id: "fm1",
    code: "FM1",
    title: "Financial Governance & Management",
    description: "Robust financial leadership, compliance with statutory duties, oversight by the board and audit committee, and alignment with the Academies Financial Handbook.",
    rating: null,
  },
  {
    id: "fm2",
    code: "FM2",
    title: "Strategic Financial Planning",
    description: "Multi-year budgeting aligned to organisational priorities. Evidence of sensitivity analysis, scenario planning, and sustainability modelling.",
    rating: null,
  },
  {
    id: "fm3",
    code: "FM3",
    title: "In-Year Financial Monitoring",
    description: "Monthly reporting to leaders and trustees, including forecast outturns, variance analysis, and corrective actions. Timeliness and accuracy of information.",
    rating: null,
  },
];

// Mock Assessments for MAT Admin view
export const mockAssessmentsAdmin: Assessment[] = [
  {
    id: "1",
    name: "Education Assessment",
    category: "Education",
    school: mockSchools[0],
    completedStandards: 4,
    totalStandards: 6,
    lastUpdated: "2024-07-15",
    status: "In Progress",
    dueDate: "2024-08-30",
    assignedTo: [mockUsers[0]],
    standards: educationStandards.map((std, idx) => 
      idx < 4 ? { ...std, rating: (idx % 3) + 1 as 1 | 2 | 3 | 4, lastUpdated: "2024-07-15" } : std
    ),
  },
  {
    id: "2",
    name: "Human Resources Assessment",
    category: "Human Resources",
    school: mockSchools[0],
    completedStandards: 5,
    totalStandards: 5,
    lastUpdated: "2024-07-10",
    status: "Completed",
    dueDate: "2024-07-30",
    assignedTo: [mockUsers[3]],
    standards: hrStandards.map(std => 
      ({ ...std, rating: (Math.floor(Math.random() * 3) + 2) as 2 | 3 | 4, lastUpdated: "2024-07-10" })
    ),
  },
  {
    id: "3",
    name: "Finance & Procurement Assessment",
    category: "Finance & Procurement",
    school: mockSchools[1],
    completedStandards: 2,
    totalStandards: 8,
    lastUpdated: "2024-07-05",
    status: "In Progress",
    dueDate: "2024-08-15",
    assignedTo: [mockUsers[1]],
  },
  {
    id: "4",
    name: "Estates Assessment",
    category: "Estates",
    school: mockSchools[2],
    completedStandards: 0,
    totalStandards: 6,
    lastUpdated: "-",
    status: "Not Started",
    dueDate: "2024-09-01",
    assignedTo: [mockUsers[4]],
  },
  {
    id: "5",
    name: "Education Assessment",
    category: "Education",
    school: mockSchools[1],
    completedStandards: 3,
    totalStandards: 6,
    lastUpdated: "2024-07-12",
    status: "In Progress",
    dueDate: "2024-08-20",
    assignedTo: [mockUsers[0]],
  },
  {
    id: "6",
    name: "IT & Information Services Assessment",
    category: "IT & Information Services",
    school: mockSchools[3],
    completedStandards: 0,
    totalStandards: 6,
    lastUpdated: "-",
    status: "Not Started",
    dueDate: "2024-08-25",
    assignedTo: [mockUsers[2]],
  },
  {
    id: "7",
    name: "Human Resources Assessment",
    category: "Human Resources",
    school: mockSchools[3],
    completedStandards: 2,
    totalStandards: 5,
    lastUpdated: "2024-07-16",
    status: "Overdue",
    dueDate: "2024-07-15",
    assignedTo: [mockUsers[3]],
  },
];

// Mock Assessments for Department Head view (user 0 - Education Head)
export const mockAssessmentsForDeptHead: Assessment[] = [
  {
    id: "1",
    name: "Education Assessment",
    category: "Education",
    school: mockSchools[0],
    completedStandards: 4,
    totalStandards: 6,
    lastUpdated: "2024-07-15",
    status: "In Progress",
    dueDate: "2024-08-30",
    standards: educationStandards.map((std, idx) => 
      idx < 4 ? { ...std, rating: (idx % 3) + 2 as 2 | 3 | 4, lastUpdated: "2024-07-15" } : std
    ),
  },
  {
    id: "5",
    name: "Education Assessment",
    category: "Education",
    school: mockSchools[1],
    completedStandards: 3,
    totalStandards: 6,
    lastUpdated: "2024-07-12",
    status: "In Progress",
    dueDate: "2024-08-20",
    standards: educationStandards.map((std, idx) => 
      idx < 3 ? { ...std, rating: (idx % 2) + 2 as 2 | 3, lastUpdated: "2024-07-12" } : std
    ),
  },
  {
    id: "8",
    name: "Education Assessment",
    category: "Education",
    school: mockSchools[2],
    completedStandards: 0,
    totalStandards: 6,
    lastUpdated: "-",
    status: "Not Started",
    dueDate: "2024-09-15",
    standards: educationStandards,
  },
]; 