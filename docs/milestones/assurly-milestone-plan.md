# Assurly — Milestone Plan

**Suggested path:** `docs/milestones/assurly-milestone-plan.md`
**Version:** 2.6
**Date:** 26 August 2026
**Status:** Approved. M1 open.
**Owner:** Product Owner

---

## 1. Purpose and how to use this document

This is the **plan of record** for the current development programme: twenty-one requirements grouped into seven milestones, sequenced so that data-model and permissions work lands before the analytics that depend on it.

**This document is not an implementation brief.** Each milestone gets its own backend and frontend brief written when the milestone opens, following the established pattern in `docs/archive/`. Agents must not begin implementation from this document alone.

**Authority order:**

1. `docs/api/assurly-api-contract.md` — authoritative for all request/response shapes
2. `docs/assurly-data-model.md` — authoritative for schema
3. `docs/project-structure.md` — file layout and module boundaries. **Currently descriptive, not authoritative** — it is out of date and is being refreshed under DOC-002. Verify layout against the repository itself until then.
4. This document — authoritative for scope, sequencing and priority
5. The active per-milestone implementation brief — authoritative for the change in hand

Where this document and the contracts disagree, **the contracts win** and the discrepancy is raised, not silently resolved.

---

## 2. Agent operating protocol

Applies to Claude Code (backend) and Cursor (frontend) on every session in this programme.

### 2.1 Required reading before any code is touched

| Order | Document | Why |
|---|---|---|
| 1 | `docs/api/assurly-api-contract.md` | Authoritative API contract |
| 2 | `docs/assurly-data-model.md` | Authoritative schema and field semantics |
| 3 | `docs/project-structure.md` | Where code lives and what it may touch. Descriptive only until DOC-002 lands. |
| 4 | This plan — the active milestone only | Scope, boundaries, open questions |
| 5 | The active implementation brief | The work itself |

The agent confirms in its first response which documents it has read and which contract version it is working against.

**If a required document is missing, or its path does not match what is written here, stop and ask.** Do not substitute a similarly named file and proceed on the assumption it is the same document, even where that assumption is reasonable.

### 2.2 Session workflow

1. **Audit before fix.** Every requirement opens with a diagnostic pass: current behaviour, affected files, affected tables, blast radius. The agent reports and **stops**. No fixes during the audit pass.
2. **Decide before code.** Direction is confirmed and any open questions in Section 5 are resolved before implementation begins.
3. **Implement narrowly.** Only what the brief specifies. Out-of-scope boundaries are stated per requirement.
4. **Flag, don't fix.** Adjacent issues found mid-task go into a `Findings` section at the end of the session. They are never acted on without instruction.
5. **Document with code.** No change is complete until the API contract, data model bible and changelog reflect it. Docs ship in the same commit as the code.
6. **Reflect.** Close each session with: what changed, what was deliberately not changed, what the next session needs to know, and any assumptions made.

### 2.3 Sequencing gate

Backend ships and is verified before the corresponding frontend work opens. Frontend must not build against a contract change that is not yet merged and documented. Each milestone names its own gate.

### 2.4 Standing constraints

- British English throughout code, comments, UI copy and documentation.
- DB migrations are written and applied manually. Agents produce the migration SQL and a rollback note; they do not run it.
- Rating polarity is settled and must not be reinterpreted: **rating 4 is always the best outcome**, labels carry polarity, numbers are uniform.
- "Requires Attention" flags **rating 1 only**.
- Fixed terminology: "Risk Profile" (never "Risk Register"); performance bands are Strong / Healthy / Needs Improvement / Critical; aspect categories are `operational` and `strategic`.
- No terminology, threshold or polarity change without explicit sign-off from the Product Owner.

### 2.5 Development log

Git records what changed. The development log records why, and is the source material for the release notes published in the application's built-in version history.

**One file per session. Never a shared append-only file** — concurrent agents editing a single log is the same conflict trap as the API contract, and it is the file most likely to be edited on every single session.

Path: `docs/dev-log/YYYY-MM-DD-<layer>-<req-id>.md` — for example `docs/dev-log/2026-08-26-backend-req-010.md`

Template: `docs/dev-log/_template.md`. Every session closes with an entry, **including audit and discovery sessions** — a session that deliberately changed nothing is worth recording, and often more informative than one that did.

Entries are compiled into `docs/development-log.md` at each milestone close. Agents do not write to that file.

**Agents do not write release notes.** Version history copy is user-facing, read by school and trust staff, and is written by the product owner from the compiled log. Write the dev log entry for an engineer picking the work up cold, not for a customer.

### 2.6 Versioning

Current release 1.43. This programme is Sprint 2.0.

- Requirement ships: patch bump — 1.43.1, 1.43.2 and so on
- Milestone closes: minor bump — M1 close is 1.44.0
- Sprint closes: 2.0.0, declared by the product owner, never by an agent

Record every bump in the dev log entry that caused it.

---

## 3. Role model

Settled, and a prerequisite for M3 onwards. Three tiers:

| Tier | Who | Rights |
|---|---|---|
| **Superadmin** | Platform team | Everything, plus term close and reopen. The only tier that can act on a closed term. |
| **Internal** | All trust and school staff roles | Full read and write within their MAT: create, edit, delete and clear assessments while the term is open; edit actions and interventions. |
| **External** | Trustees and Governors | Read everything their MAT can see, including commentary and evidence. **No write access anywhere**, enforced at endpoint level, not just hidden in the UI. |

Internal is not further subdivided at this stage. Requirements below refer to these three tiers only.

---

## 4. Milestones

| ID | Milestone | Requirements | Gate |
|---|---|---|---|
| **M1** | Stabilise — live defects | AUD-001, DOC-001, DOC-002, DOC-003, SEC-001, REQ-007 → REQ-012 | None. Starts immediately. |
| **M2** | Role model | REQ-013 | None |
| **M3** | Assessment lifecycle | REQ-014 → REQ-016 | M2 complete |
| **M4** | Evidence model | REQ-017 | None. REQ-006 was retired into REQ-017; the old gate no longer exists. |
| **M5** | Applicability | REQ-018 | None |
| **M6** | Navigation shell | REQ-024 | M2 complete |
| **M7** | Analytics and trends | REQ-019 → REQ-023 | **M3, M5 and M6 complete** |
| **M8** | Actions and Interventions | REQ-025 → REQ-026 | M2 complete |

### 4.1 Sequencing rationale

