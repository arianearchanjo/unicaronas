const db = require('../../config/database');
const { calcularValorSugerido } = require('../utils/precificacao');

const STATUS_VALIDOS_SOLICITACAO = ['aceita', 'recusada'];

/**
 * POST /api/caronas
 */
const criar = async (req, res, next) => {
  try {
    const {
      origem, destino, horario_partida, vagas_totais,
      valor_cobrado, distancia_km, observacoes,
    } = req.body;
    const motorista_id = req.usuario.id;

    const horario = new Date(horario_partida);
    if (isNaN(horario.getTime())) {
      return res.status(400).json({ success: false, error: 'horario_partida inválido' });
    }
    if (horario <= new Date()) {
      return res.status(400).json({ success: false, error: 'O horário de partida deve ser no futuro' });
    }

    const vagas = parseInt(vagas_totais, 10);
    const valor = parseFloat(valor_cobrado);
    const distancia = distancia_km ? parseFloat(distancia_km) : null;
    const valor_sugerido = distancia ? calcularValorSugerido(distancia) : null;

    const { rows } = await db.query(
      `INSERT INTO caronas
         (motorista_id, origem, destino, horario_partida, vagas_totais, vagas_disponiveis,
          valor_sugerido, valor_cobrado, distancia_km, observacoes)
       VALUES ($1, $2, $3, $4, $5, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        motorista_id,
        origem.trim(),
        destino.trim(),
        horario.toISOString(),
        vagas,
        valor_sugerido,
        valor,
        distancia,
        observacoes?.trim() || null,
      ]
    );

    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/caronas
 * Suporta filtros: origem, destino, data, motorista_id
 */
const listar = async (req, res, next) => {
  try {
    const { origem, destino, data, motorista_id } = req.query;

    // motorista_id deve ser inteiro se fornecido
    if (motorista_id !== undefined && (isNaN(Number(motorista_id)) || Number(motorista_id) <= 0)) {
      return res.status(400).json({ success: false, error: 'motorista_id inválido' });
    }

    let query = `
      SELECT c.*, u.nome AS motorista_nome, u.foto_url AS motorista_foto,
             u.avaliacao_media AS motorista_avaliacao
      FROM caronas c
      JOIN usuarios u ON u.id = c.motorista_id
      WHERE c.status = 'ativa'
        AND c.vagas_disponiveis > 0
        AND c.horario_partida > NOW()
    `;
    const params = [];
    let idx = 1;

    if (origem) {
      query += ` AND LOWER(c.origem) LIKE LOWER($${idx++})`;
      params.push(`%${origem}%`);
    }
    if (destino) {
      query += ` AND LOWER(c.destino) LIKE LOWER($${idx++})`;
      params.push(`%${destino}%`);
    }
    if (data) {
      query += ` AND DATE(c.horario_partida) = $${idx++}`;
      params.push(data);
    }
    if (motorista_id) {
      query += ` AND c.motorista_id = $${idx++}`;
      params.push(parseInt(motorista_id, 10));
    }

    query += ' ORDER BY c.horario_partida ASC LIMIT 200';

    const { rows } = await db.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/caronas/:id
 */
const buscarPorId = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ success: false, error: 'ID inválido' });
    }

    const { rows } = await db.query(
      `SELECT c.*, u.nome AS motorista_nome, u.foto_url AS motorista_foto,
              u.avaliacao_media AS motorista_avaliacao, u.telefone AS motorista_telefone
       FROM caronas c
       JOIN usuarios u ON u.id = c.motorista_id
       WHERE c.id = $1`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Carona não encontrada' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/caronas/:id/solicitar
 */
const solicitar = async (req, res, next) => {
  try {
    const carona_id = parseInt(req.params.id, 10);
    if (isNaN(carona_id) || carona_id <= 0) {
      return res.status(400).json({ success: false, error: 'ID inválido' });
    }
    const passageiro_id = req.usuario.id;

    const { rows: caronas } = await db.query(
      `SELECT motorista_id, vagas_disponiveis, status
       FROM caronas
       WHERE id = $1`,
      [carona_id]
    );

    if (caronas.length === 0) {
      return res.status(404).json({ success: false, error: 'Carona não encontrada' });
    }

    const carona = caronas[0];

    if (carona.status !== 'ativa') {
      return res.status(400).json({ success: false, error: 'Esta carona não está mais ativa' });
    }
    if (carona.vagas_disponiveis <= 0) {
      return res.status(400).json({ success: false, error: 'Não há vagas disponíveis' });
    }
    if (carona.motorista_id === passageiro_id) {
      return res.status(400).json({ success: false, error: 'Você não pode solicitar sua própria carona' });
    }

    const { rows } = await db.query(
      'INSERT INTO solicitacoes_carona (carona_id, passageiro_id) VALUES ($1, $2) RETURNING *',
      [carona_id, passageiro_id]
    );

    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ success: false, error: 'Você já solicitou esta carona' });
    }
    next(err);
  }
};

/**
 * PATCH /api/caronas/solicitacoes/:id
 * Aceita ou recusa uma solicitação. Apenas o motorista da carona pode responder.
 */
const responderSolicitacao = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ success: false, error: 'ID inválido' });
    }

    const { status } = req.body;
    if (!STATUS_VALIDOS_SOLICITACAO.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Status inválido. Use: ${STATUS_VALIDOS_SOLICITACAO.join(', ')}`,
      });
    }

    const motorista_id = req.usuario.id;

    const { rows: solicitacoes } = await db.query(
      `SELECT s.status AS solicitacao_status, c.motorista_id
       FROM solicitacoes_carona s
       JOIN caronas c ON c.id = s.carona_id
       WHERE s.id = $1`,
      [id]
    );

    if (solicitacoes.length === 0) {
      return res.status(404).json({ success: false, error: 'Solicitação não encontrada' });
    }

    const sol = solicitacoes[0];

    if (sol.motorista_id !== motorista_id) {
      return res.status(403).json({ success: false, error: 'Não autorizado' });
    }
    if (sol.solicitacao_status !== 'pendente') {
      return res.status(400).json({ success: false, error: 'Esta solicitação já foi respondida' });
    }

    const { rows } = await db.query(
      'UPDATE solicitacoes_carona SET status = $1, atualizado_em = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

module.exports = { criar, listar, buscarPorId, solicitar, responderSolicitacao };