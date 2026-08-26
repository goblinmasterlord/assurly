# M1 Backend Audit — REQ-006, REQ-008 → REQ-012

**Date:** 26 August 2026
**Agent:** Claude Code (backend)
**Branch:** `sprint-2.0`
**Contract version:** `assurly-api-contract.md` v2.5
**Type:** Diagnostic. No application code written, no migrations run, no documentation changed outside this file and the dev log.

REQ-007 is out of scope — settled by the AUD-001 session (frontend transform discards `due_date`; backend persists and returns it).

---

## Method, and what could not be done

**This audit is static analysis. Nothing was executed.** The brief asks in several places for a direct call — a multipart POST to `/evidence/upload`, the `aspect_code` filter "called directly", a reproduction of the rename 404. **None of that was possible, and none of it is reported as though it were.**

| Capability | State |
|---|---|
| Database access | None. `DB_*` env vars unset; no `mysql` client; no `mysql.connector`. Backend connects over a Cloud SQL unix socket. |
| Running the backend locally | Not possible. `fastapi` is not installed in this environment, and the app calls `get_db_connection()` on every route. |
| Calling production | Not attempted. Every requested call is a **write** to live tenant data (upload a file, rename an aspect) or requires a bearer token I do not hold. Out of bounds without explicit authorisation. |

Where a claim rests on reading code rather than observing behaviour, the confidence level says so. Three findings below are strong enough that execution would only confirm them; two need a live check before anyone commits to a fix.

---

## REQ-006 — Evidence upload

### Current behaviour

**There is no backend to audit. The evidence endpoints do not exist.**

The brief asks whether the §28–31 endpoints "exist and function". They do not exist. `main.py` defines 42 routes; **none of them is an evidence route**. There is no `/evidence/upload`, no `/evidence/link`, no `GET /evidence/{mat_standard_id}`, no `DELETE /evidence/{evidence_id}`. There is no GCS client anywhere in the backend. `requirements.txt` does not list `google-cloud-storage` (or any Google SDK), and `main.py` imports nothing from `google`. The FastAPI imports at `main.py:1` do not include `UploadFile`, `File` or `Form`, so no multipart handler exists anywhere in the file.

One fossil worth noting: `python-multipart==0.0.6` **is** in `requirements.txt`. That package exists solely to let FastAPI parse `multipart/form-data`, and nothing in the backend parses any. It is the dependency an upload endpoint would need, sitting in the manifest without the endpoint — consistent with the evidence work having been started and never landed.

The only code in the entire backend that touches `standard_evidence` is read-only or destructive:

| Location | What it does |
|---|---|
| `main.py:1385` | `COUNT(*)` subquery producing `evidence_count` for the dashboard |
| `main.py:3870` | `COUNT(*)` in the mock-data wipe tool, reporting surviving rows |

So the dashboard has been rendering an evidence count sourced from a table that **no shipped code path can write to.**

### Root cause — confidence: certain

The evidence feature was never merged into `main`. This is not a defect in the upload path; the upload path does not exist on either side of the stack. Combined with the frontend audit's finding that `EvidenceModal.tsx`, `evidence-service.ts` and `types/evidence.ts` live only on the unreachable `claude/review-backend-brief-mjtms`, the position is that **REQ-003 was documented as shipped but never landed on the programme branch in either layer.**

### ⚠️ Contract divergence — for triage, not for fixing here

The contract does not describe this as pending. It is explicit that it is live:

- Line 1418: *"The four evidence endpoints are live."*
- Changelog v1.8 (2026-05-30): *"Promoted the Evidence section (endpoints §28–31) from `🚧 In-flight — REQ-003` to live. REQ-003 shipped some time ago."*
- Data model §17: *"Shipped April 2026 (REQ-003)"*, *"live in production"*, *"Mutated only via the four `/evidence/...` endpoints"*.

**Per the standing scope guard, the contract is authoritative and the code is wrong.** I have not edited the contract to match the implementation. But the divergence is severe enough to name plainly: two authoritative documents assert a shipped, live, production feature that has no implementation on this branch. That should prompt a check of whether anything else marked "shipped" in the v1.5–v1.8 reconciliation passes is equally absent — those passes removed `🚧 In-flight` tags on the basis that work had landed, and at least one of those judgements was wrong.

Whether the endpoints exist in the **deployed** Cloud Run revision is a separate question I cannot answer without calling production. If they do, the deployed artefact has diverged from `main`, which is worse. Worth ten minutes with the live Swagger UI before REQ-006 is scoped.

