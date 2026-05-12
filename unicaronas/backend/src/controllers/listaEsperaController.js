const pool = require('../../config/database');

const listaEsperaController = {
  /**
   * POST /api/caronas/:id/espera
   * Entra na fila de espera de uma carona
   */
  async entrarNaFila(req, res) {
    const carona_id = parseInt(req.params.id, 10);
    const passageiro_id = req.usuario.id;

    if (isNaN(carona_id) || carona_id <= 0) {
      return res.status(400).json({ success: false, error: 'ID de carona inválido.' });
    }

    try {
      // 1. Verificar se a carona existe e se realmente está lotada
      const caronaQuery = 'SELECT motorista_id, vagas_disponiveis, status FROM caronas WHERE id = $1';
      const caronaRes = await pool.query(caronaQuery, [carona_id]);

      if (caronaRes.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Carona não encontrada.' });
      }

      const carona = caronaRes.rows[0];

      if (carona.status !== 'ativa') {
        return res.status(400).json({ success: false, error: 'Esta carona não está mais ativa.' });
      }

      if (carona.motorista_id === passageiro_id) {
        return res.status(400).json({ success: false, error: 'Você é o motorista desta carona.' });
      }

      // Se ainda tiver vaga, avisar que pode solicitar diretamente
      if (carona.vagas_disponiveis > 0) {
        return res.status(400).json({
          success: false,
          error: 'Esta carona ainda possui vagas. Você pode solicitar diretamente.'
        });
      }

      // 2. Tentar inserir na lista de espera
      const query = `
        INSERT INTO lista_espera (carona_id, passageiro_id, status)
        VALUES ($1, $2, 'aguardando')
        ON CONFLICT (carona_id, passageiro_id) DO UPDATE SET
          status = 'aguardando',
          criado_em = CURRENT_TIMESTAMP
        RETURNING *;
      `;
      const result = await pool.query(query, [carona_id, passageiro_id]);

      return res.status(201).json({
        success: true,
        data: {
          ...result.rows[0],
          message: 'Você entrou na lista de espera. Avisaremos se uma vaga for liberada!'
        }
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, error: 'Erro ao entrar na lista de espera.' });
    }
  }
};

module.exports = listaEsperaController;
