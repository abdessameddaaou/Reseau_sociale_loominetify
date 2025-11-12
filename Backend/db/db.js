const { Sequelize } = require('sequelize');
const config = require('../config.js');

const sequelize = new Sequelize(
  config.db.name,
  config.db.user,
  config.db.pass,
  {
    host: config.db.host,
    port: config.db.port,
    dialect: config.db.dialect,
    logging: config.db.logging, // false par défaut
    dialectOptions: {
      // example: timezone / ssl si besoin
      // timezone: 'Z',
    },
    define: {
      // options globales (timestamps, underscored, etc.)
      // timestamps: true,
    },
  }
);

// petit helper pour tester la co
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log(`[DB] Connected → ${config.db.user}@${config.db.host}:${config.db.port}/${config.db.name}`);
  } catch (err) {
    console.error('[DB] Connection error:', err.message);
  }
}
testConnection();

module.exports = sequelize;
