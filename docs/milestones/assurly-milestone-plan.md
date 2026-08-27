# Assurly — Milestone Plan

**Suggested path:** `docs/milestones/assurly-milestone-plan.md`
**Version:** 2.9
**Date:** 27 August 2026
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
7. **Label provisional claims where the reader meets them.** A finding resting on an unverified assumption is marked provisional **at the point of the claim**, not only in the Assumptions section at the foot of the document. A reader who acts on the headline may never reach the footer.

### 2.3 Sequencing gate

Backend ships and is verified before the corresponding frontend work opens. Frontend must not build against a contract change that is not yet merged and documented. Each milestone names its own gate.

### 2.4 Standing constraints

- British English throughout code, comments, UI copy and documentation.
- DB migrations are written and applied manually. Agents produce the migration SQL and a rollback note; they do not run it.
- Rating polarity is settled and must not be reinterpreted: **rating 4 is always the best outcome**, labels carry polarity, numbers are uniform.
- "Requires Attention" flags **rating 1 only**.
- Fixed terminology: "Risk Profile" (never "Risk Register"); performance bands are Strong / Healthy / Needs Improvement / Critical; aspect categories are `operational` and `strategic`.
- No terminology, threshold or polarity change without explicit sign-off from the Product Owner.
- **Identifier fields are constrained; display fields are not.** Any user-supplied value that becomes part of an identifier, a primary key, or a URL path segment is constrained to a documented character set, **validated at the backend as the authoritative control** and mirrored at the frontend for the error message only. **Frontend validation is never the control:** the API is reachable directly, and the two layers drift.

  This applies to the value that *becomes* the identifier, not to display fields. Names, descriptions and commentary carry no such restriction — they are displayed, never routed. Confusing the two produces both unreachable rows and needlessly restricted user input.

  Where a value is already an identifier, **encode it at every interpolation site** rather than relying on it being safe. REQ-010 is the reference implementation for both halves.

### 2.5 Development log

Git records what changed. The development log records why, and is the source material for the release notes published in the application's built-in version history.

**One file per session. Never a shared append-only file** — concurrent agents editing a single log is the same conflict trap as the API contract, and it is the file most likely to be edited on every single session.

Path: `docs/dev-log/YYYY-MM-DD-<layer>-<req-id>.md` — for example `docs/dev-log/2026-08-26-backend-req-010.md`

Template: `docs/dev-log/_template.md`. Every session closes with an entry, **including audit and discovery sessions** — a session that deliberately changed nothing is worth recording, and often more informative than one that did.

Entries are compiled into `docs/development-log.md` at each milestone close. Agents do not write to that file.

**Agents do not write release notes.** Version history copy is user-facing, read by school and trust staff, and is written by the product owner from the compiled log. Write the dev log entry for an engineer picking the work up cold, not for a customer.

**Plan-edit sessions require an entry too.** A session that only changes this document still made decisions, and the reasoning behind a scope change is exactly what a later reader needs. Earlier plan-edit sessions (v2.6, v2.7, v2.8) have no entry; that is a gap, not a precedent.

**The `Deployed:` field is populated from this session forward** (plan v2.9, 27 August 2026).

### 2.6 Versioning

Current release 1.43. This programme is Sprint 2.0.

- Requirement ships: patch bump — 1.43.1, 1.43.2 and so on
- Milestone closes: minor bump — M1 close is 1.44.0
- Sprint closes: 2.0.0, declared by the product owner, never by an agent

Record every bump in the dev log entry that caused it.

**A version bump records a merge, not a deployment.** The two are separate events in this programme — work merges continuously to `sprint-2.0` and deploys at test gates (§2.7) — and a requirement can sit merged for some time before it runs anywhere. Merged-with-an-unapplied-migration and running-in-production are different states, and the log must be able to tell them apart, so the dev log template carries a **`Deployed:`** field: *yes* plus the date, or *no*.

1.43.1 (REQ-012) and 1.43.2 (REQ-010) stand as recorded — both are merges, and neither claimed to be more.

> ⚠️ **No artefact currently asserts a version.** Not the repository, not the application, not any config file — the version exists **only in dev log entries**, which is to say only in prose written after the fact. **A single source of truth is needed before 2.0**, because the in-app version history depends on it and cannot be generated from prose. Flagged, no action in M1.

### 2.7 Test gates

