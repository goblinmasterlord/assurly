import type { 
  Assessment, 
  AssessmentCategory, 
  AcademicTerm,
  School, 
  Standard, 
  User
} from "@/types/assessment";

// #region Core Mock Data

export const mockSchools: School[] = [
  { id: "1", name: "Oak Hill Academy", code: "OHA" },
  { id: "2", name: "Maple Grove School", code: "MGS" },
  { id: "3", name: "Cedar Park Primary", code: "CPP" },
  { id: "4", name: "Willow High School", code: "WHS" },
  { id: "5", name: "Birch Tree College", code: "BTC" }
];

export const mockUsers: User[] = [
  { id: "1", name: "Alex Johnson", email: "alex.johnson@oakhill.edu", role: "Head of Education" },
  { id: "2", name: "Sam Williams", email: "sam.williams@maplegroveschool.edu", role: "Finance Director" },
  { id: "3", name: "Jordan Smith", email: "jordan.smith@cedarpark.edu", role: "IT Manager" },
  { id: "4", name: "Taylor Brown", email: "taylor.brown@willowhigh.edu", role: "Head of HR" },
  { id: "5", name: "Casey Jones", email: "casey.jones@birchtree.edu", role: "Estates Manager" }
];

export const assessmentCategories: { value: AssessmentCategory; description: string }[] = [
  { value: "education", description: "Quality of education, behavior, leadership & management, etc." },
  { value: "hr", description: "Recruitment, absence management, staff retention, etc." },
  { value: "finance", description: "Financial governance, planning, monitoring, etc." },
  { value: "estates", description: "Health & safety, estate management, asset planning, etc." },
  { value: "governance", description: "Strategic leadership, accountability, governance structures, etc." },
  { value: "is", description: "Data security, breach management, GDPR compliance, etc." },
  { value: "it", description: "IT strategy, service management, asset management, etc." },
];

// #endregion

// #region Standards Definitions

export const educationStandards: Standard[] = [
  { id: "es1", code: "ES1", title: "Quality of Education", description: "Curriculum intent, implementation, and impact. Focus on sequencing, ambition, progression, and outcomes across all key stages.", rating: null },
  { id: "es2", code: "ES2", title: "Behaviour & Attitudes", description: "Standards of behaviour, attendance, punctuality, and attitudes to learning. Evidence of a safe and respectful learning environment.", rating: null },
  { id: "es3", code: "ES3", title: "Personal Development", description: "Opportunities for spiritual, moral, social, and cultural development. Focus on character, citizenship, enrichment, and pupil wellbeing.", rating: null },
  { id: "es4", code: "ES4", title: "Leadership & Management", description: "Visionary and ethical leadership at all levels. Effective governance, safeguarding, staff development, and accountability structures.", rating: null },
  { id: "es5", code: "ES5", title: "Early Years Education", description: "High-quality early education provision. Emphasis on communication, physical development, literacy, and preparing children for Year 1.", rating: null },
  { id: "es6", code: "ES6", title: "Sixth Form Provision", description: "Quality, ambition, and impact of post-16 education. Focus on destinations, progression pathways, curriculum breadth, and outcomes.", rating: null },
];

export const hrStandards: Standard[] = [
  { id: "hr1", code: "HR1", title: "Safer Recruitment Practice", description: "Compliance with safer recruitment policies, including pre-employment checks, DBS clearances, and reference validation. Evidence of policy implementation and audit trails.", rating: null },
  { id: "hr2", code: "HR2", title: "Sickness Absence Management", description: "Monitoring of short- and long-term absence trends, with evidence of interventions, return-to-work processes, and supportive occupational health access.", rating: null },
  { id: "hr3", code: "HR3", title: "People Conduct & Case Management", description: "Oversight of disciplinary, grievance, and capability procedures. Assurance of timely, fair, and legally compliant case handling.", rating: null },
  { id: "hr4", code: "HR4", title: "Staff Retention & Engagement", description: "Annual turnover rates, pulse surveys, exit interview themes, and evidence of actions taken to improve employee satisfaction and retention.", rating: null },
  { id: "hr5", code: "HR5", title: "Vacancy Rates & Recruitment Efficiency", description: "Vacancy levels by role and site, time-to-fill metrics, and the impact on service delivery. Evaluation of recruitment campaign success and strategic workforce planning.", rating: null },
];

