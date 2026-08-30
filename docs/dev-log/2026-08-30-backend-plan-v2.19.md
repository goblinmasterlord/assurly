# Session — Milestone plan v2.19 (gate 4) — Backend

**Date:** 2026-08-30
**Agent:** Claude Code
**Milestone:** M1
**Version after this session:** no bump — documentation only
**Deployed:** no — plan edits are not deployable. The work this records is deployed: gate 4, 30 August 2026.
**Contract version worked against:** assurly-api-contract.md v2.9

---

## What this session was for

Record gate 4 — two passes, one failure with a corrected diagnosis, one reopening — and add
two new M1 defects, one of which outranks everything else in the milestone.

## What changed

`docs/milestones/assurly-milestone-plan.md`, **v2.18 → v2.19** — see the changelog row.

- **REQ-029 and REQ-038** — gate 4 passes recorded.
- **REQ-033** — reopened, diagnosis corrected, method for the next attempt specified.
- **REQ-027** — reopened **pending diagnosis**, explicitly not as a regression.
- **REQ-041** added to M1.
- **REQ-042** added to M1 and placed **first**, in §4, §4.1 and §6.

**Schema changes:** none. **Contract changes:** none.

## What was deliberately not changed

- **No code.** Both new requirements and both reopenings are frontend or joint work, and the
  backend half of REQ-042 reports before implementing.
- **REQ-007's scope.** Unchanged by REQ-033's correction; if anything the correction
  strengthens the separation, since REQ-033 is now a teardown fault rather than an
  open-ordering one.
- **The frontend agent's merged REQ-033 fix.** Not reverted. It may still be a correct
  improvement to the open path; it simply is not the fix for this defect. Reverting it would
  be a second guess on top of the first.

## Root cause

Not a defect session, but the two corrections share something worth recording.

**REQ-033's original diagnosis was a plausible mechanism that nobody tested against the
symptom.** A closing `DropdownMenu` racing an opening `Dialog` is a real Radix pathology, it
fits the observed behaviour, and it is wrong here. **One observation kills it: cancelling the
delete also leaves the page click-dead, and cancel never opens the destructive path.** That
observation was available at any point — it costs one click.

**This is §2.2's preamble again, in its third form.** Rules 7, 8 and 9 cover claims,
identifiers and tenants; the general habit is checking the premise before investigating. Here
the premise was "the fault is in how the dialog opens", and it went unchecked because the
mechanism was convincing. **The corrective is in the requirement now as a method, not a
principle:** read `document.body.style.pointerEvents` at each step. A principle would have
been the fourth instance the preamble says belongs in a dev log rather than as rule 10 — so
this is that entry.

**REQ-027 is the same risk pointing the other way**, which is why the plan says explicitly not
to call it a regression. It passed gate 1 on this test and fails now, and "regression" is the
convincing story that would send the next session diffing a fix rather than reproducing a
flow.

## Assumptions made

- **All gate 4 results are as reported.** No production access (§2.4).
- **The REQ-033 mechanism — two overlapping Radix layers, second unmount clobbering the
  first's cleanup — is taken as reported.** It is consistent with the cancel-also-fails
  observation, but the requirement asks for it to be **verified against `body`'s inline style**
  rather than accepted, precisely because the previous mechanism was also consistent and also
  wrong.

## Findings — flagged, not fixed

- **REQ-042's frontend half should not wait on the backend decision.** An expired session that
  redirects cleanly to login is a much smaller defect than one that hangs — and the `401`
  handling is correct regardless of which renewal model is chosen. **Sequencing the frontend
  behind the auth decision would leave the worst symptom in place for the length of that
  discussion.** The requirement says so; worth repeating here because the natural reading of
  "backend and frontend" is that backend goes first.
- **REQ-042 and REQ-013 will collide if built independently.** Whatever session model REQ-042
  settles becomes the one the external tier inherits, and Trustees logging in occasionally are
  the population most exposed to expiry. Recorded in both requirements.
- **Two of M1's reopenings arrived from gate testing that a passing gate had already covered.**
  REQ-027 passed gate 1 and fails at gate 4 on the same test. That is either a genuine
  regression or a difference in what was exercised, and **the plan is now explicit that
  establishing which comes first.** Worth watching whether gate coverage is drifting between
  runs — if the same test can pass and fail across gates, the gate checklists may be less
  reproducible than §2.7 assumes.
- **REQ-041 is the kind of defect that does not get reported.** The data is never wrong, so it
  reads as clumsy design rather than a fault. It surfaced only because someone rated ten
  standards in a row. There are probably others of this shape, and nothing in the current
  process would surface them.

## What the next session needs to know

- **REQ-042 is first in M1**, and its backend half reports before implementing.
- **REQ-033's next attempt must read `document.body.style.pointerEvents` directly.** Do not
  start from the component tree.
- **REQ-027 must be reproduced before it is diffed.** Two candidate flows, two different fixes.
- REQ-029 and REQ-038 are done and passed.

## Verification

- All five instructed edits applied and re-read.
- **§8 ticks: 12, down from 13** — correct and checked, not assumed. REQ-033 lost its Frontend
  tick on reopening and REQ-027 lost its Frontend tick; REQ-029 and REQ-038 each gained a Docs
  tick on passing. The net is −1, and a session that both passes and reopens requirements is
  exactly where an unchecked tick count would drift.
- **REQ-038's status row was edited by line prefix rather than full-string match** after a
  full-string replacement failed — the row's Docs column was `☐`, not the `☑` I had assumed
  from the previous session's edit. Caught by the assertion rather than by eye.
- REQ-042 confirmed present in §4's M1 row, §4.1's rationale and §6, and placed first in all
  three.
- **Not verified:** anything in production.

---

## Notes for the release summary

*No user-facing change. Planning only.*