- **M1 first.** Six live defects, most of them cheap, all of them visible to the early adopter during the exact period they are being asked to trust the platform. (Seven until REQ-006 was retired into REQ-017 — see the retirement note in §6.)
- **M2 second.** The role model is now load-bearing: the lifecycle rules in M3, the actions permissions in M7 and the read-only requirement all reference the three tiers. Building any of them before the tiers exist means encoding permissions twice.
- **M5 before M7.** Aggregate scores are currently distorted by standards that do not apply to a given school. Comparative analytics built on that denominator will need rebuilding. Fix the denominator first.
- **M3 before M7.** A historical series that cannot be corrected is not worth visualising.
- **M6 before M7.** The navigation shell is a container, and M7 introduces five new views. Shipping the shell first means those views land in their final home rather than being retrofitted into it afterwards.
- **M7 splits.** M7a (backend analytics API) ships and is verified before M7b (frontend) opens. This is the largest milestone in the programme and should not run as a single brief.

---

## 5. Settled decisions

Recorded here because they are not derivable from the requirements alone.

- **Evidence limits are waived.** No file count cap, during the early adopter phase, deliberately: usage volume is itself the thing being measured, and storage cost at this scale is negligible. This is a temporary position, not a permanent design decision — it will be revisited before general availability. Any limit an agent believes is technically necessary (request timeout, single-file size ceiling imposed by the upload path) is reported, not silently imposed.
- **Closed terms are frozen for internal users.** Delete, clear and edit are superadmin-only once a term is closed.
- **Navigation shell ships before analytics.** M6 precedes M7.

### 5.1 Applicability model

Settled. Applicability is **per school, per term, carried forward**:

- A user flags an aspect or standard as Not Applicable for a school. That flag holds for the term in which it is set and **carries forward to subsequent terms until changed**. It is not re-entered each term.
- **It is not retrospective.** Closed terms keep the denominator they were actually assessed against. Historical trend data is never rewritten by a later applicability change.
- **Mid-term changes apply to the term in progress.** While a term is open, applicability can be changed and takes effect immediately. At term close the resolved applicability set freezes alongside the ratings — the same freeze, not a second mechanism.
- Setting applicability is available to the **internal** tier while the term is open, and to superadmin only once it is closed.

**Direct consequence, which M7 must handle:** a school's aggregate can move between terms with no rating having changed, purely because the set of assessed standards changed. This is correct behaviour but it is indistinguishable from performance movement unless it is made visible. See REQ-019 and REQ-023.

**Design decision deferred to the M5 brief:** whether applicability is stored as an effective-dated record resolved at read time, or snapshotted per term. Both satisfy the rules above. Surface the trade-off rather than choosing unilaterally.

---

## 6. Requirements

---

### M1 — Stabilise

**Definition of done:** REQ-007 → REQ-012 verified in production; AUD-001 reported; SEC-001 reported and its contract documentation landed; DOC-001, DOC-002 and DOC-003 complete; regression notes in the changelog; API contract updated wherever a response shape changed.

**M1 closes without a working evidence feature.** REQ-006 has been retired into REQ-017 (M4) — see the retirement note below. This is accepted, not an oversight.

---

#### AUD-001 — Term and date model audit
**Type:** Discovery. No fix expected in M1.

**Why:** Three separate pieces of downstream work assume a term model that may not exist. M3 gates editability on term state. M5 gates applicability on term boundaries. REQ-009 filters on an "overdue" status that must be computed against something. If terms are currently no more than a label on an assessment, all three are building on air.

**Questions to answer:**
- Does a terms table or equivalent exist, and does it carry start and end dates?
- Is there any concept of term state — open, closed, current — or is the current term inferred?
- What computes "overdue", and what does it compare against? A per-assessment due date, a term end date, or nothing at all?
- Does anything else in the platform validate against term dates?
- Is there any existing per-school scoping structure that applicability could attach to, or would M5 introduce that relationship for the first time?

**Output:** A written finding, not a fix. Any work arising lands in M3 or M5 and is scoped there.

**Do not:** build a term scheduling capability, add date columns, or change how the current term is determined. This task is read-only.

---

#### DOC-001 — Contract housekeeping
**Type:** Housekeeping. Documentation only, no application code. Run before implementation work opens.

Three defects in the contracts themselves, surfaced during M1 onboarding:

1. **`assurly-api-contract.md` header reads `Version: v1`** while its own change log runs to v2.5. The change log is authoritative on version. Correct the header to match, and check whether anything else in the header block is equally stale.
2. **`project-structure.md` is dated 4 January 2026 and no longer describes the repository.** It references API specification files that no longer exist and root-level files that are not present. It is demoted to descriptive pending DOC-002 and must not be relied on for file layout in the meantime.
3. **Documentation filenames move to lowercase hyphenated form**, matching their siblings: `PROJECT_STRUCTURE.md` becomes `project-structure.md`. A case-only rename on a case-insensitive filesystem will silently do nothing under a plain `git mv` — use a two-step rename via a temporary filename, and confirm the change is actually staged before committing.

Update every internal reference to the renamed file, including this plan.

---

#### DOC-002 — Refresh the project structure document
**Type:** Housekeeping. **Runs at M1 close, not at M1 open.**

Regenerate `project-structure.md` against the repository as it stands once M1 has shipped. Doing it beforehand means doing it twice, since M1 will move files.

Until it lands, the repository itself is the reference for file layout.

**Also in scope: `README.md`.** Its documentation tree is stale in the same way — it lists `docs/api/` files that now live in `docs/archive/`, and a `docs/fixes/` directory that does not exist. Refresh it in the same pass.

---

---

#### SEC-001 — Make the super-admin guard visible
**Type:** Security documentation and verification. Backend, small.

**Why:** `DELETE /api/admin/mock-data/wipe` hard-deletes every `assessments` row for a MAT. **It is protected** — `verify_super_admin` (`main.py:556`) checks the caller's email against the `SUPER_ADMIN_EMAILS` environment allow-list, and both admin endpoints depend on it (`main.py:3667`, `main.py:3797`). But the live OpenAPI spec advertises only `HTTPBearer`, so the protection is invisible to the spec, to the API contract, and to anyone auditing from either. An earlier audit pass raised this endpoint as unguarded on exactly that basis. **The defect is the invisibility, not the guard.**

**Scope:**
- Confirm the check is present and correct on **every** destructive endpoint, not only the two known ones.
- Document the `SUPER_ADMIN_EMAILS` mechanism in the API contract so the security posture is legible without reading the source.
- Report whether any test covers it.
- Report but **do not fix** anything else found.