export const financeStandards: Standard[] = [
  { id: "fm1", code: "FM1", title: "Financial Governance & Management", description: "Robust financial leadership, compliance with statutory duties, oversight by the board and audit committee, and alignment with the Academies Financial Handbook.", rating: null },
  { id: "fm2", code: "FM2", title: "Strategic Financial Planning", description: "Multi-year budgeting aligned to organisational priorities. Evidence of sensitivity analysis, scenario planning, and sustainability modelling.", rating: null },
  { id: "fm3", code: "FM3", title: "In-Year Financial Monitoring", description: "Monthly reporting to leaders and trustees, including forecast outturns, variance analysis, and corrective actions. Timeliness and accuracy of information.", rating: null },
  { id: "fm4", code: "FM4", title: "Financial Processing & Internal Controls", description: "Compliance with procurement policy, authorisation limits, segregation of duties, bank reconciliations, and fraud prevention measures.", rating: null },
  { id: "fm5", code: "FM5", title: "Value for Money (VfM) Assurance", description: "Evidence of cost-effectiveness, benchmarking, procurement efficiencies, and review of contracts to ensure outcomes justify expenditure.", rating: null },
  { id: "fm6", code: "FM6", title: "Asset & Estate Strategy", description: "Asset management plans aligned to strategic priorities, including lifecycle planning, capital projects oversight, and statutory compliance.", rating: null },
  { id: "fm7", code: "FM7", title: "Payroll Management", description: "Accuracy, timeliness, and reconciliation of payroll. Compliance with PAYE, pensions, and statutory reporting. Integration with HR systems.", rating: null },
  { id: "fm8", code: "FM8", title: "Insurance & Risk Mitigation", description: "Adequacy of cover, alignment with risk profile, and annual review of insurance policies. Evidence of claims management and cost control.", rating: null },
];

export const estatesStandards: Standard[] = [
  { id: "bo1", code: "BO1", title: "Health & Safety Compliance", description: "Compliance with statutory Health & Safety legislation and regulations, including fire safety, risk assessments, COSHH, and training. Evidence of regular audits and incident reporting.", rating: null },
  { id: "bo2", code: "BO2", title: "Estate Statutory Compliance", description: "Assurance that buildings meet all statutory requirements (e.g., asbestos, water hygiene, gas, electrical, accessibility). Documented compliance checks and remedial action tracking.", rating: null },
  { id: "bo3", code: "BO3", title: "Estate Management & Maintenance", description: "Planned and reactive maintenance schedules in place and monitored. Assessment of estate condition, site security, and effective use of facilities.", rating: null },
  { id: "bo4", code: "BO4", title: "Strategic Asset & Estate Planning", description: "Long-term strategy for asset use, condition improvement, energy efficiency, and sustainability. Integration with educational and organisational planning.", rating: null },
  { id: "bo5", code: "BO5", title: "Estates Procurement & Contract Management", description: "Compliance with procurement policy, including tendering, contract monitoring, and supplier performance. Focus on risk, quality, and value.", rating: null },
  { id: "bo6", code: "BO6", title: "Catering & Cleaning Service Quality", description: "Monitoring of quality, safety, and value of outsourced or in-house catering and cleaning services. Includes satisfaction feedback and compliance with food safety and hygiene standards.", rating: null },
];

