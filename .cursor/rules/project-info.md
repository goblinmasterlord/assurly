# Assurly Product Requirement Document (PRD)

## Quick Start for Developers

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: React Context API (UserContext, AuthContext)
- **Routing**: React Router v6 (public and protected routes)
- **Icons**: Lucide React
- **Authentication**: Magic link authentication with JWT tokens
- **Data**: API integration with enhanced caching and optimistic updates
- **Backend**: Google Cloud Run (Python/FastAPI)
- **Drag & Drop**: @dnd-kit for standards management
- **Charts**: Recharts for analytics visualization

### Key Architecture Decisions
1. **Role-based views**: Single codebase serves both MAT Admins and Department Heads with route protection
2. **Component library**: Built on shadcn/ui for consistent, accessible components
3. **Responsive design**: Mobile-first with careful breakpoint management
4. **Performance**: Lazy loading, memoization, optimistic updates, and request caching
5. **Authentication**: Magic link flow with token-based session management
6. **API Integration**: Enhanced service layer with caching, background refresh, and optimistic updates
7. **Data Persistence**: Mix of API calls for core data and sessionStorage for temporary mock data
8. **Public/Private Routes**: Marketing pages on public routes, application on `/app/*` protected routes

### Common Development Patterns
```typescript
// Icon containers (standardized sizes)
<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 border border-slate-200">
  <Icon className="h-4 w-4 text-slate-600" />
</div>

// Status badges
<Badge variant="outline" className={cn("text-xs font-medium", getStatusColor(status))}>
  {getStatusIcon(status)}
  {status}
</Badge>

// Table headers (consistent styling)
<TableHead className="font-semibold text-xs uppercase tracking-wider text-slate-600">
```

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

### Epic 0: Authentication & Security

Modern, secure authentication flow with persistent sessions.

*   **Feature: Magic Link Authentication:** Users receive a secure, time-limited link via email to access the platform without passwords.
*   **Feature: Session Management:** JWT tokens stored in localStorage ensure users stay logged in across browser sessions and page refreshes.
*   **Feature: Route Protection:** Private routes (`/app/*`) require authentication; Department Heads are restricted from Admin-only pages (Analytics, Export, Standards Management).
*   **Feature: Auto Token Refresh:** Transparent token refresh on API 401 responses maintains session continuity.
*   **Feature: SEO Protection:** Comprehensive robots.txt and meta tags prevent search engine indexing of sensitive data.

### Epic 1: Centralized Assessment Orchestration (Admin)

Administrators must have a seamless, trust-wide view to manage the assessment process from start to finish.

*   **Feature: Assessment Request & Distribution:** Admins can initiate a new assessment request, selecting the assessment category (e.g., "Finance & Procurement"), the target schools, and an optional due date through a streamlined interface (`AssessmentInvitationSheet`).
*   **Feature: Unified Assessment Dashboard:** A comprehensive dashboard (`MatAdminAssessmentsView`) provides a filterable and sortable view of all assessments across the trust. Key data points include school, category, status (Completed, In Progress, Overdue), completion progress, and overall score for completed assessments.
*   **Feature: Multiple Data Views:** Admins can toggle between a high-density `Table` view for quick scanning and a detailed `Card` view (Accordion) that provides a richer summary of each assessment without leaving the page.
*   **Feature: Drill-Down for Review:** Admins can navigate from the dashboard to a read-only view of any completed assessment (`AssessmentDetailPage`) to review the specific ratings and evidence provided by the school.

### Epic 2: Guided & Focused Self-Assessment (Dept. Head)

The assessee's journey must be optimized for clarity, efficiency, and completion.

*   **Feature: Dedicated Assessment Workspace:** Users are taken to a dedicated page (`AssessmentDetailPage`) for the specific assessment they need to complete.
*   **Feature: Standard-by-Standard Workflow:** The interface presents one standard at a time, with clear descriptions, a 4-point rating scale (`Inadequate` to `Outstanding`), and dedicated text areas for evidence/comments and action items.
*   **Feature: Real-time Progress Tracking:** A visual progress bar and a navigable list of all standards provide immediate feedback on completion status.
*   **Feature: Save & Continue / Submit:** Users can save their progress at any time and return later. Once all standards are rated, they can formally submit the assessment.
*   **Feature: Keyboard Shortcuts:** Power users can navigate between standards (`Cmd/Ctrl+J/K`), apply ratings (`1-4`), and save progress (`Cmd/Ctrl+S`) using intuitive keyboard shortcuts.
*   **Feature: Actions Pane:** Alongside comments, users can add actionable items with checkboxes to track remediation steps for each standard.
*   **Feature: Filter Persistence:** Assessment filters (category, status, school) persist in localStorage, maintaining user context across navigation.

### Epic 3: Analytics & Insights (Admin)

Data-driven insights for strategic decision making across the trust.

*   **Feature: Analytics Dashboard:** Comprehensive analytics page (`/app/analytics`) showing trust-wide performance metrics, trends, and completion rates.
*   **Feature: Term-over-Term Analysis:** Line charts showing performance trends across academic terms with proper chronological ordering (Autumn → Spring → Summer).
*   **Feature: School Performance Rankings:** Sortable table showing current scores, completion rates, and status for all schools with intervention flags.
*   **Feature: Category Performance Breakdown:** Visual breakdown of average scores by assessment category with color-coded performance zones.
*   **Feature: Term Selector:** Navigate between academic terms to view historical data and track progress over time.
*   **Feature: Interventions Tracking:** Count of aspects requiring attention (score ≤ 1.5) at school and category levels.

### Epic 4: Standards Management (Admin)

