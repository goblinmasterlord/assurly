# Session — Milestone plan v2.23 (§2.6 versioning correction) — Backend

**Date:** 2026-08-30
**Agent:** Claude Code
**Milestone:** M1
**Version after this session:** no bump — documentation only. Fitting, given what the session is about.
**Deployed:** no — plan edits are not deployable
**Contract version worked against:** assurly-api-contract.md v2.11

---

## What this session was for

§2.6 described versioning in the register of a specification — a list of rules about when the
number changes. **Nothing enforces any of it**, and the section did not say so anywhere a reader
would meet it before acting on it.

## What changed

`docs/milestones/assurly-milestone-plan.md`, **v2.22 → v2.23.** §2.6 only.

- **The manual nature is now the first thing in the section**, in a callout, ahead of the
  conventions rather than as a footnote beneath them.
- **The target ladder is recorded as a table**, M1 → 1.44 through M8 → 2.0.
- Wording implying the numbers are derived or checked is gone.
- The "single source of truth" line is restated as a want, not a pending requirement.

**No code. No contract change. No requirement moved.**

## Why the footnote was in the wrong place

The fact that no artefact asserts a version **was already in §2.6** — as a ⚠️ callout at the
foot, after three bullets written as rules. **A reader following the section top to bottom
acts on the bullets and meets the caveat afterwards**, which is the same failure mode §2.2.7
was added for: a provisional claim flagged where the writer finished rather than where the
reader decides.

Moving it costs nothing and changes what the section says. **The bullets are unchanged in
substance** — patch on merge, minor at milestone close, 2.0 at sprint close — but they are now
plainly bookkeeping rather than mechanism.

## The one interpretation I made, flagged in the plan itself

**"One minor bump per milestone close, M1 through M8, reaching 2.0 at M8" does not close
arithmetically.** From 1.43, eight minor bumps land on 1.51, not 2.0.

**I read it as: seven minors (M1–M7, 1.44 → 1.50) and a major at M8**, because M8's close is
also the sprint close, and §2.6 already said the sprint close is 2.0 declared by the product
owner. That makes the last rung a major bump rather than a minor one, which is the only reading
where both halves of the instruction hold at once.

**This is stated in the plan as an interpretation, not as the rule** — with the alternative
named, so correcting it is a one-line edit rather than an archaeology exercise. It is exactly
the class of thing that would otherwise be discovered at M8, by which point seven versions have
been recorded on the assumption.

## What was deliberately not changed

- **The three conventions themselves.** Patch on merge, minor at milestone close, 2.0 at sprint
  close. The instruction was to correct how they are described, not what they are.
- **`_template.md`.** Its version field already says "Records a merge, not a deployment — see
  §2.6" and implies nothing about enforcement. Checked rather than assumed.
- **The 1.43.1 / 1.43.2 note and the merge-not-deployment rule.** Both still correct and both
  survive the rewrite intact.
- **Every version already recorded in a dev log.** 1.43.1 through 1.43.8 stand as written.
  Nothing was recomputed — and under the corrected section, there is nothing to recompute
  *against*.

## Findings — flagged, not fixed

- **The patch numbers are already slightly fictional, and the plan now admits it.** 1.43.6,
  1.43.7 and 1.43.8 were recorded for the dependency pins, REQ-042 and REQ-030 — but the
  dependency pins are not a requirement, and REQ-029 merged as **two** commits under one number.
  **The sequence is a monotonic counter of sessions that shipped something, not a count of
  requirements**, and reading it as the latter would mislead. Recorded in §2.6.
- **The in-app version history is the only consumer that needs this as data.** Every other use
  is prose read by a person, and prose is adequate for that. **So the "source of truth" problem
  is really a feature dependency**, and it belongs to whichever requirement builds that history —
  it is not general hygiene, and scoping it as hygiene is what has kept it flagged and unowned
  across four plan versions.
- **Nothing reconciles the plan's own version against the dev logs either.** This document says
  2.23 because I typed 2.23. The same correction applies one level up, and the changelog is the
  only thing that would catch a duplicate.

## What the next session needs to know

- **Do not treat a version in a dev log as a fact about a build.** It is a note.
- **M1's close is 1.44**, and it is declared by the product owner.
- The ladder's last rung (M8 → 2.0) is **an interpretation flagged in §2.6.** If it is wrong,
  the table is what changes.

## Verification

- §2.6 re-read end to end after the edit; the three conventions survive unchanged in substance.
- **Searched the whole plan and `_template.md` for other wording implying derivation or
  enforcement** — none found outside §2.6. The template's version line was checked specifically,
  since it is the one place an agent reads a version instruction while working.
- Ladder arithmetic checked against the milestone list in §4: **eight milestones, M1–M8, matching
  the eight rows.**
- §8 and §4 untouched; no requirement status moved this session.
- **Not verified:** anything in production. Nothing in this session is verifiable there, which
  is the point of it.

---

## Notes for the release summary

*No user-facing change. Documentation only.*
