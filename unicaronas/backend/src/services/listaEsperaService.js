const logger = require('../utils/logger');
const pool = require('../../config/database');
const { criarNotificacao } = require('../utils/notificacoes');

/**
 * Job para processar a lista de espera.
 * Deve ser chamado via setInterval no server.js.
 */
async function processarListaEspera() {
  try {
    // 1. Marcar como 'expirado' quem foi notificado há mais de 30 minutos e não agiu
    await pool.query(`
      UPDATE lista_espera 
      SET status = 'expirado' 
      WHERE status = 'notificado' 
        AND criado_em < NOW() - INTERVAL '30 minutes'
    `);

    // 2. Buscar caronas que têm vagas disponíveis e têm gente na fila 'aguardando'
    const query = `
      SELECT DISTINCT c.id, c.vagas_disponiveis
      FROM caronas c
      JOIN lista_espera l ON l.carona_id = c.id
      WHERE c.status = 'ativa' 
        AND c.vagas_disponiveis > 0 
        AND l.status = 'aguardando'
    `;
    const { rows: caronasComVaga } = await pool.query(query);

    for (const carona of caronasComVaga) {
      // Notificar o próximo da fila para cada vaga disponível
      const nextQuery = `
        SELECT id, passageiro_id 
        FROM lista_espera 
        WHERE carona_id = $1 AND status = 'aguardando'
        ORDER BY id ASC
        LIMIT $2
      `;
      const { rows: proximos } = await pool.query(nextQuery, [carona.id, carona.vagas_disponiveis]);

      for (const p of proximos) {
        await pool.query("UPDATE lista_espera SET status = 'notificado', criado_em = NOW() WHERE id = $1", [p.id]);
        await criarNotificacao(
          p.passageiro_id,
          'Uma vaga foi liberada na carona que você está esperando! Você tem 30 minutos para solicitar.',
          `/carona.html?id=${carona.id}`
        );
      }
    }
  } catch (err) {
    logger.error('Erro no job da lista de espera:', err);
  }
}

module.exports = { processarListaEspera };
