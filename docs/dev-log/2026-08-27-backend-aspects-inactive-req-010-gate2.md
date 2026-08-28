# Session — `/api/aspects/inactive` diagnosis, and REQ-010 gate 2 — Backend

**Date:** 2026-08-27
**Agent:** Claude Code
**Milestone:** M1
**Version after this session:** **1.43.5** (REQ-010 gate-2 half). Records a merge, not a deployment — §2.6.
**Deployed:**
- **Part 1 — no.** Diagnostic only; nothing deployable was produced.
- **Part 2 — yes, ships in gate 2.** Recorded as intent: agents do not declare gates passed (§2.7), so the result is the product owner's to confirm.

**Contract version worked against:** assurly-api-contract.md v2.9

---

## What this session was for

Two unrelated pieces of aspects work. First, establish why `GET /api/aspects/inactive`
returns `[]` for HLT despite a qualifying row — the last thing keeping REQ-012 open. Second,
verify and complete REQ-010's gate-2 half.

## What changed

**Part 1: nothing.** Read-only, as instructed.

**Part 2 — `1a085da`:** `assurly-frontend/src/services/users-service.ts:55` —
`encodeURIComponent` on the `user_id` path parameter. One line.

**Schema changes:** none. **Contract changes:** none.

---

# Part 1 — `/api/aspects/inactive`

## The cause is NOT established. This section records a narrowing, not an answer.

The row: `Mock aspect`, `mat_aspect_id f9928571-e945-45b9-b6f1-b1457856768e`,
`aspect_code 'mck'`, `is_custom = 0`, `is_active = 0`.

**What is ruled out**

| Hypothesis | Status |
|---|---|
| Route shadowing (REQ-012 regression) | **Ruled out.** The route resolves and returns `200`; a shadowed route would hit `get_aspect` and return `404`. |
| A handler difference vs the working standards endpoint | **Ruled out.** The two `WHERE` clauses are identical modulo table alias. |
| MAT scoping mismatch | **Ruled out by production query.** `mat_id` is `'HLT'` in both tables, three bytes, no `CHAR` padding, matching the JWT. |
| `is_custom` / `is_active` stored as NULL | **Ruled out by production query.** Both are stored as `0`. |
| The query itself | **Ruled out.** The handler's exact `WHERE` predicate returns the row when run directly against the database. |

**So the query is correct and the data is correct, and the endpoint still returns an empty
array.** Both hypotheses from my Part 1 report were wrong. Recording that plainly: I offered
two candidates, production disproved both, and the cause remains open.

## Surviving candidates — as candidates

1. **An exception in the `standards_count` correlated subquery or the computed `is_modified`,
   swallowed and returning an empty list.**
2. **Post-fetch filtering** between `fetchall()` and the response.
3. **A fourth route-shadowing instance**, if another parameterised aspects route is registered
   above `/inactive`.

## Narrowing — analysis, not observation

> **Provisional per §2.2.7.** What follows is reasoning from the code on `sprint-2.0`. I have
> no production access and have not seen the deployed handler. It is offered to direct the
> next diagnostic step, not to close the question.

Against the branch code, **all three candidates have difficulties**:

- **(1)** `get_inactive_aspects` ends `except Exception as e: raise HTTPException(500, ...)`.
  It **re-raises rather than swallowing**, so an exception anywhere in the query produces a
  `500`, not `[]`. A `200 []` is not reachable by this route on the branch code.
- **(2)** There is **no post-fetch filtering** in the branch handler. It is
  `aspects = cursor.fetchall()` → `connection.close()` → `return aspects`. Nothing between.
- **(3)** Checked directly. Every `/api/aspects` route in registration order:
  `GET /api/aspects` (L2096), **`GET /api/aspects/inactive` (L2154)**,
  `GET /api/aspects/{mat_aspect_id}` (L2198), then `POST`, `PUT`, `DELETE`, `reinstate` — all
  parameterised ones below. **No fourth shadowing on the branch**, and the observed `200`
  independently argues against it in production.

**Where that points.** On the branch code, `[]` is only reachable if `fetchall()` returned
zero rows — and the predicate demonstrably returns the row when run directly. The difference
is therefore **between the branch handler and what actually executed**: either the deployed
revision is not running this code, or the execution context differs from the session the
production query ran in.

**The cheapest next step is not another code read.** Run the handler's **complete** query —
not just the `WHERE` predicate, but the full statement including the `LEFT JOIN aspects`, the
computed `is_modified` and the `standards_count` subquery — with `%s` bound to the exact
`mat_id` the JWT carries, against the database the deployed service connects to. If the full
query returns the row, the fault is environmental (connection, schema, or deployed artefact)
rather than logical, and no amount of reading `main.py` will find it.

## Findings — both stand regardless of cause

**1. The aspects family has two competing definitions of `is_custom`, across six handlers.**

| Handlers | Source |
|---|---|
| `GET /api/aspects`, `GET /api/aspects/inactive`, `DELETE`, `reinstate` | **stored** `ma.is_custom` |
| `GET /api/aspects/{id}`, `PUT /api/aspects/{id}` | **computed** `CASE WHEN source_aspect_id IS NULL THEN 1 ELSE 0 END` |

The standards family uses the stored column throughout and is self-consistent. **The aspects
family is not.** Wherever the stored column and `source_aspect_id IS NULL` disagree, the
detail and update endpoints report one thing while the list, inactive, delete and reinstate
endpoints act on another. DATA-001 already records a row where they disagree.

