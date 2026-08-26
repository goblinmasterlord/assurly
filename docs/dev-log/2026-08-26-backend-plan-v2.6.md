# Session — Milestone plan v2.6 — Backend

**Date:** 2026-08-26
**Agent:** Claude Code
**Milestone:** M1
**Version after this session:** no bump — documentation only, nothing shipped
**Contract version worked against:** assurly-api-contract.md v2.5

---

## What this session was for

Applying eleven directed plan edits following four production SQL queries and a check of the
live OpenAPI spec. Several of the edits correct conclusions from my own earlier audit
sessions; one withdraws a finding outright.

## What changed

`docs/milestones/assurly-milestone-plan.md`, bumped **2.5 → 2.6** with a single changelog
row covering the set. All §8 ticks preserved (AUD-001 and DOC-001 remain `☑`).

- **§4** — M1 row now `AUD-001, DOC-001, DOC-002, DOC-003, SEC-001, REQ-007 → REQ-012`.
- **REQ-006 retired**, not completed, and removed from M1 in §4, §6 and §8. §6 keeps a
  retirement stub explaining why; §8 shows it as `Retired — merged into REQ-017`.
- **REQ-017 rewritten** as a full rebuild of both layers.
- **SEC-001 added** to M1 — verify, document and report on the super-admin guard.
- **DOC-003 added** to M1 — reconcile the three documents asserting evidence is live.
- **REQ-007** — "unwired mock" struck; `COALESCE(a.due_date, t.end_date)` recorded as the
  settled derivation; the closed-term overdue rule recorded for M3; the manual test recorded
  as a precondition.
- **REQ-008** — `localStorage` filter-restore defect folded in as the same root cause.
- **REQ-009** — `MAX(due_date)` recorded as the wrong aggregate, with the REQ-007
  interaction.
- **REQ-010** — primary-key migration recorded as required; `IT & Data` recorded as open.
- **REQ-011** — "Updated" defined as a material edit, excluding reordering.
- **REQ-012** — `/api/standards/inactive` folded in.
- **REQ-013** — `SUPER_ADMIN_EMAILS` recorded as the mechanism M2 must extend.
- **REQ-015** — vacation-gap correction, settled term rules, and the 1 September 2026 risk.

`docs/dev-log/2026-08-25-backend-aud-001.md` — correction block prepended withdrawing the
vacation-gap finding.

**Schema changes:** none.

**Contract changes:** none. DOC-003 and SEC-001 schedule contract work; neither was performed
in this session.

## Consequential edits not in the directed list

Three edits followed necessarily from retiring REQ-006 and are flagged rather than assumed:

- **§4's M4 gate** read "REQ-006 closed". That gate could not survive REQ-006's retirement,
  so it now reads "None", with the instruction that M4 keeps its position in the sequence.
- **§6's M4 gate line** read "REQ-006 closed; Q1 answered" and was updated the same way.
  Note this also dropped the "Q1 answered" clause, which referred to a §5 open question that
  no longer exists — worth confirming that was intended.
- **§4.1** described M1 as "Seven live defects". Now six, with the change noted inline.

One cosmetic edit: DOC-003 and SEC-001 were initially inserted before DOC-002, leaving the
DOC items out of sequence. Reordered to DOC-001, DOC-002, SEC-001, DOC-003.

## What was deliberately not changed

- **The API contract and data model bible**, despite both now being known wrong about the
  evidence endpoints. Correcting them is DOC-003's scope, and DOC-003 has not been run.
- **The M1 backend audit file.** Several of its open items are now closed by the production
  queries (the GCS bucket is known; `due_date` is null on all rows). The audit remains an
  accurate record of what was knowable at the time, and amending it retrospectively would
  destroy that. The plan carries the current position.
- **Everything in the AUD-001 entry apart from the withdrawn claims.** The correction is
  prepended as a block rather than edited into the original text.

## Root cause

Not a defect session. But the withdrawn finding has a cause worth recording, because it is a
process failure rather than a reasoning error:

