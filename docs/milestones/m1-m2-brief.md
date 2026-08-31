# Assurly — M1 / M2 working extract

**This is an EXTRACT of `docs/milestones/assurly-milestone-plan.md`, not a summary and not a source of truth.**
Where the two disagree, **the plan wins.** Nothing here is paraphrased: every requirement and rule below is
carried verbatim from the plan, and compression is by **omission only**, marked where it occurs.

| | |
|---|---|
| **Extracted from plan version** | **2.27** (plan header dates itself 30 August 2026 — see Extraction notes) |
| **Current API contract version** | **v2.14**, `docs/api/assurly-api-contract.md` |
| **Extract produced** | 31 August 2026 |
| **Branch** | `sprint-2.0` |

**What is here:** the rules an agent operates under, the milestone shape, everything **open in M1**, everything
in **M2**, and the status table as it stands.

> ### ⚠️ Three M1 requirements below were merged AFTER plan v2.27 was written. Read Extraction note 8 first.
>
> **REQ-007's frontend half, REQ-049 and REQ-050 all have code on `sprint-2.0`** as of 31 August 2026. **The
> plan has not yet been updated**, so their blocks below — and §8 — still describe them as open. That is
> faithful to v2.27 and stale against the branch.

**What is deliberately NOT here:** closed M1 requirements, superseded findings, the changelog, and M3–M8.
**An orchestration session needs what is open and the rules it operates under, not the record of what has
already been settled.** For any of that, read the plan.

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
---

## 2. Agent operating protocol — the sections that bind a session

*Extract carries §2.2, §2.4, §2.6 and §2.7 in full. §2.1, §2.3 and §2.5 are omitted.*

### 2.2 Session workflow

> **Rules 7, 8 and 9 are one rule: check the premise of the question before investigating the answer.**
>
> Each was added after a misdiagnosis, and each is a **worked example** of that general form rather than an independent rule — a claim asserted without checking what it rested on (7), an identifier reasoned about without being read (8), a result judged correct or incorrect without establishing whose it was (9). **Read them as illustrations of one habit, not as three boxes to tick.**
>
> **No tenth is being added, deliberately.** Rules have been accruing faster than the defects they catch, and **a list long enough to skim is a list that stops being read.** If a fourth instance appears, it belongs in a dev log as evidence that this preamble is not landing — not here as rule 10.
>
> ---
>
> ### The same failure occurs on the way in, and it is not a rule for agents.
>
> **Four briefs have now stated a mechanism that did not survive contact with the code.** In every case **the symptom was accurate** and the mechanism inferred from it was not:
>
> | Brief said | The code said |
> |---|---|
> | **REQ-028** — deletion is unreachable from the UI | It was reachable, and the exposed path was the broken one |
> | **REQ-036** — the deletion flow needs building | It already existed for custom aspects; only defaults were missing |
> | **REQ-030** — a third route shadowing | Not a shadowing at all — a missing route, with a parameterised sibling absorbing the path |
> | **REQ-047** — the display reads the wrong column | The display was correct; a join was missing |
>
> **This is rules 7–9's failure mode arriving one step earlier.** Those describe how an agent investigates; this is about how the work is framed before anyone investigates. **A brief that asserts a mechanism scopes the session to the wrong work before it starts** — and the agent's own diligence cannot recover it, because the brief has already told them what they are fixing.
>
> **So it belongs here rather than as rule 10, and it is addressed to whoever writes the brief:**
>
> 1. **State the symptom and the evidence.** Both were right every time.
> 2. **Mark any proposed mechanism as a hypothesis to be tested, not a diagnosis to be implemented.** A named suspect is useful; a named suspect stated as fact is not.
> 3. **Scope the first task as establishing the cause.**
>
> **The cost is asymmetric and that is the argument.** Checking a premise took four greps on REQ-047 and was written into the requirement before anyone was scoped to it. Not checking one cost REQ-030 a wrong claim carried across fourteen plan versions and into a test specification in another milestone.

1. **Audit before fix.** Every requirement opens with a diagnostic pass: current behaviour, affected files, affected tables, blast radius. The agent reports and **stops**. No fixes during the audit pass.
2. **Decide before code.** Direction is confirmed and any open questions in Section 5 are resolved before implementation begins.
3. **Implement narrowly.** Only what the brief specifies. Out-of-scope boundaries are stated per requirement.
4. **Flag, don't fix.** Adjacent issues found mid-task go into a `Findings` section at the end of the session. They are never acted on without instruction.
5. **Document with code.** No change is complete until the API contract, data model bible and changelog reflect it. Docs ship in the same commit as the code.
6. **Reflect.** Close each session with: what changed, what was deliberately not changed, what the next session needs to know, and any assumptions made.
7. **Label provisional claims where the reader meets them.** A finding resting on an unverified assumption is marked provisional **at the point of the claim**, not only in the Assumptions section at the foot of the document. A reader who acts on the headline may never reach the footer.
8. **Establish what an identifier actually contains before reasoning about a failure involving it.** Users report defects by the label they can see; the system routes on a value they cannot. Those are different strings, and reasoning about the reported one is the failure mode. Two sessions diagnosed the wrong character in REQ-010 because the display name was `IT & Data` while `aspect_code` — the value that actually becomes the id and the path segment — was `IT/DATA_OP`. Read the identifier itself: the column, the path segment, the key. Do not form a hypothesis about a string you have not looked at.
9. **In a multi-tenant system, establish which tenant a result belongs to before reasoning about whether the result is correct.** **An answer that is right for a different tenant is indistinguishable from a wrong answer.** Every authenticated endpoint here scopes on `mat_id` derived from the JWT, so "the endpoint returned the wrong thing" and "you asked as the wrong user" produce identical evidence. Ask which tenant the token is scoped to **first** — before the query, before the code, before the hypothesis.

---

### 2.4 Standing constraints

- British English throughout code, comments, UI copy and documentation.
- DB migrations are written and applied manually. Agents produce the migration SQL and a rollback note; they do not run it.
- **Agents have no database access and never will.** They produce SQL for the product owner to run, and interpret the results they are given; they do not execute queries, migrations or diagnostics against any database. **A diagnostic that requires database access is written as a statement to hand over, not as a task to attempt.** Scoping one as a task produces a session that discovers its own inability and reports it, which is the whole of what it can do.
- Rating polarity is settled and must not be reinterpreted: **rating 4 is always the best outcome**, labels carry polarity, numbers are uniform.
- "Requires Attention" flags **rating 1 only**.
- Fixed terminology: "Risk Profile" (never "Risk Register"); performance bands are Strong / Healthy / Needs Improvement / Critical; aspect categories are `operational` and `strategic`.
- No terminology, threshold or polarity change without explicit sign-off from the Product Owner.
- **Identifier fields are constrained; display fields are not.** Any user-supplied value that becomes part of an identifier, a primary key, or a URL path segment is constrained to a documented character set, **validated at the backend as the authoritative control** and mirrored at the frontend for the error message only. **Frontend validation is never the control:** the API is reachable directly, and the two layers drift.

  This applies to the value that *becomes* the identifier, not to display fields. Names, descriptions and commentary carry no such restriction — they are displayed, never routed. Confusing the two produces both unreachable rows and needlessly restricted user input.

  Where a value is already an identifier, **encode it at every interpolation site** rather than relying on it being safe. REQ-010 is the reference implementation for both halves.

---

### 2.6 Versioning

Current release 1.43. This programme is Sprint 2.0.

> ### The version number is set by hand. Nothing computes it and nothing checks it.
>
> **No artefact in this system asserts a version.** Not the repository, not a tag, not the application, not a config file, not a package manifest. **The number exists only where a person writes it** — in this plan, and in dev log prose written after the fact.
>
> It follows that **the numbers below are a convention the product owner applies, not a rule the system enforces.** Nothing derives a version from the commits, nothing validates that a recorded bump matches what shipped, and no build fails if a bump is skipped, duplicated or wrong. **An agent recording a bump in a dev log is making a note, not performing a release.**
>
> Read the rest of this section as bookkeeping, and treat a version in a dev log as a claim by its author rather than as a fact about a build.

