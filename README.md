# Assurly - School Maturity Assessment Platform

Assurly is a web-based platform for Multi-Academy Trusts (MATs) to conduct and manage maturity assessments across their schools. The platform streamlines data collection from individual schools and provides MAT administrators with consolidated overviews for strategic decision-making.

![Assurly Platform](https://placeholder.com/assurly-screenshot.png)

## Features

- **Dual User Roles**: 
  - MAT Administrators: View all assessments, track progress, and generate reports
  - Department Heads: Complete assessments for specific schools and categories

- **Assessment Management**:
  - View assessments with advanced filtering (school, category, status, search)
  - Cross-school assessment management for department heads
  - Interactive assessment completion with visual progress tracking
  - Optional evidence collection with clear guidance

- **Enhanced Assessment Completion**:
  - Intuitive step-by-step navigation between standards
  - Clear visual indicators for completion status
  - Quick school switching for department heads
  - Keyboard shortcuts for power users (navigation, rating)
  - Smart progress tracking with visual feedback

- **User-Friendly Interface**:
  - Modern, responsive design using shadcn/ui components
  - Role-specific views and contextual navigation
  - Toast notifications for user actions
  - Help tooltips and guidance throughout the process
  - Success confirmations for major actions

## Tech Stack

- **Framework**: Vite + React + TypeScript
- **Styling**: Tailwind CSS v3
- **UI Components**: shadcn/ui
- **Routing**: React Router
- **Icons**: Lucide React
- **State Management**: React Context API
- **Notifications**: Toast system

## Project Structure

The project follows a standard React application structure with dedicated directories for components, contexts, pages, and utilities.

```
assurly/
├── src/
│   ├── components/    # Reusable UI components
│   ├── contexts/      # React contexts for state management
│   ├── layouts/       # Page layout components
│   ├── lib/           # Utilities and mock data
│   ├── pages/         # Page components
│   ├── types/         # TypeScript type definitions
│   └── ...            # App entry points and global styles
└── ...                # Configuration files
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/assurly.git
   cd assurly
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## Usage

### Switching User Roles

Use the role switcher in the top-right corner to toggle between "MAT Administrator" and "School Dept. Head" roles to explore different user experiences.

### Viewing Assessments

1. Click on "All Assessments" (for MAT Admins) or "My Assessments" (for Department Heads)
2. Use the search and filter options to find specific assessments
3. Click "View" or "Continue" to access an individual assessment

### Completing Assessments (Department Head)

1. Browse the numbered standards in the left panel
2. Select a standard to view and rate, or use the Previous/Next buttons to navigate
3. Choose a rating (1-4) from the card options
4. Optionally add evidence/comments in the text area
5. Use "Save Progress" to save your work, or "Save & Continue" to proceed to the next standard
6. Complete all standards to enable the "Submit Assessment" button
7. Power users can use keyboard shortcuts (shown at bottom of assessment page)

### School Switching

Department Heads can easily switch between schools for the same assessment category using the school selector at the top of the assessment detail page.

## Development

### Adding New Components

```
npx shadcn@latest add [component-name]
```

### Building for Production

```
npm run build
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful, accessible components
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Lucide Icons](https://lucide.dev/) for the icon set
