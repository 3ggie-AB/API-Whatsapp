const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Token = sequelize.define('Token', {
    token: {
        type: DataTypes.STRING,
        allowNull: false
    },
    userId: {
        type: DataTypes.INTEGER,
        references: {
            model: 'Users',
            key: 'id'
        }
    }
});

module.exports = Token;
