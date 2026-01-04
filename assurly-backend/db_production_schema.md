# Assurly Production Database Schema
## Multi-Tenant School Assessment Management Platform

**Version:** 2.0 (Production)  
**Date:** December 2025  
**Migration From:** Testing Schema v1.0

---

## Overview

This document defines the production database schema for Assurly, designed to support:

- **Multi-tenant MAT isolation** - Each MAT sees only their data
- **Customisable Standards & Aspects** - Copy-on-write from defaults, plus custom additions
- **Standards Versioning** - Full audit trail with historical assessment preservation
- **Flexible User-Aspect Assignment** - Many-to-many relationships at MAT level with optional school clustering
- **Soft Deletes** - Preserve historical data for analytics continuity

---

## Schema Diagram (Conceptual)

```
┌─────────────┐
│    mats     │◄─────────────────────────────────────────────────┐
└──────┬──────┘                                                  │
       │ 1:N                                                     │
       ▼                                                         │
┌─────────────┐      ┌──────────────────┐      ┌─────────────┐  │
│   schools   │      │ mat_aspects      │◄────►│   aspects   │  │
└──────┬──────┘      │ (copy-on-write)  │      │ (defaults)  │  │
       │             └────────┬─────────┘      └─────────────┘  │
       │                      │ 1:N                              │
       │                      ▼                                  │
       │             ┌──────────────────┐      ┌─────────────┐  │
       │             │ mat_standards    │◄────►│  standards  │  │
       │             │ (copy-on-write)  │      │ (defaults)  │  │
       │             └────────┬─────────┘      └─────────────┘  │
       │                      │                                  │
       │                      │ versioned via                    │
       │                      ▼                                  │
       │             ┌──────────────────┐                        │
       │             │standard_versions │                        │
       │             └────────┬─────────┘                        │
       │                      │                                  │
       ▼                      ▼                                  │
┌─────────────────────────────────────────────────────────────┐ │
│                       assessments                            │ │
│  (references mat_standard_id + standard_version_id)          │ │
└─────────────────────────────────────────────────────────────┘ │
                                                                 │
┌─────────────┐      ┌──────────────────┐                        │
│    users    │◄────►│user_aspect_assign│────────────────────────┘
└─────────────┘      └──────────────────┘
       │
       ▼
┌─────────────┐
│   terms     │ (global reference data)
└─────────────┘
```

---

## Table Definitions

### 1. `mats` (Multi-Academy Trusts)

Primary client entity. Each MAT is a tenant with isolated data.

```sql
CREATE TABLE mats (
    mat_id              CHAR(36) PRIMARY KEY,
    mat_name            VARCHAR(255) NOT NULL,
    mat_code            VARCHAR(50) UNIQUE,              -- Short identifier (e.g., "HLT")
    
    -- Onboarding & Status
    onboarding_status   ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
    onboarding_started_at TIMESTAMP NULL,
    onboarding_completed_at TIMESTAMP NULL,
    is_active           BOOLEAN DEFAULT TRUE,
    
    -- Branding (for PDF reports)
    logo_url            VARCHAR(500) NULL,
    primary_colour      VARCHAR(7) NULL,                 -- Hex colour code
    
    -- Metadata
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_mats_active (is_active),
    INDEX idx_mats_onboarding (onboarding_status)
);
```

---

### 2. `schools`

Schools within a MAT. Includes a special "Central/Trust Office" record for MAT-level staff.

```sql
CREATE TABLE schools (
    school_id           CHAR(36) PRIMARY KEY,
    school_name         VARCHAR(255) NOT NULL,
    mat_id              CHAR(36) NOT NULL,
    
    -- School metadata
    school_code         VARCHAR(50) NULL,                -- URN or internal code
    school_type         ENUM('primary', 'secondary', 'all_through', 'special', 'central') DEFAULT 'primary',
    is_central_office   BOOLEAN DEFAULT FALSE,           -- TRUE for "Trust Office" pseudo-school
    
    -- Status
    is_active           BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (mat_id) REFERENCES mats(mat_id) ON DELETE CASCADE,
    INDEX idx_schools_mat (mat_id),
    INDEX idx_schools_active (mat_id, is_active)
);
```

**Note:** When onboarding a MAT, automatically create a "Central Office" school record with `is_central_office = TRUE`. MAT-level users (CEO, CFO, etc.) are assigned to this pseudo-school.

---

### 3. `users`

User accounts with MAT-level tenancy and optional school restriction.

