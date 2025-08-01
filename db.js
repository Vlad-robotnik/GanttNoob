const { Sequelize } = require('sequelize');
const config = require('config');

const sequelize = new Sequelize(
  config.get('db.database'),
  config.get('db.username'),
  config.get('db.password'),
  {
    port: config.get('db.port'),
    host: config.get('db.host'),
    dialect: 'postgres',
    logging: false,
  }
);

module.exports = sequelize;
