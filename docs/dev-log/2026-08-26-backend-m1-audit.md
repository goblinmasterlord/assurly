# Session — M1 backend audit (REQ-006, REQ-008 → REQ-012) — Backend

**Date:** 2026-08-26
**Agent:** Claude Code
**Milestone:** M1
**Version after this session:** no bump — diagnostic session, nothing shipped
**Contract version worked against:** assurly-api-contract.md v2.5

---

## What this session was for

Diagnostic pass over six of the seven M1 defects, to establish root cause and blast radius
before any of them is scoped for implementation. REQ-007 was excluded, having been settled
in the AUD-001 session.

## What changed

No application code, no migrations, no documentation outside the two files below.

- `docs/milestones/m1-audit-backend.md` — new. Per-requirement findings: current behaviour,
  root cause with a confidence level, files and tables affected, proposed fix, blast radius,
  and whether the fix crosses into the frontend.
- This log entry.

**Schema changes:** none.

**Contract changes:** none. One severe contract-versus-code divergence was found and is
recorded as a finding, not resolved — see below.

## What was deliberately not changed

- **The contract, despite finding it wrong.** Contract §28–31 and data model §17 both assert
  the four evidence endpoints are live and shipped. They do not exist. Per the standing
  scope guard the contract is authoritative and the code is wrong, so this is recorded for
  triage rather than reconciled by editing either document.
- **`GET /api/standards/inactive`**, which is shadowed by exactly the same route-ordering bug
  as REQ-012 and is a one-line fix in the same file. Flagged for the product owner to fold in
  or schedule; not folded in unilaterally.
- **The `aspect_code` casing inconsistency** across three endpoints (one case-insensitive,
  two not). Adjacent to REQ-008, outside it.
- **Known Issue #12** (`standard_type` omitted from the single-standard response), a natural
  companion to REQ-011's fix in the same endpoint family. Named, not folded in.
- Everything else. This was a diagnostic pass; the instruction was to write no application
  code and it was followed.

## Root cause

Six findings, in the summary table of the audit file. The two that change planned work:

- **REQ-006 is not a port.** The backend evidence endpoints have never existed — 42 routes in
  `main.py`, none of them evidence, no GCS client, no Google SDK in `requirements.txt`. With
  the frontend client unrecoverable, REQ-006 is a build of both layers from nothing, not a
  restoration of one.
- **REQ-012 is a routing bug, not a conceptual one.** The audit note hypothesised that
  aspects might be hard-deleted, leaving the inactive view nothing to return. They are not:
  both deletion branches are soft, and §11 records 14 inactive rows in production. The 404
  comes from `/api/aspects/{mat_aspect_id}` being registered at line 2105 and
  `/api/aspects/inactive` at line 2502 — Starlette matches in registration order, so the
  literal route is unreachable.

REQ-010's hypothesis was also rejected: the rename route keys on ID in both layers, not on
name. The reported symptom is real but arrives by a different mechanism — the ID is minted
from an unsanitised user-supplied code and then interpolated into a URL path without
encoding.

## Assumptions made

- **Nothing in this audit was executed.** No database, no local runtime, and production was
  not called. The brief asked for a direct multipart POST, a direct filter call and a
  reproduction of the rename 404; all three are writes to live tenant data or need a bearer
  token, and none was attempted. Every finding is static analysis, and each carries an
  explicit confidence level in the audit file. Four findings are certain from code alone
  (they depend on registration order, an exhaustive `CASE`, an absent route, and an absent
  field); two need a live check.
