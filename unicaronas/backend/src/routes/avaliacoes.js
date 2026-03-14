const router = require('express').Router();
const ctrl   = require('../controllers/avaliacoesController');
const auth   = require('../middleware/auth');
const { validar } = require('../middleware/validacao');

const schemaAvaliar = {
  solicitacao_id: { required: true, type: 'integer', min: 1 },
  avaliado_id:    { required: true, type: 'integer', min: 1 },
  nota:           { required: true, type: 'integer', min: 1, max: 5 },
  comentario:     { type: 'string', maxLength: 1000 },
};

router.post('/',           auth, validar(schemaAvaliar), ctrl.avaliar);
router.get('/:usuario_id',                               ctrl.listarPorUsuario);

module.exports = router;