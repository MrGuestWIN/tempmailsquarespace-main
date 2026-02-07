# 📧 TempMail - Disposable Email Service

A production-ready temporary email service built with Node.js, React, and SQLite. Uses email forwarding (catch-all) instead of running your own SMTP server.

![Neo Brutalism Design](https://via.placeholder.com/800x400/FF6B00/1A1A1A?text=TempMail)

## ✨ Features

- **Instant Email Addresses** - Generate random or custom email addresses
- **Real-time Updates** - WebSocket-based live email notifications
- **Multi-domain Support** - Add and manage multiple email domains
- **Auto-expiry** - Inboxes automatically expire after 20 minutes
- **Attachment Support** - Download email attachments
- **Admin Panel** - Manage domains, view stats, and monitor inboxes
- **Neo Brutalism UI** - Bold, modern design with orange/black/white theme

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Email Sender   │────▶│  Catch-all DNS   │────▶│   Gmail Inbox   │
│                 │     │  *@domain.com    │     │                 │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │
                                                    IMAP Polling
                                                          │
                                                          ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│     Browser     │◀───▶│  Express Server  │◀───▶│     SQLite      │
│   React + Vite  │     │  + Socket.io     │     │    Database     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

## 📋 Prerequisites

1. **Domain with Catch-all Email Forwarding**
   - Configure your domain's DNS to forward `*@yourdomain.com` to a Gmail address
   - This can be done via your domain registrar (Namecheap, Cloudflare, etc.)

2. **Gmail Account with App Password**
   - Enable 2-Factor Authentication on your Gmail
   - Generate an App Password: Google Account → Security → App Passwords

3. **Node.js 18+** and **npm**

## 🚀 Quick Start

### 1. Clone and Setup

```bash
git clone <your-repo>
cd tempmail

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment

Create `backend/.env`:

```env
# Gmail IMAP Configuration
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your-16-char-app-password

# IMAP Settings
IMAP_HOST=imap.gmail.com
IMAP_PORT=993

# Server Configuration
PORT=3001
FRONTEND_URL=http://localhost:5173

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password

# Session Settings
INBOX_EXPIRY_MINUTES=20
POLLING_INTERVAL_MS=2000
```

### 3. Run Development

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

Visit `http://localhost:5173`

## 🖥️ VPS Installation (Recommended)

### One-Command Install

```bash
# Upload project files to VPS, then run:
chmod +x install.sh
sudo ./install.sh
```

The installer will:
- Install Node.js 20, Nginx, and dependencies
- Setup the application in `/opt/tempmail`
- Configure systemd service for auto-start
- Setup Nginx reverse proxy
- Optionally configure SSL with Let's Encrypt
- Configure UFW firewall

### Management Scripts

```bash
# Interactive management console
sudo ./manage.sh

# Update to new version
sudo ./update.sh

# Uninstall
sudo ./uninstall.sh
```

### Manual Commands

```bash
# Service management
sudo systemctl start tempmail
sudo systemctl stop tempmail
sudo systemctl restart tempmail
sudo systemctl status tempmail

# View logs
sudo journalctl -u tempmail -f

# Edit configuration
sudo nano /opt/tempmail/backend/.env
```

## 🐳 Docker Deployment

### Using Docker Compose

```bash
# Create .env file first
cp backend/.env.example backend/.env
# Edit the .env file with your credentials

# Build and run
docker-compose up -d

# View logs
docker-compose logs -f
```

### Manual Docker Build

```bash
# Build
docker build -t tempmail .

# Run
docker run -d \
  -p 3001:3001 \
  -e GMAIL_USER=your@gmail.com \
  -e GMAIL_PASS=your-app-password \
  -e ADMIN_PASSWORD=secure-password \
  --name tempmail \
  tempmail
```

## 📧 Setting Up Email Forwarding

### Cloudflare Email Routing (Recommended)

1. Add your domain to Cloudflare
2. Go to Email → Email Routing
3. Enable Email Routing
4. Add a Catch-all rule: `*@yourdomain.com` → `your-gmail@gmail.com`

### Namecheap

1. Go to Domain List → Manage → Email Forwarding
2. Add forwarding: `*` → `your-gmail@gmail.com`

### Google Domains

1. Go to Email → Email Forwarding
2. Add: `*` → `your-gmail@gmail.com`

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GMAIL_USER` | Gmail address for IMAP | Required |
| `GMAIL_PASS` | Gmail App Password | Required |
| `IMAP_HOST` | IMAP server host | `imap.gmail.com` |
| `IMAP_PORT` | IMAP server port | `993` |
| `PORT` | Backend server port | `3001` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |
| `ADMIN_USERNAME` | Admin panel username | `admin` |
| `ADMIN_PASSWORD` | Admin panel password | `admin123` |
| `INBOX_EXPIRY_MINUTES` | Time until inbox expires | `20` |
| `POLLING_INTERVAL_MS` | IMAP check interval | `2000` |

## 📁 Project Structure

```
tempmail/
├── backend/
│   ├── server.js           # Express server entry
│   ├── database.js         # SQLite setup & migrations
│   ├── imapService.js      # Gmail IMAP connection & polling
│   ├── socket.js           # Socket.io real-time events
│   ├── cleanup.js          # Cron job for expired inboxes
│   └── routes/
│       ├── inbox.js        # Inbox API endpoints
│       └── admin.js        # Admin API endpoints
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.jsx    # Landing page
│   │   │   ├── Inbox.jsx   # Email inbox view
│   │   │   └── Admin.jsx   # Admin dashboard
│   │   ├── components/
│   │   │   └── Layout.jsx  # App layout
│   │   └── store/
│   │       └── useStore.js # Zustand state management
│   └── index.html
├── docker-compose.yml
├── Dockerfile
└── README.md
```

## 🔌 API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/inbox/domains` | List active domains |
| POST | `/api/inbox/random` | Create random inbox |
| POST | `/api/inbox/create` | Create custom inbox |
| GET | `/api/inbox/:sessionId` | Get inbox info |
| GET | `/api/inbox/:sessionId/emails` | List emails |
| GET | `/api/inbox/:sessionId/emails/:id` | Get email content |
| DELETE | `/api/inbox/:sessionId/emails/:id` | Delete email |
| GET | `/api/inbox/:sessionId/attachments/:id` | Download attachment |
| POST | `/api/inbox/:sessionId/extend` | Extend inbox expiry |

### Admin Endpoints (Requires Auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/login` | Admin login |
| GET | `/api/admin/stats` | Get statistics |
| GET | `/api/admin/domains` | List all domains |
| POST | `/api/admin/domains` | Add domain |
| PATCH | `/api/admin/domains/:id` | Toggle domain |
| DELETE | `/api/admin/domains/:id` | Delete domain |
| GET | `/api/admin/inboxes` | List active inboxes |
| DELETE | `/api/admin/inboxes/:id` | Delete inbox |

## 🛡️ Security Considerations

- Use strong admin passwords in production
- Enable HTTPS with a reverse proxy (nginx)
- Consider rate limiting for production
- Gmail App Passwords are safer than regular passwords
- Inboxes auto-expire to prevent data accumulation

## 📝 License

MIT License - Feel free to use for personal or commercial projects.

## 🤝 Contributing

Contributions are welcome! Please open an issue or PR.