- **The `&` half of REQ-010 is not fully explained**, and the audit says so rather than
  stretching the backslash mechanism to cover it. `\` is normalised to `/` by the browser's
  URL parser, which fully accounts for `IT\Data`. `&` is a legal path character and should
  reach the handler intact. Either the stored code differs from the display name, or an
  intermediary is involved, or the two reported cases share a symptom and not a cause.
- **Deployed-versus-`main` divergence is unknown.** All conclusions describe the code on
  `sprint-2.0`. If the deployed Cloud Run revision does expose `/evidence/*`, the deployment
  has diverged from the repository, which would be a larger problem than REQ-006 itself.

## Findings — flagged, not fixed

Full detail in `docs/milestones/m1-audit-backend.md`. Beyond the six requirements:

- **The dashboard's `evidence_count` has been sourced from a table no shipped code can write
  to.** It has been a constant zero for every tenant since it shipped.
- **`GET /api/standards/inactive` is shadowed** identically to REQ-012's aspects route. The
  other parameterised routes were checked; `/api/users/me`, `bulk-update` and `by-aspect` are
  all safe. Those four are the only literal-after-parameter collisions in the file.
- **`aspect_code` is filtered case-insensitively on `/api/assessments` but case-sensitively on
  `/api/standards` and `/api/assessments/by-aspect`.** Codes are stored uppercase, so the
  latter two return empty rather than erroring on a lowercase parameter.
- **The group `due_date` uses `MAX`, which is the wrong aggregate** for "is anything here
  overdue" and is already producing a misleading contract-documented field today,
  independently of anything REQ-009 changes.
- **`mat_standards.updated_at` fires on any row modification**, including reorder drags. If
  the product intent is "last meaningfully edited", `standard_versions.effective_from` is the
  better source — worth deciding before the field is surfaced and users start trusting it.
- **`python-multipart` is in `requirements.txt` with no multipart handler anywhere in the
  backend** — the dependency an upload endpoint would need, without the endpoint.
- **The v1.5–v1.8 contract reconciliation passes removed `🚧 In-flight` tags on the basis
  that work had shipped, and at least one of those judgements was wrong** (REQ-003/evidence).
  Worth re-checking the others before they are trusted.

## What the next session needs to know

- **Re-estimate REQ-006 before committing M1.** The plan currently frames it as a port from
  `claude/review-backend-brief-mjtms`. That framing is wrong twice: the branch is unreachable
  from origin, and even recovered it holds only the frontend half.
- **REQ-010 needs a data migration**, not just a code fix. Existing `mat_aspects` rows with
  special characters in the primary key stay broken otherwise, and that is probably the whole
  reported symptom. Primary-key rewrite with dependent foreign keys — it needs a rollback
  note, and per §2.4 an agent writes the SQL but does not run it.
- **REQ-012 and REQ-011 are both cheap and both backend-first.** REQ-012 is two moved
  decorators with no data change; REQ-011 is two added fields plus removing a frontend
  fallback. Either could ship immediately.
- Four open items need database or production access; they are listed at the end of the audit
  file. Two of them have been outstanding since AUD-001.
- Nothing is blocked by this session. Nothing was changed by it.

## Verification

Diagnostic session, so verification means establishing that the negative findings are real
rather than an incomplete search:

- **Every route in `main.py` was enumerated** by grepping the decorators, not sampled — 42
  routes, none of them evidence. This is the basis for the REQ-006 finding, so a partial
  search would have been worthless.
- The GCS absence was checked three independent ways: `requirements.txt` contents, the import
  block at the top of `main.py`, and a repository-wide search for `standard_evidence` usage.
- The route-shadowing finding was verified by reading the actual decorator line numbers
  (2105 versus 2502; 1181 versus 1926) rather than inferring from file order, and **all**
  parameterised routes were then checked for the same pattern so the report could state which
  are safe.
- REQ-010's chain was traced end to end across both layers — ID construction at `main.py:2177`
  → the unvalidated Pydantic field → the Zod schema that only checks length → the unencoded
  interpolation at `assessment-service.ts:377` → the encoded counterpart in
  `actions-service.ts` that proves the pattern was known.
- REQ-011 was confirmed at all three layers: the column exists in the data model, the SELECT
  and the `response_model` both omit it, and the frontend fallback that manufactures today's
  date was read directly.
- `vercel.json` was checked and ruled out as a cause for REQ-010 rather than assumed
  irrelevant.
- **Not verified by execution — none of it.** See Assumptions. No endpoint was called, no
  query run, no upload attempted.

---

## Notes for the release summary

*No user-facing change. Diagnostic only.*
