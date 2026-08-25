# Session — [REQ-ID or AUD-ID] — [Backend | Frontend]

**Date:** YYYY-MM-DD
**Agent:** Claude Code | Cursor
**Milestone:** M[n]
**Version after this session:** e.g. 1.43.2 — or "no bump" for audit and discovery sessions
**Contract version worked against:** e.g. assurly-api-contract.md v2.5

---

## What this session was for

One or two sentences. The problem being solved, not the task title restated.

## What changed

Concrete and specific. Files, endpoints, tables, components. An engineer picking this up cold should be able to find everything touched without reading the diff.

- 
- 

**Schema changes:** migration file, and whether it has been applied. State "none" explicitly if there were none.

**Contract changes:** what changed in `assurly-api-contract.md`, and whether the frontend has been told. State "none" explicitly if there were none.

## What was deliberately not changed

The most valuable section in this template, and the one most often skipped. Things that looked wrong, were in scope to touch, and were left alone on purpose — with the reason.

- 

## Root cause

For defects. What the actual cause was, distinguished from what it looked like at the outset. If the first hypothesis was wrong, record that — the wrong turn is often more useful to the next person than the right one.

## Assumptions made

Anything inferred rather than confirmed. If this section is not empty, it needs the product owner's eyes.

- 

## Findings — flagged, not fixed

Adjacent issues found while working. Not acted on. Include enough detail that they can be triaged without rediscovery.

- 

## What the next session needs to know

Handover. State of play, anything half-finished, anything now blocked or unblocked by this work.

## Verification

How this was confirmed to work. Endpoints exercised, cases checked, what was tested in the browser. "It compiles" is not verification.

---

## Notes for the release summary

*Optional. One line, plain English, no jargon, written as a school or trust user would experience the change — "evidence files now attach to individual standards rather than to the whole area". Leave blank if the change is invisible to users. This is raw material only; the release notes themselves are written by the product owner, not compiled from these lines verbatim.*
