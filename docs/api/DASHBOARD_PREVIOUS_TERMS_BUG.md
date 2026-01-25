# Dashboard API Previous Terms Issue

**Date:** January 25, 2026  
**Priority:** High  
**Status:** Backend Fix Required

## Problem Description

When the MAT Admin selects a historical term (e.g., "Summer 2024-25") in the term selector, the "Previous 3 Terms" trendline shows incorrect data. Instead of showing the 3 terms **before** the selected term, it appears to show the 3 most recent terms in the database.

### Example Issue:

**Expected Behavior:**
- When viewing term: **T3-2024-25** (Summer 2024-25)
- Previous 3 terms should be:
  1. T2-2024-25 (Spring 2024-25)
  2. T1-2024-25 (Autumn 2024-25)
  3. T3-2023-24 (Summer 2023-24)

**Actual Behavior:**
- Previous 3 terms showing:
  1. T2-2025-26 (Spring 2025-26) ❌ This is AFTER the selected term
  2. T2-2024-25 (Spring 2024-25) ✓
  3. T1-2024-25 (Autumn 2024-25) ✓

## Root Cause

The backend endpoint `GET /api/dashboard/schools?term_id={term_id}` likely has logic that:
1. Either ignores the `term_id` parameter and always uses the current/latest term
2. Or calculates `previous_terms` from the database's most recent terms instead of relative to the requested `term_id`

## Required Backend Fix

The `GET /api/dashboard/schools` endpoint must be updated to:

1. **Accept** the `term_id` parameter (already does this)
2. **Use** the provided `term_id` as the reference point
3. **Calculate** `previous_terms` as the 3 terms chronologically **before** the requested `term_id`

### Suggested Algorithm:

```python
@app.get("/api/dashboard/schools")
async def get_schools_dashboard(term_id: str = Query(None)):
    # If no term_id provided, use the most recent term
    if not term_id:
        term_id = get_most_recent_term()
    
    # Get the chronological position of the requested term
    all_terms_sorted = get_all_terms_chronologically()  # [newest...oldest]
    
    selected_term_index = all_terms_sorted.index(term_id)
    
    # Get the 3 terms BEFORE the selected term (not after!)
    previous_3_terms = all_terms_sorted[selected_term_index + 1 : selected_term_index + 4]
    
    # For each school, calculate scores for these specific terms
    for school in schools:
        school.previous_terms = []
        for prev_term_id in previous_3_terms:
            avg_score = calculate_school_avg_score(school.id, prev_term_id)
            school.previous_terms.append({
                "term_id": prev_term_id,
                "academic_year": extract_year(prev_term_id),
                "avg_score": avg_score
            })
```

### Term Chronological Order:

Within each academic year:
- T1 (Autumn) - September to December
- T2 (Spring) - January to April  
- T3 (Summer) - May to August

Across years:
- 2025-26 terms come before 2024-25 terms
- Within same year: T3 > T2 > T1 (Summer is most recent)

**Example sorted list** (newest to oldest):
1. T3-2025-26 (Summer 2025-26)
2. T2-2025-26 (Spring 2025-26)
3. T1-2025-26 (Autumn 2025-26)
4. T3-2024-25 (Summer 2024-25)
5. T2-2024-25 (Spring 2024-25)
6. T1-2024-25 (Autumn 2024-25)
7. T3-2023-24 (Summer 2023-24)
... and so on

## Frontend Status

✅ **Frontend is correctly implemented:**
- Passing `term_id` parameter to API
- Displaying `previous_terms` from API response in correct order (oldest to newest, left to right)
- Using `previous_terms[0]` for trend comparison (immediate previous term)

The frontend will work correctly once the backend calculates `previous_terms` relative to the requested `term_id`.

## Testing Checklist

After backend fix, verify:

- [ ] Select T3-2025-26 → previous_terms shows [T2-2025-26, T1-2025-26, T3-2024-25]
- [ ] Select T2-2025-26 → previous_terms shows [T1-2025-26, T3-2024-25, T2-2024-25]
- [ ] Select T1-2025-26 → previous_terms shows [T3-2024-25, T2-2024-25, T1-2024-25]
- [ ] Select T3-2024-25 → previous_terms shows [T2-2024-25, T1-2024-25, T3-2023-24]
- [ ] Select oldest term → previous_terms may be empty or partial (fewer than 3 terms available)

## Priority

**High** - This affects the MAT Administrator's ability to analyze historical trends accurately when reviewing past terms.

---

**Document Version:** 1.0  
**Last Updated:** January 25, 2026
