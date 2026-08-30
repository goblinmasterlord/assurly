# Assurly — Milestone Plan

**Suggested path:** `docs/milestones/assurly-milestone-plan.md`
**Version:** 2.22
**Date:** 30 August 2026
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

> **Rules 7, 8 and 9 are one rule: check the premise of the question before investigating the answer.**
>
> Each was added after a misdiagnosis, and each is a **worked example** of that general form rather than an independent rule — a claim asserted without checking what it rested on (7), an identifier reasoned about without being read (8), a result judged correct or incorrect without establishing whose it was (9). **Read them as illustrations of one habit, not as three boxes to tick.**
>
> **No tenth is being added, deliberately.** Rules have been accruing faster than the defects they catch, and **a list long enough to skim is a list that stops being read.** If a fourth instance appears, it belongs in a dev log as evidence that this preamble is not landing — not here as rule 10.

1. **Audit before fix.** Every requirement opens with a diagnostic pass: current behaviour, affected files, affected tables, blast radius. The agent reports and **stops**. No fixes during the audit pass.
2. **Decide before code.** Direction is confirmed and any open questions in Section 5 are resolved before implementation begins.
3. **Implement narrowly.** Only what the brief specifies. Out-of-scope boundaries are stated per requirement.
4. **Flag, don't fix.** Adjacent issues found mid-task go into a `Findings` section at the end of the session. They are never acted on without instruction.
5. **Document with code.** No change is complete until the API contract, data model bible and changelog reflect it. Docs ship in the same commit as the code.
6. **Reflect.** Close each session with: what changed, what was deliberately not changed, what the next session needs to know, and any assumptions made.
7. **Label provisional claims where the reader meets them.** A finding resting on an unverified assumption is marked provisional **at the point of the claim**, not only in the Assumptions section at the foot of the document. A reader who acts on the headline may never reach the footer.
8. **Establish what an identifier actually contains before reasoning about a failure involving it.** Users report defects by the label they can see; the system routes on a value they cannot. Those are different strings, and reasoning about the reported one is the failure mode. Two sessions diagnosed the wrong character in REQ-010 because the display name was `IT & Data` while `aspect_code` — the value that actually becomes the id and the path segment — was `IT/DATA_OP`. Read the identifier itself: the column, the path segment, the key. Do not form a hypothesis about a string you have not looked at.
9. **In a multi-tenant system, establish which tenant a result belongs to before reasoning about whether the result is correct.** **An answer that is right for a different tenant is indistinguishable from a wrong answer.** Every authenticated endpoint here scopes on `mat_id` derived from the JWT, so "the endpoint returned the wrong thing" and "you asked as the wrong user" produce identical evidence. Ask which tenant the token is scoped to **first** — before the query, before the code, before the hypothesis.

### 2.3 Sequencing gate

Backend ships and is verified before the corresponding frontend work opens. Frontend must not build against a contract change that is not yet merged and documented. Each milestone names its own gate.

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

### 2.5 Development log

Git records what changed. The development log records why, and is the source material for the release notes published in the application's built-in version history.

**One file per session. Never a shared append-only file** — concurrent agents editing a single log is the same conflict trap as the API contract, and it is the file most likely to be edited on every single session.

Path: `docs/dev-log/YYYY-MM-DD-<layer>-<req-id>.md` — for example `docs/dev-log/2026-08-26-backend-req-010.md`

Template: `docs/dev-log/_template.md`. Every session closes with an entry, **including audit and discovery sessions** — a session that deliberately changed nothing is worth recording, and often more informative than one that did.

Entries are compiled into `docs/development-log.md` at each milestone close. Agents do not write to that file.

**Agents do not write release notes.** Version history copy is user-facing, read by school and trust staff, and is written by the product owner from the compiled log. Write the dev log entry for an engineer picking the work up cold, not for a customer.

**Plan-edit sessions require an entry too.** A session that only changes this document still made decisions, and the reasoning behind a scope change is exactly what a later reader needs. Earlier plan-edit sessions (v2.6, v2.7, v2.8) have no entry; that is a gap, not a precedent.

**The `Deployed:` field is populated from this session forward** (plan v2.9, 27 August 2026).

> ### ⚠️ Two sessions have now closed with no entry, and the second one cost something
>
> **The rule is not new and it is not ambiguous. The compliance is the problem.**
>
> | Session | What is missing |
> |---|---|
> | Dependency pins (`6e00b96`) | Written retrospectively, one plan version later |
> | REQ-033 / REQ-041 / REQ-043 (`3451cb0`, `7d8079d`, four REQ-033 commits) | **Never written** |
>
> **The second has a direct cost, which is why it is recorded here rather than noted in passing.** The frontend agent was asked to report on the mutation surface while it was in that code. **REQ-044 was then scoped to build on that survey** — and the survey exists only in commit messages. So REQ-044 either starts from nothing or repeats work already done, and **nobody can tell which without redoing it.**
>
> That is the whole argument for the rule. A dev log is not a formality that runs after the work; **it is the only artefact that carries reasoning between sessions.** Commits carry what changed. Neither the diff nor the plan carries what was looked at and ruled out — which is precisely what the next session needs and cannot reconstruct.
>
> **This is not a new rule and no new rule would help.** Adding one would repeat the §2.2 preamble's mistake of answering a compliance gap with more text.

### 2.6 Versioning

Current release 1.43. This programme is Sprint 2.0.

- Requirement ships: patch bump — 1.43.1, 1.43.2 and so on
- Milestone closes: minor bump — M1 close is 1.44.0
- Sprint closes: 2.0.0, declared by the product owner, never by an agent

Record every bump in the dev log entry that caused it.

**A version bump records a merge, not a deployment.** The two are separate events in this programme — work merges continuously to `sprint-2.0` and deploys at test gates (§2.7) — and a requirement can sit merged for some time before it runs anywhere. Merged-with-an-unapplied-migration and running-in-production are different states, and the log must be able to tell them apart, so the dev log template carries a **`Deployed:`** field: *yes* plus the date, or *no*.

1.43.1 (REQ-012) and 1.43.2 (REQ-010) stand as recorded — both are merges, and neither claimed to be more.

> ⚠️ **No artefact currently asserts a version.** Not the repository, not the application, not any config file — the version exists **only in dev log entries**, which is to say only in prose written after the fact. **A single source of truth is needed before 2.0**, because the in-app version history depends on it and cannot be generated from prose. Flagged, no action in M1.

#### Precedent — a re-sent instruction is diffed, not re-applied

**Recorded because it was handled correctly and the handling should repeat, not because anything went wrong.**

The v2.19 brief was re-sent with **one of its five items changed**. Two things followed from that, and both are now the convention:

1. **The four unchanged items were diffed against the already-applied version before anything was touched**, and were not re-applied. Re-applying them would have duplicated two requirement blocks. **A re-sent instruction is a diff against what is recorded, not a fresh instruction.**
2. **The plan bumped to v2.20 rather than rewriting v2.19 in place.** v2.19 was pushed and its changelog row stated the superseded position. **Rewriting a published version to say something it never said would falsify the record** — the same principle already applied to the retracted contract v1.8 entry and the struck-through `%2F` note. **Supersede; do not overwrite.** The superseding row says explicitly what differed, so nobody reading both concludes the work was done twice.

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
| **M1** | Stabilise — live defects | **REQ-042 (first)**, AUD-001, DATA-001, DOC-001 → DOC-003, SEC-001, REQ-007 → REQ-012, REQ-027 → REQ-031, REQ-033, REQ-038, REQ-041, REQ-043 | None. Starts immediately. |
| **M2** | Role model, plus the additions displaced from M1 | REQ-013, REQ-032, REQ-034 → REQ-037, REQ-039, REQ-040, REQ-044, REQ-045 | None |
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

#### REQ-042 — Session expires silently mid-task
**Type:** Defect. **Backend and frontend.** **🔴 HIGHEST PRIORITY IN M1.**

**Problem:** The bearer token expires after **60 minutes and does not renew on activity**. On expiry the application **fails silently and spins indefinitely on load** — no message, no redirect to login, no indication that anything is wrong.

**Why this outranks everything else in M1.** A user entering ratings loses their session mid-task and is given nothing to act on. They do not know they are logged out, they do not know their next action will fail, and the platform simply stops responding. **Every other M1 defect degrades a screen; this one silently ends the session of someone doing the exact work the platform exists for** — and it does so at the one-hour mark, which is precisely the length of a serious rating session.

**Scope — backend:** token renewal on activity, or a refresh mechanism.

> **Report the options and the trade-offs before implementing.** This is an **authentication change**: it touches session lifetime, and getting it wrong extends sessions further than intended or invalidates them harder. Sliding expiry, a refresh token, and simply lengthening the TTL are three different security postures. **It warrants a decision, not a default.** Note §2.7 puts authentication changes in a gate of their own.

**Scope — frontend:** **handle `401` explicitly.** **Never spin indefinitely on an authentication failure** — surface it and route to login. This half is independent of whatever the backend decides and should not wait on it: an expired session that redirects cleanly is a far smaller defect than one that hangs.

**M2 interaction — coordinate, do not build auth twice.** REQ-013 introduces the **external tier**, and Trustees and Governors logging in **occasionally** are precisely the users most likely to arrive with an expired token. Whatever REQ-042 settles on becomes the session model REQ-013 inherits, so the two should be designed together even though REQ-042 ships first.