**Work merges continuously to `sprint-2.0`. Deployment happens at defined test gates, not per commit.**

A gate bundles low-risk changes into a single test pass, so that a handful of small fixes are exercised together rather than each one buying a separate deploy-and-verify cycle.

**What must deploy alone, and be tested alone:**

- anything involving a **schema change** or a **data migration**;
- anything changing **authentication or permissions**.

These do not join a bundle. The reasoning is that their failure modes are not additive — a permissions regression or a bad migration is hard to attribute when three other changes shipped in the same pass, and both are expensive to reverse.

**The product owner runs the gate and declares the result. Agents do not declare a gate passed.** An agent may report that its own work is code complete, that its checks pass, and what a gate would need to exercise; it may not conclude from that that the gate has been met.

**Each gate's checklist is derived from the requirements it contains** — the per-requirement verification notes are the raw material, not a separate document.

**A requirement split across gates is not complete in §8 until every gate containing it has passed.** This is explicit and not a matter of judgement: a requirement with a deployable half and a schedulable half (see REQ-010) belongs to **two** gates, and passing the first does not close it. Half-shipped is not shipped.

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
| **M1** | Stabilise — live defects | AUD-001, DATA-001, DOC-001 → DOC-003, SEC-001, REQ-007 → REQ-012, REQ-027 → REQ-029 | None. Starts immediately. |
| **M2** | Role model | REQ-013 | None |
| **M3** | Assessment lifecycle | REQ-014 → REQ-016 | M2 complete |
| **M4** | Evidence model | REQ-017 | **M2 and M3 complete** |
| **M5** | Applicability | REQ-018 | None |
| **M6** | Navigation shell | REQ-024 | M2 complete |
| **M7** | Analytics and trends | REQ-019 → REQ-023 | **M3, M5 and M6 complete** |
| **M8** | Actions and Interventions | REQ-025 → REQ-026 | M2 complete |

### 4.1 Sequencing rationale

- **M1 first.** Nine live defects, most of them cheap, all of them visible to the early adopter during the exact period they are being asked to trust the platform. (REQ-006 was retired into REQ-017; REQ-027, REQ-028 and REQ-029 added, plus DATA-001 as a manual data task — see §6.)
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

> **Manual test complete — the question is settled, and the create path is sound.** 180 assessments were created with a due date and **all 180 persisted**. The 1,921 pre-existing nulls are **non-use, not a silent drop**. The scope does not grow: the defect is confirmed as `transformAssessmentByAspectToAssessment` nulling `due_date` on read.

**Also in frontend scope — the date selector modal is not clickable.** It can currently be operated only by keyboard tabbing. Likely a `pointer-events` or overlay stacking defect. **Fix alongside the display work** — a due date the user cannot set with a mouse is not meaningfully different from one that is discarded on read, and shipping the read fix alone would leave the feature still unusable for most users.

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
> **This explains `IT\Data`. It does not explain `IT & Data`** — `&` is a legal path character and should reach the handler intact. `vercel.json` was checked and ruled out, as was client-side id reconstruction (`CreateAspectModal.onSubmit` passes `aspect?.mat_aspect_id` through verbatim).

**`IT & Data` — SETTLED. Both previously recorded hypotheses were wrong.**

Production data shows `aspect_code = 'IT/DATA_OP'`, giving `mat_aspect_id = 'HLT-IT/DATA_OP'`. **The failing character is a forward slash in the identifier, not the ampersand in the display name.**

**This is why two sessions diagnosed the wrong character: users report by display name.** The name shown in the interface — "IT & Data" — contains an ampersand that is entirely harmless and is not part of the id. The id is derived from `aspect_code`, which nobody was looking at. Worth carrying forward as a habit: when a defect is reported against a user-visible label, establish what the *identifier* is before reasoning about characters.

**Consequence — the v2.8 split is reversed on this point. The migration is REQUIRED, not hygiene.** A forward slash is precisely the exception already identified: `encodeURIComponent` produces `%2F`, uvicorn decodes it back to `/` before Starlette routes, the path gains a segment, and no route matches. **Encoding does not repair this row.** The migration is the only fix for the reported symptom.

**The two failing aspects fail for two different reasons**, which is why the diagnosis was so slippery:

| Aspect | `aspect_code` | Failure | Repaired by |
|---|---|---|---|
| "IT & Data" | `IT/DATA_OP` | Forward slash adds a path segment; survives percent-encoding | **The migration only** |
| "IT\Data" | `IT\DATA_ST` | Backslash rewritten to `/` by the browser's URL parser | **Encoding** |