```sql
CREATE TABLE users (
    user_id             CHAR(36) PRIMARY KEY,
    email               VARCHAR(255) NOT NULL UNIQUE,
    full_name           VARCHAR(255) NOT NULL,
    
    -- Tenancy
    mat_id              CHAR(36) NOT NULL,
    school_id           CHAR(36) NULL,                   -- NULL = access to all schools in MAT
    
    -- Role (job title for display/assignment, not permissions)
    role_title          VARCHAR(100) NULL,               -- e.g., "Director of Estates", "CFO"
    
    -- Status
    is_active           BOOLEAN DEFAULT TRUE,
    
    -- Authentication (magic link)
    magic_link_token    VARCHAR(255) NULL,
    token_expires_at    TIMESTAMP NULL,
    last_login          TIMESTAMP NULL,
    
    -- Metadata
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (mat_id) REFERENCES mats(mat_id) ON DELETE CASCADE,
    FOREIGN KEY (school_id) REFERENCES schools(school_id) ON DELETE SET NULL,
    INDEX idx_users_mat (mat_id),
    INDEX idx_users_email (email),
    INDEX idx_users_magic_token (magic_link_token)
);
```

**Access Logic:**
- `school_id = NULL` → User sees all schools in their MAT
- `school_id = [specific]` → User restricted to that school only

---

### 4. `aspects` (Global Defaults)

Default assessment aspects available to all MATs. Read-only reference table.

```sql
CREATE TABLE aspects (
    aspect_id           CHAR(36) PRIMARY KEY,
    aspect_code         VARCHAR(20) NOT NULL UNIQUE,     -- e.g., "EDU", "HR", "FIN"
    aspect_name         VARCHAR(255) NOT NULL,           -- e.g., "Education", "Human Resources"
    aspect_description  TEXT NULL,
    sort_order          INT DEFAULT 0,
    
    -- Metadata
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed default aspects
INSERT INTO aspects (aspect_id, aspect_code, aspect_name, sort_order) VALUES
    (UUID(), 'EDU', 'Education', 1),
    (UUID(), 'HR', 'Human Resources', 2),
    (UUID(), 'FIN', 'Finance & Procurement', 3),
    (UUID(), 'EST', 'Estates', 4),
    (UUID(), 'GOV', 'Governance', 5),
    (UUID(), 'IT', 'IT & Information Services', 6);
```

---

### 5. `mat_aspects` (MAT-Specific Aspects - Copy-on-Write)

MAT's working set of aspects. Includes copies of defaults (when modified) and custom additions.

```sql
CREATE TABLE mat_aspects (
    mat_aspect_id       CHAR(36) PRIMARY KEY,
    mat_id              CHAR(36) NOT NULL,
    
    -- Link to default (NULL if custom)
    source_aspect_id    CHAR(36) NULL,                   -- References aspects.aspect_id
    
    -- Aspect definition (copied from default or custom)
    aspect_code         VARCHAR(20) NOT NULL,
    aspect_name         VARCHAR(255) NOT NULL,
    aspect_description  TEXT NULL,
    sort_order          INT DEFAULT 0,
    
    -- Tracking
    is_custom           BOOLEAN DEFAULT FALSE,           -- TRUE if entirely custom (no source)
    is_modified         BOOLEAN DEFAULT FALSE,           -- TRUE if modified from default
    is_active           BOOLEAN DEFAULT TRUE,            -- Soft delete
    
    -- Metadata
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by_user_id  CHAR(36) NULL,
    
    FOREIGN KEY (mat_id) REFERENCES mats(mat_id) ON DELETE CASCADE,
    FOREIGN KEY (source_aspect_id) REFERENCES aspects(aspect_id) ON DELETE SET NULL,
    FOREIGN KEY (created_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    
    UNIQUE KEY uk_mat_aspect_code (mat_id, aspect_code),
    INDEX idx_mat_aspects_mat (mat_id),
    INDEX idx_mat_aspects_active (mat_id, is_active)
);
```

**Copy-on-Write Logic:**
1. During onboarding, MAT selects which default aspects to use
2. Selected defaults are copied to `mat_aspects` with `source_aspect_id` set, `is_custom = FALSE`, `is_modified = FALSE`
3. If MAT edits an aspect, set `is_modified = TRUE`
4. Custom aspects have `source_aspect_id = NULL`, `is_custom = TRUE`

---

### 6. `standards` (Global Defaults)

Default assessment standards. Read-only reference table.