> ### ✅ Decided — **option A: sliding expiry with an absolute cap.**
>
> **`POST /api/auth/refresh` exchanges a valid, unexpired token for a new one with a fresh 60-minute window.** An expired token is refused: **this renews a live session, it does not resurrect a dead one.** No schema change; contract v2.10 documents it as §3a.
>
> **The absolute cap is not optional and is the price of sliding.** **Nothing in the platform can revoke a JWT** — logout is stateless — so unbounded renewal would turn a 60-minute stolen-token window into a permanent one. The token carries an **`auth_time` claim, the original magic-link login, unchanged through every renewal**, and renewal is refused beyond **12 hours** measured from it (`JWT_ABSOLUTE_SESSION_HOURS`).
>
> **Why 12 and not 8.** The cap bounds a stolen token; between 8 and 12 hours that difference is marginal next to the fact that **there is no revocation at all**. What is not marginal is the user: at 8 hours, someone who signs in at 08:30 is thrown out at 16:30, **mid-afternoon and mid-task**, and re-entry costs an email round trip. **12 hours makes "sign in once a day" true for every working pattern in a school**, which is the property that matters given what magic-link re-authentication costs. It is one environment variable if the posture changes.
>
> **The frontend half ships first, and did.** It alone fixes the reported defect. **Sliding expiry does nothing for a user who returns after the token has already expired** — there is nothing left to slide — so for them the entire experience is what the client does with a `401`. That is also exactly the population REQ-013's external tier is made of.
>
> **A refresh token remains the better long-term answer and belongs with REQ-013**, where revocation stops being optional. Choosing A does not block it; the two compose.
>
> **`RefreshTokenRequest` (`auth_models.py:17`) and `TokenPayload.type == "refresh"` stay unused, deliberately.** They describe **option B**, not this one. `RefreshTokenRequest` expects a `refresh_token` in a request body; §3a takes **no body** and renews the token in the `Authorization` header, so adopting the model would misdescribe the flow in the OpenAPI spec. And option A mints **only** access tokens, so nothing should ever set `type` to `"refresh"`. **Left in place rather than deleted** — they are a correct placeholder for the work REQ-013 may pick up, and deleting them would only have to be undone.

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

> ~~**Provisional per §2.2.7.** The decode mechanism above — that uvicorn unquotes `%2F` to `/` before Starlette matches, so encoding cannot rescue this id — is **analysis, not observation**. It is confirmed by testing that specific row after **gate 2**.~~
>
> **DISPROVED at gate 2 (v2.14).** `HLT-IT/DATA_OP` retains the forward slash in its primary key and renames successfully, which this mechanism says is impossible. The cause of the original failure is **not established** — see the REQ-010 block below for the surviving hypothesis and the evidence against it. The paragraph above is retained struck through, because it was the reasoning three plan versions acted on and deleting it would hide why.

**Scope:** If the hypothesis holds, the fix is to key the route on the aspect identifier. Escaping the name is a patch over the underlying design problem and should not be the chosen fix without discussion.

> **Corrected twice — read the settled position below, not the history.**
>
> **v2.8 said** the migration was hygiene, because percent-encoding transmits a backslash faithfully (`%5C` → uvicorn decodes → `[^/]+` matches → row found), so the encoding fix repairs those rows by itself. That reasoning is sound **and it does not apply to the row that was actually failing.**
>
> **v2.9 (settled):** the reported aspect's id contains a **forward slash** (`HLT-IT/DATA_OP`), the one case v2.8 named as beyond encoding — `%2F` is decoded to `/` before routing and still adds a path segment. **The migration is required. It is the only fix for the reported symptom.** Discovery query 1b in the migration file exists precisely to find rows of this kind, and it will find this one.

**Settled — the permitted set is `^[A-Za-z0-9_]{2,10}$`:** ASCII letters, digits and underscore, 2–10 characters.

**Hyphen is excluded deliberately**, despite being URL-safe. It separates `{MAT}-{CODE}` and marks the `-deleted-<ts>` archive rename, so permitting it inside a code makes both patterns ambiguous to anything that matches on them.

**REQ-010 splits into two halves, per §2.7:**

### REQ-010 CLOSES with gate 2. The migration is retired and the requirement no longer spans two gates.

**Gate 2 evidence — complete.** `aspect_code` validation rejects `IT/DATA`, `IT\DATA`, `IT & Data` and single-character codes; `TEST_01` is accepted; `Governance` renames normally; and the **Standards and Users admin views are unaffected by the encoding changes across all eleven call sites**.

**The migration is retired, not deferred.** A production query confirms **both primary keys still contain the bad characters** — `HLT-IT/DATA_OP` and `HLT-IT\DATA_ST` — but their `aspect_code` values were manually corrected to `IT_DATA_OP` and `IT_DATA_ST`, and **both aspects now rename normally, carry assessments, and behave correctly throughout the application.**

The migration would suspend foreign-key checks and rewrite primary keys across two tables under `ON UPDATE NO ACTION` constraints — **the highest-risk operation in this programme** — to fix **nothing currently observable**. Validation prevents further bad rows, and these two are effectively quarantined: their codes can no longer be changed back through the interface.

> ### ⚠️ Two standing caveats. Recorded, not acted on.
>
> **1. These ids will still break any future code that interpolates them into a URL path without encoding.** The data hazard has not been removed, only rendered dormant by the encoding fix. §2.4's standing constraint is what keeps it dormant.
>
> **2. These two aspects cannot be safely deleted.** `delete_aspect` archive-renames the primary key, which would hit **exactly the foreign-key collision REQ-028 describes**. Deleting either is not a routine operation on these rows.
>
> **The written migration script is kept** at `docs/archive/2026-08-26-REQ-010-aspect-code-sanitisation.sql` (moved there in `c344a2e`) against the possibility that either caveat becomes real. Note `docs/migrations/` no longer exists — it held only this script.

> ### ⚠️ The `%2F` decode diagnosis is DISPROVED. It must not be left standing as confirmed.
>
> v2.13 recorded the forward-slash mechanism as **observed** and removed its §2.2.7 provisional label. **That was wrong, and the label should not have come off.**
>
> **`HLT-IT/DATA_OP` retains a forward slash in its primary key and renames successfully** — which the decode diagnosis said was impossible. What changed between failure and success was **`aspect_code`, not the id.** If the request path were built from the id, the request would have been byte-identical before and after, and the outcome could not have changed.
>
> **Surviving hypothesis, marked provisional per §2.2.7:** the frontend may construct the request path from `aspect_code` rather than from `mat_aspect_id` as returned by the API. That would explain the original failure, why the encoding fix alone did not repair it, and why changing the code did.
>
> **But there is evidence against it, and gate 3 must resolve the contradiction rather than confirm the hypothesis.** Reading the call site chain on this branch: `CreateAspectModal.onSubmit` passes `mat_aspect_id: aspect?.mat_aspect_id`; `use-standards-persistence.ts:280` calls `assessmentService.updateAspect(aspect.mat_aspect_id, …)`; `enhanced-assessment-service.updateAspect` delegates to `apiUpdateAspect(matAspectId, …)` unchanged; and `assessment-service.ts:377` interpolates that value. **Every link passes `mat_aspect_id`. None reads `aspect_code`.**
>
> So the hypothesis is not supported by the code as written, and the observed behaviour is not yet explained by anything. **Verify at gate 3 by reading the call site against the deployed build**, and if it also passes the id, the question to answer is what else in the flow depends on `aspect_code` — the failing step may not be the `PUT` at all. **Do not treat any of this as settled.**

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

**Confirm what currently writes `updated_at` before implementing.** The column carries `CURRENT_TIMESTAMP on update`, and at least one handler also sets it explicitly. Both paths must be accounted for, or the sort-order exclusion will be silently defeated by the column default.

> **Outcome — the third scope item required no code.** Five writers touch `updated_at`, and **all five are material**: the content edit in `PUT /api/standards/{id}`, both branches of delete (archive-rename and deactivate), reinstate, and the column's own `ON UPDATE CURRENT_TIMESTAMP` firing on the `current_version_id`-only write.
>
> **There is no `sort_order` write path in the backend at all** — the column appears in the INSERT and in `ORDER BY` clauses and nowhere else — so nothing bumps `updated_at` on a reorder and **there was nothing to stop.** The settled definition holds and is now in the contract; it was already satisfied **by accident**.
>
> That is not as comfortable as it sounds. The reason nothing bumps the timestamp on reorder is that **reorder does not persist at all** — see **REQ-030**. When that endpoint is built, the exclusion becomes real work rather than a happy coincidence, and REQ-030 carries it.

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

> ### Gate 1 result — half verified. **REQ-012 stays open.**
>
> **Route ordering confirmed fixed against the live spec.** Both inactive routes now precede their parameterised siblings.
>
> **`GET /api/standards/inactive` — PASSES.** Four deactivated default standards returned where previously none.
>
> **Deleted *custom* standards are correctly excluded, and that is by design — do not "fix" it later.** The archive-rename makes a custom deletion permanent, and the application warns the user of exactly that at the point of deletion. The endpoint lists what can be reinstated; a custom standard cannot be, so it does not belong in the list. Recorded here because an empty-looking result is the kind of thing a future session mistakes for a bug.
>
> **`GET /api/aspects/inactive` — UNVERIFIED, not failed.** It was simply not exercised; the retest covered the standards endpoint only. HLT has one inactive default aspect (`Mock aspect`, `is_custom = 0`, `is_active = 0`), so **one row is expected**. **REQ-012 remains open until that endpoint is called directly.**
>
> **Why that endpoint in particular was never checked:** nothing in the application has ever called `/api/aspects/inactive` — see **REQ-037**. A defect in an endpoint with no consumer is invisible by construction, which is why this route's shadowing survived while the standards equivalent, backed by `InactiveStandardsModal`, did not.

