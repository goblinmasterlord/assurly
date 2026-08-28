# Session — Milestone plan v2.15 (M1 scope closure) — Backend

**Date:** 2026-08-27
**Agent:** Claude Code
**Milestone:** M1
**Version after this session:** no bump — documentation only
**Deployed:** no — plan edits are not deployable
**Contract version worked against:** assurly-api-contract.md v2.9

---

## What this session was for

Three things: record a standing constraint that should have been written down sessions ago,
close M1's scope against feature creep, and record that the aspects defect has widened past
the requirement tracking it.

## What changed

`docs/milestones/assurly-milestone-plan.md`, **v2.14 → v2.15** — see the changelog row.

- **§2.4** — new standing constraint on database access.
- **M1 scope closure** — REQ-032, REQ-034, REQ-035, REQ-036, REQ-037 moved to M2, in §4, §4.1,
  §8 **and §6**, where the blocks were physically relocated into the M2 section.
- **REQ-012** — the widened state recorded; status row rewritten.
- §4.1's rationale rewritten around what M1 is for.

**Schema changes:** none. **Contract changes:** none.

## What was deliberately not changed

- **No requirement was renumbered.** The five keep their ids; only the milestone changed.
- **No new requirement was minted for the widened aspects defect.** It is recorded under
  REQ-012, which is where it has been tracked. Minting a number for a defect whose shape is
  still unknown would fix the wrong boundary around it — and the instruction was to add
  nothing without evidence.
- **No fifth hypothesis.** Four are dead. The next contribution is data.
- **REQ-033 stays in M1** despite being a frontend item, because a click-dead application is
  broken, not an addition. Same for REQ-038.

## Root cause

Not a defect session. Two observations worth keeping.

**On the database constraint:** three sessions in this programme have now been given a
diagnostic task that required database access, and all three produced the same output — a
report that the agent cannot do it. That is not a failure of any one brief; it is a missing
line in §2.4, which is now there. The constraint is not "agents are limited" but "the
*handover artefact* is the deliverable" — a statement written to be run, with the escape
rules and the connection context specified, is a real piece of work. Scoping it as execution
throws that away.

**On the scope closure:** M1 grew from seven requirements to seventeen, and the growth was not
uniform. The defects arrived from usage; the features arrived from noticing adjacent gaps
while fixing defects — REQ-034's Expand All, REQ-032's pagination, REQ-036's deletion
exposure. Each was individually reasonable and the aggregate was not. **A milestone accretes
scope one defensible item at a time**, which is why the closure had to be an explicit act
rather than a matter of judgement per item.

## Assumptions made

- **All production facts are as reported.** No database access — now a documented constant
  rather than a per-session caveat.
- **The 6-of-17 finding is taken as reported and I have not tried to explain it.** I have four
  disproved hypotheses and no fifth, and the instruction not to add one without evidence is
  the correct instruction. Recording it as unexplained is the accurate state.

## Findings — flagged, not fixed

- **The widened defect may outgrow REQ-012 entirely.** REQ-012 is "Inactive aspects view
  returns 404" — a routing defect that was fixed. What remains is "the aspects family
  under-returns", which shares only the endpoint family. **If the pending questions confirm
  the UI shows 6, this should almost certainly become its own requirement at a higher priority
  than REQ-012 ever carried.** Not minted now, because its shape is unknown.
- **The severity is currently unknown in a way that matters more than the cause.** Whether the
  customer has been working from a screen missing eleven of seventeen aspects is a question
  about what has already happened, not about what to fix. It bears on the early adopter
  relationship M1 exists to protect, and it is answerable in one look at the screen — far
  cheaper than any further diagnosis.
- **`GET /api/aspects` under-returning would silently distort anything downstream of it.** The
  aspect list feeds filters, the assessments grouping and the standards admin view. A
  six-of-seventeen list does not announce itself as short. **Worth checking whether REQ-032's
  ten-aspect truncation, moved to M2 this session as a display defect, is in fact the same
  bug seen from the other end** — that requirement assumed the data arriving was complete.
- **Three of the five moved requirements are aspects work** (REQ-035 is not, REQ-032 may be —
  see above). If the aspects family turns out to be broken at the data-returning level, M2's
  aspects items are built on an unreliable foundation and their sequencing should be revisited
  once the cause is known.

## What the next session needs to know

- **M1 is closed to additions.** New non-defect work goes to M2 or later. The §4.1 rationale
  says why, so the next person proposing an addition has to argue against a stated position
  rather than an absence of one.
- **The aspects defect needs data, not analysis.** Which six ids, and what the UI shows.
- **Do not scope a database task for an agent.** §2.4 now says so.

## Verification

- All three instructed edits applied and re-read.
- **§8 ticks: 10, unchanged** — correct, since a milestone move changes the milestone column
  and nothing else.
- **The five moved blocks were relocated in §6, not just re-labelled in the tables.** Verified
  by listing the section headings in order: M1 now ends at DATA-001; M2 runs REQ-013,
  REQ-032, REQ-034, REQ-035, REQ-036, REQ-037. Leaving them physically under M1 would have
  made §6 contradict §4 and §8.
- **Hunted stale "in M1" wording in the moved requirements.** REQ-036's type line and its §8
  status row both still said "last in M1"; both corrected to M2.
- Confirmed the mid-session "file modified on disk" notice was my own scripted edits, not a
  concurrent write, by checking `git status` and the branch head before continuing.
- **Post-merge correction.** The product owner moved the migration script to `docs/archive/`
  in `c344a2e` while this session was running. The plan's REQ-010 caveat still read "to be
  moved to `docs/archive/`", which was stale the moment that landed; corrected to record the
  actual location and the commit. `docs/migrations/` no longer exists — it held only that
  script. Dev log references to the old path are historical and left alone.
- **Not verified:** anything in production.

---

## Notes for the release summary

*No user-facing change. Planning only.*
