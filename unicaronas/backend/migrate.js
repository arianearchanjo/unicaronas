const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    }
  : {
      host:     process.env.DB_HOST     || 'localhost',
      port:     parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME     || 'unicaronas',
      user:     process.env.DB_USER     || 'postgres',
      password: process.env.DB_PASSWORD || '',
    };

const pool = new Pool(poolConfig);

async function runMigrations() {
  console.log('🚀 Iniciando automação de banco de dados...');
  
  try {
    const dbPath = path.join(__dirname, '..', 'database');

    // 1. Verificar se o banco já possui tabelas
    const { rows } = await pool.query(
      `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'usuarios') AS tem_tabela`
    );
    const tabelaExiste = rows[0].tem_tabela;

    if (!tabelaExiste) {
      // 2. Banco vazio: executar schema.sql completo
      console.log('⏳ Banco vazio. Executando schema.sql...');
      const schemaSql = fs.readFileSync(path.join(dbPath, 'schema.sql'), 'utf8');
      await pool.query(schemaSql);
      console.log('✅ Schema criado com sucesso.');
    } else {
      console.log('⏳ Banco já possui tabelas. Verificando colunas básicas...');
      await pool.query(`
        ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS perfil_tipo VARCHAR(20) NOT NULL DEFAULT 'misto' CHECK (perfil_tipo IN ('estudante','motorista','misto'));
        ALTER TABLE caronas ADD COLUMN IF NOT EXISTS justificativa_cancelamento TEXT;
      `);
      console.log('✅ Colunas básicas verificadas.');
    }

    // 3. Executar arquivos de migração (migration_*.sql)
    if (fs.existsSync(dbPath)) {
      const files = fs.readdirSync(dbPath).filter(f => f.startsWith('migration_') && f.endsWith('.sql'));
      
      for (const file of files) {
        console.log(`⏳ Executando migração: ${file}...`);
        const sql = fs.readFileSync(path.join(dbPath, file), 'utf8');
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
