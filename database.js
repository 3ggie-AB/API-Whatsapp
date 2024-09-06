const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DB_URL, {
    dialect: 'mysql',
    logging: false
});

module.exports = sequelize;