```sql
CREATE TABLE standards (
    standard_id         CHAR(36) PRIMARY KEY,
    aspect_id           CHAR(36) NOT NULL,               -- References aspects.aspect_id
    
    standard_code       VARCHAR(20) NOT NULL,            -- e.g., "ES1", "HR2", "FM3"
    standard_name       VARCHAR(255) NOT NULL,
    standard_description TEXT NULL,
    sort_order          INT DEFAULT 0,
    
    -- Metadata
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (aspect_id) REFERENCES aspects(aspect_id) ON DELETE CASCADE,
    UNIQUE KEY uk_standard_code (standard_code),
    INDEX idx_standards_aspect (aspect_id)
);
```

---

### 7. `mat_standards` (MAT-Specific Standards - Copy-on-Write)

MAT's working set of standards with versioning support.

```sql
CREATE TABLE mat_standards (
    mat_standard_id     CHAR(36) PRIMARY KEY,
    mat_id              CHAR(36) NOT NULL,
    mat_aspect_id       CHAR(36) NOT NULL,               -- References mat_aspects
    
    -- Link to default (NULL if custom)
    source_standard_id  CHAR(36) NULL,                   -- References standards.standard_id
    
    -- Standard definition
    standard_code       VARCHAR(20) NOT NULL,
    standard_name       VARCHAR(255) NOT NULL,
    standard_description TEXT NULL,
    sort_order          INT DEFAULT 0,
    
    -- Tracking
    is_custom           BOOLEAN DEFAULT FALSE,
    is_modified         BOOLEAN DEFAULT FALSE,
    is_active           BOOLEAN DEFAULT TRUE,            -- Soft delete
    
    -- Current version reference (denormalised for performance)
    current_version_id  CHAR(36) NULL,
    
    -- Metadata
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by_user_id  CHAR(36) NULL,
    
    FOREIGN KEY (mat_id) REFERENCES mats(mat_id) ON DELETE CASCADE,
    FOREIGN KEY (mat_aspect_id) REFERENCES mat_aspects(mat_aspect_id) ON DELETE CASCADE,
    FOREIGN KEY (source_standard_id) REFERENCES standards(standard_id) ON DELETE SET NULL,
    FOREIGN KEY (created_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    
    UNIQUE KEY uk_mat_standard_code (mat_id, standard_code),
    INDEX idx_mat_standards_mat (mat_id),
    INDEX idx_mat_standards_aspect (mat_aspect_id),
    INDEX idx_mat_standards_active (mat_id, is_active)
);
```

---

### 8. `standard_versions` (Version History)

Immutable version records for standards. Assessments reference specific versions.

```sql
CREATE TABLE standard_versions (
    version_id          CHAR(36) PRIMARY KEY,
    mat_standard_id     CHAR(36) NOT NULL,
    
    -- Version tracking
    version_number      INT NOT NULL DEFAULT 1,
    
    -- Snapshot of standard at this version
    standard_code       VARCHAR(20) NOT NULL,
    standard_name       VARCHAR(255) NOT NULL,
    standard_description TEXT NULL,
    
    -- Lineage
    parent_version_id   CHAR(36) NULL,                   -- Previous version (NULL for v1)
    
    -- Validity period
    effective_from      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    effective_to        TIMESTAMP NULL,                  -- NULL = current version
    
    -- Audit
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by_user_id  CHAR(36) NULL,
    change_reason       TEXT NULL,                       -- Optional note explaining the change
    
    FOREIGN KEY (mat_standard_id) REFERENCES mat_standards(mat_standard_id) ON DELETE CASCADE,
    FOREIGN KEY (parent_version_id) REFERENCES standard_versions(version_id) ON DELETE SET NULL,
    FOREIGN KEY (created_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    
    UNIQUE KEY uk_standard_version (mat_standard_id, version_number),
    INDEX idx_versions_standard (mat_standard_id),
    INDEX idx_versions_effective (mat_standard_id, effective_to)
);
```

**Versioning Logic:**
1. When a MAT standard is created, create version 1 with `effective_to = NULL`
2. When edited:
   - Set current version's `effective_to = NOW()`
   - Create new version with incremented `version_number`, `parent_version_id` pointing to old version
   - Update `mat_standards.current_version_id`
3. Assessments always reference `version_id`, preserving historical accuracy

---

### 9. `terms` (Global Reference Data)

Academic terms - global reference table (unchanged from testing).

