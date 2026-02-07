#!/bin/bash

#############################################
#  TempMail Management Script
#############################################

APP_DIR="/opt/tempmail"
SERVICE_NAME="tempmail"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

show_menu() {
    clear
    echo -e "${BLUE}"
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║           TempMail Management Console                     ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    # Show status
    if systemctl is-active --quiet $SERVICE_NAME; then
        echo -e "  Status: ${GREEN}● Running${NC}"
    else
        echo -e "  Status: ${RED}● Stopped${NC}"
    fi
    
    echo ""
    echo "  1) Start TempMail"
    echo "  2) Stop TempMail"
    echo "  3) Restart TempMail"
    echo "  4) View Logs (live)"
    echo "  5) View Status"
    echo "  6) Edit Configuration"
    echo "  7) View Configuration"
    echo "  8) Backup Database"
    echo "  9) Test IMAP Connection"
    echo "  0) Exit"
    echo ""
}

start_service() {
    echo "Starting TempMail..."
    systemctl start $SERVICE_NAME
    sleep 2
    systemctl status $SERVICE_NAME --no-pager
    read -p "Press Enter to continue..."
}

stop_service() {
    echo "Stopping TempMail..."
    systemctl stop $SERVICE_NAME
    echo "TempMail stopped."
    read -p "Press Enter to continue..."
}

restart_service() {
    echo "Restarting TempMail..."
    systemctl restart $SERVICE_NAME
    sleep 2
    systemctl status $SERVICE_NAME --no-pager
    read -p "Press Enter to continue..."
}

view_logs() {
    echo "Viewing logs (Ctrl+C to exit)..."
    journalctl -u $SERVICE_NAME -f
}

view_status() {
    systemctl status $SERVICE_NAME
    echo ""
    echo "--- Health Check ---"
    curl -s http://localhost:3001/api/health | python3 -m json.tool 2>/dev/null || echo "Service not responding"
    echo ""
    read -p "Press Enter to continue..."
}

edit_config() {
    if [ -f $APP_DIR/backend/.env ]; then
        ${EDITOR:-nano} $APP_DIR/backend/.env
        echo ""
        read -p "Restart TempMail to apply changes? (y/n): " RESTART
        if [[ "$RESTART" =~ ^[Yy]$ ]]; then
            systemctl restart $SERVICE_NAME
            echo "TempMail restarted."
        fi
    else
        echo "Configuration file not found!"
    fi
    read -p "Press Enter to continue..."
}

view_config() {
    if [ -f $APP_DIR/backend/.env ]; then
        echo "--- Current Configuration ---"
        echo ""
        # Hide password
        cat $APP_DIR/backend/.env | sed 's/GMAIL_PASS=.*/GMAIL_PASS=********/' | sed 's/ADMIN_PASSWORD=.*/ADMIN_PASSWORD=********/'
        echo ""
    else
        echo "Configuration file not found!"
    fi
    read -p "Press Enter to continue..."
}

backup_database() {
    BACKUP_DIR="/root/tempmail-backups"
    mkdir -p $BACKUP_DIR
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/tempmail_$TIMESTAMP.db"
    
    if [ -f $APP_DIR/backend/tempmail.db ]; then
        cp $APP_DIR/backend/tempmail.db $BACKUP_FILE
        echo -e "${GREEN}Database backed up to: $BACKUP_FILE${NC}"
    else
        echo "Database file not found!"
    fi
    read -p "Press Enter to continue..."
}

test_imap() {
    echo "Testing IMAP connection..."
    cd $APP_DIR/backend
    
    node -e "
    require('dotenv').config();
    const imaps = require('imap-simple');
    
    const config = {
        imap: {
            user: process.env.GMAIL_USER,
            password: process.env.GMAIL_PASS,
            host: process.env.IMAP_HOST || 'imap.gmail.com',
            port: parseInt(process.env.IMAP_PORT) || 993,
            tls: true,
            authTimeout: 10000
        }
    };
    
    console.log('Connecting to:', config.imap.host);
    console.log('User:', config.imap.user);
    
    imaps.connect(config)
        .then(connection => {
            console.log('✓ IMAP connection successful!');
            return connection.openBox('INBOX');
        })
        .then(() => {
            console.log('✓ INBOX opened successfully!');
            process.exit(0);
        })
        .catch(err => {
            console.error('✗ Connection failed:', err.message);
            process.exit(1);
        });
    " 2>&1
    
    echo ""
    read -p "Press Enter to continue..."
}

# Check root
if [[ $EUID -ne 0 ]]; then
    echo "This script must be run as root"
    exit 1
fi

# Main loop
while true; do
    show_menu
    read -p "Select option: " choice
    
    case $choice in
        1) start_service ;;
        2) stop_service ;;
        3) restart_service ;;
        4) view_logs ;;
        5) view_status ;;
        6) edit_config ;;
        7) view_config ;;
        8) backup_database ;;
        9) test_imap ;;
        0) echo "Goodbye!"; exit 0 ;;
        *) echo "Invalid option"; sleep 1 ;;
    esac
done
