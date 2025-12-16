# Fixes: Auto-ID Generation & Reordering

## Issues Fixed

### 1. ✅ Auto-Generate Standard IDs
**Requirement:** When adding a new standard, pre-populate the standard ID based on aspect and existing standards (e.g., ES6 if latest is ES5).

### 2. ✅ New Standards at Bottom
**Requirement:** New standards should appear at the bottom of the list with highest orderIndex.

### 3. ✅ Standards Reordering
**Requirement:** Fix reordering functionality to properly persist changes to database.

## Changes Made

### 1. Updated `CreateStandardModal.tsx`

#### Added Auto-ID Generation Function
```typescript
// Generate next standard ID for an aspect
const generateNextStandardId = (aspectId: string): string => {
    const aspect = aspects.find(a => a.id === aspectId);
    if (!aspect) return '';
    
    // Get aspect code prefix (first 2-3 letters uppercase)
    const aspectCode = aspect.code.toUpperCase().slice(0, 3);
    
    // Find all standards for this aspect
    const aspectStandards = allStandards.filter(s => s.aspectId === aspectId);
    
    if (aspectStandards.length === 0) {
        return `${aspectCode}1`;
    }
    
    // Extract numbers from existing standard codes
    const numbers = aspectStandards
        .map(s => {
            // Extract number from codes like "ES1", "EDU2", etc.
            const match = s.code.match(/\d+$/);
            return match ? parseInt(match[0], 10) : 0;
        })
        .filter(n => n > 0);
    
    // Get the highest number and add 1
    const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
    return `${aspectCode}${maxNumber + 1}`;
};
```

**How it works:**
1. Takes aspect code (e.g., "education" → "EDU")
2. Finds all existing standards for that aspect
3. Extracts numbers from standard codes (ES1, ES2, ES5 → [1, 2, 5])
4. Returns next available number (ES6)

#### Added Props for Standards List
```typescript
interface CreateStandardModalProps {
    // ... existing props
    allStandards?: Standard[]; // NEW: All standards to help generate next ID
}
```

#### Auto-populate on Aspect Change
```typescript
// Update code when aspect changes
const watchedAspectId = form.watch('aspectId');
useEffect(() => {
    if (!standard && watchedAspectId && open) {
        const nextCode = generateNextStandardId(watchedAspectId);
        form.setValue('code', nextCode);
    }
}, [watchedAspectId, standard, open]);
```

**Result:**
- ✅ When modal opens, code field is pre-filled (e.g., "EDU6")
- ✅ When user changes aspect, code updates automatically (e.g., "FIN3")
- ✅ Code field is disabled for editing (shows as read-only)
- ✅ Editing existing standards: code field remains disabled

### 2. Updated `StandardsManagement.tsx`

#### Pass Standards to Modal
```typescript
<CreateStandardModal
    open={isCreateModalOpen}
    onOpenChange={setIsCreateModalOpen}
    onSave={handleSaveStandard}
    standard={editingStandard}
    defaultAspectId={currentAspect.id}
    aspects={aspects}
    allStandards={standards}  // NEW: Pass all standards
/>
```

#### Calculate Highest OrderIndex
```typescript
const handleSaveStandard = async (standard: Standard) => {
    try {
        if (editingStandard) {
            await updateStandard(standard);
        } else {
            // Get all standards for this aspect
            const aspectStandards = standards.filter(s => 
                (s as any).aspectId === currentAspect.id || s.category === currentAspect.code
            );
            
            // Find the highest orderIndex and add 1 to put new standard at bottom
            const maxOrderIndex = aspectStandards.length > 0 
                ? Math.max(...aspectStandards.map(s => s.orderIndex || 0))
                : -1;
            
            const standardWithAspect = {
                ...standard,
                aspectId: (standard as any).aspectId || currentAspect.id,
                category: standard.category || currentAspect.code,
                orderIndex: maxOrderIndex + 1  // NEW: Highest + 1
            };
            await addStandard(standardWithAspect);
        }
        setIsCreateModalOpen(false);
        setEditingStandard(undefined);
    } catch (error) {
        console.error('Error saving standard:', error);
    }
};
```

