// database stuff
const { Pool } = require("pg");
const pool = new Pool({
  user: "esmbot",
  host: "localhost",
  database: "esmbot",
  port: 5432
});
module.exports = pool;