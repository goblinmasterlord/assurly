# Assurly Project Structure & Organization

**Last Updated**: January 4, 2026  
**Version**: 2.0.0 (Monorepo Structure)

## Overview

Assurly is organized as a **monorepo** containing both the frontend React application and the backend FastAPI service, along with shared documentation and configuration.

This document serves as the definitive guide to the project's organization, file locations, and development workflows.

## 📁 Top-Level Structure

```
Assurly/
│
├── assurly-frontend/          # Frontend React application
├── assurly-backend/           # Backend FastAPI service
├── docs/                      # Shared documentation
│
├── README.md                  # Main project overview
├── PROJECT_STRUCTURE.md       # This file - project organization guide
├── TESTING_CHECKLIST.md       # Testing procedures
├── BUGFIX_SUMMARY.md         # Bug fixes summary
├── V4_MIGRATION_SUMMARY.md   # Migration notes
├── DOCS_ORGANIZATION.md      # Documentation organization notes
│
├── db.json                    # Mock database for development
└── db.json.bak               # Backup of mock database
```

## 🎨 Frontend Application (`assurly-frontend/`)

### Overview
React + TypeScript web application for the Assurly platform.

### Structure

```
assurly-frontend/
│
├── src/                       # Source code
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui base components (43 components)
│   │   ├── admin/            # Admin-only components
│   │   └── auth/             # Authentication components
│   ├── contexts/             # React Context providers
│   ├── hooks/                # Custom React hooks
│   ├── layouts/              # Page layouts
│   ├── lib/                  # Utilities and helpers
│   ├── pages/                # Page components
│   ├── services/             # API service layers
│   └── types/                # TypeScript type definitions
│
├── public/                    # Static assets
├── dist/                      # Production build output
│
├── package.json              # Dependencies and scripts
├── vite.config.ts            # Vite configuration
├── tsconfig.json             # TypeScript configuration
├── tsconfig.app.json         # App-specific TS config
├── tsconfig.node.json        # Node-specific TS config
├── tailwind.config.js        # Tailwind CSS configuration
├── postcss.config.js         # PostCSS configuration
├── eslint.config.js          # ESLint configuration
├── components.json           # shadcn/ui configuration
├── vercel.json               # Vercel deployment config
│
├── test-auth-flow.js         # Auth flow testing
├── test-verify.js            # Token verification testing
│
└── README.md                 # Frontend documentation
```

### Key Files

| File | Purpose |
|------|---------|
| `src/main.tsx` | Application entry point |
| `src/App.tsx` | Root component with routing |
| `src/lib/api-client.ts` | Core API client |
| `src/services/auth-service.ts` | Authentication service |
| `src/types/assessment.ts` | Core type definitions |
| `vite.config.ts` | Vite build configuration |
| `package.json` | Dependencies and scripts |

### Development

```bash
cd assurly-frontend
npm install
npm run dev           # Start dev server
npm run build         # Build for production
npm run preview       # Preview production build
npm run lint          # Run ESLint
```

### Documentation
- **Main README**: `assurly-frontend/README.md`
- **Component Docs**: See individual component files
- **API Integration**: See `docs/api/FRONTEND_API_SPECIFICATION_v4.md`

## 🔧 Backend Service (`assurly-backend/`)

### Overview
Python FastAPI RESTful API service for the Assurly platform.

### Structure

```
assurly-backend/
│
├── main.py                    # FastAPI application (primary entry point)
│
├── auth_config.py            # Authentication configuration
├── auth_models.py            # Pydantic models for auth
├── auth_utils.py             # JWT and token utilities
├── email_service.py          # SMTP email service
│
├── requirements.txt          # Python dependencies
├── runtime.txt               # Python version specification
├── Dockerfile               # Container configuration
├── Procfile                 # Process configuration
├── app.yaml                 # App Engine configuration
│
├── API_DOCUMENTATION.md      # Backend API reference
├── ASSESSMENT_API_SPECIFICATION_v4.md  # Assessment API spec
├── frontend_additional_endpoints.md    # Additional endpoint docs
├── db_production_schema.md   # Database schema documentation
├── V4_MIGRATION_STATUS.md    # Migration status
│
├── smtp.py                   # Email testing utilities
├── jwt_keygenerator.py       # JWT key generation
├── gmail_creds_test.py       # Gmail credentials testing
├── test_phase2_auth.py       # Auth testing
│
├── README-cloudshell.txt     # Cloud Shell instructions
└── README.md                 # Backend documentation
```