```sql
CREATE TABLE terms (
    unique_term_id      VARCHAR(20) PRIMARY KEY,         -- e.g., "T1-2024-25"
    term_id             VARCHAR(10) NOT NULL,            -- e.g., "T1", "T2", "T3"
    term_name           VARCHAR(50) NOT NULL,            -- e.g., "Autumn Term"
    start_date          DATE NOT NULL,
    end_date            DATE NOT NULL,
    academic_year       VARCHAR(9) NOT NULL,             -- e.g., "2024-25"
    
    INDEX idx_terms_year (academic_year),
    INDEX idx_terms_dates (start_date, end_date)
);
```

---

### 10. `assessments` (Core Assessment Data)

Assessment ratings per school, per standard version, per term.

```sql
CREATE TABLE assessments (
    id                  CHAR(36) PRIMARY KEY,
    
    -- Generated composite ID for compatibility
    assessment_id       VARCHAR(100) AS (
        CONCAT(school_id, '-', mat_standard_id, '-', unique_term_id)
    ) STORED,
    
    -- Core references
    school_id           CHAR(36) NOT NULL,
    mat_standard_id     CHAR(36) NOT NULL,
    version_id          CHAR(36) NOT NULL,               -- Specific version assessed against
    unique_term_id      VARCHAR(20) NOT NULL,
    academic_year       VARCHAR(9) NOT NULL,
    
    -- Assessment data
    rating              INT NULL CHECK (rating BETWEEN 1 AND 4),
    evidence_comments   TEXT NULL,
    
    -- Workflow
    status              ENUM('not_started', 'in_progress', 'completed', 'approved') DEFAULT 'not_started',
    due_date            DATE NULL,
    submitted_at        TIMESTAMP NULL,
    approved_at         TIMESTAMP NULL,
    
    -- Assignment
    assigned_to         CHAR(36) NULL,
    submitted_by        CHAR(36) NULL,
    approved_by         CHAR(36) NULL,
    
    -- Metadata
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by          VARCHAR(255) NULL,
    
    -- External sync
    synced_to_configur_at TIMESTAMP NULL,
    
    FOREIGN KEY (school_id) REFERENCES schools(school_id) ON DELETE CASCADE,
    FOREIGN KEY (mat_standard_id) REFERENCES mat_standards(mat_standard_id) ON DELETE CASCADE,
    FOREIGN KEY (version_id) REFERENCES standard_versions(version_id) ON DELETE RESTRICT,
    FOREIGN KEY (unique_term_id) REFERENCES terms(unique_term_id) ON DELETE RESTRICT,
    FOREIGN KEY (assigned_to) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (submitted_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(user_id) ON DELETE SET NULL,
    
    UNIQUE KEY uk_assessment (school_id, mat_standard_id, unique_term_id),
    INDEX idx_assessments_school (school_id),
    INDEX idx_assessments_term (unique_term_id),
    INDEX idx_assessments_year (academic_year),
    INDEX idx_assessments_status (status),
    INDEX idx_assessments_assigned (assigned_to)
);
```

**Analytics Note:** 
- Term-on-term comparisons within same `version_id` are directly comparable
- Cross-version comparisons can use `mat_standard_id` but should flag that the standard definition changed
- The `version_id` foreign key uses `ON DELETE RESTRICT` to prevent accidental deletion of versions with assessments

---

### 11. `user_aspect_assignments` (Many-to-Many User-Aspect Mapping)

Maps users to aspects they're responsible for, with optional school clustering.

```sql
CREATE TABLE user_aspect_assignments (
    assignment_id       CHAR(36) PRIMARY KEY,
    user_id             CHAR(36) NOT NULL,
    mat_aspect_id       CHAR(36) NOT NULL,
    
    -- School scope (NULL = all schools, otherwise specific schools)
    -- For cluster assignments, create multiple rows
    school_id           CHAR(36) NULL,                   -- NULL = responsible for all schools
    
    -- Notification preferences
    notify_on_term_open BOOLEAN DEFAULT TRUE,
    notify_on_due_date  BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by_user_id CHAR(36) NULL,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (mat_aspect_id) REFERENCES mat_aspects(mat_aspect_id) ON DELETE CASCADE,
    FOREIGN KEY (school_id) REFERENCES schools(school_id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    
    -- Prevent duplicate assignments
    UNIQUE KEY uk_user_aspect_school (user_id, mat_aspect_id, school_id),
    INDEX idx_assignments_user (user_id),
    INDEX idx_assignments_aspect (mat_aspect_id)
);
```

**Assignment Scenarios:**

| Scenario | Records |
|----------|---------|
| Paul handles Estates for ALL schools | 1 row: `school_id = NULL` |
| Paul handles Estates for Schools A, B only | 2 rows: one per school |
| Sarah handles HR for School C only | 1 row: `school_id = C` |
| Multiple people share an aspect | Multiple rows with same `mat_aspect_id` |

