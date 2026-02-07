const imaps = require('imap-simple');
const { simpleParser } = require('mailparser');
const db = require('./database');
const EventEmitter = require('events');

class ImapService extends EventEmitter {
  constructor() {
    super();
    this.connection = null;
    this.isConnected = false;
    this.pollingInterval = null;
    this.processedUids = new Set();
  }

  /** Get IMAP config: prefer .env (GMAIL_USER/GMAIL_PASS), else active account from DB (app password) */
  getConfig() {
    const useEnv = process.env.GMAIL_USER && process.env.GMAIL_PASS;
    const account = !useEnv ? db.prepare(
      'SELECT email, app_password, imap_host, imap_port FROM gmail_accounts WHERE is_active = 1 ORDER BY id ASC LIMIT 1'
    ).get() : null;

    const user = useEnv ? process.env.GMAIL_USER : (account?.email);
    const password = useEnv ? process.env.GMAIL_PASS : (account?.app_password);
    const host = (useEnv ? process.env.IMAP_HOST : account?.imap_host) || 'imap.gmail.com';
    const port = parseInt(useEnv ? process.env.IMAP_PORT : account?.imap_port) || 993;

    return {
      imap: {
        user,
        password,
        host,
        port,
        tls: true,
        authTimeout: 10000,
        tlsOptions: { rejectUnauthorized: false }
      }
    };
  }

  async connect() {
    const config = this.getConfig();
    if (!config.imap.user || !config.imap.password) {
      console.log('⚠️ No IMAP account (set GMAIL_USER+GMAIL_PASS in .env or add account in Admin)');
      return false;
    }
    try {
      console.log('🔌 Connecting to IMAP server...', config.imap.host);
      this.connection = await imaps.connect(config);
      this.isConnected = true;
      console.log('✅ Connected to IMAP server');
      
      await this.connection.openBox('INBOX');
      console.log('📬 Opened INBOX');
      
      // Start polling
      this.startPolling();
      
      return true;
    } catch (error) {
      console.error('❌ IMAP connection error:', error.message);
      this.isConnected = false;
      
      // Retry connection after 5 seconds
      setTimeout(() => this.connect(), 5000);
      return false;
    }
  }