### Per-standard evidence, and what it means for REQ-017

**The backend already supports per-standard evidence at the schema level, and the aspect-level limit is not enforced in the backend — because there is no backend code to enforce it.**

`standard_evidence` (data model §17) is keyed exactly as the contract specifies:

- **Grain:** one row per evidence item, multiple items per `(mat_standard_id, school_id, unique_term_id)` triple — the same grain as `assessments`.
- `mat_standard_id` is FK-constrained to `mat_standards`, with `ON UPDATE CASCADE` so archive-renames propagate.
- GCS keys are namespaced `{mat_id}/{mat_standard_id}/{filename}` — per-standard by construction.
- `chk_evidence_type_fields` enforces the file/url mutual exclusion.

Contract §28–31 keys every operation on the same triple. So schema and contract agree on per-standard, and always have.

**Conclusion for REQ-017: yes, it is mostly a frontend job — with a caveat.** The aspect-level restriction is a property of the missing frontend client (the frontend audit describes a pre-integration `FileUpload` + in-memory `attachments` state keyed at aspect level), not of the schema. No migration is required for per-standard evidence. But "mostly frontend" assumes the backend half of REQ-006 gets built first, since REQ-017 has nothing to call until it does. **REQ-017's gate on REQ-006 is real and load-bearing, not a formality.**

### Files and tables affected

- **Files:** `assurly-backend/main.py` (four new routes, plus a GCS client — all net-new).
- **Tables:** `standard_evidence` (exists, correct shape, no migration needed).
- **Infrastructure:** a GCS bucket in `europe-west2` per data model §17. **Unverified — I cannot confirm the bucket exists, or that the Cloud Run service account can write to it.** This is the single biggest unknown in REQ-006 and should be checked before the requirement is estimated.

### Proposed fix

Build the four endpoints against contract §28–31 as specified — the contract is complete enough to implement from directly (form fields, accepted MIME types, 25 MB cap, the 400/403/413/415 matrix, MAT isolation, and 404-not-403 on cross-MAT reads to avoid leaking existence). No contract change should be needed; if one is, that is a signal the contract is wrong and should be raised, not quietly diverged from.

### Blast radius

Small and additive on the backend — four new routes touching one table that nothing else writes to. The one existing consumer is the dashboard's `evidence_count`, which will start returning non-zero values for the first time. Anyone who has been reading that field as reliable has been reading a constant zero.

### Crosses into frontend?

**Yes, entirely.** The backend half is net-new and the frontend half is a rebuild. REQ-006 is now a two-layer requirement and its sequencing gate (§2.3, backend ships and is verified before frontend opens) applies in full.

---

## REQ-008 — Aspect filter on the Ratings page

### Current behaviour

The brief asks only that the server-side option be verified sound. **On the ratings endpoint it is sound.** `GET /api/assessments` (`main.py:859-861`):

```sql
AND UPPER(ma.aspect_code) = UPPER(%s)
```

Case-insensitive on both sides, parameterised, applied before the `GROUP BY`. It will filter correctly for any casing the client sends. The frontend audit's conclusion that REQ-008 needs no backend change is **supported**.

### Root cause — confidence: high (for the negative claim)

There is no backend defect here. Confidence is high rather than certain only because I could not execute the query; the SQL is simple enough that reading it is close to conclusive.

### Finding beyond the brief — the codebase disagrees with itself on casing

Not part of REQ-008 and not to be acted on here, but it will bite whoever implements a server-side filter elsewhere. Three endpoints filter on `aspect_code` three different ways:

| Endpoint | Predicate | Case-insensitive? |
|---|---|---|
| `GET /api/assessments` (`main.py:860`) | `UPPER(ma.aspect_code) = UPPER(%s)` | **Yes** |
| `GET /api/standards` (`main.py:1140`) | `ma.aspect_code = %s` | **No** |
| `GET /api/assessments/by-aspect/{aspect_code}` (`main.py:3147`) | `ma.aspect_code = %s` | **No** |

Codes are stored uppercase (`create_aspect` uppercases at `main.py:2174`), so the two case-sensitive endpoints silently return **empty results** for a lowercase `aspect_code` rather than erroring. A caller cannot distinguish "no standards in this aspect" from "you sent the wrong case".

### Files and tables affected

