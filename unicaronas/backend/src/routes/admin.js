const router = require('express').Router();
const ctrl   = require('../controllers/adminController');
const { auth, adminOnly } = require('../middleware/auth');

router.use(auth);

// Rota para qualquer usuário logado reportar erro
router.post('/erros', ctrl.reportarErro);

// Rotas exclusivas de admin
router.use(adminOnly);

router.get('/usuarios/pendentes', ctrl.listarPendentes);
router.patch('/usuarios/:id/verificar', ctrl.verificarDocumento);
router.get('/erros', ctrl.listarErros);
router.patch('/erros/:id', ctrl.atualizarStatusErro);

module.exports = router;
