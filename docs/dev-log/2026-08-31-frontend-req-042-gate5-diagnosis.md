# Session — REQ-042 — Gate 5 diagnosis (frontend)

**Date:** 2026-08-31
**Agent:** Cursor
**Milestone:** M1
**Version after this session:** no bump
**Deployed:** production tested at `https://www.assurly.co.uk` (bundle `index-DykPLDwk.js`)
**Contract version worked against:** assurly-api-contract.md v2.10
**Code changes:** none — diagnosis only

---

## What this session was for

REQ-042 fails gate 5 on both reported paths:

1. **Symptom 1:** Working normally for over an hour does not keep the session alive.
2. **Symptom 2 (priority):** An idle tab past 60 minutes produces an indefinite spinner,
   not a redirect to login.

The 401 failure path from commit `3935287` was verified working before the proactive-refresh
work in `155be14`. This session reproduced gate 5 on production with DevTools open (not
local — JWT unavailable locally) and reported findings before any code change.

---

## Reported symptoms

| # | Symptom | User expectation |
|---|---------|------------------|
| 1 | Active use >1 hour | Session should slide via `POST /api/auth/refresh` |
| 2 | Idle tab >60 min, then interaction | Redirect to login with expiry message, not spinner |

Both failing together suggested a single root cause rather than two independent bugs. Primary
suspect: refresh `POST` being queued by the 401 interceptor (`isRefreshing` stuck,
`failedQueue` unsettled), preventing both renewal and the `3935287` safety net.

---

## Environment

- **Frontend:** `https://www.assurly.co.uk`
- **API base:** `https://assurly-frontend-400616570417.europe-west2.run.app`
- **Test account:** MAT admin (School Performance Dashboard on `/app/assessments`)
- **Deployed bundle verified:** proactive refresh (`Ste`/`F5`/`NC`), `/auth/` exclusion,
  `handleSessionExpired` on null refresh return — all present in production JS

---

## Checklist answers (what DevTools showed)

### 1. Is `POST /api/auth/refresh` called before expiry during active use?

**No — on a fresh login session.**

After magic-link verify and landing on `/app/assessments`, network showed:

| Request | Status |
|---------|--------|
| `GET /api/auth/verify/{token}` | 200 |
| `GET /api/assessments` | 200 |
| `GET /api/schools` (×2) | 200 |
| `GET /api/aspects` (×2) | 200 |
| `GET /api/dashboard/schools` (×2) | 200 |

**Zero** `POST /api/auth/refresh` calls.

JWT decode on the live token immediately after login:

- `exp` claim present and readable client-side
- ~59 minutes remaining at capture
- `shouldProactivelyRefreshToken()` = **false** (threshold is ≤15 minutes)

**Conclusion:** The 15-minute threshold check is not firing yet on a fresh token — expected.
`jwt-utils.ts` is reading `exp` correctly. Absence of refresh calls during initial load is not
evidence of a decode bug.

**Why Symptom 1 may still occur:** Proactive refresh runs only inside the axios **request
interceptor** (`api-client.ts`). It does not run on timers or raw UI activity. On
`/app/assessments`:

- `useAssessments` loads once into React state; filtering/sorting is client-side
- `requestCache` only hits the network on remount, manual refresh, or stale `get()` — background
  refresh fires only when `requestCache.get()` is called, not passively while viewing cached data
- Schools/aspects fetches run once on mount (`Assessments.tsx`, `SchoolPerformanceView.tsx`)

A user can work on one page for >1 hour without generating axios traffic in the final 15-minute
renewal window, even while the UI feels active.

---

### 2. If refresh is called, what does it return? Does refresh 401 fall through to `handleSessionExpired`?

**Yes — on the paths tested.**

**Node reproduction** mirroring production interceptor logic against the live API:

```
assessments 401 → isRefreshing=true → POST /api/auth/refresh
refresh 401     → url="/api/auth/refresh", excluded=true, handler SKIPPED
refresh-error   → isRefreshing reset, failedQueue length 0
```

**In-app test (expired token, no reload):** Term combobox changed on School Performance
Dashboard. Persisted capture via `sessionStorage` at xhr `loadend`:

```json
{
  "path": "/app/assessments",
  "hasToken": false,
  "spinnerCount": 1,
  "refreshCalls": [
    { "url": "/api/auth/refresh", "phase": "start" },
    { "url": "/api/auth/refresh", "status": 401, "phase": "end", "method": "POST" }
  ],
  "api401s": [
    { "url": "/api/auth/refresh", "status": 401 }
  ]
}
```

Sequence observed:

1. JWT expired in `localStorage` without page reload
2. Dashboard term change triggered axios traffic
3. Request interceptor proactive path called `POST /api/auth/refresh`
4. Refresh returned **401** (~158 ms)
5. Token cleared (`hasToken: false`)
6. Brief spinner (`spinnerCount: 1` — likely "Updating dashboard..." overlay)
7. Redirect to `/auth/login` followed within ~1–2 s

Only `/api/auth/refresh` appeared in the capture — the dashboard GET was likely aborted when
`handleSessionExpired()` redirected. That matches proactive refresh running **before** the main
request is sent.

`refreshSession()` catches 401 and returns `null`; both proactive and 401-handler paths call
`handleSessionExpired()` on null. The `3935287` regression (`isRefreshing` stuck on null) is
**not** present in the deployed bundle.

---

### 3. On the idle path — does the request reach the 401 handler? Is `isRefreshing` stuck? `failedQueue` unsettled?

**Idle-tab in-app path (simulated): redirect observed; hang not reproduced.**

| Observation | Result |
|-------------|--------|
| Request reaches 401 handler | Not required on tested path — proactive refresh fired first |
| `isRefreshing` stuck `true` | **Not observed** |
| `failedQueue` unsettled | **Not observed** |
| Indefinite spinner | **Not observed** — brief spinner then redirect |

