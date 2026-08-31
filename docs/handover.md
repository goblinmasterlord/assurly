# Assurly — Orchestration Handover

**Date:** 31 August 2026
**Purpose:** Context for a fresh orchestration session picking up mid-programme
**Status:** M1 nearly closed, M2 not started

---

## 1. What this document is

The living documents describe *what* is being built. This describes *how the work runs* — the things that are true but written nowhere, and the mistakes that have already been paid for.

Read this alongside, not instead of:

| Document | Role |
|---|---|
| `docs/milestones/assurly-milestone-plan.md` | Plan of record. Requirements, milestones, gates, operating rules. Read §1–3 and §2.2 in full. |
| `docs/api/assurly-api-contract.md` | Authoritative API contract |
| `docs/assurly-data-model.md` | Authoritative schema |
| `docs/project-structure.md` | **Descriptive only.** Out of date, refresh pending under DOC-002. |
| `docs/dev-log/` | One file per session. The real history. |

Nothing below duplicates those. Where they disagree with this document, they win.

---

## 2. The shape of the work

Three parties, and the boundaries matter.

**The product owner** is Head of Data Analysis, not a developer. He makes every product decision, runs all SQL by hand in Cloud SQL Studio, deploys, and does all UAT. He does not read code and should not be asked to. When a question needs code read, that goes to an agent. When it needs a database, that goes to him.

**The orchestration layer** — this session — sits between the customer and the coding agents. Its job is:

- Translate customer tracker items into requirements the agents can act on, and translate agent findings back into language a school leader can read.
- Write the prompts. The product owner sends them verbatim; he does not compose them.
- Decide sequencing, gates, and what runs in parallel.
- Push back. The product owner is explicit that he wants disagreement where it is warranted, not compliance.

**Two coding agents.** Claude Code owns the backend, the API contract and the data model bible. Cursor owns the frontend and never writes to those two documents. Both work on `sprint-2.0`; there is one branch for the whole programme.

### Hard boundaries

- **Agents have no database access and never will.** They write SQL for the product owner to run. Three briefs were wasted scoping database diagnostics as agent tasks before this was written into §2.4.
- **Agents do not deploy.** They cannot confirm anything in production.
- **Agents do not declare a gate passed.** The product owner runs gates and declares results.
- **No customer language reaches the agents.** No tracker numbers, no stakeholder names, no "Rich says". Requirements are stated as symptoms and evidence.

---

## 3. What burned time, and why

This is the most useful section. Four failure patterns, all of which recurred.

**Asserting a mechanism in a brief.** Four requirements — REQ-028, REQ-030, REQ-036, REQ-047 — were scoped with a stated cause that did not survive contact with the code. The symptom was accurate every time. A brief that asserts a mechanism scopes the session to the wrong work before it begins. State the symptom and the evidence; mark any proposed cause as a hypothesis to be tested. This is now in §2.2's preamble.

**Reasoning about the reported string rather than the routed value.** Two sessions chased an ampersand in `IT & Data` because that is what users see. The failing character was a forward slash in `aspect_code`, which nobody had read. Establish what an identifier actually contains before reasoning about a failure involving it.

**Not establishing the tenant.** Four sessions and five hypotheses were spent on `/api/aspects/inactive` returning an empty array. The endpoint was working. The call was authenticated as OLT; the expected row belonged to HLT. In a multi-tenant system, an answer that is right for a different tenant is indistinguishable from a wrong answer.

**Removing a provisional label on a test that could not have failed.** The `%2F` decode diagnosis was marked confirmed after a test that changed `aspect_code` — while the diagnosis was about the primary key, which never changed. Before removing a provisional marker, check the confirming test would have produced a different result had the claim been false.

All three specific rules are §2.2 items 7, 8 and 9, under a preamble stating the general form. **Do not add a tenth.** Rules were accruing faster than the defects they caught; the preamble is the deliberate alternative and its own effectiveness is unproven.

---

## 4. Environment facts that are not obvious

