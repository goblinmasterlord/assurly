# Session — Milestone plan v2.21 (three M1 closures, REQ-044) — Backend

**Date:** 2026-08-30
**Agent:** Claude Code
**Milestone:** M1
**Version after this session:** no bump — documentation only. The three closures record work merged by the frontend agent; **the version bumps belong to that agent's entry, not this one.**
**Deployed:** no — plan edits are not deployable. The work this records is deployed: UAT, 30 August 2026.
**Contract version worked against:** assurly-api-contract.md v2.9

---

## What this session was for

Close three M1 defects that pass UAT, each with a **confirmed** cause rather than a plausible
one, and scope the audit that REQ-043 makes due.

## What changed

`docs/milestones/assurly-milestone-plan.md`, **v2.20 → v2.21**.

- **REQ-033, REQ-041, REQ-043** — closed, with confirmed causes recorded on each block and
  ticks in §8.
- **REQ-044** added to M2 (frontend, audit) — every mutation path against the caches it
  invalidates.
- **§2.6 gains a precedent** on re-sent instructions and superseded versions (item 3).
- §4's M2 row, §8 and the changelog updated.

**Schema changes:** none. **Contract changes:** none. **No code touched.**

## What the closures actually establish

Worth separating, because all three were previously carrying a diagnosis and only one of those
diagnoses had survived a gate.

| REQ | Confirmed cause |
|---|---|
| REQ-033 | `DropdownMenu` and `Dialog` **both manage `body`'s `pointer-events`**; with both mounted, the second layer's unmount cleanup clobbered the first's — **which is why Cancel failed too** |
| REQ-041 | A `useEffect` reset `activeStandard` to the first standard on every assessment change, **and** Save & Continue called `goToNextStandard` without awaiting the save |
| REQ-043 | Creating into an existing term changes **only** the assessments list, so the dashboard overlay and aspect metric caches were never invalidated |

**REQ-033 is the one that matters procedurally.** Its first fix passed a gate and its second
failed one, on the same requirement, because the first diagnosis was a plausible lifecycle
story nobody tested against the symptom. **What settled it was the method v2.19 prescribed** —
read `document.body.style.pointerEvents` at each step rather than reasoning from the component
tree. Two mechanisms produced identical symptoms and equally convincing explanations; only the
attribute that defines the symptom told them apart.

**REQ-041 had two faults, either sufficient alone.** Fixing only one would have left the defect
intact and intermittent-looking — the worst available outcome, because an intermittent fix
reads as a flake rather than a miss.

**REQ-041's end-of-list behaviour is recorded in the plan, not only in the code:** hold on the
last standard and raise a toast. The requirement asked for that decision to be **stated**, and
a decision that exists only as an implementation detail is one the next session will re-decide.

## The v2.20 condition is withdrawn, deliberately

v2.20 said to scope the mutation-invalidation audit **if the pattern held a third time**. That
condition is gone, and the reason is in the shape of the defect rather than in impatience:

> **A mutation path with no second cache to invalidate produces no visible symptom at all.**

REQ-027 and REQ-043 were both reported because each had a *second* surface that visibly
disagreed with the first. A path whose single cache goes stale shows old data that looks like
current data. **So the absence of further reports is not evidence the remaining paths are
correct** — it is equally consistent with them being silently wrong, and a third report would
arrive by the same accident as the first two.

Both known instances were found the same way: **a person performing an ordinary action and
noticing.** Nothing in the current process would have found either.

## Findings — flagged, not fixed

- **There is no REQ-043 dev log.** The instruction was to check it before scoping REQ-044, and
  I did: `docs/dev-log/` contains no entry for the session that produced `3451cb0`, `7d8079d`
  or the four REQ-033 commits. The most recent frontend entry is
  `2026-08-30-frontend-req-033-038.md`, which describes the **superseded** REQ-033 fix and
  predates all of this. **§2.5 requires an entry for every session**, and this is the second
  time that has been noted — the dependency-pin session missed one too. **REQ-044's scope
  therefore says to start from that entry if it exists and to say so if it does not**, rather
  than assuming a survey was done.
- **What that costs REQ-044 specifically:** the plan asked the frontend agent to report on the
  mutation surface while in the code. If that survey happened, it exists only in the commits.
  **The audit will start from nothing and may repeat work that was already done** — which is
  the concrete cost of a missing entry, rather than a procedural complaint.
- **REQ-041 is evidence for REQ-044 as much as REQ-043 is.** Its second fault was an
  un-awaited save racing a refresh — **the same class as an un-awaited invalidation**, on a
  different surface. REQ-044's scope includes `await` correctness for that reason; an
  invalidation that is not awaited before the refetch is indistinguishable from a missing one.
- **M1's remaining work is now REQ-042, REQ-007, REQ-009's backend half, REQ-028, REQ-030,
  REQ-031, DATA-001 and DOC-002.** Three closures in one pass is the largest movement M1 has
  had, and it is worth noting that **all three were frontend** — the backend queue has not
  moved since REQ-029.

## What the next session needs to know

- **REQ-042 remains first in M1**, and its backend half **reports options before implementing**
  (§2.7 puts auth changes in their own gate).
- **REQ-044 is an audit and must report and stop.** Same as REQ-040. The instruction to fix
  nothing is load-bearing.
- **Do not reopen REQ-033 on a related pointer-events symptom without reading `body`'s inline
  style first.** A different Radix pathology with the same symptom is exactly what happened
  here once already.

## Verification

- All three closures cross-checked against the merged commits before being written, rather
  than taken from the instruction alone: `d40bb72`, `f341367`, `fcd280c`, `9e0b2be`, `6d39d8d`
  (REQ-033), `7d8079d` (REQ-041), `3451cb0` (REQ-043). **REQ-041's end-of-list behaviour was
  read out of the diff**, not inferred — `handleSaveAndContinue` holds and toasts.
- **§8 rows containing a tick: 15, up from 12.** Three rows that previously carried none gained
  them. Stating the measure again because the phrasing has misled before: `grep -c` counts
  **rows containing at least one `☑`**, not ticks.
- `dev-log/` searched for a REQ-043 entry before REQ-044's scope was written — see Findings.
- REQ-044 placed after REQ-040 in §6's M2 section, in §4's M2 row and in §8.
- **Not verified:** anything in production. No code was read beyond the diffs named above.

---

## Notes for the release summary

*No user-facing change in this session. The changes it records — the standards page no longer
freezing after a delete, Save & Continue advancing to the next unrated standard, and new
ratings appearing immediately when created into a term that already has some — are live.*
