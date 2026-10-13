#!/usr/bin/env bash
set -euo pipefail

BUCKET="ndvi-frontend"
REGION="eu-north-1"

# Käyttö: ./deploy-frontend.sh <distribution-id> [aws-profiili]
# Distribution ID: parametri 1, varalla CLOUDFRONT_DISTRIBUTION_ID
DISTRIBUTION_ID="${1:-${CLOUDFRONT_DISTRIBUTION_ID:-}}"
if [ -z "$DISTRIBUTION_ID" ]; then
  echo "Käyttö: ./deploy-frontend.sh <cloudfront-distribution-id> [aws-profiili]" >&2
  exit 1
fi

# AWS-profiili: parametri 2 (paikallisesti). Jos ei anneta, käytetään
# ympäristön oletustunnuksia (esim. GitHub Actions)
if [ -n "${2:-}" ]; then
  export AWS_PROFILE="$2"
fi

cd "$(dirname "$0")"

echo "==> Build (aws-mode)"
npm ci
npm run build -- --mode aws

echo "==> Lataus S3:een (hashatut assetit, pitkä cache)"
aws s3 sync dist/ "s3://$BUCKET" \
  --region "$REGION" \
  --delete \
  --exclude "index.html" \
  --cache-control "public,max-age=31536000,immutable"

echo "==> index.html (ei cachea)"
aws s3 cp dist/index.html "s3://$BUCKET/index.html" \
  --region "$REGION" \
  --cache-control "no-cache"

echo "==> CloudFront-invalidointi"
aws cloudfront create-invalidation \
  --distribution-id "$DISTRIBUTION_ID" \
  --paths "/*"

echo "==> Valmis"