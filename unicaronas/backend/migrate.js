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

async function runMigrations() {
  console.log('🚀 Iniciando automação de banco de dados...');
  
  try {
    // 1. Garantir que as colunas básicas de perfil e cancelamento existam (de migrate_fix.js)
    console.log('⏳ Verificando colunas básicas...');
    await pool.query(`
      ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS perfil_tipo VARCHAR(20) NOT NULL DEFAULT 'misto' CHECK (perfil_tipo IN ('estudante','motorista','misto'));
      ALTER TABLE caronas ADD COLUMN IF NOT EXISTS justificativa_cancelamento TEXT;
    `);
    console.log('✅ Colunas básicas verificadas.');

    // 2. Procurar e rodar arquivos SQL de migração na pasta ../database
    const dbPath = path.join(__dirname, '..', 'database');
    if (fs.existsSync(dbPath)) {
      const files = fs.readdirSync(dbPath).filter(f => f.startsWith('migration_') && f.endsWith('.sql'));
      
      for (const file of files) {
        console.log(`⏳ Executando migração: ${file}...`);
        const sql = fs.readFileSync(path.join(dbPath, file), 'utf8');
        // Executa o SQL. O pg não suporta múltiplos comandos em uma única query com parâmetros, 
        // mas como são scripts simples de schema, deve funcionar.
        await pool.query(sql);
        console.log(`✅ Migração ${file} concluída.`);
      }
    } else {
      console.warn('⚠️ Pasta database não encontrada para migrações adicionais.');
    }

    console.log('🎉 Tudo pronto! O banco de dados está atualizado.');
  } catch (err) {
    console.error('❌ ERRO NA MIGRAÇÃO:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
