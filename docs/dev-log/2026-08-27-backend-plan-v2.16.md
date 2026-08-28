# Session — Milestone plan v2.16 (the defect that never was) — Backend

**Date:** 2026-08-27
**Agent:** Claude Code
**Milestone:** M1
**Version after this session:** no bump — documentation only
**Deployed:** no — plan edits are not deployable
**Contract version worked against:** assurly-api-contract.md v2.9

---

## What this session was for

Retire a defect that did not exist, record what chasing it cost, and add the rule that would
have prevented it.

## What changed

`docs/milestones/assurly-milestone-plan.md`, **v2.15 → v2.16** — see the changelog row.

- **REQ-012** — the `/api/aspects/inactive` defect **retired as never-a-defect**; the v2.15
  "widened" entry kept, collapsed under a `<details>` marked superseded.
- **§2.2 rule 9** — the multi-tenant lesson.
- **REQ-032** — premise re-confirmed; M2 placement stands.
- **REQ-039** added to M2.
- §4 M2 row and §8 updated.

**Schema changes:** none. **Contract changes:** none.

## Root cause — mine, and worth stating without hedging

**I read the code that scopes by tenant, wrote in a report that it scopes by tenant, used that
fact to rule out a hypothesis, and never asked which tenant.**

The specific sequence: in the first `/api/aspects/inactive` diagnostic I quoted
`current_mat_id: str = Depends(get_current_mat)` and `get_current_mat` returning
`current_user.mat_id`, and wrote — correctly — that the endpoint *does* enforce MAT isolation
and that the OpenAPI spec understates it. I then listed "MAT scoping mismatch" as a candidate
and treated it as **disproved** when told `mat_id` was `'HLT'` in both tables. That disproved
the wrong proposition. The question was never whether the *row* was HLT; it was **which MAT
the caller was**.

Two further rounds then reasoned about handler internals, and one reasoned about the deployed
environment — all downstream of an unexamined premise about the question rather than the
answer.

**The v2.15 instruction "add nothing further without evidence" was correct and did not help.**
I followed it. The missing item was not evidence about the endpoint; it was one fact about the
query. That is why rule 9 is phrased as "before reasoning about whether the result is
correct", not "gather more data".

## What was deliberately not changed

- **The v2.15 "widened defect" text.** Kept in full, collapsed under a `<details>` marked
  superseded. Four sessions acted on it and deleting it would hide why. The same treatment as
  the struck-through v1.8 contract entry and the retracted `%2F` note.
- **The five hypotheses.** All recorded, all still visible in their original locations. A list
  of five wrong answers is the useful artefact here.
- **REQ-032's scope and milestone.** Its premise was questioned on a false basis and is now
  re-confirmed; nothing about the requirement itself changed.

## Assumptions made

- **The OLT/HLT finding is taken as reported.** No production or database access — now §2.4
  standing constraint, not a per-session caveat.
- **`Mock aspect` belongs to HLT** and OLT has no inactive default aspects, as reported. That
  is what makes the empty array correct rather than merely explicable.

## Findings — flagged, not fixed

- **The information needed to catch this was present and unread.** `GET /api/aspects` returns
  `mat_id` on every row. Six rows carrying `'OLT'` were in front of us. **REQ-039's frontend
  half matters more than its backend half for exactly this reason** — a field in a payload
  nobody inspects is not a safeguard, whereas a persistent on-screen indicator is seen whether
  or not anyone thought to look.
- **The empty-collection case is the sharp one, and REQ-039's backend note should not lose
  it.** A populated response carries per-row `mat_id`, so the tenant is at least *recoverable*.
  An empty response carries nothing at all — no rows, no tenant, no way to tell "none for you"
  from "none exist". That is precisely the response that misled here, and it is the strongest
  argument for a top-level `mat_id` on collection responses.
- **§2.2 now has nine rules, three of them added in the last four days**, each after a
  misdiagnosis: 7 (label provisional claims), 8 (read the identifier), 9 (establish the
  tenant). All three are instances of one thing — **checking the premise of the question before
  investigating the answer.** Worth watching whether a tenth appears; if it does, the general
  form may deserve stating once rather than accumulating instances.
- **Four of the five disproved hypotheses were mine.** The methodological rules are
  accumulating faster than the defects they were meant to catch, which is itself a signal
  about how these sessions are going wrong: the analysis is competent and the framing is not
  checked.

## What the next session needs to know

- **REQ-012 closes on one call** — `/api/aspects/inactive` as an **HLT** user, expecting
  `Mock aspect`. Nothing else is outstanding on it.
- **REQ-039's backend half reports before implementing.** A top-level `mat_id` on collection
  responses is a contract change across many endpoints.
- **M1's remaining work is unchanged** by this session: REQ-007, REQ-009's backend half,
  REQ-028, REQ-029, REQ-030, REQ-033, REQ-038, DATA-001, DOC-002, and REQ-012's one call.

## Verification

- All three instructed edits applied and re-read.
- **§2.2 renumbering caught before it shipped.** I first inserted the tenant rule as item 8,
  which pushed the identifier rule to 9 and invalidated the two dev-log citations of §2.2.8 —
  the exact mistake I avoided deliberately when adding rule 8 two days ago. Grepped, found the
  two references, and re-did it as an append. **Items 1–8 are unchanged; the new rule is 9.**
- **§8 ticks: 10, unchanged.** Correct — REQ-012 gained no tick (one step remains) and REQ-039
  starts empty.
- The `<details>` block checked for correct open/close placement around the superseded v2.15
  entry.
- **Not verified:** anything in production.

---

## Notes for the release summary

*No user-facing change. Planning only.*