  startPolling() {
    const interval = parseInt(process.env.POLLING_INTERVAL_MS) || 2000;
    
    console.log(`🔄 Starting email polling every ${interval}ms`);
    
    this.pollingInterval = setInterval(async () => {
      if (this.isConnected) {
        await this.fetchNewEmails();
      }
    }, interval);
    
    // Initial fetch
    this.fetchNewEmails();
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  async fetchNewEmails() {
    try {
      const searchCriteria = ['UNSEEN'];
      const fetchOptions = {
        bodies: [''],
        markSeen: true,
        struct: true
      };

      const messages = await this.connection.search(searchCriteria, fetchOptions);
      
      for (const message of messages) {
        const uid = message.attributes.uid;
        
        // Skip already processed
        if (this.processedUids.has(uid)) continue;
        this.processedUids.add(uid);
        
        // Keep set size manageable
        if (this.processedUids.size > 1000) {
          const arr = Array.from(this.processedUids);
          this.processedUids = new Set(arr.slice(-500));
        }
        
        const all = message.parts.find(part => part.which === '');
        if (all && all.body) {
          await this.processEmail(all.body, message.attributes);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching emails:', error.message);
      
      if (error.message.includes('Not connected') || error.message.includes('connection')) {
        this.isConnected = false;
        this.stopPolling();
        setTimeout(() => this.connect(), 5000);
      }
    }
  }

  /** Parse email address from header (e.g. "Name <a@b.com>" → a@b.com) */
  parseAddressFromHeader(value) {
    if (!value || typeof value !== 'string') return null;
    const match = value.trim().match(/<([^>]+)>/) || value.trim().match(/([^\s,]+@[^\s,]+)/);
    return match ? match[1].toLowerCase() : value.trim().toLowerCase();
  }

  /**
   * Satu mailbox IMAP (postmail@triplaar.co). Semua email yang masuk ke situ
   * kita ambil, lalu tampilkan di temp mail sesuai alamat tujuan (To) = username@domain.
   * Domain cuma buat forwarding (e.g. *@topad119.com → postmail@triplaar.co).
   */
  async processEmail(rawEmail, attributes) {
    try {
      const parsed = await simpleParser(rawEmail);
      const headers = parsed.headers || new Map();

      // Ambil alamat tujuan dari berbagai header (To bisa jadi postmail@triplaar.co setelah forward)
      const candidates = [];
      const headerNames = ['x-original-to', 'x-forwarded-to', 'envelope-to', 'to', 'delivered-to'];
      for (const name of headerNames) {
        const raw = headers.get(name);
        if (!raw) continue;
        const val = typeof raw === 'string' ? raw : (raw.value ? raw.value.map(v => v.address || v).join(',') : '');
        val.split(',').forEach(part => {
          const addr = this.parseAddressFromHeader(part);
          if (addr && addr.includes('@') && !candidates.includes(addr)) candidates.push(addr);
        });
      }
      if (parsed.to && parsed.to.value && parsed.to.value.length > 0) {
        parsed.to.value.forEach(v => {
          const addr = (v.address || v).toString().toLowerCase();
          if (addr && !candidates.includes(addr)) candidates.push(addr);
        });
      }

      // Pakai alamat yang domain-nya kita kelola (temp mail domain), kalau ada
      const managedDomains = db.prepare('SELECT domain FROM domains WHERE is_active = 1').all().map(r => r.domain);
      const toAddress = candidates.find(addr => {
        const d = addr.split('@')[1];
        return d && managedDomains.includes(d);
      }) || candidates[0];

      if (!toAddress) {
        console.log('⚠️ No recipient address found, skipping');
        return;
      }

      const [username, domain] = toAddress.split('@');
      if (!username || !domain) return;

      const managedDomain = db.prepare(
        'SELECT id FROM domains WHERE domain = ? AND is_active = 1'
      ).get(domain);
      if (!managedDomain) {
        console.log(`⚠️ Domain ${domain} not managed, skipping`);
        return;
      }

      const inbox = db.prepare(`
        SELECT id, session_id FROM inboxes 
        WHERE username = ? AND domain = ? AND expires_at > datetime('now')
      `).get(username, domain);
      if (!inbox) {
        console.log(`⚠️ No active inbox for ${username}@${domain}, skipping`);
        return;
      }
      
      // Get from address
      let fromAddress = '';
      if (parsed.from && parsed.from.value && parsed.from.value.length > 0) {
        fromAddress = parsed.from.value[0].address;
      }
      
      // Insert email
      const result = db.prepare(`
        INSERT OR IGNORE INTO emails (inbox_id, message_id, from_address, to_address, subject, text_body, html_body)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        inbox.id,
        parsed.messageId || `${Date.now()}-${Math.random()}`,
        fromAddress,
        toAddress,
        parsed.subject || '(No Subject)',
        parsed.text || '',
        parsed.html || ''
      );
      
      if (result.changes > 0) {
        const emailId = result.lastInsertRowid;
        
        // Save attachments
        if (parsed.attachments && parsed.attachments.length > 0) {
          const attachmentStmt = db.prepare(`
            INSERT INTO attachments (email_id, filename, content_type, size, content)
            VALUES (?, ?, ?, ?, ?)
          `);
          
          for (const attachment of parsed.attachments) {
            attachmentStmt.run(
              emailId,
              attachment.filename || 'unnamed',
              attachment.contentType || 'application/octet-stream',
              attachment.size || 0,
              attachment.content
            );
          }
        }
        
        // Emit event for realtime update
        const newEmail = db.prepare(`
          SELECT e.*, 
            (SELECT COUNT(*) FROM attachments WHERE email_id = e.id) as attachment_count
          FROM emails e WHERE e.id = ?
        `).get(emailId);
        
        console.log(`📧 New email received for ${toAddress}`);
        this.emit('newEmail', { sessionId: inbox.session_id, email: newEmail });
      }
    } catch (error) {
      console.error('❌ Error processing email:', error.message);
    }
  }

  async disconnect() {
    this.stopPolling();
    if (this.connection) {
      try {
        await this.connection.end();
      } catch (e) {}
    }
    this.isConnected = false;
  }
}

module.exports = new ImapService();
