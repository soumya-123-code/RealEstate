#!/bin/bash
set -e

# deploy.sh - simple deploy script for suretreaven
# Usage: run from the application root on the server, or copy to the app root and run.

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$APP_DIR"

echo "Deploying from $APP_DIR"

# Fetch latest
git fetch origin

# Prefer the agents/add-server-start-files branch if it exists remotely
if git ls-remote --exit-code --heads origin agents/add-server-start-files >/dev/null 2>&1; then
  echo "Checking out branch agents/add-server-start-files"
  git checkout agents/add-server-start-files
  git reset --hard origin/agents/add-server-start-files || true
else
  echo "Falling back to main branch"
  git checkout main
  git reset --hard origin/main || true
fi

# Install dependencies and build
if command -v npm >/dev/null 2>&1; then
  npm ci --prefer-offline --no-audit || npm install
  npm run build
else
  echo "npm not found; aborting"
  exit 2
fi

# Start/restart with pm2
if ! command -v pm2 >/dev/null 2>&1; then
  echo "pm2 not found; attempting to install globally (may require sudo)"
  sudo npm install -g pm2@latest || true
fi

# Try to restart; if not started, start using ecosystem or server.js
pm2 restart suretreaven --update-env 2>/dev/null || \
  pm2 start ecosystem.config.js --env production 2>/dev/null || \
  pm2 start server.js --name suretreaven --update-env

pm2 save || true
sudo pm2 startup systemd -u $(whoami) --hp $HOME || true

echo "Deploy complete"
exit 0
