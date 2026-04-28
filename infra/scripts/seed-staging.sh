#!/usr/bin/env bash
# Seed the staging environment with a known test account.
# Invoked by Terraform after the staging API container becomes healthy.
# Idempotent: tolerates "user already exists" on re-apply.
set -euo pipefail

PORT="${1:?api port required as first argument}"
URL="http://127.0.0.1:${PORT}"
EMAIL="staging@example.local"
PASSWORD="staging-password"

echo "[seed] waiting for ${URL}/api/health ..."
for i in $(seq 1 60); do
  if curl -fsS "${URL}/api/health" >/dev/null 2>&1; then
    echo "[seed] api is healthy after ${i}s"
    break
  fi
  if [ "${i}" -eq 60 ]; then
    echo "[seed] api never became healthy" >&2
    exit 1
  fi
  sleep 1
done

echo "[seed] registering ${EMAIL} (idempotent) ..."
HTTP_CODE=$(curl -s -o /tmp/seed-staging-response.json -w '%{http_code}' \
  -X POST "${URL}/api/auth/register" \
  -H 'content-type: application/json' \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}" || true)

case "${HTTP_CODE}" in
  201)
    echo "[seed] created ${EMAIL}"
    ;;
  409)
    echo "[seed] ${EMAIL} already exists — skipping"
    ;;
  *)
    echo "[seed] unexpected response ${HTTP_CODE}:" >&2
    cat /tmp/seed-staging-response.json >&2 || true
    echo >&2
    exit 1
    ;;
esac

rm -f /tmp/seed-staging-response.json
echo "[seed] done"