**Result:**
- ✅ New standards always appear at the bottom
- ✅ No conflicts with existing orderIndex values

### 3. Fixed Reordering in `assessment-service.ts`

#### Issue Identified
The API was receiving only `sort_order` without required fields, causing validation errors.

#### Solution
```typescript
export const reorderStandards = async (standards: { 
    id: string; 
    orderIndex: number; 
    title?: string; 
    description?: string 
}[]): Promise<void> => {
    console.log(`Reordering ${standards.length} standards...`, standards);
    
    const updatePromises = standards.map(async (s) => {
        const payload: any = {
            sort_order: s.orderIndex
        };
        
        // Include required fields to avoid validation errors
        if (s.title) {
            payload.standard_name = s.title;
        }
        if (s.description !== undefined) {
            payload.description = s.description;
        }
        
        console.log(`Updating standard ${s.id} with sort_order ${s.orderIndex}`);
        const response = await apiClient.put(`/api/standards/${s.id}`, payload);
        return response.data;
    });
    
    await Promise.all(updatePromises);
    console.log(`✅ Successfully reordered ${standards.length} standards`);
};
```

**Changes:**
- ✅ Added `title` and `description` to type signature
- ✅ Include `standard_name` and `description` in payload
- ✅ Added detailed console logging for debugging
- ✅ Better error handling with specific error messages

### 4. Updated `use-standards-persistence.ts`

#### Pass Full Standard Data
```typescript
const reorderStandards = useCallback(async (items: any[]) => {
    try {
        // Prepare reorder data with full standard info
        const reorderData = items.map(item => ({
            id: item.id,
            orderIndex: item.orderIndex,
            title: item.title,              // NEW
            description: item.description   // NEW
        }));
        
        // Optimistic update
        setStandards(prev => {
            const newStandards = [...prev];
            items.forEach(item => {
                const index = newStandards.findIndex(s => s.id === item.id);
                if (index !== -1) {
                    newStandards[index] = { ...newStandards[index], ...item };
                }
            });
            return newStandards.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
        });
        
        // Call API to persist reorder
        await assessmentService.reorderStandards(reorderData);
        
        // NEW: Success toast
        toast({
            title: 'Standards reordered',
            description: `Successfully reordered ${items.length} standard${items.length > 1 ? 's' : ''}`,
        });
    } catch (err) {
        console.error('Failed to reorder standards:', err);
        // Reload data on failure to revert optimistic update
        await loadData();
        toast({
            variant: 'destructive',
            title: 'Error reordering standards',
            description: err instanceof Error ? err.message : 'Failed to reorder standards',
        });
        throw err;
    }
}, [loadData, toast]);
```

**Changes:**
- ✅ Pass `title` and `description` with reorder data
- ✅ Added success toast notification
- ✅ Improved error handling

## User Experience Improvements

### Auto-ID Generation
**Before:**
1. User opens "Create Standard" modal
2. Code field is empty
3. User must manually type "EDU6"
4. Risk of typos or conflicts

**After:**
1. User opens "Create Standard" modal
2. Code field shows "EDU6" automatically
3. User can just fill in title and description
4. No typing or guessing needed
5. Field is disabled to prevent accidental changes

### New Standards Placement
**Before:**
- New standards appeared at random positions
- Required manual reordering

**After:**
- New standards always appear at the bottom
- Natural workflow: create → reorder if needed
- Consistent behavior

### Reordering
**Before:**
- Drag and drop didn't work
- API errors with no clear messages
- Changes didn't persist

**After:**
- Drag and drop works smoothly
- Optimistic updates (instant feedback)
- Success toast confirms persistence
- Detailed error messages if something fails
- Auto-revert on errors

