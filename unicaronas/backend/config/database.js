// backend/config/database.js
const logger = require('../src/utils/logger');
const { Pool } = require('pg'); // importa "pool" da biblioteca 'pg' do postgre

/*
pool é um gerenciador de conexões, em vez de abrir uma nova conexão a cada requisição
ele mantem um conjunto de conexões já abertas pra uso
*/

// cria uma instancia do pool e configura com as variaveis definidas em .env
const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT) || 5432, // (|| 'valor') -> é um fallback
  database: process.env.DB_NAME     || 'unicaronas',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max:      10,       // máximo de conexões no pool
  idleTimeoutMillis: 30000, // fecha o pool após 30 segundos sem usar
  connectionTimeoutMillis: 2000, // retorna erro após 2 segundos
});

pool.on('error', (err) => {
  logger.error('Erro inesperado no pool do PostgreSQL:', err); // tratamento de erros
});

// Testar conexão ao iniciar - executado somente uma vez
pool.connect((err, client, release) => {
  if (err) {
    logger.error('❌ Erro ao conectar ao PostgreSQL:', err.message);
  } else {
    logger.log('✅ Conectado ao PostgreSQL');
    release();
  }
});

module.exports = pool;



// fallback -> se a variavel não existir, usa um valor padrão


// teste