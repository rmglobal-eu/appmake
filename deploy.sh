#!/bin/bash
set -e
cd /var/www/appmake

echo "[1/5] Pulling latest code..."
git pull origin main

echo "[2/5] Installing dependencies..."
npm install

echo "[3/5] Building..."
rm -rf .next
npx next build

echo "[4/5] Preparing standalone..."
cp .env.local .next/standalone/.env.local
cp -r public .next/standalone/public 2>/dev/null || true
cp -r .next/static .next/standalone/.next/static 2>/dev/null || true
cp -r .next/server .next/standalone/.next/server 2>/dev/null || true

# Sync build to /opt/appmake (PM2 cwd)
rm -rf /opt/appmake/.next
cp -r .next /opt/appmake/.next
cp -r public /opt/appmake/public 2>/dev/null || true
cp .env.local /opt/appmake/.env.local 2>/dev/null || true
cp package.json /opt/appmake/package.json 2>/dev/null || true

echo "[5/5] Restarting PM2..."
pm2 restart appmake

echo "Deploy complete!"
