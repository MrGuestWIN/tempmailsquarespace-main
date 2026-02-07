#!/bin/bash

#############################################
#  TempMail Uninstaller
#############################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

APP_DIR="/opt/tempmail"
SERVICE_USER="tempmail"

print_msg() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Check root
if [[ $EUID -ne 0 ]]; then
    print_error "This script must be run as root"
    exit 1
fi

echo ""
echo -e "${RED}╔═══════════════════════════════════════════╗${NC}"
echo -e "${RED}║      TempMail Uninstaller                 ║${NC}"
echo -e "${RED}╚═══════════════════════════════════════════╝${NC}"
echo ""

read -p "This will completely remove TempMail. Are you sure? (y/n): " CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo "Uninstall cancelled."
    exit 0
fi

# Stop and disable service
if systemctl is-active --quiet tempmail; then
    print_warn "Stopping TempMail service..."
    systemctl stop tempmail
fi

if systemctl is-enabled --quiet tempmail 2>/dev/null; then
    print_warn "Disabling TempMail service..."
    systemctl disable tempmail
fi

# Remove systemd service
if [ -f /etc/systemd/system/tempmail.service ]; then
    rm /etc/systemd/system/tempmail.service
    systemctl daemon-reload
    print_msg "Systemd service removed"
fi

# Remove nginx config
if [ -f /etc/nginx/sites-available/tempmail ]; then
    rm -f /etc/nginx/sites-available/tempmail
    rm -f /etc/nginx/sites-enabled/tempmail
    systemctl reload nginx 2>/dev/null || true
    print_msg "Nginx configuration removed"
fi

# Remove application directory
if [ -d "$APP_DIR" ]; then
    read -p "Delete application data ($APP_DIR)? (y/n): " DEL_DATA
    if [[ "$DEL_DATA" =~ ^[Yy]$ ]]; then
        rm -rf $APP_DIR
        print_msg "Application directory removed"
    else
        print_warn "Application directory preserved at $APP_DIR"
    fi
fi

# Remove user
if id "$SERVICE_USER" &>/dev/null; then
    userdel $SERVICE_USER 2>/dev/null || true
    print_msg "User $SERVICE_USER removed"
fi

echo ""
print_msg "TempMail has been uninstalled!"
echo ""
