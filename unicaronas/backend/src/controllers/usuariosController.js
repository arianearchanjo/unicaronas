const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const db     = require('../../config/database');

const BCRYPT_ROUNDS = 12;

/**
 * POST /api/usuarios
 * Cadastra novo usuário. Validação de campos é feita pelo middleware validar() na rota.
 */
const cadastrar = async (req, res, next) => {
  try {
    const { nome, email, matricula, senha, telefone, curso } = req.body;

    // Valida domínio de e-mail institucional
    const dominiosPermitidos = (process.env.EMAIL_DOMINIOS || '@uni.edu.br')
      .split(',')
      .map((d) => d.trim().toLowerCase());
    const emailNorm = email.toLowerCase();
    const emailValido = dominiosPermitidos.some((d) => emailNorm.endsWith(d));
    if (!emailValido) {
      return res.status(400).json({
        success: false,
        error: `Use um e-mail institucional (${dominiosPermitidos.join(', ')})`,
      });
    }

    // Verifica duplicidade por e-mail ou matrícula
    const { rows: existentes } = await db.query(
      'SELECT id FROM usuarios WHERE email = $1 OR matricula = $2',
      [emailNorm, matricula]
    );
    if (existentes.length > 0) {
      return res.status(409).json({ success: false, error: 'E-mail ou matrícula já cadastrados' });
    }

    const senhaHash = await bcrypt.hash(senha, BCRYPT_ROUNDS);

    const { rows } = await db.query(
      `INSERT INTO usuarios (nome, email, matricula, senha_hash, telefone, curso)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, nome, email, matricula, curso, criado_em`,
      [nome.trim(), emailNorm, matricula.trim(), senhaHash, telefone || null, curso || null]
    );

    res.status(201).json({
      success: true,
      data: rows[0],
      message: 'Usuário cadastrado com sucesso',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/usuarios/login
 */
const login = async (req, res, next) => {
  try {
    const { email, senha } = req.body;

    const { rows } = await db.query(
      'SELECT * FROM usuarios WHERE email = $1 AND ativo = true',
      [email.toLowerCase().trim()]
    );

    // Resposta genérica para não revelar se o e-mail existe
    const credenciaisInvalidas = () =>
      res.status(401).json({ success: false, error: 'Credenciais inválidas' });

    if (rows.length === 0) return credenciaisInvalidas();

    const usuario = rows[0];
    const senhaOk = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaOk) return credenciaisInvalidas();

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, nome: usuario.nome },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      data: {
        token,
        usuario: {
          id:               usuario.id,
          nome:             usuario.nome,
          email:            usuario.email,
          curso:            usuario.curso,
          avaliacao_media:  usuario.avaliacao_media,
          foto_url:         usuario.foto_url,
          dia_ead:          usuario.dia_ead,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/usuarios/:id
 * Requer autenticação. Retorna dados públicos + contagem de caronas.
 */
const buscarPorId = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ success: false, error: 'ID inválido' });
    }

    const { rows } = await db.query(
      `SELECT id, nome, email, curso, telefone, foto_url, dia_ead,
              avaliacao_media, total_avaliacoes, criado_em
       FROM usuarios
       WHERE id = $1 AND ativo = true`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
    }

    // Contagem de caronas como motorista
    const { rows: rowsMotorista } = await db.query(
      `SELECT COUNT(*) AS total
       FROM caronas
       WHERE motorista_id = $1 AND status IN ('concluida','ativa','em_andamento')`,
      [id]
    );

    // Contagem de caronas como passageiro
    const { rows: rowsPassageiro } = await db.query(
      `SELECT COUNT(*) AS total
       FROM solicitacoes_carona
       WHERE passageiro_id = $1 AND status = 'aceita'`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...rows[0],
        total_caronas_motorista:  parseInt(rowsMotorista[0].total, 10),
        total_caronas_passageiro: parseInt(rowsPassageiro[0].total, 10),
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/usuarios/perfil
 * Atualiza dados do próprio usuário autenticado.
 * Validação de campos feita pelo middleware validar() na rota.
 */
const atualizarPerfil = async (req, res, next) => {
  try {
    const id = req.usuario.id;
    const { nome, telefone, curso, dia_ead } = req.body;
    let { foto_url } = req.body;

    // Se houver arquivo enviado, gera a URL local
    if (req.file) {
      const baseUrl = process.env.API_URL || `${req.protocol}://${req.get('host')}`;
      foto_url = `${baseUrl}/uploads/profiles/${req.file.filename}`;
    }

    // Validação do dia_ead se fornecido
    let diaEadVal = undefined;
    if (dia_ead !== undefined && dia_ead !== '') {
      diaEadVal = parseInt(dia_ead, 10);
      if (isNaN(diaEadVal) || diaEadVal < 0 || diaEadVal > 6) {
        return res.status(400).json({ success: false, error: 'dia_ead deve ser entre 0 e 6' });
      }
    }

    const { rows } = await db.query(
      `UPDATE usuarios
       SET
         nome          = COALESCE($1, nome),
         telefone      = COALESCE($2, telefone),
         curso         = COALESCE($3, curso),
         foto_url      = COALESCE($4, foto_url),
         dia_ead       = COALESCE($5, dia_ead),
         atualizado_em = NOW()
       WHERE id = $6
       RETURNING id, nome, email, curso, telefone, foto_url, dia_ead`,
      [nome?.trim() || null, telefone?.trim() || null, curso?.trim() || null, foto_url || null, diaEadVal, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

module.exports = { cadastrar, login, buscarPorId, atualizarPerfil };