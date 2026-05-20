const logger = require('../utils/logger');
const pool = require('../../config/database');
const notificacoesService = require('../services/notificacoesService');

/**
 * Busca caronas que partem em aproximadamente 30 minutos e notifica os envolvidos.
 */
async function processarLembretesViagem() {
  try {
    // Buscar caronas ativas que partem entre 29 e 31 minutos a partir de agora
    const queryCaronas = `
      SELECT id, motorista_id, origem, destino, horario_partida
      FROM caronas
      WHERE status = 'ativa'
        AND horario_partida BETWEEN NOW() + INTERVAL '29 minutes' AND NOW() + INTERVAL '31 minutes'
    `;
    const { rows: caronas } = await pool.query(queryCaronas);

    for (const carona of caronas) {
      // 1. Notificar Motorista
      await notificarSeNecessario({
        usuario_id: carona.motorista_id,
        carona_id: carona.id,
        conteudo: `Lembrete: Sua carona para ${carona.destino} parte em cerca de 30 minutos!`,
        tipo: 'lembrete'
      });

      // 2. Notificar Passageiros Aceitos
      const queryPassageiros = `
        SELECT passageiro_id
        FROM solicitacoes_carona
        WHERE carona_id = $1 AND status = 'aceita'
      `;
      const { rows: passageiros } = await pool.query(queryPassageiros, [carona.id]);

      for (const passageiro of passageiros) {
        await notificarSeNecessario({
          usuario_id: passageiro.passageiro_id,
          carona_id: carona.id,
          conteudo: `Lembrete: Sua carona para ${carona.destino} parte em cerca de 30 minutos!`,
          tipo: 'lembrete'
        });
      }
    }
  } catch (err) {
    logger.error('Erro no job de lembretes:', err);
  }
}

/**
 * Verifica se já existe uma notificação de lembrete para este usuário/carona para evitar duplicatas.
 */
async function notificarSeNecessario({ usuario_id, carona_id, conteudo, tipo }) {
  try {
    const queryCheck = `
      SELECT id FROM notificacoes
      WHERE usuario_id = $1
        AND carona_id = $2
        AND tipo = $3
      LIMIT 1
    `;
    const { rows } = await pool.query(queryCheck, [usuario_id, carona_id, tipo]);

    if (rows.length === 0) {
      await notificacoesService.criarNotificacao({ usuario_id, carona_id, conteudo, tipo });
    }
  } catch (err) {
    logger.error('Erro ao verificar/enviar notificação de lembrete:', err);
  }
}

function iniciarJobLembretes() {
  logger.log('[Job] Lembretes de viagem iniciado (polling 60s).');
  setInterval(processarLembretesViagem, 60000);
}

module.exports = { iniciarJobLembretes };
