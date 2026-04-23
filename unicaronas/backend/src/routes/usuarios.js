const router = require('express').Router();
const ctrl   = require('../controllers/usuariosController');
const auth   = require('../middleware/auth');
const upload = require('../middleware/upload');
const { validar } = require('../middleware/validacao');

const schemasCadastro = {
  nome:        { required: true, type: 'string', minLength: 2, maxLength: 100 },
  email:       { required: true, type: 'string', maxLength: 150 },
  matricula:   { required: true, type: 'string', maxLength: 20 },
  senha:       { required: true, type: 'string', minLength: 6, maxLength: 100 },
  perfil_tipo: { required: true, type: 'string' },
  genero:      { type: 'string' },
};

const schemasLogin = {
  email: { required: true, type: 'string' },
  senha: { required: true, type: 'string' },
};

const schemaPerfil = {
  nome:        { type: 'string', minLength: 2, maxLength: 100 },
  telefone:    { type: 'string', maxLength: 20 },
  curso:       { type: 'string', maxLength: 100 },
  perfil_tipo: { type: 'string' },
  genero:      { type: 'string' },
};

router.post('/',        validar(schemasCadastro), ctrl.cadastrar);
router.post('/login',   validar(schemasLogin),    ctrl.login);
router.post('/recuperar-senha',                   ctrl.recuperarSenha);
router.get('/:id',      auth,                     ctrl.buscarPorId);
router.patch('/perfil', auth, upload.single('foto'), validar(schemaPerfil), ctrl.atualizarPerfil);
router.delete('/conta', auth,                     ctrl.deletarConta);

module.exports = router;