**Also record for M2:** `SUPER_ADMIN_EMAILS` is the **existing** super-admin mechanism. REQ-013 should extend it rather than introduce a parallel one. Note `.env.example` states plainly that "no DB-level super-admin role exists" — the allow-list is currently the whole of it.

**Separately:** `POST /api/auth/cleanup-expired-tokens` (`main.py:777`) declares **no security requirement at all** — the handler takes no dependencies. Low harm. Report whether that is intentional. Already logged as Known Issue #8 in the API contract.

---

#### DOC-003 — Reconcile the contract with what actually ships
**Type:** Housekeeping. Documentation only, no application code.

Three documents state that the evidence endpoints are live. The live OpenAPI spec confirms they are not.

1. **Correct all three statements:** API contract line 1418 ("The four evidence endpoints are live"), API contract changelog v1.8 ("Promoted the Evidence section… REQ-003 shipped some time ago"), and data model §17 ("Shipped April 2026", "live in production", "Mutated only via the four `/evidence/...` endpoints").
2. **Document the `standard_evidence` table in the data model bible** — key structure, and the `evidence_type` and `url` columns. It is currently undocumented as a live schema object, which is why its shape was unknown until it was queried directly.
3. **Re-verify every `🚧 In-flight` tag removed during the v1.5 → v1.8 reconciliation passes.** At least one was removed on a false judgement that work had shipped. The rest are untrusted until checked. **Report what is found; correct nothing beyond the three statements in (1) without instruction.**

---

#### REQ-006 — Evidence upload not firing — **RETIRED**
**Status:** Retired, not completed. Merged into **REQ-017** (M4).

**Why retired.** REQ-006 was scoped as "make the existing evidence model behave as documented" — a frontend fix over a working backend. Both halves of that premise were false. The M1 backend audit established that **no evidence endpoints have ever existed** on `main`: none of `main.py`'s 42 routes is an evidence route, there is no GCS client, and no Google SDK appears in `requirements.txt`. The M1 frontend audit established that the client existed only on `claude/review-backend-brief-mjtms`, which is absent from `origin` with no pull-request ref to recover it from; the four commits it names (`8676c15`, `e268686`, `215e19a`, `e1f7d3a`) are unreachable. A Cloud Run revision from May 2026 did serve working upload, but the image could not be unpacked and **recovery is abandoned — do not spend further time on it.**

What remained was not a defect fix but a ground-up build of both layers, which is REQ-017's shape and REQ-017's milestone. Keeping it in M1 as a defect would have misrepresented both the work and the milestone.

**M1 therefore closes without a working evidence feature. This is accepted.**

#### REQ-007 — Request a Rating: due date
**Type:** Incomplete build, not a defect

**Problem:** Due dates set when requesting a rating do not survive to the screens that consume them. The create path already sends `due_date`. The defect is downstream — either backend persistence or the by-aspect transform nulling it on read.

> **Settled by the AUD-001 backend audit, 25 August 2026: it is the transform, not persistence.** The backend persists `due_date` on creation (`main.py:1009-1021`) and returns it per standard from the by-aspect endpoint (`main.py:3180`). `transformAssessmentByAspectToAssessment` (`assurly-frontend/src/hooks/use-assessments.ts:84`) then discards it, hardcoding `due_date: null` on the aggregate it builds — even though every standard in `data.standards[]` carries a real value. `isOverdue` returns `false` for a null due date, so this also suppresses overdue rendering on that surface. The list endpoint already derives a group-level due date as `MAX(a.due_date)`; deriving it the same way in the transform is the obvious shape of the fix. **No migration is required — the column exists** (`assessments.due_date`, `date NULL`).

**Production state, measured:** `due_date` is **null on all 1,921 assessment rows**. The create path does send `due_date`, so the plan's original "the selector is a mock, nothing was ever wired up" description was wrong and has been struck.

**Settled design — derive the effective due date on read:**

```sql
COALESCE(a.due_date, t.end_date)
```

An explicit per-assessment date overrides; historical rows behave sensibly with **no backfill**; and a corrected term end date propagates automatically to everything that inherited it. **No migration.**

**Scope — backend:**
- Apply the `COALESCE` derivation on every read path that exposes a due date, and document the derived semantics in the API contract — a derived field that looks like a stored one will mislead the next reader otherwise.
- Accept, validate and persist an explicit due date; return it on read.
- UK timezone handling is a known sensitivity in this codebase — confirm the stored value round-trips correctly.

**Scope — frontend:**
- Bind the date selector to the real payload and surface the due date to the **recipient** of the request, not only the sender.
- Stop discarding it on read: `transformAssessmentByAspectToAssessment` (`use-assessments.ts:84`) hardcodes `due_date: null`.

**Before implementation — one manual test settles an open question.** Create an assessment with a due date through the invitation sheet, then re-count nulls. That distinguishes "nobody has ever set one" from "create silently drops the value". Everything above assumes the former; if the latter, the create path is also defective and the scope grows.

**M3 rule to record now:** **overdue must suppress once a term is closed.** A closed term cannot be actioned, so continuing to flag its assessments as overdue is noise about work nobody is permitted to do.

---

#### REQ-008 — Aspect filter on the Ratings page
**Type:** Defect

**Problem:** Filtering by aspect returns everything for every school. **All other filters work, individually and in conjunction — the aspect filter alone is broken.** The request does not appear in the network tab.

**Audit note — settled.** The filter is **client-side**; the M1 frontend audit found the defect there, and the M1 backend audit confirmed the server-side option is sound if it is ever needed (`GET /api/assessments` filters on `UPPER(ma.aspect_code) = UPPER(%s)`). No backend change is required.

**Also in scope — the same defect, second symptom.** Fold in finding 3 of the frontend audit: the **`localStorage` filter restore compares saved values against raw aspect codes while the options use legacy names**, so restored filters are silently stripped on reload. This is the **same root cause** as the main defect — `aspect_code` versus category misalignment — and the proposed fix already calls for aligning them in one place. **Fixing one without the other ships a filter that works until the user reloads the page**, which is arguably worse than one that visibly never works.

**Out of scope:** New filter dimensions.

---

#### REQ-009 — Status filter operates at the wrong level
**Type:** Defect

**Problem:** The status filter resolves at school level rather than aspect level. Where a single school has a mixture of completed, not started and overdue aspects, filtering by status does not isolate the aspects in that status — the school is treated as having one status.

**Scope:** Status filtering must resolve per aspect within a school, and a school with a mixed set must appear correctly under each applicable status.

**Related:** REQ-008. Both are filter defects on the same surface and may share an audit session, but they are separate fixes with separate causes.

