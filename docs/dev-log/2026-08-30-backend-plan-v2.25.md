# Session — Milestone plan v2.25 (REQ-047) — Backend

**Date:** 2026-08-30
**Agent:** Claude Code
**Milestone:** M1
**Version after this session:** no bump — documentation only
**Deployed:** no — plan edits are not deployable
**Contract version worked against:** assurly-api-contract.md v2.11

---

## What this session was for

Add one M1 requirement. **The instruction asked for the premise to be established before the
display is changed; I established it before the requirement was written**, which is cheaper and
changes what the requirement says.

## What changed

`docs/milestones/assurly-milestone-plan.md`, **v2.24 → v2.25.**

- **REQ-047 added** to M1, between REQ-031 and REQ-033 in §6.
- **REQ-035 gains a note** distinguishing it, so the two are separable from either side.
- §4's M1 row and §8.

**No code. No contract change** — REQ-047 will need one when it is built.

## The premise check changed the requirement

The brief framed a fork: **either the display reads the wrong column, or `updated_by` is not
populated and populating it is the substantive work.** Reading the code, **neither branch is what
is happening.**

| Claim | Established |
|---|---|
| `updated_by` is populated on write | **Yes** — `main.py:3473` and `:3551` both set it beside `last_updated = NOW()` |
| The frontend reads the wrong field | **No** — `AssessmentDetail.tsx:1756` and `:1920` read `updated_by_name` **first** |
| A name for `updated_by` exists in the API | **No** — and this is the defect |

`assigned_to` and `submitted_by` each have a `LEFT JOIN` producing a `_name` alias.
**`updated_by` has none.** `GET /api/assessments/{assessment_id}` selects the raw id
(`main.py:3246`) and no endpoint returns a name at all.

**So the display is not choosing the assignee — its fallback chain is landing on the last rung**,
because the rung it wants was never built. The work is a join, not a write path and not a
display fix. **Recorded that way in the requirement**, because "fix the display to read
`updated_by`" would have produced a session that finds the display already correct.

**This is the fourth time a premise stated in a brief has not survived contact with the code** —
after REQ-028's "no UI exposes aspect deletion", REQ-036's "build the flow", and REQ-030's
shadowing. **The pattern in all four is the same: the symptom was described accurately and the
mechanism inferred from it was not checked.** That is §2.2's preamble, and this session is the
cheap version of it — the check cost four greps, before anyone was scoped to the wrong task.

## What I added that the brief did not ask for

**The NULL case, written as a decision the implementing session must state.** `updated_by` is
written only on `UPDATE`, never on `INSERT` (data model §15), so an assessment nobody has edited
has no updater — legitimately, not as a fault. The data model records **1142 of 1198 rows NULL**
as of April 2026.

**Without naming it, the implementation will inherit today's accidental answer** — fall back to
the assignee — which is the exact untruth the requirement exists to remove. **REQ-041 is the
precedent:** its end-of-list behaviour was scoped as "decide and state", and had it not been, the
behaviour would have fallen out of whichever branch was written first.

## What was deliberately not changed

- **No code.** REQ-047 is scoped, not built.
- **REQ-011's block.** REQ-047 is the same family — a field asserting something about editing
  that is not true — and is cross-referenced, but REQ-011 is closed and gate-passed and does not
  reopen.
- **The `submitted_by_name` middle rung.** It may be the right answer for the NULL case; that is
  the decision the requirement asks for, not one to make here.

## Findings — flagged, not fixed

- **Three user-reference columns on `assessments`, two with name joins and one without.** The
  asymmetry is the whole defect, and nothing marks it — a reader of the query sees two `_name`
  aliases and a bare id, and has to notice the third is missing. **The same shape may exist on
  other endpoints**; not checked, and out of scope here.
- **`GET /api/assessments` — the grouped list — does not return `updated_by` at all**, in any
  form. If the assessments *page* rather than the detail view is the surface being reported, the
  join has to be added there too. **The requirement says "the endpoints that feed these two
  surfaces" rather than naming one**, deliberately, because I could not establish from the code
  alone which view the report came from.
- **The fallback chain is four deep** (`updated_by_name` → `submitted_by_name` →
  `assigned_to_name` → newest standard's assignee → em dash). **A chain that long always renders
  something**, which is why a missing field at the top produced a plausible name rather than a
  visible gap. **Long fallback chains convert missing data into wrong data**, and that is worth
  more attention than this one instance.

## What the next session needs to know

- **Do not start by changing the display.** It is already correct. Start at the SQL.
- **Establish which surface was reported** — the detail view and the grouped list need different
  joins, and only one of them currently returns the column at all.
- **Decide the NULL case and write it in the requirement before implementing it.**
- **REQ-035 is not this.** Standards have no `updated_by` column; that one is a migration.

## Verification

- Every claim in REQ-047 read from the file and line named beside it. **Nothing was taken from
  the brief without checking it**, which is the point of the session.
- REQ-047 placed in §6 between REQ-031 and REQ-033, in §4's M1 row, and in §8 above DATA-001.
- **The distinction from REQ-035 is recorded in both blocks**, not just in REQ-047 — a
  distinction written on one side is found only by whoever already knew.
- **§8 rows containing a tick: 15, unchanged.** REQ-047's row carries none.
- **Not verified:** how many `assessments` rows currently have a non-NULL `updated_by`. Needs
  production (§2.4), and it decides how visible the NULL case will be in practice.

---

## Notes for the release summary

*No user-facing change. Planning only.*
