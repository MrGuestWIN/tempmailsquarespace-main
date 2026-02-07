#!/bin/bash

#############################################
#  TempMail VPS Installer
#  Supports: Ubuntu 20.04+, Debian 11+
#############################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
ORANGE='\033[0;33m'
NC='\033[0m' # No Color

# Variables
APP_NAME="tempmail"
APP_DIR="/opt/tempmail"
SERVICE_USER="tempmail"
NODE_VERSION="20"

# Print banner
print_banner() {
    echo -e "${ORANGE}"
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║                                                          ║"
    echo "║   ████████╗███████╗███╗   ███╗██████╗ ███╗   ███╗        ║"
    echo "║   ╚══██╔══╝██╔════╝████╗ ████║██╔══██╗████╗ ████║        ║"
    echo "║      ██║   █████╗  ██╔████╔██║██████╔╝██╔████╔██║        ║"
    echo "║      ██║   ██╔══╝  ██║╚██╔╝██║██╔═══╝ ██║╚██╔╝██║        ║"
    echo "║      ██║   ███████╗██║ ╚═╝ ██║██║     ██║ ╚═╝ ██║        ║"
    echo "║      ╚═╝   ╚══════╝╚═╝     ╚═╝╚═╝     ╚═╝     ╚═╝        ║"
    echo "║                                                          ║"
    echo "║            Disposable Email Service Installer            ║"
    echo "║                                                          ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Print colored message
print_msg() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[i]${NC} $1"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "This script must be run as root (use sudo)"
        exit 1
    fi
}

# Detect OS
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        VER=$VERSION_ID
    else
        print_error "Cannot detect OS. Only Ubuntu/Debian supported."
        exit 1
    fi
    
    if [[ "$OS" != "ubuntu" && "$OS" != "debian" ]]; then
        print_error "Only Ubuntu and Debian are supported."
        exit 1
    fi
    
    print_msg "Detected OS: $OS $VER"
}

# Update system
update_system() {
    print_info "Updating system packages..."
    apt-get update -qq
    apt-get upgrade -y -qq
    print_msg "System updated"
}

# Install dependencies
install_dependencies() {
    print_info "Installing dependencies..."
    apt-get install -y -qq curl wget git build-essential python3 nginx certbot python3-certbot-nginx
    print_msg "Dependencies installed"
}

# Install Node.js
install_nodejs() {
    if command -v node &> /dev/null; then
        CURRENT_NODE=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$CURRENT_NODE" -ge "$NODE_VERSION" ]; then
            print_msg "Node.js v$(node -v) already installed"
            return
        fi
    fi
    
    print_info "Installing Node.js $NODE_VERSION..."
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - > /dev/null 2>&1
    apt-get install -y -qq nodejs
    print_msg "Node.js $(node -v) installed"
}

# Create service user
create_user() {
    if id "$SERVICE_USER" &>/dev/null; then
        print_msg "User $SERVICE_USER already exists"
    else
        print_info "Creating user $SERVICE_USER..."
        useradd -r -s /bin/false -d $APP_DIR $SERVICE_USER
        print_msg "User $SERVICE_USER created"
    fi
}

# Setup application directory
setup_app() {
    print_info "Setting up application..."
    
    # Create directory
    mkdir -p $APP_DIR
    
    # Copy files
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    
    if [ -d "$SCRIPT_DIR/backend" ]; then
        cp -r "$SCRIPT_DIR/backend" $APP_DIR/
        cp -r "$SCRIPT_DIR/frontend" $APP_DIR/
        print_msg "Files copied from local directory"
    else
        print_error "Backend/Frontend folders not found!"
        print_info "Make sure to run this script from the project directory"
        exit 1
    fi
    
    # Install backend dependencies
    print_info "Installing backend dependencies..."
    cd $APP_DIR/backend
    npm install --production --silent
    
    # Install frontend dependencies and build
    print_info "Building frontend..."
    cd $APP_DIR/frontend
    npm install --silent
    npm run build
    
    # Set permissions
    chown -R $SERVICE_USER:$SERVICE_USER $APP_DIR
    
    print_msg "Application setup complete"
}

