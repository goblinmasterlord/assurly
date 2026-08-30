# Session — Milestone plan v2.17 (REQ-012 closes) — Backend

**Date:** 2026-08-27
**Agent:** Claude Code
**Milestone:** M1
**Version after this session:** no bump — documentation only
**Deployed:** no — plan edits are not deployable. The work this records is deployed: REQ-012 verified in production, 27 August 2026.
**Contract version worked against:** assurly-api-contract.md v2.9

---

## What this session was for

Close REQ-012 on its production verification, and stop §2.2 growing.

## What changed

`docs/milestones/assurly-milestone-plan.md`, **v2.16 → v2.17**.

- **REQ-012 CLOSED** — verification recorded on the requirement block and ticked in §8.
- **§2.2 gains a preamble** naming the general form behind rules 7, 8 and 9, and stating that
  no tenth is being added.

**Schema changes:** none. **Contract changes:** none.

## What was deliberately not changed

- **Rules 7, 8 and 9 themselves.** Unedited and unrenumbered. The preamble reframes how they
  are read; it does not restate or replace them, and every existing citation still resolves.
- **The numbered list's structure.** Nine items, same order, same text. A preamble was the only
  change that could add the general form without touching a single citation.

## Root cause

Not a defect session. But the §2.2 change is worth recording as a decision rather than an
edit, because the instinct it overrides is a strong one.

**Each of rules 7, 8 and 9 was individually justified.** Each followed a real misdiagnosis,
each named a real failure, and adding each felt like learning. **The aggregate was the
problem:** three rules in four days, all saying the same thing in different vocabulary, on a
list already six items long. The natural next move after the fourth misdiagnosis is rule 10,
and it is the wrong move — the list would grow, the general form would stay unstated, and the
document would carry more words with less effect.

**A list long enough to skim is a list that stops being read.** That is the concern, and it is
now written down where the next person tempted to add rule 10 will meet it.

## Assumptions made

- **The production verification is taken as reported.** No database or production access —
  §2.4 standing constraint.

## Findings — flagged, not fixed

- **The preamble is itself unproven.** It asserts that stating a general form once works better
  than accumulating instances, and there is no evidence for that yet — only evidence that
  accumulating instances was not working. **The test is whether a fourth misdiagnosis of this
  class occurs.** The plan says such an instance belongs in a dev log as evidence the preamble
  is not landing, which is the right place for it: it keeps the falsification visible without
  growing the list.
- **REQ-012's history is now longer than its fix.** The fix was two moved decorators. What
  followed was four sessions, five hypotheses and six plan versions, none of it about the
  defect that was actually fixed. **The requirement closed on the same change it opened with;
  everything in between was diagnosing a non-defect.** Worth remembering when a closed
  requirement's paper trail is read later as though it described the work.
- **M1's remaining work is unchanged:** REQ-007, REQ-009's backend half, REQ-028, REQ-029,
  REQ-030, REQ-033, REQ-038, DATA-001 and DOC-002.

## What the next session needs to know

- **REQ-012 is closed.** Nothing outstanding on it.
- **Do not add §2.2 rule 10.** The preamble says why, and a fourth instance goes in a dev log
  instead.
- Gate 3's remaining item is **REQ-028**; the migration is retired and the diagnostic is
  resolved.

## Verification

- Both instructed edits applied and re-read.
- **§2.2 confirmed at nine numbered items after the edit**, in the original order — the
  preamble sits above item 1 and touches nothing below it. This was the specific risk given
  the instruction "renumber nothing", and it is the second consecutive session where §2.2
  numbering needed checking rather than assuming.
- **§8 ticks: 10, unchanged.** REQ-012 already carried Backend and Docs ticks from the route
  fix; closing it changed the status text, not the tick count. Checked rather than assumed,
  since "REQ-012 closes" reads like it should add one.
- **Not verified:** anything in production.

---

## Notes for the release summary

*The list of deactivated areas now opens and shows previously deactivated areas, where before
it reported an error.*