### Key Files

| File | Purpose |
|------|---------|
| `main.py` | FastAPI application with all endpoints |
| `auth_config.py` | Authentication configuration |
| `auth_utils.py` | JWT utilities |
| `email_service.py` | Email service for magic links |
| `requirements.txt` | Python dependencies |
| `API_DOCUMENTATION.md` | Complete API reference |

### Development

```bash
cd assurly-backend
pip install -r requirements.txt
uvicorn main:app --reload    # Start dev server
# API available at http://localhost:8000
# Swagger docs at http://localhost:8000/docs
```

### Documentation
- **Main README**: `assurly-backend/README.md`
- **API Documentation**: `assurly-backend/API_DOCUMENTATION.md`
- **Database Schema**: `assurly-backend/db_production_schema.md`

## 📚 Shared Documentation (`docs/`)

### Overview
Centralized documentation for the entire project.

### Structure

```
docs/
│
├── README.md                  # Documentation index
│
├── api/                       # API Specifications
│   ├── FRONTEND_API_SPECIFICATION_v4.md   # Frontend API spec (v4)
│   └── ASSESSMENT_API_SPECIFICATION.md    # Assessment API spec
│
├── archive/                   # Historical Documentation
│   ├── API_DOCUMENTATION_v1.md
│   ├── API_QUICK_REFERENCE_v1.md
│   ├── FRONTEND_MIGRATION_GUIDE.md
│   ├── PRODUCTION_API_MIGRATION.md
│   └── API_DOCUMENTATION_MIGRATION_SUMMARY.md
│
├── design/                    # Design & UX
│   ├── BRANDING_UPDATES.md
│   ├── MARKETING_PAGES_README.md
│   └── ux-recommendations.md
│
├── fixes/                     # Bug Fix Documentation
│   ├── BACKEND_ASSESSMENT_SCHEMA_GUIDE.md
│   ├── BUGFIX_STANDARDS_PERSISTENCE.md
│   ├── BUGFIX_V3_MODAL_AND_ASSESSMENT.md
│   ├── FIX_EDIT_MODAL_BLANK.md
│   ├── FIX_STANDARD_ID_GENERATION.md
│   └── FIXES_AUTO_ID_REORDER.md
│
├── MIGRATION_ANALYSIS.md      # Migration technical analysis
├── MIGRATION_EXECUTIVE_SUMMARY.md  # Migration overview
├── MIGRATION_IMPLEMENTATION_GUIDE.md  # Implementation guide
├── MIGRATION_INDEX.md         # Migration docs index
├── MIGRATION_QUICK_START.md   # Quick start guide
├── SCHEMA_ANALYSIS.md         # Database schema analysis
├── FIELD_MAPPING_REFERENCE.md  # Field mapping reference
├── V4_MIGRATION_ANALYSIS.md   # V4 migration analysis
├── V4_MIGRATION_COMPLETE.md   # V4 migration completion
├── V4_QUICK_START.md          # V4 quick start
│
└── changenotes.md             # Project changelog
```

### Documentation Categories

#### API Documentation
- **Frontend API**: `docs/api/FRONTEND_API_SPECIFICATION_v4.md`
- **Assessment API**: `docs/api/ASSESSMENT_API_SPECIFICATION.md`
- **Backend API**: `assurly-backend/API_DOCUMENTATION.md`

#### Migration Guides
- **V4 Migration**: `docs/V4_MIGRATION_*.md`
- **General Migration**: `docs/MIGRATION_*.md`
- **Field Mapping**: `docs/FIELD_MAPPING_REFERENCE.md`

#### Design & UX
- **Branding**: `docs/design/BRANDING_UPDATES.md`
- **UX Recommendations**: `docs/design/ux-recommendations.md`
- **Marketing Pages**: `docs/design/MARKETING_PAGES_README.md`

#### Bug Fixes
- **Fix Documentation**: `docs/fixes/`
- **Bug Summary**: `BUGFIX_SUMMARY.md` (root)

#### Historical
- **Archived Docs**: `docs/archive/`
- **Old API Versions**: `docs/archive/API_DOCUMENTATION_v1.md`

## 🔄 Development Workflows

### Full-Stack Development

