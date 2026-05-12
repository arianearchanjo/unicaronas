/**
 * unicaronas/backend/src/controllers/pagamentosController.js
 *
 * Pagamentos com suporte a Pix BR Code nativo.
 * O Pix é gerado via payload EMV padrão BACEN — sem dependência externa.
 * O valor cai na chave do operador da plataforma, que repassa ao motorista manualmente.
 */

const db               = require('../../config/database');
const { calcularTaxa } = require('../utils/precificacao');
const { gerarPayloadPix, gerarTxId } = require('../utils/pix');

// ── Configuração da chave Pix do operador ───────────────────────────────────
// Defina no .env:
//   PIX_CHAVE=seu@email.com          (ou CPF, telefone, chave aleatória)
//   PIX_NOME=UniCaronas              (nome que aparece no app do pagador)
//   PIX_CIDADE=Curitiba              (cidade do recebedor)
const PIX_CHAVE  = process.env.PIX_CHAVE  || 'pagamentos@unicaronas.com.br';
const PIX_NOME   = process.env.PIX_NOME   || 'UniCaronas';
const PIX_CIDADE = process.env.PIX_CIDADE || 'Curitiba';

/**
 * GET /api/pagamentos/pix/:solicitacao_id
 *
 * Gera (ou recupera) o payload Pix para uma solicitação aceita.
 * Não registra o pagamento — apenas entrega o QR Code para o passageiro.
 * O passageiro confirma após pagar; o registro ocorre no POST /api/pagamentos.
 */
