const config = require('../config');
const mysql = require('mysql');

const createDBConnection = () => {
  db = mysql.createConnection(config.database);
  db.connect();
  return db;
};

module.exports = { createDBConnection };