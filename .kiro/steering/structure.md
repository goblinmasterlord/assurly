# Project Structure & Organization

## Directory Structure

```
assurly/
├── src/                  # Source code
│   ├── assets/           # Static assets (images, icons)
│   ├── components/       # Reusable UI components
│   │   └── ui/           # Base UI components (shadcn/ui)
│   ├── contexts/         # React context providers
│   ├── hooks/            # Custom React hooks
│   ├── layouts/          # Page layout components
│   ├── lib/              # Utility functions and helpers
│   ├── pages/            # Page components (route endpoints)
│   ├── services/         # API service layer
│   └── types/            # TypeScript type definitions
├── public/               # Static public assets
└── .env.local            # Environment variables
```

## Key Architectural Patterns

### Component Organization

- **UI Components**: Base components in `src/components/ui/`
- **Composite Components**: Feature-specific components in `src/components/`
- **Page Components**: Full pages in `src/pages/`
- **Layout Components**: Page layouts in `src/layouts/`

### Data Flow

1. **API Client** (`src/lib/api-client.ts`): Base HTTP client
2. **Services** (`src/services/`): Domain-specific API methods
3. **Hooks** (`src/hooks/`): React hooks for consuming services
4. **Components**: Consume hooks and render UI

### State Management

- **Local State**: Component-level state with `useState`
- **Shared State**: Application-wide state with Context API
- **Server State**: API data with custom hooks and caching

## Naming Conventions

- **Files**: 
  - React components: PascalCase (e.g., `Button.tsx`)
  - Utilities/hooks: camelCase (e.g., `use-toast.ts`)
  - Types: camelCase (e.g., `assessment.ts`)
  
- **Components**: PascalCase (e.g., `AssessmentDetail`)
- **Hooks**: camelCase prefixed with `use` (e.g., `useAssessments`)
- **Context**: PascalCase suffixed with `Context` (e.g., `UserContext`)

## Code Style Guidelines

- Use TypeScript for type safety
- Prefer functional components with hooks
- Use path aliases (`@/`) for imports
- Follow shadcn/ui component patterns
- Use Tailwind utility classes for styling
- Implement optimistic UI updates where possible