#!/bin/bash
# Jalankan script ini DI VPS setelah clone/upload project (jalan dari root project)
# Usage: bash deploy-on-vps.sh

set -e
cd "$(dirname "$0")"

echo "=== Temp Mail - Deploy di VPS ==="

# 1. Cek / install Node.js 20
if ! command -v node &>/dev/null; then
  echo "Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
NODE_VERSION=$(node -v)
echo "Node: $NODE_VERSION"

# 2. Backend: install deps
echo "Installing backend dependencies..."
cd backend
npm ci --omit=dev 2>/dev/null || npm install --omit=dev
cd ..

# 3. Frontend: install deps + build
echo "Building frontend..."
cd frontend
npm ci 2>/dev/null || npm install
npm run build
cd ..

# 4. .env di backend (jika belum ada)
if [ ! -f backend/.env ]; then
  echo "Creating backend/.env from env.example - EDIT INI dengan nilai asli!"
  cp backend/env.example backend/.env
  echo "  -> Edit backend/.env (GMAIL_USER, GMAIL_PASS, ADMIN_PASSWORD, FRONTEND_URL, dll)"
fi

# 5. PM2 (process manager)
if ! command -v pm2 &>/dev/null; then
  echo "Installing PM2..."
  npm install -g pm2
fi

# 6. Jalankan dari folder backend, NODE_ENV=production
echo "Starting app with PM2..."
cd backend
export NODE_ENV=production
pm2 delete tempmail 2>/dev/null || true
pm2 start server.js --name tempmail
pm2 save
pm2 startup | tail -1 | bash 2>/dev/null || true
cd ..

echo ""
echo "=== Selesai ==="
echo "App jalan di port 3001. Cek: pm2 status"
echo "Log: pm2 logs tempmail"
echo "Restart: pm2 restart tempmail"
echo ""
echo "Agar bisa diakses dari luar, buka firewall: ufw allow 3001 && ufw allow 80 && ufw enable"
echo "Atau pasang Nginx sebagai reverse proxy (lihat DEPLOY-VPS.md)"