> ### ✅ v2.16 — RETIRED. Not fixed. **It was never a defect.**
>
> **`GET /api/aspects` returned six aspects, all with `mat_id = 'OLT'`. The call was authenticated as an OLT user, and OLT has six aspects.** The endpoint returned exactly what it should.
>
> `/api/aspects/inactive` filters on `mat_id` from the same JWT, and **OLT has no inactive default aspects** — `Mock aspect` belongs to **HLT**. **The empty array was correct behaviour throughout.** So was the 6-of-17 count: 17 is HLT's active row count, and the question was being asked as OLT.
>
> **What this cost: five hypotheses across four sessions** — route shadowing, MAT scoping mismatch, NULL flags, a swallowed exception, and an environmental mismatch — **three disproved by code reading, one by production query, on an endpoint that was working the whole time.**
>
> **Nobody asked which tenant the token was scoped to.** That is the part worth sitting with. The handler scopes on precisely that: `current_mat_id: str = Depends(get_current_mat)`, and `get_current_mat` returns `current_user.mat_id` from the JWT. It was read, quoted in a report, and used to *rule out* a MAT-scoping hypothesis — while the question "scoped to which MAT?" was never put.
>
> **Recorded as §2.2.9.** In a multi-tenant system, an answer that is right for a different tenant is indistinguishable from a wrong answer, and the two produce identical evidence.
>
> **✅ v2.17 — REQ-012 CLOSES.** Verified in production: `/api/aspects/inactive` called as an **HLT** user returns **one row, `Mock aspect`**. Route ordering fixed, endpoint working, and the prior empty results explained by tenant scoping rather than any defect in the handler.

<details>
<summary>Superseded — the v2.15 "widened defect" entry, retained because four sessions acted on it</summary>

> ### ⚠️ v2.15 — the defect has WIDENED, and is no longer about the inactive endpoint.
>
> **Everything about the inactive handler checks out.** Run against production with `mat_id` bound to `'HLT'`, **the handler's complete query returns the qualifying row.** The SQL is correct, the data is correct, `is_modified` and `standards_count` compute correctly, and the `LEFT JOIN` to the `aspects` seed table drops nothing. The deployed build is current — `updated_at` is present in `MatStandardResponse` in the live spec — and the service's `DB_NAME` and `DB_USER` match the connection the query was run on. **The environmental hypothesis is dead too.**
>
> **The larger finding: `GET /api/aspects` returns 6 aspects for HLT, which has 17 active rows in `mat_aspects`.** The **active** endpoint is dropping **eleven** rows.
>
> **This is not confined to the inactive handler. The aspects family is under-returning generally**, and the single qualifying inactive row is presumably dropped by the same mechanism — which reframes a quiet defect in an endpoint nobody calls as a live one in an endpoint the application depends on.
>
> **Pending, and the second question is the important one:**
> 1. **Which six ids are returned?**
> 2. **Does the application UI show 17 aspects, or 6?**
>
> **(2) decides what this is.** If the UI shows 17, the endpoint is broken and something else feeds the screen. **If it shows 6, the customer has been using a screen with most of its data missing** — and that is a different severity, a different disclosure question, and probably a different milestone position.
>
> **Four hypotheses have now been disproved** — route shadowing, MAT scoping, NULL flags, and the environment. **Add nothing further without evidence.** The next contribution to this defect is data, not another theory.

</details>

**The instruction above was right and still insufficient.** "Add nothing without evidence" was correctly followed, and the session still went nowhere — because the missing thing was not more evidence about the endpoint, it was one fact about the **question**. No amount of data about `mat_aspects` would have helped while the query was being asked as the wrong tenant.
>
> **Once REQ-037 ships, the aspects endpoint gains its first real consumer** and can be verified through the interface rather than by direct call. **That is not a reason to wait.** The direct call closes REQ-012 sooner and remains outstanding.

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

### ✅ Gate 4 — **REQ-027 STAYS CLOSED. It has not regressed.**

> **v2.19 recorded this as "reopened pending diagnosis". That was wrong and is corrected here.** The question it posed — *is the failing flow the same one that passed?* — was the right question, and the answer is **no**.

**Gate 1 tested creation into a term with no prior assessments.** That flow succeeded then and **still succeeds now.** The newly reported failure is **creation into a term that already contains assessments** — **a flow that was never tested.**

**Nothing has regressed. A second, adjacent defect has been found.** It is **REQ-043**, and this requirement is unaffected.

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

> ### ✅ Complete — and there were **four** endpoints, **six** sites, not two.
>
> | Site | Endpoint | Behaviour before |
> |---|---|---|
> | `main.py:1172` | `GET /api/standards` | silent empty |
> | `main.py:3157` | `GET /api/assessments/by-aspect/{code}` | silent empty |
> | `main.py:3200` | `GET /api/assessments/by-aspect/{code}` | silent empty |
> | `main.py:4023` | `GET /api/analytics/trends` | silent empty |
> | `main.py:1000` | **`POST /api/assessments`** | **404, loudly and misleadingly** |
> | `main.py:888`, `:2292` | `GET /api/assessments`, `POST /api/aspects` | already correct |
>
> **`GET /api/assessments/by-aspect` carries two comparison sites in one handler**, not one — a detail that would have left the endpoint half-fixed had only the first been found.
>
> **`POST /api/assessments` did not fail silently, and that made it worse.** Zero matched standards raised `404 "No standards found for aspect: X"` **for an aspect that has standards**, blocking assessment creation outright for every lowercase-coded aspect — `ab`, `ey` and `mck` in HLT. **A silent empty list invites a second look; a confident error message about missing standards sends the reader to the wrong table.** The requirement was framed around silent failure, and the loud instance was the more damaging one.
>
> **Root cause: `aspect_code` has no canonical casing.** `POST /api/aspects` uppercases on write (`main.py:2178`), so anything created through the API is uppercase — **the lowercase codes are seeded data that predates or bypassed that path.** This is the same two-era seeding that produced the UUID versus `{MAT}-{CODE}` split in primary keys (see REQ-010). The endpoints assumed an invariant the data never had. **See REQ-040.**

**Out of scope:** Normalising the stored data. That is a tenant-data question (see DATA-001), and the endpoints should be case-insensitive regardless of how tidy the column becomes.

---

#### REQ-030 — Reordering standards has never been saved
**Type:** Defect. **Backend and frontend.**

**Problem:** The frontend persists drag-and-drop reordering by calling `POST /api/standards/reorder` (`assessment-service.ts:295`). **That endpoint does not exist anywhere in the backend** — not in the route table, and a repository-wide search for `reorder` in `assurly-backend/` returns nothing at all. **Confirmed by testing: reordering does not persist and never has.**

The user drags a standard, the list reorders on screen, and the change is gone on reload.

> **Amended after gate 1 testing — two corrections.**
>
> **1. The failure is a `405`, not a `404`.** `POST /api/standards/reorder` is being matched by `GET /api/standards/{mat_standard_id}` with `mat_standard_id = "reorder"`; the path matches, the method does not, so Starlette answers `405 Method Not Allowed`. **The new endpoint must therefore be registered ABOVE the parameterised route.** Registering it below would leave the `405` in place and look like the endpoint had not been built.
>
> **This is the THIRD literal-after-parameterised shadowing found in `main.py`**, after the two REQ-012 fixed. Three instances of one mistake in one file is **a property of the file, not three separate errors** — the file is long, routes are appended at the end, and nothing makes registration order visible to whoever is adding one. **The REQ-030 fix must avoid re-committing it**, which means placing the new route deliberately rather than at the end of the Standards block. See REQ-013's test scope for the check that would catch the fourth.
>
> **2. Frontend scope reduces.** The frontend **already surfaces the failure** with an error toast, so it is not swallowing anything. **Frontend scope is now: verify the success path** once the endpoint exists.

**Scope — backend: build the endpoint.**

- Accepts a **set** of standards with their new `sort_order` values.
- **Applies them in a single transaction.** Reorder is inherently multi-record, and a partial application leaves the list in an order **nobody chose** — worse than the current failure, which at least leaves the old order intact.
- **Must not bump `updated_at`.** Reordering is not a material edit, per REQ-011's settled definition. Note the column carries `ON UPDATE CURRENT_TIMESTAMP`, so this is not automatic: an `UPDATE` touching only `sort_order` will still move the timestamp unless the statement sets `updated_at = updated_at` explicitly. **This is the one part of the endpoint that is easy to get wrong.**

**Scope — frontend: verify the success path.** The error toast already fires on failure (see the amendment above), so nothing needs adding for the failure case — only confirmation that a successful reorder persists and survives a reload.

**Three paths share the `sort_order` field name and have different verdicts. Recorded together so they are not confused again:**

| Path | State | Verdict |
|---|---|---|
| `POST /api/standards` (create) | `sort_order` sets a new standard's **initial position**. Legitimate and in use. | **Leave alone.** |
| `PUT /api/standards/{id}` (update) | `MatStandardUpdate` declares `sort_order`; the handler **silently ignores it**. A request setting only `sort_order` returns `200` having changed nothing. | **Remove the field from the model.** Do not implement it — a single-record `PUT` is the wrong shape for a multi-record operation. |
| `POST /api/standards/reorder` | Does not exist. | **Build it.** |

> **Agreed, with a supporting reason.** API contract §16 (Update standard) **never documented `sort_order`** — the request-body table lists `standard_name`, `standard_description`, `standard_type` and `change_reason` only. So the field is undocumented dead weight in the model, not a documented capability being withdrawn, and **removing it needs no contract change**. It brings the model into line with a contract that was already correct.

**Out of scope:** Reordering aspects, which is a separate surface and a separate endpoint.

---

#### REQ-031 — `VersionHistoryModal` still fabricates today's date
**Type:** Defect. **Frontend, small.** **Assigned to the frontend agent.**

**Problem:** `VersionHistoryModal.tsx:77` carries the same `|| new Date()` fabrication that REQ-011 removed from `SortableStandardCard.tsx`. Where the value is absent it renders today, which reads as data and is not.

**Why it needs its own number:** both agents scoped it out — the backend brief covered the API, the frontend brief covered the standards card — so **it currently belongs to nobody**. It is named in the plan under REQ-011 and in both dev logs, and has still not been picked up.

