# Vercel Monorepo Configuration Fix

## The Problem

You have a monorepo with:
```
/
├── assurly-backend/     # Backend code
├── assurly-frontend/    # Frontend code
│   ├── package.json
│   ├── vite.config.ts
│   └── vercel.json      # ❌ Conflicts with root config
└── vercel.json          # ✅ Root config for monorepo
```

**Issue:** Two `vercel.json` files are confusing Vercel's deployment.

## Solution: Configure Vercel for Monorepo Deployment

### Option 1: Use Root Directory Setting in Vercel (Recommended)

This keeps your monorepo structure intact.

#### Step 1: Remove Subdirectory vercel.json
The `assurly-frontend/vercel.json` should be deleted - the root one handles everything.

```bash
cd /Users/pwned/Documents/Cursor/Assurly
rm assurly-frontend/vercel.json
git add assurly-frontend/vercel.json
git commit -m "Remove duplicate vercel.json from frontend subdirectory"
```

#### Step 2: Update Root vercel.json

The root `vercel.json` needs the `rootDirectory` setting:

```json
{
  "buildCommand": "npm install && npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": null,
  "rootDirectory": "assurly-frontend",
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
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**Key changes:**
- Added `"rootDirectory": "assurly-frontend"` - tells Vercel to run build in this directory
- Changed `buildCommand` from `cd assurly-frontend && npm install && npm run build` to just `npm install && npm run build` (since we're already in that directory)
- Changed `outputDirectory` from `assurly-frontend/dist` to just `dist` (relative to rootDirectory)
- Changed `installCommand` similarly

#### Step 3: Configure Environment Variables in Vercel Dashboard

1. Go to your Vercel project settings
2. Navigate to **Environment Variables**
3. Add:
   ```
   VITE_API_BASE_URL = https://assurly-frontend-400616570417.europe-west2.run.app
   ```
4. Select **Production** (and Preview if needed)
5. Click **Save**

#### Step 4: Redeploy

```bash
git push origin main
```

Or trigger manual redeploy from Vercel dashboard.

---

### Option 2: Create .env.production File (Simpler but Less Secure)

Instead of using Vercel environment variables, bake the URL into the build:

```bash
cd assurly-frontend

# Create .env.production file
cat > .env.production << 'EOF'
VITE_API_BASE_URL=https://assurly-frontend-400616570417.europe-west2.run.app
EOF

# Add to git
git add .env.production
git commit -m "Add production environment configuration"
git push origin main
```

**Note:** This is simpler but exposes the API URL in git. For a private repo, this is fine.

---

### Option 3: Move Everything to Root (Not Recommended)

You suggested moving files to root. This would work but breaks the monorepo structure:

```bash
# DON'T DO THIS unless you want to break the monorepo
cd /Users/pwned/Documents/Cursor/Assurly

# Move frontend files to root
mv assurly-frontend/* .
mv assurly-frontend/.* . 2>/dev/null
rmdir assurly-frontend

# Update vercel.json
cat > vercel.json << 'EOF'
{
  "buildCommand": "npm install && npm run build",
  "outputDirectory": "dist",
  "headers": [...],
  "rewrites": [...]
}
EOF
```

**Why not recommended:**
- Breaks clean separation of frontend/backend
- Makes future maintenance harder
- Mixing dependencies in root package.json
- Backend needs to stay separate anyway

---

## Recommended Steps (Do This)

1. ✅ **Remove duplicate vercel.json** from `assurly-frontend/`
2. ✅ **Update root vercel.json** with `rootDirectory` setting
3. ✅ **Add environment variable** in Vercel dashboard
4. ✅ **Redeploy** from Vercel or push to trigger deployment
5. ✅ **Hard refresh browser** after deployment

---

## Verification

After deploying, verify:

### Check Environment Variable is Available
Open browser console at www.assurly.co.uk:
```javascript
console.log('API URL:', import.meta.env.VITE_API_BASE_URL);
// Should show: https://assurly-frontend-400616570417.europe-west2.run.app
```

### Check CORS Headers
```bash
curl -H "Origin: https://www.assurly.co.uk" \
     -v \
     https://www.assurly.co.uk 2>&1 | grep -i "content-security-policy"
```

### Test API Call
In browser console:
```javascript
fetch('https://assurly-frontend-400616570417.europe-west2.run.app/api/aspects', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('assurly_auth_token')}`
  }
})
.then(r => r.json())
.then(data => console.log('Success!', data))
.catch(err => console.error('Failed:', err));
```

---

## Why This Fixes CORS

The CORS issue isn't actually about CORS headers (those are correct on backend). It's about:

1. **Environment Variables:** Frontend needs to know the API URL
2. **Build Context:** Vercel needs to build from the right directory
3. **CSP Headers:** Content Security Policy needs to allow the API domain

With `rootDirectory` set correctly and environment variables configured, Vercel will:
- ✅ Build in the correct directory
- ✅ Load `vite.config.ts` with proxy settings
- ✅ Inject `VITE_API_BASE_URL` during build
- ✅ Apply headers from root `vercel.json`
- ✅ Deploy to www.assurly.co.uk correctly

---

## Troubleshooting

### If CORS persists after fix:

1. **Clear Vercel build cache:**
   - Vercel Dashboard → Deployments
   - Redeploy → Check "Clear cache"

2. **Verify rootDirectory:**
   ```bash
   cat vercel.json | grep rootDirectory
   ```

3. **Check Vercel deployment logs:**
   - Look for "Building in directory: assurly-frontend"
   - Verify npm install runs in correct location

4. **Verify environment variable:**
   - Vercel Dashboard → Environment Variables
   - Check `VITE_API_BASE_URL` is set for Production

---

## Need Help?

If it still doesn't work, provide:
1. Screenshot of Vercel deployment logs (showing build directory)
2. Screenshot of Environment Variables page in Vercel
3. Output of browser console: `console.log(import.meta.env.VITE_API_BASE_URL)`

