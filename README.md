# TeaPoint

Tea shop web app: React + TypeScript frontend (S3 + CloudFront) and Node.js + TypeScript + Express backend (EKS), PostgreSQL on RDS.

## Layout
- `apps/frontend` - Vite React SPA. `npm ci && npm run build` -> `dist/` (uploaded to S3).
- `apps/backend` - Express modular monolith. `Dockerfile` builds the image; `npm run migrate` applies `migrations/*.sql`.
- `infra/`, `deploy/`, `.github/workflows/` - added in later phases.

## Backend API
| Method | Path | Auth |
|---|---|---|
| GET | `/health`, `/ready`, `/metrics` | none |
| GET | `/api/categories`, `/api/products[?category=slug]`, `/api/products/:id` | none |
| POST | `/api/auth/register`, `/api/auth/login`; GET `/api/auth/me` | none / token |
| POST | `/api/orders` ; GET `/api/orders/mine` | optional / token |
| GET/PATCH | `/api/admin/orders`, `/api/admin/orders/:id/status` | admin |
| GET/POST/PUT/DELETE | `/api/admin/products[/:id]` | admin |

## Local checks
```
cd apps/backend  && npm ci && npx tsc --noEmit && npm test
cd apps/frontend && npm ci && npm run build && npm test
```
Config comes from environment variables (see `apps/backend/.env.example`). Never commit real secrets.