**Scope:** Show an em dash when the value is absent, matching the treatment now shipped on the standards card.

---

#### REQ-033 — The application goes click-dead after deleting a standard
**Type:** Defect. **Frontend.**

**Problem:** After deleting a standard, the interface stops responding — buttons do not react and hover states do not fire — until a **full browser refresh**. Nothing recovers it short of a reload.

**Likely cause:** a dialog overlay that fails to unmount and keeps capturing pointer events, leaving an invisible layer over the page.

~~**Investigate alongside REQ-007's unclickable date-picker modal**, which presents the same symptom — a control that cannot be reached by mouse but responds to keyboard tabbing. **One fix may close both.**~~

> ### ✅ Reported — **they are unrelated. One fix will not close both.**
>
> | | Cause |
> |---|---|
> | **REQ-033** | A Radix `Dialog` opened from a **closing `DropdownMenu`**, leaving `pointer-events: none` on `body` |
> | **REQ-007** | **`Popover`-in-`Sheet` stacking** |
>
> Same symptom — a control unreachable by mouse but responsive to keyboard tabbing — **different mechanisms**, which is exactly why the shared-cause question was worth asking before fixing either.
>
> **REQ-007's frontend scope does not shrink.** Its date picker still needs fixing on its own terms; nothing here removes work from it. **REQ-038 is likewise unrelated** to both — a stale `currentAspect` snapshot read instead of the live `aspects` array, not a pointer-events or stacking problem.
>
> **Both merged 30 August 2026** (`3c587b6`, `49ac78b`), pending gate. Per the frontend dev log, REQ-033's fix defers the `Dialog` open until the `DropdownMenu` has fully closed, and REQ-038's derives `currentAspect` from the live array rather than a snapshot.

### ⚠️ Gate 4 — REQ-033 FAILS and REOPENS. The diagnosis was wrong.

**REQ-038 passes** — header and description both update on rename.

**REQ-033 does not.** The merged fix addressed a **race between a closing `DropdownMenu` and an opening `Dialog`**. That cannot be the fault, and one observation rules it out:

> **Cancelling the delete also leaves the application click-dead** — and cancelling never opens the destructive path at all.

So the problem is **not in how the dialog opens.** It is that **`pointer-events: none` is not removed from `body` when the dialog closes**, on **either** path — confirm or cancel. **Two overlapping Radix layers each manage that lock, and the second unmount is clobbering the first's cleanup.**

**Method for the next attempt — this is the part that matters.** **Verify against `body`'s inline style directly**, not by reasoning about component lifecycle. Open the dialog, close it both ways, and read `document.body.style.pointerEvents` at each step. The previous diagnosis was a plausible lifecycle story that survived because nothing checked the one attribute that defines the symptom.

**REQ-007 remains unrelated** (`Popover`-in-`Sheet` stacking), and this correction does not change that — if anything it sharpens it, since REQ-033 is now a teardown fault rather than an open-ordering one.

> ### ✅ CLOSED — **passes UAT, 30 August 2026. The corrected diagnosis was right.**
>
> **Confirmed cause: `DropdownMenu` and `Dialog` both manage `body`'s `pointer-events`, and with both mounted the second layer's unmount cleanup clobbered the first's** — which is why **Cancel failed too**. The teardown reading was correct and the original open-ordering reading was not.
>
> **The method is what settled it.** Reading `document.body.style.pointerEvents` at each step, rather than reasoning from the component tree, distinguished two mechanisms that produced identical symptoms and identical plausible stories. **The first attempt failed because nothing checked the one attribute that defines the symptom** — see the v2.19 dev log.
>
> Merged as four commits on `sprint-2.0` (`d40bb72`, `f341367`, `fcd280c`, `9e0b2be`, plus `6d39d8d` removing the helper the fix orphaned).

---

#### REQ-043 — Creating into a term that already has assessments does not refresh the view
**Type:** Defect. **Frontend.**

**Problem:** Creating assessments against a term that **already contains assessments** does not refresh the view. The new assessments appear only after a **full browser refresh**.

**This is the flow REQ-027 never tested.** REQ-027 fixed the adjacent case — creation into a term with **no** prior assessments — by invalidating the `assessments` and `terms` caches on create. **Creating into an existing term changes the assessment list but not the term list.** So either that invalidation is not firing on this path, or the refresh does not `await` it.

**Scope:** Make the view reflect the new assessments without a browser refresh, on the existing-term path.

> ### ⚠️ The pattern is the finding, and it is worth more than either fix.
>
> **Two requirements now share a root cause and were separated only by which cache the flow happened to touch.** REQ-027 and REQ-043 are the same defect — a mutation that does not refresh what it changed — split in two because one path also touched the term list and the other did not. The first was found, fixed and gate-tested; the second was invisible until someone happened to create into a populated term.
>
> **Fixing them one flow at a time will keep producing requirements.** Every mutation path has this exposure, and the ones with no second cache to invalidate are precisely the ones that will not announce themselves.
>
> **Worth establishing whether every mutation path invalidates what it changes** — as a single pass over the mutation surface, rather than another defect per flow. That is an audit, not a fix, and it is the same shape as **REQ-040** for `mat_aspects`. ~~**Scope it deliberately if the pattern holds for a third time.**~~ **Scoped now as REQ-044 — see below; there is no waiting for a third instance.**

> ### ✅ CLOSED — **passes UAT, 30 August 2026.**
>
> **Confirmed cause: creating into an existing term changes only the assessments list, so the dashboard overlay and aspect metric caches were never invalidated.** The `terms` invalidation REQ-027 added was firing; it simply was not the cache this flow needed. Merged as `3451cb0` on `sprint-2.0` — invalidate the dashboard and aspect caches on create, force the assessments refetch on refresh, and `await` both the assessments reload and the dashboard reload on invitation success.
>
> **This closes the requirement and opens REQ-044.** The audit is not a consequence of this fix failing; it is a consequence of this fix being correct and narrow. **Two flows, two caches, two requirements** — and nothing has established how many more flows there are.

---

#### REQ-041 — Save & Continue returns to the first standard instead of the next
**Type:** Defect. **Frontend.**

**Problem:** On the assessment rating page, **Save & Continue persists the rating correctly** but returns the user to the **first** standard in the list rather than advancing to the next one.

**On an aspect with ten standards this makes sequential rating unusable.** The control's entire purpose is to move forward; instead the user is returned to the top after every save and has to find their place again. The data is never wrong, so nothing signals a fault — it reads as clumsy design rather than a defect, which is why it may have been tolerated rather than reported.

**Scope:**
- **Advance to the next unrated standard**, not simply the next in order — a user re-entering a partly-rated aspect should be taken to work that remains, not to a rating they have already given.
- **Define the behaviour at the end of the list.** When no unrated standard remains, the requirement is to decide and state what happens — return to the aspect summary, close, or hold on the last standard with the control disabled. **Do not leave this to fall out of the implementation**; it is the case a user hits every time they finish an aspect.

> ### ✅ CLOSED — **passes UAT, 30 August 2026.**
>
> **Confirmed cause: two faults, either of which alone produced the symptom.** A `useEffect` **reset `activeStandard` to the first standard on every assessment change**, and **Save & Continue called `goToNextStandard` without awaiting the save** — so the advance raced the refresh that then reset it. Fixing only one would have left the defect intact and looking fixed intermittently.
>
> **End-of-list behaviour, as decided and shipped:** the view **holds on the last standard** and raises a toast — *"All standards rated. No further unrated standards remain. You can submit the assessment when ready."* It does not close or navigate away. Recorded here because the requirement asked for the decision to be stated rather than inferred from the code.
>
> Merged as `7d8079d` on `sprint-2.0`.

---

#### REQ-038 — Aspect rename does not update the page header
**Type:** Defect. **Frontend.**

**Problem:** Renaming an aspect updates the name in the **aspects list** but not in the **page header**. The same applies to the aspect **description**. The write succeeds; one surface refreshes and another does not, so the interface disagrees with itself until a reload.

**Cause, unconfirmed:** stale local state after a successful mutation — the header is presumably reading a copy captured before the update rather than the refreshed collection.

**Same family as REQ-027**, which was stale-cache-after-create on the assessments surface. **Different surface, and possibly a different mechanism** — REQ-027 was an uninvalidated request cache, whereas this may be a component holding its own copy. **Check whether they share a cause and report.** If they do, the fix is one change; if not, fixing this by analogy to REQ-027 will miss.

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
2. **Route ordering** — that **every literal path precedes its parameterised sibling**. A short test over the registered route table, and it catches a defect class this codebase **demonstrably produces**: three instances in `main.py` so far (the two `/inactive` routes REQ-012 fixed, and `POST /api/standards/reorder` under REQ-030).

This is not a general test suite and must not grow into one.

**These are now two independent arguments for building the test infrastructure in M2**, which matters because the infrastructure is the expensive part. The first is that the external tier's write-blocking is otherwise unprovable. The second is that route shadowing is silent — it produces a `404` or `405` that looks like a missing endpoint — and has already cost this programme three defects and two sessions of diagnosis.

Note the starting position: **`assurly-backend/test_phase2_auth.py` is the only test file in the repository** (four tests, all auth primitives — JWT creation, MAT-wide access, response formatting, magic-link generation). Nothing covers authorisation. **There is no infrastructure to extend**, so REQ-013 carries the cost of establishing it as well as the cost of the tests themselves. Budget accordingly.

**Where enforcement will be proved or disproved (from SEC-001):** `DELETE /api/standards/{mat_standard_id}`, `DELETE /api/aspects/{mat_aspect_id}` and `DELETE /api/assessments/{assessment_id}/actions/{action_id}` are currently guarded by **authentication alone, with no role check** — any authenticated user in the MAT may call them. Those are precisely the routes the external tier must not reach. Note the corollary: until this requirement lands, **read-only access cannot be granted to anyone**, because there is no tier that has it.

