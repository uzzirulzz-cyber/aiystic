#!/usr/bin/env bash
# Create the mystic-artifacts R2 bucket on Cloudflare
# Requires: CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID env vars

set -e

ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-20c83732a1af52f80655768cd4dfc251}"
API_TOKEN="${CLOUDFLARE_API_TOKEN:-cfat_jYtDpD4e0Pe5gEwu0yePfKNh2QjyyMOrLF3HcWZL47171665}"
BUCKET_NAME="${R2_BUCKET_NAME:-mystic-artifacts}"

echo "🪣 Creating R2 bucket: ${BUCKET_NAME}"

RESPONSE=$(curl -s -X POST \
  "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/r2/buckets" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"${BUCKET_NAME}\", \"locationHint\": \"enam\"}")

echo "${RESPONSE}" | python3 -m json.tool 2>/dev/null || echo "${RESPONSE}"

echo ""
echo "📋 Listing buckets:"
curl -s "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/r2/buckets" \
  -H "Authorization: Bearer ${API_TOKEN}" | python3 -m json.tool 2>/dev/null | head -30
