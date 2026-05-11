// backend/src/routes/mensagens.js
const router = require('express').Router();
const ctrl   = require('../controllers/mensagensController');
const typingCtrl = require('../controllers/mensagensDigitandoController');
const { auth }   = require('../middleware/auth');

router.post('/',          auth, ctrl.enviar);
router.get('/conversas',  auth, ctrl.listarConversas); // new inbox route
router.get('/nao-lidas',  auth, ctrl.contagemNaoLidas);

// US21 - Indicador de digitação
router.post('/digitando',      auth, typingCtrl.setTyping);
router.get('/:sid/digitando', auth, typingCtrl.getTyping);

router.get('/:id',        auth, ctrl.listar); // id can be solicitacao_id or destinatario_id

module.exports = router;
