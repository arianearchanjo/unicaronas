const express = require('express');
const router = express.Router();
const notificacoesController = require('../controllers/notificacoesController');
const { auth } = require('../middleware/auth');

// Todas as rotas de notificações exigem autenticação
router.use(auth);

// GET /api/notificacoes - Listar notificações do usuário
router.get('/', notificacoesController.listar);

// PATCH /api/notificacoes/todas - Marcar todas como lidas (DEVE VIR ANTES DE :id)
router.patch('/todas', notificacoesController.marcarTodasLidas);

// PATCH /api/notificacoes/:id/lida - Marcar uma específica como lida
router.patch('/:id/lida', notificacoesController.marcarLida);

module.exports = router;
