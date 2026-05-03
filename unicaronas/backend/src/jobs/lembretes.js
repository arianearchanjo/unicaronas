const cron = require('node-cron');
const pool = require('../../config/database');
const notificacoesService = require('../services/notificacoesService');

/**
 * Busca caronas que partem em aproximadamente 2 horas e notifica os envolvidos.
 */
async function processarLembretesViagem() {
  try {
    // Buscar caronas ativas que partem entre 2h e 2h30m a partir de agora
    const queryCaronas = `
      SELECT id, motorista_id, origem, destino, horario_partida
      FROM caronas
      WHERE status = 'ativa'
        AND horario_partida BETWEEN NOW() + INTERVAL '2 hours' AND NOW() + INTERVAL '2 hours 30 minutes'
    `;
    const { rows: caronas } = await pool.query(queryCaronas);

    for (const carona of caronas) {
      // 1. Notificar Motorista (se não notificado recentemente)
      await notificarSeNecessario({
        usuario_id: carona.motorista_id,
        titulo: 'Sua carona parte em 2 horas',
        mensagem: `Sua carona de ${carona.origem} para ${carona.destino} está agendada para as ${new Date(carona.horario_partida).toLocaleTimeString('pt-BR')}.`,
        tipo: 'lembrete_viagem',
        referencia_id: carona.id,
        referencia_tipo: 'carona'
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
          titulo: 'Sua carona parte em 2 horas',
          mensagem: `Sua carona de ${carona.origem} para ${carona.destino} parte em 2 horas. Prepare-se!`,
          tipo: 'lembrete_viagem',
          referencia_id: carona.id,
          referencia_tipo: 'carona'
        });
      }
    }
  } catch (err) {
    console.error('Erro no job de lembretes:', err);
  }
}

/**
 * Verifica se já existe uma notificação de lembrete para este usuário/carona nas últimas 3 horas.
 */
async function notificarSeNecessario(dados) {
  try {
    const queryCheck = `
      SELECT id FROM notificacoes
      WHERE usuario_id = $1
        AND referencia_id = $2
        AND tipo = $3
        AND criado_em > NOW() - INTERVAL '3 hours'
      LIMIT 1
    `;
    const { rows } = await pool.query(queryCheck, [dados.usuario_id, dados.referencia_id, dados.tipo]);

    if (rows.length === 0) {
      await notificacoesService.criarNotificacao(dados);
    }
  } catch (err) {
    console.error('Erro ao verificar/enviar notificação de lembrete:', err);
  }
}

function iniciarJobLembretes() {
  // A cada 30 minutos: '*/30 * * * *'
  cron.schedule('*/30 * * * *', () => {
    console.log('[Job] Processando lembretes de viagem...');
    processarLembretesViagem();
  });
}

module.exports = { iniciarJobLembretes };
