# Backend Deployment Guide - Monorepo Structure

## Problem
After migrating to a monorepo structure, the backend needs to be deployed separately to Google Cloud Run. The frontend at `https://www.assurly.co.uk` is calling the backend API at `https://assurly-frontend-400616570417.europe-west2.run.app`, but you're getting **404 errors** because the backend isn't deployed or needs redeployment.

## Current Structure
```
assurly/ (monorepo root)
├── assurly-frontend/    # Frontend code (deployed to Vercel)
├── assurly-backend/     # Backend code (needs deployment to Cloud Run)
│   ├── main.py
│   ├── Dockerfile
│   ├── requirements.txt
│   └── ...
└── vercel.json          # Frontend deployment config
```

## Quick Fix - Deploy Backend to Cloud Run

### Option 1: Deploy via gcloud CLI (Recommended)

1. **Navigate to backend directory:**
   ```bash
   cd assurly-backend
   ```

2. **Authenticate with Google Cloud (if needed):**
   ```bash
   gcloud auth login
   ```

3. **Set your project:**
   ```bash
   gcloud config set project assurly-frontend
   ```

4. **Deploy to Cloud Run:**
   ```bash
   gcloud run deploy assurly-frontend \
     --source . \
     --region europe-west2 \
     --allow-unauthenticated \
     --platform managed \
     --max-instances=10 \
     --memory=512Mi \
     --timeout=300
   ```

5. **Set environment variables (CRITICAL!):**
   ```bash
   gcloud run services update assurly-frontend \
     --region europe-west2 \
     --set-env-vars="GOOGLE_CLOUD_PROJECT=assurly-frontend,\
   FRONTEND_URL=https://www.assurly.co.uk,\
   JWT_SECRET_KEY=your-secret-key-here,\
   DB_HOST=your-db-host,\
   DB_USER=your-db-user,\
   DB_PASSWORD=your-db-password,\
   DB_NAME=your-db-name,\
   GMAIL_APP_PASSWORD=your-gmail-app-password,\
   GMAIL_USER=your-gmail-user"
   ```

   **Important:** Replace the placeholder values with your actual credentials.

### Option 2: Deploy via Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **Cloud Run** → **Services**
3. Find your service: `assurly-frontend`
4. Click **EDIT & DEPLOY NEW REVISION**
5. Under **Source**, select:
   - **Source repository**: If using Cloud Build
   - **Upload zip**: Upload the `assurly-backend` folder as a zip
6. Ensure environment variables are set (see list below)
7. Click **DEPLOY**

### Option 3: Build and Deploy with Docker

1. **Build the Docker image:**
   ```bash
   cd assurly-backend
   docker build -t gcr.io/assurly-frontend/assurly-backend:latest .
   ```

2. **Push to Google Container Registry:**
   ```bash
   docker push gcr.io/assurly-frontend/assurly-backend:latest
   ```

3. **Deploy to Cloud Run:**
   ```bash
   gcloud run deploy assurly-frontend \
     --image gcr.io/assurly-frontend/assurly-backend:latest \
     --region europe-west2 \
     --allow-unauthenticated \
     --platform managed
   ```

## Required Environment Variables

The backend requires these environment variables to be set in Cloud Run:

### Database Configuration
- `DB_HOST` - Your MySQL database host
- `DB_USER` - Database username
- `DB_PASSWORD` - Database password
- `DB_NAME` - Database name (usually `assurly`)

### Authentication Configuration
- `JWT_SECRET_KEY` - Secret key for JWT tokens (generate with: `python jwt_keygenerator.py`)
- `FRONTEND_URL` - `https://www.assurly.co.uk`
- `MAGIC_LINK_EXPIRE_MINUTES` - `15` (optional, defaults to 15)

### Email Configuration (Gmail SMTP)
- `GMAIL_USER` - Your Gmail address
- `GMAIL_APP_PASSWORD` - Gmail app password (not regular password)
- `EMAIL_FROM_NAME` - `Assurly Platform` (optional)
- `GMAIL_SMTP_HOST` - `smtp.gmail.com` (optional)
- `GMAIL_SMTP_PORT` - `587` (optional)

### Google Cloud
- `GOOGLE_CLOUD_PROJECT` - `assurly-frontend`

## Verification Steps

### 1. Check Backend is Live
```bash
curl https://assurly-frontend-400616570417.europe-west2.run.app/docs
```
Should return the FastAPI Swagger docs page.