**The convention, as practised:**

- **A requirement merges:** patch bump — 1.43.1, 1.43.2 and so on.
- **A milestone closes:** minor bump.
- **The sprint closes:** 2.0, declared by the product owner, **never by an agent**.

**The target ladder.** One minor bump per milestone close, M1 through M8, arriving at 2.0 when M8 closes:

| Milestone closes | Version |
|---|---|
| M1 — Stabilise | 1.44 |
| M2 — Role model | 1.45 |
| M3 — Assessment lifecycle | 1.46 |
| M4 — Evidence model | 1.47 |
| M5 — Applicability | 1.48 |
| M6 — Navigation shell | 1.49 |
| M7 — Analytics and trends | 1.50 |
| **M8 — Actions and Interventions** | **2.0** |

**M8's close is the sprint close, so it takes 2.0 rather than the 1.51 the arithmetic would give.** That is the intent of the ladder, not an off-by-one — the last rung is a major bump because the sprint ends there, and the seven before it are minors. **If the intent was 1.51 followed by a separately declared 2.0, this table is what needs correcting, not the practice.**

**Patch numbers do not reset or reconcile against this ladder.** They accumulate under the current minor (1.43.1 … 1.43.n) and are simply superseded when the milestone closes. **No attempt is made to make the patch count mean anything** — it is not a count of requirements, since not every requirement merges as one commit and not every merge is a requirement.

Record every bump in the dev log entry that caused it.

**A version bump records a merge, not a deployment.** The two are separate events in this programme — work merges continuously to `sprint-2.0` and deploys at test gates (§2.7) — and a requirement can sit merged for some time before it runs anywhere. Merged-with-an-unapplied-migration and running-in-production are different states, and the log must be able to tell them apart, so the dev log template carries a **`Deployed:`** field: *yes* plus the date, or *no*.

1.43.1 (REQ-012) and 1.43.2 (REQ-010) stand as recorded — both are merges, and neither claimed to be more.

> **Open, and not scheduled: the in-app version history has no source to read.** It is the one consumer that needs the version as data rather than as prose, and prose is all there is. **This is recorded as a want, not a requirement** — nothing is blocked on it today, and it is deliberately not in M1.

#### Precedent — a re-sent instruction is diffed, not re-applied

**Recorded because it was handled correctly and the handling should repeat, not because anything went wrong.**

The v2.19 brief was re-sent with **one of its five items changed**. Two things followed from that, and both are now the convention:

1. **The four unchanged items were diffed against the already-applied version before anything was touched**, and were not re-applied. Re-applying them would have duplicated two requirement blocks. **A re-sent instruction is a diff against what is recorded, not a fresh instruction.**
2. **The plan bumped to v2.20 rather than rewriting v2.19 in place.** v2.19 was pushed and its changelog row stated the superseded position. **Rewriting a published version to say something it never said would falsify the record** — the same principle already applied to the retracted contract v1.8 entry and the struck-through `%2F` note. **Supersede; do not overwrite.** The superseding row says explicitly what differed, so nobody reading both concludes the work was done twice.

---

### 2.7 Test gates

**Work merges continuously to `sprint-2.0`. Deployment happens at defined test gates, not per commit.**

A gate bundles low-risk changes into a single test pass, so that a handful of small fixes are exercised together rather than each one buying a separate deploy-and-verify cycle.

**What must deploy alone, and be tested alone:**

- anything involving a **schema change** or a **data migration**;
- anything changing **authentication or permissions**.

These do not join a bundle. The reasoning is that their failure modes are not additive — a permissions regression or a bad migration is hard to attribute when three other changes shipped in the same pass, and both are expensive to reverse.

**The product owner runs the gate and declares the result. Agents do not declare a gate passed.** An agent may report that its own work is code complete, that its checks pass, and what a gate would need to exercise; it may not conclude from that that the gate has been met.

**Each gate's checklist is derived from the requirements it contains** — the per-requirement verification notes are the raw material, not a separate document.

#### Gate 3 — aspects work on `mat_aspects`

Recorded here rather than under a single requirement because it spans three (**REQ-010**'s migration, **REQ-012**'s remaining endpoint, **REQ-028**) and the **ordering between them matters**.

**Task 1 — DIAGNOSTIC, before any migration runs.**

Three hypotheses for `GET /api/aspects/inactive` returning `[]` have now been disproved, and **the branch handler cannot produce `200` with an empty array**: it re-raises exceptions as `500` rather than swallowing them, it performs no post-fetch filtering between `fetchall()` and `return`, and no fourth route shadowing exists (`/inactive` at L2154 precedes the only parameterised `GET` at L2198). **The deployed behaviour is therefore not explicable by the branch code.**

Run the **complete** handler query — the `LEFT JOIN aspects`, the computed `is_modified`, and the `standards_count` correlated subquery, **not the `WHERE` clause alone** — with `%s` bound to the JWT's `mat_id`, against the database the deployed service connects to.

**If it returns the row, the fault is environmental and no amount of reading `main.py` will find it.**

> **Do not read more code before running it.** Three rounds of reading have produced three disproved hypotheses. The remaining difference is between the code and its execution, and only execution will show it.

**Task 2 — REQ-028.** The REQ-010 migration is **retired** (see REQ-010) and no longer forms part of this gate.

> ### ⚠️ Correction to v2.13 — the failed manual `UPDATE` was NOT an autocommit failure.
>
> v2.13 recorded that a manual `UPDATE` against `mat_aspects` in Cloud SQL Studio reported success without persisting, and attributed it to autocommit being disabled. **That attribution was wrong.**
>
> **MySQL stores a backslash as an escaped pair.** A `WHERE` clause written as `aspect_code = 'IT\DATA_ST'` therefore matches **zero rows** — and an `UPDATE` matching zero rows **succeeds**. It reported success because it did exactly what it was asked to do, against nothing. The update was later applied by matching on `aspect_name` instead.
>
> **The general rule: any statement matching on a value containing a backslash must account for escape doubling.** Write `'IT\\DATA_ST'`, or match on a column that does not contain the character, or use a `LIKE` with an explicit `ESCAPE` clause. This applies to `DELETE` and `SELECT` verification queries as much as to `UPDATE` — a verification query with the same flaw will cheerfully confirm a change that never happened.
>
> **Keep the post-commit re-query requirement.** Verifying effect rather than trusting a statement result is correct regardless of cause, and this episode is a better argument for it than autocommit was: the statement genuinely succeeded, so no error handling anywhere would have caught it. **Only re-reading the data catches a zero-row match.**
>
> **Recording the actual cause matters.** Attributing it to autocommit would send the next person to check connection settings, which are fine, while the real hazard — escape doubling in a `WHERE` clause — sat in the statement they were about to run.

---

**A requirement split across gates is not complete in §8 until every gate containing it has passed.** This is explicit and not a matter of judgement: a requirement with a deployable half and a schedulable half (see REQ-010) belongs to **two** gates, and passing the first does not close it. Half-shipped is not shipped.

---

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

---

## 4. Milestones