---

### 12. `standard_edit_log` (Audit Trail)

Detailed audit log for standard changes.

```sql
CREATE TABLE standard_edit_log (
    log_id              CHAR(36) PRIMARY KEY,
    mat_standard_id     CHAR(36) NOT NULL,
    version_id          CHAR(36) NULL,                   -- Version created by this edit
    
    -- Audit details
    action_type         ENUM('created', 'edited', 'disabled', 'restored') NOT NULL,
    edited_by_user_id   CHAR(36) NULL,
    edited_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Change details (JSON for flexibility)
    old_values          JSON NULL,
    new_values          JSON NULL,
    change_reason       TEXT NULL,
    
    FOREIGN KEY (mat_standard_id) REFERENCES mat_standards(mat_standard_id) ON DELETE CASCADE,
    FOREIGN KEY (version_id) REFERENCES standard_versions(version_id) ON DELETE SET NULL,
    FOREIGN KEY (edited_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    
    INDEX idx_edit_log_standard (mat_standard_id),
    INDEX idx_edit_log_date (edited_at)
);
```


### 13. `Terms` Reference
- `unique_term_id` format: VARCHAR(20) e.g., "T1-2024-25"
- No changes to terms endpoints needed
- Terms remain global (not MAT-specific)

---

## Views

### View: `v_mat_standards_current`

Convenience view for getting current active standards for a MAT.

```sql
CREATE VIEW v_mat_standards_current AS
SELECT 
    ms.mat_standard_id,
    ms.mat_id,
    ms.standard_code,
    ms.standard_name,
    ms.standard_description,
    ms.sort_order,
    ms.is_custom,
    ms.is_modified,
    ma.mat_aspect_id,
    ma.aspect_code,
    ma.aspect_name,
    sv.version_id AS current_version_id,
    sv.version_number AS current_version_number
FROM mat_standards ms
JOIN mat_aspects ma ON ms.mat_aspect_id = ma.mat_aspect_id
LEFT JOIN standard_versions sv ON ms.current_version_id = sv.version_id
WHERE ms.is_active = TRUE AND ma.is_active = TRUE;
```

### View: `v_assessments_full`

Denormalised view for assessment queries with all related data.

```sql
CREATE VIEW v_assessments_full AS
SELECT 
    a.id,
    a.assessment_id,
    a.rating,
    a.evidence_comments,
    a.status,
    a.due_date,
    a.academic_year,
    a.unique_term_id,
    t.term_name,
    s.school_id,
    s.school_name,
    s.mat_id,
    m.mat_name,
    ms.mat_standard_id,
    ms.standard_code,
    ms.standard_name,
    sv.version_id,
    sv.version_number,
    ma.mat_aspect_id,
    ma.aspect_code,
    ma.aspect_name,
    assigned_user.full_name AS assigned_to_name,
    a.last_updated
FROM assessments a
JOIN schools s ON a.school_id = s.school_id
JOIN mats m ON s.mat_id = m.mat_id
JOIN mat_standards ms ON a.mat_standard_id = ms.mat_standard_id
JOIN standard_versions sv ON a.version_id = sv.version_id
JOIN mat_aspects ma ON ms.mat_aspect_id = ma.mat_aspect_id
JOIN terms t ON a.unique_term_id = t.unique_term_id
LEFT JOIN users assigned_user ON a.assigned_to = assigned_user.user_id;
```

### View: User aspect assignments with details

CREATE OR REPLACE VIEW v_user_aspect_assignments AS
SELECT 
    uaa.assignment_id,
    uaa.user_id,
    u.full_name AS user_name,
    u.email AS user_email,
    u.role_title,
    uaa.mat_aspect_id,
    ma.aspect_code,
    ma.aspect_name,
    uaa.school_id,
    s.school_name,
    uaa.notify_on_term_open,
    uaa.notify_on_due_date,
    m.mat_id,
    m.mat_name
FROM user_aspect_assignments uaa
JOIN users u ON uaa.user_id = u.user_id
JOIN mat_aspects ma ON uaa.mat_aspect_id = ma.mat_aspect_id
JOIN mats m ON ma.mat_id = m.mat_id
LEFT JOIN schools s ON uaa.school_id = s.school_id;


### View: MAT summary statistics