const gerarPix = async (req, res, next) => {
  try {
    const solicitacao_id = parseInt(req.params.solicitacao_id, 10);
    const passageiro_id  = req.usuario.id;

    if (isNaN(solicitacao_id) || solicitacao_id <= 0) {
      return res.status(400).json({ success: false, error: 'solicitacao_id inválido' });
    }

    // Busca a solicitação aceita e o valor da carona
    const { rows: solicitacoes } = await db.query(
      `SELECT s.id, s.passageiro_id, s.carona_id,
              c.valor_cobrado, c.origem, c.destino, c.motorista_id,
              u.nome AS motorista_nome
       FROM solicitacoes_carona s
       JOIN caronas c ON c.id = s.carona_id
       JOIN usuarios u ON u.id = c.motorista_id
       WHERE s.id = $1 AND s.passageiro_id = $2 AND s.status = 'aceita'`,
      [solicitacao_id, passageiro_id]
    );

    if (solicitacoes.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Solicitação não encontrada, não aceita ou não pertence ao usuário.'
      });
    }

    const sol = solicitacoes[0];

    // Verifica se já existe pagamento registrado
    const { rows: pagamentoExist } = await db.query(
      'SELECT id, status FROM pagamentos WHERE solicitacao_id = $1',
      [solicitacao_id]
    );
    if (pagamentoExist.length > 0 && pagamentoExist[0].status === 'pago') {
      return res.status(409).json({ success: false, error: 'Esta carona já foi paga.' });
    }

    const valorTotal = parseFloat(sol.valor_cobrado);
    const { taxa, repasse } = calcularTaxa(valorTotal);

    // Gera TXID único e determinístico para esta solicitação
    // Usa solicitacao_id como semente para ser idempotente na mesma solicitação
    const txid = `UCRIDE${solicitacao_id.toString().padStart(8, '0')}`.substring(0, 25);

    const descricao = `Carona UC#${sol.carona_id}`.substring(0, 72);

    const pixPayload = gerarPayloadPix({
      chave:     PIX_CHAVE,
      nome:      PIX_NOME,
      cidade:    PIX_CIDADE,
      valor:     valorTotal,
      txid,
      descricao,
    });

    res.json({
      success: true,
      data: {
        payload:         pixPayload,        // String "Copia e Cola" do Pix
        chave_pix:       PIX_CHAVE,
        nome_recebedor:  PIX_NOME,
        cidade:          PIX_CIDADE,
        valor_total:     valorTotal,
        taxa_plataforma: taxa,
        valor_motorista: repasse,
        txid,
        descricao,
        // Metadados da carona para exibir na tela
        carona: {
          id:              sol.carona_id,
          origem:          sol.origem,
          destino:         sol.destino,
          motorista_nome:  sol.motorista_nome,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/pagamentos
 *
 * Registra o pagamento após o usuário confirmar que realizou o Pix.
 * Para outros métodos (cartão, dinheiro), processa normalmente.
 *
 * Body: { solicitacao_id, metodo }
 *   metodo: 'pix' | 'cartao_credito' | 'dinheiro'
 */
const processar = async (req, res, next) => {
  try {
    const { solicitacao_id, metodo } = req.body;
    const passageiro_id = req.usuario.id;

    const METODOS_VALIDOS = ['pix', 'cartao_credito', 'dinheiro'];
    if (!METODOS_VALIDOS.includes(metodo)) {
      return res.status(400).json({ success: false, error: `Método inválido. Use: ${METODOS_VALIDOS.join(', ')}` });
    }

    // Busca solicitação aceita
    const { rows: solicitacoes } = await db.query(
      `SELECT s.*, c.valor_cobrado, c.motorista_id, c.status AS carona_status
       FROM solicitacoes_carona s
       JOIN caronas c ON c.id = s.carona_id
       WHERE s.id = $1 AND s.passageiro_id = $2 AND s.status = 'aceita'`,
      [solicitacao_id, passageiro_id]
    );

    if (solicitacoes.length === 0) {
      return res.status(400).json({ success: false, error: 'Solicitação não encontrada ou não aceita' });
    }

    // Verifica se a carona foi concluída (obrigatório para pagamento)
    const sol = solicitacoes[0];
    if (sol.carona_status !== 'concluida') {
      return res.status(400).json({
        success: false,
        error: 'O pagamento só pode ser registrado após a conclusão da carona.'
      });
    }

    // Verifica pagamento duplicado
    const { rows: pagamentoExist } = await db.query(
      'SELECT id FROM pagamentos WHERE solicitacao_id = $1',
      [solicitacao_id]
    );
    if (pagamentoExist.length > 0) {
      return res.status(409).json({ success: false, error: 'Pagamento já realizado para esta carona' });
    }

    const valorTotal = parseFloat(sol.valor_cobrado);
    const { taxa, repasse } = calcularTaxa(valorTotal);

    // Para Pix: usa o TXID determinístico gerado anteriormente
    const referenciaExterna = metodo === 'pix'
      ? `UCRIDE${solicitacao_id.toString().padStart(8, '0')}`.substring(0, 25)
      : `UC-${metodo.toUpperCase()}-${Date.now()}`;

    const { rows } = await db.query(
      `INSERT INTO pagamentos
         (solicitacao_id, valor_total, taxa_plataforma, valor_motorista,
          status, metodo, referencia_externa, pago_em)
       VALUES ($1, $2, $3, $4, 'pago', $5, $6, NOW())
       RETURNING *`,
      [solicitacao_id, valorTotal, taxa, repasse, metodo, referenciaExterna]
    );

    res.status(201).json({
      success: true,
      data: {
        ...rows[0],
        resumo: {
          valor_total:       valorTotal,
          taxa_plataforma:   taxa,
          repasse_motorista: repasse,
          referencia:        referenciaExterna,
          metodo,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/pagamentos/historico
 * Histórico financeiro do usuário logado.
 */
const historico = async (req, res, next) => {
  try {
    const usuario_id = req.usuario.id;

    const { rows } = await db.query(
      `SELECT p.*, c.origem, c.destino, c.horario_partida,
              CASE
                WHEN c.motorista_id = $1 THEN 'motorista'
                ELSE 'passageiro'
              END AS papel
       FROM pagamentos p
       JOIN solicitacoes_carona s ON s.id = p.solicitacao_id
       JOIN caronas c ON c.id = s.carona_id
       WHERE s.passageiro_id = $1 OR c.motorista_id = $1
       ORDER BY p.criado_em DESC`,
      [usuario_id]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

module.exports = { processar, historico, gerarPix };