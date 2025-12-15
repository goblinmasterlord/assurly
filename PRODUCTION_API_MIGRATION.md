# Production API Migration - Aspects & Standards

## Summary

This document details the migration from session-based storage to production API endpoints for Aspects and Standards management in the Assurly platform.

## Changes Made

### 1. Updated `src/hooks/use-standards-persistence.ts`

**Before:** 
- Data was stored in `sessionStorage` only
- Write operations (create, update, delete) only updated session cache
- Fallback to mock data when API unavailable

**After:**
- All write operations now call production API endpoints
- Data is fetched from API on load
- Proper error handling with toast notifications
- Optimistic updates for reordering operations
- Automatic cache invalidation and refresh after mutations

**Key Changes:**
- Removed session storage persistence for write operations
- Added toast notifications for success/error feedback
- Integrated with `assessmentService` for all CRUD operations
- Added proper error messages with user-friendly descriptions

### 2. Fixed API Mappings in `src/services/assessment-service.ts`

**Aspects API Corrections:**
- **POST /api/aspects**: Now correctly sends `aspect_id` and `aspect_name` (not `code` and `name`)
- **PUT /api/aspects/{id}**: Now correctly sends `aspect_name` (not `name`)
- **GET /api/aspects**: Now correctly maps `aspect_id`, `aspect_name`, and `standards_count`

**Standards API Corrections:**
- **POST /api/standards**: Now correctly sends `standard_id` and `standard_name` (not `code` and `title`)
- **PUT /api/standards/{id}**: Now correctly sends `standard_name`, `aspect_id`, and `description`
- **GET /api/standards**: Already correct, uses `transformStandardResponse`

**Error Handling:**
- Enhanced error messages that extract `detail` from API error responses
- Proper error propagation to UI layer

### 3. Enhanced `src/services/enhanced-assessment-service.ts`

Already had proper API integration for aspects and standards with:
- Request caching and deduplication
- Cache invalidation after mutations
- Optimistic updates where appropriate
- Background refresh for subscribers

## API Endpoints Used

### Aspects
- `GET /api/aspects` - Fetch all aspects
- `POST /api/aspects` - Create new aspect
- `PUT /api/aspects/{aspect_id}` - Update aspect
- `DELETE /api/aspects/{aspect_id}` - Delete aspect

### Standards
- `GET /api/standards` - Fetch all standards (with optional `aspect_id` filter)
- `POST /api/standards` - Create new standard
- `PUT /api/standards/{standard_id}` - Update standard
- `DELETE /api/standards/{standard_id}` - Delete standard
- `PUT /api/standards/reorder` - Reorder standards

## Authentication

All write operations (POST, PUT, DELETE) require JWT authentication via Bearer token. The `api-client.ts` automatically includes the auth token from `localStorage` in all requests.

## Data Flow

### Creating an Aspect
1. User fills form in `CreateAspectModal`
2. Modal calls `onSave` with aspect data
3. `StandardsManagement` page calls `addAspect` from hook
4. Hook calls `assessmentService.createAspect`
5. Service calls API with correct field mapping
6. API returns new aspect with generated ID
7. Hook updates local state
8. Hook shows success toast
9. Hook refreshes aspects list to update counts

### Creating a Standard
1. User fills form in `CreateStandardModal`
2. Modal calls `onSave` with standard data
3. `StandardsManagement` page calls `addStandard` from hook
4. Hook calls `assessmentService.createStandard`
5. Service calls API with correct field mapping
6. API returns new standard with generated ID
7. Hook updates local state
8. Hook shows success toast
9. Hook refreshes aspects to update standard counts

### Updating/Deleting
Similar flow with appropriate API calls and cache invalidation.

## Error Handling

### Network Errors
- Caught by axios interceptor in `api-client.ts`
- User-friendly messages displayed via toast
- Original request can be retried for 5xx errors

### Validation Errors (400)
- Extracted from `error.response.data.detail`
- Displayed to user via toast
- Form remains populated for correction

### Authentication Errors (401)
- Automatic token refresh attempted
- If refresh fails, user redirected to login
- Session cleared

### Conflict Errors (409)
- Occurs when trying to delete aspect with standards
- Occurs when trying to delete standard used in assessments
- Clear error message shown to user

