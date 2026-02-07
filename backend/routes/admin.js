const express = require('express');
const router = express.Router();
const db = require('../database');
const imaps = require('imap-simple');

// Simple auth middleware
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
  const [username, password] = credentials.split(':');
  
  const adminUser = process.env.ADMIN_USERNAME || 'admin';
  const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
  
  if (username !== adminUser || password !== adminPass) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  next();
};

// Verify admin credentials
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  const adminUser = process.env.ADMIN_USERNAME || 'admin';
  const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
  
  if (username === adminUser && password === adminPass) {
    const token = Buffer.from(`${username}:${password}`).toString('base64');
    res.json({ success: true, token });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// ============ GMAIL ACCOUNTS ============

// Get all Gmail accounts
router.get('/gmail-accounts', authMiddleware, (req, res) => {
  try {
    const accounts = db.prepare(`
      SELECT g.id, g.email, g.imap_host, g.imap_port, g.is_active, g.description, g.created_at,
        (SELECT COUNT(*) FROM domains WHERE gmail_account_id = g.id) as domain_count
      FROM gmail_accounts g
      ORDER BY g.created_at DESC
    `).all();
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new Gmail account
router.post('/gmail-accounts', authMiddleware, (req, res) => {
  try {
    const { email, app_password, imap_host, imap_port, description } = req.body;
    
    if (!email || !app_password) {
      return res.status(400).json({ error: 'Email and App Password are required' });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    db.prepare(`
      INSERT INTO gmail_accounts (email, app_password, imap_host, imap_port, description) 
      VALUES (?, ?, ?, ?, ?)
    `).run(
      email.toLowerCase(),
      app_password,
      imap_host || 'imap.gmail.com',
      imap_port || 993,
      description || ''
    );
    
    const newAccount = db.prepare('SELECT id, email, imap_host, imap_port, is_active, description, created_at FROM gmail_accounts WHERE email = ?').get(email.toLowerCase());
    res.json(newAccount);
  } catch (error) {
    if (error.message.includes('UNIQUE constraint')) {
      return res.status(400).json({ error: 'Gmail account already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Update Gmail account
router.patch('/gmail-accounts/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const { email, app_password, imap_host, imap_port, is_active, description } = req.body;
    
    const updates = [];
    const params = [];
    
    if (email !== undefined) { updates.push('email = ?'); params.push(email.toLowerCase()); }
    if (app_password !== undefined) { updates.push('app_password = ?'); params.push(app_password); }
    if (imap_host !== undefined) { updates.push('imap_host = ?'); params.push(imap_host); }
    if (imap_port !== undefined) { updates.push('imap_port = ?'); params.push(imap_port); }
    if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active ? 1 : 0); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    
    if (updates.length > 0) {
      params.push(id);
      db.prepare(`UPDATE gmail_accounts SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    }
    
    const account = db.prepare('SELECT id, email, imap_host, imap_port, is_active, description, created_at FROM gmail_accounts WHERE id = ?').get(id);
    res.json(account);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Gmail account
router.delete('/gmail-accounts/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if it's the last account
    const count = db.prepare('SELECT COUNT(*) as count FROM gmail_accounts').get();
    if (count.count <= 1) {
      return res.status(400).json({ error: 'Cannot delete the last Gmail account' });
    }
    
    // Remove association from domains
    db.prepare('UPDATE domains SET gmail_account_id = NULL WHERE gmail_account_id = ?').run(id);
    
    db.prepare('DELETE FROM gmail_accounts WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test IMAP connection (cek email + app password)
router.post('/gmail-accounts/:id/test-imap', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const account = db.prepare(
      'SELECT email, app_password, imap_host, imap_port FROM gmail_accounts WHERE id = ?'
    ).get(id);
    if (!account) {
      return res.status(404).json({ success: false, error: 'Account not found' });
    }
    const config = {
      imap: {
        user: account.email,
        password: account.app_password,
        host: account.imap_host || 'imap.gmail.com',
        port: parseInt(account.imap_port) || 993,
        tls: true,
        authTimeout: 15000,
        tlsOptions: { rejectUnauthorized: false }
      }
    };
    const connection = await imaps.connect(config);
    await connection.end();
    res.json({ success: true, message: 'Koneksi IMAP berhasil. Email & App Password benar.' });
  } catch (error) {
    res.json({
      success: false,
      error: error.message || 'Koneksi gagal. Cek email, App Password, dan IMAP host/port.'
    });
  }
});

// ============ DOMAINS ============

// Get all domains
router.get('/domains', authMiddleware, (req, res) => {
  try {
    const domains = db.prepare(`
      SELECT d.*, 
        g.email as gmail_email,
        (SELECT COUNT(*) FROM inboxes WHERE domain = d.domain AND expires_at > datetime('now')) as active_inboxes
      FROM domains d
      LEFT JOIN gmail_accounts g ON d.gmail_account_id = g.id
      ORDER BY d.created_at DESC
    `).all();
    res.json(domains);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new domain
router.post('/domains', authMiddleware, (req, res) => {
  try {
    const { domain, gmail_account_id } = req.body;
    
    if (!domain) {
      return res.status(400).json({ error: 'Domain is required' });
    }
    
    // Validate domain format
    const domainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i;
    if (!domainRegex.test(domain)) {
      return res.status(400).json({ error: 'Invalid domain format' });
    }
    
    db.prepare('INSERT INTO domains (domain, gmail_account_id) VALUES (?, ?)').run(domain.toLowerCase(), gmail_account_id || null);
    
    const newDomain = db.prepare(`
      SELECT d.*, g.email as gmail_email 
      FROM domains d 
      LEFT JOIN gmail_accounts g ON d.gmail_account_id = g.id
      WHERE d.domain = ?
    `).get(domain.toLowerCase());
    res.json(newDomain);
  } catch (error) {
    if (error.message.includes('UNIQUE constraint')) {
      return res.status(400).json({ error: 'Domain already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Update domain (toggle status, assign gmail account)
router.patch('/domains/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const { is_active, gmail_account_id } = req.body;
    
    const updates = [];
    const params = [];
    
    if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active ? 1 : 0); }
    if (gmail_account_id !== undefined) { updates.push('gmail_account_id = ?'); params.push(gmail_account_id || null); }
    
    if (updates.length > 0) {
      params.push(id);
      db.prepare(`UPDATE domains SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    }
    
    const domain = db.prepare(`
      SELECT d.*, g.email as gmail_email 
      FROM domains d 
      LEFT JOIN gmail_accounts g ON d.gmail_account_id = g.id
      WHERE d.id = ?
    `).get(id);
    res.json(domain);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete domain
router.delete('/domains/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if it's the last domain
    const count = db.prepare('SELECT COUNT(*) as count FROM domains').get();
    if (count.count <= 1) {
      return res.status(400).json({ error: 'Cannot delete the last domain' });
    }
    
    db.prepare('DELETE FROM domains WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get statistics
router.get('/stats', authMiddleware, (req, res) => {
  try {
    const stats = {
      totalDomains: db.prepare('SELECT COUNT(*) as count FROM domains').get().count,
      activeDomains: db.prepare('SELECT COUNT(*) as count FROM domains WHERE is_active = 1').get().count,
      activeInboxes: db.prepare(`SELECT COUNT(*) as count FROM inboxes WHERE expires_at > datetime('now')`).get().count,
      totalEmails: db.prepare('SELECT COUNT(*) as count FROM emails').get().count,
      emailsToday: db.prepare(`
        SELECT COUNT(*) as count FROM emails 
        WHERE received_at > datetime('now', '-1 day')
      `).get().count
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all active inboxes
router.get('/inboxes', authMiddleware, (req, res) => {
  try {
    const inboxes = db.prepare(`
      SELECT i.*, 
        (SELECT COUNT(*) FROM emails WHERE inbox_id = i.id) as email_count
      FROM inboxes i
      WHERE i.expires_at > datetime('now')
      ORDER BY i.created_at DESC
    `).all();
    res.json(inboxes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete inbox manually
router.delete('/inboxes/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM inboxes WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