**Backend audit finding — `MAX(due_date)` is the wrong aggregate.** The group-level due date is `MAX(a.due_date)` (`main.py:838`), documented at API contract line 848 as "Latest due date across standards in the group". For the question actually being asked — *is anything in this group overdue?* — `MAX` is wrong: it flags the group only once the **last** standard is past due. An aspect holding one standard three months overdue and one due next month reads as not overdue. The correct aggregate is the earliest due date among standards **not yet complete**. **This misreports a documented contract field today, independent of anything REQ-009 changes.**

Also confirmed: **`?status=overdue` can never return rows.** The grouped `CASE` (`main.py:840-844`) has three total branches — `not_started`, `completed`, `in_progress` — and the filter compares against that derived column, so the endpoint returns `200` with an empty array. A caller cannot distinguish "nothing is overdue" from "this filter does not work".

> **Interaction with REQ-007.** If every standard inherits the same `t.end_date` via the REQ-007 `COALESCE`, then `MAX` and `MIN` agree across the group and **this defect goes quiet** — it does not get fixed, it stops being observable. It resurfaces the moment explicit per-standard due dates are set. Sequencing REQ-007 first therefore hides REQ-009's aggregate bug rather than resolving it; fix the aggregate on its own merits, not on whether the symptom is currently visible.

---

#### REQ-010 — Aspect rename returns 404 for certain names
**Type:** Defect

**Problem:** Renaming an aspect fails with `404 Not Found` for aspects whose current name contains special characters. Reproducible on `IT & Data` and `IT\Data`; every other aspect renames cleanly.

**Observed payload:**
```json
{"aspect_name": "IT\\DATA2", "aspect_description": "", "aspect_category": "strategic", "sort_order": 0}
```

