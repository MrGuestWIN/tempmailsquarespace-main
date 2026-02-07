#!/bin/bash

#############################################
#  TempMail Update Script
#############################################

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

APP_DIR="/opt/tempmail"
SERVICE_USER="tempmail"

print_msg() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[i]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Check root
if [[ $EUID -ne 0 ]]; then
    echo "This script must be run as root"
    exit 1
fi

echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        TempMail Update Script             ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════╝${NC}"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ ! -d "$SCRIPT_DIR/backend" ]; then
    echo "Error: Run this script from the project directory"
    exit 1
fi

# Backup .env
if [ -f "$APP_DIR/backend/.env" ]; then
    print_info "Backing up configuration..."
    cp $APP_DIR/backend/.env /tmp/tempmail.env.backup
    print_msg "Configuration backed up"
fi

# Stop service
print_info "Stopping TempMail service..."
systemctl stop tempmail

# Update files
print_info "Updating application files..."
cp -r "$SCRIPT_DIR/backend/"* $APP_DIR/backend/
cp -r "$SCRIPT_DIR/frontend/"* $APP_DIR/frontend/

# Restore .env
if [ -f /tmp/tempmail.env.backup ]; then
    mv /tmp/tempmail.env.backup $APP_DIR/backend/.env
    print_msg "Configuration restored"
fi

# Update dependencies
print_info "Updating backend dependencies..."
cd $APP_DIR/backend
npm install --production --silent

print_info "Rebuilding frontend..."
cd $APP_DIR/frontend
npm install --silent
npm run build

# Set permissions
chown -R $SERVICE_USER:$SERVICE_USER $APP_DIR

# Start service
print_info "Starting TempMail service..."
systemctl start tempmail

# Check status
sleep 2
if systemctl is-active --quiet tempmail; then
    print_msg "TempMail updated and running!"
else
    print_warn "Service may have issues. Check: journalctl -u tempmail -f"
fi

echo ""
print_msg "Update complete!"
echo ""