export const governanceStandards: Standard[] = [
  { id: "eg1", code: "EG1", title: "Strategic Leadership", description: "Clear vision, ethos, and strategic direction set and monitored by the board. Evidence of alignment to trust-wide priorities and improvement plans.", rating: null },
  { id: "eg2", code: "EG2", title: "Accountability for Educational and Financial Performance", description: "Robust oversight of educational outcomes, safeguarding, and financial performance. Challenge and support provided to executive leaders.", rating: null },
  { id: "eg3", code: "EG3", title: "Governance Capacity & Skills", description: "Effective recruitment, induction, and development of trustees and governors. Skills audit and succession planning in place.", rating: null },
  { id: "eg4", code: "EG4", title: "Governance Structures", description: "Appropriate and compliant governance structures established at trust and school level. Clarity of roles, responsibilities, and delegation.", rating: null },
  { id: "eg5", code: "EG5", title: "Legal & Regulatory Compliance", description: "Compliance with statutory and regulatory duties, including safeguarding, data protection, financial reporting, and charitable obligations.", rating: null },
  { id: "eg6", code: "EG6", title: "Evaluation & Continuous Improvement", description: "Regular self-evaluation of governance effectiveness, including external reviews. Evidence of learning, improvement actions, and impact.", rating: null },
];

export const itInformationStandards: Standard[] = [
  { id: "is1", code: "IS1", title: "Data Security & Protection", description: "Compliance with GDPR, UK Data Protection Act, and trust policies. Includes data minimisation, encryption, access control, and secure storage.", rating: null },
  { id: "is2", code: "IS2", title: "Data Breach Management", description: "Robust breach response process, including reporting, investigation, containment, and ICO notification (where required). Evidence of learning and mitigation.", rating: null },
  { id: "is3", code: "IS3", title: "Freedom of Information (FOI)", description: "Compliance with FOI legislation. Timely and accurate handling of public information requests, with central oversight and record-keeping.", rating: null },
  { id: "is4", code: "IS4", title: "Subject Access Requests (SARs)", description: "Effective and compliant management of SARs. Evidence of process adherence, redaction practices, and response timeliness.", rating: null },
  { id: "is5", code: "IS5", title: "Data Quality & Integrity", description: "Assurance that data is accurate, complete, consistent, and fit for purpose. Processes in place for regular validation, reconciliation, and cleansing.", rating: null },
  { id: "is6", code: "IS6", title: "Information Systems Management", description: "Effective oversight of MIS, data platforms, and digital tools. Focus on integration, user access, licensing, and alignment to operational needs.", rating: null },
];

export const itStrategyStandards: Standard[] = [
  { id: "it1", code: "IT1", title: "IT & Digital Aspects", description: "A trust-wide strategy that aligns IT investment with educational, operational, and transformation priorities. Reviewed regularly and board-approved.", rating: null },
  { id: "it2", code: "IT2", title: "IT Service Management & Support", description: "Reliable, efficient IT support that meets user needs. Includes helpdesk data, uptime reporting, SLAs, and continuous service improvement.", rating: null },
  { id: "it3", code: "IT3", title: "Compliance with DfE Technology Standards", description: "Systems and infrastructure aligned with Department for Education standards for broadband, devices, cybersecurity, and cloud services.", rating: null },
  { id: "it4", code: "IT4", title: "IT Asset & Lifecycle Management", description: "Central register of IT assets, with lifecycle planning, secure disposal, and cost-effective procurement and maintenance processes.", rating: null },
];

const allStandards = {
  "education": educationStandards,
  "hr": hrStandards,
  "finance": financeStandards,
  "estates": estatesStandards,
  "governance": governanceStandards,
  "is": itInformationStandards,
  "it": itStrategyStandards,
};

// #endregion

// #region Generated Mock Assessments

