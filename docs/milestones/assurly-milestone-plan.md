# Assurly — Milestone Plan

**Suggested path:** `docs/milestones/assurly-milestone-plan.md`
**Version:** 2.3
**Date:** 25 August 2026
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
| **M1** | Stabilise — live defects | REQ-006 → REQ-012 | None. Starts immediately. |
| **M2** | Role model | REQ-013 | None |
| **M3** | Assessment lifecycle | REQ-014 → REQ-016 | M2 complete |
| **M4** | Evidence model | REQ-017 | REQ-006 closed |
| **M5** | Applicability | REQ-018 | None |
| **M6** | Navigation shell | REQ-024 | M2 complete |
| **M7** | Analytics and trends | REQ-019 → REQ-023 | **M3, M5 and M6 complete** |
| **M8** | Actions and Interventions | REQ-025 → REQ-026 | M2 complete |

### 4.1 Sequencing rationale

- **M1 first.** Seven live defects, most of them cheap, all of them visible to the early adopter during the exact period they are being asked to trust the platform.
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

**Definition of done:** All seven requirements verified in production; AUD-001 reported; DOC-001 and DOC-002 complete; regression notes in the changelog; API contract updated wherever a response shape changed.

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

---

---

#### REQ-006 — Evidence upload not firing
**Type:** Defect

**Problem:** Files attached as evidence do not appear after navigating away and back; the interface continues to report no files attached. This previously worked. **There is no log of a failed POST — the request does not appear to be reaching the backend at all**, which points at the frontend rather than the API or GCS.

**Audit sequence:**
1. Frontend first. Is the upload request constructed and dispatched at all? Check the network layer, not the component state.
2. If a request is dispatched, is it rejected before reaching application logging (CORS, payload size, auth)?
3. Only if both are clean, look at the backend write path and GCS.

**Regression question worth answering:** this worked previously, so identify what changed. A recent frontend refactor is the most likely candidate.

**Out of scope:** Any change to the evidence data model. That is M4. This requirement makes the existing model behave as documented.

---

#### REQ-007 — Request a Rating: due date
**Type:** Incomplete build, not a defect

**Problem:** The due date selector is a mock modal. Nothing is persisted because nothing was ever wired up.

**Scope — backend:**
- Confirm whether the schema can store a due date on the rating request at all. If the column does not exist, produce the migration.
- Accept, validate and persist the due date; return it on read.
- UK timezone handling is a known sensitivity in this codebase — confirm the stored value round-trips correctly.

**Scope — frontend:**
- Replace the mock modal with a working date selector bound to the real payload.
- Surface the due date to the recipient of the request, not only to the sender.

---

#### REQ-008 — Aspect filter on the Ratings page
**Type:** Defect

**Problem:** Filtering by aspect returns everything for every school. **All other filters work, individually and in conjunction — the aspect filter alone is broken.** The request does not appear in the network tab.

**Audit note:** Establish first whether this filter is supposed to trigger a backend query or filter client-side. That determines whether the fix is a missing request or broken client-side predicate logic. The contract is the reference for which parameters the ratings endpoint accepts.

**Out of scope:** New filter dimensions.

---

#### REQ-009 — Status filter operates at the wrong level
**Type:** Defect

**Problem:** The status filter resolves at school level rather than aspect level. Where a single school has a mixture of completed, not started and overdue aspects, filtering by status does not isolate the aspects in that status — the school is treated as having one status.

**Scope:** Status filtering must resolve per aspect within a school, and a school with a mixed set must appear correctly under each applicable status.

**Related:** REQ-008. Both are filter defects on the same surface and may share an audit session, but they are separate fixes with separate causes.

---

#### REQ-010 — Aspect rename returns 404 for certain names
**Type:** Defect

**Problem:** Renaming an aspect fails with `404 Not Found` for aspects whose current name contains special characters. Reproducible on `IT & Data` and `IT\Data`; every other aspect renames cleanly.

**Observed payload:**
```json
{"aspect_name": "IT\\DATA2", "aspect_description": "", "aspect_category": "strategic", "sort_order": 0}
```

