# Session — REQ-011 (backend) and milestone plan v2.9 — Backend

**Date:** 2026-08-27
**Agent:** Claude Code
**Milestone:** M1
**Version after this session:** **1.43.3** (REQ-011). Records a merge, not a deployment — see §2.6.
**Deployed:** no
**Contract version worked against:** assurly-api-contract.md v2.7 at open, **v2.8 at close**

---

## What this session was for

Unblock REQ-011's merged frontend half, which had removed the `|| new Date()` fallback and
was consequently rendering `Updated —` for every standard, and then apply the plan edits
arising from the production data that settled REQ-010's `IT & Data` case.

**First session under §2.5's plan-edit rule and the new `Deployed:` field.**

## What changed

**REQ-011 backend — `d435db2`**

- `main.py` — `ms.updated_at` added to the `GET /api/standards` SELECT.
- `main.py` — `updated_at: Optional[str]` added to `MatStandardResponse`. Both are required:
  the `response_model` strips undeclared fields, so either alone changes nothing.
- `main.py` — serialised in the mapping loop as `%Y-%m-%dT%H:%M:%SZ`.
- Contract **v2.7 → v2.8** — §13 field row and JSON example, plus a changelog entry.

**Plan v2.8 → v2.9 — see the changelog row.** §2.4 identifier constraint; §2.5 plan-edit
entries and the `Deployed:` field; §2.6 the version-source flag; §2.7 the split-gate rule made
explicit; REQ-010's settled cause, reversed split and minting convention; REQ-029 and DATA-001
added; §8 and the M1 lists reconciled.

**Schema changes:** none.

**Contract changes:** `GET /api/standards` gains `updated_at`. **Additive — no existing field
changed**, so nothing already built against §13 breaks. The frontend needs to know it can now
bind the standards card to a real value.

## What was deliberately not changed

- **`GET /api/standards/inactive`.** It shares `MatStandardResponse` and will therefore report
  `updated_at: null` until its own query selects the column. One line, but outside REQ-011's
  stated scope. Recorded in the contract changelog rather than silently fixed.
- **`created_at`**, which is equally absent and equally free to add. Not asked for.
- **Known Issue #12.** The single-standard endpoint still omits `standard_type` from both its
  response dict and its versions array, despite selecting both. Same endpoint family, already
  in §7 for triage.
- **`VersionHistoryModal.tsx`**, which carries the same `|| new Date()` pattern. Frontend, and
  the frontend agent's log records it as deliberately out of their brief too — so it is
  currently nobody's, and worth assigning.
- **The three DATA-001 rows.** Recorded in the plan; no SQL written or run, as instructed.

## Root cause

The timestamp was genuine in the database and fabricated at the point of display. Neither
layer was individually absurd — the backend simply never selected a column nobody had asked
for, and the frontend chose a plausible default over an empty cell. The defect only existed in
the gap between them, which is why it survived: each half looked reasonable in isolation.

## Assumptions made

- **1.43.3 recorded for REQ-011.** Merge, not deployment; `Deployed: no`. This is the first
  entry where those two facts are separable in the record rather than only in prose.
- **The `%2F` decode mechanism is provisional** (§2.2.7), and is labelled as such in the plan
  where it is claimed. That uvicorn unquotes `%2F` to `/` before Starlette matches — and so
  that encoding cannot rescue `HLT-IT/DATA_OP` — is analysis. **The remedy does not depend on
  it** (the row needs renaming either way), but the explanation does. Confirmed by testing
  that row after gate 2.

## Findings — flagged, not fixed

- **Reordering standards cannot be saved. The endpoint does not exist.** The frontend persists
  drag-and-drop by calling `POST /api/standards/reorder` (`assessment-service.ts:295`); there
  is no such route in `main.py`, and `grep -rn "reorder" assurly-backend/` returns nothing at
  all. Every reorder fails. **This is a live defect with no requirement covering it** — found
  only because REQ-011 asked what writes `sort_order`.
- **`sort_order` has no write path in the backend whatsoever.** It appears in the INSERT and in
  `ORDER BY` clauses; no `UPDATE` ever sets it. `MatStandardUpdate` declares the field and the
  PUT handler **silently ignores it** — a request that sets only `sort_order` returns `200`
  having changed nothing.
- **REQ-011's third scope item was therefore vacuous.** "Stop bumping `updated_at` on
  `sort_order`-only writes" has nothing to act on, because no such write exists. The settled
  definition still holds and is now documented in the contract; it simply required no code.
  Recording this rather than reporting the item as done.
- **`GET /api/standards/inactive` will report `updated_at: null`** while advertising the field
  via the shared response model.

## What the next session needs to know

- **REQ-011 is code complete on both halves** and needs gate 1. Once deployed, the standards
  card should show real dates; if it still shows `—`, the cause is `updated_at` being genuinely
  null on those rows, not the plumbing.
- **REQ-010's priority order has flipped.** The validation half now matters more than the
  migration: validation is the only thing preventing a third unreachable row, while the
  migration cleans up the two that exist. Both are still required.
- **The reorder defect needs a requirement number** if it is to be fixed. It is not covered by
  anything currently in the plan.
- **DATA-001 is the product owner's**, and REQ-029 interacts with it — the lowercase `ab` code
  is one of the rows that silently filters to empty today.

## Verification

**Ran, and passed:**

- `python3 -m py_compile assurly-backend/main.py` after each edit.
- **Confirmed what writes `updated_at` before changing anything**, as instructed — five
  writers, enumerated by grepping every `UPDATE mat_standards` with context: the content edit
  in `PUT /api/standards/{id}`, the archive-rename and deactivate branches of delete,
  reinstate, and the column's own `ON UPDATE CURRENT_TIMESTAMP` firing on the
  `current_version_id`-only write. All material; all left alone.
- **Route enumeration** confirming `POST /api/standards/reorder` does not exist, cross-checked
  with a repository-wide search for `reorder` in `assurly-backend/`.
- **Checked which of the two identical SELECT blocks the edit landed in.** The list and
  `/inactive` handlers share their query shape, so the first edit matched twice and was
  rejected; re-targeted on the `is_active = TRUE` clause. Worth noting because a careless
  `replace_all` here would have silently modified the wrong endpoint.
- §8 ticks re-checked after every plan edit; §2 section numbering re-checked after inserting
  the §2.4 constraint.

**Not run, and not claimed:**

- No database, no runtime, no deploy. The serialisation format is reasoned from the column type
  and matched to the convention used elsewhere in the file; it has not been observed.
- `tsc`/`eslint` not re-run — no frontend files were touched this session.

---

## Notes for the release summary

*The standards admin screen now shows when each standard was actually last changed, instead of
always showing today.*
