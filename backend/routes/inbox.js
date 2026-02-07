const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../database');

// Get all active domains
router.get('/domains', (req, res) => {
  try {
    const domains = db.prepare(
      'SELECT domain FROM domains WHERE is_active = 1 ORDER BY domain'
    ).all();
    res.json(domains.map(d => d.domain));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new inbox
router.post('/create', (req, res) => {
  try {
    const { username, domain } = req.body;
    
    if (!username || !domain) {
      return res.status(400).json({ error: 'Username and domain are required' });
    }
    
    // Validate username format
    const usernameRegex = /^[a-z0-9][a-z0-9._-]{1,28}[a-z0-9]$/;
    if (!usernameRegex.test(username.toLowerCase())) {
      return res.status(400).json({ 
        error: 'Username must be 3-30 characters, alphanumeric with dots, underscores, or hyphens in the middle' 
      });
    }
    
    // Check if domain exists
    const domainExists = db.prepare(
      'SELECT id FROM domains WHERE domain = ? AND is_active = 1'
    ).get(domain);
    
    if (!domainExists) {
      return res.status(400).json({ error: 'Invalid domain' });
    }
    
    // Check if username is already taken for this domain
    const existingInbox = db.prepare(`
      SELECT id FROM inboxes 
      WHERE username = ? AND domain = ? AND expires_at > datetime('now')
    `).get(username.toLowerCase(), domain);
    
    if (existingInbox) {
      return res.status(400).json({ error: 'Username already taken' });
    }
    
    const sessionId = uuidv4();
    const expiryMinutes = parseInt(process.env.INBOX_EXPIRY_MINUTES) || 20;
    
    db.prepare(`
      INSERT INTO inboxes (session_id, username, domain, expires_at)
      VALUES (?, ?, ?, datetime('now', '+${expiryMinutes} minutes'))
    `).run(sessionId, username.toLowerCase(), domain);
    
    const inbox = db.prepare(`
      SELECT session_id, username, domain, expires_at FROM inboxes WHERE session_id = ?
    `).get(sessionId);
    
    res.json({
      sessionId: inbox.session_id,
      email: `${inbox.username}@${inbox.domain}`,
      expiresAt: inbox.expires_at
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate random inbox
router.post('/random', (req, res) => {
  try {
    const { domain } = req.body;
    
    let selectedDomain = domain;
    
    // If domain is provided, validate it exists and is active
    if (selectedDomain) {
      const domainExists = db.prepare(
        'SELECT domain FROM domains WHERE domain = ? AND is_active = 1'
      ).get(selectedDomain);
      
      if (!domainExists) {
        return res.status(400).json({ error: `Domain "${selectedDomain}" is not available` });
      }
    } else {
      // Get first active domain if not specified
      const firstDomain = db.prepare(
        'SELECT domain FROM domains WHERE is_active = 1 LIMIT 1'
      ).get();
      if (!firstDomain) {
        return res.status(400).json({ error: 'No active domains available' });
      }
      selectedDomain = firstDomain.domain;
    }
    
    // Generate random username
    const adjectives = ['cool', 'fast', 'super', 'mega', 'ultra', 'hyper', 'turbo', 'ninja', 'cyber', 'pixel'];
    const nouns = ['mail', 'box', 'user', 'temp', 'quick', 'flash', 'swift', 'dash', 'bolt', 'spark'];
    const randomNum = Math.floor(Math.random() * 9999);
    const username = `${adjectives[Math.floor(Math.random() * adjectives.length)]}${nouns[Math.floor(Math.random() * nouns.length)]}${randomNum}`;
    
    const sessionId = uuidv4();
    const expiryMinutes = parseInt(process.env.INBOX_EXPIRY_MINUTES) || 20;
    
    db.prepare(`
      INSERT INTO inboxes (session_id, username, domain, expires_at)
      VALUES (?, ?, ?, datetime('now', '+${expiryMinutes} minutes'))
    `).run(sessionId, username, selectedDomain);
    
    const inbox = db.prepare(`
      SELECT session_id, username, domain, expires_at FROM inboxes WHERE session_id = ?
    `).get(sessionId);
    
    res.json({
      sessionId: inbox.session_id,
      email: `${inbox.username}@${inbox.domain}`,
      expiresAt: inbox.expires_at
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get inbox info
router.get('/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const inbox = db.prepare(`
      SELECT session_id, username, domain, expires_at FROM inboxes 
      WHERE session_id = ? AND expires_at > datetime('now')
    `).get(sessionId);
    
    if (!inbox) {
      return res.status(404).json({ error: 'Inbox not found or expired' });
    }
    
    res.json({
      sessionId: inbox.session_id,
      email: `${inbox.username}@${inbox.domain}`,
      expiresAt: inbox.expires_at
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get emails for inbox
router.get('/:sessionId/emails', (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const inbox = db.prepare(`
      SELECT id FROM inboxes WHERE session_id = ? AND expires_at > datetime('now')
    `).get(sessionId);
    
    if (!inbox) {
      return res.status(404).json({ error: 'Inbox not found or expired' });
    }
    
    const emails = db.prepare(`
      SELECT e.id, e.from_address, e.to_address, e.subject, e.received_at, e.is_read,
        (SELECT COUNT(*) FROM attachments WHERE email_id = e.id) as attachment_count
      FROM emails e
      WHERE e.inbox_id = ?
      ORDER BY e.received_at DESC
    `).all(inbox.id);
    
    res.json(emails);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single email
router.get('/:sessionId/emails/:emailId', (req, res) => {
  try {
    const { sessionId, emailId } = req.params;
    
    const inbox = db.prepare(`
      SELECT id FROM inboxes WHERE session_id = ? AND expires_at > datetime('now')
    `).get(sessionId);
    
    if (!inbox) {
      return res.status(404).json({ error: 'Inbox not found or expired' });
    }
    
    const email = db.prepare(`
      SELECT * FROM emails WHERE id = ? AND inbox_id = ?
    `).get(emailId, inbox.id);
    
    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }
    
    // Mark as read
    db.prepare('UPDATE emails SET is_read = 1 WHERE id = ?').run(emailId);
    
    // Get attachments
    const attachments = db.prepare(`
      SELECT id, filename, content_type, size FROM attachments WHERE email_id = ?
    `).all(emailId);
    
    res.json({ ...email, attachments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete email
router.delete('/:sessionId/emails/:emailId', (req, res) => {
  try {
    const { sessionId, emailId } = req.params;
    
    const inbox = db.prepare(`
      SELECT id FROM inboxes WHERE session_id = ? AND expires_at > datetime('now')
    `).get(sessionId);
    
    if (!inbox) {
      return res.status(404).json({ error: 'Inbox not found or expired' });
    }
    
    const result = db.prepare(`
      DELETE FROM emails WHERE id = ? AND inbox_id = ?
    `).run(emailId, inbox.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Email not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Download attachment
router.get('/:sessionId/attachments/:attachmentId', (req, res) => {
  try {
    const { sessionId, attachmentId } = req.params;
    
    const inbox = db.prepare(`
      SELECT id FROM inboxes WHERE session_id = ? AND expires_at > datetime('now')
    `).get(sessionId);
    
    if (!inbox) {
      return res.status(404).json({ error: 'Inbox not found or expired' });
    }
    
    const attachment = db.prepare(`
      SELECT a.* FROM attachments a
      JOIN emails e ON a.email_id = e.id
      WHERE a.id = ? AND e.inbox_id = ?
    `).get(attachmentId, inbox.id);
    
    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }
    
    res.setHeader('Content-Type', attachment.content_type);
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.filename}"`);
    res.send(attachment.content);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Extend inbox expiry
router.post('/:sessionId/extend', (req, res) => {
  try {
    const { sessionId } = req.params;
    const expiryMinutes = parseInt(process.env.INBOX_EXPIRY_MINUTES) || 20;
    
    const result = db.prepare(`
      UPDATE inboxes SET expires_at = datetime('now', '+${expiryMinutes} minutes')
      WHERE session_id = ? AND expires_at > datetime('now')
    `).run(sessionId);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Inbox not found or expired' });
    }
    
    const inbox = db.prepare(`
      SELECT session_id, username, domain, expires_at FROM inboxes WHERE session_id = ?
    `).get(sessionId);
    
    res.json({
      sessionId: inbox.session_id,
      email: `${inbox.username}@${inbox.domain}`,
      expiresAt: inbox.expires_at
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
