# Assurly — Frontend Implementation Brief (April 2026)

> **Audience:** Cursor, implementing React (frontend) changes on the Assurly web app.
>
> **Stack:** React, Recharts for visualisations, React DnD where relevant. British English throughout user-facing strings.
>
> **Assumed context:** the Assurly frontend lives in a React codebase with components for the dashboard, assessment ratings page, and shared UI primitives. Backend is FastAPI at a known base URL; session-based auth is in place and cookies are sent automatically with `fetch`/`axios`.
>
> **Scope:** this brief covers four changes (REQ-002, REQ-003, REQ-004, REQ-005). The backend changes to support them are being done in a separate pass — coordinate endpoint shapes with the backend work.

---

## Table of contents

1. [Global conventions](#1-global-conventions)
2. [REQ-002 — Render `actions` on dashboard summary row](#2-req-002--render-actions-on-dashboard-summary-row)
3. [REQ-003 — Evidence upload modal and Files column](#3-req-003--evidence-upload-modal-and-files-column)
4. [REQ-004 — Rating selector: numeric-only, RAG polarity fix](#4-req-004--rating-selector-numeric-only-rag-polarity-fix)
5. [REQ-005 — Trust / School dashboard toggle](#5-req-005--trust--school-dashboard-toggle)
6. [Acceptance criteria — consolidated checklist](#6-acceptance-criteria--consolidated-checklist)

---

## 1. Global conventions

- **British English** everywhere user-facing (`colour`, `organisation`, `behaviour`).
- **Don't bypass the backend.** Every data mutation goes through an API call. No local-state-only mutations masquerading as saves.
- **No optimistic UI for destructive actions** (deletes). Show the result after the server confirms.
- **Minimum formatting.** Keep component code focused — this app has specific design conventions already, follow them.
- **Error states inline.** When an API call fails, render the error near the action that triggered it, don't rely on a global toast system unless one already exists.

---

## 2. REQ-002 — Render `actions` on dashboard summary row

### Context
The `actions` field (free-text, nullable) now exists on assessments and is returned by the API alongside `evidence_comments`. It's a companion field — `evidence_comments` describes the rationale, `actions` describes next steps.

### Tasks

1. In the dashboard summary row component, render `actions` wherever `evidence_comments` is currently rendered. Use the same styling, truncation behaviour, and hover/expand pattern — this is a peer field, not a secondary one.

2. **Empty handling.** If `actions` is `null`, empty string, or whitespace-only: render nothing. No placeholder, no empty element, no "—", no "N/A". The column simply shows blank.

3. **No separate component.** Don't build `ActionsCell` when `CommentsCell` (or whatever the existing component is called) can be parametrised or duplicated minimally. Match the existing pattern.

### Acceptance
- `actions` content appears on the dashboard summary row when populated.
- Empty or null `actions` produce no visible output in the row.
- No regression to `evidence_comments` rendering.

---

## 3. REQ-003 — Evidence upload modal and Files column

### Context
A mock upload modal currently exists on the Ratings page and does nothing. This work replaces it with a functional component that talks to four new backend endpoints, and wires the dashboard `Files` column to live evidence counts.

### 3.1 Endpoints you'll consume

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/evidence/upload` | Upload a file (multipart/form-data) |
| `POST` | `/evidence/link` | Attach an external URL (JSON) |
| `GET`  | `/evidence/{mat_standard_id}?school_id=&unique_term_id=` | List evidence for an assessment cell |
| `DELETE` | `/evidence/{evidence_id}` | Delete a single evidence record |

The dashboard summary endpoint now includes an `evidence_count` field per row — use this for the Files column instead of calling `GET /evidence/...` N times.

### 3.2 Evidence record shape

```ts
type EvidenceRecord = {
  id: string;
  mat_standard_id: string;
  school_id: string;
  unique_term_id: string;
  evidence_type: 'file' | 'url';
  file_path: string | null;       // GCS object path (internal)
  url: string | null;             // external URL
  original_filename: string | null;
  uploaded_by: string;
  uploaded_by_name: string;       // display name
  created_at: string;             // ISO timestamp
  download_url: string | null;    // signed URL, 15-min expiry, only for files
};
```

### 3.3 Upload modal (Ratings page)

Replace the existing mock modal entirely.

**UI structure:**
- Modal title: "Add evidence"
- A toggle or segmented control at the top: `Upload file` | `Add link`
- Below the toggle, one of two forms depending on selection.

**Upload file form:**
- File picker accepting: `.pdf`, `.doc`, `.docx`, `.xls`, `.xlsx`, `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.svg`.
- Show selected file name, size, and type before submission.
- Submit button labelled "Upload".
- Max file size: 25 MB. Validate client-side before sending.

**Add link form:**
- Single text input, labelled "URL", placeholder `https://...`.
- Helper text: "Paste a link to a SharePoint file, Google Drive document, or any other external resource."
- Validate: must start with `https://`, max length 2000 chars. Show inline error if invalid.
- Submit button labelled "Add link".

**Submission behaviour:**
- Disable submit button and show a spinner during the request.
- On success: close the modal and refresh the evidence list for the current assessment cell (see §3.4). Do not refresh the whole dashboard.
- On error (4xx/5xx): display an inline error message within the modal — "Upload failed: {server message or generic fallback}". Do NOT close the modal. User can fix and retry.
- If the user closes the modal mid-upload, abort the request (`AbortController`).

**Important:** the modal must be aware of `mat_standard_id`, `school_id`, and `unique_term_id` for the current cell — these come from the Ratings page context. All three are required by the backend.

### 3.4 Evidence list

Can be rendered either:
- **Inside the same modal** as a section below the upload/link form (preferred if vertical space allows).
- **As a separate drawer/popover** opened from a button on the modal or from the Files column on the dashboard.

Either way, the data source is `GET /evidence/{mat_standard_id}?school_id=&unique_term_id=`.

**Each evidence item displays:**
- **For files:** a file icon, `original_filename`, formatted upload date (e.g. "20 Apr 2026"), uploaded-by name. Clicking the filename opens the `download_url` in a new tab.
- **For links:** a link icon, the URL (truncated to fit, with full URL on hover/title attribute), formatted upload date, uploaded-by name. Clicking opens the URL in a new tab (`target="_blank" rel="noopener noreferrer"`).
- A delete button (trash icon) at the right of each row.

**Delete behaviour:**
- Click → inline confirmation ("Delete this file?" / "Remove this link?") with Confirm / Cancel.
- On confirm: call `DELETE /evidence/{id}`.
- On success: remove from list immediately.
- On error: show inline error, keep the item.
- No optimistic removal — wait for server confirmation.

**Empty state:** "No evidence uploaded yet" — plain text, not a decorative illustration.

**Ordering:** newest first (backend returns in this order — don't re-sort).

### 3.5 Dashboard Files column

The `Files` column already exists on the dashboard summary row (from previous work). Wire it to the new data:

- If `evidence_count > 0`: render a paperclip icon with a small number badge (e.g. `📎 3`). Make the whole thing clickable.
- If `evidence_count === 0` or is missing: render **nothing**. Not a `0`, not a placeholder.
- Click → opens the evidence list view for that assessment cell. Re-use the same component as §3.4.

### 3.6 Acceptance
- Mock modal fully removed and replaced.
- User can upload a file or paste a URL from the Ratings page.
- Client-side validation: file type, file size, URL format.
- Evidence list displays existing records for the current `(mat_standard_id, school_id, unique_term_id)` triple.
- Records can be deleted with confirmation.
- Dashboard `Files` column shows indicator when `evidence_count > 0`, blank when 0.
- Clicking the indicator opens the evidence list view.
- Errors displayed inline, modal does not auto-close on error.

---

## 4. REQ-004 — Rating selector: numeric-only, RAG polarity fix

### Context
Rating scale is strictly 1–4. The rating selector currently renders Ofsted-derived labels ("Outstanding", "Good", "Requires Improvement", "Inadequate") and may expose an inconsistent fifth value ("Exceptional"). Also: RAG colour currently assumes higher is better, which is wrong for `risk`-type standards.

### 4.1 Rating selector component

- Render options `1`, `2`, `3`, `4`. **No label text alongside or below the numbers.**
- Remove any logic, data structure, or constant that can produce a fifth option (`5`, `Exceptional`, `EXCEPTIONAL`, etc.). The selector must be structurally incapable of rendering more than 4 options.
- Value sent to the API: integer (not string, not label).

### 4.2 Label audit

Search the codebase for string labels derived from ratings:

- `'Outstanding'`, `'Good'`, `'Requires Improvement'`, `'Inadequate'`, `'Exceptional'`
- Any mapping object like `{ 4: 'Outstanding', 3: 'Good', 2: 'Requires Improvement', 1: 'Inadequate' }`
- Any enum like `RatingLabel.OUTSTANDING`

Remove them all. Rating values render as integers throughout the UI. This includes:
- Summary rows
- Detail views
- Reports (PDF generation via WeasyPrint — update the template too)
- Tooltips
- Any analytics or chart labelling (Recharts)

### 4.3 RAG / colour coding

The current RAG utility function(s) likely look like:

```js
function getRagColour(rating) {
  if (rating === 4) return 'green';
  if (rating === 3) return 'amber-green';
  if (rating === 2) return 'amber';
  if (rating === 1) return 'red';
  return 'grey';
}
```

**Update to take `standardType` as a parameter:**

```js
function getRagColour(rating, standardType) {
  if (rating == null) return 'grey';

  const assurance = { 4: 'green', 3: 'amber-green', 2: 'amber', 1: 'red' };
  const risk      = { 4: 'red',   3: 'amber',       2: 'amber-green', 1: 'green' };

  const palette = standardType === 'risk' ? risk : assurance;
  return palette[rating] ?? 'grey';
}
```

### 4.4 Call-site audit

Every place that calls `getRagColour` (or equivalent) must now pass the `standard_type` from the mat_standard associated with that rating. The backend now includes `standard_type` on every API response that returns a rating — thread it through component props.

If you find a component that renders RAG without access to `standard_type`, that's a bug: trace upstream and add it to the data shape. Don't default to `'assurance'` silently — that's exactly what we're trying to prevent.

### 4.5 Acceptance
- Rating selector renders exactly 4 numeric options.
- "Exceptional" and the value `5` cannot be selected or displayed anywhere.
- No Ofsted-derived label strings remain in the UI.
- `getRagColour` (and any equivalent) takes `standardType` as a parameter and inverts polarity for `'risk'`.
- Every call site passes `standardType` — no defaults, no silent `'assurance'` assumption.
- Rating values render as integers everywhere (summary rows, details, reports, tooltips, charts).

---

## 5. REQ-005 — Trust / School dashboard toggle

### Context
The dashboard shows assessments per school by default. Users should be able to toggle to a trust-level view showing assessments against the MAT central office. The backend supports this via a `?view=school|trust` query parameter.

### 5.1 Toggle component

- Render a two-option toggle (segmented control or similar) at the top of the dashboard.
- Labels: `School` | `Trust`.
- Default: `School` on every page load.
- Position: top-left of the dashboard header, near the term selector. Specific placement can match existing patterns in the app.

### 5.2 State management

- Store the selected view in component state — session-only, no need to persist across page refreshes.
- On toggle, re-fetch the dashboard data with the appropriate `?view=` query parameter.
- If your current fetch pattern pulls all dashboard data in one request and filters client-side, you can either:
  - Keep that pattern and filter on `schools.is_central_office` client-side, OR
  - Switch to a per-view fetch.

  Prefer client-side filtering if the dataset is small (which it is today — ~12 schools per MAT max). Drop to server-side only if performance degrades.

### 5.3 Rendering differences

- **School view:** render as currently — per-school rows, comparative columns across schools.
- **Trust view:** render assessments for the central office school (`is_central_office === true`). Hide per-school comparative columns — they don't apply at trust level. The `school_name` column can be hidden too or replaced with a single "Trust-level" label.
- The assessment data shape is the same either way — only the layout changes.

### 5.4 Acceptance
- Toggle renders at the top of the dashboard, labelled `School` and `Trust`.
- Selecting `Trust` displays only assessments for the central office school.
- Selecting `School` displays only assessments for non-central schools.
- Per-school comparative columns hidden in Trust view.
- Default on load: `School`.
- Toggle state persists within the session (component state), resets on refresh.

---

## 6. Acceptance criteria — consolidated checklist

### REQ-002
- [ ] `actions` renders on the dashboard summary row, styled like `evidence_comments`.
- [ ] Empty/null `actions` produces no visible output.
- [ ] No regression to `evidence_comments`.

### REQ-003
- [ ] Mock upload modal removed and replaced with functional component.
- [ ] Modal supports two modes: file upload and URL link.
- [ ] Client-side validation: file type (PDF/Word/Excel/images), file size (25 MB max), URL format (https:// required).
- [ ] Evidence list renders existing records for the current assessment cell.
- [ ] Files link to `download_url` (signed URL for files, direct URL for links).
- [ ] Delete action works with confirmation, removes on server success only.
- [ ] Dashboard `Files` column shows paperclip + count when `evidence_count > 0`, blank otherwise.
- [ ] Clicking the Files column indicator opens the evidence list.
- [ ] Errors render inline, modal does not auto-close on error.

### REQ-004
- [ ] Rating selector renders exactly 4 numeric options, no label text, no fifth value.
- [ ] No Ofsted-derived label strings appear anywhere in the UI.
- [ ] "Exceptional" and `5` rating literals fully purged.
- [ ] RAG utility accepts `standardType` and inverts polarity for `risk`.
- [ ] Every RAG call site passes `standardType` — no implicit `assurance` defaults.
- [ ] Reports, tooltips, charts all show integer ratings.

### REQ-005
- [ ] Two-option toggle (`School` | `Trust`) at top of dashboard.
- [ ] Default to `School` on load.
- [ ] Trust view shows central office assessments only.
- [ ] School view shows non-central assessments only.
- [ ] Per-school comparative columns hidden in Trust view.
- [ ] State persists within session, resets on refresh.
