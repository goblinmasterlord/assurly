# Assurly API Documentation - Aspects & Standards Endpoints

## Overview

This document describes the production-grade RESTful API endpoints for managing **Aspects** and **Standards** in the Assurly Assessment Management Platform.

All write endpoints (POST, PUT, DELETE) require JWT authentication via Bearer token in the Authorization header.

## Authentication

### Required Header for Write Operations
```
Authorization: Bearer <jwt_token>
```

Get your JWT token from the `/api/auth/verify/{token}` endpoint after requesting a magic link.

---

## Aspects API

Aspects represent high-level assessment categories (e.g., Education, Governance, Finance).

### 1. Get All Aspects

**GET** `/api/aspects`

Returns a list of all aspects with their standard counts.

**Authentication:** Not required

**Response:** `200 OK`

```json
[
  {
    "aspect_id": "education",
    "aspect_name": "Education",
    "standards_count": 12,
    "description": "Standards related to Education"
  }
]
```

---

### 2. Get Single Aspect

**GET** `/api/aspects/{aspect_id}`

Returns a specific aspect by ID.

**Authentication:** Not required

**Parameters:**
- `aspect_id` (path): The unique identifier for the aspect

**Response:** `200 OK`

```json
{
  "aspect_id": "education",
  "aspect_name": "Education",
  "standards_count": 12,
  "description": "Standards related to Education"
}
```

**Error Responses:**
- `404 Not Found`: Aspect not found

---

### 3. Create Aspect

**POST** `/api/aspects`

Creates a new aspect.

**Authentication:** Required (Bearer token)

**Request Body:**

```json
{
  "aspect_id": "safeguarding",
  "aspect_name": "Safeguarding"
}
```

**Response:** `201 Created`

```json
{
  "aspect_id": "safeguarding",
  "aspect_name": "Safeguarding",
  "standards_count": 0,
  "description": "Standards related to Safeguarding"
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing authentication token
- `409 Conflict`: Aspect with this ID already exists

---

### 4. Update Aspect

**PUT** `/api/aspects/{aspect_id}`

Updates an existing aspect's name.

**Authentication:** Required (Bearer token)

**Parameters:**
- `aspect_id` (path): The unique identifier for the aspect

**Request Body:**

```json
{
  "aspect_name": "Education & Learning"
}
```

**Response:** `200 OK`

```json
{
  "aspect_id": "education",
  "aspect_name": "Education & Learning",
  "standards_count": 12,
  "description": "Standards related to Education & Learning"
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing authentication token
- `404 Not Found`: Aspect not found

---

### 5. Delete Aspect

**DELETE** `/api/aspects/{aspect_id}`

Deletes an aspect. Will fail if there are standards associated with it.

**Authentication:** Required (Bearer token)

**Parameters:**
- `aspect_id` (path): The unique identifier for the aspect

**Response:** `204 No Content`

**Error Responses:**
- `401 Unauthorized`: Invalid or missing authentication token
- `404 Not Found`: Aspect not found
- `409 Conflict`: Cannot delete aspect because it has associated standards

---

## Standards API

Standards are specific assessment criteria within an aspect.

### 1. Get All Standards

**GET** `/api/standards`

Returns a list of all standards, optionally filtered by aspect.

**Authentication:** Not required

**Query Parameters:**
- `aspect_id` (optional): Filter standards by aspect ID

**Response:** `200 OK`

```json
[
  {
    "standard_id": "EDU001",
    "standard_name": "Quality of Teaching",
    "aspect_id": "education",
    "aspect_name": "Education",
    "description": "Standard for Quality of Teaching",
    "sort_order": 1
  }
]
```

---

### 2. Get Single Standard

**GET** `/api/standards/{standard_id}`

Returns a specific standard by ID.

**Authentication:** Not required

**Parameters:**
- `standard_id` (path): The unique identifier for the standard

**Response:** `200 OK`

```json
{
  "standard_id": "EDU001",
  "standard_name": "Quality of Teaching",
  "aspect_id": "education",
  "aspect_name": "Education",
  "description": "Standard for Quality of Teaching",
  "sort_order": null
}
```

**Error Responses:**
- `404 Not Found`: Standard not found

---

### 3. Create Standard

**POST** `/api/standards`

Creates a new standard.

**Authentication:** Required (Bearer token)

**Request Body:**

```json
{
  "standard_id": "EDU013",
  "standard_name": "Pupil Wellbeing",
  "aspect_id": "education",
  "description": "Standard for measuring pupil wellbeing programs and initiatives"
}
```

**Note:** The `description` field is optional but recommended for providing detailed information about the standard. This is stored in the database and returned in all standard responses.

**Response:** `201 Created`

```json
{
  "standard_id": "EDU013",
  "standard_name": "Pupil Wellbeing",
  "aspect_id": "education",
  "aspect_name": "Education",
  "description": "Standard for measuring pupil wellbeing programs",
  "sort_order": null
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing authentication token
- `404 Not Found`: Aspect not found
- `409 Conflict`: Standard with this ID already exists

---

### 4. Update Standard

**PUT** `/api/standards/{standard_id}`

Updates an existing standard. All fields are optional.

**Authentication:** Required (Bearer token)

**Parameters:**
- `standard_id` (path): The unique identifier for the standard

**Request Body:**

```json
{
  "standard_name": "Quality of Teaching and Learning",
  "aspect_id": "education",
  "description": "Updated description"
}
```

**Response:** `200 OK`

```json
{
  "standard_id": "EDU001",
  "standard_name": "Quality of Teaching and Learning",
  "aspect_id": "education",
  "aspect_name": "Education",
  "description": "Updated description",
  "sort_order": null
}
```

**Error Responses:**
- `400 Bad Request`: No fields provided for update
- `401 Unauthorized`: Invalid or missing authentication token
- `404 Not Found`: Standard or aspect not found

---

### 5. Delete Standard

**DELETE** `/api/standards/{standard_id}`

Deletes a standard. Will fail if there are assessments using this standard.

**Authentication:** Required (Bearer token)

**Parameters:**
- `standard_id` (path): The unique identifier for the standard

**Response:** `204 No Content`

**Error Responses:**
- `401 Unauthorized`: Invalid or missing authentication token
- `404 Not Found`: Standard not found
- `409 Conflict`: Cannot delete standard because it is used in assessments

---

## Error Response Format

All error responses follow this format:

```json
{
  "detail": "Error message describing what went wrong"
}
```

---

## Common HTTP Status Codes

- `200 OK`: Successful GET or PUT request
- `201 Created`: Successful POST request
- `204 No Content`: Successful DELETE request
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required or invalid token
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource already exists or has dependencies
- `500 Internal Server Error`: Server-side error

---

## Frontend Integration Examples

### JavaScript/TypeScript Examples

#### Get All Aspects

```javascript
const response = await fetch('https://api.assurly.com/api/aspects');
const aspects = await response.json();
```

#### Create a New Aspect (Authenticated)

```javascript
const response = await fetch('https://api.assurly.com/api/aspects', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    aspect_id: 'safeguarding',
    aspect_name: 'Safeguarding'
  })
});