const generateAssessmentsForSchool = (school: School, term: AcademicTerm = "Summer", academicYear: string = "2024-2025"): Assessment[] => {
  const assessments: Assessment[] = [];
  let idCounter = parseInt(school.id) * 100 + (term === "Spring" ? 1000 : 0); // Offset historical assessments

  // Define school performance profiles to generate more realistic, varied data.
  const schoolProfiles: { [key: string]: { performance: 'high' | 'average' | 'low' | 'new' } } = {
    "1": { performance: "high" },   // Oak Hill Academy: High performer
    "2": { performance: "average" },// Maple Grove School: Average performer
    "3": { performance: "average" },// Cedar Park Primary: Average performer
    "4": { performance: "low" },    // Willow High School: Low performer, some issues
    "5": { performance: "new" }     // Birch Tree College: New, mostly not started
  };

  const profile = schoolProfiles[school.id];
  const isHistorical = term === "Spring"; // Previous term data

  assessmentCategories.forEach(categoryInfo => {
    const standards = allStandards[categoryInfo.value];
    const totalStandards = standards.length;
    let status: "Completed" | "In Progress" | "Not Started" | "Overdue";
    let completedStandards = 0;
    let ratings: (1 | 2 | 3 | 4)[] = [];

    if (isHistorical) {
      // Historical assessments are all completed
      status = "Completed";
      completedStandards = totalStandards;

      // Generate historical scores with some variation from current scores
      switch (profile.performance) {
        case "high": // High performer: Slightly lower scores than current
          ratings = Array(totalStandards).fill(0).map(() => {
            const rand = Math.random();
            if (rand < 0.7) return 4;
            if (rand < 0.95) return 3;
            return 2;
          });
          break;

        case "low": // Low performer: Slightly higher scores than current (showing improvement)
          ratings = Array(totalStandards).fill(0).map(() => {
            const rand = Math.random();
            if (rand < 0.6) return 2;
            if (rand < 0.85) return 1;
            return 3;
          });
          // Add a few critical issues for Willow High School only
          if (school.id === "4" && ["education", "governance"].includes(categoryInfo.value)) {
            ratings = ratings.map((rating, idx) => idx < 2 ? 1 : rating); // First 2 standards are critical
          }
          break;

        case "new": // New school: Lower scores (they were still developing)
          ratings = Array(totalStandards).fill(0).map(() => {
            const rand = Math.random();
            if (rand < 0.5) return 2;
            if (rand < 0.8) return 3;
            return 1;
          });
          break;

        default: // Average performer: Similar to current with slight variation
          ratings = Array(totalStandards).fill(0).map(() => {
            const rand = Math.random();
            if (rand < 0.4) return 2;
            if (rand < 0.8) return 3;
            return Math.random() < 0.7 ? 3 : 2;
          });
          break;
      }
    } else {
      // Current term logic (unchanged from original)
      switch (profile.performance) {
        case "high": // High performer: Mostly completed, high scores
          const highPerfChance = Math.random();
          if (highPerfChance < 0.8) { // 80% completed
            status = "Completed";
            completedStandards = totalStandards;
            ratings = Array(totalStandards).fill(0).map(() => (Math.random() < 0.85 ? 4 : 3)); // More consistently high scores
          } else if (highPerfChance < 0.95) { // 15% in progress
            status = "In Progress";
            completedStandards = Math.floor(totalStandards * (Math.random() * 0.5 + 0.4));
            ratings = Array(completedStandards).fill(0).map(() => (Math.random() < 0.75 ? 4 : 3)); // Also high scores for in-progress
          } else { // 5% not started
            status = "Not Started";
            completedStandards = 0;
          }
          break;

        case "low": // Low performer: Low scores, but fewer intervention required issues
          const lowPerfChance = Math.random();
          if (lowPerfChance < 0.2) { // 20% completed
            status = "Completed";
            completedStandards = totalStandards;
            // Scores are lower, but not always critical. Mix of 1s and 2s, favouring 2s.
            ratings = Array(totalStandards).fill(0).map(() => (Math.random() < 0.7 ? 2 : 1));
          } else if (lowPerfChance < 0.6) { // 40% in progress
            status = "In Progress";
            completedStandards = Math.floor(totalStandards * (Math.random() * 0.4));
            ratings = Array(completedStandards).fill(0).map(() => (Math.random() < 0.8 ? 2 : 1));
          } else { // 40% not started
            status = "Not Started";
            completedStandards = 0;
          }
          // Lower chance of being overdue to reduce "critical" alerts
          if (status === "In Progress" && Math.random() < 0.25) {
            status = "Overdue";
          }
          break;

        case "new": // New school: Mostly not started
          if (Math.random() < 0.1) { // 10% in progress
            status = "In Progress";
            completedStandards = Math.floor(totalStandards * (Math.random() * 0.3));
            ratings = Array(completedStandards).fill(0).map(() => 3); // Doing okay on the one they started
          } else { // 90% not started
            status = "Not Started";
            completedStandards = 0;
          }
          break;

        default: // Average performer
          const avgPerfChance = Math.random();
          if (avgPerfChance < 0.6) { // 60% completed
            status = "Completed";
            completedStandards = totalStandards;
            ratings = Array(totalStandards).fill(0).map(() => (Math.floor(Math.random() * 2) + 2) as 2 | 3);
          } else if (avgPerfChance < 0.9) { // 30% in progress
            status = "In Progress";
            completedStandards = Math.floor(totalStandards * (Math.random() * 0.6 + 0.2));
            ratings = Array(completedStandards).fill(0).map(() => (Math.floor(Math.random() * 2) + 2) as 2 | 3);
          } else { // 10% not started
            status = "Not Started";
            completedStandards = 0;
          }
          if (status === "In Progress" && Math.random() < 0.15) {
            status = "Overdue";
          }
          break;
      }
    }

    // --- Dynamic Date Generation ---
    const now = new Date();
    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    const randomPastDate = (months: number) => {
      const d = new Date(now);
      d.setMonth(d.getMonth() - (Math.random() * months));
      d.setDate(Math.floor(Math.random() * 28) + 1);
      return d;
    };
    const randomFutureDate = (months: number) => {
      const d = new Date(now);
      d.setMonth(d.getMonth() + (Math.random() * months) + 1);
      d.setDate(Math.floor(Math.random() * 28) + 1);
      return d;
    };

    // Historical date adjustment
    const randomHistoricalDate = () => {
      const d = new Date('2025-04-01'); // Spring term completion
      d.setDate(d.getDate() + Math.floor(Math.random() * 30) - 15); // ±15 days variation
      return d;
    };

    let lastUpdated = "-";
    let dueDate: string | undefined = undefined;

    if (isHistorical) {
      // All historical assessments are completed
      lastUpdated = formatDate(randomHistoricalDate());
    } else {
      // Current term date logic
      switch (status) {
        case "Completed":
          lastUpdated = formatDate(randomPastDate(5));
          break;
        case "In Progress":
          lastUpdated = formatDate(randomPastDate(2));
          dueDate = formatDate(randomFutureDate(3));
          break;
        case "Overdue":
          lastUpdated = formatDate(randomPastDate(3));
          dueDate = formatDate(randomPastDate(1));
          break;
        case "Not Started":
          dueDate = formatDate(randomFutureDate(4));
          break;
      }
    }

    const assessment: Assessment = {
      id: `${idCounter++}`,
      name: `${categoryInfo.value} Assessment`,
      category: categoryInfo.value,
      school,
      completedStandards,
      totalStandards,
      lastUpdated,
      status,
      dueDate,
      assignedTo: [mockUsers[Math.floor(Math.random() * mockUsers.length)]],
      standards: standards.map((std, idx) => {
        if (idx < completedStandards) {
          return {
            ...std,
            rating: ratings[idx],
            evidence: `Evidence for ${std.title} has been documented and reviewed.`,
          };
        }
        return { ...std, rating: null, evidence: "" }; // Ensure non-completed have null rating and empty evidence
      }),
      term,
      academicYear
    };
    assessments.push(assessment);
  });

  return assessments;
};

// Generate current term assessments (unchanged)
const currentTermAssessments = mockSchools.flatMap(school => 
  generateAssessmentsForSchool(school, "Summer", "2024-2025")
);

// Generate historical assessments for previous term
const historicalAssessments = mockSchools.flatMap(school => 
  generateAssessmentsForSchool(school, "Spring", "2024-2025")
);

// Combine all assessments
export const mockAssessmentsAdmin: Assessment[] = [...currentTermAssessments, ...historicalAssessments];

// Department Head now sees ALL assessments across all schools and departments for unified oversight
// This provides a comprehensive view of the entire trust's assessment landscape
export const mockAssessmentsForDeptHead: Assessment[] = mockAssessmentsAdmin.map(assessment => ({
  ...assessment,
  // Ensure all assessments are assigned to Alex Johnson for the unified view
  assignedTo: [mockUsers[0]] // Alex Johnson
}));

// #endregion
