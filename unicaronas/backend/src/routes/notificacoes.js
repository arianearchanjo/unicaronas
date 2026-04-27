const express = require('express');
const router  = express.Router();
const notificacoesController = require('../controllers/notificacoesController');
const { auth }    = require('../middleware/auth');

// GET /api/notificacoes - Listar notificações
router.get('/', auth, notificacoesController.listar);

// PATCH /api/notificacoes/:id/lida - Marcar como lida
router.patch('/:id/lida', auth, notificacoesController.marcarComoLida);

module.exports = router;
