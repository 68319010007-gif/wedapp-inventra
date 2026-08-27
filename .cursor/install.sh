#!/usr/bin/env bash
# Idempotent install for the Inventra Cloud Agent environment.
# Installs PostgreSQL, refreshes Node deps, and prepares the dev database
# (migrate + seed). Runs natively (no Docker) so it works inside the VM.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

PG_VERSION=16
PG_USER=inventra
PG_PASSWORD=inventra_secret
PG_DB=inventra
DATABASE_URL="postgresql://${PG_USER}:${PG_PASSWORD}@localhost:5432/${PG_DB}?schema=public"

echo "==> Ensuring PostgreSQL is installed"
if ! command -v pg_ctlcluster >/dev/null 2>&1; then
  sudo apt-get update -y
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y postgresql postgresql-contrib
fi

echo "==> Ensuring PostgreSQL cluster is running"
sudo pg_ctlcluster "$PG_VERSION" main start 2>/dev/null || true
for i in $(seq 1 30); do
  if sudo -u postgres pg_isready -q; then break; fi
  sleep 1
done

echo "==> Ensuring role and database exist"
sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO \$\$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='${PG_USER}') THEN
    CREATE ROLE ${PG_USER} LOGIN PASSWORD '${PG_PASSWORD}';
  END IF;
END \$\$;
SQL
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='${PG_DB}'" | grep -q 1 \
  || sudo -u postgres createdb -O "$PG_USER" "$PG_DB"
sudo -u postgres psql -c "ALTER DATABASE ${PG_DB} OWNER TO ${PG_USER};"

echo "==> Writing backend/.env (if missing)"
if [ ! -f backend/.env ]; then
  cat > backend/.env <<ENV
DATABASE_URL=${DATABASE_URL}
NODE_ENV=development
PORT=4000
JWT_SECRET=dev-jwt-secret-change-in-production
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880
ENV
fi

echo "==> Installing backend dependencies (runs prisma generate via postinstall)"
( cd backend && npm install )

echo "==> Installing frontend dependencies"
( cd frontend && npm install )

echo "==> Applying database migrations and seed"
( cd backend && npx prisma migrate deploy && npx prisma db seed )

echo "==> Install complete"