- **One Cloud Run service, named `assurly-frontend`, which serves the backend.** The actual frontend is on Vercel. This misnaming has caused confusion twice, including a stale `.env.example` note claiming evidence upload was handled "externally".
- **API docs are at `/api/docs`, `/api/redoc`, `/api/openapi.json`** — not the FastAPI defaults. The default paths 404.
- **The live OpenAPI spec is the fastest production check available** and needs no credentials. Use it to confirm a deploy landed, to check route registration order, and to see whether a field reached the response model. It cannot show dependency-based security, so it understates authorisation.
- **`SUPER_ADMIN_EMAILS`** is the existing superadmin mechanism, an environment variable allow-list checked by `verify_super_admin`. Deny-by-default. M2's role model should extend it, not build a parallel one.
- **`GCS_EVIDENCE_BUCKET`** is set in the deployed image. The bucket exists; upload once worked.
- **MySQL escapes backslashes.** A `WHERE` clause matching a value containing `\` needs `\\`, or it silently matches zero rows and reports success. This cost a session.
- **`autocommit=True`** is set on the DB config, so every `rollback()` in `main.py` is a no-op and no multi-statement handler is transactional. Recorded as REQ-046 in M2.
- **Version numbers are fictional.** Nothing in the repository or the application tracks a version; the product owner types it in. The target is 2.0 at M8 close.

---

## 5. Tenant data quirks

Production data violates invariants the code assumes. Five defects have originated here.

- **HLT was seeded twice.** `mat_aspects` contains two eras of primary key: UUIDs and `{MAT}-{CODE}`. The split does not track `is_custom` — some defaults carry UUIDs, others carry `HLT-`. **No code may infer anything from the shape of an id.**
- **`aspect_code` has no canonical casing.** Lowercase (`ab`, `ey`, `ld`, `mck`) and uppercase (`EDU`, `FIN`) coexist. `POST /api/aspects` uppercases on write, so the lowercase codes predate or bypassed that path.
- **Two rows carry unsanitised primary keys permanently:** `HLT-IT/DATA_OP` and `HLT-IT\DATA_ST`. Their `aspect_code` values were corrected manually; the keys were not. The migration to fix them was written and deliberately retired as too risky for no observable benefit — it sits in `docs/archive/`. These rows will break any future code that interpolates an id into a URL path without encoding, and they cannot be safely deleted until REQ-028 lands.
- **`is_custom` has two definitions.** Four handlers read the stored column; two compute it from `source_aspect_id IS NULL`. At least one row has `source_aspect_id = ''` — an empty string, not NULL — so the two disagree.
- **`due_date` was null on all 1,921 pre-existing assessments.** Non-use, not a defect; the create path persists correctly.
- **DATA-001** records tenant cleanup for HLT: a "Mock aspect" marked as a default, "Attendance & Behaviour" duplicated under two codes, a trailing space in "Curriculum and Teaching".

REQ-040 in M2 is a systematic audit of this table's invariants. It exists because fixing these one at a time has not worked.

---

## 6. The evidence feature — why REQ-017 is a rebuild

Worth knowing because the plan states the conclusion without the history.

Evidence upload worked in May 2026. A file reached GCS and a row reached `standard_evidence`. The code that did it was never merged: the backend lived in a Cloud Run revision that has since been replaced, and the frontend client lived on a local branch that no longer exists anywhere. The container image could not be unpacked; recovery was abandoned.

Meanwhile the API contract, the changelog and the data model all asserted the endpoints were live. They were not. DOC-003 corrected that.

The table schema is already correct — keyed on `mat_standard_id + school_id + unique_term_id`, which is exactly the per-standard grain REQ-017 needs. **No migration.** The work is building the endpoints and the client from nothing.

One thing to carry into it: an endpoint with no consumer cannot fail visibly. Both aspects endpoints were broken for months because nothing called them. REQ-017's backend will be in that position until its frontend lands — build the two halves close together.

---

## 7. State of play

**M1 remaining:** REQ-007 frontend half, REQ-049, REQ-050, REQ-028, DATA-001, DOC-002.

**Shipped but unverified:** REQ-042 (session expiry). The 401 handler, proactive renewal and redirect are all merged; none is confirmed in production. Gate 5 testing failed on both paths, the failures were not reproducible, and further testing is parked by decision. If a user reports an indefinite spinner or an unexplained logout, look here first.

**M2 has accumulated deliberately:** REQ-013 (role model), REQ-032, REQ-034, REQ-035, REQ-036, REQ-037, REQ-039, REQ-040, REQ-044, REQ-045, REQ-046, REQ-048. M1 was closed to scope growth after it grew from seven requirements to seventeen; additions since then have gone to M2 rather than expanding the milestone again.

**M2 opens with a decision:** minimal pytest infrastructure. There are four tests in the repository and none covers permissions. The external tier's entire value is that writes are blocked at endpoint level, and that claim is currently unprovable. A route-collision test was also planned — note it must assert on *same-method* collisions only, or it will flag correctly-working endpoints.

---

## 8. The customer relationship

Harbour Learning Trust are the early adopters. Rich (RBR) is the primary stakeholder; SS, HH, BW and TW also report. They are on holiday and return shortly — M1 exists to make the platform trustworthy before they do.

Tracker items 24–40 map to requirements as follows: 29→REQ-008, 30→REQ-007, 31→REQ-025, 32/37→REQ-014, 33/34→REQ-017, 35→REQ-018, 36→retired into REQ-017, 38→REQ-016, 39→REQ-010, 40→REQ-013, 24→REQ-019, 25→REQ-020, 26→REQ-021, 27→REQ-022, 28→REQ-023.

**The tracker never reaches the agents.** Requirements are written in platform terms. Note also that customer vocabulary does not match the platform's: what they call a "standard" is usually an aspect, and what they call a "statement" is a standard. Getting this wrong produces a requirement for a hierarchy level that does not exist.

Roughly half the defects fixed in M1 were never reported by anyone — found while fixing something else, or by the product owner testing. That is worth saying to the customer, and it is worth remembering when estimating: the reported list understates the work.

---

## 9. Conventions worth not relearning

- **Gates, not per-commit deploys.** Low-risk work bundles into one test pass. Schema changes, migrations, and anything touching auth or permissions deploy alone. §2.7.
- **One commit per requirement**, prefixed `REQ-`, `AUD-`, `DOC-`, `SEC-`, `DATA-` or `PLAN-`. Commit when work is complete rather than holding it for tidiness — an ephemeral container has lost work before.
- **Dev log per session, including audits and plan edits.** Two sessions closed without one and a later requirement started from nothing as a result.
- **Superseded plan versions are never rewritten.** Retractions are marked in place. A changelog that quietly corrects itself is worth less than one that shows where it was wrong.
- **Flag, don't fix.** Adjacent findings go in a Findings section. This is why the plan has grown; it is also why nothing has been silently changed.