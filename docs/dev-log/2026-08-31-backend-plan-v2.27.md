# Session — Milestone plan v2.27 (REQ-049, REQ-050, four records) — Backend

**Date:** 2026-08-31
**Agent:** Claude Code
**Milestone:** M1
**Version after this session:** no bump — documentation only
**Deployed:** no — plan edits are not deployable
**Contract version worked against:** assurly-api-contract.md v2.14

---

## What this session was for

Two new M1 defects, one requirement folded into another, and four things recorded so they are
not rediscovered or undone.

## What changed

`docs/milestones/assurly-milestone-plan.md`, **v2.26 → v2.27.**

1. **REQ-049 added** — lowercase `aspect_code` and the category mapping. **Premise corrected.**
2. **REQ-050 added, absorbing REQ-031** — `|| new Date()`, third instance.
3. **REQ-007's frontend half** recorded as living in the same function as REQ-050.
4. **REQ-014 gains `'approved'`.**
5. **The `due_date` / overdue aggregate asymmetry** recorded on REQ-007.
6. **`overdue` shadowing `not_started` and `in_progress`** recorded on REQ-009.

Plus §4's M1 row, §8 (six rows), and a note on REQ-040.

**No code.** Contract untouched.

## REQ-049: the premise does not hold, and the real defect is a different one

**Checked against the code before writing the requirement**, per §2.2's preamble. Four findings,
and they change both the scope and the priority:

1. **The warning is not from `aspectCodeToCategory`.** It is `getCategoryIcon`
   (`Assessments.tsx:458`), a `switch` whose `default` warns and returns a generic icon —
   **cosmetic by construction.**
2. **`aspectCodeToCategory` never returns `undefined`.** `data-transformers.ts:39` is
   `map[aspectCode] || aspectCode.toLowerCase()`. **So the chain "undefined category → REQ-008's
   filter breaks" does not follow.**
3. **For `ld`, `ab`, `ey`, `mck`, filtering should work** — the filter's option values are built
   by **the same function**, so both sides miss the map, both lowercase, both agree.
4. **There is a real filter defect and it is a different one.** `GET /api/assessments` returns
   `UPPER(ma.aspect_code)`; `GET /api/aspects` returns the stored casing. **A code stored
   lowercase that lowercases into a map key** yields `education` on one side and `edu` on the
   other — **silently unfilterable.**

**So the priority question the brief asked — cosmetic or filter-breaking — has a conditional
answer, and the condition is a production fact.** The requirement carries the SQL to hand over
(§2.4): no rows ⇒ cosmetic; any rows ⇒ M1-blocking.

**The prediction is written into the requirement on purpose.** The brief asks for the Leadership
filter to be tested. **`ld` is not a map key, so it should work** — and saying so in advance is
what makes the result informative. If it fails, this analysis is wrong somewhere and that is the
more valuable finding. **REQ-010's gate 2 is the precedent: a test whose outcome nobody predicted
could not discriminate, and a wrong claim survived three plan versions because of it.**

## REQ-050 and why REQ-031 is folded rather than kept

**Three instances of one defect.** REQ-011 fixed the first and named the second; REQ-031 was
raised for the second **and sat unclaimed across five plan versions**; the third was found by
accident while reading `use-assessments.ts` for REQ-047.

**Keeping them as separate numbers is what produced that.** The scope is therefore **to search
the pattern, not to fix the two named files** — three instances is evidence that a file list is
not the scope.

**Folded, not retired**, and the plan says so: the work stands, the number does not. REQ-031's
block keeps its "belonged to nobody" note, because **why it went unclaimed is the more useful
half** — both agents scoped it out, the backend brief covering the API and the frontend brief the
standards card.

## What was deliberately not changed

- **No code.** Both new requirements are frontend and neither is scoped to me.
- **REQ-008.** REQ-049 would have reopened it if the undefined-category chain had held. It does
  not, so REQ-008 stays closed. **Recorded because the brief's framing pointed at it.**
- **The v2.26 and earlier changelog rows.** REQ-009's block carries the `500` correction
  inline with the original claim struck through; the rows stay as written (§2.6).
- **REQ-035's null convention.** Settled under REQ-047 and reused, not re-decided.

## Findings — flagged, not fixed

- **`GET /api/assessments` uppercases `aspect_code` and `GET /api/aspects` does not.** That
  asymmetry is the actual mechanism behind REQ-049's real case, and **it is a backend
  inconsistency surfacing as a frontend defect.** Recorded under REQ-040 rather than fixed:
  normalising one endpoint without the other is how this shape propagates.
- **Five of the last seven defects have originated in `aspect_code`'s missing casing invariant.**
  REQ-040 was scoped at five. **This is the seventh instance of the family and the second on the
  frontend**, which is an argument for bringing REQ-040 forward rather than for adding an eighth
  requirement.
- **`transformAssessmentByAspectToAssessment` now carries three recorded defects** — REQ-007's
  `due_date: null`, REQ-050's fabricated timestamp, and REQ-047's hardcoded `submitted_by_name`
  and `assigned_to_name`, which are not yet anyone's. **A 60-line function with three known
  fabrications is a candidate for rewriting rather than patching**, and REQ-048 will probably
  reach the same conclusion from the other direction.
- **M1 has grown by two this session**, against a milestone closed to scope growth at v2.15.
  **Both are defects rather than features, so the closure holds** — but M1's open count is now
  higher than when it was closed, and that is worth seeing rather than inferring.

## What the next session needs to know

- **REQ-049 needs the SQL run before it is scoped.** Priority is genuinely undetermined until then.
- **REQ-050 and REQ-007's frontend half are one session, two commits.** Same function.
- **Do not "fix" the `due_date` / overdue asymmetry.** It is deliberate and documented in both
  the contract and the plan.
- **`overdue` shadowing the other two statuses is the most likely gate-time surprise.** A screen
  that looks like it lost rows has not.

## Verification

- **REQ-049's four claims each read from the file and line cited**, before the requirement was
  written rather than after. **The fourth — the uppercase/stored-casing mismatch — was not in the
  brief and is the one that matters**, which is the argument for checking.
- **§8 rows containing a tick: 15, unchanged.** REQ-049 and REQ-050 carry none; REQ-031's row
  changed status text only.
- REQ-049 and REQ-050 placed in §6's M1 section, in §4's M1 row and in §8; REQ-031's block and
  row both point at REQ-050.
- **The M3 dependency and the REQ-040 note are recorded on both sides**, as with REQ-046/REQ-014.
- **Not verified:** anything in production — including, specifically, whether any aspect code
  lowercases into a mapping key, which is the fact REQ-049's priority depends on.

---

## Notes for the release summary

*No user-facing change. Planning only.*
