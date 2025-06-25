# Assurly Component Architecture

This document provides a technical overview of the React component architecture, data flow, and state management within the Assurly application. It is intended for developers to understand the key patterns and conventions used in the codebase.

## 1. Core Architectural Philosophy

Assurly employs a well-defined, multi-layered component architecture that promotes reusability, separation of concerns, and maintainability.

1.  **UI Foundation (`/components/ui`):** This directory contains a comprehensive suite of generic, stateless UI primitives powered by **Shadcn UI** and Radix UI. These components (`Button`, `Card`, `Table`, `Select`, etc.) are the foundational building blocks of the entire user interface. They are styled with Tailwind CSS, contain no business logic, and are designed to be composed into more complex structures.

2.  **Feature Components (`/components`):** These are higher-order components that implement specific application features. They consume UI primitives and application state to deliver concrete business value. They are the workhorses of the application, encapsulating complex logic and user workflows.

3.  **Pages (`/pages`):** These components represent the top-level views for each route in the application (e.g., `/assessments`, `/assessments/:id`). Their primary responsibility is to fetch the necessary data for a given view and compose the appropriate layout and feature components.

4.  **Layouts (`/layouts`):** The `RootLayout` component provides the persistent UI shell for the application, including the main header, navigation, and footer. It also crucially houses the `RoleSwitcher`, making it a global component.

## 2. State Management Strategy

State is managed using a combination of local and global strategies:

*   **Global State (`UserContext`):** The single most important piece of global state is the current `UserRole` (`mat-admin` or `department-head`). This is managed in `UserContext` and consumed throughout the application to conditionally render UI and control access to features. The `RoleSwitcher` component directly interacts with this context.
*   **Local Component State:** Most state is managed locally within the feature components where it is most relevant. This includes UI state (e.g., which tab is active, whether a dialog is open) and form state. The `useState` and `useMemo` hooks are used extensively for this purpose.
*   **Toast Notifications (`useToast`):** A custom `useToast` hook provides a global, non-intrusive way to display system feedback (e.g., "Progress Saved").

## 3. Critical Feature Components & Data Flow

### `MatAdminAssessmentsView.tsx` (Admin Dashboard)

*   **Purpose:** The primary command center for the `mat-admin` role. It displays a comprehensive, filterable list of all assessments across the trust.
*   **Data Flow:** Receives an array of `Assessment` objects from `mock-data.ts` via the `AssessmentsPage`.
*   **Key Features & Dependencies:**
    *   **View Toggling:** Manages local state to switch between a high-density `Table` view and a rich, expandable `Accordion` (Card) view.
    *   **Filtering:** Utilizes local state (`searchTerm`, `categoryFilter`, `schoolFilter`, `termFilter`) to dynamically filter the displayed assessments.
    *   **Composition:** Heavily composes UI components like `Tabs`, `Card`, `Table`, `Input`, `Select`, `Badge`, and `Progress`.
    *   **Actions:** Triggers the `AssessmentInvitationSheet` to open, passing state via props.

### `AssessmentInvitationSheet.tsx` (Admin Action)

*   **Purpose:** A focused workflow for admins to request a new assessment from one or more schools.
*   **Data Flow:** This component is self-contained. It manages its own form state for selecting a category, due date, and target schools. Upon submission, it logs the data to the console (simulating an API call).
*   **Key Features & Dependencies:**
    *   Built on the `Sheet` component for a slide-in panel UX.
    *   Uses `Select` for categories, a custom `SimpleDatePicker` for due dates, and a searchable, multi-select list for schools.
    *   Demonstrates complex local state management to handle user selections and search terms.

### `AssessmentDetailPage.tsx` (Assessment Workspace)

*   **Purpose:** The core workspace for both completing an assessment (Dept. Head) and reviewing a completed one (Admin).
*   **Data Flow:** Fetches the specific `Assessment` object based on the URL parameter (`:id`). It then initializes its own local state for `ratings` and `evidence` based on the fetched data.
*   **Key Features & Dependencies:**
    *   **Role-Based Rendering:** Drastically changes its appearance and functionality based on the `useUser` role. It is a fully interactive form for a `department-head` and a read-only summary for a `mat-admin`.
    *   **Interactive Form (Dept. Head):** Manages the state of every standard's rating and evidence text. The UI is designed for a step-by-step workflow, presenting one standard at a time.
    *   **Navigation:** Implements `goToNextStandard` and `goToPreviousStandard` logic, which is also wired up to keyboard shortcuts (`ArrowKeys`, `J`/`K`) for power users.
    *   **Save/Submit Logic:** Includes `handleSave` and `handleSubmit` functions that simulate API calls and trigger toast notifications and a success dialog.
    *   **Read-Only View (Admin):** When an assessment is `Completed`, it renders a clean, read-only `Accordion` view of the standards, ratings, and evidence.

## 4. Type System (`types/assessment.ts`)

The project uses a robust set of TypeScript types that define the shape of the core data models (`Assessment`, `Standard`, `School`, `User`). This file is critical as it provides the single source of truth for the application's data structures, ensuring type safety and developer clarity throughout the component tree.
