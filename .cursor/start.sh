#!/usr/bin/env bash
# Per-boot startup for the Inventra Cloud Agent environment.
# Brings up PostgreSQL and reconciles the schema, then returns so the
# backend/frontend terminals can start. Kept idempotent and non-blocking.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

PG_VERSION=16

echo "==> Starting PostgreSQL cluster"
sudo pg_ctlcluster "$PG_VERSION" main start 2>/dev/null || true
for i in $(seq 1 30); do
  if sudo -u postgres pg_isready -q; then break; fi
  sleep 1
done

echo "==> Applying pending migrations (idempotent)"
( cd backend && npx prisma migrate deploy ) || true

echo "==> Start complete"