`assurly-backend/main.py` — none required for REQ-008. `mat_aspects`, `mat_standards`, `assessments` read-only.

### Proposed fix

None for REQ-008. The casing inconsistency above is a separate, standalone tidy-up.

### Blast radius

Nil — no change proposed.

### Crosses into frontend?

REQ-008's fix is frontend-only, per the frontend audit. This audit does not contradict that.

---

## REQ-009 — Status filter and the overdue state

### Current behaviour

**Confirmed: `?status=overdue` can never return rows.** Two independent reasons, either sufficient.

**1. The grouped `CASE` cannot emit it** (`main.py:840-844`):

```sql
CASE
    WHEN COUNT(CASE WHEN a.rating IS NULL THEN 1 END) = COUNT(*) THEN 'not_started'
    WHEN COUNT(CASE WHEN a.status = 'completed' THEN 1 END) = COUNT(*) THEN 'completed'
    ELSE 'in_progress'
END as status
```

Three branches, three possible values, and the `ELSE` is total. `'overdue'` is not among them and no input can produce it.

**2. The filter compares against that same derived column** (`main.py:877-882`):

```sql
SELECT * FROM ({query}) grouped
WHERE status = %s
```

The predicate is applied to the subquery's computed `status`, so `?status=overdue` evaluates `'not_started'|'completed'|'in_progress' = 'overdue'` for every row. Always false. **The endpoint returns `200` with an empty array** — not a validation error — so a caller cannot distinguish "nothing is overdue" from "this filter does not work". `status` is an unvalidated `Optional[str]`, so any garbage value behaves identically.

### Root cause — confidence: certain

Overdue was never a server-side concept. It is a client-side derivation (`utils/assessment.ts:14`) over a field the server does supply, and the server-side filter was written without it.

### What it would take for the `CASE` to emit an overdue state

Stated as analysis, **not built**, per instruction. Three things are needed, and the third is the one that matters:

1. **A date to compare against.** The subquery already carries `MAX(a.due_date)`; the comparison would be against `CURDATE()`.
2. **Correct precedence.** Overdue must be evaluated *before* `not_started`, or every overdue-and-unstarted group resolves to `not_started` first and the branch is dead. This is precisely the collapse the frontend already performs — `SchoolPerformanceView.tsx:888` maps `"overdue"` to `cat.status === "not_started"`, and `assessment-utils.tsx:89` maps overdue back to `not_started`. REQ-009's "wrong level" symptom is partly this conflation.
3. **The right aggregate — this is the substantive defect.** The group's due date is `MAX(a.due_date)` (`main.py:838`), documented at contract line 848 as *"Latest due date across standards in the group"*. For "is anything in this group overdue", `MAX` is the **wrong aggregate**: it reports the group overdue only once the *last* standard has passed its date. An aspect holding one standard three months overdue and one due next month reads as not overdue. The correct aggregate is the earliest due date **among standards that are not yet complete** — `MIN(CASE WHEN a.status NOT IN ('completed','approved') THEN a.due_date END)`.

Point 3 holds regardless of whether overdue is ever added to the `CASE`, and it is a live defect today: the group `due_date` the API returns is already misleading, and `isOverdue` inherits the error client-side. **I would start REQ-009 here, not in the frontend filter code.**

A caveat that changes the size of the problem: **`due_date` is nullable and frequently unset.** `isOverdue` returns `false` for a null due date, and `MAX` over an all-null group yields `NULL`. If most rows carry no due date, most of the overdue surface is inert regardless of any fix. The count that settles this — `SELECT COUNT(*) FROM assessments WHERE due_date IS NULL` — is still outstanding from AUD-001 and still needs a database connection.

### Files and tables affected

- `assurly-backend/main.py:807-890` (`GET /api/assessments`).
- Tables: `assessments` (read), specifically `due_date` and `status`.
- Contract §22 would need updating if `status` gains an `overdue` value or if the group `due_date` semantic changes — **both are contract-visible changes.**

### Proposed fix

Not proposed here; REQ-009 is a defect requirement with its own scope. The audit's contribution is the location and the aggregate error above.

### Blast radius

Changing the group `due_date` aggregate changes a documented contract field's meaning and will shift overdue rendering everywhere it is consumed — the Ratings list, the detail badge, the school status roll-up, and the overdue count on the Ratings header. Not a local change. Adding `overdue` to the `CASE` additionally changes the value domain of a documented response field, which the frontend's status-order map (`Assessments.tsx:368`) and both status-to-label switches would need to absorb.

