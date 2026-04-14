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
      valor_cobrado, distancia_km, observacoes, recorrente
    } = req.body;
    const motorista_id = req.usuario.id;

    // Busca dia_ead do usuário
    const { rows: userRows } = await db.query('SELECT dia_ead FROM usuarios WHERE id = $1', [motorista_id]);
    const dia_ead = userRows[0]?.dia_ead;

    const horario = new Date(horario_partida);
    if (isNaN(horario.getTime())) {
      return res.status(400).json({ success: false, error: 'horario_partida inválido' });
    }
    if (horario <= new Date()) {
      return res.status(400).json({ success: false, error: 'O horário de partida deve ser no futuro' });
    }

    // Validação de dia EAD para a carona principal
    if (dia_ead !== null && horario.getDay() === dia_ead) {
      return res.status(422).json({ 
        success: false, 
        error: "Você não pode criar uma carona neste dia pois é o seu dia EAD." 
      });
    }

    const vagas = parseInt(vagas_totais, 10);
    const valor = parseFloat(valor_cobrado);
    const distancia = distancia_km ? parseFloat(distancia_km) : null;
    const valor_sugerido = distancia ? calcularValorSugerido(distancia) : null;

    const { rows } = await db.query(
      `INSERT INTO caronas
         (motorista_id, origem, destino, horario_partida, vagas_totais, vagas_disponiveis,
          valor_sugerido, valor_cobrado, distancia_km, observacoes, recorrente)
       VALUES ($1, $2, $3, $4, $5, $5, $6, $7, $8, $9, $10)
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
        !!recorrente
      ]
    );

    const avisos = [];
    if (recorrente) {
      let criadas = 0;
      let semanasAvancadas = 1;
      
      while (criadas < 3) {
        const novaData = new Date(horario);
        novaData.setDate(novaData.getDate() + (semanasAvancadas * 7));
        
        // Verifica se a nova data cai no dia EAD
        if (dia_ead !== null && novaData.getDay() === dia_ead) {
          const dataFormatada = novaData.toLocaleDateString('pt-BR');
          const diasSemana = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
          avisos.push(`Carona de ${dataFormatada} (${diasSemana[novaData.getDay()]}) ignorada: dia EAD da sua turma.`);
          semanasAvancadas++;
          continue; // Pula esta semana e tenta a próxima
        }

        await db.query(
          `INSERT INTO caronas (motorista_id, origem, destino, horario_partida, vagas_totais, 
           vagas_disponiveis, valor_sugerido, valor_cobrado, distancia_km, observacoes, recorrente)
           VALUES ($1, $2, $3, $4, $5, $5, $6, $7, $8, $9, true)`,
          [motorista_id, origem.trim(), destino.trim(), novaData.toISOString(), vagas, valor_sugerido, valor, distancia, observacoes?.trim() || null]
        );
        
        criadas++;
        semanasAvancadas++;
      }
    }

    res.status(201).json({ success: true, data: rows[0], avisos });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/caronas
 * Suporta filtros: origem, destino, data, motorista_id, preco_max
 */
const listar = async (req, res, next) => {
  try {
    const { origem, destino, data, motorista_id, preco_max } = req.query;

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
    if (preco_max) {
      query += ` AND c.valor_cobrado <= $${idx++}`;
      params.push(parseFloat(preco_max));
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
 * GET /api/caronas/:id/solicitacoes
 * Lista solicitações de uma carona. Apenas o motorista pode ver
*/

const listarSolicitacoes = async(req, res, next) => {
  try{
    const carona_id = parseInt(req.params.id, 10);
    const motorista_id = req.usuario.id;

    if(isNaN(carona_id) || carona_id <= 0){
      return res.status(400).json({sucess: false, error: 'ID invalido'});
    }

    // Confirma que a carona pertence ao motorista logado
    const { rows: caronas } = await db.query(
      'SELECT id FROM caronas WHERE id = $1 AND motorista_id = $2',
      [carona_id, motorista_id]
    );

    if (caronas.length === 0) {
      return res.status(403).json({ success: false, error: 'Não autorizado' });
    }

    const { rows } = await db.query(
      `SELECT s.id, s.status, s.criado_em,
          u.id AS passageiro_id,
          u.nome AS passageiro_nome,
          u.curso AS passageiro_curso,
          u.avaliacao_media AS passageiro_avaliacao
        FROM solicitacoes_carona s
        JOIN usuarios u ON u.id = s.passageiro_id
        WHERE s.carona_id = $1
        ORDER BY s.criado_em ASC`,
      [carona_id]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
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

/**
 * PATCH /api/caronas/:id/concluir
 */
const concluir = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const motorista_id = req.usuario.id;

    const { rows } = await db.query(
      'UPDATE caronas SET status = \'concluida\', atualizado_em = NOW() WHERE id = $1 AND motorista_id = $2 RETURNING *',
      [id, motorista_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Carona não encontrada ou não autorizada' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/caronas/:id/minha-solicitacao
 */
const minhaSolicitacao = async (req, res, next) => {
  try {
    const carona_id = parseInt(req.params.id, 10);
    const passageiro_id = req.usuario.id;

    const { rows } = await db.query(
      'SELECT * FROM solicitacoes_carona WHERE carona_id = $1 AND passageiro_id = $2',
      [carona_id, passageiro_id]
    );

    res.json({ success: true, data: rows[0] || null });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/caronas/solicitacoes/pendentes
 * Retorna o COUNT de solicitações com status 'pendente' nas caronas do motorista logado.
 */
const solicitacoesPendentes = async (req, res, next) => {
  try {
    const motorista_id = req.usuario.id;
    const { rows } = await db.query(
      `SELECT COUNT(s.id)::int as count
       FROM solicitacoes_carona s
       JOIN caronas c ON c.id = s.carona_id
       WHERE c.motorista_id = $1 AND s.status = 'pendente'`,
      [motorista_id]
    );
    res.json({ success: true, count: rows[0].count });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/caronas/historico/:usuario_id
 * Retorna o histórico de caronas concluídas do usuário.
 */
const historico = async (req, res, next) => {
  try {
    const usuario_id = parseInt(req.params.usuario_id, 10);
    const { rows } = await db.query(
      `SELECT c.*, 'motorista' as papel, NULL as solicitacao_id FROM caronas c
       WHERE c.motorista_id = $1 AND c.status = 'concluida'
       UNION ALL
       SELECT c.*, 'passageiro' as papel, s.id as solicitacao_id FROM caronas c
       JOIN solicitacoes_carona s ON s.carona_id = c.id
       WHERE s.passageiro_id = $1 AND s.status = 'aceita' AND c.status = 'concluida'
       ORDER BY horario_partida DESC`,
      [usuario_id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

module.exports = { criar, listar, buscarPorId, solicitar, responderSolicitacao, listarSolicitacoes, concluir, minhaSolicitacao, solicitacoesPendentes, historico };