| ID | Milestone | Requirements | Gate |
|---|---|---|---|
| **M1** | Stabilise — live defects | **REQ-042 (first)**, AUD-001, DATA-001, DOC-001 → DOC-003, SEC-001, REQ-007 → REQ-012, REQ-027 → REQ-031, REQ-033, REQ-038, REQ-041, REQ-043, REQ-047, REQ-049, REQ-050 | None. Starts immediately. |
| **M2** | Role model, plus the additions displaced from M1 | REQ-013, REQ-032, REQ-034 → REQ-037, REQ-039, REQ-040, REQ-044 → REQ-046, REQ-048 | None |
| **M3** | Assessment lifecycle | REQ-014 → REQ-016 | M2 complete |
| **M4** | Evidence model | REQ-017 | **M2 and M3 complete** |
| **M5** | Applicability | REQ-018 | None |
| **M6** | Navigation shell | REQ-024 | M2 complete |
| **M7** | Analytics and trends | REQ-019 → REQ-023 | **M3, M5 and M6 complete** |
| **M8** | Actions and Interventions | REQ-025 → REQ-026 | M2 complete |

### 4.1 Sequencing rationale

- **M1 first, and M1 is only things that are broken.** All of them visible to the early adopter during the exact period they are being asked to trust the platform.

  **REQ-042 comes first within M1.** A session that expires silently mid-task, with no message and an indefinite spinner, ends the work the platform exists for — and does so at the one-hour mark, the length of a serious rating session. Every other M1 item degrades a screen; that one stops the user.

  **Scope closure, v2.15.** M1 is a **stabilisation** milestone and had accumulated feature work. Five additions — REQ-032, REQ-034, REQ-035, REQ-036, REQ-037 — **moved to M2**. They keep their ids; only the milestone changed, and nothing was renumbered.

  **The reasoning:** M1 exists to make the platform trustworthy for the early adopter's return. **Feature work displaces that** — it competes for the same sessions, and a milestone that ships an Expand All control alongside an unfixed 500 has misread its own purpose. A stabilisation milestone that grows features stops being one.

  What stays is what is broken: REQ-007, REQ-009's backend half, REQ-028, REQ-029, REQ-030, REQ-033, REQ-038, the `/api/aspects/inactive` defect, DATA-001 and DOC-002.
- **M2 second.** The role model is now load-bearing: the lifecycle rules in M3, the actions permissions in M7 and the read-only requirement all reference the three tiers. Building any of them before the tiers exist means encoding permissions twice.
- **M5 before M7.** Aggregate scores are currently distorted by standards that do not apply to a given school. Comparative analytics built on that denominator will need rebuilding. Fix the denominator first.
- **M3 before M7.** A historical series that cannot be corrected is not worth visualising.
- **M6 before M7.** The navigation shell is a container, and M7 introduces five new views. Shipping the shell first means those views land in their final home rather than being retrofitted into it afterwards.
- **M7 splits.** M7a (backend analytics API) ships and is verified before M7b (frontend) opens. This is the largest milestone in the programme and should not run as a single brief.

---

---

## 6. Requirements — M1, open only

*Carried in full. Closed M1 requirements are omitted entirely: AUD-001, DOC-001, DOC-003, SEC-001, REQ-006 (retired), REQ-008 → REQ-012, REQ-027, REQ-029 → REQ-031, REQ-033, REQ-038, REQ-041, REQ-043, REQ-047. **REQ-042 is neither closed nor open — see the Extraction notes.***

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

> ### The frontend half lives in the same function as REQ-050. **Ship them in one session.**
>
> `transformAssessmentByAspectToAssessment` hardcodes **`due_date: null`** (this requirement) and ends **`|| new Date().toISOString()`** (REQ-050) — **two fabrications, twelve lines apart, in one function.** The backend now computes a real effective due date via `COALESCE(a.due_date, t.end_date)` on every read path, and **this line throws it away.**
>
> Splitting them across sessions means reading the same function twice and risking the second session reverting the first's understanding of it. **One session, two commits.**

> ### ⚠️ `due_date` and overdue use different aggregates, deliberately — and it will be reported as a bug.
>
> Contract §21: the group's **`due_date` is the LATEST** effective date across its standards — when everything must be done. **Overdue keys on the EARLIEST outstanding one** — when the group first fell behind.
>
> **So a group can read `overdue` while showing a future `due_date`.** That is correct and it looks wrong. Using `due_date` for the overdue test was the previous behaviour and is exactly the defect REQ-009 fixed: it flagged a group only once its **last** standard was past due.
>
> **Recorded here so it is not "fixed" back.** A client showing both should say what each means; the alternative — making `due_date` the earliest — loses the "when is everything due" answer, which is the question the field was added to answer.

> **Manual test complete — the question is settled, and the create path is sound.** 180 assessments were created with a due date and **all 180 persisted**. The 1,921 pre-existing nulls are **non-use, not a silent drop**. The scope does not grow: the defect is confirmed as `transformAssessmentByAspectToAssessment` nulling `due_date` on read.

**Also in frontend scope — the date selector modal is not clickable.** It can currently be operated only by keyboard tabbing. Likely a `pointer-events` or overlay stacking defect. **Fix alongside the display work** — a due date the user cannot set with a mouse is not meaningfully different from one that is discarded on read, and shipping the read fix alone would leave the feature still unusable for most users.

**M3 rule to record now:** **overdue must suppress once a term is closed.** A closed term cannot be actioned, so continuing to flag its assessments as overdue is noise about work nobody is permitted to do.

---

---

#### REQ-028 — `delete_aspect` fails with a 500 when inactive standards remain
**Type:** Defect. **Backend, small.**

**Problem:** `delete_aspect` archive-renames a custom aspect's primary key to `{id}-deleted-{ts}`. It guards on **active** standards only — returning `409` when any exist — but `fk_mat_standards_aspect` is **`ON UPDATE NO ACTION`**, not `CASCADE`. An aspect with **zero active and one or more inactive** standards therefore passes the guard, fails the rename on the foreign key, and surfaces as a generic `500` from the catch-all handler.

The user sees an unexplained server error on an operation the interface offered them, in the one case the guard was written to make safe.

**Found during REQ-010**, while establishing why that requirement's migration cannot simply rewrite a primary key.

**Same FK class as REQ-010's migration** — a PK rewrite under a non-cascading foreign key. **Schedule in the same session as that migration, per §2.7:** both concern the same constraint, and whoever loads that context should spend it once.

> ### Normal M1 priority. The v2.11 reduction is reversed — its premise was wrong.
>
> v2.11 lowered this on the basis that no UI exposes aspect deletion, making the 500 reachable only by direct call. **`StandardsManagement.tsx:408-419` renders a Delete Aspect menu item, gated on `currentAspect.is_custom`.** Deletion is exposed — for **custom** aspects.
>
> **The exposed path is the broken one and the safe path is hidden.** `delete_aspect` archive-renames the primary key for customs (`main.py:2397-2404`) and merely sets `is_active = 0` for defaults. The PK rewrite is what collides with `fk_mat_standards_aspect` (`ON UPDATE NO ACTION`). So the only deletion a user can actually perform is the one that can fail — and the branch that cannot fail is the one hidden behind the `is_custom` gate.
>
> **A custom aspect with zero active and one or more inactive standards produces a 500 from the UI today, with no useful message.** The user is told nothing beyond a generic server error, on an operation the interface offered them.
>
> **Restored to normal M1 priority.** It still ships with the REQ-010 migration in the same session per §2.7, since both turn on the same foreign key.

**Scope:** Make the operation behave predictably when inactive standards reference the aspect. Whether that means widening the guard to count inactive standards, repointing them, or making the FK cascade on update is a design decision for that session — the audit establishes the failure, not the remedy.

**Out of scope:** The `409`-on-active-standards behaviour, which is correct.

---

---

#### REQ-049 — Lowercase `aspect_code` falls out of the category mapping
**Type:** Defect. **Frontend.**

**Problem:** The console logs `Unknown category` for lowercase `aspect_code` values — `ld`, and by extension `ab`, `ey`, `mck`. **The same invariant the backend assumed before REQ-029 corrected it in six places:** that `aspect_code` is uppercase. It is not, and there is no canonical casing.

