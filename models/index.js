'use strict';

/**
 * @typedef {import('sequelize').ModelStatic<any>} ModelStatic
 */

/**
 * @typedef {Object} DB
 * @property {import('sequelize').Sequelize} sequelize
 * @property {typeof import('sequelize')} Sequelize
 * @property {ModelStatic} Course
 * @property {ModelStatic} Category
 * @property {ModelStatic} User
 * @property {ModelStatic} Article
 * @property {ModelStatic} Chapter
 * @property {ModelStatic} Like
 * @property {ModelStatic} Setting
 */

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
require('../config/env');
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];
/** @type {Partial<DB>} */
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  /** @type {import('sequelize').Sequelize} */
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

/** @type {DB} */
module.exports = db;