1. **Start Backend**
   ```bash
   cd assurly-backend
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Start Frontend** (in another terminal)
   ```bash
   cd assurly-frontend
   npm run dev
   ```

3. **Access**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Frontend-Only Development

```bash
cd assurly-frontend
npm run dev
# Uses production backend API via proxy
```

### Backend-Only Development

```bash
cd assurly-backend
uvicorn main:app --reload
# Test with Swagger UI at /docs
```

## 🗂️ File Location Guide

### Where to Find...

#### Configuration Files
- **Frontend Config**: `assurly-frontend/vite.config.ts`, `assurly-frontend/tailwind.config.js`
- **Backend Config**: `assurly-backend/auth_config.py`
- **TypeScript Config**: `assurly-frontend/tsconfig.*.json`
- **Deployment Config**: `assurly-frontend/vercel.json`, `assurly-backend/Dockerfile`

#### Source Code
- **React Components**: `assurly-frontend/src/components/`
- **Pages**: `assurly-frontend/src/pages/`
- **API Services**: `assurly-frontend/src/services/`
- **Backend Endpoints**: `assurly-backend/main.py`
- **Auth Logic**: `assurly-backend/auth_*.py`

#### Documentation
- **Project Overview**: `README.md` (root)
- **Frontend Docs**: `assurly-frontend/README.md`
- **Backend Docs**: `assurly-backend/README.md`
- **API Specs**: `docs/api/`
- **Bug Fixes**: `docs/fixes/` and `BUGFIX_SUMMARY.md`
- **Migration Guides**: `docs/MIGRATION_*.md`

#### Tests
- **Frontend Tests**: `assurly-frontend/test-*.js`
- **Backend Tests**: `assurly-backend/test_*.py`
- **Testing Checklist**: `TESTING_CHECKLIST.md` (root)

#### Assets
- **Static Assets**: `assurly-frontend/public/`
- **Built Assets**: `assurly-frontend/dist/`
- **Images**: `assurly-frontend/src/assets/`

## 📝 Documentation Hierarchy

### Entry Points by Role

#### New Developer
1. **Start**: `README.md` (root)
2. **Then**: Choose frontend or backend
   - Frontend: `assurly-frontend/README.md`
   - Backend: `assurly-backend/README.md`
3. **Then**: `docs/README.md` for comprehensive docs

#### Frontend Developer
1. **Start**: `assurly-frontend/README.md`
2. **API Integration**: `docs/api/FRONTEND_API_SPECIFICATION_v4.md`
3. **Components**: Component files in `assurly-frontend/src/components/`
4. **Types**: `assurly-frontend/src/types/`

#### Backend Developer
1. **Start**: `assurly-backend/README.md`
2. **API Reference**: `assurly-backend/API_DOCUMENTATION.md`
3. **Database**: `assurly-backend/db_production_schema.md`
4. **Auth**: `assurly-backend/auth_*.py`

#### Project Manager
1. **Start**: `README.md` (root)
2. **Status**: `V4_MIGRATION_SUMMARY.md`, `BUGFIX_SUMMARY.md`
3. **Planning**: `docs/MIGRATION_EXECUTIVE_SUMMARY.md`
4. **Testing**: `TESTING_CHECKLIST.md`

#### Designer/UX
1. **Start**: `docs/design/BRANDING_UPDATES.md`
2. **UX**: `docs/design/ux-recommendations.md`
3. **Marketing**: `docs/design/MARKETING_PAGES_README.md`
4. **Components**: `assurly-frontend/src/components/ui/`

## 🚀 Deployment

### Frontend (Vercel)
- **Source**: `assurly-frontend/`
- **Config**: `assurly-frontend/vercel.json`
- **Build Command**: `npm run build`
- **Output Directory**: `dist/`
- **Deployment**: Automatic from `main` branch

### Backend (Google Cloud Run)
- **Source**: `assurly-backend/`
- **Config**: `assurly-backend/Dockerfile`
- **Build**: `gcloud builds submit`
- **Deploy**: `gcloud run deploy`
- **Region**: europe-west2

## 🔍 Quick Reference

### Important Commands

```bash
# Frontend
cd assurly-frontend
npm install          # Install dependencies
npm run dev          # Start dev server
npm run build        # Build for production
npm run lint         # Run linter

# Backend
cd assurly-backend
pip install -r requirements.txt  # Install dependencies
uvicorn main:app --reload        # Start dev server
python test_phase2_auth.py       # Run auth tests

