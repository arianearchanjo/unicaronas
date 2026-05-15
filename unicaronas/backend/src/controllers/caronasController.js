const PDFDocument = require('pdfkit');
const caronasService = require('../services/caronasService');
const db = require('../../config/database');
const notificacoesService = require('../services/notificacoesService');

const buscarPorId = async (req, res, next) => {
  try {
    const carona = await caronasService.buscarPorId(req.params.id);
    res.json({ success: true, data: carona });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, error: err.message, code: err.code });
    next(err);
  }
};

const criar = async (req, res, next) => {
  try {
    const novaCarona = await caronasService.criar(req.body, req.usuario.id);
    res.status(201).json({ success: true, data: novaCarona });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, error: err.message, code: err.code });
    next(err);
  }
};

const concluir = async (req, res, next) => {
  try {
    const carona = await caronasService.concluir(req.params.id, req.usuario.id);
    res.json({ success: true, data: carona });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, error: err.message, code: err.code });
    next(err);
  }
};

const listar = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT c.*, u.nome as motorista_nome, u.foto_url as motorista_foto
       FROM caronas c
       JOIN usuarios u ON c.motorista_id = u.id
       WHERE c.status = 'ativa' AND c.vagas_disponiveis > 0
       ORDER BY c.horario_partida ASC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

const solicitar = async (req, res, next) => {
  try {
    const carona_id = req.params.id;
    const passageiro_id = req.usuario.id;
    
    const { rows: existente } = await db.query('SELECT id FROM solicitacoes_carona WHERE carona_id = $1 AND passageiro_id = $2', [carona_id, passageiro_id]);
    if (existente.length > 0) return res.status(400).json({ success: false, error: 'Você já solicitou esta carona', code: 'SOLICITACAO_DUPLICADA' });

    const { rows } = await db.query(
      'INSERT INTO solicitacoes_carona (carona_id, passageiro_id) VALUES ($1, $2) RETURNING *',
      [carona_id, passageiro_id]
    );

    // Notificar motorista
    const { rows: motorista } = await db.query('SELECT motorista_id FROM caronas WHERE id = $1', [carona_id]);
    await notificacoesService.criarNotificacao({
      usuario_id: motorista[0].motorista_id,
      carona_id,
      conteudo: 'Nova solicitação de carona recebida.',
      tipo: 'solicitacao'
    });

    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

const responderSolicitacao = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const motorista_id = req.usuario.id;

    const { rows: solRows } = await db.query(
      `SELECT s.*, c.motorista_id FROM solicitacoes_carona s
       JOIN caronas c ON s.carona_id = c.id
       WHERE s.id = $1`, [id]
    );

    if (solRows.length === 0 || solRows[0].motorista_id !== motorista_id) {
      return res.status(403).json({ success: false, error: 'Não autorizado', code: 'NAO_AUTORIZADO' });
    }

    const { rows } = await db.query('UPDATE solicitacoes_carona SET status = $1, atualizado_em = NOW() WHERE id = $2 RETURNING *', [status, id]);
    
    await notificacoesService.criarNotificacao({
      usuario_id: solRows[0].passageiro_id,
      carona_id: solRows[0].carona_id,
      conteudo: `Sua solicitação foi ${status === 'aceita' ? 'aceita' : 'recusada'}.`,
      tipo: 'solicitacao'
    });

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

const listarSolicitacoes = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT s.*, u.nome, u.foto_url, u.avaliacao_media
       FROM solicitacoes_carona s
       JOIN usuarios u ON s.passageiro_id = u.id
       WHERE s.carona_id = $1`, [req.params.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

const minhaSolicitacao = async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT * FROM solicitacoes_carona WHERE carona_id = $1 AND passageiro_id = $2', [req.params.id, req.usuario.id]);
    res.json({ success: true, data: rows[0] || null });
  } catch (err) {
    next(err);
  }
};

const solicitacoesPendentes = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT COUNT(s.id)::int as count FROM solicitacoes_carona s
       JOIN caronas c ON s.carona_id = c.id
       WHERE c.motorista_id = $1 AND s.status = 'pendente'`, [req.usuario.id]
    );
    res.json({ success: true, count: rows[0].count });
  } catch (err) {
    next(err);
  }
};

const historico = async (req, res, next) => {
  try {
    const usuario_id = req.params.usuario_id;
    const { rows } = await db.query(
      `SELECT c.*, 'motorista' as papel FROM caronas c WHERE motorista_id = $1 AND status = 'concluida'
       UNION ALL
       SELECT c.*, 'passageiro' as papel FROM caronas c
       JOIN solicitacoes_carona s ON s.carona_id = c.id
       WHERE s.passageiro_id = $1 AND s.status = 'aceita' AND c.status = 'concluida'
       ORDER BY horario_partida DESC`, [usuario_id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

const cancelar = async (req, res, next) => {
  try {
    const { justificativa } = req.body;
    const { rows } = await db.query('UPDATE caronas SET status = \'cancelada\', justificativa_cancelamento = $1 WHERE id = $2 AND motorista_id = $3 RETURNING *', [justificativa, req.params.id, req.usuario.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, error: 'Não autorizado ou inexistente', code: 'NAO_AUTORIZADO' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

const gerarComprovante = async (req, res, next) => {
  try {
    const carona = await caronasService.buscarPorId(req.params.id);
    const motorista_id = req.usuario.id;
    const isPassageiro = carona.passageiros.some(p => p.id === motorista_id);

    if (carona.motorista_id !== motorista_id && !isPassageiro) {
      return res.status(403).json({ success: false, error: 'Apenas participantes podem emitir o comprovante.', code: 'NAO_AUTORIZADO' });
    }

    if (carona.status !== 'concluida') {
      return res.status(400).json({ success: false, error: 'Apenas caronas concluídas possuem comprovante.', code: 'STATUS_INVALIDO' });
    }

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=comprovante-carona-${carona.id}.pdf`);
    doc.pipe(res);

    // PDF Content
    doc.fontSize(25).text('UniCaronas', { align: 'center' });
    doc.moveDown();
    doc.fontSize(18).text('Comprovante de Carona', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Referência: #${carona.id.toString().padStart(6, '0')}`);
    doc.text(`Data de Emissão: ${new Date().toLocaleDateString('pt-BR')}`);
    doc.moveDown();
    
    doc.text(`Origem: ${carona.origem}`);
    doc.text(`Destino: ${carona.destino}`);
    doc.text(`Data/Hora: ${new Date(carona.horario_partida).toLocaleString('pt-BR')}`);
    doc.moveDown();

    doc.text(`Motorista: ${carona.motorista_nome}`);
    doc.text(`Valor Pago: R$ ${parseFloat(carona.valor_cobrado).toFixed(2)}`);
    doc.moveDown();

    doc.text('Passageiros:');
    carona.passageiros.forEach(p => {
      doc.text(`- ${p.nome}`);
    });

    doc.moveDown(5);
    doc.fontSize(10).text('Este é um documento gerado automaticamente pelo sistema UniCaronas.', { align: 'center', color: 'grey' });

    doc.end();
  } catch (err) {
    next(err);
  }
};

module.exports = { criar, listar, buscarPorId, solicitar, responderSolicitacao, listarSolicitacoes, concluir, minhaSolicitacao, solicitacoesPendentes, historico, cancelar, gerarComprovante };
