const { Pool } = require("pg");

const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "stm",
    password: "dev__007",
    port: 5432
});

module.exports = pool;