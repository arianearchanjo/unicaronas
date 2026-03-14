const router = require('express').Router();
const ctrl   = require('../controllers/usuariosController');
const auth   = require('../middleware/auth');
const { validar } = require('../middleware/validacao');

const schemasCadastro = {
  nome:      { required: true, type: 'string', minLength: 2, maxLength: 100 },
  email:     { required: true, type: 'string', maxLength: 150 },
  matricula: { required: true, type: 'string', maxLength: 20 },
  senha:     { required: true, type: 'string', minLength: 6, maxLength: 100 },
};

const schemasLogin = {
  email: { required: true, type: 'string' },
  senha: { required: true, type: 'string' },
};

const schemaPerfil = {
  nome:     { type: 'string', minLength: 2, maxLength: 100 },
  telefone: { type: 'string', maxLength: 20 },
  curso:    { type: 'string', maxLength: 100 },
  foto_url: { type: 'string', maxLength: 255 },
};

router.post('/',        validar(schemasCadastro), ctrl.cadastrar);
router.post('/login',   validar(schemasLogin),    ctrl.login);
router.get('/:id',      auth,                     ctrl.buscarPorId);
router.patch('/perfil', auth, validar(schemaPerfil), ctrl.atualizarPerfil);

module.exports = router;