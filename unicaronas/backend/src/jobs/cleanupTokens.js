const cron = require('node-cron');
const pool = require('../../config/database');

// Executa diariamente às 03:00 da manhã
cron.schedule('0 3 * * *', async () => {
  try {
    const result = await pool.query(
      'DELETE FROM verification_tokens WHERE expires_at < NOW()'
    );
    console.info(`[CRON] Tokens expirados removidos: ${result.rowCount}`);
  } catch (err) {
    console.error('[CRON] Erro ao limpar tokens expirados:', err.message);
  }
}, {
  timezone: 'America/Sao_Paulo'
});
