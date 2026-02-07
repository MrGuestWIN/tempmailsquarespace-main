const cron = require('node-cron');
const db = require('./database');

function startCleanupJob() {
  // Run every minute
  cron.schedule('* * * * *', () => {
    try {
      // Delete expired inboxes (cascade deletes emails and attachments)
      const result = db.prepare(`
        DELETE FROM inboxes WHERE expires_at <= datetime('now')
      `).run();
      
      if (result.changes > 0) {
        console.log(`🧹 Cleaned up ${result.changes} expired inbox(es)`);
      }
      
      // Also clean up orphaned emails (shouldn't happen but just in case)
      db.prepare(`
        DELETE FROM emails WHERE inbox_id NOT IN (SELECT id FROM inboxes)
      `).run();
      
      // Vacuum to reclaim space periodically (every hour at minute 0)
      const now = new Date();
      if (now.getMinutes() === 0) {
        db.exec('VACUUM');
        console.log('🧹 Database vacuumed');
      }
    } catch (error) {
      console.error('❌ Cleanup error:', error.message);
    }
  });
  
  console.log('🕐 Cleanup cron job started (runs every minute)');
}

module.exports = { startCleanupJob };