The AUD-001 entry **correctly flagged** that terms data was taken from the data model
document rather than the database — and then reasoned from it as though it were verified,
producing a confident, specific, wrong claim about vacation gaps. Flagging an assumption in a
section at the bottom of a document does not neutralise it. A finding that rests on an
unverified assumption needs to be labelled provisional **in the finding itself**, where the
reader encounters it, not only in an Assumptions section they may never reach.

## Assumptions made

- **The production facts in the instruction are taken as given.** The term date ranges, the
  1,921-row null count, the `GCS_EVIDENCE_BUCKET` setting and the OpenAPI spec contents were
  supplied to me, not observed by me — I still have no database or production access. Where
  I could check a claim against the repository I did, and all such claims held.
- **`.env.example` carries a caveat that may matter to REQ-017 and I have recorded it rather
  than resolved it.** Dated 2026-06-04: `GCS_EVIDENCE_BUCKET` "is referenced in deployment
  infra but the backend Python code does not currently read it directly — upload +
  signed-URL handling is external". If upload genuinely lived outside the FastAPI app, the
  lost revision would not have been a useful reference for a FastAPI-native build even had it
  been recoverable. Noted on REQ-017; **needs a decision before implementation.**

## Findings — flagged, not fixed

- **Verified against the repository, all confirming the instruction:** `verify_super_admin`
  exists at `main.py:556` and is applied to both `/api/admin/mock-data/generate`
  (`main.py:3667`) and `/wipe` (`main.py:3797`). `cleanup_expired_tokens` (`main.py:777`)
  takes **no dependencies at all** — the absence of auth is real, not a spec artefact.
- **No test covers the super-admin guard.** `test_phase2_auth.py` is the only test file in
  the repository (4 tests: JWT creation, MAT-wide access, user response formatting, magic
  link generation). None touches `verify_super_admin`, the allow-list, or either admin
  endpoint. That answers SEC-001's "report whether any test covers it" ahead of the session
  — **the answer is no, and there is no test infrastructure to extend either.**
- **`.env.example` is unusually good and is the only place the super-admin mechanism is
  documented.** It states "Leave unset to deny everyone — no DB-level super-admin role
  exists". SEC-001's contract documentation should probably lift from it rather than start
  fresh.
- **The retirement of REQ-006 leaves M4 with no gate at all.** Every other milestone with
  sequencing significance has one. Worth confirming M4 genuinely floats free rather than
  being gated on, say, M2 for the permissions that govern who may upload evidence.

## What the next session needs to know

- The plan is **v2.6**. Anyone holding v2.3, v2.4 or v2.5 is stale; note there has never been
  a v2.4 in this repository.
- **SEC-001's test question is already answered** (no coverage, no infrastructure) — that
  session can start from the documentation work.
- **DOC-003 is the largest of the doc items**, because its third clause is open-ended: every
  `🚧 In-flight` tag removed across v1.5–v1.8 is untrusted until checked, and at least one
  was wrong. Budget for discovery, not just editing.
- REQ-012 and REQ-011 remain the cheapest real fixes in M1 and are both backend-first.

## Verification

- **§8 ticks confirmed intact after every edit** — AUD-001 and DOC-001 still `☑` on both
  Backend and Docs. This was the explicit constraint and was checked last, not assumed.
- Grepped for dangling `REQ-006 closed` / `Gated on REQ-006` references after the retirement;
  none remain. Every surviving REQ-006 mention is retirement context.
- Every code claim written into the plan was verified against the repository before being
  recorded — the `verify_super_admin` dependency and its two call sites, the
  `cleanup_expired_tokens` signature, the absence of super-admin test coverage, and the
  `.env.example` entries for both `SUPER_ADMIN_EMAILS` and `GCS_EVIDENCE_BUCKET`.
- Section ordering and the M1 requirement list re-read after the reordering edit.
- **Not verified:** the production facts supplied in the instruction. See Assumptions.

---

## Notes for the release summary

*No user-facing change. Planning documentation only.*
