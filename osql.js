const mysql = require('mysql');

var osql = {
  _conn: false,
  connect: function () {
    this._conn = mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_DATABASE
    });
  },
  query: function (sql, parms, timeout) {
    var self = this;
    return new Promise ((resolve, reject) => {
      self._conn.query({
        sql: sql,
        values: parms || [],
        timeout: timeout || 4000
      }, (error, r, f) => {
        if (error) {
          reject(error);
        }
        resolve({ results: r, fields: f });
      });
    });
  },
  end: function () {
    this._conn.end();
  }
};

module.exports = osql;