> ### ⚠️ The premise was checked against the code, and it does not hold as stated. **Read this before scoping.**
>
> **1. The warning does not come from `aspectCodeToCategory`.** It comes from **`getCategoryIcon` (`Assessments.tsx:458`)**, a `switch` over *display* category names whose `default` warns and returns a generic `ClipboardCheck` icon. **That path is cosmetic by construction** — it always returns an icon.
>
> **2. `aspectCodeToCategory` does not return `undefined`.** `data-transformers.ts:39` reads `return (map[aspectCode] || aspectCode.toLowerCase())`. An unmapped code falls through to its own lowercased form. **So `assessment.category` is never undefined, and the chain "undefined category → REQ-008's filter breaks" does not follow.**
>
> **3. For `ld`, `ab`, `ey` and `mck`, filtering should work — and the reason is worth understanding, because it is also the reason the real defect is invisible.** The filter's option values are built by **the same function** (`Assessments.tsx:267`, `SchoolPerformanceView.tsx:531`). Both sides miss the map and both lowercase, so both produce the same string.
>
> **4. There IS a real filter defect, and it is a different one.** The two sides get the code from **different endpoints with different casing**: `GET /api/assessments` returns **`UPPER(ma.aspect_code)`** (`main.py:938`), while `GET /api/aspects` returns the code **as stored**. That is harmless for an unmapped code — both lowercase to the same value — but **breaks whenever a stored lowercase code lowercases into a map key**:
>
> | Side | Input | Result |
> |---|---|---|
> | Assessment (uppercased by the API) | `EDU` | `map['EDU']` → **`education`** |
> | Filter (stored casing) | `edu` | miss → **`edu`** |
>
> **`education !== edu`, so that aspect is silently unfilterable** — which would present exactly like the defect REQ-008 closed.

**The question that decides priority is a production one, and agents cannot answer it (§2.4).** Hand this over:

```sql
-- Does any aspect carry a code that lowercases into a mapping key?
SELECT mat_id, aspect_code, aspect_name FROM mat_aspects
WHERE LOWER(aspect_code) IN ('edu','hr','fin','est','gov','it','is')
  AND aspect_code <> UPPER(aspect_code);
```

- **No rows → cosmetic.** A console warning and a generic icon for `ld`, `ab`, `ey`, `mck`. Normal M1 priority, small.
- **Any rows → M1-blocking.** Those aspects cannot be filtered on the Ratings page, silently.

**Still run the Leadership test the brief asks for** — but note the prediction, so the result means something either way: **`ld` is not a map key, so filtering by Leadership should work.** If it does not, this analysis is wrong somewhere and that is the more valuable finding. **A test whose outcome nobody predicted cannot discriminate** — the lesson from REQ-010's gate 2.

**Scope, once the answer is in:** uppercase the key before the lookup — `map[aspectCode.toUpperCase()]` — so the mapped branch is reached regardless of stored casing, and both sides agree in every case. **That is the same fix REQ-029 applied on the backend**, and it closes the icon warning as a side effect rather than as its own patch.

> **This is the aspects family again.** Five of the last seven defects have originated in `aspect_code`'s missing casing invariant. **REQ-040 (M2) exists for exactly this**, and this instance is frontend rather than backend — worth recording there that the invariant leaks past the API.

---

---

#### REQ-050 — `|| new Date()` fabricates a timestamp in three places
**Type:** Defect. **Frontend.** **Absorbs REQ-031.**

**Problem:** **`use-assessments.ts:112` ends `|| new Date().toISOString()`**, so an aspect whose standards carry no `last_updated` reports **the current time**. It reads as data and is not. **Live in production.**

**This is the third instance of one defect**, and the reason it is one requirement rather than three:

| Site | State |
|---|---|
| `SortableStandardCard.tsx` | Fixed under REQ-011 |
| `VersionHistoryModal.tsx:77` | Open — was REQ-031, folded in here |
| `use-assessments.ts:112` | Open — **found during REQ-047**, on a surface neither requirement named |

**Fixing them one file at a time has already failed once.** REQ-011 fixed the first and named the second; REQ-031 was raised for the second and never picked up; the third was found by accident while reading the same function for something else. **They should not be found a fourth time separately.**

**Scope:**
- **Show an em dash when the value is absent**, at all remaining sites. This is REQ-047's convention and the same reasoning: **a plausible value is worse than a visible gap**, because nothing reports it.
- **Search for the pattern rather than fixing the two named files.** `|| new Date`, `?? new Date`, `new Date()` as a default in a display path. Three instances is evidence the file list is not the scope.

**Note the aspect-level case specifically.** `use-assessments.ts` derives `lastUpdatedFromStandards` and then falls back — so an aspect with **no edited standards at all** reports now. That is precisely the population REQ-047 established is the majority: as of April 2026, 1142 of 1198 assessments had never been edited.

**Related to REQ-048 (M2)**, which audits fallback chains generally. This one is already established and does not wait on it.

---

---

#### DATA-001 — HLT tenant data cleanup
**Type:** Data. **No code.** Run manually by the product owner.

Three defects in HLT's aspect data, found while investigating REQ-010 and REQ-029. Recorded here so they are not rediscovered; **no SQL has been written or run for any of them.**

| Row | Problem |
|---|---|
| `Mock aspect` | Marked `is_custom = 0`, as though it were a platform default. It is not. |
| `Attendance & Behaviour` | **Exists twice**, under codes `ab` and `anb`. |
| `Curriculum and Teaching` | **Trailing space** in `aspect_name`. |
| `Mock aspect` | **`source_aspect_id` is an empty string, not NULL.** An anomalous foreign-key value — the column is `char(36) NULL` referencing `aspects.aspect_id`, where NULL means "no source" and `''` means "a source whose id is the empty string". |

> **The empty-string `source_aspect_id` is the concrete instance of the two-definitions problem**, not merely untidy data. The computed `is_custom` used by `GET /api/aspects/{id}` and `PUT /api/aspects/{id}` tests `source_aspect_id IS NULL` — and `''` is **not** NULL, so those two endpoints classify this row as a **default**. The stored column happens to agree at `0`, so the disagreement is currently invisible; it stops being invisible the moment either value is corrected without the other. **Fix both together or neither.**

**Do not write or run SQL for this under any requirement.** It is tenant data, the correct resolution for the duplicate is a product decision (which row survives, and what happens to anything referencing the other), and none of it is urgent.

**Interacts with REQ-029:** the lowercase `ab` code is one of the rows that filters silently to empty today.

---

---

#### DOC-002 — Refresh the project structure document
**Type:** Housekeeping. **Runs at M1 close, not at M1 open.**

Regenerate `project-structure.md` against the repository as it stands once M1 has shipped. Doing it beforehand means doing it twice, since M1 will move files.

Until it lands, the repository itself is the reference for file layout.

**Also in scope: `README.md`.** Its documentation tree is stale in the same way — it lists `docs/api/` files that now live in `docs/archive/`, and a `docs/fixes/` directory that does not exist. Refresh it in the same pass.

---

---

---

## 6. Requirements — M2, condensed

*Problem statement and scope carried verbatim. Historical notes and superseded findings omitted, each elision marked. Where a block could not be shortened without changing its meaning it is carried in full.*

### M2 — Role model

#### REQ-013 — Three-tier role model
**Type:** Feature

**Problem:** There is currently no way to give Trustees and Governors visibility of the platform without also giving them the ability to change data. This also blocks opening the platform up for wider testing.

