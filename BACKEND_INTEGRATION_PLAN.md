# Assurly Backend Integration Plan

## Overview
This plan outlines the step-by-step process to transform the Assurly frontend from using mock data to connecting with the real backend API and BigQuery database. The plan is designed to be beginner-friendly with clear milestones for verification.

## Current State Analysis
- **Frontend**: React + Vite with TypeScript, well-structured mock data
- **Backend**: Simple API with GET/POST endpoints (`/api/assessments`)
- **Database**: BigQuery with defined schema (mats, schools, areas, standards, assessments)
- **User Roles**: MAT Administrator and Department Head
- **Data Flow**: Currently uses static mock data from `src/lib/mock-data.ts`

## Integration Strategy
We'll follow a progressive approach, starting with simple read operations and gradually moving to complex operations. Each phase builds on the previous one with verification checkpoints.

---

## Phase 1: Foundation & API Infrastructure
**Goal**: Set up the basic infrastructure for API communication
**Duration**: ~2-3 hours

### Step 1.1: Environment Configuration
- [ ] Create `.env.local` file for API base URL and configuration
- [ ] Add environment variables for development/production API endpoints
- [ ] Update `vite.config.ts` to handle environment variables properly
- [ ] Test environment variable loading

### Step 1.2: API Client Setup
- [ ] Install HTTP client dependencies (`axios` or use native `fetch`)
- [ ] Create `src/lib/api-client.ts` with base configuration
- [ ] Add request/response interceptors for error handling
- [ ] Create basic type definitions for API responses

### Step 1.3: Error Handling Foundation
- [ ] Create error types and handling utilities
- [ ] Set up global error boundary (optional but recommended)
- [ ] Add toast notifications for API errors

**Milestone 1 Verification**: 
- Environment variables load correctly
- API client can make basic HTTP requests
- Error handling displays user-friendly messages

---

## Phase 2: Data Mapping & Type Alignment
**Goal**: Map frontend types to backend schema and create data transformation utilities
**Duration**: ~3-4 hours

### Step 2.1: Backend Schema Analysis
- [ ] Map BigQuery schema to frontend types
- [ ] Identify data transformation needs between frontend and backend
- [ ] Create API response type definitions

### Step 2.2: Data Transformation Layer
- [ ] Create `src/lib/data-transformers.ts` for converting API data to frontend types
- [ ] Build utilities to transform backend assessment data to frontend `Assessment` type
- [ ] Create utilities for converting frontend form data to backend format
- [ ] Handle date formatting and other data type conversions

### Step 2.3: API Service Layer
- [ ] Create `src/services/assessment-service.ts` for assessment-related API calls
- [ ] Create `src/services/school-service.ts` for school-related API calls
- [ ] Create `src/services/user-service.ts` for user-related operations
- [ ] Implement basic CRUD operations with proper typing

**Milestone 2 Verification**:
- Data transformers correctly convert between frontend and backend formats
- API service layer methods are properly typed
- Test data transformation with sample backend responses

---

## Phase 3: Read Operations - Basic Data Fetching
**Goal**: Replace mock data with real API calls for displaying data
**Duration**: ~4-5 hours

### Step 3.1: Schools and Users Data
- [ ] Create API endpoint for fetching schools data
- [ ] Replace `mockSchools` usage with API call
- [ ] Create API endpoint for fetching user data (if needed)
- [ ] Update components that use schools data

### Step 3.2: Assessment Data - Read Only
- [ ] Implement `getAssessments()` function to fetch from `/api/assessments`
- [ ] Create query parameters for filtering (by school, category, term, etc.)
- [ ] Replace `mockAssessmentsAdmin` and `mockAssessmentsForDeptHead` in components
- [ ] Update `AssessmentsPage` to use real data

### Step 3.3: Assessment Details
- [ ] Implement `getAssessmentById()` function
- [ ] Update `AssessmentDetailPage` to fetch real assessment data
- [ ] Handle loading states and error states in components
- [ ] Ensure proper data caching or refetching as needed

**Milestone 3 Verification**:
- All list views show real data from backend
- Assessment detail pages load real assessment data
- Loading and error states work correctly
- No more references to mock data for read operations

---

## Phase 4: Loading States & Error Handling
**Goal**: Improve user experience with proper loading and error states
**Duration**: ~2-3 hours

### Step 4.1: Loading States
- [ ] Add loading spinners/skeletons to data-heavy components
- [ ] Implement loading states for `AssessmentsPage`
- [ ] Implement loading states for `AssessmentDetailPage`
- [ ] Create reusable loading components

### Step 4.2: Enhanced Error Handling
- [ ] Add retry mechanisms for failed requests
- [ ] Implement offline/network error handling
- [ ] Add proper error messages for different error types
- [ ] Test error scenarios and user experience

**Milestone 4 Verification**:
- Loading states provide good user feedback
- Error states are user-friendly and actionable
- Network issues are handled gracefully

---

## Phase 5: Write Operations - Creating and Updating Data
**Goal**: Implement assessment submission and creation functionality
**Duration**: ~5-6 hours