> **Provisional per §2.2.7.** The decode mechanism above — that uvicorn unquotes `%2F` to `/` before Starlette matches, so encoding cannot rescue this id — is **analysis, not observation**. It is confirmed by testing that specific row after **gate 2**. The remedy does not change if the mechanism is wrong (the row still needs renaming), but the explanation would.

**Scope:** If the hypothesis holds, the fix is to key the route on the aspect identifier. Escaping the name is a patch over the underlying design problem and should not be the chosen fix without discussion.

> **Corrected twice — read the settled position below, not the history.**
>
> **v2.8 said** the migration was hygiene, because percent-encoding transmits a backslash faithfully (`%5C` → uvicorn decodes → `[^/]+` matches → row found), so the encoding fix repairs those rows by itself. That reasoning is sound **and it does not apply to the row that was actually failing.**
>
> **v2.9 (settled):** the reported aspect's id contains a **forward slash** (`HLT-IT/DATA_OP`), the one case v2.8 named as beyond encoding — `%2F` is decoded to `/` before routing and still adds a path segment. **The migration is required. It is the only fix for the reported symptom.** Discovery query 1b in the migration file exists precisely to find rows of this kind, and it will find this one.

**Settled — the permitted set is `^[A-Za-z0-9_]{2,10}$`:** ASCII letters, digits and underscore, 2–10 characters.

**Hyphen is excluded deliberately**, despite being URL-safe. It separates `{MAT}-{CODE}` and marks the `-deleted-<ts>` archive rename, so permitting it inside a code makes both patterns ambiguous to anything that matches on them.

**REQ-010 splits into two halves, per §2.7:**

| Half | Contents | Gate | Fixes |
|---|---|---|---|
| **Validation + encoding** | Call-site `encodeURIComponent`; `aspect_code` validation in Pydantic and Zod. | Bundled — low risk, no schema or permissions change. | `IT\DATA_ST`, and **prevents any further unreachable rows** |
| **Migration** | `docs/migrations/2026-08-26-REQ-010-aspect-code-sanitisation.sql`. | **Alone** — a data migration, so §2.7 bars it from a bundle. | `IT/DATA_OP`, the reported symptom |

**Both halves are required and neither substitutes for the other.** REQ-010 is not "done" in §8 until both gates have passed (§2.7). The migration rewrites primary keys under `fk_mat_standards_aspect` and `fk_assignments_aspect`, both `ON UPDATE NO ACTION`; per §2.4 the SQL and rollback note are written by an agent and applied manually.

**Settled — the minting convention, correcting an earlier assumption in this plan.** `{MAT}-{aspect_code}` is the **current** path, as the backend audit found in `main.py`. UUIDs are the **older** convention. Evidence: both broken rows are `is_custom = 1` in `{MAT}-{CODE}` format, so they were created through the UI on the live path.

**Consequence — the character validation is not defence-in-depth. It is the only control preventing further unreachable rows.** Creating an aspect with a slash in its code today would produce another one. **Treat validation as the priority half of REQ-010, ahead of the migration** — the migration cleans up two rows; the validation stops the third.

**HLT was seeded twice** (confirmed by the product owner). That explains the two id eras in `mat_aspects`, and — importantly — **the split does not track `is_custom`**: some defaults carry UUIDs and others carry `{MAT}-{CODE}`.

> ⚠️ **No code may infer anything from the shape of an id.** Not whether a row is custom, not which era it came from, not whether it is safe to route. The shape is an accident of when the row was seeded. Read the column that actually answers the question — `is_custom`, `source_aspect_id` — and encode every id regardless of how safe it looks.

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

#### REQ-027 — New assessments do not appear until a browser refresh
**Type:** Defect. **Frontend.**

**Problem:** After creating assessments, neither the new assessment nor its term appears in the interface until a full browser refresh — **despite a success toast**. The write succeeded; only the view is stale.

**Why this is worse than a cosmetic staleness bug.** The user is told the operation worked and then shown no evidence of it. The reasonable conclusion is that it silently failed, so **they create the assessments again — and hit a confusing error on top of an apparent success.**