### Crosses into frontend?

**Yes, unavoidably.** The client currently derives overdue itself and collapses it to `not_started` in at least two places. Moving the derivation server-side without removing those collapses would leave two competing definitions — the same failure mode as `current_term` in AUD-001.

---

## REQ-010 — Aspect rename returns 404

### Current behaviour

**The plan's leading hypothesis is rejected. The route does not key on name — it keys on ID, in both layers.**

- Backend: `PUT /api/aspects/{mat_aspect_id}` (`main.py:2246`) takes `mat_aspect_id` as a path parameter and looks it up with `WHERE mat_aspect_id = %s AND mat_id = %s AND is_active = 1` (`main.py:2263-2266`). The new name arrives in the JSON **body** (`MatAspectUpdate.aspect_name`), where special characters are harmless.
- Frontend: `StandardsManagement.tsx:270` → `use-standards-persistence.ts:280` → `assessment-service.ts:377`, passing `aspect.mat_aspect_id` throughout. Never the name.

**But the effect the plan describes is real, because the ID is manufactured from user-supplied text that can contain the same characters.**

### Root cause — confidence: high for `\`, moderate for `&`

A three-step chain:

1. **The ID is derived from an unsanitised user-entered code.** `create_aspect` builds it as `mat_aspect_id = f"{current_mat_id}-{aspect_code_upper}"` (`main.py:2177`). `MatAspectCreate.aspect_code` is a bare `str` (`main.py:282`) with **no validator and no character-class constraint**. The client-side schema only checks length — `z.string().min(2).max(10)` (`CreateAspectModal.tsx:29`) — so `IT\Data` (7 chars) and `IT & Data` (9 chars) both pass. The resulting IDs are `HLT-IT\DATA` and `HLT-IT & DATA`.
2. **The ID is interpolated into a URL path with no encoding.** `assessment-service.ts:377`:
   ```ts
   await apiClient.put(`/api/aspects/${matAspectId}`, data);
   ```
   No `encodeURIComponent`. Note that `actions-service.ts` **does** encode its path parameters (lines 37, 57, 74, 87) — so the codebase knows the pattern, and the aspects service simply omits it. The standards service has the same omission.
3. **The browser rewrites the path before the request is sent.** Under the WHATWG URL specification, a backslash in the path of a special scheme is normalised to a forward slash. `/api/aspects/HLT-IT\DATA` therefore leaves the browser as `/api/aspects/HLT-IT/DATA` — **two path segments**, which matches no registered route, and FastAPI returns `404`. The aspect exists; the request never reaches its handler.

That is a complete and self-consistent explanation for `IT\Data`, and it is characteristic of exactly what the plan suspected — a routing failure, not a missing record — arriving by a different mechanism than hypothesised.

**`IT & Data` is not fully explained and I will not pretend otherwise.** `&` is a legal sub-delimiter in a URL path segment and `fetch` percent-encodes the spaces, so the request should reach the handler intact and match. Possible explanations I could not distinguish without executing: the stored `aspect_code` differs from the display name (in which case the ID is clean and the 404 has another cause); an intermediary — Vercel, Cloud Run's front end, or the proxy — normalises or rejects the segment; or the two reported cases have different causes and share a symptom. `vercel.json` was checked and its only rewrite is the SPA catch-all `/(.*)` → `/index.html`, which does not touch `/api` (the frontend calls the Cloud Run origin directly via `VITE_API_BASE_URL`), so Vercel is ruled out.

**To settle it:** fetch the affected rows — `SELECT mat_aspect_id, aspect_code, aspect_name FROM mat_aspects WHERE mat_aspect_id LIKE '%%&%%' OR mat_aspect_id LIKE '%%\\\\%%'`. If `mat_aspect_id` for the `&` aspect is clean, the `&` case is a different defect and needs its own diagnosis.

### Files and tables affected

- `assurly-backend/main.py:2177` (ID construction), `:282` (unvalidated `aspect_code`), `:2246` (the rename route itself is correct).
- `assurly-frontend/src/services/assessment-service.ts:332, 377, 390, 404` (unencoded path interpolation — GET, PUT, DELETE and reinstate all share it).
- `assurly-frontend/src/components/admin/standards/CreateAspectModal.tsx:29` (permissive validation).
- Table: `mat_aspects` — and any existing rows with special characters in the PK are **already-created bad data**.