### 2. Test Magic Link Endpoint
```bash
curl -X POST https://assurly-frontend-400616570417.europe-west2.run.app/api/auth/request-magic-link \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

Expected response:
```json
{
  "message": "If this email is registered, you'll receive a login link shortly.",
  "email": "test@example.com",
  "expires_in_minutes": 15
}
```

If you get a 404 error, the backend isn't deployed correctly.

### 3. Check CORS Headers
```bash
curl -H "Origin: https://www.assurly.co.uk" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: authorization" \
     -X OPTIONS \
     -v \
     https://assurly-frontend-400616570417.europe-west2.run.app/api/aspects
```

Should include these headers:
```
Access-Control-Allow-Origin: https://www.assurly.co.uk
Access-Control-Allow-Credentials: true
```

### 4. Test from Frontend
1. Open https://www.assurly.co.uk in your browser
2. Try to log in with your email
3. Check browser console for errors
4. You should receive a magic link email

## Common Issues & Solutions

### Issue: 404 Not Found
**Cause:** Backend not deployed or wrong URL

**Solution:**
1. Verify Cloud Run service exists:
   ```bash
   gcloud run services list --region europe-west2
   ```
2. Check the service URL matches: `https://assurly-frontend-400616570417.europe-west2.run.app`
3. Redeploy the backend using steps above

### Issue: 500 Internal Server Error
**Cause:** Missing environment variables or database connection issues

**Solution:**
1. Check Cloud Run logs:
   ```bash
   gcloud run services logs read assurly-frontend --region europe-west2 --limit 50
   ```
2. Verify all environment variables are set:
   ```bash
   gcloud run services describe assurly-frontend --region europe-west2 --format="value(spec.template.spec.containers[0].env)"
   ```
3. Test database connection

### Issue: CORS Errors
**Cause:** CORS middleware not properly configured

**Solution:**
See `CORS_FIX_DEPLOYMENT.md` for detailed CORS troubleshooting.

### Issue: Email Not Sending
**Cause:** Gmail credentials not configured

**Solution:**
1. Verify Gmail app password is correct
2. Check Cloud Run environment variables
3. Enable "Less secure app access" or use App Passwords in Gmail
4. Check Cloud Run logs for email errors

## Deployment from Monorepo

Since you now have a monorepo, you need to deploy the backend separately:

1. **Frontend Deployment (Vercel):**
   - Automatically deployed when you push to GitHub
   - Configured via root `vercel.json`
   - Builds from `assurly-frontend/` folder

2. **Backend Deployment (Google Cloud Run):**
   - **Manual deployment required** using the steps above
   - Deploy from `assurly-backend/` folder
   - Set all environment variables in Cloud Run

## Automated Deployment (Optional)

To automate backend deployment, you can set up:

### GitHub Actions Workflow
Create `.github/workflows/deploy-backend.yml`:

```yaml
name: Deploy Backend to Cloud Run

on:
  push:
    branches:
      - main
    paths:
      - 'assurly-backend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Cloud SDK
        uses: google-github-actions/setup-gcloud@v1
        with:
          service_account_key: ${{ secrets.GCP_SA_KEY }}
          project_id: assurly-frontend

      - name: Deploy to Cloud Run
        run: |
          cd assurly-backend
          gcloud run deploy assurly-frontend \
            --source . \
            --region europe-west2 \
            --allow-unauthenticated
```

### Cloud Build Trigger
1. Go to Cloud Build → Triggers
2. Create new trigger
3. Source: GitHub repository
4. Build configuration: Cloud Build configuration file
5. Location: `assurly-backend/cloudbuild.yaml`

## Next Steps

1. **Deploy the backend** using Option 1 above
2. **Set all environment variables** in Cloud Run
3. **Test the magic link endpoint** to verify it's working
4. **Test frontend login** to ensure end-to-end flow works
5. **Monitor Cloud Run logs** for any errors

## Related Documentation
- `CORS_FIX_DEPLOYMENT.md` - CORS configuration and troubleshooting
- `DEBUGGING_500_ERRORS.md` - Backend error debugging
- `assurly-backend/README.md` - Backend API documentation
- `assurly-backend/API_DOCUMENTATION.md` - Complete API reference

## Need Help?

If you're still getting 404 errors after deployment:
1. Check Cloud Run logs: `gcloud run services logs read assurly-frontend --region europe-west2`
2. Verify the service URL matches what's in `VITE_API_BASE_URL`
3. Ensure the service is deployed to the correct region (`europe-west2`)
4. Check that the service allows unauthenticated requests
