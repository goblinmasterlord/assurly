# Assurly - School Maturity Assessment Platform

Assurly is a web-based platform for Multi-Academy Trusts (MATs) to conduct and manage maturity assessments across their schools. The platform streamlines data collection from individual schools and provides MAT administrators with consolidated overviews for strategic decision-making.

![Assurly Platform](https://placeholder.com/assurly-screenshot.png)

## Features

- **Dual User Roles**: 
  - MAT Administrators: View all assessments, track progress, and generate reports
  - Department Heads: Complete assessments for specific schools and categories

- **Assessment Management**:
  - View assessments with filtering by status, category, and search terms
  - Complete standards assessments with a 1-4 rating scale
  - Add evidence and comments to support ratings
  - Track assessment progress visually

- **User-Friendly Interface**:
  - Modern, responsive design using shadcn/ui components
  - Role-specific views and navigation
  - Intuitive assessment completion flow

## Tech Stack

- **Framework**: Vite + React + TypeScript
- **Styling**: Tailwind CSS v3
- **UI Components**: shadcn/ui
- **Routing**: React Router
- **Icons**: Lucide React
- **State Management**: React Context API

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

1. Browse the list of standards in the left panel
2. Select a standard to view and rate
3. Assign a rating (1-4) and provide supporting evidence
4. Save progress or submit the completed assessment

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
