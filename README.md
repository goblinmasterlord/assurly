# Assurly - School Maturity Assessment Platform

Assurly is a production-ready web-based platform for Multi-Academy Trusts (MATs) to conduct and manage maturity assessments across their schools. The platform combines secure authentication, real-time data synchronization, and powerful analytics to streamline assessment orchestration and drive strategic improvement.

**Live Platform**: [https://www.assurly.co.uk](https://www.assurly.co.uk)

## Features

### 🔐 **Authentication & Security**
- Magic link authentication (passwordless login via email)
- JWT-based session management with automatic refresh
- Role-based access control with route protection
- Private routes for authenticated users only
- SEO protection (noindex, nofollow, robots.txt)

### 👥 **Dual User Roles**
- **MAT Administrators**: 
  - Trust-wide assessment orchestration and monitoring
  - Analytics dashboard with performance insights
  - Standards management and configuration
  - Data export and reporting capabilities
  - School performance rankings and intervention tracking
  
- **Department Heads**: 
  - Complete assessments for assigned schools
  - Cross-school assessment management
  - View assessment history and trends
  - Filter persistence for efficient workflow

### 📊 **Assessment Management**
- Advanced filtering (school, category, status, term, search)
- Term-based navigation (Autumn → Spring → Summer cycle)
- Real-time progress tracking and completion indicators
- Intervention flagging for low-performing areas (score ≤ 1.5)
- Historical performance trends (previous 3 terms visualization)
- Optimistic UI updates for instant feedback
- Auto-save functionality with session recovery

### ✍️ **Enhanced Assessment Completion**
- Standard-by-standard workflow with clear guidance
- 4-point rating scale (Inadequate → Outstanding)
- Evidence collection with rich text support
- **Actions pane**: Add actionable items with checkboxes per standard
- Keyboard shortcuts for power users:
  - `Cmd/Ctrl + J/K`: Navigate between standards
  - `1-4`: Quick rating selection
  - `Cmd/Ctrl + S`: Save progress
- Visual progress bar and completion tracking
- School switching for cross-school comparisons

### 📈 **Analytics & Insights** (MAT Admin Only)
- Trust-wide performance dashboard
- Term-over-term trend analysis with line charts
- School performance rankings with sortable metrics
- Category performance breakdown with visual zones
- Assessment completion tracking
- Intervention required indicators
- Chronologically accurate term ordering

### 🛠️ **Standards Management** (MAT Admin Only)
- Create, edit, and delete assessment aspects
- Drag-and-drop standard reordering
- Full CRUD operations for standards
- Search and filter within aspects
- Session storage persistence for changes
- Version control ready (preparing for API)

### 📤 **Data Export** (MAT Admin Only)
- CSV export of filtered assessment data
- Downloadable PDF assessment packs
- School-specific or trust-wide reports
- Excel-compatible format

### 🎨 **User Experience**
- Modern, responsive design (mobile-first)
- Teal and amber branding throughout
- Role-specific views and navigation
- Filter persistence across sessions
- Toast notifications for all actions
- Comprehensive loading states and skeleton loaders
- Smooth animations and transitions
- Context-aware help and tooltips

## Tech Stack

### Frontend
- **Framework**: Vite + React 18 + TypeScript
- **Styling**: Tailwind CSS v3 (teal/amber brand colors)
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Routing**: React Router v6 (public and protected routes)
- **Icons**: Lucide React
- **State Management**: React Context API (UserContext, AuthContext)
- **Charts**: Recharts for analytics visualization
- **Drag & Drop**: @dnd-kit for standards reordering
- **Notifications**: Sonner toast system

### Backend Integration
- **API**: Google Cloud Run (Python/FastAPI)
- **Base URL**: `https://assurly-frontend-400616570417.europe-west2.run.app/api`
- **Authentication**: JWT tokens with magic link flow
- **Caching**: Custom request cache with stale-while-revalidate
- **Storage**: 
  - `localStorage`: Auth tokens and filter persistence
  - `sessionStorage`: Temporary mock data (standards/aspects)
- **Optimistic Updates**: Immediate UI feedback with background sync

## Project Structure

```
assurly/
├── src/
│   ├── components/
│   │   ├── ui/                 # shadcn/ui base components
│   │   ├── admin/              # Admin-only components (standards management)
│   │   └── *.tsx               # Feature components (SchoolPerformanceView, etc.)
│   ├── contexts/
│   │   ├── AuthContext.tsx     # Authentication state management
│   │   └── UserContext.tsx     # Role switching (development)
│   ├── hooks/
│   │   ├── use-assessments.ts           # Assessment data with caching
│   │   ├── use-standards-persistence.ts # Standards/aspects management
│   │   └── use-optimistic-filter.ts     # Optimistic UI updates
│   ├── layouts/
│   │   └── RootLayout.tsx      # Main layout with header/footer
│   ├── lib/
│   │   ├── api-client.ts       # Core API client with token handling
│   │   ├── request-cache.ts    # Request caching layer
│   │   ├── assessment-utils.tsx # Utility functions
│   │   └── mock-data.ts        # Mock data (legacy/fallback)
│   ├── pages/
│   │   ├── Assessments.tsx     # Main assessments dashboard
│   │   ├── AssessmentDetail.tsx # Assessment completion interface
│   │   ├── Analytics.tsx        # Analytics dashboard (admin)
│   │   ├── Export.tsx           # Data export (admin)
│   │   ├── StandardsManagement.tsx # Standards config (admin)
│   │   ├── Main.tsx             # Public landing page
│   │   └── [marketing pages]    # About, Pricing, T&Cs, etc.
│   ├── services/
│   │   ├── enhanced-assessment-service.ts # Assessment API integration
│   │   ├── auth-service.ts                # Authentication API
│   │   └── secure-storage.ts              # Token storage utilities
│   ├── types/
│   │   └── assessment.ts        # TypeScript type definitions
│   └── App.tsx                  # Root component with routing
├── public/
│   ├── robots.txt               # SEO protection
│   └── Springwell_pack.pdf      # Downloadable resources
└── .cursor/rules/               # Project documentation
    ├── project-info.md          # This file
    ├── api-documentation.md     # API reference
    └── components.mdc           # Component reference
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/assurly.git
   cd assurly
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## Usage

### Authentication

1. Navigate to [https://www.assurly.co.uk](https://www.assurly.co.uk)
2. Enter your email address to receive a magic link
3. Click the link in your email to securely log in
4. Your session persists across browser closes and page refreshes

### For MAT Administrators

**Dashboard & Assessments:**
1. Navigate to "Assessments" to see trust-wide view
2. Use filters to narrow by school, category, status, or term
3. View performance trends in the "Previous 3 Terms" column
4. Check "Intervention Required" flags for schools needing attention
5. Expand schools to see category-level details
6. Click "View" to review completed assessments

**Analytics:**
1. Navigate to "Analytics" for trust-wide insights
2. Use term selector to view different academic periods
3. Review term-over-term performance trends
4. Check school performance rankings with current scores
5. Analyze category performance breakdown
6. Monitor assessment completion rates

**Standards Management:**
1. Navigate to "Standards Management"
2. Select an aspect from the sidebar
3. Drag and drop to reorder standards
4. Use the cog icon to edit/delete aspects
5. Click "Add Standard" to create new criteria
6. Search standards within an aspect

**Data Export:**
1. Navigate to "Export"
2. Select schools and filters for your export
3. Click "Generate CSV" to download assessment data
4. Download assessment pack PDFs as needed

**Quick Role Switching:**
- Use the role switcher button in the header (between username and sign out)
- Switch to "Department Head" view to test that perspective

### For Department Heads

**Viewing Assessments:**
1. Navigate to "Assessments" to see your assigned schools
2. Filters persist across sessions - set them once and forget
3. Use the term selector to switch between assessment periods
4. Click "Continue" to complete in-progress assessments
5. Click "View" to review completed assessments

**Completing Assessments:**
1. Select a standard from the left panel
2. Choose a rating (1-4) using the card interface or keyboard (1-4)
3. **Comments Tab**: Add evidence and supporting documentation
4. **Actions Tab**: Create actionable items with checkboxes for tracking
5. Navigate between standards:
   - Click "Previous"/"Next" buttons
   - Use arrow keys (← / →)
   - Use `Cmd/Ctrl + J` (next) or `Cmd/Ctrl + K` (previous)
6. Save progress:
   - Click "Save Progress"
   - Use `Cmd/Ctrl + S`
   - Auto-saves on navigation
7. Submit when all standards are complete

**Keyboard Shortcuts:**
- `→` or `Cmd/Ctrl + J`: Next standard
- `←` or `Cmd/Ctrl + K`: Previous standard
- `1-4`: Set rating (when not typing)
- `Cmd/Ctrl + S`: Save progress

**School Switching:**
- Use the school selector at the top to switch between your assigned schools
- View the same assessment category across different schools

## Development

### Environment Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open browser to http://localhost:5173
```

### Adding New UI Components

```bash
# Add shadcn/ui components
npx shadcn@latest add [component-name]

# Example: add a new dialog
npx shadcn@latest add dialog
```

### Building for Production

```bash
# Type check and build
npm run build

# Preview production build locally
npm run preview
```

### Key Development Files

- **API Integration**: See `src/services/enhanced-assessment-service.ts`
- **Authentication**: See `src/services/auth-service.ts` and `src/contexts/AuthContext.tsx`
- **Caching**: See `src/lib/request-cache.ts`
- **API Docs**: See `.cursor/rules/api-documentation.md`

### Development Patterns

**Fetching Assessments:**
```typescript
import { useAssessments } from '@/hooks/use-assessments';

const { assessments, isLoading, refreshAssessments } = useAssessments();
```

**Optimistic UI Updates:**
```typescript
import { useOptimisticFilter } from '@/hooks/use-optimistic-filter';

const { filteredData, updateFilter, isPending } = useOptimisticFilter(
  data,
  filterFn,
  300 // debounce ms
);
```

**API Calls with Caching:**
```typescript
import { enhancedAssessmentService } from '@/services/enhanced-assessment-service';

// Cached with stale-while-revalidate
const assessments = await enhancedAssessmentService.getAssessments();

// Submit with optimistic update
await enhancedAssessmentService.submitAssessment(assessmentId, standards);
```

### Deployment

The application is deployed to [https://www.assurly.co.uk](https://www.assurly.co.uk) via Vercel with automatic deployments from the `main` branch.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful, accessible components
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Lucide Icons](https://lucide.dev/) for the icon set
