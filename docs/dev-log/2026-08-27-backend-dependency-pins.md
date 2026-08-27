# Session — Dependency pins — Backend

**Date:** 2026-08-27
**Agent:** Claude Code
**Milestone:** M1
**Version after this session:** no bump — a dependency pin is not a shipped requirement
**Deployed:** **yes, gate 1** (2026-08-27)
**Contract version worked against:** assurly-api-contract.md v2.9

---

## What this session was for

`requirements.txt` pinned every dependency to an exact version except two. An unpinned
dependency plus no lockfile means the deployed behaviour of the API is decided by whatever
the build resolves on the day — and for `pydantic` that spans a major version with
incompatible semantics. Pinned before gate 1 rather than after, so the gate tests the
versions that will keep running.

## What changed

`assurly-backend/requirements.txt` — commit `6e00b96`:

```
python-dotenv==1.2.3
pydantic==2.13.4
```

plus a comment above the pydantic pin recording why the major version is not a free choice.

**Schema changes:** none.
**Contract changes:** none.

## What was deliberately not changed

- **`email-validator==2.1.0`**, which is yanked (see Findings). Replacing it is a dependency
  decision with its own testing, not something to fold into a pin commit.
- **The three deprecated `@validator` decorators.** Migrating them to `@field_validator` is a
  code change; this commit touched only the manifest.
- **`python-decouple`**, which was already pinned — see the correction below.

## Root cause

Not a defect session. The gap is ordinary: dependencies get pinned when someone is thinking
about reproducibility, and added when someone is thinking about features. `pydantic` and
`python-dotenv` were added later than the pinned block around them and nobody went back.

## Assumptions made

- **The deployed revision was running some 2.x.** Established by elimination rather than
  observation — see below — and the pinned version is what an unpinned resolve produces
  today, so gate 1 installed the same thing it would have installed anyway. The pin could not
  change what gate 1 shipped; it stops the *next* build differing.
- **Not verified:** the exact patch version the pre-gate-1 revision carried. It may have been
  an earlier 2.x. Since gate 1 rebuilt from the manifest, the question is now moot.

## Correction

**I reported three unpinned dependencies. There were two.** `python-decouple==3.8` was
already pinned on the last line of the manifest and I had missed it when skim-reading for
unpinned entries. The version I proposed happened to match what was already there, so the
commit's outcome is unaffected — that line is untouched — but the report was wrong and the
commit message records it.

## The pydantic constraint — the part worth keeping

`fastapi==0.110.1` declares:

```
pydantic!=1.8,!=1.8.1,!=2.0.0,!=2.0.1,!=2.1.0,<3.0.0,>=1.7.4
```

**That range spans the v1/v2 boundary**, so a resolver will happily offer pydantic 1.x and
nothing in the manifest prevents it.

**The application cannot run on v1.** `auth_models.py:104` calls
`UserResponse.model_rebuild()` — a v2-only API; the v1 equivalent is `update_forward_refs()`.
Built a pydantic 1.10.26 environment to check rather than reasoning about it, and the import
fails before a single route is registered:

```
AttributeError: type object 'UserResponse' has no attribute 'model_rebuild'
```

It is exactly one call — the only v2-only API anywhere in the backend — but one is enough.
**So the major version was never actually a choice**, and the deployed revision must have been
on 2.x because nothing else starts. That reasoning is now a comment in the manifest, where
someone contemplating a downgrade will meet it before spending an afternoon on it.

A corroborating detail: `main.py:267` declares `term_ids: List[str] = Field(min_length=1)`.
Under v2 that enforces a non-empty list; under v1, collection length is `min_items` and
`min_length` on a list is **silently ignored**. Verified both ways. The author was writing
against v2 whether or not they knew the manifest permitted v1.

## Findings — flagged, not fixed

- **`email-validator==2.1.0` is yanked on PyPI** — withdrawn because its `python_requires`
  wrongly still allowed Python 3.7. pip installs it because the pin is exact, so nothing is
  broken, but every build prints a warning and the pin names a release the maintainer has
  retracted. Moving to 2.1.1+ is the obvious remedy and needs its own testing.
- **Three `@validator` decorators emit `PydanticDeprecatedSince20`** (`main.py:405`, `:412`,
  `:423`) and are removed in pydantic v3. Pinning converts this from an ambient risk into a
  scheduled one, but it does not remove it: any future v3 upgrade must migrate them to
  `@field_validator` first.
- **`.dict()` at `email_service.py:256`** is the v1 spelling. It still works under v2 with a
  deprecation warning, and is removed in v3. Same upgrade batch as the validators.
- **The API docs are not at the FastAPI defaults.** `main.py:141-143` sets
  `docs_url="/api/docs"`, `redoc_url="/api/redoc"`, `openapi_url="/api/openapi.json"`. Worth
  knowing for anyone checking "the live OpenAPI spec" — the default paths return 404.

## What the next session needs to know

- The manifest is now fully pinned. **Any dependency added from here should be pinned in the
  same commit**, or this recurs.
- A pydantic v3 upgrade is blocked behind three `@validator` decorators and one `.dict()`
  call. Small, but not zero, and best done deliberately rather than discovered during an
  unrelated deploy.

## Verification

**Ran, and passed** — from a clean venv installed off the pinned manifest, not the working
environment:

- Resolution confirmed: `pydantic==2.13.4`, `pydantic_core==2.46.4`, `python-dotenv==1.2.3`,
  `python-decouple==3.8`, `fastapi==0.110.1`.
- **`uvicorn main:app` boots**: `Application startup complete`, no errors.
- **45 routes registered; 41 operations across 29 documented paths.**
- `GET /api/openapi.json` → **200**, OpenAPI **3.1.0**. `GET /api/docs` → **200**.
- `MatStandardResponse.updated_at` present in the generated schema, so the REQ-011 work
  surfaces in the spec.
- `GET /api/standards` without a token → **401** — auth wiring intact.
- `GET /api/terms` (the one unauthenticated data endpoint) → **500** against no database,
  which is the expected failure and confirms routing reaches the handler rather than dying
  earlier.
- The v1 incompatibility was **demonstrated**, not asserted, by building the environment and
  running the import.

**Not run:** nothing against a real database; no production call.

---

## Notes for the release summary

*No user-facing change. Build reproducibility only.*