### Proposed fix

Three layers, and the plan is right that escaping alone is a patch over the design problem:

1. **Stop minting IDs from user text.** Constrain `aspect_code` to `^[A-Z0-9_-]{2,10}$` at both the Pydantic and Zod layers, or decouple the two and generate a UUID for `mat_aspect_id` as is already done for custom aspects created by other paths (data model §2.1 records both formats as live).
2. **Encode path parameters** in the aspects and standards services, matching `actions-service.ts`. This is correct regardless of the ID scheme and is the cheapest independent hardening.
3. **Migrate the existing bad rows.** Any `mat_aspects` row whose PK contains a special character needs renaming, and `mat_standards.mat_aspect_id` FK references must follow. **This is a data migration and needs a rollback note.** Do not treat REQ-010 as code-only.

Sequencing matters: fixing (1) and (2) without (3) leaves the already-broken aspects broken, which is likely the entire reported symptom.

### Blast radius

Moderate, and larger than the requirement looks. The ID-construction change affects aspect creation. The migration touches primary keys with dependent foreign keys (`mat_standards.mat_aspect_id`, and transitively anything joining through it). The archive-rename convention already renames `mat_aspect_id` in place (`main.py:2393`), so the pattern exists and the FK cascade behaviour is understood — but it is still a PK rewrite on live data.

Note also that `create_aspect`'s uniqueness check is on `UPPER(aspect_code)` while the PK is `{MAT}-{CODE}`; if the code constraint changes, confirm no two existing codes collapse to the same constrained form before migrating.

### Crosses into frontend?

**Yes.** Encoding (step 2) and validation (step 1) are both partly frontend. The backend cannot fix this alone: even with clean new IDs, unencoded interpolation stays a latent bug for any future ID containing a reserved character.

The plan's downstream Education → Curriculum and Teaching rename is unblocked by this work, and is a **name** change on an aspect whose code is `EDU` — clean, unaffected by any of the above, and safe to perform once the rename path is trusted.

---

## REQ-011 — "Updated" date always reports today

### Current behaviour

**The timestamp is genuine in the database, absent from the API, and fabricated by the frontend.** All three of the plan's audit questions are answered:

- *Is a genuine `updated_at` persisted per standard?* **Yes.** `mat_standards.updated_at`, `timestamp NULL`, `CURRENT_TIMESTAMP on update` (data model §11). The update path also sets it explicitly — `main.py:1718` includes `updated_at = NOW()`. Values are real, not defaulted.
- *Does the field exist in the response?* **No.** `GET /api/standards` does not select it (`main.py:1115-1129` — the SELECT lists `mat_standard_id` through `is_modified` and the version join, with no timestamp column), and `MatStandardResponse` does not declare it (`main.py:326-334`). The `response_model` would strip it even if the SELECT were fixed, so **both** need changing.
- *Is the frontend rendering `Date.now()`?* **Effectively yes.** `SortableStandardCard.tsx:136`:
  ```tsx
  Updated {format(new Date(standard.updated_at || new Date()), 'MMM d, yyyy')}
  ```
  `standard.updated_at` is always `undefined`, so the `||` fallback fires on every render for every standard, producing today's date. Exactly the reported symptom. `VersionHistoryModal.tsx:77` carries the same fallback.

### Root cause — confidence: certain

A backend omission (field never exposed) plus a frontend fallback that renders a plausible lie instead of an absence. Either alone would be visible; together they produce a value that looks like data.

### Contract omission or genuine backend gap?

**Both, and the contract omission is the honest one.** Contract §13 omits `updated_at` from the `GET /api/standards` response — and that is *correct*, because the endpoint genuinely does not return it. The contract accurately documents a deficient implementation. This is a **backend gap**, not a documentation error: nothing needs correcting in the contract to make it truthful, but §13 will need a new row once the field is exposed.

Worth noting the contrast: `assessments` exposes `last_updated` throughout, so timestamp exposure is established practice elsewhere in the API. Standards are the exception.

### What exposing it would cost

**Very little — this is the cheapest requirement in M1.**

