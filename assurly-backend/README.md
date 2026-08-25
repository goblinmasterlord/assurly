# Assurly backend

FastAPI service for the Assurly school assurance and assessment-management platform.

## Local setup

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Fill in .env values
uvicorn main:app --reload
```

Once running: API at `http://localhost:8000`, Swagger UI at `/docs`, ReDoc at `/redoc`.

`JWT_SECRET_KEY` can be generated with `python jwt_keygenerator.py`.

## Deployment

Deployed to GCP Cloud Run from the `Dockerfile` in this directory. There is no `cloudbuild.yaml` — builds are kicked off ad-hoc with `gcloud builds submit` and `gcloud run deploy`.

## Canonical references

- **Schema:** [`docs/assurly-data-model.md`](../docs/assurly-data-model.md)
- **API contract:** [`docs/api/assurly-api-contract.md`](../docs/api/assurly-api-contract.md)
- **Env vars:** [`.env.example`](./.env.example) in this directory