**Scope — backend:**
- Implement the superadmin / internal / external tiers described in Section 3.
- External tier: read access to everything within the MAT, including commentary and evidence; **write blocked at endpoint level**. Hiding controls in the UI is not sufficient and will not be accepted as the implementation.
- Superadmin tier scoped across tenants for the platform team. **`SUPER_ADMIN_EMAILS` is the existing super-admin mechanism** — an environment allow-list checked by `verify_super_admin` (`main.py:556`). **Extend it; do not introduce a parallel one.** Note `.env.example` states plainly that no DB-level super-admin role exists, so this allow-list is currently the whole of it, and REQ-013 is where that either becomes a real role or is deliberately kept as configuration. See SEC-001.
- Audit the three user-CRUD endpoints currently missing `verify_mat_admin` as part of this work — the role model is the right moment to close that gap.
- **Fix the deactivation hole. A deactivated user cannot currently be logged out.** `get_current_user` (`main.py:536`) wraps its whole body in a bare `except Exception`, which **catches the `401 "User not found or inactive"` it raises at `:529` and re-raises it as a `500`.** The frontend then **deliberately retains the token on a `500`** (`auth-service.ts:141-149`, "let the user stay logged in — the API might just be unavailable"), which is correct behaviour for the error it is actually being told about. **So deactivating a user produces a 500 loop and a working session that runs until natural expiry.** This is a permissions defect, not an error-handling one: the tier model is only as real as the ability to remove someone from it. Found during REQ-042's diagnosis.

**Scope — frontend:**
- Write affordances suppressed throughout for the external tier.
- User management flow for inviting and assigning the external role.
- **Role-determined default landing view.** Central team members land on **Overview**; school-based members, **including Headteachers**, land on **Assessments**. **Both views remain reachable by everyone — only the default differs.** This is a role-model concern and belongs with the tier work, not with the views themselves: putting it in either view's requirement would scatter the role logic across surfaces, which is the duplication §4.1 gives as the reason M2 precedes M3.

**Scope — tests. Minimal `pytest` coverage is in scope for this requirement**, limited to two assertions:

1. **Permission enforcement** — that the external tier is **blocked at endpoint level on every write route**. This is the claim the requirement stands or falls on, and the one a UI demo cannot prove.
2. **Route ordering** — that **every literal path precedes a parameterised sibling _sharing its HTTP method_**. A short test over the registered route table, and it catches a defect class this codebase **demonstrably produces**: **two** instances in `main.py`, both `GET`-on-`GET` — the `/inactive` routes REQ-012 fixed.


> *[Extract: history / superseded findings omitted here. See the plan.]*


This is not a general test suite and must not grow into one.

**These are now two independent arguments for building the test infrastructure in M2**, which matters because the infrastructure is the expensive part. The first is that the external tier's write-blocking is otherwise unprovable. The second is that same-method route shadowing is silent — it produces a `404` that looks like a missing endpoint — and has already cost this programme two defects and a session of diagnosis.

Note the starting position: **`assurly-backend/test_phase2_auth.py` is the only test file in the repository** (four tests, all auth primitives — JWT creation, MAT-wide access, response formatting, magic-link generation). Nothing covers authorisation. **There is no infrastructure to extend**, so REQ-013 carries the cost of establishing it as well as the cost of the tests themselves. Budget accordingly.

**Where enforcement will be proved or disproved (from SEC-001):** `DELETE /api/standards/{mat_standard_id}`, `DELETE /api/aspects/{mat_aspect_id}` and `DELETE /api/assessments/{assessment_id}/actions/{action_id}` are currently guarded by **authentication alone, with no role check** — any authenticated user in the MAT may call them. Those are precisely the routes the external tier must not reach. Note the corollary: until this requirement lands, **read-only access cannot be granted to anyone**, because there is no tier that has it.

**Out of scope:** Subdividing the internal tier. Per-school scoping of external users — they see the whole MAT. A general-purpose test suite.

---

> ### Moved from M1 at v2.15 — M1 scope closure.
> The five requirements below are **additions, not defects**. They were raised during M1 and kept their ids; only their milestone changed. See §4.1 for the reasoning.

---

#### REQ-040 — Audit `mat_aspects` and its endpoints against the table's actual invariants
**Type:** Audit. **Backend.** **M2, not M1** — this is investigation, and M1 was closed to scope growth deliberately at v2.15.

**Why:** **Five defects have now originated in the aspects family, and at least three share one shape: an endpoint assuming an invariant the data never had.** Fixing them one at a time has cost more than the fixes were worth, and the next one is already implied by the ones found.

**Known instances — the starting list, not the scope:**

| Invariant assumed | What the data actually holds |
|---|---|
| `aspect_code` is uppercase | Mixed case — `ab`, `ey`, `mck` alongside `EDU`, `IT`, `FIN` (REQ-029) |
| `is_custom` has one definition | **Stored column** in four handlers, **computed from `source_aspect_id`** in two (DATA-001) |
| `mat_aspect_id` has one format | Two, across seeding eras — UUID and `{MAT}-{CODE}` (REQ-010) |
| `source_aspect_id` is NULL or a valid FK | **Empty string** on at least one row (DATA-001) |

**Scope:**
- **Enumerate the invariants each endpoint assumes** — not the invariants the schema declares. The gap between those two is where every one of these defects has lived.
- **Test each against production data.**
- **Report the gaps.**
- **Produce SQL for the product owner to run** (§2.4 — agents have no database access).

**Do not fix anything in the audit pass.** §2.2.1 applies: report and stop. Remedies are scoped afterwards, once the full list is known — fixing as you go is what produced five separate defects out of one root problem.

**Out of scope:** `mat_standards`, which may have the same disease but is a separate table and a separate pass. Note the finding either way if it becomes obvious.

> **The invariant leaks past the API — record this in the audit.** REQ-049 (M1) is the same missing casing invariant **on the frontend**: `aspectCodeToCategory` keys an uppercase-only map, while `GET /api/assessments` uppercases `aspect_code` and `GET /api/aspects` does not. **So an endpoint that "normalises" casing on one route and not another pushes the problem outward rather than containing it.** Whatever this audit settles about canonical casing has to reach the clients, not just the queries.

---

---

#### REQ-044 — Audit every mutation path against the caches it invalidates
**Type:** Audit. **Frontend.** **M2, not M1** — investigation, and M1 stays closed to scope growth (v2.15).

**Why:** **REQ-027 and REQ-043 are one defect that surfaced twice**, separated only by which cache each flow happened to touch. Both were found the same way: **a person performing an ordinary action and noticing the screen disagreed with what they had just done.**

**Do not wait for a third instance.** The v2.20 note said to scope this if the pattern held a third time; that condition is withdrawn, and the reason is in the shape of the defect rather than in impatience:

> **A mutation path with no second cache to invalidate produces no visible symptom at all.** REQ-027 and REQ-043 were reported because each had a *second* surface that visibly disagreed with the first. A path whose single cache is stale simply shows old data that looks like current data. **The absence of further reports is therefore not evidence that the remaining paths are correct** — it is consistent with them being silently wrong, and a third report would come from the same accident as the first two, not from anything systematic.

**Check the REQ-043 dev log first.** The frontend agent was asked to report on this surface while in the code and may already have surveyed part of it. **Do not repeat work that was done** — start from what that entry establishes and extend it. If the entry does not exist or does not cover the surface, say so and proceed.

**Scope:**
- **Enumerate every mutation path** — create, update, delete, reorder, submit, deactivate, reinstate, across assessments, standards, aspects, terms and users.
- **For each, list the caches and derived views its result appears in**, and whether the path invalidates every one of them. The gap between "what the mutation changes" and "what the mutation invalidates" is where both known defects lived.
- **Include `await` correctness**, not only invalidation: REQ-043's fix needed both, and REQ-041 failed partly on an un-awaited save. **An invalidation that is not awaited before the refetch is indistinguishable from a missing one.**
- **Report the gaps, ranked by whether the path has a visible symptom** — the silent ones matter more, since nothing else will surface them.

**Do not fix anything in the audit pass.** §2.2.1 applies: **report and stop.** Same shape as REQ-040 on `mat_aspects`, and for the same reason — fixing as you go is what turns one root problem into a series of defects.