# Git
git status                       # Check status
git add .                        # Stage changes
git commit -m "message"          # Commit changes
git push origin main             # Push to remote
```

### Important URLs

| Service | URL |
|---------|-----|
| **Production Frontend** | https://www.assurly.co.uk |
| **Production Backend** | https://assurly-frontend-400616570417.europe-west2.run.app |
| **Local Frontend** | http://localhost:5173 |
| **Local Backend** | http://localhost:8000 |
| **API Docs** | http://localhost:8000/docs |

## 📊 Project Statistics

### Frontend
- **Framework**: Vite + React 18 + TypeScript
- **Components**: 50+ custom components
- **UI Library**: 43 shadcn/ui components
- **Pages**: 15+ page components
- **Hooks**: 10+ custom hooks
- **Services**: 3 API services

### Backend
- **Framework**: FastAPI
- **Endpoints**: 22+ API endpoints
- **Models**: Pydantic validation
- **Database**: MySQL (Cloud SQL)
- **Authentication**: JWT + Magic Link

### Documentation
- **Total Docs**: 40+ documentation files
- **API Specs**: 3 comprehensive specs
- **Migration Guides**: 6 migration documents
- **Bug Fix Docs**: 6 detailed fix documents

## 🔐 Security Considerations

### Sensitive Files (Not in Git)
- `assurly-frontend/.env` - Frontend environment variables
- `assurly-backend/.env` - Backend environment variables
- `assurly-backend/*.pem` - Private keys
- `assurly-frontend/node_modules/` - Dependencies
- `assurly-backend/__pycache__/` - Python cache

### Configuration Locations
- **Frontend API URL**: `assurly-frontend/vite.config.ts`
- **Backend CORS**: `assurly-backend/main.py`
- **JWT Secret**: `assurly-backend/.env` (JWT_SECRET_KEY)
- **Database Credentials**: `assurly-backend/.env` (DB_*)

## 🎯 Best Practices

### When Adding New Features

1. **Update Documentation**
   - Add to appropriate README
   - Update API specs if backend changes
   - Document any new patterns

2. **Update Types**
   - TypeScript types in `assurly-frontend/src/types/`
   - Pydantic models in `assurly-backend/`

3. **Test Changes**
   - Frontend: Manual testing + browser tests
   - Backend: API testing with Swagger UI
   - Follow `TESTING_CHECKLIST.md`

4. **Update Dependencies**
   - Frontend: `package.json`
   - Backend: `requirements.txt`

### When Refactoring

1. **Check all references** in both frontend and backend
2. **Update documentation** to reflect new structure
3. **Update imports** across the codebase
4. **Test thoroughly** before committing

### When Fixing Bugs

1. **Document the fix** in `docs/fixes/` or `BUGFIX_SUMMARY.md`
2. **Update tests** if applicable
3. **Update related documentation**
4. **Add comments** explaining the fix

## 🤝 Contributing Guidelines

### Code Location
- **Frontend code**: `assurly-frontend/src/`
- **Backend code**: `assurly-backend/*.py`
- **Shared docs**: `docs/`

### Commit Messages
- Use descriptive commit messages
- Reference issue numbers when applicable
- Keep commits focused and atomic

### Branch Strategy
- `main` - Production (auto-deploys)
- `develop` - Development branch
- `feature/*` - Feature branches
- `fix/*` - Bug fix branches

## 📮 Support & Resources

### Getting Help
1. **Documentation**: Start with `docs/README.md`
2. **API Issues**: Check `assurly-backend/API_DOCUMENTATION.md`
3. **Frontend Issues**: Check `assurly-frontend/README.md`
4. **Migration Questions**: See `docs/MIGRATION_*.md`

### External Resources
- **Vite Documentation**: https://vitejs.dev/
- **React Documentation**: https://react.dev/
- **FastAPI Documentation**: https://fastapi.tiangolo.com/
- **shadcn/ui**: https://ui.shadcn.com/
- **Tailwind CSS**: https://tailwindcss.com/

## 📅 Version History

| Version | Date | Changes |
|---------|------|---------|
| **2.0.0** | Jan 2026 | Monorepo structure implemented |
| **1.x** | 2025 | Initial development phase |

## 🔮 Future Improvements

### Planned
- [ ] Automated testing suite
- [ ] CI/CD pipeline improvements
- [ ] Performance monitoring
- [ ] Enhanced error tracking

### Under Consideration
- [ ] Microservices architecture
- [ ] GraphQL API option
- [ ] Mobile app development
- [ ] Real-time features with WebSockets

---

**Maintained by**: Assurly Development Team  
**Last Review**: January 4, 2026  
**Next Review**: Quarterly or on major changes

For questions about this document or suggestions for improvement, please contact the development team.

