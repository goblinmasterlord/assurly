# Session — Milestone plan v2.24 (routing correction, REQ-046) — Backend

**Date:** 2026-08-30
**Agent:** Claude Code
**Milestone:** M1
**Version after this session:** no bump — documentation only
**Deployed:** no — plan edits are not deployable
**Contract version worked against:** assurly-api-contract.md v2.11

---

## What this session was for

Five plan edits, of which **two are corrections to claims this plan has carried for fourteen
versions**, one is a new M2 requirement, and two record decisions already made.

## What changed

`docs/milestones/assurly-milestone-plan.md`, **v2.23 → v2.24.**

1. **REQ-030** — the shadowing claim corrected. **Two confirmed instances, not three.**
2. **REQ-013's test scope** — the route-ordering assertion qualified to **same-method collisions**.
3. **REQ-046 added** to M2 — no multi-statement write in `main.py` is transactional.
4. **REQ-030** — the one claim only production can confirm, recorded as a gate step.
5. **REQ-042** — the renewal trigger recorded as settled, with the rejected alternatives.

Plus §4's M2 row, §8 (REQ-030, REQ-014, REQ-046) and REQ-014's own block.

**No code. No contract change.**

## ⚠️ The version instruction could not be followed literally — again

The brief said **"Bump to v2.23"**. The plan was **already at v2.23**, from the §2.6 versioning
correction pushed earlier today (`e3166bd`).

**This is the v2.19/v2.20 situation and it was handled the same way**, which is the point of
having written the precedent down: §2.6 now says a published version is **superseded, not
overwritten**. So this is **v2.24**.

**One difference worth stating, because it changes what the check was.** v2.19's re-send shared
four of five items with what was already applied, so the work was to **diff before touching
anything.** Here **none of the five items overlaps v2.23**, which was §2.6 only — so nothing was
re-applied and nothing was at risk of duplication. **I checked that rather than assuming it**,
because the assumption that a repeated version number means a repeated instruction is exactly
what the precedent exists to catch.

## Root cause — the corrections

**Both of today's corrections come from the same habit: a mechanism that explains the symptom was
accepted without testing whether a different mechanism would explain it equally well.**

**"Registered below, therefore unreachable" is a completely plausible account of a `405`.** It
fits the symptom, it matches a real defect class this file has produced, and **it is wrong.**
Starlette prefers a full match anywhere in the table over an earlier method-mismatch partial. The
test that settles it takes about a minute:

| Setup | Result |
|---|---|
| `POST /x/reorder` after `GET /x/{id}` | **`200`** |
| No `POST` route at all | **`405`** |
| `GET /x/reorder` under `GET /x/{id}` | genuinely shadowed |

**v2.10's amendment asserted the opposite as a consequence — "registering it below would leave
the `405` in place" — and that assertion is what carried into REQ-013's test.** So a wrong
mechanism did not stay contained in the requirement that produced it; **it became the
specification for a test in a different milestone.**

**This is §2.2.7's territory, not the preamble's.** The claim was not unlabelled — it was stated
as a confirmed consequence of a gate result. The gate result was real (`405` observed); the
mechanism inferred from it was not tested. **A gate tells you what was exercised, not why it
behaved that way** — which is the same sentence the v2.20 entry ended on, about REQ-033.

## What was deliberately not changed

- **The v2.10, v2.11 and v2.12 changelog rows**, which all state the three-instance framing.
  Left as written; v2.24 supersedes them and says so. **Rewriting a published row to say
  something it never said would falsify the record** — §2.6.
- **The route's placement.** Above its sibling, as built. The correction changes the *reason*,
  not the code, and the plan now says explicitly not to move it back.
- **REQ-012's blocks.** Its two instances were real shadowing and nothing about them changes.
- **The `autocommit` finding's scope.** REQ-046 is an audit-then-fix, and the audit reports
  first. Fixing nine handlers on the strength of a grep count is how this file got here.

## Findings — flagged, not fixed

- **The three-instance claim survived because it was useful.** It supported a conclusion the plan
  wanted — "a property of the file, not three separate errors" — and that conclusion is still
  defensible at two instances. **A count that is load-bearing for an argument gets checked less,
  not more**, which is worth noticing given how much of this plan is arguments built on counts.
- **REQ-013's test is now the only place the corrected rule is written as an assertion.** If that
  test is ever descoped, the correction survives only as prose in a superseded-looking block.
- **`update_standard` is the second requirement in two sessions to name the same handler.**
  REQ-030 removed a dead field from its model; REQ-046 names its three-statement write as the
  dangerous case. **It also takes an untyped `dict` body.** Nothing has yet owned it end to end.
- **REQ-046 is the third audit-shaped requirement now open** — REQ-040 on `mat_aspects`, REQ-044
  on cache invalidation, REQ-046 on transactions. **All three follow the same pattern: a defect
  was fixed, and the fix revealed a class.** That is a healthy signal about the diagnosis and a
  worrying one about M2's size, and the three should be sequenced deliberately rather than
  arriving together.

## What the next session needs to know

- **Do not re-assert the three-instance framing.** It appears in three changelog rows, all
  superseded, and correcting a row is not the remedy — reading the current requirement is.
- **REQ-046 reports before changing anything**, and **must not** be implemented by flipping
  `autocommit` to `False`.
- **REQ-030's gate checks the "Updated" date, not the order.** The order will look right either
  way.
- **REQ-042's trigger is settled**; do not re-open the timer-versus-request question.

## Verification

- **All five items applied and re-read.** The plan searched for every occurrence of the
  three-instance framing: **three in live requirement text** (REQ-030's amendment, REQ-013's test
  scope, and the paragraph on independent arguments for test infrastructure) — all three
  corrected — and **three in changelog rows** (v2.10, v2.11, v2.12), all left as written.
- **The routing claim was verified by running it before it was written into the plan**, not after.
- **§8 rows containing a tick: 15, unchanged.** REQ-046's new row carries none, and no
  requirement gained or lost one this session.
- REQ-046 placed after REQ-040/REQ-044 and before REQ-045 in §6's M2 section; present in §4's M2
  row and §8. **The M2 row now reads `REQ-044 → REQ-046`** rather than listing them separately.
- The M3 dependency is recorded **in both directions** — in REQ-046 and in REQ-014 — because a
  dependency written on one side only is found by whoever did not need it.
- **Not verified:** anything in production.

---

## Notes for the release summary

*No user-facing change. Planning only.*