**Leading hypothesis, to be confirmed not assumed:** the rename route identifies the aspect by **name rather than by ID**, so a name containing `&`, `\` or `/` breaks path resolution or URL encoding. A 404 on an aspect that demonstrably exists is characteristic of a routing failure rather than a missing record.

**Scope:** If the hypothesis holds, the fix is to key the route on the aspect identifier. Escaping the name is a patch over the underlying design problem and should not be the chosen fix without discussion.

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

---

#### REQ-012 — Inactive aspects view returns 404
**Type:** Defect

**Problem:** The inactive aspects feature errors with a 404 despite previously deleted aspects existing in the tenant.

**Audit note:** Determine whether deletion is soft or hard. If aspects are hard-deleted, the inactive view has nothing to return and the defect is conceptual rather than a routing bug — report that finding rather than fabricating a fix. This interacts with REQ-016, which introduces deletion of assessments; the two should share a consistent deletion model.

---

### M2 — Role model

#### REQ-013 — Three-tier role model
**Type:** Feature

**Problem:** There is currently no way to give Trustees and Governors visibility of the platform without also giving them the ability to change data. This also blocks opening the platform up for wider testing.

**Scope — backend:**
- Implement the superadmin / internal / external tiers described in Section 3.
- External tier: read access to everything within the MAT, including commentary and evidence; **write blocked at endpoint level**. Hiding controls in the UI is not sufficient and will not be accepted as the implementation.
- Superadmin tier scoped across tenants for the platform team.
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
- Closing a term freezes all assessments within it against internal-tier writes.
- Both actions audited.

**Scope — frontend:**
- Superadmin control for closing and reopening a term, with a confirmation step naming the term and the number of assessments affected.
- Clear indication to all users when a term is closed and why editing is unavailable.

**After close:** edit, delete and clear are superadmin-only.

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

**Gate:** REQ-006 closed; Q1 answered.

---

#### REQ-017 — Evidence at standard level
**Type:** Feature (data model change)

**Problem:** Evidence attaches at aspect level with a ceiling of three files for the entire aspect. Users gather evidence per standard and have several pieces for each.

**On the cap:** the three-file limit is real and is what users named, but it is the symptom rather than the constraint — the binding problem is the attachment level. Both are being addressed: evidence moves to standard level **and the count limit is removed entirely** for the early adopter phase. See Section 5.

**Scope — backend:**
- Move the evidence association from aspect level to standard level.
- Migration for existing evidence records, with rollback note. **Note:** if REQ-006 shows uploads have been failing silently for some time, the corpus to migrate may be small or empty, which makes this straightforward. Establish the actual record count before designing the migration.
- Contract update: evidence counts and collections return per standard, with aspect-level counts derived.

**Scope — frontend:**
- Upload control and file list against each standard.
- Evidence indicators at both standard and aspect level.

**Out of scope:** Evidence versioning, approval, tagging, content extraction.

---

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
| AUD-001 | M1 | Ready — discovery only | ☐ | — | ☐ |
| DOC-001 | M1 | Complete | ☑ | — | ☑ |
| DOC-002 | M1 | Held to M1 close | ☐ | — | ☐ |
| REQ-006 | M1 | Ready | ☐ | ☐ | ☐ |
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
| REQ-017 | M4 | Gated on REQ-006 | ☐ | ☐ | ☐ |
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
| 2.3 | 25 August 2026 | Development log and versioning conventions added (§2.5, §2.6). DOC-001 and DOC-002 added to M1 following contract discrepancies found during onboarding. `PROJECT_STRUCTURE.md` demoted from authoritative to descriptive pending refresh, and documentation filenames standardised to lowercase hyphenated form. |
| 2.2 | 25 August 2026 | Applicability model settled: per school, per term, carried forward, non-retrospective, frozen at term close. AUD-001 added to M1 to establish whether a term and date model exists before M3 and M5 are scoped. Denominator-change visibility written into REQ-018, REQ-019 and REQ-023. No open questions remain. |
| 2.1 | 25 August 2026 | Remaining decisions closed: evidence limits waived for the early adopter phase; closed terms superadmin-only; navigation shell promoted ahead of analytics. Milestones renumbered — navigation shell is M6, analytics M7, Actions and Interventions M8. Term date scheduling gap recorded against REQ-015. One open assumption remains on applicability retrospection. |
| 2.0 | 24 August 2026 | Decisions applied. Role model settled and promoted to M2 as a prerequisite. Lifecycle model set to editable-until-term-close. Three defects added to M1. Navigation shell, Actions and Interventions consolidated into M7. Within-trust benchmarking restored to scope. Renumbered throughout. |
| 1.0 | 23 August 2026 | Initial plan. Six milestones, fifteen requirements, ten decisions outstanding. |