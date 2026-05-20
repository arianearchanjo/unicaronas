const logger = require('../utils/logger');
const pool = require('../../config/database');
const { criarNotificacao } = require('../utils/notificacoes');

/**
 * Job para processar a lista de espera.
 * Deve ser chamado via setInterval no server.js.
 */
async function processarListaEspera() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Marcar como 'expirado' quem foi notificado há mais de 30 minutos e não agiu
    await client.query(`
      UPDATE lista_espera 
      SET status = 'expirado' 
      WHERE status = 'notificado' 
        AND criado_em < NOW() - INTERVAL '30 minutes'
    `);

    // 2. Buscar caronas que têm vagas disponíveis e têm gente na fila 'aguardando'
    // Usamos FOR UPDATE para bloquear as linhas das caronas e evitar que outros processos vejam a mesma disponibilidade
    const query = `
      SELECT id, vagas_disponiveis
      FROM caronas c
      WHERE status = 'ativa' 
        AND vagas_disponiveis > 0 
        AND EXISTS (
          SELECT 1 FROM lista_espera l 
          WHERE l.carona_id = c.id AND l.status = 'aguardando'
        )
      FOR UPDATE
    `;
    const { rows: caronasComVaga } = await client.query(query);

    for (const carona of caronasComVaga) {
      // Notificar o próximo da fila para cada vaga disponível
      // Bloqueamos os registros da lista_espera com FOR UPDATE SKIP LOCKED para alta concorrência
      const nextQuery = `
        SELECT id, passageiro_id 
        FROM lista_espera 
        WHERE carona_id = $1 AND status = 'aguardando'
        ORDER BY id ASC
        LIMIT $2
        FOR UPDATE SKIP LOCKED
      `;
      const { rows: proximos } = await client.query(nextQuery, [carona.id, carona.vagas_disponiveis]);

      for (const p of proximos) {
        await client.query("UPDATE lista_espera SET status = 'notificado', criado_em = NOW() WHERE id = $1", [p.id]);
        await criarNotificacao(
          p.passageiro_id,
          'Uma vaga foi liberada na carona que você está esperando! Você tem 30 minutos para solicitar.',
          `/carona.html?id=${carona.id}`
        );
      }
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Erro no job da lista de espera:', err);
  } finally {
    client.release();
  }
}

module.exports = { processarListaEspera };
