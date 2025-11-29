const { Sequelize } = require('sequelize');
const config = require('../config.js');

/**
 * Config de la base
 */
const sequelize = new Sequelize( config.db.name, config.db.user, config.db.pass,
  { host: config.db.host,
    port: config.db.port,
    dialect: config.db.dialect,
  }
);

module.exports = sequelize;