---

---

#### REQ-048 — Audit display fallback chains
**Type:** Audit. **Frontend.** **M2.**

**Why:** **A long fallback chain converts missing data into wrong data.** It never renders a gap, so a field the API does not return produces a **plausible but incorrect value** instead of an obvious absence — and a plausible value is not reported, because nothing looks broken.

**The known instance is REQ-047**, and it shows the shape exactly. `AssessmentDetail.tsx` reads `updated_by_name`, falling through `submitted_by_name`, then `assigned_to_name`, then the newest standard's assignee, then an em dash. **`updated_by_name` is never returned by any endpoint** — so the chain silently resolved to the assignee, and "Updated by" named the wrong person **on every assessment, for as long as the field has existed**, while looking entirely normal.

> **Note what the chain cost beyond the wrong name: it hid the missing field.** A gap would have been reported the first week. Four rungs of fallback turned an API defect into a display that nobody could tell was wrong from the outside.

**Scope:**
- **Enumerate display fallback chains across the frontend** — `||` chains, `??` chains, and the multi-branch IIFEs used in `AssessmentDetail.tsx`.
- **For each, identify what the chain is falling back *from*, and whether that value is actually supplied by the API.** The dangerous case is a first rung that never arrives.
- **Report where a missing value silently becomes a *different* value**, as distinct from where it becomes an em dash or an empty state. **Only the first is a defect** — a fallback to a genuine absence is correct and should not be flagged.
- Note where the fallback is defensible (a real alternative meaning) versus where it is a guess.

**Report and stop; produce no fixes.** Same shape and same reasoning as REQ-040 and REQ-044 — the remedies differ per site and are scoped once the list exists.

**Related to REQ-047**, which is one instance and is being fixed on its own in M1. **This does not wait on it.**

---

---

#### REQ-046 — No multi-statement write in `main.py` is transactional
**Type:** Defect. **Backend.** **M2.**

**`DB_CONFIG` sets `autocommit: True` (`main.py:231`).** Under autocommit every statement commits as it executes, so **`connection.commit()` is redundant and `connection.rollback()` rolls back nothing.** `main.py` contains **18 `commit()` calls, 9 `rollback()` calls, and no `begin()`** outside the reorder endpoint REQ-030 added.

**So every `except` block that calls `rollback()` is doing nothing, and every multi-statement handler is a sequence of independent commits.**

**The dangerous case, and the one that shows what this costs:** `update_standard` writes **`standard_versions`**, then **`mat_standards`**, then **`standard_edit_log`**, in that order. A failure on the third leaves the first two committed — **a new version, live and pointed at, whose edit was never logged.** The version history and the edit log disagree, and nothing detects it.

**Scope:**
- **Enumerate every multi-statement write path** in `main.py` — not every handler that calls `commit()`, but every one where two or more statements must succeed or fail together.
- **Make each transactional via an explicit `connection.begin()`.** pymysql issues a literal `BEGIN`, which opens a transaction regardless of the autocommit setting. `POST /api/standards/reorder` is the worked example.
- **Report the full list before changing anything.** §2.2.1: report and stop. This touches the write path of most of the API, and the list is the deliverable of the first pass.

**Do not simply set `autocommit: False`.** That would make every handler transactional at once, including single-statement ones that currently rely on the implicit commit — and any path that returns without committing would silently start discarding its write. **The failure mode of getting this wrong is data loss, not an error.**

> **M3 dependency — REQ-046 should land before or with REQ-014.** REQ-014 introduces an **audit trail for assessment amendments**, and an audit trail is worthless if the writes producing it are not atomic: the record of a change and the change itself can diverge exactly as `standard_versions` and `standard_edit_log` can today. **Building the trail first would mean building it on the defect.**

**Found during REQ-030**, which needed a real transaction and could not get one from the file's existing pattern.

---

---

#### REQ-045 — Harden the magic-link path
**Type:** Defect. **Backend.** **M2.**

Two faults on the login path, found during REQ-042's diagnosis. Neither is urgent today; **both get worse the moment re-authentication becomes routine**, and that endpoint sends email.

**1. Magic-link tokens are stored in plaintext.** `users.magic_link_token` holds the raw token, and `verify_magic_link` (`main.py:723`) matches on it directly. **`generate_token_hash()` exists at `auth_utils.py:164` for exactly this purpose and is never called** — its own docstring says "even with database access, tokens can't be used directly", which is the property the platform does not have. Anyone with read access to `users` can sign in as any user inside the 15-minute window.

**Scope:** store the SHA-256 hash, match on the hash, keep the raw token only in the emailed URL. **Note the migration consideration:** tokens in flight at deploy would stop verifying. They live 15 minutes, so a quiet-window deploy costs at most one re-request — **decide that deliberately rather than discovering it.**

**2. No rate limiting on `POST /api/auth/request-magic-link`.** `MAGIC_LINK_RATE_LIMIT_PER_EMAIL` and `MAGIC_LINK_RATE_LIMIT_WINDOW_HOURS` are defined at `auth_config.py:45-46` under a comment reading "for future implementation" and **nothing reads them.** The endpoint sends an email per call with no throttle, which is a mail-reputation and nuisance exposure before it is a security one.

**Scope:** enforce the constants that already exist. **Do not invent a new policy** — 3 per email per hour is the recorded intent.

**Why M2 and not M1:** neither is a live defect anyone has hit, and M1 is closed to scope growth (v2.15). **But both sit on the path REQ-042 just made busier**, so they should not drift past M2.

---

---

#### REQ-039 — Nothing shows which MAT the displayed data belongs to
**Type:** Defect. **Frontend and backend.** Belongs with REQ-013.

**Problem:** **Neither the application nor the API response indicates which MAT the displayed data belongs to.** Every authenticated endpoint scopes on `mat_id` from the JWT, so every screen and every payload is tenant-specific — and none of them says which tenant.


> *[Extract: history / superseded findings omitted here. See the plan.]*

**Scope — frontend:** a **persistent tenant indicator, visible on every screen.** Not a settings page, not a tooltip — always in view, because the failure mode is not knowing you needed to check.

**Scope — backend:** **report** whether collection endpoints should carry the `mat_id` they are scoped to, rather than leaving it inferable only from individual rows. Note the asymmetry that made this possible: `GET /api/aspects` returns `mat_id` on each row, so the information *was* present and still went unread, whereas an empty collection carries no rows and therefore no tenant at all — which is precisely the case that misled. **Report before implementing;** a top-level `mat_id` on collection responses is a contract change across many endpoints.

**Belongs with REQ-013's role model work**, since superadmin is what makes it acute — and since whoever builds cross-tenant access should build the thing that shows which tenant you are in at the same time.

---

---

#### REQ-032 — Assessments view silently truncates to 10 aspects
**Type:** Defect. **Frontend.**

**Problem:** The Assessments view displays at most **10 aspects**, with **no pagination, no scroll and no total**. Nothing indicates that anything has been withheld, so users reasonably believe they are seeing everything.

**Silent truncation of a list is worse than an error.** An error is noticed and worked around; a short list that looks complete is acted on. A MAT with more than ten aspects is currently making decisions from a partial view without knowing it.


> *[Extract: history / superseded findings omitted here. See the plan.]*


**Scope:**
- Page size selector offering **10, 25 and 50**.
- Navigation controls.
- Scrolling above 10.
- **A result counter stating the range shown and the total** — this is the part that fixes the silence, and it should ship even if the rest is staged.

---

---

#### REQ-034 — No Expand All on the Overview view
**Type:** Enhancement. **Frontend, small.**

**Scope:** Add an **Expand All** control to the Overview view that expands every school group at once. A collapse-all counterpart is the obvious companion but is not required.

---

---

