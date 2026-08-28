# Session — Milestone plan v2.14 (two retractions) — Backend

**Date:** 2026-08-27
**Agent:** Claude Code
**Milestone:** M1
**Version after this session:** no bump — documentation only
**Deployed:** no — plan edits are not deployable
**Contract version worked against:** assurly-api-contract.md v2.9

---

## What this session was for

Retract two claims made in v2.13, one of which I had recorded as confirmed after three
versions of correctly labelling it provisional. Retire the REQ-010 migration on the strength
of production evidence, and close REQ-010.

## What changed

`docs/milestones/assurly-milestone-plan.md`, **v2.13 → v2.14** — see the changelog row.

- **Gate 3, task 2** — autocommit reasoning replaced with the escape-doubling cause; the
  post-commit re-query requirement kept.
- **REQ-010** — migration retired; requirement **closed at gate 2**; two standing caveats
  recorded; gate 2 evidence recorded as complete.
- **The `%2F` diagnosis** — struck through in place at its original site, with the disproof and
  the surviving hypothesis recorded.
- **The v2.13 changelog row** — retraction marker prepended; the row itself left as written.
- §8 REQ-010 row closed.

**Schema changes:** none. **Contract changes:** none.

## What was deliberately not changed

- **No code**, and nothing in `mat_aspects`.
- **The v2.13 changelog row's body.** Marked as retracted and struck through where it makes
  the false claim, but not rewritten. It records what the programme acted on, and a changelog
  that silently corrects itself is worth less than one that shows its errors.
- **The migration script**, which is unedited and still at
  `docs/migrations/2026-08-26-REQ-010-aspect-code-sanitisation.sql` — see the scope conflict
  below.

## ⚠️ One instruction I did not carry out, deliberately

The brief says to keep the migration script **in `docs/archive/`**, and also says **"PLAN EDITS
to `docs/milestones/assurly-milestone-plan.md` only."** Those conflict: moving the file is not
a plan edit.

**I recorded the intended destination in the plan and did not move the file.** The plan text
reads "to be moved to `docs/archive/`", so the intent is captured and the discrepancy is
visible rather than silent. **One command settles it and I will run it on a word:**

```
git mv docs/migrations/2026-08-26-REQ-010-aspect-code-sanitisation.sql docs/archive/
```

Flagged rather than assumed, because the explicit "only" was the more specific instruction.

## Root cause

Both retractions have the same shape, and it is worth stating because it is the second time
this session's subject matter has produced it.

**A confirming observation was accepted without checking that it discriminated.** Gate 2
tested one thing (change `aspect_code`, retry the rename) and got the predicted outcome — so
the prediction looked confirmed. But the test changed a variable the diagnosis did not depend
on. The diagnosis was about the **primary key**, and the primary key never changed. A test
that cannot fail if the hypothesis is wrong confirms nothing, and I recorded it as confirming
everything, including removing a provisional label that three previous versions had correctly
kept.

The autocommit error is the same failure in miniature: a statement "reported success", and
success was read as evidence the statement did what was intended. **A zero-row `UPDATE` also
reports success.**

**The lesson is narrower than "be careful" and worth keeping:** before removing a provisional
label, check that the confirming test would have produced a *different* result had the claim
been false.

## Assumptions made

- **All production facts are as reported.** No production access; I observed none of it.
- **The surviving hypothesis is recorded as a hypothesis, and I have evidence against it.**
  Tracing the call-site chain on this branch: `CreateAspectModal.onSubmit` passes
  `mat_aspect_id: aspect?.mat_aspect_id`; `use-standards-persistence.ts:280` passes
  `aspect.mat_aspect_id`; `enhanced-assessment-service.updateAspect` delegates to
  `apiUpdateAspect(matAspectId, …)` unchanged; `assessment-service.ts:377` interpolates that
  value. **Every link passes the id; none reads `aspect_code`.** So the hypothesis is not
  supported by the code I can read, and **the observed behaviour is currently explained by
  nothing.** Recorded as a contradiction for gate 3 to resolve rather than a hypothesis to
  confirm.

## Findings — flagged, not fixed

- **If the request path is built from the id, the two renames should have behaved
  identically.** The primary key was unchanged across the failing and succeeding attempts, so
  a path built from it would have been byte-identical. The outcome changed. **Therefore
  something in the flow depends on `aspect_code` — and it may not be the `PUT`.** Candidates
  worth checking at gate 3 before assuming the call site: whether the editor opens at all,
  whether a preceding `GET` by id succeeds, and whether any cache or list keying uses the code.
- **`requestCache.invalidate('aspect_detail', { id: matAspectId })`** keys on the id, not the
  code, so the enhanced service's cache is not an obvious candidate — noted to save the next
  session the check.
- **The escape-doubling hazard is not confined to the retired migration.** Any `SELECT`,
  `UPDATE` or `DELETE` matching `aspect_code` or `mat_aspect_id` for these two rows has it,
  including the discovery queries in the archived script — its query 1b uses
  `LIKE '%\\%'`-style patterns whose behaviour depends on both the escape character and the
  `sql_mode`. **Anyone touching these rows should match on `aspect_name` or on the primary key
  via a parameterised driver, not on a hand-written literal.**
- **Retiring the migration leaves two rows permanently inconsistent with §2.4's identifier
  constraint.** That is the right trade — the rows are dormant and the fix is high-risk — but
  it means the constraint is now "enforced for all new rows, with two documented exceptions",
  and anyone reasoning about invariants over `mat_aspects` should know that.

## What the next session needs to know

- **REQ-010 is closed.** Gate 3 no longer contains a migration; it keeps its diagnostic task
  and REQ-028.
- **The original REQ-010 failure has no accepted explanation.** The plan says so plainly. This
  is now the second open "why did that happen" in the aspects area, alongside
  `/api/aspects/inactive`, and both are on the gate 3 list.
- **REQ-028 rises in practical importance.** With the migration retired, the two bad-id rows
  stay — and they are exactly the rows that cannot be deleted safely, because deletion
  archive-renames the primary key into the REQ-028 collision.

## Verification

- All four instructed edits applied and re-read in place.
- **§8 ticks: 10, unchanged.** REQ-010's row moved to closed and gained a Docs tick, while the
  count held because the row already carried two — checked rather than assumed.
- **Hunted for surviving text presenting the decode mechanism as observed.** Two sites found
  and handled differently on purpose: the live REQ-010 provisional note is struck through with
  the disproof beside it, and the v2.13 changelog row carries a retraction marker but keeps its
  body.
- The call-site chain re-traced through all four files before recording it as evidence against
  the surviving hypothesis, rather than relying on the trace from the earlier session.
- **Not verified:** anything in production; no gate verdict independently confirmed.

---

## Notes for the release summary

*No user-facing change. Planning only.*
