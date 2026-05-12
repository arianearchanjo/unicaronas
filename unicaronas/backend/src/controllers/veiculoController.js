const db = require('../../config/database');

// POST /api/veiculos
const cadastrarVeiculo = async (req, res, next) => {
  try {
    const usuario_id = req.usuario.id;
    const { marca, modelo, ano, cor, placa, foto_url } = req.body;

    if (!marca || !modelo || !ano || !cor || !placa) {
      return res.status(400).json({ success: false, error: 'Todos os campos obrigatórios devem ser preenchidos.' });
    }

    const { rows } = await db.query(
      `INSERT INTO veiculos (usuario_id, marca, modelo, ano, cor, placa, foto_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [usuario_id, marca.trim(), modelo.trim(), parseInt(ano, 10), cor.trim(), placa.trim(), foto_url || null]
    );

    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

// GET /api/veiculos
const listarVeiculosDoUsuario = async (req, res, next) => {
  try {
    const usuario_id = req.usuario.id;
    const { rows } = await db.query(
      `SELECT * FROM veiculos WHERE usuario_id = $1 ORDER BY criado_em DESC`,
      [usuario_id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/veiculos/:id
const atualizarVeiculo = async (req, res, next) => {
  try {
    const usuario_id = req.usuario.id;
    const id = parseInt(req.params.id, 10);
    const { marca, modelo, ano, cor, placa, foto_url } = req.body;

    // Verificar se o veículo pertence ao usuário
    const check = await db.query('SELECT id FROM veiculos WHERE id = $1 AND usuario_id = $2', [id, usuario_id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Veículo não encontrado ou não autorizado.' });
    }

    const { rows } = await db.query(
      `UPDATE veiculos 
       SET marca = COALESCE($1, marca),
           modelo = COALESCE($2, modelo),
           ano = COALESCE($3, ano),
           cor = COALESCE($4, cor),
           placa = COALESCE($5, placa),
           foto_url = COALESCE($6, foto_url)
       WHERE id = $7 AND usuario_id = $8 RETURNING *`,
      [
        marca ? marca.trim() : null,
        modelo ? modelo.trim() : null,
        ano ? parseInt(ano, 10) : null,
        cor ? cor.trim() : null,
        placa ? placa.trim() : null,
        foto_url || null,
        id,
        usuario_id
      ]
    );

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/veiculos/:id
const deletarVeiculo = async (req, res, next) => {
  try {
    const usuario_id = req.usuario.id;
    const id = parseInt(req.params.id, 10);

    const { rows } = await db.query(
      `DELETE FROM veiculos WHERE id = $1 AND usuario_id = $2 RETURNING id`,
      [id, usuario_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Veículo não encontrado ou não autorizado.' });
    }

    res.json({ success: true, data: { message: 'Veículo removido com sucesso.' } });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  cadastrarVeiculo,
  listarVeiculosDoUsuario,
  atualizarVeiculo,
  deletarVeiculo
};