**Leading hypothesis, to be confirmed not assumed:** the rename route identifies the aspect by **name rather than by ID**, so a name containing `&`, `\` or `/` breaks path resolution or URL encoding. A 404 on an aspect that demonstrably exists is characteristic of a routing failure rather than a missing record.

> **Backend audit, 26 August 2026 — hypothesis rejected, symptom confirmed.** The route keys on **ID**, not name, in both layers: `PUT /api/aspects/{mat_aspect_id}` looks up `WHERE mat_aspect_id = %s` (`main.py:2263-2266`) and the new name travels in the JSON body, where special characters are harmless. The frontend passes `aspect.mat_aspect_id` throughout.
>
> The real chain: `mat_aspect_id` is **minted from user text** — `f"{current_mat_id}-{aspect_code_upper}"` (`main.py:2177`) — from an `aspect_code` field validated only for **length** (`z.string().min(2).max(10)`, `CreateAspectModal.tsx:29`; a bare `str` with no validator on the Pydantic side). It is then interpolated into a URL path **without encoding** (`assessment-service.ts:377`), where `actions-service.ts` does encode. The browser's URL parser rewrites `\` to `/`, so `/api/aspects/HLT-IT\DATA` leaves as `/api/aspects/HLT-IT/DATA` — two path segments, no matching route, `404`.
>
> **This explains `IT\Data`. It does not explain `IT & Data`** — `&` is a legal path character and should reach the handler intact. That case **remains open**: either the stored code differs from the display name, or an intermediary is involved, or the two share a symptom and not a cause. `vercel.json` was checked and ruled out.

**Scope:** If the hypothesis holds, the fix is to key the route on the aspect identifier. Escaping the name is a patch over the underlying design problem and should not be the chosen fix without discussion.

**This requires a primary-key migration, not only a code fix.** Rows already minted with unescaped characters in `mat_aspects.mat_aspect_id` stay broken however the code changes — **and those rows are the reported symptom.** The migration rewrites primary keys with dependent foreign keys (`mat_standards.mat_aspect_id`, and transitively anything joining through it), so per §2.4 it needs SQL and a rollback note, written by an agent and applied manually. Treating REQ-010 as code-only will fix future aspects and leave every currently-broken one broken.

**Downstream dependency:** The planned Education → Curriculum and Teaching rename is blocked behind this and is folded into this requirement. Once REQ-010 is fixed, perform that rename and confirm it propagates correctly.

---

#### REQ-011 — "Updated" date always reports today
**Type:** Defect

**Problem:** Every standard within every aspect displays today's date as its updated date, regardless of when it was actually last modified.

**Audit questions:**
- Is a genuine `updated_at` being persisted per standard, or is the timestamp being generated at read time?
- Is the frontend rendering `Date.now()` rather than the returned field?
- Does the field exist in the response at all?

**Why this matters more than it looks:** M6 depends on trustworthy timestamps. If update times are being fabricated at read time, that needs to be known before analytics work begins.

**Audit answer, 26 August 2026 — all three questions settled.** The timestamp is genuine in the database, absent from the API, and fabricated by the frontend. `mat_standards.updated_at` holds real values; `GET /api/standards` neither selects it (`main.py:1115-1129`) nor declares it on `MatStandardResponse` (`main.py:326-334`), so the `response_model` would strip it even if the SELECT were fixed; and `SortableStandardCard.tsx:136` renders `standard.updated_at || new Date()`, so the fallback fires every time and prints today.

**Settled definition: "Updated" means a *material* edit.** Renames and content changes count. **Reordering does not.**

**Scope:**
- **Stop bumping `updated_at` on `sort_order`-only writes.** This is the part that makes the field mean what the definition says.
- **Expose it on `GET /api/standards`** — both the SELECT and `MatStandardResponse`, since either alone is insufficient.
- **Update API contract §13.** Its current omission *accurately* documents a deficient endpoint, so this is a genuine backend gap and **both the contract and the implementation change** — this is not a documentation-only correction.
- **Remove the frontend's `|| new Date()` fallback** so a missing value renders as "—" rather than a plausible lie. `VersionHistoryModal.tsx:77` carries the same pattern.

**Confirm what currently writes `updated_at` before implementing.** The column carries `CURRENT_TIMESTAMP on update`, and at least one handler also sets it explicitly (`main.py:1718`). Both paths must be accounted for, or the sort-order exclusion will be silently defeated by the column default.

---

#### REQ-012 — Inactive aspects view returns 404
**Type:** Defect

**Problem:** The inactive aspects feature errors with a 404 despite previously deleted aspects existing in the tenant.

**Audit note:** Determine whether deletion is soft or hard. If aspects are hard-deleted, the inactive view has nothing to return and the defect is conceptual rather than a routing bug — report that finding rather than fabricating a fix. This interacts with REQ-016, which introduces deletion of assessments; the two should share a consistent deletion model.

> **Audit answer, 26 August 2026 — deletion is soft, and this is a routing bug.** Neither branch of `delete_aspect` (`main.py:2342-2438`) issues a `DELETE`: defaults get `is_active = 0` with IDs intact and are reinstatable; customs get archive-renamed to `{id}-deleted-{ts}` plus `is_active = 0`. Data model §11 records 14 inactive rows in production, so the view has real data to return. The conceptual explanation is **rejected on evidence**.
>
> The cause is **route shadowing**. Starlette matches in registration order, and `@app.get("/api/aspects/{mat_aspect_id}")` is registered at `main.py:2105` while `@app.get("/api/aspects/inactive")` is at `main.py:2502`. The literal route is unreachable; the request lands on the detail handler with `mat_aspect_id="inactive"`, which finds no such aspect and raises `404`. **Confirmed against the live OpenAPI spec.**

**Also in scope: `GET /api/standards/inactive`, which has the identical bug.** `@app.get("/api/standards/{mat_standard_id}")` is registered at `main.py:1181` and `@app.get("/api/standards/inactive")` at `main.py:1926`. Both confirmed against the live OpenAPI spec: the inactive routes are registered after their parameterised siblings. **Same two-decorator fix, same session** — otherwise it resurfaces as a separate bug report the week after REQ-012 ships.

**Fix:** move each literal route above its parameterised sibling. No logic change, no data change, no migration. The other parameterised routes were checked — `/api/users/me`, `bulk-update` and `by-aspect` are safe; these two are the only literal-after-parameter collisions in the file.

**Blast radius note:** a feature that has never worked starts working, surfacing inactive rows nobody has seen. `get_inactive_aspects` deliberately excludes archived customs, so the count shown will be deactivated defaults only, not all 14. Confirm the view renders sensibly with real data before calling it done.

**Frontend:** none. `getInactiveAspects` already calls the correct path (`assessment-service.ts:418`) and has been receiving a 404 from a correctly-formed request.

---

### M2 — Role model

#### REQ-013 — Three-tier role model
**Type:** Feature

**Problem:** There is currently no way to give Trustees and Governors visibility of the platform without also giving them the ability to change data. This also blocks opening the platform up for wider testing.

**Scope — backend:**
- Implement the superadmin / internal / external tiers described in Section 3.
- External tier: read access to everything within the MAT, including commentary and evidence; **write blocked at endpoint level**. Hiding controls in the UI is not sufficient and will not be accepted as the implementation.
- Superadmin tier scoped across tenants for the platform team. **`SUPER_ADMIN_EMAILS` is the existing super-admin mechanism** — an environment allow-list checked by `verify_super_admin` (`main.py:556`). **Extend it; do not introduce a parallel one.** Note `.env.example` states plainly that no DB-level super-admin role exists, so this allow-list is currently the whole of it, and REQ-013 is where that either becomes a real role or is deliberately kept as configuration. See SEC-001.
- Audit the three user-CRUD endpoints currently missing `verify_mat_admin` as part of this work — the role model is the right moment to close that gap.

**Scope — frontend:**
- Write affordances suppressed throughout for the external tier.
- User management flow for inviting and assigning the external role.

**Out of scope:** Subdividing the internal tier. Per-school scoping of external users — they see the whole MAT.

---

### M3 — Assessment lifecycle

**Gate:** M2 complete.

---

#### REQ-014 — Assessments editable until term close
**Type:** Feature (lifecycle change)

**Problem:** Once ratings are submitted for a term they cannot be amended at all. Users who submit initial judgements and intend to return with fuller commentary and evidence find the section locked.

**Model:** Submission is a checkpoint, not a lock. **An assessment remains editable by any internal user in the MAT for as long as the term is open.** Locking happens at term close and only then.

**Scope — backend:**
- Remove the post-submission lock; gate editability on term state rather than submission state.
- Retain submission as a meaningful state for reporting and completion tracking — an assessment can be submitted and still amendable.
- Audit trail: who changed what, from what to what, when. This is the prerequisite for trusting the historical series M6 will visualise.

**Scope — frontend:**
- Distinguish draft / submitted / amended clearly, without implying that submitted means locked.
- Remove the dead end in the current edit flow.
- Surface the audit trail.

**Out of scope:** Approval workflows, multi-step sign-off, notification emails.

---

#### REQ-015 — Term close
**Type:** Feature

**Problem:** With editability gated on term state, term state needs an owner and an explicit transition.

**Scope — backend:**
- Term close and reopen actions, **restricted to superadmin**.
- Closing a term freezes all assessments within it against internal-tier writes. **Closing also prevents creation of new assessments against that term**, not only editing of existing ones. Until a term is closed it remains open for both.
- Both actions audited.

**Creating an assessment against a past open term is intended behaviour.** Term close is the only gate. A term that has ended by the calendar but has not been closed by a superadmin stays fully open for creation and editing, and back-dated creation must remain available by default.

**Scope — frontend:**
- Superadmin control for closing and reopening a term, with a confirmation step naming the term and the number of assessments affected.
- Clear indication to all users when a term is closed and why editing is unavailable.

**After close:** edit, delete and clear are superadmin-only.

**Design input — "current term" collapses into term state (AUD-001).** The platform currently derives "current term" two mutually inconsistent ways under the same name: `GET /api/terms` sets `is_current` from the calendar (`CURDATE() BETWEEN start_date AND end_date`), while `GET /api/dashboard/schools` sets `current_term` to whichever term has assessment rows. This is a real defect and is **deliberately not being fixed in M1** — it resolves here. Once term state exists, current term becomes **the most recent open term, derived from state**, and **both existing derivations are deleted**. Note that `current_term` is a contract-visible response field, so this is a contract change as well as a code change.

> **Correction to the AUD-001 finding — there is no vacation gap.** AUD-001 reported that `is_current` would be false for every row during vacations. **That was wrong.** It rested on an assumption about the table's contents, and the production data disproves it: T1 runs 1 Sep – 31 Dec, T2 1 Jan – 1 Apr, T3 2 Apr – 31 Aug, **each abutting the next with no gap**. `is_current` is true for **exactly one row at any time**. Any AUD-001 conclusion that depended on the gap is void.

**Settled rules for the term model:**

- Terms sort **newest to oldest**.
- **The reporting term is the current calendar term**, regardless of open or closed state. Open/closed governs *writability*, not *which term is reported*. These are separate axes and must not be conflated.

> ⚠️ **Dated risk — 1 September 2026.** On that date `is_current` flips to `T1-2026-27`, which **has no assessment rows**. `GET /api/dashboard/schools` derives its term from whichever term has rows, so it will keep reporting `T3-2025-26`. The two derivations, which agree today, visibly diverge on that date and the dashboard silently reports a term that is no longer current.
>
> **The resolution is an empty state plus a term switcher — not a fallback to the last term with data.** A fallback reintroduces exactly the "term with rows" derivation this requirement exists to delete, and it does so invisibly. An empty state is honest about there being no data yet; a fallback is not.

**Known gap:** the platform may have no mechanism for scheduling term dates and may not validate against them anywhere. **AUD-001 in M1 establishes this before M3 opens.** If terms carry no state today, REQ-015 is not adding a close action to an existing model — it is introducing term state for the first time, and should be scoped accordingly. Automatic date-driven transitions remain out of scope either way; close is a manual superadmin action.

---

#### REQ-016 — Delete and clear assessments
**Type:** Feature

**Problem:** An assessment entered against the wrong school cannot currently be removed. There is no route back from a mis-entry.

**Scope — backend:**
- Delete and clear actions available to **any internal user in the MAT while the term is open**. No administrative escalation required.
- Deleted or cleared assessments must be excluded from aggregates, RAG, rankings and trend series — not merely hidden in the UI.
- Both actions audited, including the actor.
- Deletion model must be consistent with whatever REQ-012 establishes for aspects.

**Scope — frontend:**
- Confirmation step naming the school, aspect and term being deleted or cleared.
- Distinguish clear (ratings reset, assessment retained) from delete (assessment removed) in the interface — they are different intents.

**Note:** Any existing mis-entered data should be resolved manually via the current admin endpoints rather than waiting for this to ship.

---

### M4 — Evidence model

**Gate:** None. REQ-006 has been retired into REQ-017, so the gate it provided no longer exists. **M4 keeps its position in the sequence.**

---

#### REQ-017 — Evidence: build the feature
**Type:** Feature. **Full rebuild of both layers.** No longer a data-model change.

**Absorbs REQ-006**, retired from M1. See the retirement note under M1 for why.

**Problem:** There is no working evidence feature. Users cannot attach evidence to a standard because they cannot attach evidence at all.

**What already exists — the schema, and it is already correct.** `standard_evidence` is keyed on `mat_standard_id` + `school_id` + `unique_term_id` — **per standard, per school, per term**, the same grain as `assessments`. That is exactly the grain this requirement was originally written to introduce. **No migration is required, and the "move evidence from aspect level to standard level" framing is void** — it was never stored at aspect level. The aspect-level ceiling users experienced was a property of the (now absent) frontend client, not of the data.

The mock-data wipe docstring in `main.py` documents this key structure, so the table was integrated at some point even though no evidence routes now exist.

**What does not exist:** the endpoints and the client. Neither is on `main`, and **neither is recoverable.** A Cloud Run revision from May 2026 did serve working upload, but the image could not be unpacked. **Recovery is abandoned — do not spend time on it.**

**The GCS bucket is known, not an open question.** `GCS_EVIDENCE_BUCKET` is still set in the deployed image, so the bucket exists and the upload target is settled. **Verify writability during implementation**, not before.

**Scope — backend:**
- Build the four evidence endpoints. API contract §28–31 already specifies them completely — form fields, accepted types, the 25 MB cap, the 400/403/413/415 matrix, MAT isolation, and 404-not-403 on cross-MAT reads to avoid leaking existence. **Build to the contract.** If the contract turns out to be wrong, raise it; do not diverge silently.
- Aspect-level evidence counts are **derived** from the per-standard rows, never stored.

**Scope — frontend:**
- Build the upload control and file list against each standard.
- Evidence indicators at both standard and aspect level.

**File count limits are waived** for the early adopter phase — see §5. Do not reintroduce a cap.

**Link evidence is anticipated by the schema but out of scope.** The table carries `evidence_type` (`'file'` | `'url'`) and a `url` column, with a CHECK constraint enforcing mutual exclusion, and contract §29 specifies `POST /evidence/link`. **Do not design it out** — building only the file path in a way that makes links awkward to add later would waste the schema work already done.

**Out of scope:** Evidence versioning, approval, tagging, content extraction.

> **Note for whoever picks this up.** `.env.example` carries a dated caveat (2026-06-04) that `GCS_EVIDENCE_BUCKET` "is referenced in deployment infra but the backend Python code does not currently read it directly — upload + signed-URL handling is external". If upload was genuinely served outside the FastAPI application, the working revision may not be a useful reference for a FastAPI-native implementation even had it been recoverable. Establish where the upload path is intended to live before writing code.

### M5 — Applicability

#### REQ-018 — Standards marked not applicable per school
**Type:** Feature (data model and aggregation change)

**Problem:** Some standards do not apply to some schools — Early Years and Sixth Form provision being the obvious cases across a mixed-phase trust. Where an aspect or standard has been sent down to a school as assessable but does not in fact apply to it, the only current workaround is to rate it at the bottom of the scale, which actively corrupts the school's aggregate and the trust-level picture.

**Scope — backend:**
- Per-school, per-term applicability for aspects and standards, carried forward until changed. Full rules in Section 5.1 — read them before scoping.
- Not-applicable items excluded from: aggregate scores, RAG derivation, performance banding, "Requires Attention", rankings, completion percentages and trend series.
- Expose the count of assessed items per school per term alongside scores, so that a denominator change is detectable by consumers rather than silently absorbed into an average.
- Permission rules per Section 5.1: internal tier while the term is open, superadmin once closed.

**Scope — frontend:**
- Not-applicable items visibly excluded rather than silently absent.
- Completion indicators reflecting the reduced denominator.
- Flagging control on the aspect and standard, available while the term is open.

**Out of scope:** Per-school custom standards or bespoke frameworks. Applicability is on/off against the existing framework. Also out of scope: the trust-side push-down that determines what is sent to a school in the first place — applicability is the school's override on what it has been given.

**Out of scope:** Per-school custom standards or bespoke frameworks. Applicability is on/off against the existing framework.

---

### M6 — Navigation shell

**Gate:** M2 complete.

---

#### REQ-024 — Collapsible left-hand navigation
**Type:** Feature (frontend shell)

**Problem:** The feature set has outgrown the current navigation. Analytics, the Risk Profile, Actions and Interventions all need a home, and more are coming.

**Scope — frontend:**
- Persistent left-hand navigation with collapse and expand.
- Collapsed state persists across sessions.
- All existing views rehomed into the shell.
- Navigation items respect role tier — external users do not see routes they cannot use.
- Room left for the views M7 and M8 will add; the information architecture should be designed for the full feature set, not only what exists today.

**Out of scope:** Visual redesign of the views themselves. This is a navigation shell, not a reskin.

---

### M7 — Analytics and trends

**Gate:** M3, M5 and M6 complete. Split into M7a (backend) and M7b (frontend).

**Goal:** Answer, without leaving the platform: what changed since last term, where, and is it one school or the whole trust?

---

#### REQ-019 — Term-over-term change in detail views
**Type:** Feature

**Problem:** The school snapshot shows change since the previous term, but drilling into an area shows current scores only. The ability to see what has changed is lost at exactly the point the user is trying to investigate it.

**Scope:** Previous-term value and delta carried through to aspect detail and standard detail, not just the snapshot. Deltas respect polarity conventions.

**Applicability caveat:** where the assessed set changed between the two terms being compared, the delta must be marked as such rather than presented as a like-for-like movement. See Section 5.1.

---

#### REQ-020 — Interactive drill-down from Ratings by Aspect
**Type:** Feature

**Problem:** The Ratings by Aspect chart is static. Identifying the weakest aspect gives the user nowhere to go.

**Scope:** Chart elements become navigation. Clicking an aspect opens that aspect across all schools, over time — answering whether a weak score is one school's problem or a trust-wide one.

---

#### REQ-021 — Comparative analytics
**Type:** Feature

**Problem:** Current analytics are shallow. There is no school-by-school comparison, no comparison over time, and no way to drill from aspect to standard. It is not clear which schools are moving backwards relative to others and which are improving quickly.

**Scope:**
- Aspect-level and standard-level comparison across schools within the trust, and across terms.
- Movement made visually obvious — improvement and deterioration relative to peers, not just absolute position.
- **Benchmarking within the trust is in scope**: trust average, and comparison of a school against its peers. This was previously misread as a cross-trust request and deferred — it is not deferred.
- Cross-**MAT** benchmarking remains out of scope. Design the aggregate data shape so it is not precluded later; build nothing for it now.

---

#### REQ-022 — Dynamic graph scaling
**Type:** Feature

**Problem:** Aggregated scores cluster tightly on a 0–4 axis and are hard to differentiate visually.

**Scope:** Dynamic axis domain for aggregated scores, with a minimum span so that near-identical values do not exaggerate into apparent large gaps, and a clearly labelled non-zero baseline so a truncated axis is never mistaken for a full one. A fixed range was considered and rejected — it clips or hides any value falling outside it.

**Applies to aggregated scores only.** Individual ratings keep the full 1–4 scale.

---

#### REQ-023 — Rankings movement
**Type:** Feature

**Problem:** The School Performance Rankings table shows current position with no indication of movement.

**Scope:** Previous-term rank retained and rendered as a movement indicator alongside current rank.

**Interaction with M5 — now certain, not hypothetical:** applicability is per term and carries forward, so a school's denominator can change between terms. Rank movement may therefore reflect a change in what was measured rather than a change in performance. The assessed-item count exposed by REQ-018 must be used to distinguish the two, and a scope-driven move must be visually distinguishable from a performance-driven one.

---

### M8 — Actions and Interventions

**Gate:** M2 and M6 complete.

---

#### REQ-025 — Actions register
**Type:** Feature

**Problem:** Actions set during rating are only reachable through the edit flow. Users who need to see and work with actions have to enter an editing context to do so.

**Scope — backend:**
- Read and write endpoints for actions, independent of the assessment edit path.
- Filterable by school, aspect, term, owner and status.
- **Editable by all internal users.** External tier is read-only, consistent with Section 3.

**Scope — frontend:**
- Standalone actions register in the new navigation shell, browsable and editable without entering the assessment edit flow.

---

#### REQ-026 — Intervention model
**Type:** Feature

**Problem:** There is no structured model for interventions — no distinction between the specific and the planned, no ownership, no dates, no link to development plans.

**Scope — backend:**
- Intervention model distinguishing **Specific** from **Planned** interventions.
- Owners, dates, and links to development plans.
- Relationship to actions defined explicitly in the data model bible before implementation.

**Scope — frontend:**
- Interventions view in the navigation shell, alongside the actions register.

**Sequencing within M8:** REQ-025 and REQ-026 ship together. Actions were held back specifically so the register is not built once and then rebuilt when interventions land.

---

## 7. Parked

Not scheduled. Not to be picked up opportunistically.

| Item | Note |
|---|---|
| Per-aspect rating criteria | Parked |
| Term date scheduling | Parked as a capability. **AUD-001 in M1 establishes what exists today**; REQ-015 introduces only the manual close action. A full scheduling capability is not needed now. |
| PowerBI dashboard integration | Parked. Revisit after M7 — some overlap with native analytics. |
| Push-down trust assessment with per-school RAG propagation | Parked. Will interact with M5 applicability at the propagation step. |
| Frontend README strip treatment; Dockerfile `.dockerignore` | Deferred tidy-up, unchanged |
| `schools` table NOT NULL hardening | Deferred tidy-up, unchanged |
| Expanded-school invalidation edge case for aspect metrics | Deferred tidy-up, unchanged |

**Absorbed into scheduled work:**

- `is_custom` / `is_modified` boolean coercion → investigate under REQ-010; promote into M1 if it proves to be the cause.
- `verify_mat_admin` gaps on three user-CRUD endpoints → REQ-013.
- Trends endpoint view param backend work → M7.
- Education → Curriculum and Teaching rename → REQ-010.

---

## 8. Status

| REQ | Milestone | Status | Backend | Frontend | Docs |
|---|---|---|---|---|---|
| AUD-001 | M1 | Complete — findings reported | ☑ | — | ☑ |
| DOC-001 | M1 | Complete | ☑ | — | ☑ |
| DOC-002 | M1 | Held to M1 close | ☐ | — | ☐ |
| DOC-003 | M1 | Complete — corrections applied, tags re-verified | ☑ | — | ☑ |
| SEC-001 | M1 | Complete — verified and documented | ☑ | — | ☑ |
| REQ-006 | — | **Retired** — merged into REQ-017 | — | — | — |
| REQ-007 | M1 | Ready | ☐ | ☐ | ☐ |
| REQ-008 | M1 | Ready | ☐ | ☐ | ☐ |
| REQ-009 | M1 | Ready | ☐ | ☐ | ☐ |
| REQ-010 | M1 | Ready | ☐ | ☐ | ☐ |
| REQ-011 | M1 | Ready | ☐ | ☐ | ☐ |
| REQ-012 | M1 | Ready | ☐ | ☐ | ☐ |
| REQ-013 | M2 | Ready | ☐ | ☐ | ☐ |
| REQ-014 | M3 | Gated on M2 | ☐ | ☐ | ☐ |
| REQ-015 | M3 | Gated on M2 | ☐ | ☐ | ☐ |
| REQ-016 | M3 | Gated on M2 | ☐ | ☐ | ☐ |
| REQ-017 | M4 | Ready — absorbs REQ-006 | ☐ | ☐ | ☐ |
| REQ-018 | M5 | Ready | ☐ | ☐ | ☐ |
| REQ-024 | M6 | Gated on M2 | — | ☐ | ☐ |
| REQ-019 | M7 | Gated on M3, M5, M6 | ☐ | ☐ | ☐ |
| REQ-020 | M7 | Gated on M3, M5, M6 | ☐ | ☐ | ☐ |
| REQ-021 | M7 | Gated on M3, M5, M6 | ☐ | ☐ | ☐ |
| REQ-022 | M7 | Gated on M3, M5, M6 | ☐ | ☐ | ☐ |
| REQ-023 | M7 | Gated on M3, M5, M6 | ☐ | ☐ | ☐ |
| REQ-025 | M8 | Gated on M2, M6 | ☐ | ☐ | ☐ |
| REQ-026 | M8 | Gated on M2, M6 | ☐ | ☐ | ☐ |

---

## 9. Changelog

| Version | Date | Change |
|---|---|---|
| 2.6 | 26 August 2026 | Applied after four production SQL queries and the live OpenAPI spec were checked; several earlier audit conclusions are corrected as fact, not opinion. **Terms:** the AUD-001 "vacation gap" finding is **withdrawn** — terms abut (T1 1 Sep–31 Dec, T2 1 Jan–1 Apr, T3 2 Apr–31 Aug) and `is_current` is true for exactly one row at any time. Settled rules recorded on REQ-015: terms sort newest to oldest, and the reporting term is the current calendar term regardless of open/closed state. Dated risk recorded for **1 September 2026**, when `is_current` flips to a term with no rows while the dashboard keeps reporting the last term with rows — resolved by an empty state and a term switcher, never a fallback. **REQ-006 retired** into REQ-017 and removed from M1 in §4, §6 and §8; it was retired, not completed, and M1 now closes without a working evidence feature by acceptance. M4's gate and §4.1's defect count updated in consequence. **REQ-017 rewritten** as a full rebuild of both layers, no longer a data-model change: `standard_evidence` is already keyed per standard/school/term so no migration is needed, the GCS bucket is known via `GCS_EVIDENCE_BUCKET`, recovery of the lost implementation is abandoned, and link evidence stays anticipated-but-out-of-scope. **SEC-001 added** to M1 — the super-admin guard on the destructive admin endpoints is real but invisible to the OpenAPI spec and the contract; scope is to verify, document and report, and to record `SUPER_ADMIN_EMAILS` as the mechanism REQ-013 must extend. **DOC-003 added** to M1 — correct the three documents asserting the evidence endpoints are live, document `standard_evidence` in the data model, and re-verify the `🚧 In-flight` tags removed across v1.5–v1.8. **REQ-007**: the "unwired mock" description struck (`due_date` is null on all 1,921 rows but the create path does send it); effective due date settled as `COALESCE(a.due_date, t.end_date)` with no migration; overdue must suppress on closed terms (M3); one manual test recorded as a precondition. **REQ-008**: the `localStorage` filter-restore defect folded in as the same root cause. **REQ-009**: `MAX(due_date)` recorded as the wrong aggregate, with the note that REQ-007 will mask rather than fix it. **REQ-010**: primary-key migration recorded as required, and `IT & Data` recorded as still unexplained. **REQ-011**: "Updated" defined as a material edit, excluding reordering. **REQ-012**: `/api/standards/inactive` folded in as the identical route-shadowing bug. |
| 2.5 | 25 August 2026 | Post-AUD-001 corrections. §4 M1 row now lists AUD-001, DOC-001 and DOC-002 alongside REQ-006 → REQ-012, resolving the disagreement with §6 and §8. DOC-002 scope extended to `README.md`, whose documentation tree is stale in the same way. REQ-015: closing a term now explicitly bars creation against that term as well as editing, and back-dated creation against a past *open* term is recorded as intended behaviour, not a defect. REQ-015 also carries a new design input — the two conflicting "current term" derivations collapse into "most recent open term" here, and both are deleted. REQ-006 problem statement corrected: the regression hypothesis is withdrawn, the cause is that the upload client was never merged, and the fix is a port from `claude/review-backend-brief-mjtms` — **which is not on `origin` and must be pushed before REQ-006 opens**. REQ-007 problem statement corrected: the mock-modal description is withdrawn; the create path sends `due_date`, the backend persists and returns it, and the by-aspect transform discards it on read. No version 2.4 exists in this repository — 2.3 goes straight to 2.5; see the DOC-001 and AUD-001 dev log entries. |
| 2.3 | 25 August 2026 | Development log and versioning conventions added (§2.5, §2.6). DOC-001 and DOC-002 added to M1 following contract discrepancies found during onboarding. `PROJECT_STRUCTURE.md` demoted from authoritative to descriptive pending refresh, and documentation filenames standardised to lowercase hyphenated form. |
| 2.2 | 25 August 2026 | Applicability model settled: per school, per term, carried forward, non-retrospective, frozen at term close. AUD-001 added to M1 to establish whether a term and date model exists before M3 and M5 are scoped. Denominator-change visibility written into REQ-018, REQ-019 and REQ-023. No open questions remain. |
| 2.1 | 25 August 2026 | Remaining decisions closed: evidence limits waived for the early adopter phase; closed terms superadmin-only; navigation shell promoted ahead of analytics. Milestones renumbered — navigation shell is M6, analytics M7, Actions and Interventions M8. Term date scheduling gap recorded against REQ-015. One open assumption remains on applicability retrospection. |
| 2.0 | 24 August 2026 | Decisions applied. Role model settled and promoted to M2 as a prerequisite. Lifecycle model set to editable-until-term-close. Three defects added to M1. Navigation shell, Actions and Interventions consolidated into M7. Within-trust benchmarking restored to scope. Renumbered throughout. |
| 1.0 | 23 August 2026 | Initial plan. Six milestones, fifteen requirements, ten decisions outstanding. |