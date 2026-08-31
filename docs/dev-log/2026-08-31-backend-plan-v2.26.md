# Session — Milestone plan v2.26 (REQ-042 unverified, §2.2 preamble, REQ-048) — Backend

**Date:** 2026-08-31
**Agent:** Claude Code
**Milestone:** M1
**Version after this session:** no bump — documentation only
**Deployed:** no — plan edits are not deployable
**Contract version worked against:** assurly-api-contract.md v2.11

---

## What this session was for

Record a gate result that resolved to neither outcome, extend §2.2's preamble to cover how
briefs are written, and scope one M2 audit.

## What changed

`docs/milestones/assurly-milestone-plan.md`, **v2.25 → v2.26.**

1. **REQ-042** — recorded as **SHIPPED BUT UNVERIFIED**, with what that means concretely. **Does
   not tick in §8.**
2. **§2.2's preamble** — extended with the brief-writing failure, **not added as rule 10.**
3. **REQ-048 added** to M2 — audit display fallback chains.

Plus §4's M2 row, §8 (REQ-042, REQ-047, REQ-048), and cross-references in REQ-047.

**No code. No contract change.**

## The state REQ-042 is in, and why it needed its own vocabulary

**A gate that failed and then could not be reproduced establishes neither outcome.** The plan
has language for passed and for reopened; it had none for this, and the two available options
were both wrong:

- Recording it **passed** would be false — nothing passed, and the failure was observed.
- Recording it **failed and open** would be equally false — the follow-up could not reproduce
  either symptom, and testing is parked, so nothing is being worked.

**So the block states the only thing actually known:** all three parts — the `401` handler, the
proactive renewal, the redirect — **are merged, are in production, and none is confirmed.** That
is a real state and it needed saying plainly rather than being rounded to the nearest tick.

**The operational consequence is the point of the entry**, and it is why it is marked 🔴: if a
user reports an indefinite spinner or an unexplained logout, **this is the first place to look.**
Without that line, the next person meets a requirement with no tick and no failure and has to
reconstruct why.

## The gate-5 finding that bears on a decision made two versions ago

**Recorded, and deliberately not acted on.** v2.24 settled the renewal trigger as request-gated,
rejecting a timer because it "renews idle tabs and can exhaust the 12-hour cap while nobody is
working". The reasoning was that **a request is the app doing work on the user's behalf.**

Gate 5's leading explanation for symptom 1 is the hole in exactly that: **renewal fires only when
axios traffic occurs in the final 15 minutes, and a cache-heavy page generates none — so an
actively-working user looks idle.** That is the same failure the timer was rejected for causing,
running in the opposite direction.

**I did not reopen the decision.** Testing is parked by instruction, the diagnosis is itself
unconfirmed, and reversing a settled decision on the strength of an unreproduced symptom would be
the mistake this plan keeps recording. **It is written into the block as the first thing to test
if testing resumes**, which is where it will be found by whoever needs it.

## Why the preamble and not rule 10

**§2.2's preamble says explicitly that a fourth instance belongs in a dev log, not as rule 10.**
This edit adds to the preamble anyway, and the distinction is load-bearing rather than a
technicality:

**Rules 7–9 describe how an agent investigates. This describes how the work is framed before
anyone investigates.** They have different audiences, and that is what makes it not a tenth rule:
**an agent's diligence cannot recover a brief that has already told them what they are fixing.**
REQ-030 is the proof — the session did its job, the wrong mechanism was in the instruction, and
it propagated into a test specification in another milestone.

**The four cases share a shape worth stating once:** the symptom was accurate every time. **The
briefs are not wrong about what is broken. They are wrong about why**, and stating the why as
fact is what converts a good report into a misdirected session.

## What was deliberately not changed

- **The renewal trigger.** See above.
- **REQ-042's §8 ticks.** All three stay `☐`, as instructed and as §2.7 requires — agents do not
  declare gates, and this one was not passed by anyone.
- **Rules 7, 8 and 9.** Untouched, and **nothing renumbered** — every existing §2.2.7/8/9
  citation survives.
- **The frontend gate-5 dev log.** Referenced by path, not summarised into the plan. It is the
  primary record and copying it would create a second one to drift.

## Findings — flagged, not fixed

- **"Could not reproduce" is now the second unresolvable gate result in this programme**, after
  REQ-033 passed a gate on a fix that addressed the wrong mechanism. **Both times the gate was
  accurate and the inference from it was not** — v2.20 said it, and this is the third occasion
  it has applied. **A gate tells you what was exercised.** REQ-042 is the case where what was
  exercised produced two different answers on two runs, which is information about the test as
  much as about the code.
- **REQ-048 is the fourth open audit** — REQ-040 (`mat_aspects` invariants), REQ-044 (cache
  invalidation), REQ-046 (transactions), REQ-048 (fallback chains). **All four arose the same
  way: a fix revealed a class.** That is a good sign about diagnosis and a bad one about M2's
  size, and **four report-and-stop passes landing together will produce four lists and no fixes**
  unless they are sequenced with remediation slots behind them.
- **The `updated_by_name` chain hid the missing field for as long as the field has existed.**
  Worth separating from the wrong name: a visible gap would have been reported in the first week.
  **The fallback did not just produce bad data — it removed the signal that would have got the
  API defect fixed.** That is the argument for REQ-048 and it is stronger than the instance.

## What the next session needs to know

- **REQ-042 is not passed and not failing.** Do not resolve it in either direction without new
  testing, and testing is parked.
- **REQ-048 reports and stops.** It does not wait on REQ-047 and does not fix it.
- **§2.2 still has nine rules.** The addition is preamble.

## Verification

- The frontend gate-5 dev log was **read before the block was written**, not summarised from the
  instruction — which is where the cache-heavy-page explanation and the parked-testing list came
  from.
- **§8: REQ-042's row confirmed `☐ ☐ ☐` after editing.** Checked rather than assumed, since the
  instruction turns on it.
- **§8 rows containing a tick: 15, unchanged.** REQ-048's new row carries none.
- §2.2's numbered rules confirmed **still nine**, unrenumbered.
- REQ-048 placed before REQ-046 in §6's M2 section, in §4's M2 row and in §8; cross-referenced
  from REQ-047 in both directions.
- **Not verified:** anything in production. In this session that is the subject rather than a
  limitation.

---

## Notes for the release summary

*No user-facing change. Planning only.*
