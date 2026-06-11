const fs = require('fs');
const path = require('path');
const db = require('../config/database');

let dbReady = false;
let dbError = null;
let dbPromise = null;

async function initDatabase() {
  if (dbPromise) return dbPromise;

  if (!process.env.DATABASE_URL) {
    console.error('[startup] DATABASE_URL nao configurada. Verifique as env vars no Vercel.');
    dbError = new Error('DATABASE_URL nao configurada');
    return;
  }

  dbPromise = (async () => {
    try {
      const dbPath = path.join(__dirname, '..', '..', 'database');

      const { rows } = await db.query(
        `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'usuarios') AS tem_tabela`
      );
      const tabelaExiste = rows[0].tem_tabela;

      if (!tabelaExiste) {
        console.error('[startup] Banco vazio. Executando schema.sql...');
        const schemaSql = fs.readFileSync(path.join(dbPath, 'schema.sql'), 'utf8');
        await db.query(schemaSql);
        console.error('[startup] Schema criado com sucesso.');
      }

      if (fs.existsSync(dbPath)) {
        const files = fs.readdirSync(dbPath)
          .filter(f => f.startsWith('migration_') && f.endsWith('.sql'))
          .sort();

        for (const file of files) {
          console.error(`[startup] Executando migracao: ${file}...`);
          const sql = fs.readFileSync(path.join(dbPath, file), 'utf8');
          await db.query(sql);
          console.error(`[startup] Migracao ${file} concluida.`);
        }
      }

      const { rows: userRows } = await db.query('SELECT COUNT(*) AS total FROM usuarios');
      const totalUsuarios = parseInt(userRows[0].total, 10);

      // Verifica se os admins padrao ja existem
      const { rows: adminRows } = await db.query(
        "SELECT COUNT(*) AS total FROM usuarios WHERE email LIKE '%@unicaronas.divas.com' AND is_admin = true"
      );
      const totalAdmins = parseInt(adminRows[0].total, 10);
      const precisaSeed = totalUsuarios === 0 || totalAdmins < 4;

      if (precisaSeed) {
        if (totalUsuarios > 0) {
          console.error(`[startup] Banco com ${totalUsuarios} usuario(s) mas apenas ${totalAdmins} admin(s). Resetando dados...`);
        } else {
          console.error('[startup] Nenhum usuario encontrado. Populando dados iniciais...');
        }

        const seedPath = path.join(dbPath, 'setup_sprint5.sql');
        if (fs.existsSync(seedPath)) {
          const seedSql = fs.readFileSync(seedPath, 'utf8');
          await db.query(seedSql);
          console.error('[startup] Dados iniciais inseridos (incluindo 4 administradores).');
        }
      } else {
        console.error(`[startup] Banco possui ${totalUsuarios} usuario(s) e ${totalAdmins} admin(s). Seed ignorado.`);
      }

      dbReady = true;
      console.error('[startup] Banco de dados pronto.');
    } catch (err) {
      dbError = err;
      console.error('[startup] Erro na inicializacao do banco:', err.message);
      console.error('[startup] Detalhes:', err.stack || err);
    }
  })();

  return dbPromise;
}

function waitForDb() {
  return (req, res, next) => {
    if (dbReady) return next();

    if (dbError) {
      // Tenta reinicializar na proxima requisicao
      const err = dbError;
      dbError = null;
      dbPromise = null;
      return res.status(503).json({
        success: false,
        error: 'Banco de dados temporariamente indisponivel. Tente novamente.',
        detail: process.env.NODE_ENV !== 'production' ? err.message : undefined
      });
    }

    dbPromise.then(() => {
      if (dbReady) return next();
      next();
    }).catch(() => next());
  };
}

module.exports = { initDatabase, waitForDb };
