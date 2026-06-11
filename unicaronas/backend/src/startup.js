const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

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

poolConfig.max = 1;
poolConfig.connectionTimeoutMillis = 10000;

let dbReady = false;
let dbError = null;
let dbPromise = null;

async function initDatabase() {
  if (dbPromise) return dbPromise;

  dbPromise = (async () => {
    const pool = new Pool(poolConfig);

    try {
      const dbPath = path.join(__dirname, '..', '..', 'database');

      const { rows } = await pool.query(
        `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'usuarios') AS tem_tabela`
      );
      const tabelaExiste = rows[0].tem_tabela;

      if (!tabelaExiste) {
        console.error('[startup] Banco vazio. Executando schema.sql...');
        const schemaSql = fs.readFileSync(path.join(dbPath, 'schema.sql'), 'utf8');
        await pool.query(schemaSql);
        console.error('[startup] Schema criado com sucesso.');
      }

      if (fs.existsSync(dbPath)) {
        const files = fs.readdirSync(dbPath)
          .filter(f => f.startsWith('migration_') && f.endsWith('.sql'))
          .sort();

        for (const file of files) {
          console.error(`[startup] Executando migração: ${file}...`);
          const sql = fs.readFileSync(path.join(dbPath, file), 'utf8');
          await pool.query(sql);
          console.error(`[startup] Migração ${file} concluída.`);
        }
      }

      const { rows: userRows } = await pool.query('SELECT COUNT(*) AS total FROM usuarios');
      const totalUsuarios = parseInt(userRows[0].total, 10);

      if (totalUsuarios === 0) {
        console.error('[startup] Nenhum usuário encontrado. Populando dados iniciais...');
        const seedPath = path.join(dbPath, 'setup_sprint5.sql');
        if (fs.existsSync(seedPath)) {
          const seedSql = fs.readFileSync(seedPath, 'utf8');
          await pool.query(seedSql);
          console.error('[startup] Dados iniciais inseridos com sucesso (incluindo administradores).');
        }
      } else {
        console.error(`[startup] Banco já possui ${totalUsuarios} usuário(s). Seed ignorado.`);
      }

      dbReady = true;
      console.error('[startup] Banco de dados pronto.');
    } catch (err) {
      dbError = err;
      console.error('[startup] Erro na inicialização do banco:', err.message);
    } finally {
      await pool.end();
    }
  })();

  return dbPromise;
}

function waitForDb() {
  return (req, res, next) => {
    if (dbReady) return next();
    if (dbError) {
      return res.status(500).json({ success: false, error: 'Erro na inicialização do banco de dados.' });
    }
    dbPromise.then(() => next()).catch(() => next());
  };
}

module.exports = { initDatabase, waitForDb };
