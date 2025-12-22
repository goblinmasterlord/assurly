# Assurly API Quick Reference Card

**Base URL:** `https://assurly-frontend-400616570417.europe-west2.run.app/api`  
**Full Documentation:** `/API_DOCUMENTATION.md`

## Authentication

All requests (except `/auth/*`) require JWT Bearer token:
```bash
Authorization: Bearer <token>
```

**Token Storage:** `localStorage.assurly_auth_token`

## Quick Endpoint Reference

### Authentication
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/request-magic-link` | Request magic link via email |
| GET | `/api/auth/verify/{token}` | Verify token and get JWT |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/logout` | Logout user |

### Assessments
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/assessments` | List all assessments (with filters) |
| GET | `/api/assessments/{id}` | Get assessment with standards |
| POST | `/api/assessments` | Create assessments (bulk) |
| POST | `/api/assessments/{id}/submit` | Submit/update ratings (UPSERT) |

### Schools
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/schools` | List schools (optional MAT filter) |

### Aspects
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/aspects` | List all aspects |
| POST | `/api/aspects` | Create aspect |
| PUT | `/api/aspects/{id}` | Update aspect |
| DELETE | `/api/aspects/{id}` | Delete aspect |

### Standards
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/standards` | List standards (optional aspect filter) |
| POST | `/api/standards` | Create standard |
| PUT | `/api/standards/{id}` | Update standard |
| DELETE | `/api/standards/{id}` | Delete standard |

### Users
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/users` | List users (with filters) |

## Common Query Parameters

### Assessments
- `school_id` - Filter by school
- `category` - Filter by category (education, hr, finance, etc.)
- `term` - Filter by term (T1, T2, T3)
- `academic_year` - Filter by year (e.g., "2024-25")
- `status` - Filter by status (completed, in_progress, not_started)

### Standards
- `aspect_id` - Filter by aspect

### Schools
- `mat_id` - Filter by MAT

### Users
- `school_id` - Filter by school
- `role` - Filter by role (mat_admin, department_head)

## Data Types

### Assessment Categories
`education` | `hr` | `finance` | `estates` | `governance` | `it` | `is` | `safeguarding` | `faith`

### Terms
- `T1` / `Autumn` - September to December
- `T2` / `Spring` - January to April  
- `T3` / `Summer` - May to July

### Rating Scale
- `1` - Inadequate
- `2` - Requires Improvement
- `3` - Good
- `4` - Outstanding
- `null` - Not rated

### Status
`not_started` | `in_progress` | `completed` | `overdue`

### User Roles
`mat_admin` | `department_head`

## Example Requests

### Get Assessments
```bash
curl -H "Authorization: Bearer <token>" \
  "https://assurly-frontend-400616570417.europe-west2.run.app/api/assessments?school_id=cedar-park-primary&status=in_progress"
```

### Submit Rating (Single Standard)
```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "assessment_id": "cedar-park-primary-education-T1-2024-25",
    "standards": [{
      "standard_id": "ES1",
      "rating": 4,
      "evidence_comments": "Excellent implementation",
      "submitted_by": "user123"
    }]
  }' \
  "https://assurly-frontend-400616570417.europe-west2.run.app/api/assessments/cedar-park-primary-education-T1-2024-25/submit"
```

### Create Assessments (Bulk)
```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "education",
    "school_ids": ["cedar-park-primary", "maple-grove-school"],
    "due_date": "2025-04-30",
    "term_id": "T1",
    "academic_year": "2024-25",
    "assigned_to": ["user123"]
  }' \
  "https://assurly-frontend-400616570417.europe-west2.run.app/api/assessments"
```

## Frontend Integration

### Service Layer
```typescript
import { assessmentService } from '@/services/enhanced-assessment-service';

// Get with caching
const assessments = await assessmentService.getAssessments();

// Subscribe to updates
const unsubscribe = assessmentService.subscribeToAssessments((data) => {
  console.log('Updated:', data);
});

// Submit with optimistic update
await assessmentService.submitAssessment(id, standards, userId);
```

### API Client
```typescript
import apiClient from '@/lib/api-client';

// Direct API call
const response = await apiClient.get('/api/assessments');

// Token is automatically included
// Errors are automatically handled
// 401 triggers automatic token refresh
```

## Error Handling

### Status Codes
- `200` - Success
- `400` - Bad Request (invalid data)
- `401` - Unauthorized (invalid/expired token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate or constraint violation)
- `429` - Rate Limit Exceeded
- `500` - Server Error

### Error Response Format
```json
{
  "detail": "Error message",
  "status_code": 400,
  "error_type": "ValidationError"
}
```

## Rate Limits
- **Auth endpoints:** 5 req/min per IP
- **GET operations:** 100 req/min per user
- **POST/PUT/DELETE:** 30 req/min per user

## Development

### Debug Mode
Set in environment: `VITE_DEBUG_API=true`

### Vite Proxy (Development)
```typescript
// vite.config.ts
proxy: {
  '/api': {
    target: 'https://assurly-frontend-400616570417.europe-west2.run.app',
    changeOrigin: true
  }
}
```

### Key Files
- `/API_DOCUMENTATION.md` - Complete API reference
- `/src/services/assessment-service.ts` - Direct API calls
- `/src/services/enhanced-assessment-service.ts` - Caching layer
- `/src/lib/api-client.ts` - HTTP client with interceptors
- `/src/lib/data-transformers.ts` - Backend ↔ Frontend mapping

## Support

**Issues?**
1. Check browser console
2. Verify token in localStorage
3. Check network tab (DevTools)
4. Review error `detail` field
5. Consult `/API_DOCUMENTATION.md`

**Last Updated:** December 21, 2025

