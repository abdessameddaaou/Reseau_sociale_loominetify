const db = require('./db/db');
db.query('ALTER TABLE `Conversations` ADD COLUMN `avatar` VARCHAR(255) NULL')
    .then(() => { console.log('Column added'); process.exit(0); })
    .catch(e => { console.error('Error adding column:', e.message); process.exit(0); }); // Ignore if it exists