1. Add `ms.updated_at` (and `ms.created_at`, which is equally absent and equally free) to the SELECT at `main.py:1129`.
2. Add `updated_at: Optional[datetime] = None` to `MatStandardResponse` (`main.py:326`).
3. Serialise as ISO 8601 UTC per the contract's Timestamps convention. `process_row_for_json` already handles datetime coercion elsewhere; confirm the `response_model` path applies the same formatting — Pydantic will emit ISO 8601 but the trailing-`Z` convention used elsewhere in this API is applied manually in the hand-rolled `JSONResponse` handlers, so the two paths may not agree. **This is the only fiddly part.**
4. Add the field to contract §13.
5. Frontend: drop the `|| new Date()` fallback so a genuinely missing value renders as "—" rather than today.

No migration. No schema change. The data is already there.

Also worth doing while in the file: `GET /api/standards/{mat_standard_id}` (the single-standard detail endpoint) is already logged as **Known Issue #12** for omitting `standard_type` from its response despite selecting it. Same endpoint family, same class of defect, and a natural companion fix — though it is out of REQ-011's scope and should not be folded in silently.

### Files and tables affected

- `assurly-backend/main.py:326-334` (`MatStandardResponse`), `:1115-1129` (SELECT).
- `assurly-frontend/src/components/admin/standards/SortableStandardCard.tsx:136`, `VersionHistoryModal.tsx:77`.
- Table: `mat_standards` — read-only, no change.
- Contract §13.

### Proposed fix

As enumerated above. Purely additive to the response shape.

### Blast radius

Minimal. Adding a field to a response is backward-compatible; no existing consumer reads it because it has never been sent. The only behavioural change users will notice is that dates stop being today — which will make previously-invisible staleness visible, and is the point.

**One caveat worth stating before anyone is surprised:** `updated_at` has `CURRENT_TIMESTAMP on update`, so it reflects *any* row modification, including bulk operations, sort-order changes and reorder drags — not only meaningful content edits. Once exposed, "Updated 26 Aug" may reflect a drag-and-drop reorder rather than a substantive change. If the product intent is "last meaningfully edited", `standard_versions.effective_from` is the better source. **Worth a product decision before the field is surfaced**, because it is easier to choose the right field now than to change its meaning after users start trusting it.

### Crosses into frontend?

**Yes, and the frontend half is the more important one.** Exposing the field without removing the `|| new Date()` fallback would change nothing visible — the fallback only fires when the value is missing, but a null `updated_at` on an old row would still render as today. Both halves are needed, and the frontend change is what stops the lie.

---

## REQ-012 — Inactive aspects view returns 404

### Current behaviour

**Deletion is soft. The route is shadowed. This is a routing bug, and there is real data to return.**

The plan's audit note offers a conceptual explanation — if aspects are hard-deleted, the inactive view has nothing to return. **That explanation is rejected on evidence.** `delete_aspect` (`main.py:2342-2438`) never issues a `DELETE`. Both branches are soft:

| Aspect type | Behaviour | Reinstatable |
|---|---|---|
| **Default** (`source_aspect_id` not null) | `UPDATE mat_aspects SET is_active = 0` — IDs left intact (`main.py:2411-2416`) | Yes — `can_reinstate: true` |
| **Custom** (`source_aspect_id` null) | Archive-rename to `{id}-deleted-{ts}` plus `is_active = 0` (`main.py:2397-2404`) | No — archived permanently |

The row survives in both cases. Data model §11 confirms live inactive rows exist: *"167 rows across HLT (125) and OLT (42). 14 are inactive, and 4 of those are archive-renamed customs."* So the tenant has inactive records and the view has something to show.

### Root cause — confidence: certain

**Route shadowing from declaration order.** Starlette matches routes in the order they are registered, first match wins. In `main.py`:

```
line 2105:  @app.get("/api/aspects/{mat_aspect_id}")   ← registered first
line 2502:  @app.get("/api/aspects/inactive")          ← never reached
```

`GET /api/aspects/inactive` matches the parameterised route with `mat_aspect_id="inactive"`. `get_aspect` queries for an aspect with that ID, finds nothing, and raises `404 "Aspect not found"` — the exact reported symptom. `get_inactive_aspects` is unreachable dead code, and its implementation is otherwise fine.

This is certain from the code alone: it depends only on registration order and Starlette's documented first-match semantics, neither of which requires execution to confirm.

### Sibling defect — same bug, not yet reported

**`GET /api/standards/inactive` is shadowed identically** and will 404 for the same reason:

```
line 1181:  @app.get("/api/standards/{mat_standard_id}")   ← registered first
line 1926:  @app.get("/api/standards/inactive")            ← never reached
```

