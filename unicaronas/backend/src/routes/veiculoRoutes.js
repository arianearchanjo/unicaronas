const express = require('express');
const router = express.Router();
const veiculoController = require('../controllers/veiculoController');
const { auth: verificarToken } = require('../middleware/auth');

router.use(verificarToken);

router.post('/', veiculoController.cadastrarVeiculo);
router.get('/', veiculoController.listarVeiculosDoUsuario);
router.patch('/:id', veiculoController.atualizarVeiculo);
router.delete('/:id', veiculoController.deletarVeiculo);

module.exports = router;
