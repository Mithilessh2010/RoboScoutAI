#!/usr/bin/env bash
set -euo pipefail

echo "Preparing Vercel deployment..."

command -v vercel >/dev/null 2>&1 || { echo "Please install Vercel CLI (npm i -g vercel) and login first."; exit 1; }

echo "Checking Vercel authentication..."
if ! vercel whoami >/dev/null 2>&1; then
  echo "Not logged into Vercel. Run: vercel login";
  exit 1
fi

# Map of required secret env vars (shell var -> vercel secret name)
declare -A SECRETS=(
  [MONGODB_URL]=mongodb_url
  [FTC_API_KEY]=ftc_api_key
  [FTC_EVENTS_USERNAME]=ftc_events_username
  [FTC_EVENTS_AUTH_KEY]=ftc_events_auth_key
)

for shellVar in "${!SECRETS[@]}"; do
  vercelName=${SECRETS[$shellVar]}
  val="${!shellVar-}"
  if [ -z "$val" ]; then
    echo "Warning: shell variable $shellVar is not set. Skipping adding $vercelName to Vercel."
    continue
  fi
  echo "Adding secret $vercelName to Vercel (production)..."
  printf "%s\n" "$val" | vercel env add "$vercelName" production >/dev/null
done

echo "Adding public/non-secret env vars (will prompt if not present)..."
vercel env add PUBLIC_SERVER_ORIGIN production || true
vercel env add PUBLIC_FRONTEND_CODE production || true
vercel env add FTC_EVENTS_API_BASE_URL production || true

echo "Deploying to Vercel (production)..."
vercel --prod

echo "Deployment finished. Visit your Vercel dashboard to view the deployment.
Ensure that the secrets are present in the project settings if any were skipped above." 