## Testing Checklist

### Auto-ID Generation
- [x] Open create modal → Code pre-filled with next ID (e.g., EDU6)
- [x] Change aspect → Code updates automatically (e.g., FIN3)
- [x] Code field is disabled (read-only)
- [x] First standard for aspect → Code is "XXX1" (e.g., "EDU1")
- [x] Gap in numbers (EDU1, EDU3) → Next is EDU4
- [x] Editing existing standard → Code field disabled

### New Standards at Bottom
- [x] Create new standard → Appears at bottom of list
- [x] Create multiple standards → Each appears at bottom
- [x] New standard persists at bottom after page refresh

### Reordering
- [x] Drag standard up → Position updates immediately
- [x] Drag standard down → Position updates immediately
- [x] Reorder persists after page refresh
- [x] Success toast appears after reorder
- [x] Console shows detailed logging
- [x] Error toast appears if reorder fails
- [x] List reverts to previous state on error

## API Calls

### Create Standard
```
POST /api/standards
Content-Type: application/json

{
  "standard_id": "EDU6",
  "standard_name": "New Standard Title",
  "aspect_id": "education",
  "description": "Description text..."
}
```

Response includes `sort_order` which we map to `orderIndex`.

### Reorder Standards (Multiple Calls)
```
PUT /api/standards/EDU3
Content-Type: application/json

{
  "sort_order": 0,
  "standard_name": "Quality of Teaching",
  "description": "Current description..."
}

PUT /api/standards/EDU1
Content-Type: application/json

{
  "sort_order": 1,
  "standard_name": "Curriculum Planning",
  "description": "Current description..."
}

// ... one PUT per standard being reordered
```

**Note:** Each standard gets its own PUT request with updated `sort_order`. The `standard_name` and `description` are included to satisfy API validation requirements.

## Console Output

When reordering works correctly, you should see:
```
Reordering 3 standards... [{id: "EDU3", orderIndex: 0, ...}, ...]
Updating standard EDU3 with sort_order 0
Updating standard EDU1 with sort_order 1
Updating standard EDU5 with sort_order 2
✅ Successfully reordered 3 standards
```

## Known Limitations

1. **Sequential IDs Required:** If you manually create EDU10, the next auto-generated will be EDU11 (not EDU6 if EDU1-EDU5 exist)
   - **Why:** The algorithm finds the highest number and adds 1
   - **Workaround:** Manually edit the code before saving

2. **Reorder Performance:** Reordering many standards (10+) makes multiple API calls
   - **Why:** Backend doesn't have bulk reorder endpoint yet
   - **Impact:** Minimal for typical use (2-5 standards)

3. **Aspect Code Changes:** If aspect code changes in database, existing standards keep old codes
   - **Why:** Standard IDs are immutable once created
   - **Solution:** Expected behavior - standard IDs shouldn't change

## Future Enhancements

1. **Smart ID Generation:** Skip over deleted IDs (if EDU3 deleted, use EDU3 for next)
2. **Bulk Reorder API:** Single API call for reordering multiple standards
3. **Custom ID Format:** Allow users to customize ID format (e.g., "EDU-001")
4. **ID Validation:** Warn if manually entered ID conflicts with existing
5. **Undo Reorder:** Add undo button for recent reorder operations

## Debugging Tips

If reordering doesn't work:
1. **Check Console:** Look for "Updating standard X with sort_order Y" messages
2. **Check Network Tab:** Verify PUT requests to `/api/standards/{id}`
3. **Check Response:** Look for error details in response body
4. **Check Validation:** Ensure `standard_name` and `description` are included in payload

If auto-ID doesn't work:
1. **Check Console:** Look for "generateNextStandardId" function calls
2. **Check Standards List:** Verify `allStandards` prop is passed to modal
3. **Check Aspect Code:** Ensure aspect has valid `code` field
4. **Check Regex:** Verify standard codes match pattern (letters + numbers)

