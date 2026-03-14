const router = require('express').Router();
const ctrl   = require('../controllers/caronasController');
const auth   = require('../middleware/auth');
const { validar } = require('../middleware/validacao');

const schemaCriar = {
  origem:          { required: true, type: 'string', maxLength: 200 },
  destino:         { required: true, type: 'string', maxLength: 200 },
  horario_partida: { required: true, type: 'string' },
  vagas_totais:    { required: true, type: 'integer', min: 1, max: 8 },
  valor_cobrado:   { required: true, type: 'number',  min: 0 },
};

const schemaResponder = {
  status: { required: true, type: 'string' },
};

router.get('/',                       ctrl.listar);
router.post('/',        auth, validar(schemaCriar),     ctrl.criar);
router.get('/:id',                    ctrl.buscarPorId);
router.post('/:id/solicitar', auth,   ctrl.solicitar);
router.patch('/solicitacoes/:id', auth, validar(schemaResponder), ctrl.responderSolicitacao);

module.exports = router;