# Planetary Hours Frontend Deployment

Production frontend deployment uses the Vite React app in `apps/web`.

VPS project path:

```bash
/opt/projects/planetary-hours-platform
```

Health check URL:

```bash
http://127.0.0.1:8080/health
```

Android APK download URL:

```bash
VITE_ANDROID_APK_URL=https://planetaryhours.in/downloads/planetary-hours-v1.0.0-beta.apk
```

The Vite frontend reads this public URL at build time. For Docker and VPS deployments, set it in `.env.production` before running `docker compose ... up -d --build`.

## Local Docker Build Validation

```bash
cd /opt/projects/planetary-hours-platform
docker build -t planetary-hours-web:local -f apps/web/Dockerfile .
```

## Docker Compose Validation

```bash
cd /opt/projects/planetary-hours-platform
docker compose -f docker-compose.prod.yml config
```

## Starting Production

```bash
cd /opt/projects/planetary-hours-platform
cp .env.production.example .env.production
# Edit .env.production and set VITE_ANDROID_APK_URL to the final HTTPS APK URL.
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

## Checking Status

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml ps
curl -i http://127.0.0.1:8080/health
```

## Viewing Logs

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f web
```

## Restarting

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml restart web
```

## Stopping

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml down
```

## Pulling Newer Code

```bash
cd /opt/projects/planetary-hours-platform
git pull
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

`docker-compose.prod.yml` intentionally contains only the web service. The frontend MVP currently works without a project database.
