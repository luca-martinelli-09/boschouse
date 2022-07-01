const config = require('../config');
const mysql = require('mysql');

const createDBConnection = () => {
  db = mysql.createConnection(config.database);
  db.connect();
  return db;
};

const addLog = (log) => {
  dbConnection = createDBConnection();
  dbConnection.query(`insert into Activities (Log) values (?)`, [log], () => {
    dbConnection.end();
  });
}

module.exports = { createDBConnection, addLog };