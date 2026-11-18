require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  // Azure Database for PostgreSQL exige TLS: en Azure define DB_SSL=true
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : false,
});

pool.on('error', (err) => {
  // Solo registramos el error; el pool abre otra conexión cuando hace falta
  console.error('Error inesperado en el pool de PostgreSQL', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
