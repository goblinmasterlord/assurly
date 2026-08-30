# Session — Milestone plan v2.20 (REQ-027 correction, REQ-043) — Backend

**Date:** 2026-08-30
**Agent:** Claude Code
**Milestone:** M1
**Version after this session:** no bump — documentation only
**Deployed:** no — plan edits are not deployable
**Contract version worked against:** assurly-api-contract.md v2.9

---

## What this session was for

The instruction was a re-send of the v2.19 brief with **one item changed**. Four of its five
items were already applied verbatim at v2.19; the fifth — REQ-027's status — was different,
and my v2.19 version of it was wrong.

## What changed

`docs/milestones/assurly-milestone-plan.md`, **v2.19 → v2.20**.

- **REQ-027** — restored to **CLOSED**. The "reopened pending diagnosis" block recorded at
  v2.19 is replaced with the correction.
- **REQ-043** added to M1, with the shared-root-cause pattern recorded.
- §4's M1 row, §8 and the changelog updated.

**Schema changes:** none. **Contract changes:** none.

## ⚠️ The version instruction could not be followed literally

The brief said **"Bump to v2.19"**. The plan was **already at v2.19** — I had applied the
earlier form of this instruction and pushed it as `3de496c`, with a dev log
(`2026-08-30-backend-plan-v2.19.md`) describing REQ-027 as reopened.

**I bumped to v2.20 rather than rewriting v2.19 in place.** Two reasons, and the second is
the one that decided it:

1. v2.19 is pushed, and its changelog row and dev log both state the superseded position.
2. **Rewriting v2.19 to say something it never said would falsify the record** — the same
   principle applied to the retracted contract v1.8 entry, the struck-through `%2F` note and
   the superseded "widened defect" block. A changelog that silently corrects itself is worth
   less than one that shows where it was wrong.

The v2.20 row states explicitly that only REQ-027 differed and that the other four items are
unchanged, so nobody reading the two rows together concludes work was done twice.

## What was deliberately not changed

- **The four items v2.19 already applied.** Gate 4's results, REQ-033's reopening and
  corrected diagnosis, REQ-041 and REQ-042 are byte-identical between the two instructions and
  were not re-applied or re-worded.
- **The v2.19 changelog row and its dev log.** Left as written. v2.20 supersedes them on
  REQ-027 and says so.

## Root cause

Not a defect session. But the REQ-027 episode is a clean illustration of something the plan
now says twice, and it is worth recording that the guard worked.

**v2.19 asked the right question and gave the wrong answer.** It said: do not assume
regression, establish whether the failing flow is the one that passed. That instruction was
correct and it is what produced this correction — the flows were different, so nothing had
regressed. **Had v2.19 recorded "regression" instead, the next session would have spent itself
diffing a fix that was never at fault.**

The residual error was mine: having correctly identified that the flows might differ, I still
moved the requirement to reopened rather than leaving it closed pending the answer.
**"Pending diagnosis" is not a neutral holding state — it takes a tick off the board and tells
the next reader the fix failed.** The neutral state was to leave REQ-027 closed and record the
new report separately, which is what v2.20 does.

## Findings — flagged, not fixed

- **REQ-027 and REQ-043 are one defect wearing two numbers.** A mutation that does not refresh
  what it changed, split by which cache the flow happened to touch. **The second was invisible
  until someone created into a populated term** — a normal action nobody had performed in a
  test.
- **The audit-shaped conclusion is now due for the second time.** REQ-040 exists because five
  aspects defects shared one root cause; the mutation-invalidation surface is the same
  argument at an earlier stage. **The plan says to scope it deliberately if the pattern holds a
  third time** rather than minting it now, which keeps M1 closed to scope growth — but the
  third instance should be treated as the trigger, not as another single fix.
- **Gate coverage is the common thread in both of this session's corrections.** REQ-033 passed
  a gate on a fix that addressed the wrong mechanism; REQ-027 "failed" a gate on a flow it had
  never covered. **In both cases the gate result was accurate and the inference from it was
  not.** A gate tells you what was exercised, not what works.

## What the next session needs to know

- **REQ-027 is closed and stays closed.** Do not diff its fix.
- **REQ-043 is the existing-term creation path**, and is where that work belongs.
- **REQ-042 remains first in M1.** Unchanged by this correction.
- The plan is at **v2.20**; anyone holding v2.19 has the wrong REQ-027 status and nothing else
  wrong.

## Verification

- The four already-applied items were **diffed against the new instruction before touching
  anything** — confirmed byte-identical in substance, so nothing was re-applied. This was the
  first thing checked, because re-applying them would have duplicated REQ-041 and REQ-042.
- REQ-041, REQ-042 and REQ-033's reopened block confirmed present and unaltered.
- **§8 rows containing a tick: 12, unchanged.** Worth stating what that number is: `grep -c`
  counts **rows containing at least one `☑`**, not ticks. REQ-027 regained its Frontend tick
  this session but its row already carried a Docs tick, so the row count is flat while the
  tick count rose by one. **I have been quoting this figure as a consistency check across
  several sessions and it measures rows, not ticks** — accurate as a drift signal, but not the
  quantity the phrasing implied.
- REQ-043 placed after REQ-042 in §8 after landing above REQ-041 on insertion.
- **Not verified:** anything in production.

---

## Notes for the release summary

*No user-facing change. Planning only.*
