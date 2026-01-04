import type { AssessmentCategory } from "@/types/assessment";

// Assessment categories for UI filters and forms
// Note: These map to aspect_code values in the v4 API
export const assessmentCategories: { value: AssessmentCategory; description: string }[] = [
  { value: "education", description: "Quality of education, behavior, leadership & management, etc." },
  { value: "hr", description: "Recruitment, absence management, staff retention, etc." },
  { value: "finance", description: "Financial governance, planning, monitoring, etc." },
  { value: "estates", description: "Health & safety, estate management, asset planning, etc." },
  { value: "governance", description: "Strategic leadership, accountability, governance structures, etc." },
  { value: "is", description: "Data security, breach management, GDPR compliance, etc." },
  { value: "it", description: "IT strategy, service management, asset management, etc." },
  { value: "safeguarding", description: "Safeguarding policies, procedures, and culture." },
  { value: "faith", description: "Faith character, collective worship, and religious education." },
];