**Out of scope:** Subdividing the internal tier. Per-school scoping of external users — they see the whole MAT. A general-purpose test suite.

---

> ### Moved from M1 at v2.15 — M1 scope closure.
> The five requirements below are **additions, not defects**. They were raised during M1 and kept their ids; only their milestone changed. See §4.1 for the reasoning.

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

#### REQ-045 — Harden the magic-link path
**Type:** Defect. **Backend.** **M2.**

Two faults on the login path, found during REQ-042's diagnosis. Neither is urgent today; **both get worse the moment re-authentication becomes routine**, and that endpoint sends email.

**1. Magic-link tokens are stored in plaintext.** `users.magic_link_token` holds the raw token, and `verify_magic_link` (`main.py:723`) matches on it directly. **`generate_token_hash()` exists at `auth_utils.py:164` for exactly this purpose and is never called** — its own docstring says "even with database access, tokens can't be used directly", which is the property the platform does not have. Anyone with read access to `users` can sign in as any user inside the 15-minute window.

**Scope:** store the SHA-256 hash, match on the hash, keep the raw token only in the emailed URL. **Note the migration consideration:** tokens in flight at deploy would stop verifying. They live 15 minutes, so a quiet-window deploy costs at most one re-request — **decide that deliberately rather than discovering it.**

**2. No rate limiting on `POST /api/auth/request-magic-link`.** `MAGIC_LINK_RATE_LIMIT_PER_EMAIL` and `MAGIC_LINK_RATE_LIMIT_WINDOW_HOURS` are defined at `auth_config.py:45-46` under a comment reading "for future implementation" and **nothing reads them.** The endpoint sends an email per call with no throttle, which is a mail-reputation and nuisance exposure before it is a security one.

**Scope:** enforce the constants that already exist. **Do not invent a new policy** — 3 per email per hour is the recorded intent.

**Why M2 and not M1:** neither is a live defect anyone has hit, and M1 is closed to scope growth (v2.15). **But both sit on the path REQ-042 just made busier**, so they should not drift past M2.

---

#### REQ-039 — Nothing shows which MAT the displayed data belongs to
**Type:** Defect. **Frontend and backend.** Belongs with REQ-013.

**Problem:** **Neither the application nor the API response indicates which MAT the displayed data belongs to.** Every authenticated endpoint scopes on `mat_id` from the JWT, so every screen and every payload is tenant-specific — and none of them says which tenant.

**This is not theoretical. It directly caused a four-session misdiagnosis** (see REQ-012): `GET /api/aspects` returned six rows, that was read as an endpoint under-returning against a 17-row table, and five hypotheses were raised and disproved before anyone established the call was authenticated as OLT rather than HLT. **An answer that is right for a different tenant is indistinguishable from a wrong answer** (§2.2.9), and nothing on screen or in the payload closes that gap.

**The risk grows in M2.** The **superadmin tier is explicitly cross-tenant** (§3 — "scoped across tenants for the platform team"), so moving between MATs stops being an accident and becomes routine. A platform-team member acting on the wrong trust's data is a materially worse outcome than a confused debugging session.

**Scope — frontend:** a **persistent tenant indicator, visible on every screen.** Not a settings page, not a tooltip — always in view, because the failure mode is not knowing you needed to check.

**Scope — backend:** **report** whether collection endpoints should carry the `mat_id` they are scoped to, rather than leaving it inferable only from individual rows. Note the asymmetry that made this possible: `GET /api/aspects` returns `mat_id` on each row, so the information *was* present and still went unread, whereas an empty collection carries no rows and therefore no tenant at all — which is precisely the case that misled. **Report before implementing;** a top-level `mat_id` on collection responses is a contract change across many endpoints.

**Belongs with REQ-013's role model work**, since superadmin is what makes it acute — and since whoever builds cross-tenant access should build the thing that shows which tenant you are in at the same time.

---

#### REQ-032 — Assessments view silently truncates to 10 aspects
**Type:** Defect. **Frontend.**

**Problem:** The Assessments view displays at most **10 aspects**, with **no pagination, no scroll and no total**. Nothing indicates that anything has been withheld, so users reasonably believe they are seeing everything.

**Silent truncation of a list is worse than an error.** An error is noticed and worked around; a short list that looks complete is acted on. A MAT with more than ten aspects is currently making decisions from a partial view without knowing it.

> **Unaffected by the v2.16 retirement, and its M2 placement stands.** This requirement's premise was questioned at v2.15 on the assumption that `GET /api/aspects` was under-returning. **It was not** — it returned six aspects because the caller was an OLT user and OLT has six. The truncation described here is a display defect on complete data, exactly as originally scoped.

**Scope:**
- Page size selector offering **10, 25 and 50**.
- Navigation controls.
- Scrolling above 10.
- **A result counter stating the range shown and the total** — this is the part that fixes the silence, and it should ship even if the rest is staged.

---

#### REQ-034 — No Expand All on the Overview view
**Type:** Enhancement. **Frontend, small.**

**Scope:** Add an **Expand All** control to the Overview view that expands every school group at once. A collapse-all counterpart is the obvious companion but is not required.

---

#### REQ-035 — Show who made the last update
**Type:** Feature. **Backend, then frontend.**

**Problem:** Standards show *when* they were last updated (REQ-011) but not *by whom*. The two questions are usually asked together.

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

#### REQ-036 — Expose deletion for DEFAULT aspects
**Type:** Enhancement. **Frontend.** **Lowest priority in M2 — place last.** Moved from M1 at v2.15.

**Split from the original REQ-036 in v2.12**, which bundled two pieces of work with different natures under one number. Building the inactive-aspects view is now **REQ-037**. This requirement is the exposure question only.

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

#### REQ-037 — Build the inactive aspects view
**Type:** Defect. **Frontend.**

**Problem:** **The application promises a capability it does not have.** On deactivating an aspect, `use-standards-persistence.ts:328` tells the user: *"Aspect has been deactivated. You can reinstate it later from the inactive aspects section."*

**That section was never built.** `InactiveStandardsModal.tsx` exists for standards; there is **no equivalent for aspects** anywhere in `components/admin/standards/`.

**Scope:** Build the inactive aspects view, **modelled on `InactiveStandardsModal`** — same shape, same placement, calling `GET /api/aspects/inactive` and offering reinstatement via `POST /api/aspects/{mat_aspect_id}/reinstate`. Both endpoints already exist.

> **`/api/aspects/inactive` has almost certainly never had a consumer.** Nothing in the frontend calls `getInactiveAspects()`. **This is the clean explanation for the gate 1 gap**: the route-shadowing defect REQ-012 fixed sat on that endpoint unnoticed, while the standards equivalent — which *does* have a consumer in `InactiveStandardsModal` — would have been visible to anyone using the feature. A defect in an endpoint nobody calls is invisible by construction.

