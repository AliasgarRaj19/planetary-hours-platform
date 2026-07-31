# Planetary Hours Platform

## Version 1 MVP

Features:

* Email Login
* Google Login
* GPS City Detection
* Manual City Selection
* Planetary Hour Calculations
* Planetary Hour Notifications
* Planetary Information
* Admin Content Management

Architecture:

* Flutter Mobile App
* NestJS Backend
* React Admin Panel
* PostgreSQL Database
* Docker Deployment

Planetary calculations are performed on the mobile device.

Backend manages users, content, settings and synchronization.

## Production Deployment

Production Docker deployment is configured in `docker-compose.prod.yml` for:

* Website (`apps/web`)
* Backend API (`apps/backend`)
* Admin panel (`apps/admin-panel`)

See `deployment/README.md` for build, compose validation, migration, restart, and rollback commands.
