const sequelize = require("sequelize")

const db = new sequelize.Sequelize('reseau','root','',{dialect : 'mysql', host :'localhost'})

module.exports = db