> **Corrected — the duplicate-row risk was theoretical.** An earlier draft of this requirement said the defect "manufactures the data problem it looks like" by producing duplicate rows. **It does not.** `uk_assessment` on `(school_id, mat_standard_id, unique_term_id)` holds (data model §20.3), and a production query returned no duplicates. The constraint rejects the second attempt. **The priority was right and the reasoning was overstated:** the harm is a confusing failure after an apparent success, not corrupted data.

**Scope:** Cache invalidation on creation, for **both** the assessment list and the term list. The term list matters because a newly created assessment may be the first in its term, so the term itself is new to the view.

**Related:** the deferred "expanded-school invalidation edge case for aspect metrics" in §7. **Check whether they share a cause and report.** **Fix only the creation path** — if they turn out to be the same defect, that is a finding for the product owner, not licence to widen this requirement.

**Out of scope:** Any change to the creation endpoint. The backend write is confirmed sound.

---

#### REQ-028 — `delete_aspect` fails with a 500 when inactive standards remain
**Type:** Defect. **Backend, small.**

**Problem:** `delete_aspect` archive-renames a custom aspect's primary key to `{id}-deleted-{ts}`. It guards on **active** standards only — returning `409` when any exist — but `fk_mat_standards_aspect` is **`ON UPDATE NO ACTION`**, not `CASCADE`. An aspect with **zero active and one or more inactive** standards therefore passes the guard, fails the rename on the foreign key, and surfaces as a generic `500` from the catch-all handler.

The user sees an unexplained server error on an operation the interface offered them, in the one case the guard was written to make safe.

**Found during REQ-010**, while establishing why that requirement's migration cannot simply rewrite a primary key.

**Same FK class as REQ-010's migration** — a PK rewrite under a non-cascading foreign key. **Schedule in the same session as that migration, per §2.7:** both concern the same constraint, and whoever loads that context should spend it once.

**Scope:** Make the operation behave predictably when inactive standards reference the aspect. Whether that means widening the guard to count inactive standards, repointing them, or making the FK cascade on update is a design decision for that session — the audit establishes the failure, not the remedy.

**Out of scope:** The `409`-on-active-standards behaviour, which is correct.

---

#### REQ-029 — `aspect_code` is filtered case-sensitively against mixed-case data
**Type:** Defect. **Backend.**

**Problem:** `aspect_code` is stored in **mixed case** in production — lowercase `ab`, `ey`; uppercase `EDU`, `IT` — but two endpoints filter case-sensitively on that column, on the assumption that codes are uppercase:

| Endpoint | Predicate | |
|---|---|---|
| `GET /api/standards` (`main.py:1170`) | `ma.aspect_code = %s` | **case-sensitive** |
| `GET /api/assessments/by-aspect/{aspect_code}` (`main.py:3147`) | `ma.aspect_code = %s` | **case-sensitive** |
| `GET /api/assessments` (`main.py:860`) | `UPPER(ma.aspect_code) = UPPER(%s)` | correct — the model to follow |

**Those aspects return empty rather than erroring, so the failure is silent.** A caller cannot distinguish "this aspect has no standards" from "you sent the wrong case", and no error appears in any log.

**Scope:** Make the comparison case-insensitive on both endpoints, matching `GET /api/assessments`. **Report whether anything else compares that column** — the audit found three call sites, but a fourth in a `JOIN` or a subquery would fail the same way.

**Out of scope:** Normalising the stored data. That is a tenant-data question (see DATA-001), and the endpoints should be case-insensitive regardless of how tidy the column becomes.

---

#### DATA-001 — HLT tenant data cleanup
**Type:** Data. **No code.** Run manually by the product owner.

Three defects in HLT's aspect data, found while investigating REQ-010 and REQ-029. Recorded here so they are not rediscovered; **no SQL has been written or run for any of them.**

| Row | Problem |
|---|---|
| `Mock aspect` | Marked `is_custom = 0`, as though it were a platform default. It is not. |
| `Attendance & Behaviour` | **Exists twice**, under codes `ab` and `anb`. |
| `Curriculum and Teaching` | **Trailing space** in `aspect_name`. |

**Do not write or run SQL for this under any requirement.** It is tenant data, the correct resolution for the duplicate is a product decision (which row survives, and what happens to anything referencing the other), and none of it is urgent.

**Interacts with REQ-029:** the lowercase `ab` code is one of the rows that filters silently to empty today.

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