#### REQ-035 — Show who made the last update
**Type:** Feature. **Backend, then frontend.**

**Problem:** Standards show *when* they were last updated (REQ-011) but not *by whom*. The two questions are usually asked together.

> **Not the same work as REQ-047 (M1), despite the same words.** REQ-047 is **assessments**, where `updated_by` already exists, is already written on every update, and only lacks a name join. **This is standards**, where the column does not exist at all. **REQ-047 is a join; this is a migration.** Whatever display convention REQ-047 settles for the NULL case should be reused here rather than re-decided.

> ### Answered. **Pending a decision, not pending investigation.**
>
> `mat_standards` records **`created_by_user_id`** but has **no `updated_by` column** (data model §11). **A schema change is required** — that is settled, not open. Per §2.4 the migration is written by an agent and applied manually; per §2.7 it deploys and is tested alone.
>
> **The open question is narrower than it was:** whether to copy the existing pattern, not whether a migration is needed. `assessments.updated_by` already exists as `char(36)` with FK `fk_assessments_updated_by` (`ON UPDATE CASCADE`, `ON DELETE SET NULL`), populated on UPDATE and NULL on initial INSERT. **Mirroring it on `mat_standards` is the proposal.** The inconsistency between the two tables is itself the reason this costs a migration.
>
> **Do not open this with another audit.** The investigation is done; what is needed is a yes or no on the pattern.

**Also note:** historical rows will have no value, exactly as `assessments.updated_by` does for rows predating its addition. The interface needs a defined treatment for "unknown" that is **not** a fabricated name — the REQ-011 lesson applies directly.

**Contract:** §13 exposes no such field. It will need one, alongside `updated_at`.

---

---

#### REQ-036 — Expose deletion for DEFAULT aspects
**Type:** Enhancement. **Frontend.** **Lowest priority in M2 — place last.** Moved from M1 at v2.15.


> *[Extract: history / superseded findings omitted here. See the plan.]*

**Position, established against the code.** Deletion is **already fully wired for custom aspects** — the menu item at `StandardsManagement.tsx:408-419`, the shared `DeleteConfirmationModal`, the handler, the toasts. `DELETE /api/aspects/{mat_aspect_id}` handles both kinds, deactivating defaults (`is_active = 0`, reinstatable) and archive-renaming customs (permanent).

| Aspect type | Deletion exposed? |
|---|---|
| **Custom** | **Yes** — complete and working |
| **Default** | **No** — the menu item is not rendered |

**So this is exposure, not construction. And it is a product decision first.**

> **Do not implement. Surface the decision.** Hiding deletion for platform defaults may well be deliberate: a default is a template the MAT adopted, and deactivating it is a different act from deleting something the MAT authored. **Establish the intent before any code is written.** If the answer is "deliberate", this requirement closes with a note rather than a change.

**Scope, only if the decision is to expose it:** render the control for default aspects, matching the standards pattern — and **not** showing the not-recoverable warning, which applies to customs only. Defaults are reinstatable, so warning otherwise would be false.

**Depends on REQ-037.** Exposing deactivation for defaults without an inactive-aspects view would deactivate rows the user then cannot see or reinstate.

---

---

#### REQ-037 — Build the inactive aspects view
**Type:** Defect. **Frontend.**

**Problem:** **The application promises a capability it does not have.** On deactivating an aspect, `use-standards-persistence.ts:328` tells the user: *"Aspect has been deactivated. You can reinstate it later from the inactive aspects section."*

**That section was never built.** `InactiveStandardsModal.tsx` exists for standards; there is **no equivalent for aspects** anywhere in `components/admin/standards/`.

**Scope:** Build the inactive aspects view, **modelled on `InactiveStandardsModal`** — same shape, same placement, calling `GET /api/aspects/inactive` and offering reinstatement via `POST /api/aspects/{mat_aspect_id}/reinstate`. Both endpoints already exist.


> *[Extract: history / superseded findings omitted here. See the plan.]*

**Note the current failure is silent, not loud.** The toast fires only for reinstatable aspects, which are defaults, which cannot presently be deleted from the UI at all (REQ-036) — so today the promise is unreachable rather than broken. **It becomes a visible lie the moment REQ-036 exposes deletion for defaults**, which is why REQ-036 depends on this and not the other way round.

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
| REQ-007 | M1 | **Backend merged** (effective due date on all three read paths), contract v2.12 — pending gate. **Frontend half ships with REQ-050**, same function | ☐ | ☐ | ☐ |
| REQ-008 | M1 | **Gate 1 PASSED** in production | — | ☑ | ☑ |
| REQ-009 | M1 | Frontend **gate 1 PASSED**. **Backend merged** — `overdue` added, aggregate corrected, `?status=` 500 fixed. Pending gate | ☐ | ☑ | ☐ |
| REQ-010 | M1 | **CLOSED at gate 2.** Migration **retired** — see the standing caveats. Original cause remains unexplained | ☑ | ☑ | ☑ |
| REQ-011 | M1 | **Gate 1 PASSED**, both halves | ☑ | ☑ | ☑ |
| REQ-012 | M1 | **CLOSED.** Verified in production as an HLT user — one row, `Mock aspect` | ☑ | — | ☑ |
| REQ-027 | M1 | **CLOSED — gate 4 confirms no regression.** The newly reported failure is a different, untested flow — see REQ-043 | — | ☑ | ☑ |
| REQ-028 | M1 | Ready — **normal M1 priority** (v2.11 reduction reversed). Ships with the REQ-010 migration | ☐ | — | ☐ |
| REQ-029 | M1 | **Gate 4 PASSED** — all four endpoints, including creation against lowercase-coded aspects and analytics trends | ☑ | — | ☑ |
| REQ-030 | M1 | **Backend merged**, contract v2.11 — pending gate, which must confirm **`updated_at` did not move**. Frontend verifies the success path | ☐ | ☐ | ☐ |
| REQ-031 | M1 | **Folded into REQ-050** — same defect, third instance found. Not retired; the work stands | — | ☐ | ☐ |
| REQ-039 | **M2** | Ready — build with REQ-013. Backend half **reports before implementing** | ☐ | ☐ | ☐ |
| REQ-040 | **M2** | Ready — audit only. **Report and stop**; produce SQL for the product owner | ☐ | — | ☐ |
| REQ-044 | **M2** | Ready — audit only, frontend. **Report and stop.** Check the REQ-043 dev log first | — | ☐ | ☐ |
| REQ-045 | **M2** | Ready — backend. Hash magic-link tokens; enforce the rate-limit constants that already exist | ☐ | — | ☐ |
| REQ-046 | **M2** | Ready — backend. **Report the full list before changing anything.** Should land **before or with REQ-014** | ☐ | — | ☐ |
| REQ-048 | **M2** | Ready — audit only, frontend. **Report and stop.** REQ-047 is one instance; does not wait on it | — | ☐ | ☐ |
| REQ-032 | **M2** | Ready — frontend. Premise re-confirmed at v2.16 | — | ☐ | ☐ |
| REQ-033 | M1 | **CLOSED — passes UAT.** Two Radix layers, second unmount clobbering the first's `pointer-events` cleanup | — | ☑ | ☑ |
| REQ-034 | **M2** | Ready — frontend, small | — | ☐ | ☐ |
| REQ-035 | **M2** | **Pending a decision**, not investigation — schema change confirmed necessary | ☐ | ☐ | ☐ |
| REQ-036 | **M2** | **Lowest priority, last in M2.** Product decision first — do not implement. Depends on REQ-037 | — | ☐ | ☐ |
| REQ-037 | **M2** | Ready — frontend. Build the inactive aspects view | — | ☐ | ☐ |
| REQ-038 | M1 | **Gate 4 PASSED** — header and description both update on rename | — | ☑ | ☑ |
| REQ-041 | M1 | **CLOSED — passes UAT.** End-of-list behaviour decided: hold on the last standard with a toast | — | ☑ | ☑ |
| REQ-042 | M1 | **🔴 SHIPPED BUT UNVERIFIED — not passed.** Gate 5 failed on both paths; neither symptom reproduced; **testing parked by the product owner.** All three parts are in production and none is confirmed. **First place to look on a spinner or unexplained logout.** Does not tick | ☐ | ☐ | ☐ |
| REQ-043 | M1 | **CLOSED — passes UAT.** Dashboard and aspect metric caches now invalidated on create. **Opens REQ-044** | — | ☑ | ☑ |
| REQ-047 | M1 | **Both halves merged** — pending gate. Null case decided: **em dash, no fallback**, reused by REQ-035 | ☐ | ☐ | ☐ |
| REQ-049 | M1 | Ready — frontend. **Priority pending one production query** (in the block): cosmetic, or filter-breaking | — | ☐ | ☐ |
| REQ-050 | M1 | Ready — frontend. **Absorbs REQ-031.** Third instance; search the pattern, do not fix two files | — | ☐ | ☐ |
| DATA-001 | M1 | Ready — **product owner runs manually**, no code | — | — | ☐ |
| REQ-013 | M2 | Ready | ☐ | ☐ | ☐ |
| REQ-014 | M3 | Gated on M2. **Also depends on REQ-046** — an audit trail on non-atomic writes records attempts, not outcomes | ☐ | ☐ | ☐ |
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


