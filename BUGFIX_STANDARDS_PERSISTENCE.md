# Bug Fixes: Standards Update & Reorder

## Issues Identified

### 1. Standards Update Not Persisting
**Problem:** When updating a standard's name or description, changes were not being saved to the database.

**Root Cause:** 
- The `updateStandardDefinition` function was checking `if (standard.title)` which could be falsy for empty strings
- The payload wasn't always including required fields
- The component wasn't awaiting the async update operation

### 2. Standards Reorder Throwing Error
**Problem:** Drag-and-drop reordering of standards was failing with an API error.

**Root Cause:**
- The code was calling a `/api/standards/reorder` endpoint that doesn't exist in the backend API
- The backend only supports updating individual standards, not bulk reorder operations

## Fixes Applied

### Fix 1: Updated `assessment-service.ts` - Update Function

**Before:**
```typescript
export const updateStandardDefinition = async (standard: Standard): Promise<Standard> => {
  try {
    const payload: any = {};
    
    // Only include fields that are being updated
    if (standard.title) payload.standard_name = standard.title;
    if (standard.description !== undefined) payload.description = standard.description;
    if (standard.aspectId) payload.aspect_id = standard.aspectId;
    
    const response = await apiClient.put(`/api/standards/${standard.id}`, payload);
    return transformStandardResponse(response.data);
  }
}
```

**After:**
```typescript
export const updateStandardDefinition = async (standard: Standard): Promise<Standard> => {
  try {
    // Build payload with all fields that can be updated
    const payload: any = {
      standard_name: standard.title,
      description: standard.description || ''
    };
    
    // Only include aspect_id if it's being changed
    if (standard.aspectId) {
      payload.aspect_id = standard.aspectId;
    }
    
    const response = await apiClient.put(`/api/standards/${standard.id}`, payload);
    return transformStandardResponse(response.data);
  }
}
```

**Changes:**
- Always include `standard_name` and `description` in payload
- Properly handle empty descriptions with fallback to empty string
- Only include `aspect_id` if it's actually being changed

### Fix 2: Updated `assessment-service.ts` - Reorder Function

**Before:**
```typescript
export const reorderStandards = async (standards: { id: string; orderIndex: number }[]): Promise<void> => {
  try {
    const payload = {
      updates: standards.map(s => ({
        standard_id: s.id,
        new_order_index: s.orderIndex
      }))
    };
    await apiClient.put('/api/standards/reorder', payload);
  }
}
```

**After:**
```typescript
export const reorderStandards = async (standards: { id: string; orderIndex: number }[]): Promise<void> => {
  try {
    // The backend doesn't have a bulk reorder endpoint yet
    // So we need to update each standard individually
    // We'll do this in parallel for better performance
    const updatePromises = standards.map(s => 
      apiClient.put(`/api/standards/${s.id}`, {
        sort_order: s.orderIndex
      })
    );
    
    await Promise.all(updatePromises);
    console.log(`Successfully reordered ${standards.length} standards`);
  }
}
```

**Changes:**
- Replaced non-existent bulk endpoint with individual PUT requests
- Used `Promise.all()` to update all standards in parallel for better performance
- Mapped `orderIndex` to `sort_order` to match API field name
- Added success logging

### Fix 3: Updated `StandardsManagement.tsx` - Made Handlers Async

**Before:**
```typescript
const handleSaveStandard = (standard: Standard) => {
    if (editingStandard) {
        updateStandard(standard);
    } else {
        addStandard(standardWithAspect);
    }
    setIsCreateModalOpen(false);
};
```

**After:**
```typescript
const handleSaveStandard = async (standard: Standard) => {
    try {
        if (editingStandard) {
            await updateStandard(standard);
        } else {
            await addStandard(standardWithAspect);
        }
        setIsCreateModalOpen(false);
        setEditingStandard(undefined);
    } catch (error) {
        console.error('Error saving standard:', error);
    }
};
```

**Changes:**
- Made function `async`
- Added `await` for async operations
- Added try-catch for error handling
- Added cleanup of `editingStandard` state

**Similar Changes Applied To:**
- `handleSaveAspect()` - Now properly awaits aspect save operations
- `handleConfirmDelete()` - Now properly awaits delete operations

## Performance Considerations

### Reorder Operation
The reorder function now makes multiple API calls in parallel (one per standard being reordered). This is necessary because:

1. **Backend Limitation**: No bulk reorder endpoint exists
2. **Parallel Execution**: Using `Promise.all()` means all updates happen simultaneously, not sequentially
3. **Typical Use Case**: Users usually reorder 2-5 standards at a time, not dozens

**Performance Impact:**
- 2 standards = 2 parallel requests (~same time as 1 request)
- 5 standards = 5 parallel requests (~same time as 1-2 requests)
- 10+ standards = May be slower, but rare use case

**Future Improvement**: 
When the backend adds a bulk reorder endpoint, we can switch to a single request:
```typescript
// Future implementation when backend supports it
await apiClient.put('/api/standards/reorder', {
  updates: standards.map(s => ({
    standard_id: s.id,
    sort_order: s.orderIndex
  }))
});
```

## Testing Checklist

### Standards Update
- [x] Update standard name → Changes persist after page refresh
- [x] Update standard description → Changes persist after page refresh  
- [x] Update with empty description → Saves as empty string
- [x] Error toast appears if update fails
- [x] Success toast appears on successful update
- [x] Modal closes after successful update

### Standards Reorder
- [x] Drag and drop a standard to new position
- [x] New order persists after page refresh
- [x] Multiple standards can be reordered in one operation
- [x] Reordering is scoped to current aspect only
- [x] Error toast appears if reorder fails
- [x] List reverts to previous state on error (optimistic update rollback)

### Aspects Save/Delete
- [x] Aspect save operations properly await completion
- [x] Aspect delete operations properly await completion
- [x] Modal remains open if error occurs (allows retry)
- [x] Modal closes on successful operation

## API Endpoints Used

### Standards Update
```
PUT /api/standards/{standard_id}
Content-Type: application/json

{
  "standard_name": "Updated Title",
  "description": "Updated description",
  "aspect_id": "education"  // optional
}
```

### Standards Reorder (Multiple Calls)
```
PUT /api/standards/{standard_id}
Content-Type: application/json

{
  "sort_order": 0
}
```

Each standard being reordered gets its own PUT request with updated `sort_order`.

## Error Handling

All operations now have proper error handling:

1. **API Errors**: Caught and displayed via toast notifications
2. **Network Errors**: Handled by axios interceptor with user-friendly messages
3. **Validation Errors**: Extracted from `error.response.data.detail`
4. **Optimistic Updates**: Reverted on failure (reorder operation)
5. **Modal State**: Kept open on error to allow user to retry

## Migration Notes

**Breaking Changes:** None - All changes are backward compatible

**Deployment Notes:**
- Frontend can be deployed independently
- No backend changes required
- Existing data remains unaffected

## Known Limitations

1. **Reorder Performance**: Reordering many standards (10+) may be slower due to multiple API calls
2. **Backend Endpoint**: Still waiting for bulk reorder endpoint on backend
3. **Optimistic Updates**: Only reorder uses optimistic updates; other operations wait for API response

## Future Improvements

1. **Batch API**: Add bulk reorder endpoint to backend
2. **Optimistic Updates**: Extend to all operations for better perceived performance
3. **Debouncing**: Add debounce to prevent rapid-fire updates
4. **Undo/Redo**: Allow users to revert changes
5. **Conflict Resolution**: Handle concurrent updates from multiple users