if (response.status === 201) {
  const newAspect = await response.json();
  console.log('Created:', newAspect);
}
```

#### Update a Standard (Authenticated)

```javascript
const response = await fetch('https://api.assurly.com/api/standards/EDU001', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    standard_name: 'Quality of Teaching and Learning'
  })
});

if (response.ok) {
  const updatedStandard = await response.json();
  console.log('Updated:', updatedStandard);
}
```

#### Delete a Standard (Authenticated)

```javascript
const response = await fetch('https://api.assurly.com/api/standards/EDU013', {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${jwtToken}`
  }
});

if (response.status === 204) {
  console.log('Standard deleted successfully');
} else if (response.status === 409) {
  const error = await response.json();
  console.error('Cannot delete:', error.detail);
}
```

---

## Best Practices

1. **Always handle errors**: Check response status codes and handle error cases appropriately
2. **Use proper authentication**: Store JWT tokens securely (not in localStorage for production)
3. **Validate input**: Validate data on the frontend before sending to reduce unnecessary API calls
4. **Handle conflicts**: When creating resources, handle 409 Conflict responses gracefully
5. **Check dependencies**: Before deleting, inform users if deletion will fail due to dependencies
6. **Use loading states**: Show loading indicators during API calls for better UX
7. **Cache when appropriate**: Consider caching GET requests for aspects/standards that don't change frequently

---

## Migration Notes for Existing Frontend

### Changes from Previous API

1. **Added Authentication**: All write operations now require authentication
2. **Response Models**: Responses now follow strict Pydantic models with consistent structure
3. **Better Error Messages**: More descriptive error messages with proper HTTP status codes
4. **Individual Resource Access**: New GET endpoints for single resources (`/api/aspects/{id}`, `/api/standards/{id}`)
5. **Validation**: Input validation on all create/update operations
6. **Dependency Checks**: Cannot delete resources that have dependencies

### Required Frontend Updates

1. Add authentication headers to all POST, PUT, DELETE requests
2. Update error handling to handle new status codes (401, 404, 409)
3. Use the new individual resource endpoints for single-item views
4. Handle authentication errors and redirect to login if token expires
5. Update TypeScript interfaces to match new response models

---

## Support

For issues or questions, contact the Assurly development team or file an issue on the project repository.
