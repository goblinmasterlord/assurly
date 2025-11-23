# UI/UX Recommendations & Analysis

## Executive Summary
The current application structure is solid, leveraging a clear role-based architecture. The use of `shadcn/ui` and Tailwind CSS provides a strong foundation for a clean, professional aesthetic. The following recommendations focus on enhancing **scannability**, **navigation context**, and **task focus**.

## 1. Information Architecture (IA)

### Current State
- **MAT Admin:** Hierarchical (Dashboard -> School -> Assessment).
- **Dept Head:** Linear (Dashboard -> Assessment -> Standard).

### Recommendations
- **Breadcrumbs:** Implement a breadcrumb navigation system (e.g., `Home > Assessments > Cedar Park Primary > Education`). This is critical for MAT Admins to maintain context when drilling down into specific assessments.
- **Unified "My Tasks" View for Dept Heads:** If a Dept Head works across multiple schools, group assessments by "Urgency" (Overdue, Due Soon) rather than just a flat list.

## 2. Visual Hierarchy & Layout

### Global
- **Max-Width:** Ensure the `container` class constrains content on ultra-wide screens (e.g., max-w-7xl) to prevent "eye scanning fatigue" across long lines of text.
- **Vertical Rhythm:** Standardize section spacing. Use `space-y-8` between major page sections to create distinct visual breaks.

### Page: Assessments (MAT Admin)
- **Goal:** High-level monitoring and exception management.
- **Layout Proposal:**
  - **Top:** "Key Metrics" cards (e.g., "Total Assessments", "Intervention Needed", "Completion Rate").
  - **Middle:** Filter Bar (sticky if possible).
  - **Main:** The `SchoolPerformanceView` table.
- **Refinement:**
  - **"Intervention Needed" Visibility:** Move the "Intervention" count to a more prominent position or give it a distinct background color (light rose) in the row summary to catch the eye immediately.

### Page: Assessments (Dept Head)
- **Goal:** Task identification and execution.
- **Layout Proposal:**
  - **Top:** "Action Required" section highlighting Overdue or Due Soon items.
  - **Main:** Tabbed view: "Active" vs. "Completed".
- **Refinement:**
  - **Progress Bar:** Make the progress bar thicker (h-2 or h-3) and change color based on proximity to due date (e.g., turns amber if < 50% and due in 3 days).

### Page: Assessment Detail (The Workspace)
- **Goal:** Focused data entry and evidence gathering.
- **Layout Proposal:**
  - **Split Screen:**
    - **Left (25%):** Navigation/Standard List. Sticky sidebar.
    - **Right (75%):** Active Standard Workspace.
  - **Focus Mode:** Allow collapsing the sidebar to maximize writing space for "Evidence".
- **Refinement:**
  - **Rating Selector:** Ensure the 4-point scale is visually distinct. Use large, clickable cards for the ratings rather than a simple dropdown or small radio buttons.
  - **Evidence Box:** Auto-expand textarea to fit content.

## 3. Component-Level Improvements

### Tables
- **Hover Actions:** Only show "View" or "Edit" buttons on row hover to reduce visual clutter (keep them accessible via keyboard focus).
- **Zebra Striping:** Consider subtle zebra striping (`even:bg-slate-50/50`) for very wide tables to help the eye track rows.

### Status Badges
- **Icons:** Ensure every badge has a corresponding icon (e.g., CheckCircle for Completed, Clock for In Progress) to aid color-blind users.

## 4. Immediate Action Plan
1.  **Implement Breadcrumbs:** Add to `RootLayout` or individual page headers.
2.  **Enhance Assessment Detail Layout:** Refine the sidebar/content split for better focus.
3.  **Visual Polish:** Review spacing and typography consistency in the `SchoolPerformanceView`.
