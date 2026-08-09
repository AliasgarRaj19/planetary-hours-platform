# Planetary Hours Production Deployment

Production deployment uses Docker Compose from the repository root.

Services:

* `web`: public Vite website served by Nginx.
* `backend`: NestJS API at `/api/v1`.
* `admin`: Vite admin panel served by Nginx.

VPS project path:

```bash
/opt/projects/planetary-hours-platform
```

Default local health check URLs:

```bash
http://127.0.0.1:8080/health
http://127.0.0.1:8081/health
http://127.0.0.1:8082/api/v1/health
```

Required production environment variables are listed in `.env.production.example`.
Set real values in `.env.production`; do not commit secrets.

Public frontend build variables:

```bash
VITE_ANDROID_APK_URL=https://planetaryhours.in/downloads/planetary-hours-1.0.3-build6.apk
VITE_API_BASE_URL=https://planetaryhours.in
VITE_GA_MEASUREMENT_ID=G-5XQ5NGQ13N
```

The Vite website and admin panel read these public values at Docker build time.
The website also checks the runtime app-distribution endpoint so the active app
download destination can be changed from the admin panel without rebuilding the
website.

`VITE_GA_MEASUREMENT_ID` enables optional Google Analytics 4 tracking on the
public website after the visitor grants analytics consent. Rebuild the web image
after changing this value.

Backend Google Analytics reporting variables:

```bash
GA4_PROPERTY_ID=549075468
GOOGLE_APPLICATION_CREDENTIALS=/run/secrets/ga4-service-account.json
GA4_API_TIMEOUT_MS=8000
GA4_REALTIME_CACHE_SECONDS=30
GA4_HISTORICAL_CACHE_SECONDS=900
GA4_CREDENTIALS_HOST_PATH=/opt/projects/planetary-hours-platform/secrets/ga4-service-account.json
```

`GOOGLE_APPLICATION_CREDENTIALS` is the in-container path used by Google
Application Default Credentials. The actual service-account JSON file must be
installed manually on the VPS and mounted read-only. Never commit the credential
file, copy it into a Docker image, or paste its JSON contents into an environment
file.

## Google Analytics Credential Mount

Create the production secrets directory outside Git-tracked source files:

```bash
sudo mkdir -p /opt/projects/planetary-hours-platform/secrets
sudo chown -R "$USER":"$USER" /opt/projects/planetary-hours-platform/secrets
chmod 700 /opt/projects/planetary-hours-platform/secrets
```

Manually place the Google service-account JSON at:

```bash
/opt/projects/planetary-hours-platform/secrets/ga4-service-account.json
```

Then restrict permissions:

```bash
chmod 600 /opt/projects/planetary-hours-platform/secrets/ga4-service-account.json
```

The backend container mounts that file at:

```bash
/run/secrets/ga4-service-account.json
```

read-only. The Admin Panel talks only to the Planetary Hours backend for
analytics reports; browser code must never receive Google credentials or call
Google Analytics reporting APIs directly.

## Persistent Download Storage

Create the production download storage directory before enabling admin APK
uploads:

```bash
sudo mkdir -p /opt/projects/planetary-hours-platform/storage/downloads
sudo chown -R "$USER":"$USER" /opt/projects/planetary-hours-platform/storage
```

The backend container mounts this host directory at:

```bash
/app/storage/downloads
```

APK uploads are not stored in Git or inside Docker images, so they survive
container rebuilds.

## Production Backup Before Distribution Migration

Back up the production database before running migrations:

```bash
pg_dump "$DATABASE_URL" > planetary-hours-before-app-distribution.sql
```

The app-distribution migration only adds distribution tables and default Android
distribution metadata. It does not modify existing planetary-hour content.

## Local Docker Build Validation

```bash
cd /opt/projects/planetary-hours-platform
docker build -t planetary-hours-web:local -f apps/web/Dockerfile .
docker build -t planetary-hours-backend:local -f apps/backend/Dockerfile .
docker build -t planetary-hours-admin:local -f apps/admin-panel/Dockerfile .
```

## Docker Compose Validation

```bash
cd /opt/projects/planetary-hours-platform
docker compose -f docker-compose.prod.yml config
```

With production variables:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml config
```

## Starting Production

```bash
cd /opt/projects/planetary-hours-platform
cp .env.production.example .env.production
# Edit .env.production and set all required production values.
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

## Prisma Migrations

Run migrations after building images and before relying on the backend for traffic:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml run --rm backend npm run prisma:migrate:deploy
```

Seed editable planetary-hour content when needed:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml run --rm backend npm run prisma:seed
```

Do not run development migrations in production.

## Dynamic Sitemap

The public website serves `/sitemap.xml` through the web Nginx container, which proxies that path to the backend endpoint:

```bash
http://backend:3000/api/v1/sitemap.xml
```

The backend combines stable website routes with currently published blog articles. Draft, unpublished, and future-dated articles are excluded automatically, so publishing or unpublishing blog content updates the sitemap without rebuilding the website.

If an external VPS reverse proxy terminates HTTPS, keep `/sitemap.xml` routed to the website container on port `8080`, or proxy it directly to the backend host port at `/api/v1/sitemap.xml`.

The backend static sitemap route list must stay aligned with the website SEO registry in `apps/web/src/seo/seoData.json`. When adding or removing canonical public pages, update both places and keep the sitemap tests passing.

## Checking Status

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml ps
curl -i http://127.0.0.1:8080/health
curl -i http://127.0.0.1:8081/health
curl -i http://127.0.0.1:8082/api/v1/health
```

## Viewing Logs

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f web
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f backend
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f admin
```

## Restarting

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml restart web backend admin
```

## Stopping

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml down
```

## Pulling Newer Code

```bash
cd /opt/projects/planetary-hours-platform
git pull
docker compose --env-file .env.production -f docker-compose.prod.yml build
docker compose --env-file .env.production -f docker-compose.prod.yml run --rm backend npm run prisma:migrate:deploy
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

## Rolling Back To v1.0.0

```bash
cd /opt/projects/planetary-hours-platform
git fetch --tags
git checkout v1.0.0
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

## Notes

`DATABASE_URL`, `ADMIN_PASSWORD_HASH`, and `JWT_SECRET` must be supplied through `.env.production` or another production secret mechanism.
