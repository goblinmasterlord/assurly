# Vercel NOT_FOUND Error - Complete Analysis & Fix

## 1. Suggested Fix

### The Problem
Your `vercel.json` has a catch-all rewrite rule `"source": "/(.*)"` that matches **every request**, including static assets. While Vercel's routing system should serve files before applying rewrites, there can be edge cases where this fails, especially with:
- Monorepo setups
- Complex routing patterns
- Build output location mismatches

### The Solution

**Option A: Explicit File Exclusion (Recommended)**

Update your `vercel.json` to explicitly exclude static assets from the rewrite:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=(), interest-cohort=()"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains; preload"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://assurly-frontend-400616570417.europe-west2.run.app https://*.vercel.app; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/assets/:path*",
      "destination": "/assets/:path*"
    },
    {
      "source": "/(.*\\.(js|css|svg|png|jpg|jpeg|gif|ico|pdf|woff|woff2|ttf|eot))",
      "destination": "/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**Option B: Verify Root Directory Configuration**

If Root Directory is set in Vercel Dashboard to `assurly-frontend`, ensure:
1. Build outputs to `dist/` (relative to root directory)
2. No conflicting `vercel.json` in subdirectories
3. Environment variables are set correctly

**Option C: Add Explicit Output Directory**

If auto-detection fails, explicitly set in `vercel.json`:

```json
{
  "buildCommand": "npm install && npm run build",
  "outputDirectory": "dist",
  // ... rest of config
}
```

**Note:** Only add `buildCommand` and `outputDirectory` if Root Directory is NOT set in dashboard, or if you need to override auto-detection.

---

## 2. Root Cause Analysis

### What Was the Code Actually Doing?

Your current `vercel.json` configuration:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",  // Matches EVERYTHING
      "destination": "/index.html"
    }
  ]
}
```

**What it does:**
- Matches all incoming requests (routes, static files, everything)
- Rewrites them to `/index.html`
- Relies on Vercel's routing system to serve static files first

**What it should do:**
- Serve static files (JS, CSS, images, fonts) directly
- Only rewrite application routes (like `/app/assessments`, `/auth/login`) to `/index.html`
- Let the React Router handle client-side routing

### What Conditions Triggered This Error?

1. **Monorepo Structure**: Your project has `assurly-frontend/` as a subdirectory
   - Vercel needs to know where to build from
   - Build output location might be ambiguous

2. **Static Asset Requests**: When browser requests:
   - `/assets/index-IU9eq6On.js` → Should serve the file
   - `/favicon.svg` → Should serve the file
   - `/app/assessments` → Should rewrite to `/index.html`

3. **Build Output Mismatch**: If Vercel looks for files in the wrong location:
   - Files exist in `assurly-frontend/dist/assets/`
   - Vercel looks in `dist/assets/` (wrong relative path)
   - Result: NOT_FOUND

4. **Rewrite Priority Issues**: In some edge cases:
   - Rewrite rule applies before file existence check
   - Static asset request gets rewritten to `/index.html`
   - Browser receives HTML instead of JS/CSS
   - Application fails to load → NOT_FOUND

### What Misconception or Oversight Led to This?

**Misconception**: "Catch-all rewrites work perfectly for all SPAs"

**Reality**: 
- Catch-all rewrites work **most of the time** because Vercel serves files first
- In monorepos or complex setups, explicit patterns are safer
- Static assets need explicit handling to avoid edge cases

**Oversight**: 
- Assuming Vercel's auto-detection always works correctly
- Not considering monorepo-specific routing challenges
- Not testing static asset serving after deployment

---

## 3. Teaching the Concept

### Why Does This Error Exist?

The `NOT_FOUND` error (HTTP 404) is a **standard HTTP response** indicating:
- The server cannot find the requested resource
- The URL doesn't correspond to any file or route
- This is a **protective mechanism** that prevents:
  - Exposing internal server structure
  - Serving incorrect content
  - Breaking application functionality silently

### What Is It Protecting You From?

1. **Security**:** Prevents information leakage about server structure
2. **Data Integrity**: Ensures only valid resources are served
3. **User Experience**: Clear error messages instead of broken pages
4. **Debugging**: Signals configuration or routing issues

### Correct Mental Model

**Vercel's Request Handling Flow:**

```
1. Incoming Request: /assets/index.js
   ↓
