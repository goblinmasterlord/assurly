# Assurly Product Requirement Document (PRD)

## 1. Vision & Opportunity

**Assurly** is a strategic assessment platform designed to provide Multi-Academy Trusts (MATs) with a clear, consistent, and data-driven framework for evaluating school maturity and compliance. In an environment demanding ever-higher standards of governance and performance, Assurly replaces fragmented spreadsheets and manual processes with a centralized, intuitive, and scalable solution. Our vision is to empower educational leaders to drive targeted improvements by transforming raw assessment data into actionable strategic insights.

## 2. Product Goals

*   **For MAT Administrators:** To deliver a powerful, trust-wide command center for orchestrating the entire assessment lifecycle. This includes initiating assessment requests, monitoring real-time completion status across all schools, and analyzing aggregated performance data to identify trends, celebrate strengths, and address systemic risks.
*   **For School Department Heads:** To provide a focused, frictionless, and supportive interface for completing assigned assessments. The experience must be intuitive, guiding users through each standard, facilitating the submission of evidence, and providing clarity on expectations and deadlines.
*   **For the Business:** To establish Assurly as the indispensable platform for MAT-level quality assurance. We aim to build a scalable, secure, and maintainable product that becomes the gold standard for demonstrating robust oversight and driving continuous improvement across the trust.

## 3. User Personas

*   **Priya (MAT Administrator):** A Director of Education or Central Operations Lead. Priya is accountable for quality assurance across the trust. She needs a high-level, filterable dashboard to see which schools have completed which assessments, identify overdue tasks, and compare performance across different domains (e.g., Education, Finance, HR). Her primary goal is to ensure 100% compliance and to use the data to inform strategic support for her schools.
*   **David (School Department Head):** The Head of Science at a secondary academy. David is tasked with completing the annual "Education" assessment for his department. He needs to clearly understand each standard, provide a rating based on a defined scale, and attach relevant evidence. His experience must be efficient and self-contained, allowing him to save progress and complete the task without ambiguity.

## 4. Core Epics & Features

### Epic 1: Centralized Assessment Orchestration (Admin)

Administrators must have a seamless, trust-wide view to manage the assessment process from start to finish.

*   **Feature: Assessment Request & Distribution:** Admins can initiate a new assessment request, selecting the assessment category (e.g., "Finance & Procurement"), the target schools, and an optional due date through a streamlined interface (`AssessmentInvitationSheet`).
*   **Feature: Unified Assessment Dashboard:** A comprehensive dashboard (`MatAdminAssessmentsView`) provides a filterable and sortable view of all assessments across the trust. Key data points include school, category, status (Completed, In Progress, Overdue), completion progress, and overall score for completed assessments.
*   **Feature: Multiple Data Views:** Admins can toggle between a high-density `Table` view for quick scanning and a detailed `Card` view (Accordion) that provides a richer summary of each assessment without leaving the page.
*   **Feature: Drill-Down for Review:** Admins can navigate from the dashboard to a read-only view of any completed assessment (`AssessmentDetailPage`) to review the specific ratings and evidence provided by the school.

### Epic 2: Guided & Focused Self-Assessment (Dept. Head)

The assessee's journey must be optimized for clarity, efficiency, and completion.

*   **Feature: Dedicated Assessment Workspace:** Users are taken to a dedicated page (`AssessmentDetailPage`) for the specific assessment they need to complete.
*   **Feature: Standard-by-Standard Workflow:** The interface presents one standard at a time, with clear descriptions, a 4-point rating scale (`Inadequate` to `Outstanding`), and a dedicated text area for evidence and comments.
*   **Feature: Real-time Progress Tracking:** A visual progress bar and a navigable list of all standards provide immediate feedback on completion status.
*   **Feature: Save & Continue / Submit:** Users can save their progress at any time and return later. Once all standards are rated, they can formally submit the assessment.
*   **Feature: Keyboard Shortcuts:** Power users can navigate between standards, apply ratings, and save progress using intuitive keyboard shortcuts, significantly speeding up the completion process.

## 5. Design & UX Principles

*   **Role-Specific Clarity:** The UI is fundamentally different for each user role, ensuring that information and actions are tailored to their specific needs and goals.
*   **Data-Ink Ratio:** Dashboards and tables are designed to be information-dense but not cluttered, prioritizing scannability and quick comprehension.
*   **Progressive Disclosure:** Complex information (like the details of a completed assessment) is hidden by default and revealed through user interaction (e.g., expanding an accordion), preventing cognitive overload.
*   **Frictionless Workflows:** Key user journeys, such as requesting an assessment or completing a standard, are optimized to require the minimum number of clicks and decisions.
