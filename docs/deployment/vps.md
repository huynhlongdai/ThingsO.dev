# ThingsO VPS Production Runbook

Target: Ubuntu VPS + Docker Compose + Caddy automatic HTTPS.

## 1. Baseline

Run `deploy/bootstrap-vps.sh` once as root. Verify DNS A/AAAA records point at the VPS before starting Caddy.

## 2. Checkout

```bash
mkdir -p /opt/thingso
git clone https://github.com/huynhlongdai/ThingsO.dev.git /opt/thingso/app
cd /opt/thingso/app
git checkout main
```

## 3. Production environment

```bash
cp deploy/.env.production.example deploy/.env.production
chmod 600 deploy/.env.production
```

Use URL-safe random values for `POSTGRES_PASSWORD` and `ADMIN_AUTH_SECRET`. Do not commit this file. Configure GitHub and AI keys only when those features are enabled.

## 4. Build and migrate

```bash
docker compose -f deploy/compose.prod.yml --env-file deploy/.env.production build
docker compose -f deploy/compose.prod.yml --env-file deploy/.env.production up -d
```

The `migrate` one-shot service applies SQL migrations and seeds the V1 taxonomy before web/worker start.

## 5. Initial repository ingestion

Run this once for the curated seed:

```bash
docker compose -f deploy/compose.prod.yml --env-file deploy/.env.production run --rm worker \
  uv run --project apps/worker python -m thingso_worker enqueue-seed data/seeds/repositories.csv
```

The long-running worker consumes the queue, stores source facts, preserves curated capability labels and calculates `health-v1`.

To enable AI enrichment after factual ingestion:

```bash
docker compose -f deploy/compose.prod.yml --env-file deploy/.env.production run --rm worker \
  uv run --project apps/worker python -m thingso_worker enqueue-enrichment --limit 100
```

AI jobs require `AI_API_KEY` and `AI_MODEL_ENRICH`; otherwise leave them disabled and launch factual-only.

## 6. Validation

```bash
curl -fsS https://thingso.dev/api/health
curl -I https://thingso.dev/
curl -I https://thingso.dev/robots.txt
docker compose -f deploy/compose.prod.yml --env-file deploy/.env.production ps
docker compose -f deploy/compose.prod.yml --env-file deploy/.env.production logs --tail=100 worker
```

Admin is at `/admin` and uses Basic Auth username `admin`, password = `ADMIN_AUTH_SECRET`.

## 7. Update

```bash
cd /opt/thingso/app
git fetch origin
git checkout main
git pull --ff-only
docker compose -f deploy/compose.prod.yml --env-file deploy/.env.production build
docker compose -f deploy/compose.prod.yml --env-file deploy/.env.production up -d
```

## 8. Backup

Daily PostgreSQL backup example:

```bash
mkdir -p /opt/thingso/backups
docker compose -f deploy/compose.prod.yml --env-file deploy/.env.production exec -T postgres \
  pg_dump -U thingso -d thingso | gzip > /opt/thingso/backups/thingso-$(date +%F).sql.gz
find /opt/thingso/backups -type f -mtime +14 -delete
```

Also back up the production env file securely outside the VPS.

## 9. Security after successful deployment

- Create a non-root sudo user and install an SSH public key.
- Confirm key login works before changing SSH settings.
- Disable password authentication and direct root SSH login only after the key path is verified.
- Rotate any password/token that was shared through chat or another insecure channel.
- Keep PostgreSQL private; the production compose file does not publish port 5432.
- Keep `/admin` protected and never expose `ADMIN_AUTH_SECRET` to browser code.

## Rollback

Application rollback: checkout the last known-good main commit and rebuild. Database migrations are forward-only; take a database backup before any future destructive migration.