CREATE OR REPLACE VIEW v_mat_summary AS
SELECT 
    m.mat_id,
    m.mat_name,
    m.mat_code,
    m.onboarding_status,
    m.is_active,
    (SELECT COUNT(*) FROM schools s WHERE s.mat_id = m.mat_id AND s.is_active = TRUE AND s.is_central_office = FALSE) AS school_count,
    (SELECT COUNT(*) FROM users u WHERE u.mat_id = m.mat_id AND u.is_active = TRUE) AS user_count,
    (SELECT COUNT(*) FROM mat_aspects ma WHERE ma.mat_id = m.mat_id AND ma.is_active = TRUE) AS aspect_count,
    (SELECT COUNT(*) FROM mat_standards ms WHERE ms.mat_id = m.mat_id AND ms.is_active = TRUE) AS standard_count,
    m.created_at,
    m.updated_at
FROM mats m;


### View: Assessment completion by school and term

CREATE OR REPLACE VIEW v_assessment_completion AS
SELECT 
    s.school_id,
    s.school_name,
    s.mat_id,
    a.unique_term_id,
    a.academic_year,
    COUNT(*) AS total_assessments,
    SUM(CASE WHEN a.rating IS NOT NULL THEN 1 ELSE 0 END) AS completed_assessments,
    ROUND(SUM(CASE WHEN a.rating IS NOT NULL THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) AS completion_percentage,
    ROUND(AVG(a.rating), 2) AS average_rating
FROM assessments a
JOIN schools s ON a.school_id = s.school_id
GROUP BY s.school_id, s.school_name, s.mat_id, a.unique_term_id, a.academic_year;


INSERT INTO assurly_backup_v1.migration_log (step, notes) 
VALUES ('views_created', 'All convenience views created');

SELECT 'Views created successfully.' AS status;


---

## API Query Patterns

### Get all standards for a MAT (with aspects)
```sql
SELECT * FROM v_mat_standards_current 
WHERE mat_id = ? 
ORDER BY aspect_code, sort_order;
```

### Get assessments for a school/term
```sql
SELECT * FROM v_assessments_full
WHERE school_id = ? AND unique_term_id = ?
ORDER BY aspect_code, standard_code;
```

### Get user's assigned aspects
```sql
SELECT 
    ma.aspect_code,
    ma.aspect_name,
    uaa.school_id,
    s.school_name
FROM user_aspect_assignments uaa
JOIN mat_aspects ma ON uaa.mat_aspect_id = ma.mat_aspect_id
LEFT JOIN schools s ON uaa.school_id = s.school_id
WHERE uaa.user_id = ?;
```

### Check if standard version changed between terms
```sql
SELECT 
    a1.unique_term_id AS term_1,
    a2.unique_term_id AS term_2,
    a1.version_id = a2.version_id AS same_version
FROM assessments a1
JOIN assessments a2 ON a1.mat_standard_id = a2.mat_standard_id 
                   AND a1.school_id = a2.school_id
WHERE a1.unique_term_id = 'T1-2024-25' 
  AND a2.unique_term_id = 'T2-2024-25';
```

---

## API Migration Guide

### Current vs New Endpoint Mapping

This section maps current API endpoints to required changes for multi-tenant support.

#### Authentication Endpoints (Minimal Changes)

| Endpoint | Current | Changes Required |
|----------|---------|------------------|
| `POST /api/auth/request-magic-link` | Works | No change |
| `GET /api/auth/verify/{token}` | Returns user with `role` | Add `mat_id` to response, rename `role` → `role_title` |
| `GET /api/auth/me` | Returns user info | Add `mat_id`, `mat_name`, user's aspect assignments |
| `POST /api/auth/logout` | Works | No change |

**Updated `/api/auth/me` response:**
```json
{
  "user_id": "user123",
  "email": "user@example.com",
  "full_name": "John Doe",
  "role_title": "Director of Estates",
  "mat_id": "mat-uuid",
  "mat_name": "Opal Learning Trust",
  "school_id": null,
  "assigned_aspects": [
    {
      "mat_aspect_id": "aspect-uuid",
      "aspect_code": "EST",
      "aspect_name": "Estates",
      "school_ids": null
    }
  ]
}
```

---

#### Assessment Endpoints (Major Changes)

| Endpoint | Current | Changes Required |
|----------|---------|------------------|
| `GET /api/assessments` | Global query | **Add MAT filtering** - only return assessments for user's MAT |
| `GET /api/assessments/{id}` | Uses composite ID | Keep composite ID format but validate MAT access |
| `POST /api/assessments` | Creates by category | Reference `mat_standard_id` + `version_id` instead of global standard |
| `POST /api/assessments/{id}/submit` | Uses `standard_id` | **Change to `mat_standard_id`** in request body |

**Key Changes:**

1. **Tenant Isolation**: All assessment queries must filter by `mat_id` derived from the authenticated user's token.

2. **Standard References**: Change from global `standard_id` to MAT-specific references:

**Current request:**
```json
{
  "standards": [
    {
      "standard_id": "ES1",
      "rating": 4,
      "evidence_comments": "..."
    }
  ]
}
```

**New request:**
```json
{
  "standards": [
    {
      "mat_standard_id": "mat-standard-uuid",
      "rating": 4,
      "evidence_comments": "..."
    }
  ]
}
```

3. **Response Enhancement**: Include version information for analytics:

**New assessment detail response:**
```json
{
  "assessment_id": "...",
  "standards": [
    {
      "mat_standard_id": "uuid",
      "standard_code": "ES1",
      "standard_name": "Quality of Education",
      "version_id": "version-uuid",
      "version_number": 2,
      "rating": 3,
      "evidence_comments": "..."
    }
  ]
}
```

---

#### School Endpoints (Minor Changes)

| Endpoint | Current | Changes Required |
|----------|---------|------------------|
| `GET /api/schools` | Filter by `mat_id` param | **Auto-filter by user's MAT** from token |

**Security Enhancement**: Remove `mat_id` query parameter. Always derive from authenticated user's JWT claims.

```python
# Before
@app.get("/api/schools")
async def get_schools(mat_id: Optional[str] = None):
    ...

# After  
@app.get("/api/schools")
async def get_schools(current_user: User = Depends(get_current_user)):
    mat_id = current_user.mat_id  # From JWT
    ...
```

---

#### Standards & Aspects Endpoints (Major Refactor)

These endpoints need the most significant changes to support the copy-on-write model.

| Endpoint | Current | Changes Required |
|----------|---------|------------------|
| `GET /api/aspects` | Returns global aspects | **Return MAT's aspects** from `mat_aspects` table |
| `POST /api/aspects` | Creates global | Create in `mat_aspects` with `is_custom=TRUE` |
| `PUT /api/aspects/{id}` | Updates global | Update `mat_aspects`, set `is_modified=TRUE` |
| `DELETE /api/aspects/{id}` | Deletes global | Soft delete (`is_active=FALSE`) in `mat_aspects` |
| `GET /api/standards` | Returns global | **Return MAT's standards** from `mat_standards` |
| `POST /api/standards` | Creates global | Create in `mat_standards` with versioning |
| `PUT /api/standards/{id}` | Updates global | **Create new version**, update `mat_standards.current_version_id` |
| `DELETE /api/standards/{id}` | Deletes global | Soft delete in `mat_standards` |

**New Endpoints Required:**

```
GET  /api/standards/{mat_standard_id}/history
     Returns version history for a standard
     
POST /api/standards/{mat_standard_id}/restore/{version_id}
     Restore a previous version (creates new version with old content)

GET  /api/onboarding/default-aspects
     Returns global default aspects for onboarding flow
     
GET  /api/onboarding/default-standards?aspect_id={id}
     Returns global default standards for onboarding flow

POST /api/onboarding/select-aspects
     Copies selected default aspects to mat_aspects
     
POST /api/onboarding/select-standards
     Copies selected default standards to mat_standards with initial versions
```

---

#### User Endpoints (Enhanced)

| Endpoint | Current | Changes Required |
|----------|---------|------------------|
| `GET /api/users` | Filter by school/role | **Add MAT isolation**, filter by user's MAT |

**New Endpoints Required:**

```
GET  /api/users/{user_id}/aspect-assignments
     Returns user's aspect assignments

POST /api/users/{user_id}/aspect-assignments
     Assign aspects to user (with optional school scoping)

DELETE /api/users/{user_id}/aspect-assignments/{assignment_id}
     Remove aspect assignment

GET  /api/aspects/{mat_aspect_id}/assigned-users
     Get users assigned to an aspect (for notifications)
```

---

### JWT Token Changes

**Current JWT payload:**
```json
{
  "user_id": "user123",
  "email": "user@example.com",
  "role": "mat_admin",
  "exp": 1703232000
}
```

**New JWT payload:**
```json
{
  "user_id": "user123",
  "email": "user@example.com",
  "mat_id": "mat-uuid",
  "school_id": null,
  "exp": 1703232000
}
```

**Key Changes:**
- Add `mat_id` for tenant isolation
- Keep `school_id` for school-restricted users
- Remove `role` (not used for permissions currently)

---

### Database Query Patterns

**Always include MAT filter:**
```python
# Middleware/dependency to get current user's MAT
async def get_current_mat(current_user: User = Depends(get_current_user)) -> str:
    return current_user.mat_id

# Use in all queries
@app.get("/api/assessments")
async def get_assessments(mat_id: str = Depends(get_current_mat)):
    query = """
        SELECT a.* FROM assessments a
        JOIN schools s ON a.school_id = s.school_id
        WHERE s.mat_id = %s
    """
    # ... execute with mat_id
```

**Standards query with versioning:**
```python
@app.get("/api/standards")
async def get_standards(
    mat_id: str = Depends(get_current_mat),
    aspect_id: Optional[str] = None
):
    query = """
        SELECT 
            ms.mat_standard_id,
            ms.standard_code,
            ms.standard_name,
            ms.standard_description,
            sv.version_id,
            sv.version_number,
            ma.aspect_code,
            ma.aspect_name
        FROM mat_standards ms
        JOIN mat_aspects ma ON ms.mat_aspect_id = ma.mat_aspect_id
        LEFT JOIN standard_versions sv ON ms.current_version_id = sv.version_id
        WHERE ms.mat_id = %s 
          AND ms.is_active = TRUE
          AND ma.is_active = TRUE
    """
    params = [mat_id]
    
    if aspect_id:
        query += " AND ma.mat_aspect_id = %s"
        params.append(aspect_id)
    
    query += " ORDER BY ma.sort_order, ms.sort_order"
```

---

### Frontend Migration Notes

**Type Changes (`../assurly-frontend/src/types/assessment.ts`):**

```typescript
// Current
interface Standard {
  standard_id: string;
  standard_name: string;
  // ...
}

// New
interface Standard {
  mat_standard_id: string;  // Changed from standard_id
  standard_code: string;     // e.g., "ES1" - for display
  standard_name: string;
  version_id: string;        // New - for analytics tracking
  version_number: number;    // New - for display
  // ...
}
```

**API Client Updates:**
- All endpoints automatically include `Authorization` header (no change)
- JWT now contains `mat_id` - can be decoded for client-side filtering if needed
- Standards management now works with UUIDs instead of codes like "ES1"

**Cache Invalidation:**
- Standards cache key should include MAT context
- Version changes should invalidate related caches

---

## Notes

### Soft Delete Strategy
- Use `is_active = FALSE` rather than deleting rows
- Preserves foreign key integrity for historical assessments
- Filter by `is_active = TRUE` in all standard queries

---

## Role & Permission Mapping

### Current State (Frontend)

The frontend currently uses two roles for view differentiation:
- `mat_admin` - Trust-wide view, analytics, standards management, export
- `department_head` - School-specific view, assigned assessments only

### New State

Since "all users have the same rights within one MAT", the role distinction becomes purely about **view scope**, not permissions:

| Aspect | MAT-Level User | School-Restricted User |
|--------|----------------|------------------------|
| `school_id` | `NULL` (or Central Office) | Specific school UUID |
| Schools visible | All in MAT | Only assigned school |
| Assessments visible | All in MAT | Only for their school |
| Standards management | ✅ Yes | ✅ Yes |
| Analytics | Trust-wide | School-only |
| Export | Trust-wide | School-only |

### Frontend Adaptation

Replace role-based checks with school-scope checks:

```typescript
// Current
const isAdmin = user.role === 'mat_admin';

// New
const hasTrustWideAccess = user.school_id === null;
// OR
const hasTrustWideAccess = user.school?.is_central_office === true;
```

The `role_title` field (e.g., "Director of Estates", "CFO") is now purely for display and aspect assignment context, not for permission logic.

### Aspect-Based View Filtering

For users with aspect assignments, the frontend can offer filtered views:

```typescript
// User's default view shows only their assigned aspects
const userAspects = user.assigned_aspects.map(a => a.aspect_code);

// Filter assessments to show assigned aspects first
const sortedAssessments = assessments.sort((a, b) => {
  const aAssigned = userAspects.includes(a.aspect_code);
  const bAssigned = userAspects.includes(b.aspect_code);
  return bAssigned - aAssigned; // Assigned first
});
```

### Analytics Continuity
- Assessments locked to `version_id` preserve exact standard definition used
- Cross-version analytics possible via `mat_standard_id` lineage
- Consider flagging reports where standard definitions changed mid-comparison

### Performance Considerations
- Denormalised `current_version_id` on `mat_standards` avoids subqueries
- Views pre-join common query patterns
- Indexes on all foreign keys and common filter columns
