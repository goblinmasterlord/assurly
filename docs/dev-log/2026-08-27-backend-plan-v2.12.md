# Session — Milestone plan v2.12 — Backend

**Date:** 2026-08-27
**Agent:** Claude Code
**Milestone:** M1
**Version after this session:** no bump — documentation only
**Deployed:** no — plan edits are not deployable
**Contract version worked against:** assurly-api-contract.md v2.9

---

## What this session was for

Act on the two corrections raised at the end of the v2.11 session. Both were accepted, and
both changed the shape of a requirement rather than just its wording.

## What changed

`docs/milestones/assurly-milestone-plan.md`, **v2.11 → v2.12** — see the changelog row.

- **REQ-028** restored to normal M1 priority; the v2.11 reduction reversed.
- **REQ-036 split.** It keeps the exposure question; the view-building half becomes **REQ-037**.
- **REQ-037** added (M1, frontend).
- **REQ-012** records that REQ-037 gives `/api/aspects/inactive` its first consumer.
- **REQ-030** records the third-instance framing.
- **REQ-013's test scope** gains route-ordering as a second assertion.
- **REQ-035** reframed as pending a decision rather than an investigation.
- §8, the M1 lists and the §4.1 count updated.

**Schema changes:** none. **Contract changes:** none.

## What was deliberately not changed

- **No code.** Every item here is a scope or priority record.
- **REQ-036's implementation.** It is explicitly marked *do not implement, surface the
  decision* — the requirement's own instruction, and the right shape for a change that may
  turn out to be intentional behaviour.
- **The `use-standards-persistence.ts:328` toast.** It is REQ-037's to fix or REQ-036's to
  make true; correcting it in isolation would leave the underlying gap.

## Root cause

Not a defect session, but the two reversals share a cause worth naming, because it is the
third time this pattern has produced a wrong entry in this plan.

**A capability was judged absent because its entry point is conditional.** Aspect deletion is
not missing — it is behind `{currentAspect.is_custom && …}`. The same shape produced REQ-010's
two-session misdiagnosis (a value judged safe because the *visible label* looked safe) and the
"no UI exposes aspect deletion" premise here. §2.2.8 was written for the identifier case; the
general form is **do not conclude something does not exist from not having found it — find the
condition under which it does.**

Notably, the correction made REQ-028 **worse**, not better: the gate that hid deletion from
view is the same gate that confines it to the failing branch.

## Assumptions made

- **None new.** Every fact recorded this session was verified against the code in the previous
  one and is cited by file and line in the plan: the `is_custom` gate
  (`StandardsManagement.tsx:408-419`), the absent aspects modal (directory listing), the
  orphaned toast (`use-standards-persistence.ts:328`), the missing `updated_by` (data model
  §11), and the archive-rename branch (`main.py:2397-2404`).
- **The 405 diagnosis remains as reported**, consistent with the code but not observed by me.

## Findings — flagged, not fixed

- **REQ-036 and REQ-037 have a dependency direction that is easy to get backwards.** REQ-036
  depends on REQ-037, not the reverse. Exposing deactivation for default aspects before the
  inactive view exists would deactivate rows the user can then neither see nor reinstate —
  turning a currently-unreachable false promise into a live one. The plan states the direction
  explicitly for that reason.
- **The `/api/aspects/inactive` case is a general argument, not a one-off.** An endpoint with
  no consumer cannot fail visibly, so its defects accumulate silently and surface all at once
  when a consumer is finally built. Worth remembering for REQ-017's evidence endpoints, which
  will be built before any client calls them.
- **Three route-shadowing instances is now a documented pattern with a proposed check**
  (REQ-013), but the check cannot be written until M2 builds the test infrastructure. Until
  then, the only defence is that whoever adds a route to `main.py` knows to look — which is
  exactly the defence that failed three times.

## What the next session needs to know

- **REQ-028 is back at normal priority** and still bundled with the REQ-010 migration. Do not
  re-derive its priority from the v2.11 text, which is superseded.
- **REQ-036 is a question, not a task.** It should close with a product answer; only then does
  it possibly become work.
- **REQ-035 needs a yes or no on mirroring `assessments.updated_by`** — not another audit.
- **REQ-012 still closes on one direct call** to `/api/aspects/inactive`; one row expected.

## Verification

- All five instructed edits applied and re-read in place.
- **§8 ticks re-counted: 10, unchanged** — no requirement gained or lost a tick this session,
  which is correct for a scope-and-priority pass.
- Requirement ordering in §6 re-checked after the split: REQ-036 and REQ-037 sit last, after
  DATA-001, preserving the instruction that REQ-036 is last in the milestone. REQ-037 follows
  it as its dependency rather than being interleaved earlier, so the "last, deferrable" block
  reads as one unit.
- §4 M1 row, §4.1 count and §8 rows updated consistently with the two new numbers.
- **Not verified:** nothing in production; no gate 1 verdict independently confirmed.

---

## Notes for the release summary

*No user-facing change. Planning only.*