---

## Extraction notes — inconsistencies found, reported not corrected

**Nothing below was changed in the plan.** These are places where the plan disagrees with itself, or where a
requirement points at something retired, renumbered or folded. An orchestration session will hit them.

### 1. 🔴 REQ-028 is scheduled against a migration that no longer exists

REQ-028 says **"Schedule in the same session as that migration, per §2.7"** and **"It still ships with the
REQ-010 migration in the same session"**. §8's REQ-028 row repeats it: *"Ships with the REQ-010 migration."*

**That migration was RETIRED at v2.14** — not deferred. REQ-010 closed at gate 2 and the script was archived.

**Consequence: REQ-028 reads as blocked on a session that will never happen.** It is not blocked. Whether it
still wants its own gate (it touches the same foreign key) is a live question; the dependency as written is
dangling.

### 2. §2.7's Gate 3 block is spent apart from one item

Gate 3 is scoped around three requirements *"and the ordering between them matters"*:

| Gate 3 item | State now |
|---|---|
| REQ-010's migration | **Retired** (v2.14) |
| REQ-012's remaining endpoint | **Closed** (v2.17) |
| REQ-028 | **Open** |

The block still reads as a live three-part gate with an ordering constraint. **Its Task 1 diagnostic is also
spent** — that defect was retired at v2.16 as never having been a defect.

### 3. §4.1's "what stays is what is broken" list is a v2.15 snapshot, and names a retired defect

> *What stays is what is broken: REQ-007, REQ-009's backend half, REQ-028, REQ-029, REQ-030, REQ-033, REQ-038,
> the `/api/aspects/inactive` defect, DATA-001 and DOC-002.*

REQ-029, REQ-033 and REQ-038 are **closed**; REQ-030's backend is **merged**. **The `/api/aspects/inactive`
defect was RETIRED at v2.16 — it was never a defect**, and it is named here as open work. Carried verbatim
above because it is §4.1's reasoning for M1 scope closure, which is still the operative rule.

### 4. "Everything open in M1" is wider than the six requirements this extract carries in full

The brief named REQ-007, REQ-028, REQ-049, REQ-050, DATA-001 and DOC-002. **§8 — carried in full above, and
authoritative — shows more M1 rows that are not complete:**

| REQ | State per §8 |
|---|---|
| **REQ-009** | Backend merged, pending gate |
| **REQ-030** | Backend merged, pending gate; **frontend verification outstanding** |
| **REQ-031** | Folded into REQ-050 — the work stands |
| **REQ-042** | **🔴 SHIPPED BUT UNVERIFIED — not passed, does not tick** |
| **REQ-047** | Both halves merged, pending gate |

**REQ-042 is the one to be careful with.** It is neither closed nor open: gate 5 failed on both paths, neither
symptom reproduced, and testing is parked by the product owner. Its full block is **not** carried above, and it
is the first place to look if a session hits an indefinite spinner or an unexplained logout.

**Also note REQ-007 is only half open** — its backend merged this session; the frontend half is what remains,
and it ships with REQ-050 in the same function.

### 5. REQ-040's headline count is stale against its own appended note

The body reads **"Five defects have now originated in the aspects family"**. The note appended to the same
block at v2.27 records REQ-049 as the same invariant failing again on the frontend, and the v2.27 changelog
puts it at *"five of the last seven"*. **The count in the requirement was not updated when the note was added.**

### 6. §4's M1 row expresses M1 as the range `REQ-027 → REQ-031`

REQ-031 is **folded into REQ-050**, not retired. Expanding that range yields a requirement whose block says to
go elsewhere. Not wrong; worth knowing before treating the range as a work list.

### 7. The plan's header date trails its own changelog

Header: **30 August 2026.** The v2.26 and v2.27 rows are both dated **31 August 2026.** The version number
(2.27) is current; the date is not.

### 8. 🔴 The extract went stale during extraction — three requirements were merged after v2.27

Between plan v2.27 being written and this extract being committed, the frontend agent merged:

| REQ | Commit | Change |
|---|---|---|
| **REQ-049** | `fa13a44` | `map[aspectCode.toUpperCase()]` in `data-transformers.ts` — the fix the requirement names |
| **REQ-050** | `26ae3fd` | `|| new Date().toISOString()` removed from the display paths |
| **REQ-007** (frontend half) | `8601b2c` | `due_date` derived in `transformAssessmentByAspectToAssessment` instead of hardcoded `null`; invitation date picker |

**The plan does not yet record any of it**, so the three blocks above and their §8 rows still read as open work.
**This is not a contradiction in the plan — it is the plan lagging the branch**, which is exactly what §2.6 says
to expect: a version records a merge, and the plan is edited in its own session.

**For an orchestration session: do not schedule these three as open.** Confirm against `git log` and the
frontend dev log `docs/dev-log/2026-08-31-frontend-req-050-req-007-req-049.md`. **None of them has passed a
gate** — merged is not deployed (§2.6, §2.7).

**Note also that REQ-049's priority question was never answered.** The requirement made priority conditional on
a production query (does any `aspect_code` lowercase into a mapping key?). **The fix shipped without that query
being run** — which is fine, since `toUpperCase()` is correct either way, but it means **nobody yet knows
whether any aspect was silently unfilterable**, and therefore whether anything needs re-checking in production.

---

## What this extract omits, listed so nothing is assumed absent

- **§2.1** (required reading), **§2.3** (sequencing gate), **§2.5** (development log) — operating protocol
  sections not requested.
- **§5** settled decisions and **§5.1** the applicability model.
- **Closed M1 requirements:** AUD-001, DOC-001, DOC-003, SEC-001, REQ-006 (retired), REQ-008 → REQ-012,
  REQ-027, REQ-029, REQ-030, REQ-031, REQ-033, REQ-038, REQ-041, REQ-043, REQ-047 — **and REQ-042**, whose
  state is described in Extraction note 4 rather than carried.
- **M3 → M8 in their entirety**, including REQ-014 → REQ-026.
- **§9 the changelog**, in full.
- Within M2: the marked elisions only — REQ-013's v2.24 test-scope correction, REQ-039's four-session
  misdiagnosis history, REQ-032's v2.16 premise note, REQ-036's v2.12 split history, REQ-037's
  never-had-a-consumer note.

**Every other line above is verbatim from plan v2.27.** Checked mechanically: each non-framing line of this
document was matched against the source.