**Scope — tests. Minimal `pytest` coverage is in scope for this requirement, limited to permission enforcement:** that the external tier is **blocked at endpoint level on every write route**. This is not a general test suite and must not grow into one — the claim being tested is the one the requirement stands or falls on, and it is the claim a UI demo cannot prove.

Note the starting position: **`assurly-backend/test_phase2_auth.py` is the only test file in the repository** (four tests, all auth primitives — JWT creation, MAT-wide access, response formatting, magic-link generation). Nothing covers authorisation. **There is no infrastructure to extend**, so REQ-013 carries the cost of establishing it as well as the cost of the tests themselves. Budget accordingly.

**Where enforcement will be proved or disproved (from SEC-001):** `DELETE /api/standards/{mat_standard_id}`, `DELETE /api/aspects/{mat_aspect_id}` and `DELETE /api/assessments/{assessment_id}/actions/{action_id}` are currently guarded by **authentication alone, with no role check** — any authenticated user in the MAT may call them. Those are precisely the routes the external tier must not reach. Note the corollary: until this requirement lands, **read-only access cannot be granted to anyone**, because there is no tier that has it.

**Out of scope:** Subdividing the internal tier. Per-school scoping of external users — they see the whole MAT. A general-purpose test suite.

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

**Gate:** **M2 and M3 complete.** M2 settles **who** may upload; M3 settles **whether upload to a closed term is permitted**. Both must exist before the evidence endpoints can enforce them — building the endpoints first would mean writing the permission and lifecycle checks twice, or shipping them unenforced.