A practical consequence worth stating: **an `is_custom` value read from the API is not
evidence about the stored column**, and which endpoint it came from decides what it means.

**2. Filtering a nullable boolean with `= FALSE` silently drops NULLs.** `is_active` and
`is_custom` are `tinyint(1) NULL` in both `mat_aspects` and `mat_standards`. `NULL = FALSE`
evaluates to NULL, so such rows vanish from **both** inactive endpoints with no error. Not the
cause here — production confirms these are `0` — but latent in both handlers, and it will bite
the first time a NULL appears. `IS NOT TRUE` or `COALESCE(flag, <default>) = 0` states the
intent.

**3. `source_aspect_id` on this row is an empty string, not NULL.** That is an anomalous
foreign key value: the column is `char(36) NULL` and FK-constrained to `aspects.aspect_id`,
where NULL means "no source" and `''` means "a source whose id is the empty string". **This
row behaves unlike every other row under any code path that treats `''` as a valid
reference** — and there is one directly overhead: the computed `is_custom` above tests
`source_aspect_id IS NULL`, and `''` is not NULL, so the detail and update endpoints classify
this custom-looking aspect as a **default**. Belongs with DATA-001.

## The fix lands in gate 3

Settled: **with the REQ-010 migration and REQ-028.** All three are aspects work on
`mat_aspects`, all three touch the same table, and §2.7 puts the migration in a gate of its
own regardless. Bundling the diagnosis with them means whoever loads that context spends it
once.

**REQ-012 remains open** until the endpoint returns its one expected row.

---

# Part 2 — REQ-010, gate 2 scope

## Verified intact after the intervening merges

- **10** `encodeURIComponent` sites in `assessment-service.ts`; no unencoded interpolation
  left in that file.
- `ASPECT_CODE_PATTERN = ^[A-Za-z0-9_]{2,10}$` present in `main.py`.
- The Zod mirror present in `CreateAspectModal.tsx`.

## The create-path question — answered, and more strongly than asked

The instruction was to confirm validation applies on create, "if it only guards update, that
is the gap". It is better than that:

- `POST /api/aspects` binds `MatAspectCreate`, which carries `aspect_code` **and** the
  validator. **Create is guarded.**
- `create_aspect` holds the **only** `INSERT INTO mat_aspects` in the backend. It is the only
  path that mints a `mat_aspect_id` — there is no seeding or onboarding route around it.
- **`MatAspectUpdate` declares no `aspect_code` field at all.** Rename cannot alter the code,
  rather than merely being validated when it does. A structural guarantee, not a check.

Exercised at runtime against the **real** broken codes rather than synthetic ones:
`IT/DATA_OP`, `IT\DATA_ST` and `IT & Data` are rejected on create; `mck` and `EDU` accepted;
a 1-character and an 11-character code rejected.

**No third unreachable row can now be created.**

## What was deliberately not changed

- **The migration** (gate 3), **REQ-028**, and anything in `mat_aspects` — explicitly out of
  scope.
- **The two Part 1 findings.** Both are real defects; neither was in scope, and the second
  would be a speculative change to a working endpoint.
- **The `is_custom` inconsistency.** Reconciling six handlers onto one definition is a
  decision about which definition is correct, not a tidy-up.

## What this half fixes, and what it does not

Worth keeping straight, because the two failing aspects fail differently:

| Aspect | `aspect_code` | Repaired by |
|---|---|---|
| `IT\Data` | `IT\DATA_ST` | **This gate-2 half** — encoding |
| `IT & Data` | `IT/DATA_OP` | **Gate 3 only** — `%2F` decodes to `/` before routing |

Plus the forward guarantee: validation stops any further such row being minted, which is the
half that matters more, since the migration cleans up two rows and the validation prevents the
third.

## Verification

**Ran, and passed:**

- Backend validator exercised at runtime through the real Pydantic model, against the two
  production codes and five boundary cases.
- `MatAspectUpdate.model_fields` inspected directly to confirm `aspect_code` is absent —
  read from the model, not inferred from the source.
- `POST /api/aspects` body model confirmed as `MatAspectCreate` by inspecting the handler
  signature.
- Repository-wide search for unencoded `apiClient` path interpolations: **none remain**
  anywhere in the frontend.
- `npx tsc -b` → exit 0.
- `npx eslint` over the three touched files → 4 pre-existing `no-explicit-any` errors, and the
  **same count on a stashed tree**. No new lint errors.
- Every `/api/aspects` route enumerated in registration order to check candidate 3.

**Not run, and not claimed:** no database, no production call, no deploy. Every Part 1 fact
attributed to production was supplied to me, not observed by me.

## What the next session needs to know

- **The `/api/aspects/inactive` cause is open**, and the next step is running the **full**
  handler query in the deployed environment rather than reading code. Two rounds of code
  reading have now produced three disproved hypotheses; the remaining difference is between
  the code and its execution.
- **REQ-012 stays open** on that one endpoint.
- **Gate 2 carries only half of REQ-010.** REQ-010 is not complete in §8 until gate 3 lands
  the migration (§2.7).
- Gate 3 now bundles three aspects items: the REQ-010 migration, REQ-028, and this fix.

---

## Notes for the release summary

*Renaming an area whose code contains an unusual character now works, and new area codes are
restricted to letters, digits and underscore. One area with a slash in its code remains
unreachable until a data fix lands.*
