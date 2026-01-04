# Assurly Frontend

Modern, production-ready React-based web application for Multi-Academy Trusts (MATs) to conduct and manage maturity assessments across their schools.

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

### Framework & Core
- **Framework**: Vite + React 18 + TypeScript
- **Styling**: Tailwind CSS v3 (teal/amber brand colors)
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Routing**: React Router v6 (public and protected routes)
- **Icons**: Lucide React

### State & Data Management
- **State Management**: React Context API (UserContext, AuthContext)
- **Data Fetching**: TanStack Query (React Query)
- **Charts**: Recharts for analytics visualization
- **Drag & Drop**: @dnd-kit for standards reordering
- **Notifications**: Sonner toast system
- **Forms**: React Hook Form + Zod validation

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
assurly-frontend/
├── src/
│   ├── components/
│   │   ├── ui/                          # shadcn/ui base components (43 components)
│   │   ├── admin/                       # Admin-only components
│   │   │   ├── AspectsManager.tsx       # Aspect CRUD operations
│   │   │   ├── StandardsManager.tsx     # Standards management
│   │   │   └── ...
│   │   ├── auth/                        # Authentication components
│   │   │   └── MagicLinkForm.tsx
│   │   ├── AISummaryPanel.tsx           # AI-generated summaries
│   │   ├── AssessmentInvitationSheet.tsx
│   │   ├── BrandingCustomizationModal.tsx
│   │   ├── RoleSwitcher.tsx             # Role switching (admin/dept head)
│   │   └── SchoolPerformanceView.tsx    # School rankings
│   ├── contexts/
│   │   ├── AuthContext.tsx              # Authentication state management
│   │   └── UserContext.tsx              # Role switching (development)
│   ├── hooks/
│   │   ├── use-assessments.ts           # Assessment data with caching
│   │   ├── use-standards-persistence.ts # Standards/aspects management
│   │   ├── use-optimistic-filter.ts     # Optimistic UI updates
│   │   ├── use-keyboard-shortcuts.ts    # Keyboard navigation
│   │   ├── use-local-storage.ts         # LocalStorage hook
│   │   └── ...
│   ├── layouts/
│   │   ├── RootLayout.tsx               # Main layout with header/footer
│   │   └── PublicLayout.tsx             # Public pages layout
│   ├── lib/
│   │   ├── api-client.ts                # Core API client with token handling
│   │   ├── request-cache.ts             # Request caching layer
│   │   ├── assessment-utils.tsx         # Utility functions
│   │   ├── category-utils.tsx           # Category helpers
│   │   ├── data-transformers.ts         # Data transformation utilities
│   │   ├── secure-storage.ts            # Token storage utilities
│   │   ├── performance-utils.ts         # Performance optimization
│   │   └── mock-data.ts                 # Mock data (legacy/fallback)
│   ├── pages/
│   │   ├── Assessments.tsx              # Main assessments dashboard
│   │   ├── AssessmentDetail.tsx         # Assessment completion interface
│   │   ├── Analytics.tsx                # Analytics dashboard (admin)
│   │   ├── Export.tsx                   # Data export (admin)
│   │   ├── Reports.tsx                  # Reports page
│   │   ├── admin/
│   │   │   └── StandardsManagement.tsx  # Standards configuration
│   │   ├── auth/
│   │   │   ├── Login.tsx
│   │   │   └── MagicLinkVerify.tsx
│   │   └── [marketing pages]            # About, Pricing, Terms, etc.
│   ├── services/
│   │   ├── enhanced-assessment-service.ts # Assessment API integration
│   │   ├── assessment-service.ts          # Core assessment service
│   │   └── auth-service.ts                # Authentication API
│   ├── types/
│   │   ├── assessment.ts                # TypeScript type definitions
│   │   └── index.ts
│   ├── App.tsx                          # Root component with routing
│   ├── main.tsx                         # Application entry point
│   ├── index.css                        # Global styles
│   └── vite-env.d.ts                    # Vite type definitions
├── public/
│   ├── robots.txt                       # SEO protection
│   ├── favicon.svg
│   └── Springwell_pack.pdf              # Downloadable resources
├── dist/                                # Production build output
├── package.json                         # Dependencies and scripts
├── vite.config.ts                       # Vite configuration
├── tsconfig.json                        # TypeScript configuration
├── tsconfig.app.json                    # App-specific TS config
├── tsconfig.node.json                   # Node-specific TS config
├── tailwind.config.js                   # Tailwind CSS configuration
├── postcss.config.js                    # PostCSS configuration
├── eslint.config.js                     # ESLint configuration
├── components.json                      # shadcn/ui configuration
├── vercel.json                          # Vercel deployment config
├── test-auth-flow.js                    # Auth flow testing
└── test-verify.js                       # Token verification testing
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Navigate to the frontend directory:
   ```bash
   cd assurly-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## Available Scripts

### Development

```bash
# Start development server with hot reload
npm run dev