Not part of REQ-012 as written, but it is the same one-line fix in the same file and will otherwise resurface as a separate bug report the week after REQ-012 ships. Flagged for the product owner to fold in or schedule separately — **not folded in unilaterally.**

I checked the other parameterised routes for the same pattern. `GET /api/users/me` (`:2959`) is safe — there is no `GET /api/users/{user_id}`. `POST /api/assessments/bulk-update` and `GET /api/assessments/by-aspect/{aspect_code}` are safe — no single-segment route of the same method shadows them. Those four are the only literal-after-parameter collisions in the file.

### Files and tables affected

- `assurly-backend/main.py` — move `@app.get("/api/aspects/inactive")` (currently `:2502`) above `@app.get("/api/aspects/{mat_aspect_id}")` (`:2105`). Same for standards if the sibling is included.
- Table: `mat_aspects` — read-only. **No migration, no schema change, no data change.**

### Proposed fix

Reorder the route registrations so literal paths precede parameterised ones. Two moved decorators and their functions; no logic changes.

Not recommended, but worth naming so it is consciously rejected: a `Literal`-typed path parameter or an in-handler `if mat_aspect_id == "inactive"` branch would also work and would be worse — it hides a routing concern inside a handler.

### Blast radius

Very small, and worth a moment's care. Moving a route changes match precedence for **every** path that could match both patterns — after the fix, any aspect whose `mat_aspect_id` is literally `"inactive"` becomes unreachable via the detail endpoint. Given IDs are `{MAT}-{CODE}`, that cannot occur in practice. Behaviour for all other IDs is unchanged.

The user-visible effect is that a feature which has never worked starts working, exposing 14 inactive rows (per §11) that no one has seen. Confirm with the product owner that the inactive view renders sensibly with real data before this is called done — note `get_inactive_aspects` deliberately excludes archived customs (its docstring: *"Does not include archived custom aspects"*), so the count shown will be the deactivated defaults only, not all 14.

### Crosses into frontend?

**No.** `getInactiveAspects` already calls `/api/aspects/inactive` correctly (`assessment-service.ts:418`). The frontend has been right all along and has been receiving a 404 from a correctly-formed request. Backend-only fix.

---

## Summary

| REQ | Root cause | Confidence | Layer | Migration? |
|---|---|---|---|---|
| **006** | Evidence endpoints do not exist; contract and data model both assert they are live | Certain | Backend **and** frontend — both net-new | No (table exists) |
| **008** | No backend defect; server-side filter is sound | High | Frontend only | No |
| **009** | `overdue` absent from the grouped `CASE`; `MAX(due_date)` is the wrong aggregate | Certain | Both | No |
| **010** | ID minted from unsanitised user code, then interpolated unencoded into the URL path | High (`\`), moderate (`&`) | Both | **Yes — PK rewrite** |
| **011** | `updated_at` persisted but never exposed; frontend falls back to `new Date()` | Certain | Both | No |
| **012** | Route shadowing — `/{mat_aspect_id}` registered before `/inactive` | Certain | Backend only | No |

**Cheapest to most expensive:** REQ-012 (two moved decorators) → REQ-011 (two fields plus a frontend fallback removal) → REQ-008 (no backend work) → REQ-009 (aggregate fix, contract-visible) → REQ-010 (code, validation, encoding **and** a data migration) → REQ-006 (build two layers from nothing).

**REQ-006 should be re-estimated before M1 is committed to.** The plan's current framing — a port from an existing branch — is wrong twice over: the branch is unreachable, and even if recovered it contains only the frontend half. The backend half has never existed.

## Open items requiring database or production access

None of these blocks the findings above; each would raise a confidence level or size a fix.

1. `SELECT COUNT(*) FROM assessments WHERE due_date IS NULL` — sizes how much of REQ-009's overdue surface is inert. Outstanding since AUD-001.
2. `SELECT mat_aspect_id, aspect_code, aspect_name FROM mat_aspects WHERE mat_aspect_id REGEXP '[^A-Za-z0-9-]'` — settles the `&` case in REQ-010 and enumerates the rows a migration must touch.
3. Whether the deployed Cloud Run revision exposes `/evidence/*` — if it does, the deployment has diverged from `main`, which is a larger problem than REQ-006. Checkable from the live Swagger UI.
4. Whether the GCS bucket described in data model §17 exists and is writable by the Cloud Run service account. The single biggest unknown in REQ-006's estimate.