Centralized control over assessment frameworks and criteria.

*   **Feature: Standards Management Page:** Dedicated interface (`/app/standards-management`) for managing aspects and standards.
*   **Feature: Drag-and-Drop Reordering:** Standards can be reordered within aspects using intuitive drag-and-drop (@dnd-kit).
*   **Feature: Aspect Management:** Create, edit, and delete assessment aspects with validation and conflict prevention.
*   **Feature: Standard CRUD:** Full create, read, update, delete operations for individual standards within aspects.
*   **Feature: Session Storage Persistence:** Changes persist in browser session until synced with API (preparing for full API integration).
*   **Feature: Search Functionality:** Filter standards within an aspect by title, code, or description.

### Epic 5: Data Export & Reporting (Admin)

Export assessment data for external analysis and reporting.

*   **Feature: Export Page:** Dedicated page (`/app/export`) for generating CSV exports and downloading assessment packs.
*   **Feature: CSV Generation:** Export filtered assessment data to CSV format for use in Excel or other tools.
*   **Feature: Assessment Pack Downloads:** Download pre-formatted PDF documentation and guidance materials.
*   **Feature: School Filtering:** Export data for specific schools or trust-wide reports.

### Epic 6: Marketing & Public Pages

Professional public-facing website for organizational transparency.

*   **Feature: Landing Page:** Modern landing page (`/`) with value proposition and role-based navigation.
*   **Feature: About & Mission:** Information pages about Assurly's purpose and organizational mission.
*   **Feature: Pricing & Security:** Transparent pricing information and security/compliance documentation.
*   **Feature: Legal Pages:** Terms & Conditions, Data Processing Agreement, and compliance documentation.
*   **Feature: Branding:** Consistent teal and amber color scheme throughout public and private pages.

## 5. Design & UX Principles

*   **Role-Specific Clarity:** The UI is fundamentally different for each user role, ensuring that information and actions are tailored to their specific needs and goals.
*   **Data-Ink Ratio:** Dashboards and tables are designed to be information-dense but not cluttered, prioritizing scannability and quick comprehension.
*   **Progressive Disclosure:** Complex information (like the details of a completed assessment) is hidden by default and revealed through user interaction (e.g., expanding an accordion), preventing cognitive overload.
*   **Frictionless Workflows:** Key user journeys, such as requesting an assessment or completing a standard, are optimized to require the minimum number of clicks and decisions.

## 6. Developer Guidelines

### Component Hierarchy
```
src/
├── components/
│   ├── ui/           # shadcn/ui base components (modify carefully)
│   └── *.tsx         # App-specific components
├── pages/            # Route components
├── hooks/            # Custom React hooks
├── lib/              # Utilities and helpers
├── services/         # API integration layer
└── types/            # TypeScript type definitions
```

### Key Files to Know
- `src/services/enhanced-assessment-service.ts` - Assessment API integration with caching
- `src/services/auth-service.ts` - Authentication and user management
- `src/lib/api-client.ts` - Core API client with token management
- `src/lib/request-cache.ts` - Request caching and deduplication
- `src/types/assessment.ts` - Core type definitions
- `src/contexts/UserContext.tsx` - Role switching logic (development)
- `src/contexts/AuthContext.tsx` - Authentication state and session management
- `src/components/ui/filter-bar.tsx` - Reusable filter component
- `src/lib/assessment-utils.tsx` - Helper functions for data transformation
- `src/hooks/use-standards-persistence.ts` - Standards/aspects data management

### Styling Guidelines
1. **Color Palette**: 
   - Primary: Teal/green (`teal-600`, `emerald-600`) for CTAs and highlights
   - Accent: Amber/gold (`amber-500`, `amber-600`) for warnings and secondary actions
   - Neutral: Tailwind's slate scale for backgrounds and text
   - Status colors: `emerald` (success), `rose` (error/warning), `blue` (info)
2. **Spacing**: Stick to Tailwind's spacing scale (p-2, p-3, p-4, etc.)
3. **Borders**: Default to `border-slate-200` for subtle borders
4. **Shadows**: Use sparingly, prefer borders for definition
5. **Typography**: 
   - Headers: `font-semibold text-xs uppercase tracking-wider`
   - Body: `text-sm` primary, `text-xs` secondary
   - Numbers: Add `tabular-nums` for alignment
6. **Branding**: Teal and amber colors applied throughout for consistent brand identity

### State Management Patterns
- **Local state**: For UI-only concerns (modals, dropdowns)
- **Context**: For cross-component state (user role, theme)
- **URL state**: For filters and pagination (future enhancement)
- **Server state**: Mock data now, React Query planned for API

### Performance Considerations
- Memoize expensive computations with `useMemo`
- Use `React.Fragment` to avoid wrapper divs
- Lazy load routes with `React.lazy`
- Keep bundle size minimal (check with `npm run build`)

### Testing Strategy (Future)
- Unit tests: Vitest for utilities and hooks
- Component tests: React Testing Library
- E2E tests: Playwright for critical user journeys
- Visual regression: Chromatic integration planned

### API Integration
Production API integration with comprehensive caching:
- **Base URL**: `https://assurly-frontend-400616570417.europe-west2.run.app/api`
- **Services Layer**: All API calls in `src/services/` directory
- **Caching Strategy**: Request cache with stale-while-revalidate pattern
- **Optimistic Updates**: Immediate UI feedback with background sync
- **Token Management**: JWT tokens stored in localStorage with automatic refresh
- **Error Handling**: Comprehensive error boundaries and fallback UI
- **Authentication**: Magic link flow with session persistence
- **Endpoints**: See `.cursor/rules/api-documentation.md` for full API reference
