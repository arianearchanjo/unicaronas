/**
 * unicaronas/backend/src/routes/pagamentos.js
 */
const router = require('express').Router();
const ctrl   = require('../controllers/pagamentosController');
const { auth }   = require('../middleware/auth');

// Gera payload Pix + QR Code para uma solicitação aceita
router.get('/pix/:solicitacao_id', auth, ctrl.gerarPix);

// Registra o pagamento (após o passageiro confirmar)
router.post('/', auth, ctrl.processar);

// Histórico financeiro do usuário
router.get('/historico', auth, ctrl.historico);

module.exports = router;