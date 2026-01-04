# Assurly - School Maturity Assessment Platform

Assurly is a production-ready, full-stack web platform for Multi-Academy Trusts (MATs) to conduct and manage maturity assessments across their schools. The platform combines secure authentication, real-time data synchronization, and powerful analytics to streamline assessment orchestration and drive strategic improvement.

**Live Platform**: [https://www.assurly.co.uk](https://www.assurly.co.uk)

## 📁 Project Structure

This is a **monorepo** containing both the frontend and backend applications:

```
Assurly/
├── assurly-frontend/          # React + TypeScript web application
│   ├── src/                   # Frontend source code
│   ├── public/                # Static assets
│   ├── dist/                  # Production build output
│   ├── package.json           # Frontend dependencies
│   ├── vite.config.ts         # Vite configuration
│   └── README.md             # Frontend documentation
│
├── assurly-backend/           # Python FastAPI backend service
│   ├── main.py               # FastAPI application
│   ├── auth_*.py             # Authentication modules
│   ├── email_service.py      # Email service
│   ├── requirements.txt      # Python dependencies
│   ├── Dockerfile            # Container configuration
│   └── README.md             # Backend documentation
│
├── docs/                      # Shared documentation
│   ├── api/                  # API specifications and current docs
│   │   ├── FRONTEND_API_SPECIFICATION_v4.md
│   │   ├── ASSESSMENT_API_SPECIFICATION_v4.md
│   │   ├── PROJECT_STRUCTURE.md
│   │   ├── REORGANIZATION_SUMMARY.md
│   │   └── V4_MIGRATION_SUMMARY.md
│   ├── archive/              # Historical documentation
│   │   ├── MIGRATION_*.md    # Migration guides
│   │   └── API_DOCUMENTATION_v1.md
│   ├── design/               # Design and branding docs
│   │   ├── BRANDING_UPDATES.md
│   │   └── ux-recommendations.md
│   └── fixes/                # Bug fix documentation
│
├── db.json                    # Mock database for development
└── README.md                 # This file
```

## 🚀 Quick Start

### Frontend Development

```bash
cd assurly-frontend
npm install
npm run dev
# Open http://localhost:5173
```

See [assurly-frontend/README.md](assurly-frontend/README.md) for detailed frontend documentation.

### Backend Development

```bash
cd assurly-backend
pip install -r requirements.txt
uvicorn main:app --reload
# API available at http://localhost:8000
# Swagger docs at http://localhost:8000/docs
```

See [assurly-backend/README.md](assurly-backend/README.md) for detailed backend documentation.

## System Architecture

### Frontend (React + TypeScript)
- **Framework**: Vite + React 18 + TypeScript
- **UI Library**: shadcn/ui (Radix UI + Tailwind CSS)
- **State Management**: React Context API + TanStack Query
- **Routing**: React Router v6
- **Deployment**: Vercel (https://www.assurly.co.uk)

### Backend (Python FastAPI)
- **Framework**: FastAPI + Uvicorn (ASGI)
- **Database**: MySQL (Google Cloud SQL)
- **Authentication**: JWT + Magic Link (passwordless)
- **Email**: SMTP (Gmail)
- **Deployment**: Google Cloud Run

### Data Flow

```
User Browser
    ↓
[Frontend - React App]
    ↓ (HTTPS REST API)
[Backend - FastAPI]
    ↓
[MySQL Database - Cloud SQL]
```

## ✨ Key Features

### 🔐 Authentication & Security
- Magic link authentication (passwordless)
- JWT session management with auto-refresh
- Role-based access control (MAT Admin / Department Head)
- Protected routes and API endpoints

### 👥 User Roles

**MAT Administrators**:
- Trust-wide assessment monitoring
- Analytics and performance insights
- Standards/aspects management
- Data export and reporting
- School performance rankings

**Department Heads**:
- Complete assessments for assigned schools
- Cross-school assessment management
- View history and trends
- Filter persistence

### 📊 Assessment Management
- Advanced filtering (school, category, status, term)
- Term-based navigation (academic year cycle)
- Real-time progress tracking
- Intervention flagging (score ≤ 1.5)
- Historical trends (3 terms)
- Auto-save with session recovery

### 📈 Analytics & Reporting
- Trust-wide performance dashboard
- Term-over-term trend analysis
- School performance rankings
- Category performance breakdown
- CSV export
- PDF assessment packs

### 🛠️ Standards Management
- Full CRUD for aspects and standards
- Drag-and-drop reordering
- Search and filtering
- Version control ready

## 🛠️ Technology Stack

### Frontend Technologies
| Category | Technology |
|----------|-----------|
| **Framework** | Vite, React 18, TypeScript |
| **Styling** | Tailwind CSS, shadcn/ui |
| **State** | React Context, TanStack Query |
| **Routing** | React Router v6 |
| **Forms** | React Hook Form, Zod |
| **Charts** | Recharts |
| **DnD** | @dnd-kit |
| **Icons** | Lucide React |

### Backend Technologies
| Category | Technology |
|----------|-----------|
| **Framework** | FastAPI 0.110.1 |
| **Server** | Uvicorn (ASGI) |
| **Database** | MySQL via PyMySQL |
| **Auth** | JWT (python-jose), bcrypt |
| **Email** | aiosmtplib, Jinja2 |
| **Validation** | Pydantic |

### Infrastructure
| Service | Technology |
|---------|-----------|
| **Frontend Hosting** | Vercel |
| **Backend Hosting** | Google Cloud Run |
| **Database** | Google Cloud SQL (MySQL) |
| **Email** | SMTP (Gmail) |
| **DNS/CDN** | Vercel |

## 🔧 Development Workflow

### 1. Frontend Development

```bash
# Navigate to frontend
cd assurly-frontend

# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### 2. Backend Development

```bash
# Navigate to backend
cd assurly-backend

# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Access API docs
# Swagger: http://localhost:8000/docs
# ReDoc: http://localhost:8000/redoc
```

### 3. Full Stack Development

Run both frontend and backend simultaneously:

```bash
# Terminal 1 - Backend
cd assurly-backend
uvicorn main:app --reload

# Terminal 2 - Frontend
cd assurly-frontend
npm run dev
```

The frontend dev server is configured to proxy API requests to the backend.

## 📚 API Documentation

### Complete API Reference

- **Frontend API Specification**: [docs/api/FRONTEND_API_SPECIFICATION_v4.md](docs/api/FRONTEND_API_SPECIFICATION_v4.md)
- **Assessment API Specification**: [docs/api/ASSESSMENT_API_SPECIFICATION_v4.md](docs/api/ASSESSMENT_API_SPECIFICATION_v4.md)
- **Backend API Documentation**: [assurly-backend/API_DOCUMENTATION.md](assurly-backend/API_DOCUMENTATION.md)

### Key Endpoints

**Authentication**
- `POST /api/auth/request-magic-link` - Request passwordless login
- `GET /api/auth/verify/{token}` - Verify magic link, get JWT
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

**Assessments**
- `GET /api/assessments` - List assessments (filterable)
- `GET /api/assessments/{id}` - Get assessment details
- `POST /api/assessments` - Create assessments
- `POST /api/assessments/{id}/submit` - Submit ratings

**Aspects & Standards**
- `GET /api/aspects` - List all aspects
- `POST /api/aspects` - Create aspect (auth required)
- `GET /api/standards` - List standards
- `POST /api/standards` - Create standard (auth required)

**Other**
- `GET /api/schools` - List schools
- `GET /api/terms` - List academic terms
- `GET /api/users` - List users

## ⚙️ Environment Configuration

### Frontend (.env in assurly-frontend/)

```env
VITE_API_BASE_URL=https://assurly-frontend-400616570417.europe-west2.run.app
VITE_FRONTEND_URL=https://www.assurly.co.uk
VITE_ENABLE_MOCK_API=false
```

### Backend (.env in assurly-backend/)

```env
# Database
DB_HOST=/cloudsql/project:region:instance
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=assurly_db

# JWT
JWT_SECRET_KEY=your-super-secret-key
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=60

# Magic Link
MAGIC_LINK_TOKEN_EXPIRY_MINUTES=15
FRONTEND_URL=https://www.assurly.co.uk

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@assurly.com
EMAIL_FROM_NAME=Assurly Platform
```

## 🚀 Deployment

### Frontend (Vercel)

```bash
# Automatic deployment from main branch
git push origin main

# Manual deployment
cd assurly-frontend
npm run build
vercel --prod
```

### Backend (Google Cloud Run)

```bash
cd assurly-backend

# Build and push
gcloud builds submit --tag gcr.io/PROJECT_ID/assurly-api

# Deploy
gcloud run deploy assurly-api \
  --image gcr.io/PROJECT_ID/assurly-api \
  --platform managed \
  --region europe-west2 \
  --allow-unauthenticated
```

## 🧪 Testing

### Frontend Testing
```bash
cd assurly-frontend

# Run linter
npm run lint

# Test authentication flow
node test-auth-flow.js

# Test token verification
node test-verify.js
```

### Backend Testing
```bash
cd assurly-backend

# Manual API testing
curl http://localhost:8000/api/aspects

# Test authentication
python test_phase2_auth.py

# Test Gmail credentials
python gmail_creds_test.py
```

## 📖 Documentation

### Getting Started
- **Frontend README**: [assurly-frontend/README.md](assurly-frontend/README.md)
- **Backend README**: [assurly-backend/README.md](assurly-backend/README.md)
- **Project Structure**: [docs/api/PROJECT_STRUCTURE.md](docs/api/PROJECT_STRUCTURE.md)
- **V4 Quick Start**: [docs/api/V4_QUICK_START.md](docs/api/V4_QUICK_START.md)

### API Documentation
- **Frontend API v4**: [docs/api/FRONTEND_API_SPECIFICATION_v4.md](docs/api/FRONTEND_API_SPECIFICATION_v4.md)
- **Assessment API**: [docs/api/ASSESSMENT_API_SPECIFICATION_v4.md](docs/api/ASSESSMENT_API_SPECIFICATION_v4.md)
- **Backend API**: [assurly-backend/API_DOCUMENTATION.md](assurly-backend/API_DOCUMENTATION.md)

### Architecture & Design
- **Migration Analysis**: [docs/archive/MIGRATION_ANALYSIS.md](docs/archive/MIGRATION_ANALYSIS.md)
- **Schema Analysis**: [docs/archive/SCHEMA_ANALYSIS.md](docs/archive/SCHEMA_ANALYSIS.md)
- **Field Mapping**: [docs/archive/FIELD_MAPPING_REFERENCE.md](docs/archive/FIELD_MAPPING_REFERENCE.md)
- **Branding Updates**: [docs/design/BRANDING_UPDATES.md](docs/design/BRANDING_UPDATES.md)
- **UX Recommendations**: [docs/design/ux-recommendations.md](docs/design/ux-recommendations.md)

### Project Organization
- **Reorganization Summary**: [docs/api/REORGANIZATION_SUMMARY.md](docs/api/REORGANIZATION_SUMMARY.md)
- **Documentation Organization**: [docs/api/DOCS_ORGANIZATION.md](docs/api/DOCS_ORGANIZATION.md)
- **V4 Migration**: [docs/api/V4_MIGRATION_SUMMARY.md](docs/api/V4_MIGRATION_SUMMARY.md)

### Bug Fixes & Changes
- **Bug Fixes**: [docs/fixes/](docs/fixes/)
- **Change Notes**: [docs/archive/changenotes.md](docs/archive/changenotes.md)

### Historical Documentation
- **Migration Guides**: [docs/archive/](docs/archive/)
- **Previous Versions**: [docs/archive/API_DOCUMENTATION_v1.md](docs/archive/API_DOCUMENTATION_v1.md)

## 🔧 Troubleshooting

### Common Issues

**Frontend won't start:**
```bash
cd assurly-frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

**Backend database connection errors:**
- Verify DB_HOST unix socket path
- Check database credentials
- Ensure Cloud SQL instance is running

**CORS errors:**
- Check backend CORS settings in `main.py`
- Verify frontend proxy in `vite.config.ts`
- Ensure origins are correctly configured

**Authentication not working:**
- Clear browser localStorage/sessionStorage
- Check JWT_SECRET_KEY matches between sessions
- Verify magic link token hasn't expired

**Email not sending:**
- Use Gmail app password, not account password
- Verify SMTP credentials in backend .env
- Check SMTP port (587 for TLS)

## 🤝 Contributing

### Code Style

**Frontend:**
- Use TypeScript with proper types (avoid `any`)
- Follow existing component patterns
- Use functional components with hooks
- Implement proper error boundaries
- Use Tailwind CSS for styling

**Backend:**
- Follow PEP 8 guidelines
- Use type hints
- Add docstrings to endpoints
- Implement proper error handling
- Use Pydantic for validation

### Commit Guidelines
- Use descriptive commit messages
- Reference issues/tickets when applicable
- Keep commits focused and atomic
- Test before committing

### Branch Strategy
- `main` - Production branch (auto-deploys)
- `develop` - Development branch
- Feature branches: `feature/feature-name`
- Bug fix branches: `fix/bug-name`

## 🔒 Security

### Production Checklist

**Backend:**
- [ ] Change JWT_SECRET_KEY to strong random value
- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS only
- [ ] Restrict CORS to specific origins
- [ ] Use Gmail app passwords
- [ ] Implement rate limiting
- [ ] Set up database backups
- [ ] Enable Cloud SQL high availability
- [ ] Use Secret Manager for sensitive data
- [ ] Configure IAM roles properly

**Frontend:**
- [ ] No sensitive data in client code
- [ ] Secure token storage
- [ ] HTTPS only
- [ ] CSP headers configured
- [ ] robots.txt for SEO protection
- [ ] Rate limiting on auth endpoints

### Current Security Features

✅ JWT token-based authentication  
✅ Magic link tokens expire after 15 minutes  
✅ Passwords hashed with bcrypt  
✅ SQL injection prevention (parameterized queries)  
✅ Input validation using Pydantic/Zod  
✅ CORS middleware configured  
✅ Automatic expired token cleanup  
✅ Role-based access control  
✅ Protected routes and endpoints  

## ⚡ Performance

### Frontend Optimizations
- Route-based code splitting
- Lazy loading of components
- Image optimization
- Request caching (stale-while-revalidate)
- Optimistic UI updates
- Virtual scrolling for long lists

### Backend Optimizations
- Database connection pooling
- Async operations
- Query optimization
- Response caching
- Pagination support

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile: iOS Safari, Chrome for Android

## 📄 License

Proprietary - Harbour Learning Trust

## 📞 Support

For questions or issues:
- Check documentation in [`docs/`](docs/)
- Review troubleshooting section above
- Contact the Assurly development team

---

**Current Version**: 2.0.0 (Monorepo Structure)  
**Last Updated**: January 4, 2026  
**Live Platform**: [https://www.assurly.co.uk](https://www.assurly.co.uk)  
**Maintained by**: Assurly Development Team
