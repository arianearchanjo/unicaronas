const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME     || 'unicaronas',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

async function resetDb() {
  try {
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    const setupPath = path.join(__dirname, '..', 'database', 'setup_sprint5.sql');
    
    console.log('⏳ Recriando tabelas (schema.sql)...');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(schemaSql);
    
    console.log('⏳ Inserindo dados de teste (setup_sprint5.sql)...');
    const setupSql = fs.readFileSync(setupPath, 'utf8');
    await pool.query(setupSql);
    
    console.log('✅ Banco de dados resetado com sucesso!');
  } catch (err) {
    console.error('❌ Erro no reset:', err.message);
  } finally {
    await pool.end();
  }
}

resetDb();
