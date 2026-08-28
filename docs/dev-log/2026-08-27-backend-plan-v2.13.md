# Session — Milestone plan v2.13 (gate 2 result) — Backend

**Date:** 2026-08-27
**Agent:** Claude Code
**Milestone:** M1
**Version after this session:** no bump — documentation only
**Deployed:** no — plan edits are not deployable. The work this session *records* (REQ-010's encoding and validation half) is deployed: **gate 2, 2026-08-27**.
**Contract version worked against:** assurly-api-contract.md v2.9

---

## What this session was for

Record gate 2's result, and the diagnostic and operational preconditions that gate 3 now
carries.

## What changed

`docs/milestones/assurly-milestone-plan.md`, **v2.12 → v2.13** — see the changelog row.

- **REQ-010** — gate 2 recorded as passed, with the evidence; migration scope reduced;
  requirement stays open.
- **§2.7** — a new **Gate 3** block: diagnostic task first, migration second with an explicit
  commit-and-verify precondition.
- **REQ-038** added (M1, frontend).
- **DATA-001** — fourth row, the empty-string `source_aspect_id`.
- §8, the M1 lists and the §4.1 count updated.

**Schema changes:** none. **Contract changes:** none.

## What was deliberately not changed

- **No code**, and **nothing in `mat_aspects`** — gate 3 owns both.
- **The migration script.** Its §3 already contains post-commit verification and a
  commented-out `COMMIT;`. The plan now makes that a hard requirement, but editing the script
  belongs to the session that runs it, which must also cut its scope down to one row.
- **Historical changelog rows** that reference "gate 1" and "gate 2" with the older numbering.
  They are history and were correct when written; rewriting them to match current numbering
  would be the same mistake as renumbering §2.2 would have been.

## Root cause

Not a defect session. But the gate 2 result is worth recording as a methodological outcome as
well as a factual one.

**The `%2F` decode mechanism carried a §2.2.7 provisional label across three plan versions**
(v2.9, v2.10, v2.12). It was reasoning about how uvicorn unquotes a path before Starlette
matches — sound, consistently labelled as analysis, and never confirmed. **Gate 2 confirmed it
by direct test**: one aspect could not be renamed; its code was changed from `IT/DATA_OP` to
`IT_DATA_OP`; the rename succeeded. One variable, one outcome.

That is what the provisional convention is for. The claim was load-bearing for a primary-key
migration, it was labelled rather than asserted, and it survived contact with reality. **The
label comes off because evidence arrived, not because the claim got old.**

## Assumptions made

- **Gate 2's verdict and the rename test are taken as reported.** I have no production access
  and did not observe either.
- **The autocommit inference is taken as reported.** "Reported success and did not persist" is
  consistent with autocommit being disabled, and it is the most likely explanation, but it is
  an inference from a symptom rather than a confirmed setting. **The migration's precondition
  is written so that it holds regardless** — an explicit `COMMIT` plus post-commit
  re-query is correct whether or not autocommit is the cause, which is why I did not make the
  precondition conditional on confirming it.

## Findings — flagged, not fixed

- **The migration may now have nothing to do, and that is a failure mode of its own.** With
  `IT/DATA_OP` repaired manually, `IT\DATA_ST` is the only remaining target — and if that row
  was also touched, the script's §2 rename block would match zero rows. A primary-key rewrite
  that silently matches nothing, run under a connection that may not commit, would produce a
  confident "migration applied" with no change and no error. **The plan now requires verifying
  the target exists before running.** Discovery query 1a in the script answers it.
- **Two manual data changes have now been made to `mat_aspects` outside any migration** — the
  `IT/DATA_OP` rename at gate 2, and the failed Cloud SQL Studio `UPDATE`. Neither is recorded
  in the migration script or in DATA-001. **The gate 3 session should establish the table's
  actual current state before writing anything to it**, rather than trusting either this plan
  or the script's worked example.
- **`IT/DATA_OP` was repaired by changing `aspect_code`, not `mat_aspect_id`.** If only the
  code column was updated, the primary key may still read `HLT-IT/DATA_OP` while the code
  reads `IT_DATA_OP` — which would leave the row addressable-by-id-but-inconsistent, and the
  rename succeeding for a different reason than assumed. **Worth confirming both columns at
  gate 3.** Flagged as a question, not a claim: I have not seen the row.

## What the next session needs to know

- **Gate 3's first task is diagnostic and the plan says not to read more code first.** Three
  rounds of reading have produced three disproved hypotheses. The complete handler query, run
  in the deployed environment, is the next step.
- **REQ-010 is still open**, and §8 says so. Only the gate-2 half is done.
- **REQ-038 should be diagnosed against REQ-027 before being fixed.** They may share a cause;
  they may not. REQ-027 was an uninvalidated request cache, whereas this looks like a
  component holding its own copy — fixing by analogy would miss.

## Verification

- All five instructed edits applied and re-read in place.
- **§8 ticks re-counted: 10, unchanged** — correct for a result-and-scope pass, since REQ-010
  gained no tick (it remains open) and REQ-038 starts unticked.
- **Stale gate numbering hunted deliberately.** The REQ-010 status row still read "pending
  gate 1 … pending gate 2" from when the gates were numbered differently; corrected to gates 2
  and 3. A grep confirmed the only remaining "pending gate 1/2" strings are inside historical
  changelog rows, which are left alone.
- Requirement ordering in §6 re-checked after insertion — REQ-038 had landed before REQ-035
  and was moved after it, keeping REQ-036 and REQ-037 last as their lowest-priority status
  requires.
- The new §2.7 Gate 3 block checked for heading-level collision: it sits as an `####` under
  the `### 2.7` heading and does not disturb the `§2.x` numbering that four other documents
  cite.
- **Not verified:** anything in production. No gate verdict independently confirmed.

---

## Notes for the release summary

*No user-facing change. Planning only.*