# Configure environment
configure_env() {
    print_info "Configuring environment..."
    echo ""
    echo -e "${ORANGE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${ORANGE}                    CONFIGURATION                          ${NC}"
    echo -e "${ORANGE}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    
    # Gmail credentials
    read -p "Enter Gmail address for IMAP: " GMAIL_USER
    read -sp "Enter Gmail App Password: " GMAIL_PASS
    echo ""
    
    # Domain
    read -p "Enter your domain (e.g., tempmail.example.com): " APP_DOMAIN
    
    # Admin credentials
    read -p "Enter admin username [admin]: " ADMIN_USER
    ADMIN_USER=${ADMIN_USER:-admin}
    
    read -sp "Enter admin password: " ADMIN_PASS
    echo ""
    
    # Generate random secret if not provided
    if [ -z "$ADMIN_PASS" ]; then
        ADMIN_PASS=$(openssl rand -base64 12)
        print_warn "Generated admin password: $ADMIN_PASS"
    fi
    
    # Create .env file
    cat > $APP_DIR/backend/.env << EOF
# Gmail IMAP Configuration
GMAIL_USER=$GMAIL_USER
GMAIL_PASS=$GMAIL_PASS

# IMAP Settings
IMAP_HOST=imap.gmail.com
IMAP_PORT=993

# Server Configuration
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://$APP_DOMAIN

# Admin Credentials
ADMIN_USERNAME=$ADMIN_USER
ADMIN_PASSWORD=$ADMIN_PASS

# Session Settings
INBOX_EXPIRY_MINUTES=20
POLLING_INTERVAL_MS=2000
EOF
    
    chown $SERVICE_USER:$SERVICE_USER $APP_DIR/backend/.env
    chmod 600 $APP_DIR/backend/.env
    
    print_msg "Environment configured"
}

# Create systemd service
create_service() {
    print_info "Creating systemd service..."
    
    cat > /etc/systemd/system/tempmail.service << EOF
[Unit]
Description=TempMail Disposable Email Service
After=network.target

[Service]
Type=simple
User=$SERVICE_USER
WorkingDirectory=$APP_DIR/backend
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=tempmail
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF
    
    systemctl daemon-reload
    systemctl enable tempmail
    systemctl start tempmail
    
    print_msg "Systemd service created and started"
}

# Configure Nginx
configure_nginx() {
    print_info "Configuring Nginx..."
    
    cat > /etc/nginx/sites-available/tempmail << EOF
server {
    listen 80;
    server_name $APP_DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }
}
EOF
    
    # Enable site
    ln -sf /etc/nginx/sites-available/tempmail /etc/nginx/sites-enabled/
    
    # Remove default site
    rm -f /etc/nginx/sites-enabled/default
    
    # Test and reload nginx
    nginx -t
    systemctl reload nginx
    
    print_msg "Nginx configured"
}

# Setup SSL with Certbot
setup_ssl() {
    echo ""
    read -p "Do you want to setup SSL with Let's Encrypt? (y/n) [y]: " SETUP_SSL
    SETUP_SSL=${SETUP_SSL:-y}
    
    if [[ "$SETUP_SSL" =~ ^[Yy]$ ]]; then
        print_info "Setting up SSL..."
        
        read -p "Enter email for SSL certificate: " SSL_EMAIL
        
        certbot --nginx -d $APP_DOMAIN --non-interactive --agree-tos -m $SSL_EMAIL
        
        print_msg "SSL certificate installed"
    else
        print_warn "SSL setup skipped. You can run 'certbot --nginx -d $APP_DOMAIN' later"
    fi
}

# Setup firewall
setup_firewall() {
    print_info "Configuring firewall..."
    
    if command -v ufw &> /dev/null; then
        ufw allow 22/tcp
        ufw allow 80/tcp
        ufw allow 443/tcp
        ufw --force enable
        print_msg "UFW firewall configured"
    else
        print_warn "UFW not found. Please configure firewall manually."
    fi
}

# Print completion message
print_complete() {
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}              INSTALLATION COMPLETE!                        ${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "  ${BLUE}Application URL:${NC}  https://$APP_DOMAIN"
    echo -e "  ${BLUE}Admin Panel:${NC}      https://$APP_DOMAIN/admin"
    echo -e "  ${BLUE}Admin Username:${NC}   $ADMIN_USER"
    echo ""
    echo -e "  ${YELLOW}Useful Commands:${NC}"
    echo -e "    • Check status:   ${GREEN}systemctl status tempmail${NC}"
    echo -e "    • View logs:      ${GREEN}journalctl -u tempmail -f${NC}"
    echo -e "    • Restart:        ${GREEN}systemctl restart tempmail${NC}"
    echo -e "    • Stop:           ${GREEN}systemctl stop tempmail${NC}"
    echo ""
    echo -e "  ${YELLOW}Next Steps:${NC}"
    echo -e "    1. Configure DNS: Point $APP_DOMAIN to this server"
    echo -e "    2. Setup email forwarding: *@yourdomain.com → Gmail"
    echo -e "    3. Add domains via admin panel"
    echo ""
    echo -e "${ORANGE}═══════════════════════════════════════════════════════════${NC}"
}

# Main installation
main() {
    print_banner
    
    check_root
    detect_os
    
    echo ""
    read -p "This will install TempMail on your VPS. Continue? (y/n) [y]: " CONTINUE
    CONTINUE=${CONTINUE:-y}
    
    if [[ ! "$CONTINUE" =~ ^[Yy]$ ]]; then
        echo "Installation cancelled."
        exit 0
    fi
    
    echo ""
    update_system
    install_dependencies
    install_nodejs
    create_user
    setup_app
    configure_env
    create_service
    configure_nginx
    setup_ssl
    setup_firewall
    print_complete
}

# Run main
main "$@"
