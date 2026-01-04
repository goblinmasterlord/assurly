# Fix Magic Link 404 Error

## The Problem

The magic link email sends users to: `https://assurly.co.uk/auth/verify?token=...`

But you're getting a **404 Not Found** error.

## Root Cause

There's a **domain mismatch** issue:

1. The backend generates magic links using the `FRONTEND_URL` environment variable
2. Your magic link points to `https://assurly.co.uk` (without `www`)
3. But your Vercel deployment might only be configured for `https://www.assurly.co.uk` (with `www`)
4. Or the reverse - the non-www domain isn't properly set up

## Diagnosis

### Check which domain works:

1. **Test WITH www:**
   - Visit: `https://www.assurly.co.uk`
   - Does it load? ✅

2. **Test WITHOUT www:**
   - Visit: `https://assurly.co.uk`
   - Does it load? ✅ or 404 ❌?

3. **Test the verify route on BOTH:**
   - `https://www.assurly.co.uk/auth/login` - Works?
   - `https://assurly.co.uk/auth/login` - Works?

## Solution Options

### Option 1: Configure BOTH domains in Vercel (Recommended)

This ensures both `www` and non-`www` work.

**Steps:**

1. **Go to Vercel Dashboard:**
   - https://vercel.com/dashboard
   - Select your `assurly` project

2. **Go to Settings → Domains:**
   - You should see your domains listed

3. **Add both domains if missing:**
   - Add: `www.assurly.co.uk`
   - Add: `assurly.co.uk`

4. **Configure redirect (optional):**
   - Set one as primary
   - Configure the other to redirect

   **Example:**
   - Primary: `www.assurly.co.uk`
   - Redirect: `assurly.co.uk` → `www.assurly.co.uk`

5. **Deploy and test:**
   - Both domains should work now
   - Magic links will work regardless of which domain is in `FRONTEND_URL`

### Option 2: Update Backend FRONTEND_URL

If you only want to use ONE domain, update the backend environment variable to match.

**Check which domain works in Vercel:**
```bash
# Test both
curl -I https://www.assurly.co.uk
curl -I https://assurly.co.uk
```

**Update backend environment variable:**

If `www` works but non-`www` doesn't:
```bash
# Update Cloud Run environment variable
gcloud run services update assurly-frontend \
  --region europe-west2 \
  --set-env-vars="FRONTEND_URL=https://www.assurly.co.uk"
```

If non-`www` works but `www` doesn't:
```bash
gcloud run services update assurly-frontend \
  --region europe-west2 \
  --set-env-vars="FRONTEND_URL=https://assurly.co.uk"
```

**Then restart the backend:**
```bash
gcloud run services update assurly-frontend \
  --region europe-west2 \
  --no-traffic-latest

# Wait a few seconds, then restore traffic
gcloud run services update-traffic assurly-frontend \
  --region europe-west2 \
  --to-latest
```

### Option 3: Add DNS Redirect

Configure DNS to redirect non-www to www (or vice versa).

**In your DNS provider (e.g., Cloudflare, GoDaddy):**

1. Add an A record for the root domain (`assurly.co.uk`)
2. Or use a CNAME for `www` subdomain
3. Configure redirect rules

## Verification

After fixing:

1. **Request a new magic link:**
   - Go to login page
   - Enter your email
   - Click "Send magic link"

2. **Check the email:**
   - Open the magic link email
   - Check the URL - should match your working domain

3. **Click the link:**
   - Should take you to `/auth/verify?token=...`
   - Should NOT show 404 ❌
   - Should show "Verifying..." then redirect to app ✅

## Technical Details

### Where the magic link is generated:

**Backend:** `assurly-backend/auth_utils.py` (line 66)
```python
base_url = FRONTEND_URL.rstrip('/')
magic_link = f"{base_url}/auth/verify?token={token}"
```

The `FRONTEND_URL` environment variable controls which domain is used.

### Frontend routes:

**Frontend:** `assurly-frontend/src/App.tsx` (line 41)
```tsx
<Route path="/auth/verify" element={<VerifyPage />} />
```

The route IS configured correctly - the issue is the domain.

### Vercel routing:

**Root:** `vercel.json` (lines 41-46)
```json
"rewrites": [
  {
    "source": "/(.*)",
    "destination": "/index.html"
  }
]
```

The SPA routing IS configured correctly - the issue is the domain.

## Debugging Steps

### 1. Check current FRONTEND_URL in backend:

```bash
gcloud run services describe assurly-frontend \
  --region europe-west2 \
  --format="value(spec.template.spec.containers[0].env)" \
  | grep FRONTEND_URL
```

### 2. Check Vercel domains:

Go to: https://vercel.com/dashboard → Your Project → Settings → Domains

You should see which domains are configured.

### 3. Test both domains manually:

```bash
# Test www
curl -I https://www.assurly.co.uk/auth/login

# Test non-www
curl -I https://assurly.co.uk/auth/login
```

Both should return `200 OK` (or redirect), not `404`.

### 4. Check DNS records:

```bash
# Check www domain
nslookup www.assurly.co.uk

# Check root domain
nslookup assurly.co.uk
```

Both should resolve to Vercel's servers.

## Common Issues

### Issue: Non-www returns 404

**Solution:** Add `assurly.co.uk` domain in Vercel → Settings → Domains

### Issue: www returns 404

**Solution:** Add `www.assurly.co.uk` domain in Vercel → Settings → Domains

### Issue: Both domains load homepage but /auth/verify gives 404

**Solution:** This is a SPA routing issue. Check:
1. `vercel.json` has the rewrites rule (it does ✅)
2. Redeploy frontend to Vercel
3. Hard refresh browser (Ctrl+Shift+R)

### Issue: "SSL Certificate Error"

**Solution:** Vercel needs to provision SSL for the domain. Wait a few minutes after adding domain.

## Recommended Setup

**Best practice:**

1. **Primary domain:** `www.assurly.co.uk`
2. **Redirect:** `assurly.co.uk` → `www.assurly.co.uk`
3. **Backend FRONTEND_URL:** `https://www.assurly.co.uk`

This ensures consistency and avoids issues with cookies, CORS, and SEO.

## Quick Fix Summary

**If www works:**
```bash
# Update backend to use www
gcloud run services update assurly-frontend \
  --region europe-west2 \
  --set-env-vars="FRONTEND_URL=https://www.assurly.co.uk"
```

**If non-www works:**
```bash
# Update backend to use non-www
gcloud run services update assurly-frontend \
  --region europe-west2 \
  --set-env-vars="FRONTEND_URL=https://assurly.co.uk"
```

**If neither works:**
1. Check Vercel domain configuration
2. Add missing domain in Vercel → Settings → Domains
3. Wait for DNS propagation (can take up to 48 hours, usually minutes)
4. Test again

## After Fixing

1. Request a new magic link
2. Check email - link should use correct domain
3. Click link - should work without 404 ✅
4. You'll be logged in automatically 🎉
