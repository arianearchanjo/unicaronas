const router = require('express').Router();
const ctrl   = require('../controllers/caronasController');
const waitCtrl = require('../controllers/listaEsperaController');
const { auth }   = require('../middleware/auth');
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

const schemaCancelar = {
  justificativa: { required: true, type: 'string', minLength: 5, maxLength: 500 },
};

router.get('/',                       ctrl.listar);
router.get('/solicitacoes/pendentes', auth, ctrl.solicitacoesPendentes);
router.get('/historico/:usuario_id', auth, ctrl.historico);
router.post('/',        auth, validar(schemaCriar),     ctrl.criar);
router.get('/:id',                    ctrl.buscarPorId);
router.get('/:id/comprovante', auth,   ctrl.gerarComprovante);
router.get('/:id/solicitacoes', auth,  ctrl.listarSolicitacoes);
router.get('/:id/minha-solicitacao', auth, ctrl.minhaSolicitacao);
router.post('/:id/solicitar', auth,   ctrl.solicitar);
router.post('/:id/espera', auth, waitCtrl.entrarNaFila);
router.patch('/:id/concluir', auth, ctrl.concluir);
router.patch('/:id/cancelar', auth, validar(schemaCancelar), ctrl.cancelar);
router.patch('/solicitacoes/:id', auth, validar(schemaResponder), ctrl.responderSolicitacao);

module.exports = router;
