# Session — REQ-042 part 1, session expiry: report and stop — Backend

**Date:** 2026-08-30
**Agent:** Claude Code
**Milestone:** M1
**Version after this session:** no bump — diagnostic only, no code
**Deployed:** no — nothing to deploy
**Contract version worked against:** assurly-api-contract.md v2.9

---

## What this session was for

Establish how the session actually expires, whether any renewal machinery exists, what the
magic-link flow implies for re-authentication, and recommend an approach. **Report only.**

## Findings

### 1. Lifetime and where it is configured

| | |
|---|---|
| **Value** | **60 minutes** |
| **Configured** | `auth_config.py:14` — `JWT_ACCESS_TOKEN_EXPIRE_MINUTES`, env var with a `'60'` default |
| **Applied** | `auth_utils.py:87` — `exp = utcnow() + timedelta(minutes=…)`, set once at mint |
| **Kind** | **Fixed.** `exp` is stamped at mint and never rewritten. Nothing reads or extends it. |

**`verify_token` (`auth_utils.py:113`) leans on `jose` to enforce `exp`**, which raises
`ExpiredSignatureError` (a `JWTError`), so the function returns `None` and `get_current_user`
raises a clean `401`. **The backend's expiry behaviour is correct.** The defect is entirely on
the client side of that `401`.

### 2. Renewal machinery: anticipated, never built

- **`RefreshTokenRequest` (`auth_models.py:17`) is dead** — never imported, never referenced.
- **`TokenPayload.type` allows `"refresh"`** (`auth_models.py:67`) and nothing mints one.
- **No `/api/auth/refresh` route exists.** The auth surface is
  `request-magic-link`, `verify/{token}`, `me`, `logout`, `cleanup-expired-tokens`.
- **No session or refresh-token storage.** `users` carries only `magic_link_token` and
  `token_expires_at`, both transient to the login handshake (data model §6).
- **Logout is stateless** — the contract says so at line 263. **Nothing can revoke a JWT.**

**Frontend `refreshSession()` (`auth-service.ts:153`) is a stub that cannot succeed by
construction.** Its own comment says the backend has no refresh endpoint; it calls
`getCurrentSession()`, which re-presents **the same expired token** to `/api/auth/me`.

### 3. The spin, traced end to end

Mechanism, in `api-client.ts:108-143`:

1. Token expires; a request returns `401`.
2. `isRefreshing` is set **true**; `refreshSession()` is awaited.
3. `getCurrentSession()` gets its own `401`, **catches it, clears the token, and returns
   `null`** (`auth-service.ts:135-138`). So `refreshSession()` **returns `null` rather than
   throwing.**
4. `if (response)` is false → **no return, and no throw.** Execution leaves the `try` without
   entering the `catch`. **`isRefreshing` is never reset and `processQueue()` is never called.**
5. Every subsequent `401` takes the `if (isRefreshing)` branch and is pushed onto
   `failedQueue`, returning **a promise nobody will ever settle.**

**That unsettled promise is the spinner.** `use-assessments.ts:17-33` sets `isLoading(true)`,
awaits, and clears it in a `finally` — **a `finally` that never runs.** No error, no message,
no redirect.

**The redirect exists but is unreachable on this path.** It lives in the `catch` at
`api-client.ts:132-141`, and nothing throws. **A refresh that fails by returning `null` was
never handled.**

Two further faults on that same path:
- It clears `sessionStorage['assurly_secure']`; **the JWT lives in
  `localStorage['assurly_auth_token']`** (`secure-storage.ts:198`). Wrong store.
- **`get_current_user` (`main.py:536`) converts its own `401` into a `500`.** The bare
  `except Exception` wraps the `raise HTTPException(401, "User not found or inactive")` at
  `:529`. And the frontend **deliberately keeps the token on a `500`**
  (`auth-service.ts:141-149`). **A deactivated user therefore cannot be logged out** — they
  loop on 500s holding a valid token. This matters to REQ-013.

### 4. What magic-link implies

Re-authentication is **not** "click login". It is: leave the app → request a link → open a
mailbox, possibly on another device → click within **15 minutes**
(`MAGIC_LINK_EXPIRE_MINUTES`) → land back at the app, **not where the work was**. There is no
`redirect_url` plumbed through the frontend's request call (`auth-service.ts:27` sends `email`
only), so **return-to-task is lost even when the link works.**

**The design goal follows from that: an active user should never re-authenticate.** A
password-based product can afford a short token; this one cannot.

## Recommendation

**Sliding expiry with an absolute cap, via a `/api/auth/refresh` that requires a still-valid
token.** Plus the frontend fix, which is unconditional and comes first.

Full reasoning, the two rejected options and the security costs are in the session report to
the product owner; the short form:

- **Frontend first, whatever the backend decision.** Settle the queue, reset the latch, redirect
  with a message. This converts the defect from "hangs, unexplained" to an ordinary expiry, and
  it is the whole of what an occasional user (REQ-013's external tier) ever meets.
- **Sliding** keeps active users alive with **no schema change and one endpoint**, which fits
  §2.7's auth-alone gate without also being a migration gate.
- **The cap is the price of sliding.** With no revocation anywhere, unbounded renewal turns a
  60-minute stolen-token window into a permanent one.
- **A refresh token is the better long-term answer and belongs with REQ-013**, where revocation
  becomes genuinely necessary. Additive, not blocked by this choice.

## Findings — flagged, not fixed

- **`expires_in=60 * 60` is hardcoded** at `main.py:780` and does not read the config. Raising
  `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` today makes the API **state a lifetime it no longer has**,
  and contract line 187 documents that figure. Any change to the lifetime must move both.
- **Magic-link tokens are stored in plaintext** in `users.magic_link_token`.
  `generate_token_hash()` (`auth_utils.py:164`) exists for exactly this and **is never called.**
  Anyone with a read of the `users` table can log in as anyone within the 15-minute window.
- **No rate limiting on `/api/auth/request-magic-link`.** The constants exist
  (`auth_config.py:45-46`, commented "for future implementation"); nothing reads them. This
  gets worse if re-authentication becomes routine, since the endpoint sends email.
- **`get_current_user` runs a database query on every authenticated request** and closes the
  connection each time. Not a defect; relevant because a sliding-expiry design should not add a
  second round trip per request.

## What the next session needs to know

- **The backend is not where the spin is.** It returns a correct `401`. Do not go looking for
  it in `verify_token`.
- **The frontend half is independently shippable and should not wait** for the auth decision.
- **REQ-013 inherits whatever is chosen**, and separately needs revocation — see the
  deactivated-user 500 loop above, which is a REQ-013 defect found here.

## Verification

- Every claim above read from the code named beside it. No production access (§2.4).
- **The spin was traced through all four files rather than inferred from the symptom** —
  interceptor, auth service, storage and one consuming hook — because §2.2's preamble applies:
  the premise "the token refresh fails" is not the same as "the failure path was never
  written", and only the second explains an indefinite hang.
- **Not verified:** the live token lifetime in Cloud Run. `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` is
  an env var and **could be overridden in the deployed service**; 60 minutes is the default and
  matches the reported symptom, but the deployed value should be confirmed before anything is
  built on it.
- **No code changed.**

---

## Notes for the release summary

*No user-facing change. Diagnostic session.*