(REQ-006's retirement removed the previous gate. This replaces it; the earlier "Q1 answered" clause is not restored.)

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

**Settled limits:** **single-file upload limit 25 MB. No count limit.** The per-file ceiling matches contract §28 and is a technical constraint on the upload path, not a product cap; the absence of a count limit is the deliberate §5 position for the early adopter phase. **Do not reintroduce a count cap.**

**Upload is built inside FastAPI.** The project runs **exactly one Cloud Run service, and it is the backend**; the frontend is on Vercel. There is no Cloud Function and no second service. The upload endpoint therefore lives in `main.py` alongside every other route — this is settled, not an open architectural question.

> ⚠️ **Stale note to correct, not in this session.** `assurly-backend/.env.example` carries a note against `GCS_EVIDENCE_BUCKET` claiming the variable "is referenced in deployment infra but the backend Python code does not currently read it directly — upload + signed-URL handling is external". **That refers to code replaced on 4 June 2026 and is stale.** It should be corrected, but doing so is out of scope here. Flagged so nobody reads it as an argument for building upload outside the service.

**Link evidence is anticipated by the schema but out of scope.** The table carries `evidence_type` (`'file'` | `'url'`) and a `url` column, with a CHECK constraint enforcing mutual exclusion, and contract §29 specifies `POST /evidence/link`. **Do not design it out** — building only the file path in a way that makes links awkward to add later would waste the schema work already done.

**Out of scope:** Evidence versioning, approval, tagging, content extraction.

> **Previously open, now closed.** An earlier draft of this requirement asked where the upload path was intended to live, on the strength of the `.env.example` note quoted above. **That question is settled: inside FastAPI.** The note is stale, not evidence.

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

> ⚠️ **`evidence_count` is not a signal — it is a constant.** `GET /api/dashboard/schools` returns `evidence_count` for every school, and it has been **structurally zero since it shipped**, because it counts rows in `standard_evidence` — a table **no deployed code can write to** (the evidence API has never existed; see REQ-017 and DOC-003). Any analytics treating it as a measure of evidence-gathering behaviour is reading a constant and will produce a chart of zeroes or a correlation with nothing.
>
> **It becomes meaningful only after REQ-017 ships**, and only for data created from that point on — there is no historical evidence corpus to backfill from. Any M7 work that wants evidence as a dimension must either gate on REQ-017 or exclude it.

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

- **`users-service.ts:55` interpolates `user_id` into the URL path unencoded** → triage. The one remaining unencoded path interpolation in the codebase after REQ-010 encoded all ten sites in `assessment-service.ts`. Flagged during REQ-010 and deliberately not fixed: different file, different endpoint family, and `user_id` values are digits or `user<hex>`, so there is no evidence of a live problem. It is latent rather than broken.
- **API contract Known Issue #12 is understated** → triage. It records that `GET /api/standards/{mat_standard_id}` omits `standard_type` from the response dict; it **also omits it from the versions array**, despite the versions query selecting it (`main.py:1235`). Found during DOC-003. **The contract was deliberately not amended** — recorded here for the product owner to schedule, most naturally alongside REQ-011, which is already in the same endpoint family.
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
| REQ-008 | M1 | Frontend merged (`8390ecd`) — **pending gate 1**. No backend change required | — | ☑ | ☐ |
| REQ-009 | M1 | Frontend merged (`9a6bda1`) — **pending gate 1**. Backend `MAX(due_date)` aggregate still outstanding | ☐ | ☑ | ☐ |
| REQ-010 | M1 | Validation+encoding merged, **pending gate 1**; migration **required and unrun**, pending gate 2. Not complete until both | ☑ | ☑ | ☐ |
| REQ-011 | M1 | Merged both halves (`b701b31`, backend `updated_at`) — **pending gate 1**. Reorder-write scope item was vacuous; see dev log | ☑ | ☑ | ☑ |
| REQ-012 | M1 | Merged — **pending gate 1** (OpenAPI-spec confirmation needs a deploy) | ☑ | — | ☑ |
| REQ-027 | M1 | Frontend merged (`43a92f7`) — live UAT **pending gate 1** | — | ☑ | ☐ |
| REQ-028 | M1 | Ready — schedule with the REQ-010 migration | ☐ | — | ☐ |
| REQ-029 | M1 | Ready — backend only | ☐ | — | ☐ |
| DATA-001 | M1 | Ready — **product owner runs manually**, no code | — | — | ☐ |
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
| 2.9 | 27 August 2026 | **REQ-010's `IT & Data` case is settled, and both hypotheses recorded in v2.8 were wrong.** Production shows `aspect_code = 'IT/DATA_OP'` — **the failing character is a forward slash in the identifier, not the ampersand in the display name**, which is why two sessions diagnosed the wrong character: users report by display name. This is the exception v2.8 itself identified, so **the v2.8 split is reversed on this point — the migration is REQUIRED, not hygiene, and is the only fix for the reported symptom.** `IT\DATA_ST` remains the encoding case, so the two failing aspects fail for two different reasons. The decode mechanism is marked provisional per §2.2.7, to be confirmed against that row after gate 2. **The minting convention is recorded as settled**, correcting an earlier assumption here: `{MAT}-{aspect_code}` is the current path and UUIDs are older, evidenced by both broken rows being `is_custom = 1` in `{MAT}-{CODE}` form. **Consequence: the character validation is not defence-in-depth but the only control preventing further unreachable rows, and is therefore the priority half of REQ-010, ahead of the migration.** HLT was seeded twice, which explains two id eras in `mat_aspects` where **the split does not track `is_custom`** — so **no code may infer anything from the shape of an id.** **§2.4** gains a standing constraint on identifier fields: constrained character set, backend-authoritative with the frontend mirroring only the message, display fields explicitly exempt, and encoding at every interpolation site. **REQ-029 added** to M1 (backend): `aspect_code` is stored mixed-case but `GET /api/standards` and `GET /api/assessments/by-aspect` filter case-sensitively, so those aspects return empty rather than erroring — a silent failure. **DATA-001 added** to M1 (no code, product owner runs it): HLT's `Mock aspect` is wrongly `is_custom = 0`, `Attendance & Behaviour` exists twice under `ab` and `anb`, and `Curriculum and Teaching` has a trailing space. **§2.7** makes explicit that a requirement split across gates is not complete in §8 until every gate containing it has passed. **§2.6** records that no artefact asserts a version — it exists only in dev log prose — and that a single source of truth is needed before 2.0. **§2.5** requires dev log entries for plan-edit sessions and starts the `Deployed:` field from this session. |
| 2.8 | 26 August 2026 | Applied after the first implementation session; two of the corrections withdraw claims this plan itself made. **New §2.7 Test gates:** work merges continuously to `sprint-2.0` and deploys at gates, not per commit; a gate bundles low-risk changes into one test pass, but anything touching schema, a data migration, or authentication or permissions deploys and is tested **alone**; the product owner runs the gate and declares the result, and **agents do not declare a gate passed**. **§2.6** clarified that a version bump records a **merge, not a deployment**, and the dev log template gains a **`Deployed:`** field so merged-with-an-unapplied-migration and running-in-production stop being indistinguishable; 1.43.1 and 1.43.2 stand. **REQ-027 harm corrected:** the duplicate-row risk was theoretical — `uk_assessment` holds and a production query returned no duplicates, so a second attempt is rejected by the constraint and the real harm is a confusing error after an apparent success. The priority was right; the reasoning was overstated. **REQ-010 migration premise corrected:** rows minted with unescaped characters do **not** stay broken without the migration — percent-encoding transmits the character faithfully and the encoding fix repairs them by itself, the sole exception being an id containing a literal `/`. REQ-010 is therefore **split** per §2.7 into a deployable half (encoding, validation) and a schedulable half (the migration), and is not done in §8 until both gates pass. The permitted set is recorded as settled at `^[A-Za-z0-9_]{2,10}$`, with the reason hyphen is excluded. The **`IT & Data`** case records its two surviving hypotheses — `is_active = 0`, or a renamed default aspect whose code is still `IT` — with external confirmation favouring the second and the settling query pending. **REQ-028 added** to M1 (backend, small): `delete_aspect` guards on active standards only but `fk_mat_standards_aspect` is `ON UPDATE NO ACTION`, so an aspect with only inactive standards fails the archive-rename and surfaces a generic 500; schedule with the REQ-010 migration as the same FK class. **Outstanding recorded in §8:** REQ-012's OpenAPI-spec confirmation and REQ-027's live UAT both need a deploy and are pending gate 1. **§7** records `users-service.ts:55` as the one remaining unencoded path interpolation, latent rather than broken. **§8 also reconciled against frontend work merged while these edits were being written** — REQ-008, REQ-009, REQ-011 and REQ-027 all have their frontend halves merged. Those rows reflect the frontend agent's own dev log entries, not a review of the code by the backend agent. **REQ-011's backend half is now blocking:** the card fallback has been removed, so every standard renders `Updated —` until `GET /api/standards` exposes `updated_at`. |
| 2.7 | 26 August 2026 | **§2.2** gains point 7: provisional claims are labelled where the reader meets them, not only in an Assumptions section at the foot — added after an AUD-001 finding that flagged its own assumption in a footer and was then acted on as fact. **M4 gate set to "M2 and M3 complete"** in §4 and §6: M2 settles who may upload, M3 settles whether upload to a closed term is permitted, and the endpoints cannot enforce either before they exist. The removed "Q1 answered" clause is not restored. **REQ-017** records the settled limits (single file 25 MB, no count limit) and that **upload is built inside FastAPI** — the project runs exactly one Cloud Run service, which is the backend, with the frontend on Vercel; the previously open "where does upload live" question is closed, and the `.env.example` note calling upload handling "external" is flagged as stale (referring to code replaced 4 June 2026) for correction elsewhere. **REQ-007**: the manual test is complete — 180 of 180 assessments persisted their due date, so the 1,921 nulls are non-use and the create path is sound; the defect is confirmed as the by-aspect transform. Frontend scope gains the date selector modal being unclickable and keyboard-only. **REQ-027 added** to M1 (frontend): created assessments and their terms do not appear until a browser refresh despite a success toast, leading users to create duplicates; scope is cache invalidation on creation for the assessment and term lists, with the related deferred aspect-metrics invalidation edge case to be checked and reported but not fixed. **REQ-013** gains minimal `pytest` coverage in scope, limited to proving the external tier is blocked at endpoint level on every write route, with a note that no test infrastructure exists to extend, and records from SEC-001 that the standards, aspects and action-item DELETE routes are guarded by authentication alone. **M7** records that dashboard `evidence_count` has been structurally zero since it shipped and becomes meaningful only after REQ-017. **§7** records that API contract Known Issue #12 is understated — `standard_type` is missing from the versions array as well as the response dict — as a triage item; the contract was deliberately not amended. |
| 2.6 | 26 August 2026 | Applied after four production SQL queries and the live OpenAPI spec were checked; several earlier audit conclusions are corrected as fact, not opinion. **Terms:** the AUD-001 "vacation gap" finding is **withdrawn** — terms abut (T1 1 Sep–31 Dec, T2 1 Jan–1 Apr, T3 2 Apr–31 Aug) and `is_current` is true for exactly one row at any time. Settled rules recorded on REQ-015: terms sort newest to oldest, and the reporting term is the current calendar term regardless of open/closed state. Dated risk recorded for **1 September 2026**, when `is_current` flips to a term with no rows while the dashboard keeps reporting the last term with rows — resolved by an empty state and a term switcher, never a fallback. **REQ-006 retired** into REQ-017 and removed from M1 in §4, §6 and §8; it was retired, not completed, and M1 now closes without a working evidence feature by acceptance. M4's gate and §4.1's defect count updated in consequence. **REQ-017 rewritten** as a full rebuild of both layers, no longer a data-model change: `standard_evidence` is already keyed per standard/school/term so no migration is needed, the GCS bucket is known via `GCS_EVIDENCE_BUCKET`, recovery of the lost implementation is abandoned, and link evidence stays anticipated-but-out-of-scope. **SEC-001 added** to M1 — the super-admin guard on the destructive admin endpoints is real but invisible to the OpenAPI spec and the contract; scope is to verify, document and report, and to record `SUPER_ADMIN_EMAILS` as the mechanism REQ-013 must extend. **DOC-003 added** to M1 — correct the three documents asserting the evidence endpoints are live, document `standard_evidence` in the data model, and re-verify the `🚧 In-flight` tags removed across v1.5–v1.8. **REQ-007**: the "unwired mock" description struck (`due_date` is null on all 1,921 rows but the create path does send it); effective due date settled as `COALESCE(a.due_date, t.end_date)` with no migration; overdue must suppress on closed terms (M3); one manual test recorded as a precondition. **REQ-008**: the `localStorage` filter-restore defect folded in as the same root cause. **REQ-009**: `MAX(due_date)` recorded as the wrong aggregate, with the note that REQ-007 will mask rather than fix it. **REQ-010**: primary-key migration recorded as required, and `IT & Data` recorded as still unexplained. **REQ-011**: "Updated" defined as a material edit, excluding reordering. **REQ-012**: `/api/standards/inactive` folded in as the identical route-shadowing bug. |
| 2.5 | 25 August 2026 | Post-AUD-001 corrections. §4 M1 row now lists AUD-001, DOC-001 and DOC-002 alongside REQ-006 → REQ-012, resolving the disagreement with §6 and §8. DOC-002 scope extended to `README.md`, whose documentation tree is stale in the same way. REQ-015: closing a term now explicitly bars creation against that term as well as editing, and back-dated creation against a past *open* term is recorded as intended behaviour, not a defect. REQ-015 also carries a new design input — the two conflicting "current term" derivations collapse into "most recent open term" here, and both are deleted. REQ-006 problem statement corrected: the regression hypothesis is withdrawn, the cause is that the upload client was never merged, and the fix is a port from `claude/review-backend-brief-mjtms` — **which is not on `origin` and must be pushed before REQ-006 opens**. REQ-007 problem statement corrected: the mock-modal description is withdrawn; the create path sends `due_date`, the backend persists and returns it, and the by-aspect transform discards it on read. No version 2.4 exists in this repository — 2.3 goes straight to 2.5; see the DOC-001 and AUD-001 dev log entries. |
| 2.3 | 25 August 2026 | Development log and versioning conventions added (§2.5, §2.6). DOC-001 and DOC-002 added to M1 following contract discrepancies found during onboarding. `PROJECT_STRUCTURE.md` demoted from authoritative to descriptive pending refresh, and documentation filenames standardised to lowercase hyphenated form. |
| 2.2 | 25 August 2026 | Applicability model settled: per school, per term, carried forward, non-retrospective, frozen at term close. AUD-001 added to M1 to establish whether a term and date model exists before M3 and M5 are scoped. Denominator-change visibility written into REQ-018, REQ-019 and REQ-023. No open questions remain. |
| 2.1 | 25 August 2026 | Remaining decisions closed: evidence limits waived for the early adopter phase; closed terms superadmin-only; navigation shell promoted ahead of analytics. Milestones renumbered — navigation shell is M6, analytics M7, Actions and Interventions M8. Term date scheduling gap recorded against REQ-015. One open assumption remains on applicability retrospection. |
| 2.0 | 24 August 2026 | Decisions applied. Role model settled and promoted to M2 as a prerequisite. Lifecycle model set to editable-until-term-close. Three defects added to M1. Navigation shell, Actions and Interventions consolidated into M7. Within-trust benchmarking restored to scope. Renumbered throughout. |
| 1.0 | 23 August 2026 | Initial plan. Six milestones, fifteen requirements, ten decisions outstanding. |