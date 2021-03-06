const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const config = require('../database.js');

const db = {};

// create sequelize instance:
let sequelize;

if (process.env.NODE_ENV == 'production') {
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        dialectOptions: {
            ssl: process.env.NODE_ENV == 'production',
            useUTC: true,
        },
        timezone: 'UTC'
    });
} else {
    sequelize = new Sequelize(config)
}

fs.readdirSync(__dirname)
    .filter(
        file =>
            file.indexOf('.') !== 0 &&
            file !== path.basename(__filename) &&
            file.slice(-3) === '.js'
    )
    .forEach(file => {
        const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes)
        db[model.name] = model;
    });

Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;