2. Check: Does file exist in build output?
   ├─ YES → Serve file directly (200 OK)
   └─ NO → Continue to step 3
   ↓
3. Check: Does rewrite rule match?
   ├─ YES → Apply rewrite (e.g., to /index.html)
   └─ NO → Return 404 NOT_FOUND
   ↓
4. Serve rewritten content
```

**The Problem:**
- Step 2 might fail if file location is ambiguous (monorepo)
- Step 3 might apply too broadly (catch-all pattern)
- Result: Static assets get rewritten instead of served

**The Solution:**
- Make rewrite rules **explicit** and **specific**
- Ensure build output location is **unambiguous**
- Test static asset serving after deployment

### How This Fits Into Framework/Language Design

**React Router (Client-Side Routing):**
- Handles routes **after** page loads
- Requires `index.html` to bootstrap the app
- All routes must serve `index.html` so React Router can take over

**Vercel (Server-Side Routing):**
- Handles routes **before** page loads
- Must serve static assets directly (JS, CSS, images)
- Must serve `index.html` for application routes
- Acts as a **reverse proxy** with routing rules

**The Tension:**
- React Router needs: All routes → `index.html`
- Vercel needs: Static files → Direct serving
- Solution: Explicit routing rules that distinguish between the two

---

## 4. Warning Signs

### What to Look Out For

1. **Monorepo Structure**
   - ⚠️ Multiple `package.json` files
   - ⚠️ Subdirectories with build outputs
   - ✅ Set Root Directory in Vercel Dashboard
   - ✅ Use explicit `outputDirectory` if needed

2. **Catch-All Rewrites**
   - ⚠️ Pattern: `"source": "/(.*)"` without exclusions
   - ⚠️ No explicit static asset handling
   - ✅ Add explicit rules for static assets first
   - ✅ Use negative lookahead patterns if needed

3. **Build Output Issues**
   - ⚠️ Files in `dist/` but 404s on deployment
   - ⚠️ Different paths in dev vs production
   - ✅ Verify `outputDirectory` matches actual build output
   - ✅ Check Vercel build logs for file locations

4. **Static Asset 404s**
   - ⚠️ Console errors: "Failed to load resource"
   - ⚠️ Blank page after deployment
   - ⚠️ Network tab shows 404 for `.js` or `.css` files
   - ✅ Test static asset URLs directly
   - ✅ Check browser Network tab after deployment

### Code Smells

```json
// ❌ BAD: Too broad, no exclusions
{
  "rewrites": [{"source": "/(.*)", "destination": "/index.html"}]
}

// ⚠️ RISKY: Relies on Vercel's file-serving priority
{
  "rewrites": [{"source": "/(.*)", "destination": "/index.html"}]
}
// Works most of the time, but can fail in edge cases

