# Session — Milestone plan v2.11 (gate 1 result) — Backend

**Date:** 2026-08-27
**Agent:** Claude Code
**Milestone:** M1
**Version after this session:** no bump — documentation only
**Deployed:** no — plan edits are not deployable. The work this session *records* is deployed: gate 1, 2026-08-27.
**Contract version worked against:** assurly-api-contract.md v2.9

---

## What this session was for

Record gate 1's result, and turn a round of UAT findings into requirements. Also write the
missing dev log for the dependency-pin session, which §2.5 required and I had skipped.

## What changed

`docs/milestones/assurly-milestone-plan.md`, **v2.10 → v2.11** — see the changelog row.
`docs/dev-log/2026-08-27-backend-dependency-pins.md` — new, retrospective, `Deployed: yes`.

**Schema changes:** none. **Contract changes:** none.

## What was deliberately not changed

- **The gate 1 verdicts themselves.** Recorded as given; agents do not declare gates (§2.7).
- **REQ-028's priority**, lowered as instructed — but with the reachability correction
  recorded adjacent to it rather than buried in this log. See below.
- **REQ-036's scope**, written as an exposure change plus an open question rather than the
  build it was framed as. The framing changed because the code says otherwise.
- Any code. This was a documentation session.

## Root cause

Not a defect session. But two of this round's items rested on premises the code contradicts,
and both contradictions have the same shape: **a feature was judged absent because its
entry point is conditional.** Aspect deletion is not missing — it is gated on `is_custom`.
That is the same class of error as REQ-010's, where a value was judged safe because the
visible label looked safe. §2.2.8 was written for the identifier case; it generalises.

## Corrections to the instructions, applied as written but flagged

**REQ-028 is not unreachable from the application.** The instruction lowered its priority on
the basis that "no UI exposes aspect deletion, so the endpoint is only directly callable".
`StandardsManagement.tsx:408-419` renders a **Delete Aspect** dropdown item, gated on
`currentAspect.is_custom`.

That gating makes the correction worse, not better: **custom is precisely the branch that
triggers REQ-028.** `delete_aspect` archive-renames the primary key for customs and only sets
`is_active = 0` for defaults — and the PK rewrite is what collides with
`fk_mat_standards_aspect` (`ON UPDATE NO ACTION`). So the 500 is reachable from the UI today,
for a custom aspect with zero active and at least one inactive standard.

Priority is lowered as instructed and it still ships with the REQ-010 migration. **But it is
user-facing, and the product owner may want to revisit on the corrected facts.**

**REQ-036 is smaller than framed, and possibly larger.** "The application exposes no way to
delete an aspect" is half right. Deletion is fully wired for **custom** aspects — menu item,
shared `DeleteConfirmationModal`, handler, toasts. Only **defaults** lack the control. So the
scope is exposure, not construction — and it is a product decision first, because hiding
deletion for platform defaults is plausibly deliberate.

The "possibly larger" half is the open question, which I could partly answer:
`InactiveStandardsModal.tsx` exists; **there is no aspects equivalent** in
`components/admin/standards/`. And `use-standards-persistence.ts:328` tells the user on
deactivation that they can reinstate "from the inactive aspects section" — **a section that
does not exist.** That toast is itself unreachable today, since it fires only for reinstatable
aspects, which are defaults, which cannot be deleted from the UI. So REQ-036 may need an
inactive-aspects view **built** rather than extended.

That also explains the gate 1 gap cleanly: **nothing in the application has ever called
`/api/aspects/inactive`**, which is why its route shadowing was never noticed by a user.

## Assumptions made

- **Gate 1's verdicts are taken as reported.** I have no production access and did not verify
  any of them.
- **The REQ-030 405 diagnosis is taken as reported and is consistent with the code**:
  `GET /api/standards/{mat_standard_id}` is registered at `main.py:1279` and would match
  `POST /api/standards/reorder` on path but not method. I have not observed the 405.

## Findings — flagged, not fixed

- **`use-standards-persistence.ts:328` promises a UI that does not exist** — "the inactive
  aspects section". Currently unreachable, so harmless today; it becomes a visible lie the
  moment REQ-036 exposes deletion for defaults. Whoever takes REQ-036 must fix the toast or
  build the section, not one without the other.
- **REQ-030 is the third instance of literal-after-parameterised route shadowing in
  `main.py`**, after the two REQ-012 fixed. Three occurrences of one mistake in one file is a
  pattern, not a coincidence. **A check that literal paths precede parameterised siblings
  would be worth more than fixing them one at a time** — but there is no test infrastructure
  to put it in (see REQ-013's scope note), so this is a recommendation, not a requirement.
- **`mat_standards` has `created_by_user_id` but no `updated_by`** — recorded in REQ-035, and
  worth noting that `assessments` has both. The inconsistency is the reason REQ-035 costs a
  migration.

## What the next session needs to know

- **REQ-012 is still open** on one endpoint. Calling `/api/aspects/inactive` directly is a
  one-minute check that closes it; one row (`Mock aspect`) is expected.
- **REQ-035 must report before implementing.** The schema answer is already established — a
  new column is needed — so the report is about whether to mirror `assessments.updated_by`,
  not about whether a change is required.
- **REQ-033 and REQ-007's modal should be diagnosed together** before either is fixed.
- M1 now carries fifteen defects and enhancements. **REQ-036 is explicitly last and
  deferrable**, which is the right pressure valve if the milestone runs long.

## Verification

- Both new facts written into the plan were **checked against the code before being recorded**,
  not inferred: the `is_custom` gate on the delete menu item (`StandardsManagement.tsx:408`),
  the absent `InactiveAspectsModal` (directory listing of `components/admin/standards/`), the
  orphaned toast (`use-standards-persistence.ts:328`), and the missing `updated_by` column
  (data model §11).
- §8 ticks re-counted after the edits; the four gate 1 passes are the only rows that gained
  ticks.
- Requirement ordering in §6 re-checked after insertion — REQ-029 had landed after REQ-031 and
  was moved back into sequence. **REQ-036 sits last, after DATA-001, deliberately**, per the
  instruction to place it last in the milestone.
- **Not verified:** anything in production. No gate 1 verdict was independently confirmed.

---

## Notes for the release summary

*No user-facing change. Planning only.*