**Note the current failure is silent, not loud.** The toast fires only for reinstatable aspects, which are defaults, which cannot presently be deleted from the UI at all (REQ-036) — so today the promise is unreachable rather than broken. **It becomes a visible lie the moment REQ-036 exposes deletion for defaults**, which is why REQ-036 depends on this and not the other way round.

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
| REQ-008 | M1 | **Gate 1 PASSED** in production | — | ☑ | ☑ |
| REQ-009 | M1 | Frontend **gate 1 PASSED**. Backend `MAX(due_date)` aggregate still outstanding | ☐ | ☑ | ☐ |
| REQ-010 | M1 | **CLOSED at gate 2.** Migration **retired** — see the standing caveats. Original cause remains unexplained | ☑ | ☑ | ☑ |
| REQ-011 | M1 | **Gate 1 PASSED**, both halves | ☑ | ☑ | ☑ |
| REQ-012 | M1 | **CLOSED.** Verified in production as an HLT user — one row, `Mock aspect` | ☑ | — | ☑ |
| REQ-027 | M1 | **CLOSED — gate 4 confirms no regression.** The newly reported failure is a different, untested flow — see REQ-043 | — | ☑ | ☑ |
| REQ-028 | M1 | Ready — **normal M1 priority** (v2.11 reduction reversed). Ships with the REQ-010 migration | ☐ | — | ☐ |
| REQ-029 | M1 | **Gate 4 PASSED** — all four endpoints, including creation against lowercase-coded aspects and analytics trends | ☑ | — | ☑ |
| REQ-030 | M1 | Ready — backend builds the endpoint **above** the parameterised route; frontend verifies the success path | ☐ | ☐ | ☐ |
| REQ-031 | M1 | Ready — **frontend agent** | — | ☐ | ☐ |
| REQ-039 | **M2** | Ready — build with REQ-013. Backend half **reports before implementing** | ☐ | ☐ | ☐ |
| REQ-040 | **M2** | Ready — audit only. **Report and stop**; produce SQL for the product owner | ☐ | — | ☐ |
| REQ-044 | **M2** | Ready — audit only, frontend. **Report and stop.** Check the REQ-043 dev log first | — | ☐ | ☐ |
| REQ-045 | **M2** | Ready — backend. Hash magic-link tokens; enforce the rate-limit constants that already exist | ☐ | — | ☐ |
| REQ-032 | **M2** | Ready — frontend. Premise re-confirmed at v2.16 | — | ☐ | ☐ |
| REQ-033 | M1 | **CLOSED — passes UAT.** Two Radix layers, second unmount clobbering the first's `pointer-events` cleanup | — | ☑ | ☑ |
| REQ-034 | **M2** | Ready — frontend, small | — | ☐ | ☐ |
| REQ-035 | **M2** | **Pending a decision**, not investigation — schema change confirmed necessary | ☐ | ☐ | ☐ |
| REQ-036 | **M2** | **Lowest priority, last in M2.** Product decision first — do not implement. Depends on REQ-037 | — | ☐ | ☐ |
| REQ-037 | **M2** | Ready — frontend. Build the inactive aspects view | — | ☐ | ☐ |
| REQ-038 | M1 | **Gate 4 PASSED** — header and description both update on rename | — | ☑ | ☑ |
| REQ-041 | M1 | **CLOSED — passes UAT.** End-of-list behaviour decided: hold on the last standard with a toast | — | ☑ | ☑ |
| REQ-042 | M1 | **Option A chosen and built.** Frontend shipped; backend merged and contract at v2.10 — **pending the auth gate**, which it deploys alone (§2.7) | ☐ | ☐ | ☐ |
| REQ-043 | M1 | **CLOSED — passes UAT.** Dashboard and aspect metric caches now invalidated on create. **Opens REQ-044** | — | ☑ | ☑ |
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
| 2.22 | 30 August 2026 | **REQ-042 — option A chosen and the backend half built.** **`POST /api/auth/refresh` exchanges a valid, unexpired token for a new one with a fresh 60-minute window.** An expired token is refused: **this renews a live session, it does not resurrect a dead one.** No schema change. **The absolute cap is the price of sliding, not an optional extra** — nothing in the platform can revoke a JWT, so unbounded renewal would turn a 60-minute stolen-token window into a permanent one. The token carries an **`auth_time` claim, the original magic-link login, unchanged through every renewal**, and renewal is refused beyond **12 hours** measured from it. **Why 12 and not 8:** the difference in exposure is marginal next to having no revocation at all, while at 8 hours someone signing in at 08:30 is thrown out at 16:30 **mid-task**, and re-entry costs an email round trip — **12 makes "sign in once a day" true for every working pattern in a school**, and it is one environment variable if the posture changes. **Tokens minted before the claim existed fall back to their own `iat`**, so they are capped from issue rather than rejected and **the deploy signs nobody out.** **`expires_in` now derives from `JWT_ACCESS_TOKEN_EXPIRE_MINUTES`**; it was hardcoded to 3600 and would have misstated any changed lifetime. **The frontend half shipped first and alone fixes the reported defect** — sliding expiry does nothing for a user who returns after expiry, since there is nothing left to slide, so for that population the whole experience is what the client does with a `401`; that is also exactly who REQ-013's external tier is. **`RefreshTokenRequest` and `TokenPayload.type == "refresh"` stay unused deliberately** — they describe **option B**: the model expects a `refresh_token` in a body, while §3a takes no body and renews the header token, and option A mints only access tokens. Left in place as a correct placeholder rather than deleted. **Contract to v2.10** (§3a, numbered `3a` so no existing endpoint reference is renumbered). **Deploys alone as an auth gate** per §2.7. **REQ-013 gains the deactivation hole:** `get_current_user` (`main.py:536`) wraps its body in a bare `except Exception` that **catches the `401 "User not found or inactive"` it raises at `:529` and re-raises it as a `500`**, and the frontend **deliberately retains the token on a `500`** — correct behaviour for the error it is being told about. **So a deactivated user cannot be logged out and holds a working session until natural expiry.** That is a permissions defect: the tier model is only as real as the ability to remove someone from it. **REQ-045 added** to M2 (backend): **magic-link tokens are stored in plaintext** — `generate_token_hash()` exists for exactly this and is never called, so anyone with read access to `users` can sign in as any user inside the 15-minute window; and **`POST /api/auth/request-magic-link` has no rate limiting** though `MAGIC_LINK_RATE_LIMIT_PER_EMAIL` and its window are defined and unread. Enforce the constants that exist rather than inventing a policy, and decide deliberately that hashing invalidates tokens in flight at deploy. **Neither is urgent, both sit on the path REQ-042 just made busier.** **§2.5 records a compliance gap, not a new rule:** **two sessions have now closed with no dev log entry** — the dependency pins (written late) and the REQ-033/REQ-041/REQ-043 session (never written) — and the second **cost something concrete**: REQ-044 was scoped to build on a mutation-surface survey that now exists only in commit messages, so it either starts from nothing or repeats work, and nobody can tell which. **A dev log is the only artefact that carries reasoning between sessions**; the diff carries what changed, not what was examined and ruled out. **No new rule is added** — that would repeat the §2.2 preamble's mistake of answering a compliance gap with more text. |
| 2.21 | 30 August 2026 | **Three M1 defects pass UAT and CLOSE, each with its cause confirmed rather than assumed.** **REQ-033** — `DropdownMenu` and `Dialog` **both manage `body`'s `pointer-events`**, and with both mounted **the second layer's unmount cleanup clobbered the first's**, which is why **Cancel failed too**. The corrected v2.19 diagnosis was right, and the method it prescribed is what settled it: reading `document.body.style.pointerEvents` at each step distinguished two mechanisms that produced identical symptoms and equally plausible stories. **REQ-041** — **two faults, either sufficient alone:** a `useEffect` reset `activeStandard` to the first standard on every assessment change, and **Save & Continue called `goToNextStandard` without awaiting the save**, so the advance raced the refresh that reset it. **End-of-list behaviour decided and recorded:** hold on the last standard and raise a toast; do not close or navigate away. **REQ-043** — **creating into an existing term changes only the assessments list, so the dashboard overlay and aspect metric caches were never invalidated.** REQ-027's `terms` invalidation was firing; it was not the cache this flow needed. **REQ-044 added** to M2 (frontend, audit): a systematic pass over every mutation path confirming it invalidates every cache its result appears in, and **`await`s the invalidation before the refetch** — an un-awaited invalidation is indistinguishable from a missing one. **The v2.20 "scope it if the pattern holds a third time" condition is WITHDRAWN. Do not wait for a third instance.** REQ-027 and REQ-043 are **one defect that surfaced twice**, and both were found by a person performing an ordinary action and noticing — not by anything systematic. **A mutation path with no second cache to invalidate produces no visible symptom at all**, so it shows stale data that looks current; **the absence of further reports is not evidence the remaining paths are correct**, it is equally consistent with them being silently wrong. **Check the REQ-043 dev log first** — the frontend agent was asked to report on this surface while in the code and may have surveyed part of it; start from that rather than repeating it. **Report and stop; no fixes in the audit pass** — same shape and same reasoning as REQ-040 on `mat_aspects`. **M2, not M1**, since M1 stays closed to scope growth (v2.15). **§2.6 gains a precedent, recorded because it was handled correctly:** a re-sent instruction is **diffed against what is already recorded, not re-applied** — the v2.19 re-send had four of five items already applied, and re-applying them would have duplicated two requirement blocks; and a published version is **superseded, not overwritten** — v2.20 corrected REQ-027 as a new row rather than rewriting v2.19, because rewriting a pushed version to say something it never said falsifies the record. |
| 2.20 | 30 August 2026 | **Corrects REQ-027's status in v2.19.** v2.19 recorded REQ-027 as **reopened pending diagnosis**; it should have stayed **CLOSED**, and does. **It has not regressed.** Gate 1 tested creation into a term with **no prior assessments**, which succeeded then and still succeeds. The newly reported failure is creation into a term that **already contains** assessments — **a flow that was never tested.** v2.19's question ("is the failing flow the one that passed?") was the right one; the answer is no, so nothing was reopened. **REQ-043 added** to M1 (frontend): creating assessments against a term that already contains assessments does not refresh the view, and the new rows appear only after a full browser refresh. REQ-027 fixed the adjacent case by invalidating the `assessments` and `terms` caches on create; **creating into an existing term changes the assessment list but not the term list**, so either that invalidation is not firing on this path or the refresh does not `await` it. **The pattern is recorded as worth more than either fix:** REQ-027 and REQ-043 are **the same defect — a mutation that does not refresh what it changed — separated only by which cache the flow happened to touch.** Fixing them one flow at a time will keep producing requirements, and the paths with no second cache to invalidate are exactly the ones that will not announce themselves. **Worth establishing whether every mutation path invalidates what it changes**, as a single pass rather than a defect per flow — the same shape as REQ-040 for `mat_aspects`, and to be scoped deliberately if the pattern holds a third time. **Note on versioning:** v2.19 already carried the other four items of this instruction (gate 4 results, REQ-033's reopening and corrected diagnosis, REQ-041, REQ-042) and they are unchanged here; only REQ-027 differed, so this is a new version rather than a rewrite of v2.19. |
| 2.19 | 30 August 2026 | **Gate 4.** **REQ-029 PASSES** on all four endpoints, including creation against lowercase-coded aspects and analytics trends. **REQ-038 PASSES** — header and description both update on rename. **REQ-033 FAILS and REOPENS with a corrected diagnosis.** The merged fix addressed a race between a closing `DropdownMenu` and an opening `Dialog`; **cancelling the delete — which never opens the destructive path at all — also leaves the application click-dead**, so the fault is not in how the dialog opens. **`pointer-events: none` is not removed from `body` when the dialog closes, on either path**, because two overlapping Radix layers each manage that lock and the second unmount clobbers the first's cleanup. **The next attempt must verify against `body`'s inline style directly** rather than reasoning about component lifecycle — the previous diagnosis was a plausible lifecycle story that survived because nothing checked the one attribute that defines the symptom. **REQ-027 REOPENED pending diagnosis, explicitly not recorded as a regression:** it passed gate 1 on this exact test, and the first task is to establish whether the failing flow is the same one that passed — a single assessment against an existing term, versus several against a term with no prior rows. **Those are different fixes**; reproduce before diffing. **REQ-041 added** to M1 (frontend): Save & Continue persists correctly but returns to the **first** standard rather than the next, making sequential rating unusable on a ten-standard aspect; scope is to advance to the next **unrated** standard and to **define the end-of-list behaviour explicitly** rather than let it fall out of the implementation. **REQ-042 added** to M1 (backend and frontend) as **🔴 HIGHEST PRIORITY IN M1**: the bearer token expires after 60 minutes without renewing on activity, and on expiry the application **fails silently and spins indefinitely** — no message, no redirect. Backend **reports options and trade-offs before implementing**, since sliding expiry, a refresh token and a longer TTL are three different security postures and §2.7 puts authentication changes in their own gate; frontend handles `401` explicitly and **never spins on an auth failure**, independent of the backend decision. **M2 interaction recorded:** REQ-013's external tier means Trustees logging in occasionally are the users most likely to arrive with an expired token, so REQ-042 settles the session model REQ-013 inherits — **coordinate rather than build auth twice.** |
| 2.18 | 27 August 2026 | **REQ-029 complete — and there were four endpoints and six sites, not two.** `GET /api/standards`, `GET /api/assessments/by-aspect` (**two sites in one handler**), `GET /api/analytics/trends` and `POST /api/assessments`; `GET /api/assessments` and `POST /api/aspects` were already correct. **`POST /api/assessments` did not fail silently, and that made it worse:** zero matched standards raised `404 "No standards found for aspect: X"` for an aspect that *has* standards, blocking assessment creation outright for every lowercase-coded aspect — `ab`, `ey`, `mck` in HLT — with a message sending the reader to the wrong table. **A silent empty list invites a second look; a confident error about missing standards does not.** The requirement was framed around silent failure and the loud instance was the more damaging one. **Root cause: `aspect_code` has no canonical casing.** `POST /api/aspects` uppercases on write, so the lowercase codes are **seeded data that predates or bypassed that path** — the same two-era seeding behind the UUID versus `{MAT}-{CODE}` split in primary keys. **REQ-040 added** to M2 (backend, audit): a single pass over `mat_aspects` and its endpoints to establish and enforce the table's invariants. Five defects have originated there and at least three share one shape — **an endpoint assuming an invariant the data never had.** Known instances: `aspect_code` casing, `is_custom` stored in four handlers and computed in two, primary keys in two formats, `source_aspect_id` holding an empty string. Scope is enumerate, test against production, report the gaps, produce SQL for the product owner — **and fix nothing in the audit pass**, since fixing as you go is what turned one root problem into five defects. **M2 not M1**, because it is investigation and M1 was closed to scope growth at v2.15. **REQ-033 and REQ-038 are confirmed unrelated to REQ-007.** REQ-033 is a Radix `Dialog` opened from a closing `DropdownMenu` leaving `pointer-events: none` on `body`; REQ-007 is `Popover`-in-`Sheet` stacking. Same symptom, different mechanisms — **one fix will not close both, and REQ-007's frontend scope does not shrink.** |
| 2.17 | 27 August 2026 | **REQ-012 CLOSES.** Verified in production: `/api/aspects/inactive` called as an **HLT** user returns one row, `Mock aspect`. Route ordering fixed, endpoint working, prior empty results explained by tenant scoping. Ticked in §8. **§2.2 gains a preamble and no tenth rule.** Rules 7, 8 and 9 were each added after a misdiagnosis and are **three instances of one thing: check the premise of the question before investigating the answer** — a claim asserted without checking what it rested on, an identifier reasoned about without being read, a result judged correct without establishing whose it was. The preamble states that general form once and marks 7–9 as **worked examples rather than independent rules**. Nothing renumbered; all existing §2.2.7, §2.2.8 and §2.2.9 citations survive. **The concern that prompted it, recorded rather than left implicit:** rules have been accruing faster than the defects they catch, and **a list long enough to skim is a list that stops being read**. A fourth instance belongs in a dev log as evidence the preamble is not landing, not here as rule 10. |
| 2.16 | 27 August 2026 | **The `/api/aspects/inactive` defect is RETIRED. Not fixed — it was never a defect.** `GET /api/aspects` returned six aspects, **all with `mat_id = 'OLT'`**; the call was authenticated as an OLT user, and OLT has six aspects. `/api/aspects/inactive` filters on `mat_id` from the same JWT, and OLT has no inactive default aspects — `Mock aspect` belongs to **HLT**. **The empty array was correct behaviour throughout**, and so was the 6-of-17 count: 17 is HLT's figure, asked as OLT. **What it cost: five hypotheses across four sessions** — route shadowing, MAT scoping, NULL flags, a swallowed exception, an environmental mismatch — three disproved by code reading and one by production query, **on an endpoint that was working.** **Nobody asked which tenant the token was scoped to**, despite the handler scoping on precisely that, and despite `get_current_mat` being read, quoted, and used to rule a hypothesis out. **§2.2 gains rule 9:** in a multi-tenant system, establish which tenant a result belongs to before reasoning about whether it is correct — an answer right for a different tenant is **indistinguishable** from a wrong answer, and the two produce identical evidence. Appended as 9 rather than inserted, so existing §2.2.7 and §2.2.8 citations stay valid. **REQ-012 closes once the same call is made as an HLT user and returns `Mock aspect`.** **REQ-032 is unaffected and its M2 placement stands** — its premise was questioned at v2.15 on the assumption that `GET /api/aspects` was under-returning; it was not, so the truncation is a display defect on complete data exactly as scoped. **REQ-039 added** to M2 (frontend and backend, belongs with REQ-013): **nothing in the application or the API response indicates which MAT the displayed data belongs to.** This caused the misdiagnosis above, and the risk grows in M2 because the superadmin tier is explicitly cross-tenant, so moving between MATs becomes routine — a platform-team member acting on the wrong trust's data is materially worse than a confused debugging session. Frontend: a persistent tenant indicator visible on **every** screen. Backend: **report** whether collection endpoints should carry the `mat_id` they are scoped to, noting that per-row `mat_id` was present and still went unread, while an **empty** collection carries no rows and therefore no tenant at all — the case that actually misled. |
| 2.15 | 27 August 2026 | **§2.4 gains a standing constraint: agents have no database access and never will.** They produce SQL for the product owner to run and interpret the results; they do not execute queries, migrations or diagnostics against any database. **A diagnostic requiring database access is written as a statement to hand over, not scoped as a task** — scoping one as a task produces a session that discovers its own inability and reports it, which is the whole of what it can do. **M1 SCOPE CLOSURE.** M1 is a stabilisation milestone that had accumulated feature work. **Five additions move to M2** — REQ-032 (pagination), REQ-034 (Expand All), REQ-035 (updater name), REQ-036 (expose default aspect deletion), REQ-037 (inactive aspects view). **Nothing renumbered:** requirements keep their ids and change milestone, and the blocks were relocated into §6's M2 section so the document does not claim otherwise. **What stays in M1 is what is broken:** REQ-007, REQ-009's backend half, REQ-028, REQ-029, REQ-030, REQ-033, REQ-038, the `/api/aspects/inactive` defect, DATA-001 and DOC-002. **The reasoning, recorded in §4.1:** M1 exists to make the platform trustworthy for the early adopter's return, and feature work displaces that — a milestone shipping an Expand All control alongside an unfixed 500 has misread its own purpose. **The `/api/aspects/inactive` defect has WIDENED and is no longer about the inactive endpoint.** Run against production with `mat_id` bound to `'HLT'`, the handler's complete query **returns the qualifying row**: SQL correct, data correct, `is_modified` and `standards_count` computing correctly, the `LEFT JOIN` dropping nothing, the deployed build current (`updated_at` present in the live spec) and `DB_NAME`/`DB_USER` matching the connection queried — **so the environmental hypothesis is dead too.** The larger finding: **`GET /api/aspects` returns 6 aspects for HLT, which has 17 active rows** — the **active** endpoint is dropping eleven, so **the aspects family is under-returning generally** and the single inactive row is presumably dropped by the same mechanism. **Pending: which six ids are returned, and whether the UI shows 17 or 6** — the second decides whether this is a broken endpoint or a screen the customer has been using with most of its data missing. **Four hypotheses now disproved** (route shadowing, MAT scoping, NULL flags, environment). **Add nothing further without evidence.** |
| 2.14 | 27 August 2026 | **Retracts two claims made in v2.13.** ① **The failed manual `UPDATE` was not an autocommit failure.** MySQL stores a backslash as an escaped pair, so `WHERE aspect_code = 'IT\DATA_ST'` matches **zero rows** — and a zero-row `UPDATE` **succeeds**. It was later applied by matching on `aspect_name`. The general rule now recorded: **any statement matching a value containing a backslash must account for escape doubling**, verification queries included, since a verification query with the same flaw confirms a change that never happened. The post-commit re-query requirement is **kept** — verifying effect rather than trusting a statement result is right regardless of cause, and this episode argues for it better than autocommit did, because the statement genuinely succeeded and no error handling would have caught it. Recording the real cause matters: autocommit would have sent the next person to check connection settings, which are fine. ② **The `%2F` decode diagnosis is DISPROVED and the §2.2.7 provisional label should not have been removed.** `HLT-IT/DATA_OP` retains a forward slash in its primary key and renames successfully, which the diagnosis said was impossible; what changed was `aspect_code`, not the id. **The original cause is not established.** The surviving hypothesis — that the frontend builds the path from `aspect_code` rather than `mat_aspect_id` — is recorded as provisional **with the evidence against it**: every link in the call site chain on this branch passes `mat_aspect_id` and none reads `aspect_code`, so gate 3 must resolve the contradiction rather than confirm the hypothesis, and the failing step may not be the `PUT` at all. **The REQ-010 migration is RETIRED, not deferred.** Both primary keys still contain the bad characters, but their `aspect_code` values were corrected manually and both aspects now rename normally, carry assessments and behave correctly. The migration would suspend foreign-key checks and rewrite primary keys across two tables under `ON UPDATE NO ACTION` — the highest-risk operation in this programme — to fix nothing observable. **Two standing caveats recorded, not acted on:** these ids will still break future code that interpolates them into a path unencoded, and neither aspect can be safely deleted, since `delete_aspect` archive-renames the primary key and would hit exactly the REQ-028 collision. The script is kept against either becoming real. **REQ-010 CLOSES with gate 2** and no longer spans two gates; gate 3 keeps its diagnostic task and REQ-028. **Gate 2 evidence recorded as complete:** validation rejects `IT/DATA`, `IT\DATA`, `IT & Data` and single-character codes, accepts `TEST_01`; `Governance` renames normally; the Standards and Users admin views are unaffected across all eleven call sites. |
| 2.13 | 27 August 2026 | ⚠️ **Two claims in this row are RETRACTED by v2.14: the `%2F` decode mechanism is disproved, not confirmed, and the failed manual `UPDATE` was escape doubling in a `WHERE` clause, not autocommit. The row is left as written because it records what was acted on.** — **Gate 2 result: REQ-010's encoding and validation half passes in production**, and the evidence ~~converts the migration's justification from analysis to observation.~~ The aspect with `aspect_code = 'IT/DATA_OP'` could not be renamed through the interface; after its code was changed manually to `IT_DATA_OP`, the rename succeeded. **The forward slash is confirmed as the cause by direct test** — the `%2F` decode mechanism carried a §2.2.7 provisional label across three plan versions and the label now comes off. **Consequence: the gate-3 migration's scope reduces to `IT\DATA_ST` alone**, since `IT/DATA_OP` is already repaired by that manual change; **verify that row still needs it before running**, because a primary-key rewrite matching zero rows should not be run. **REQ-010 remains OPEN** — only its gate-2 half is complete. **A Gate 3 block added to §2.7**, recorded at gate level rather than under one requirement because it spans three (REQ-010's migration, REQ-012's remaining endpoint, REQ-028) and the ordering between them matters. **Task 1 is diagnostic and comes before any migration runs:** three hypotheses for `/api/aspects/inactive` returning `[]` have been disproved and **the branch handler cannot produce a `200` with an empty array** — it re-raises as `500`, performs no post-fetch filtering, and has no fourth shadowing — so the deployed behaviour is not explicable by the branch code. Run the **complete** handler query, including the join, the computed `is_modified` and the `standards_count` subquery, with `%s` bound to the JWT's `mat_id`, against the database the deployed service connects to; if it returns the row the fault is environmental. **Do not read more code before running it.** **Task 2 adds a migration precondition:** a manual `UPDATE` against `mat_aspects` in Cloud SQL Studio **reported success and did not persist**, consistent with autocommit being disabled, so the migration **must end with an explicit `COMMIT` and must verify by re-querying after commit rather than trusting the statement result** — a migration that reports success without applying is the worst available failure mode for this change. **REQ-038 added** (M1, frontend): renaming an aspect updates the aspects list but not the page header, and the same applies to the description — stale local state after a successful mutation; same family as REQ-027 but a different surface, so check whether they share a cause and report. **DATA-001 gains a fourth row:** `Mock aspect` carries `source_aspect_id` as an **empty string rather than NULL**, an anomalous foreign-key value which is **the concrete instance of the two-definitions problem** — the computed `is_custom` tests `source_aspect_id IS NULL`, and `''` is not NULL, so the detail and update endpoints classify this row as a default while the stored column happens to agree; fix both together or neither. |
| 2.12 | 27 August 2026 | **REQ-028 restored to normal M1 priority — the v2.11 reduction is reversed because its premise was wrong.** `StandardsManagement.tsx:408-419` exposes Delete Aspect gated on `is_custom`, and custom is exactly the branch that archive-renames the primary key and collides with `fk_mat_standards_aspect`. **The exposed path is the broken one and the safe path is hidden:** a custom aspect with zero active and one or more inactive standards produces a 500 from the UI today, with no useful message. It still ships with the REQ-010 migration per §2.7, since both turn on the same FK. **REQ-036 split** — it was two pieces of work of different natures under one number. REQ-036 is now **expose deletion for DEFAULT aspects only**: deletion is already fully wired for customs, so this is exposure rather than construction, and **a product decision first — do not implement, surface the decision**, since hiding deletion for platform templates may be deliberate. **REQ-037 added** (M1, frontend): **build the inactive aspects view.** No equivalent of `InactiveStandardsModal` exists for aspects, yet `use-standards-persistence.ts:328` tells users on deactivation that they can reinstate "from the inactive aspects section" — **the application promises a capability it does not have.** Model on `InactiveStandardsModal`. REQ-036 now depends on REQ-037, not the reverse: exposing deactivation for defaults without somewhere to see the result would hide rows the user cannot then reinstate. **Recorded that `/api/aspects/inactive` has almost certainly never had a consumer**, which is the clean explanation for why its route shadowing survived while the standards equivalent — which does have one — did not. **REQ-012** records that REQ-037 gives the endpoint its first real consumer and makes UI verification possible, while noting the direct call closes REQ-012 sooner and remains outstanding. **REQ-030** records that it is the **third** literal-after-parameterised shadowing in `main.py`, which makes it **a property of the file rather than three separate errors**, and that the fix must avoid re-committing it. **REQ-013's test scope gains a second assertion:** that every literal path precedes its parameterised sibling — a short test catching a defect class this codebase demonstrably produces. **That is now the second independent argument for building test infrastructure in M2**; the first was that the external tier's write-blocking is otherwise unprovable. **REQ-035 is pending a decision, not an investigation:** `mat_standards` has `created_by_user_id` and no `updated_by`, so a schema change is confirmed necessary; `assessments.updated_by` is the pattern to mirror and the only open question is whether to copy it. |
| 2.11 | 27 August 2026 | **Gate 1 result recorded.** REQ-008, REQ-009 (frontend), REQ-011 (both halves) and REQ-027 **pass in production**. REQ-012's route ordering is **confirmed fixed against the live spec** and `/api/standards/inactive` passes — four deactivated defaults returned where previously none. Deleted **custom** standards are correctly excluded and the application warns at the point of deletion that customs are unrecoverable; **recorded as correct by design so it is not later "fixed"**. **`/api/aspects/inactive` is UNVERIFIED, not failed** — it was not exercised; one row is expected (`Mock aspect`), and **REQ-012 stays open** until it is called directly. **REQ-030 amended twice from gate 1:** the failure is a **405, not a 404** — `POST /api/standards/reorder` is matched by `GET /api/standards/{mat_standard_id}` with the id `reorder`, so the new endpoint **must be registered above the parameterised route**, the same shadowing class REQ-012 just fixed; and the frontend already surfaces the failure with an error toast, so frontend scope reduces to verifying the success path. **REQ-032 added** (frontend): the Assessments view truncates to 10 aspects with no pagination, scroll or total — silent truncation, fixed with a page-size selector, navigation, scrolling and a range/total counter. **REQ-033 added** (frontend): the application goes click-dead after deleting a standard until a full refresh, likely a dialog overlay that fails to unmount; investigate with REQ-007's unclickable date picker, which presents the same symptom, and report whether they share a cause. **REQ-034 added** (frontend, small): Expand All on Overview. **REQ-035 added** (backend then frontend): show who made the last update — **`mat_standards` has `created_by_user_id` but no `updated_by`, so this needs a schema change**; `assessments.updated_by` is the precedent to mirror, and the agent reports before implementing. **REQ-036 added** (frontend, lowest priority, last in M1, deferrable): aspect deletion — **corrected against the code, deletion is already exposed for *custom* aspects and missing only for defaults**, so the scope is exposure and a product decision, not building the flow. **REQ-028's reachability corrected**: the latent 500 is **not** unreachable — deletion is exposed for customs, which is exactly the archive-rename branch that triggers the FK failure; priority is lowered as instructed but the defect is user-facing. **REQ-013 gains** the role-determined default landing view: central team to Overview, school-based including Headteachers to Assessments, both reachable by everyone. **Open question recorded** under REQ-036: no `InactiveAspectsModal` exists while `InactiveStandardsModal` does, and a toast promises an "inactive aspects section" that was never built — so `/api/aspects/inactive` has likely never had a consumer, which explains why its shadowing went unnoticed. |
| 2.10 | 27 August 2026 | **REQ-030 added** to M1 (backend and frontend): the frontend persists drag-and-drop reordering by calling `POST /api/standards/reorder`, which **does not exist anywhere in the backend** — confirmed by testing, reordering has never persisted. Backend builds the endpoint, applying a set of `sort_order` values **in a single transaction** (a partial application leaves the list in an order nobody chose) and **without bumping `updated_at`**, which the `ON UPDATE CURRENT_TIMESTAMP` default makes a deliberate act rather than a default. Frontend surfaces the failure instead of swallowing it. Records the verdicts on all three paths sharing the `sort_order` name so they are not confused again: create is legitimate and stays; the `PUT` field is dead and is **removed from the model** rather than implemented, since a single-record `PUT` is the wrong shape for a multi-record operation; the reorder endpoint is built. Removing the `PUT` field needs **no contract change** — §16 never documented it, so the model was over-declaring against a contract that was already correct. **REQ-031 added** to M1 (frontend, small, assigned to the frontend agent): `VersionHistoryModal.tsx` still carries the `|| new Date()` fabrication REQ-011 removed from the standards card; both agents scoped it out, so it belonged to nobody. **REQ-011** records that its third scope item required no code — five writers touch `updated_at` and all are material, and there is no `sort_order` write path at all, so the settled definition was **already satisfied by accident**; the reason is that reorder does not persist, so REQ-030 inherits the real work. **§2.2 gains point 8:** establish what an identifier actually contains before reasoning about a failure involving it — users report by the visible label, the system routes on a value they cannot see, and reasoning about the reported string is the failure mode. Appended rather than inserted, so existing §2.2.7 references stay valid. |
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