# Technology Stack & Build System

## Core Technologies

- **Framework**: Vite + React 19 + TypeScript
- **Styling**: Tailwind CSS v3 with shadcn/ui components
- **State Management**: React Context API + React Query (TanStack Query)
- **Routing**: React Router v7
- **Form Handling**: React Hook Form with Zod validation
- **API Client**: Axios with enhanced error handling and caching
- **Animation**: Framer Motion
- **Date Handling**: date-fns v4
- **Icons**: Lucide React

## Project Configuration

- **TypeScript**: Strict mode enabled with path aliases (`@/*` → `./src/*`)
- **Vite**: Configured with React plugin and environment variable support
- **Tailwind**: Custom theme with shadcn/ui design system
- **ESLint**: Modern configuration with TypeScript support

## Common Commands

```bash
# Development server
npm run dev

# Mock API server (uses json-server with db.json)
npm run mock:api

# Build for production
npm run build

# Lint code
npm run lint

# Preview production build
npm run preview
```

## API Integration

- Base API client in `src/lib/api-client.ts`
- Request caching system in `src/lib/request-cache.ts`
- Enhanced services with optimistic updates in `src/services/`
- Custom hooks for data fetching in `src/hooks/`

## Performance Optimization

- Stale-while-revalidate caching strategy
- Request deduplication
- Optimistic UI updates
- Selective cache invalidation
- Memory-efficient cache management