### Not Found Errors (404)
- Occurs when resource doesn't exist
- User notified via toast
- List refreshed to sync state

## Testing Checklist

### Aspects - Create
- [ ] Create new aspect with valid data
- [ ] Verify aspect appears in list immediately
- [ ] Verify aspect persists after page refresh
- [ ] Try to create aspect with duplicate ID (should fail with 409)
- [ ] Try to create aspect without authentication (should fail with 401)
- [ ] Verify success toast appears
- [ ] Verify aspect can be selected and standards filtered

### Aspects - Update
- [ ] Update aspect name
- [ ] Verify change appears immediately
- [ ] Verify change persists after page refresh
- [ ] Try to update non-existent aspect (should fail with 404)
- [ ] Verify success toast appears

### Aspects - Delete
- [ ] Delete aspect without standards
- [ ] Try to delete aspect with standards (should fail with 409)
- [ ] Verify aspect removed from list immediately
- [ ] Verify deletion persists after page refresh
- [ ] Verify success toast appears

### Standards - Create
- [ ] Create new standard with valid data
- [ ] Verify standard appears in list immediately
- [ ] Verify standard persists after page refresh
- [ ] Verify aspect's standard count increases
- [ ] Try to create standard with duplicate ID (should fail with 409)
- [ ] Try to create standard for non-existent aspect (should fail with 404)
- [ ] Verify success toast appears

### Standards - Update
- [ ] Update standard name, description
- [ ] Verify change appears immediately
- [ ] Verify change persists after page refresh
- [ ] Try to update non-existent standard (should fail with 404)
- [ ] Verify success toast appears

### Standards - Delete
- [ ] Delete standard not used in assessments
- [ ] Try to delete standard used in assessments (should fail with 409)
- [ ] Verify standard removed from list immediately
- [ ] Verify deletion persists after page refresh
- [ ] Verify aspect's standard count decreases
- [ ] Verify success toast appears

### Standards - Reorder
- [ ] Drag and drop standards to reorder
- [ ] Verify new order appears immediately (optimistic update)
- [ ] Verify order persists after page refresh
- [ ] If reorder fails, verify list reverts to previous state
- [ ] Verify reordering is scoped to current aspect only

### Error Scenarios
- [ ] Test with backend unavailable (should show error toast)
- [ ] Test with invalid auth token (should redirect to login)
- [ ] Test with network timeout (should show retry message)
- [ ] Test with malformed data (should show validation error)
- [ ] Verify all error messages are user-friendly

### User Experience
- [ ] All operations feel instant (optimistic updates)
- [ ] Loading states shown where appropriate
- [ ] Success feedback is clear but not intrusive
- [ ] Error messages are actionable
- [ ] No data loss on errors (forms remain populated)
- [ ] Keyboard shortcuts still work
- [ ] Search and filters work after mutations

## Breaking Changes

### For Users
- **None** - The UI and user experience remain the same

### For Developers
- `use-standards-persistence` hook now returns Promises for all mutation operations
- Session storage is no longer used for aspects/standards
- Mock data fallback has been removed

## Rollback Plan

If issues arise:

1. Revert `src/hooks/use-standards-persistence.ts` to previous version
2. Revert `src/services/assessment-service.ts` API mapping changes
3. Data will fall back to session storage (temporary state only)

## Future Improvements

1. **Offline Support**: Implement proper offline queue for mutations
2. **Optimistic UI**: Extend optimistic updates to all operations (not just reorder)
3. **Real-time Sync**: Add WebSocket support for multi-user scenarios
4. **Batch Operations**: Support bulk create/update/delete
5. **Audit Trail**: Display version history for standards
6. **Undo/Redo**: Add ability to revert changes

## Notes

- The backend API is production-ready and hosted on Google Cloud Run
- JWT tokens are stored in localStorage and automatically included in requests
- Request caching reduces API calls and improves performance
- The frontend uses optimistic updates where safe to do so
- All mutations trigger cache invalidation for consistency

## Support

If you encounter issues:
1. Check browser console for detailed error messages
2. Verify authentication token is valid
3. Check network tab for API request/response details
4. Contact backend team if API returns unexpected errors
5. File issues on the project repository with reproduction steps