# Start mock API server (uses json-server with db.json)
npm run mock:api
```

### Building

```bash
# Type check and build for production
npm run build

# Preview production build locally
npm run preview
```

### Code Quality

```bash
# Run ESLint
npm run lint
```

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

### Key Development Patterns

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

**Authentication:**
```typescript
import { useAuth } from '@/contexts/AuthContext';

const { user, isAuthenticated, login, logout } = useAuth();
```

## API Integration

The frontend integrates with the Assurly Backend API. See the backend documentation for complete API reference:

- **Backend API Documentation**: `../assurly-backend/API_DOCUMENTATION.md`
- **API Base URL**: `https://assurly-frontend-400616570417.europe-west2.run.app/api`
- **Frontend API Spec**: `../docs/api/FRONTEND_API_SPECIFICATION_v4.md`

### Key Endpoints

- `POST /api/auth/request-magic-link` - Request passwordless login
- `GET /api/auth/verify/{token}` - Verify magic link
- `GET /api/assessments` - Fetch assessments
- `POST /api/assessments/{id}/submit` - Submit assessment
- `GET /api/aspects` - Fetch aspects
- `GET /api/standards` - Fetch standards

## Deployment

### Vercel (Production)

The application is deployed to [https://www.assurly.co.uk](https://www.assurly.co.uk) via Vercel with automatic deployments from the `main` branch.

Configuration is in `vercel.json`:
- Redirects configured for clean URLs
- Headers for security and caching
- Environment variables for API URL

### Manual Deployment

```bash
# Build the project
npm run build

# Deploy the dist/ folder to your hosting service
```

## Environment Variables

Create a `.env` file in the frontend directory:

```env
# API Configuration
VITE_API_BASE_URL=https://assurly-frontend-400616570417.europe-west2.run.app
VITE_FRONTEND_URL=https://www.assurly.co.uk

# Feature Flags (optional)
VITE_ENABLE_MOCK_API=false
```

## Testing

### Manual Testing

1. **Authentication Flow**: Use `test-auth-flow.js`
2. **Token Verification**: Use `test-verify.js`
3. **Browser Testing**: Test all user flows in Chrome, Firefox, Safari
4. **Mobile Testing**: Test responsive design on mobile devices

### Testing Checklist

See `../TESTING_CHECKLIST.md` for comprehensive testing procedures.

## Documentation

### Frontend Documentation
- **README**: This file
- **API Specification**: `../docs/api/FRONTEND_API_SPECIFICATION_v4.md`
- **Migration Guides**: `../docs/archive/`

### Related Documentation
- **Backend API**: `../assurly-backend/README.md`
- **Project Docs**: `../docs/`
- **Bug Fixes**: `../BUGFIX_SUMMARY.md`

## Architecture Decisions

### Why Vite?
- Fast HMR (Hot Module Replacement)
- Modern build tool optimized for React
- Better DX than Create React App

### Why shadcn/ui?
- Accessible components out of the box
- Full control over component code
- Built on Radix UI primitives
- Tailwind CSS integration

### Why Context API?
- Sufficient for current app complexity
- No need for Redux/Zustand overhead
- Built into React
- Easy to migrate to Zustand if needed

### Why TanStack Query?
- Powerful caching and synchronization
- Automatic background refetching
- Optimistic updates support
- Better than custom fetch hooks

## Performance Optimization

- **Code Splitting**: Route-based code splitting with React.lazy
- **Asset Optimization**: Vite automatically optimizes assets
- **Caching Strategy**: Stale-while-revalidate for API calls
- **Lazy Loading**: Images and heavy components lazy loaded
- **Bundle Size**: Monitored and optimized regularly

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

Mobile browsers supported on iOS Safari and Chrome for Android.

## Contributing

### Code Style
- Follow existing TypeScript patterns
- Use functional components with hooks
- Implement proper error boundaries
- Add proper TypeScript types (avoid `any`)
- Use Tailwind CSS for styling
- Follow component structure in existing code

### Commit Guidelines
- Use descriptive commit messages
- Reference issues/tickets when applicable
- Keep commits focused and atomic

## Troubleshooting

### Common Issues

**Port 5173 already in use:**
```bash
# Kill the process using port 5173
npx kill-port 5173
npm run dev
```

**Module not found errors:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**API CORS errors:**
- Check that vite.config.ts proxy is configured correctly
- Ensure backend CORS settings allow your frontend origin

**Authentication not working:**
- Clear localStorage and sessionStorage
- Check that backend is running and accessible
- Verify JWT tokens are not expired

**Build errors:**
```bash
# Clean build and retry
rm -rf dist
npm run build
```

## License

Proprietary - Harbour Learning Trust

---

**Last Updated**: January 2026  
**Version**: 2.0.0  
**Maintained by**: Assurly Development Team