**Cold-load path (expired token in `localStorage`, navigate to `/app/assessments`):** Redirect
to `/auth/login?reason=session_expired`, token cleared. `handleSessionExpired()` confirmed.

**Tampered-token page reload** (valid structure, `exp` set to past): Redirect to `/auth/login`
without `reason` query param — consistent with `getCurrentSession()` `/api/auth/me` 401 path
(token cleared, `ProtectedRoute` navigates) rather than `handleSessionExpired` redirect. Login
page strips `reason` after showing toast, so final URL may appear clean.

---

### 4. Does `/auth/` path exclusion match the refresh URL?

**Yes.**

| URL | `includes('/auth/')` | 401 refresh handler runs? |
|-----|----------------------|---------------------------|
| `/api/auth/refresh` | yes | **No** (excluded) |
| `/api/auth/me` | yes | **No** (excluded) |
| `/api/assessments` | no | **Yes** |

Axios `error.config.url` on cross-origin production calls is the relative path
(`/api/auth/refresh`), not the full Cloud Run hostname. Production bundle guard:

```js
!error.config.url?.includes('/auth/')
```

**Refresh-queue deadlock (refresh 401 re-entering handler while `isRefreshing=true`): ruled out**
on both Node reproduction and live in-app capture.

---

## Unified diagnosis

### Symptom 1 — session not kept alive during long active use

**Most likely cause:** Proactive refresh is **request-gated** (≤15 min threshold on each axios
call). Typical Assessments/MAT-dashboard usage can produce **insufficient axios traffic** in
the renewal window because:

- Data lives in React state after initial mount
- `requestCache` serves stale data without network for 5–30 minutes (assessments) or up to 1 hour
  (schools TTL)
- Background refresh only runs when `requestCache.get()` is invoked, not on idle viewing

When the token eventually expires, the first axios call triggers proactive refresh on an
**already-expired** token, which the backend correctly refuses (401). Renewal only works while
the token is still valid — by design per contract §3a.

### Symptom 2 — idle tab → indefinite spinner

**Not reproduced** on production during this session for:

- Cold load with expired token → redirect ✓
- In-app expired token + dashboard term change (mounted tab, no reload) → proactive refresh →
  401 → token cleared → redirect ✓ (brief spinner only)

The `3935287` safety net appears operational on the deployed bundle for these paths. If gate 5
still fails in manual UAT, the hang may be on a **different code path** not exercised here:

- Department-head Ratings view (`useAssessments` initial `isLoading`)
- Client-side navigation remount (e.g. Ratings ↔ Assessments) vs dashboard term change
- Parallel 401 race with `maybeProactivelyRefreshToken` skipping when `isRefreshing` is true
- Naturally server-expired token vs client-tampered `exp` (signature mismatch)

---

## Ruled out

1. **Refresh 401 queued by its own interceptor** — exclusion matches; Node + live capture confirm
2. **`jwt-utils` cannot read `exp`** — live JWT decoded correctly; threshold logic behaves as coded
3. **`3935287` null-return regression in production** — bundle has `return handleSessionExpired()`
   on null; `isRefreshing` reset observed
4. **Proactive refresh never wired** — `POST /api/auth/refresh` observed on expired-token in-app test

---

## Not verified (parked)

1. In-app idle on **department-head Ratings** path (`useAssessments` `isLoading` spinner)
2. Proactive refresh firing **while token is still valid** (needs session within 15 min of `exp`
   or clock manipulation)
3. `isRefreshing` / `failedQueue` state at hang time during a user-reported failure
4. Multi-tab or parallel-request race conditions
5. Whether Symptom 2 was observed on a build **before** current production deploy

---

## Recommended fix direction (not implemented)

Two separate concerns; a single fix may not address both:

| Concern | Direction |
|---------|-----------|
| Session not sliding during long use | Add renewal trigger independent of cache hits — e.g. `visibilitychange` / focus handler with JWT threshold check, or periodic timer while tab is visible — in addition to request interceptor |
| Spinner on expiry (if still reproducible) | Identify the specific page/hook whose `await` never settles; confirm whether `requestCache.pendingRequests` deduplicates a hung axios promise; add logging or timeout guard |

Any fix should preserve:

- `3935287` `handleSessionExpired()` as terminal path for refresh 401 and 12-hour cap
- `/auth/` exclusion on refresh 401 (no retry loop)
- Contract rule: refresh only while token is still valid

---

## What changed

**None.** Diagnosis only.

---

## Verification

- Production login + network trace (fresh token, no refresh — expected)
- Production JWT decode (`exp`, 15-min threshold)
- Node axios interceptor reproduction against live API
- Production cold-load expired-token redirect
- Production in-app expired-token test (dashboard term change, `sessionStorage` capture)
- Production bundle inspection (`index-DykPLDwk.js`)

---

## What the next session needs to know

- Gate 5 **Symptom 2 was not reproduced** on MAT admin dashboard in-app path; do not assume the
  `3935287` safety net is broken without retesting the user's exact reproduction steps.
- Gate 5 **Symptom 1 is plausibly explained** by request-gated proactive refresh + cache-heavy
  page architecture, not by a broken refresh endpoint or interceptor deadlock.
- If fixing Symptom 1, the request-threshold approach from `155be14` is necessary but may be
  **insufficient alone** — consider visibility/timer supplement.
- Parked testing: department-head path, valid-token proactive refresh confirmation, parallel 401
  race.

---

## Notes for the release summary

Gate 5 investigation on production found proactive refresh and session-expiry redirect working
on the tested MAT dashboard path; long sessions may still expire because renewal only runs when
axios traffic occurs in the final 15 minutes before token expiry.