### Step 5.1: Assessment Submission
- [x] Implement `submitAssessment()` function for POST to `/api/assessments`
- [x] Update `AssessmentDetailPage` to submit real data
- [x] Handle form validation and submission states
- [x] Add success feedback and navigation after submission

### Step 5.2: Assessment Creation (Admin)
- [x] Implement assessment invitation/creation workflow
- [x] Update `AssessmentInvitationSheet` to create real assessments
- [x] Handle batch creation for multiple schools
- [x] Add proper validation and error handling

### Step 5.3: Data Persistence
- [x] Implement auto-save for assessment progress
- [x] Handle optimistic updates for better UX
- [x] Add conflict resolution for concurrent edits
- [x] Test data persistence across page refreshes

**Milestone 5 Verification**:
- Department heads can submit real assessments
- MAT admins can create and assign assessments
- Data persists correctly in the database
- No data loss during form interactions

---

## Phase 6: Advanced Features & Performance
**Goal**: Implement caching, real-time updates, and performance optimizations
**Duration**: ~3-4 hours

### Step 6.1: Data Caching
- [ ] Implement React Query or similar for data caching
- [ ] Add cache invalidation strategies
- [ ] Optimize API calls to reduce redundant requests
- [ ] Implement background refetching for stale data

### Step 6.2: Real-time Features (Optional)
- [ ] Consider WebSocket connection for live updates
- [ ] Implement real-time assessment status updates
- [ ] Add notifications for new assessment assignments

### Step 6.3: Performance Optimization
- [ ] Implement pagination for large datasets
- [ ] Add search and filtering at the API level
- [ ] Optimize bundle size and loading performance
- [ ] Add performance monitoring

**Milestone 6 Verification**:
- App performs well with large datasets
- Data stays fresh without excessive API calls
- User experience is smooth and responsive

---

## Phase 7: Testing & Quality Assurance
**Goal**: Ensure reliability and quality of the integration
**Duration**: ~4-5 hours

### Step 7.1: Integration Testing
- [ ] Test all user workflows end-to-end
- [ ] Verify data consistency between frontend and backend
- [ ] Test error scenarios and edge cases
- [ ] Validate user role-based access and data filtering

### Step 7.2: Performance Testing
- [ ] Test with realistic data volumes
- [ ] Verify loading times are acceptable
- [ ] Test network error scenarios
- [ ] Verify mobile responsiveness still works

### Step 7.3: User Acceptance Testing
- [ ] Test MAT Administrator workflows
- [ ] Test Department Head workflows
- [ ] Verify all features work as expected
- [ ] Document any known issues or limitations

**Milestone 7 Verification**:
- All features work reliably with real data
- Performance meets user expectations
- User workflows are tested and validated

---

## Phase 8: Production Readiness
**Goal**: Prepare for production deployment
**Duration**: ~2-3 hours

### Step 8.1: Configuration Management
- [ ] Set up production environment variables
- [ ] Configure API endpoints for production
- [ ] Ensure security best practices are followed
- [ ] Set up monitoring and logging

### Step 8.2: Deployment Preparation
- [ ] Update build process for production
- [ ] Configure CORS and security headers
- [ ] Test production build locally
- [ ] Create deployment documentation

**Final Milestone Verification**:
- Production build works correctly
- All environment configurations are properly set
- Security considerations are addressed
- Documentation is complete

---

## Key Files to Modify/Create

### New Files to Create:
- `.env.local` - Environment configuration
- `src/lib/api-client.ts` - HTTP client setup
- `src/lib/data-transformers.ts` - Data transformation utilities
- `src/services/assessment-service.ts` - Assessment API methods
- `src/services/school-service.ts` - School API methods
- `src/hooks/use-assessments.ts` - Assessment data hooks (if using React Query)
- `src/components/ui/loading-skeleton.tsx` - Loading components

### Files to Modify:
- `src/pages/Assessments.tsx` - Replace mock data with API calls
- `src/pages/AssessmentDetail.tsx` - Implement real data submission
- `src/components/AssessmentInvitationSheet.tsx` - Real assessment creation
- `src/components/SchoolPerformanceView.tsx` - Use real data
- `src/lib/mock-data.ts` - Gradually remove or keep for fallback
- `src/types/assessment.ts` - Add API response types

## Risk Mitigation

1. **Data Loss Risk**: Implement auto-save and proper validation
2. **Performance Risk**: Use caching and pagination from the start
3. **User Experience Risk**: Maintain loading states and error handling
4. **Integration Risk**: Phase implementation allows for early detection of issues

## Success Criteria

- [ ] All mock data replaced with real API calls
- [ ] User workflows function identically to mock version
- [ ] Performance is acceptable (< 3s load times)
- [ ] Error handling provides good user experience
- [ ] Code is maintainable and well-documented

---

**Next Steps**: Start with Phase 1 and proceed sequentially. Each phase should be completed and verified before moving to the next one. This approach ensures we catch issues early and maintain a working application throughout the integration process. 