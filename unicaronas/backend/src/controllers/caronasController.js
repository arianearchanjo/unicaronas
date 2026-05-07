const db = require('../../config/database');
const { calcularValorSugerido } = require('../utils/precificacao');
const notificacoesService = require('../services/notificacoesService');

const STATUS_VALIDOS_SOLICITACAO = ['aceita', 'recusada'];

/**
 * POST /api/caronas
 */
const criar = async (req, res, next) => {
  try {
    const {
      origem, destino, horario_partida, vagas_totais,
      valor_cobrado, distancia_km, observacoes, recorrente,
      veiculo_id, ponto_encontro, ponto_encontro_detalhes, itinerario,
      genero_preferencia
    } = req.body;
    const motorista_id = req.usuario.id;

    if (!ponto_encontro || !ponto_encontro.trim()) {
      return res.status(400).json({ success: false, error: 'O ponto de encontro é obrigatório.' });
    }

    // Se veiculo_id for fornecido, validar que pertence ao usuário
    if (veiculo_id) {
      const veiculoCheck = await db.query('SELECT id FROM veiculos WHERE id = $1 AND usuario_id = $2', [veiculo_id, motorista_id]);
      if (veiculoCheck.rows.length === 0) {
        return res.status(400).json({ success: false, error: 'Veículo inválido ou não pertence ao usuário.' });
      }
    }

    // Busca dia_ead e genero do usuário
    const { rows: userRows } = await db.query('SELECT dia_ead, genero FROM usuarios WHERE id = $1', [motorista_id]);
    const { dia_ead, genero: motorista_genero } = userRows[0] || {};

    if (genero_preferencia === 'somente_mulheres' && motorista_genero !== 'F') {
      return res.status(400).json({ 
        success: false, 
        error: 'Apenas motoristas do gênero feminino podem criar caronas exclusivas para mulheres.' 
      });
    }

    const agora = new Date();
    const horario = new Date(horario_partida);
    if (isNaN(horario.getTime())) {
      return res.status(400).json({ success: false, error: 'horario_partida inválido' });
    }
    
    // 1. Não pode ser no passado
    if (horario <= agora) {
      return res.status(400).json({ success: false, error: 'O horário de partida deve ser no futuro' });
    }

    // 2. Limitar ao semestre atual
    const mesAtual = agora.getMonth(); // 0-11
    const anoAtual = agora.getFullYear();
    let limiteSemestre;

    if (mesAtual <= 5) { // Janeiro a Junho
      limiteSemestre = new Date(anoAtual, 5, 30, 23, 59, 59); // 30 de Junho
    } else { // Julho a Dezembro
      limiteSemestre = new Date(anoAtual, 11, 31, 23, 59, 59); // 31 de Dezembro
    }

    if (horario > limiteSemestre) {
      const msg = mesAtual <= 5 
        ? 'Só é permitido criar caronas para o semestre atual (até 30/06).'
        : 'Só é permitido criar caronas para o semestre atual (até 31/12).';
      return res.status(400).json({ success: false, error: msg });
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
         (motorista_id, veiculo_id, origem, destino, ponto_encontro, ponto_encontro_detalhes, horario_partida, vagas_totais, vagas_disponiveis,
          valor_sugerido, valor_cobrado, distancia_km, observacoes, recorrente, itinerario, genero_preferencia)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [
        motorista_id,
        veiculo_id || null,
        origem.trim(),
        destino.trim(),
        ponto_encontro.trim(),
        ponto_encontro_detalhes?.trim() || null,
        horario_partida, 
        vagas,
        valor_sugerido,
        valor,
        distancia,
        observacoes?.trim() || null,
        !!recorrente,
        itinerario?.trim() || null,
        genero_preferencia || 'todos'
      ]
    );

    const avisos = [];
    if (recorrente) {
      let criadas = 0;
      let semanasAvancadas = 1;
      
      while (criadas < 3) {
        const novaData = new Date(horario);
        novaData.setDate(novaData.getDate() + (semanasAvancadas * 7));
        
        if (novaData.getHours() !== horario.getHours()) {
           novaData.setHours(horario.getHours());
        }

        if (dia_ead !== null && novaData.getDay() === dia_ead) {
          const dataFormatada = novaData.toLocaleDateString('pt-BR');
          const diasSemana = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
          avisos.push(`Carona de ${dataFormatada} (${diasSemana[novaData.getDay()]}) ignorada: dia EAD da sua turma.`);
          semanasAvancadas++;
          continue;
        }

        const novaDataStr = novaData.getFullYear() + '-' + 
          String(novaData.getMonth() + 1).padStart(2, '0') + '-' + 
          String(novaData.getDate()).padStart(2, '0') + 'T' + 
          String(novaData.getHours()).padStart(2, '0') + ':' + 
          String(novaData.getMinutes()).padStart(2, '0');

        await db.query(
          `INSERT INTO caronas (motorista_id, veiculo_id, origem, destino, ponto_encontro, ponto_encontro_detalhes, horario_partida, vagas_totais, 
           vagas_disponiveis, valor_sugerido, valor_cobrado, distancia_km, observacoes, recorrente, itinerario, genero_preferencia)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8, $9, $10, $11, $12, true, $13, $14)`,
          [motorista_id, veiculo_id || null, origem.trim(), destino.trim(), ponto_encontro.trim(), ponto_encontro_detalhes?.trim() || null, novaDataStr, vagas, valor_sugerido, valor, distancia, observacoes?.trim() || null, itinerario?.trim() || null, genero_preferencia || 'todos']
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
 */
const listar = async (req, res, next) => {
  try {
    const { origem, destino, data, motorista_id, preco_max } = req.query;
    const usuario_id = req.usuario?.id;

    if (motorista_id !== undefined && (isNaN(Number(motorista_id)) || Number(motorista_id) <= 0)) {
      return res.status(400).json({ success: false, error: 'motorista_id inválido' });
    }

    let usuario_genero = null;
    if (usuario_id) {
      const { rows: uRows } = await db.query('SELECT genero FROM usuarios WHERE id = $1', [usuario_id]);
      usuario_genero = uRows[0]?.genero;
    }

    let query = `
      SELECT c.*, u.nome AS motorista_nome, u.foto_url AS motorista_foto, u.perfil_tipo AS motorista_tipo,
             u.avaliacao_media AS motorista_avaliacao, u.total_avaliacoes AS motorista_total_avaliacoes
      FROM caronas c
      JOIN usuarios u ON u.id = c.motorista_id
      WHERE c.status = 'ativa'
        AND c.vagas_disponiveis >= 0
        AND c.horario_partida > NOW()
    `;
    const params = [];
    let idx = 1;

    if (usuario_genero === 'M') {
      query += " AND c.genero_preferencia != 'somente_mulheres'";
    }

    if (origem) {
      query += ` AND (LOWER(c.origem) LIKE LOWER($${idx}) OR LOWER(c.itinerario) LIKE LOWER($${idx++}))`;
      params.push(`%${origem}%`);
    }
    if (destino) {
      query += ` AND (LOWER(c.destino) LIKE LOWER($${idx}) OR LOWER(c.itinerario) LIKE LOWER($${idx++}))`;
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
              u.avaliacao_media AS motorista_avaliacao, u.telefone AS motorista_telefone,
              v.marca AS veiculo_marca, v.modelo AS veiculo_modelo, v.ano AS veiculo_ano,
              v.cor AS veiculo_cor, v.placa AS veiculo_placa
       FROM caronas c
       JOIN usuarios u ON u.id = c.motorista_id
       LEFT JOIN veiculos v ON v.id = c.veiculo_id
       WHERE c.id = $1`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Carona não encontrada' });
    }

    const data = rows[0];

    if (data.veiculo_marca) {
      data.veiculo = {
        marca: data.veiculo_marca,
        modelo: data.veiculo_modelo,
        ano: data.veiculo_ano,
        cor: data.veiculo_cor,
        placa: data.veiculo_placa
      };
    } else {
      data.veiculo = null;
    }
    
    delete data.veiculo_marca;
    delete data.veiculo_modelo;
    delete data.veiculo_ano;
    delete data.veiculo_cor;
    delete data.veiculo_placa;

    res.json({ success: true, data });
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
      `SELECT motorista_id, vagas_disponiveis, status, genero_preferencia
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

    // Validar gênero se for "somente_mulheres"
    if (carona.genero_preferencia === 'somente_mulheres') {
      const { rows: uRows } = await db.query('SELECT genero FROM usuarios WHERE id = $1', [passageiro_id]);
      const passageiro_genero = uRows[0]?.genero;
      if (passageiro_genero === 'M') {
        return res.status(403).json({ success: false, error: 'Esta carona é exclusiva para mulheres.' });
      }
    }

    const { rows } = await db.query(
      'INSERT INTO solicitacoes_carona (carona_id, passageiro_id) VALUES ($1, $2) RETURNING *',
      [carona_id, passageiro_id]
    );

    // Notificar o motorista
    await notificacoesService.criarNotificacao({
      usuario_id: carona.motorista_id,
      titulo: 'Nova solicitação de carona',
      mensagem: `Você recebeu uma nova solicitação para a carona de ${carona_id}.`,
      tipo: 'nova_solicitacao',
      referencia_id: carona_id,
      referencia_tipo: 'carona'
    });

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
*/
const listarSolicitacoes = async(req, res, next) => {
  try{
    const carona_id = parseInt(req.params.id, 10);
    const motorista_id = req.usuario.id;

    if(isNaN(carona_id) || carona_id <= 0){
      return res.status(400).json({sucess: false, error: 'ID invalido'});
    }

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
          u.avaliacao_media AS passageiro_avaliacao,
          p.status AS pagamento_status,
          EXISTS (SELECT 1 FROM avaliacoes WHERE solicitacao_id = s.id AND avaliador_id = $2) AS ja_avaliado
        FROM solicitacoes_carona s
        JOIN usuarios u ON u.id = s.passageiro_id
        LEFT JOIN pagamentos p ON p.solicitacao_id = s.id
        WHERE s.carona_id = $1
        ORDER BY s.criado_em ASC`,
      [carona_id, motorista_id]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/caronas/solicitacoes/:id
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
      `SELECT s.status AS solicitacao_status, s.passageiro_id, s.carona_id, c.motorista_id
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

    // Notificar o passageiro
    if (status === 'aceita') {
      await notificacoesService.criarNotificacao({
        usuario_id: sol.passageiro_id,
        titulo: 'Sua solicitação foi aceita!',
        mensagem: `Sua solicitação para a carona ${sol.carona_id} foi aceita pelo motorista.`,
        tipo: 'solicitacao_aceita',
        referencia_id: sol.carona_id,
        referencia_tipo: 'carona'
      });
    } else if (status === 'recusada') {
      await notificacoesService.criarNotificacao({
        usuario_id: sol.passageiro_id,
        titulo: 'Solicitação não aprovada',
        mensagem: `Sua solicitação para a carona ${sol.carona_id} foi recusada.`,
        tipo: 'solicitacao_recusada',
        referencia_id: sol.carona_id,
        referencia_tipo: 'carona'
      });
    }

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
      `SELECT s.*, p.status AS pagamento_status,
          EXISTS (SELECT 1 FROM avaliacoes WHERE solicitacao_id = s.id AND avaliador_id = $2) AS ja_avaliado
       FROM solicitacoes_carona s
       LEFT JOIN pagamentos p ON p.solicitacao_id = s.id
       WHERE s.carona_id = $1 AND s.passageiro_id = $2`,
      [carona_id, passageiro_id]
    );

    res.json({ success: true, data: rows[0] || null });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/caronas/solicitacoes/pendentes
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
 */
const historico = async (req, res, next) => {
  try {
    const usuario_id = parseInt(req.params.usuario_id, 10);
    const { rows } = await db.query(
      `SELECT c.*, 'motorista' as papel, CAST(NULL AS INTEGER) as solicitacao_id FROM caronas c
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

/**
 * PATCH /api/caronas/:id/cancelar
 */
const cancelar = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const motorista_id = req.usuario.id;
    const { justificativa } = req.body;

    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ success: false, error: 'ID inválido' });
    }

    const { rows: caronas } = await db.query(
      'SELECT status FROM caronas WHERE id = $1 AND motorista_id = $2',
      [id, motorista_id]
    );

    if (caronas.length === 0) {
      return res.status(404).json({ success: false, error: 'Carona não encontrada ou não autorizada' });
    }

    if (caronas[0].status !== 'ativa') {
      return res.status(400).json({ success: false, error: `Não é possível cancelar uma carona com status "${caronas[0].status}"` });
    }

    const { rows } = await db.query(
      `UPDATE caronas
       SET status = 'cancelada', justificativa_cancelamento = $1, atualizado_em = NOW()
       WHERE id = $2 AND motorista_id = $3
       RETURNING *`,
      [justificativa?.trim() || null, id, motorista_id]
    );

    res.json({ success: true, data: rows[0], message: 'Carona cancelada com sucesso' });
  } catch (err) {
    next(err);
  }
};

module.exports = { criar, listar, buscarPorId, solicitar, responderSolicitacao, listarSolicitacoes, concluir, minhaSolicitacao, solicitacoesPendentes, historico, cancelar };