// ✅ GOOD: Explicit static asset handling
{
  "rewrites": [
    {"source": "/assets/:path*", "destination": "/assets/:path*"},
    {"source": "/(.*\\.(js|css|svg))", "destination": "/$1"},
    {"source": "/(.*)", "destination": "/index.html"}
  ]
}
```

### Similar Mistakes in Related Scenarios

1. **Next.js Deployment**
   - Similar issue: Static files vs dynamic routes
   - Solution: Next.js handles this automatically, but custom rewrites need care

2. **Netlify Deployment**
   - Similar pattern: `_redirects` file with catch-all
   - Solution: Use `/* /index.html 200` but ensure static files are excluded

3. **Apache/Nginx Configuration**
   - Similar concept: URL rewriting for SPAs
   - Solution: Use `try_files` directive to check files first

4. **Cloudflare Pages**
   - Similar routing: Single-page app routing
   - Solution: Use `_redirects` or `_routes.json` with explicit patterns

---

## 5. Alternatives and Trade-offs

### Alternative 1: Explicit Static Asset Rules (Recommended)

**Approach:**
```json
{
  "rewrites": [
    {"source": "/assets/:path*", "destination": "/assets/:path*"},
    {"source": "/(.*\\.(js|css|svg|png|jpg))", "destination": "/$1"},
    {"source": "/(.*)", "destination": "/index.html"}
  ]
}
```

**Pros:**
- ✅ Explicit and clear
- ✅ No ambiguity about what gets rewritten
- ✅ Works reliably in all scenarios
- ✅ Easy to debug

**Cons:**
- ⚠️ More verbose
- ⚠️ Need to list file extensions
- ⚠️ Must update if adding new asset types

**Best for:** Production deployments, monorepos, complex setups

---

### Alternative 2: Catch-All with File Existence Check (Current)

**Approach:**
```json
{
  "rewrites": [
    {"source": "/(.*)", "destination": "/index.html"}
  ]
}
```

**Pros:**
- ✅ Simple and concise
- ✅ Works in most cases
- ✅ Vercel handles file serving automatically

**Cons:**
- ⚠️ Can fail in edge cases (monorepos, complex builds)
- ⚠️ Less explicit about intent
- ⚠️ Harder to debug when it fails

**Best for:** Simple projects, single-directory setups

---

### Alternative 3: Root Directory + Auto-Detection

**Approach:**
- Set Root Directory in Vercel Dashboard to `assurly-frontend`
- Let Vercel auto-detect build commands and output
- Use minimal `vercel.json` with just headers and rewrites

**Pros:**
- ✅ Clean configuration
- ✅ Leverages Vercel's built-in intelligence
- ✅ Less configuration to maintain

**Cons:**
- ⚠️ Requires dashboard configuration (not in code)
- ⚠️ Can be confusing if team members don't know about it
- ⚠️ Less portable (tied to Vercel platform)

**Best for:** Teams comfortable with Vercel dashboard, long-term projects

---

### Alternative 4: Build-Time Route Generation

**Approach:**
- Use a build tool to generate explicit routes
- Pre-render all possible routes at build time
- Serve as static files (no rewrites needed)

**Pros:**
- ✅ No routing complexity
- ✅ Better SEO (if needed)
- ✅ Faster initial page loads

**Cons:**
- ⚠️ Requires significant build setup changes
- ⚠️ Not suitable for dynamic routes
- ⚠️ More complex build process

**Best for:** Static sites, blogs, documentation sites

---

## Recommended Action Plan

1. **Immediate Fix:**
   - Update `vercel.json` with explicit static asset rules (Alternative 1)
   - Verify Root Directory is set in Vercel Dashboard
   - Deploy and test

2. **Verification:**
   - Check browser Network tab for 404s
   - Test direct access to static assets: `https://your-domain.com/assets/index-*.js`
   - Verify application routes work: `https://your-domain.com/app/assessments`

3. **Long-term:**
   - Document the routing strategy in your project
   - Add deployment checks to catch this early
   - Consider adding a test that verifies static assets are accessible

---

## Testing Checklist

After applying the fix:

- [ ] Build succeeds in Vercel
- [ ] No 404 errors in browser console
- [ ] Static assets load (check Network tab)
- [ ] Application routes work (`/app/assessments`, `/auth/login`, etc.)
- [ ] Direct asset URLs work (`/assets/index-*.js`)
- [ ] Root route loads (`/`)
- [ ] Hard refresh works (Cmd+Shift+R)

---

## Summary

**The Issue:** Catch-all rewrite rule can interfere with static asset serving in monorepo setups.

**The Fix:** Use explicit rewrite rules that serve static assets directly before applying the catch-all.

**The Lesson:** Explicit routing rules are safer than relying on implicit behavior, especially in complex deployment scenarios.

**The Prevention:** Test static asset serving after every deployment, especially when changing routing configuration.

