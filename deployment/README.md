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

## Local Docker Build Validation

```bash
cd /opt/projects/planetary-hours-platform
docker build -t planetary-hours-web:local ./apps/web
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
