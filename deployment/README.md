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
```

The Vite website and admin panel read these public values at Docker build time.

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
