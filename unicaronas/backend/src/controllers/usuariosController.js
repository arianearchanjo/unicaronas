const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const db     = require('../../config/database');
const mailService = require('../services/mailService');

const BCRYPT_ROUNDS = 12;

/**
 * POST /api/usuarios
 */
const cadastrar = async (req, res, next) => {
  try {
    const { nome, email, matricula, senha, telefone, curso, dia_ead, perfil_tipo, veiculo, genero } = req.body;

    // Se vier de FormData, os campos de veículo podem estar achatados
    let dadosVeiculo = veiculo;
    if (typeof veiculo === 'string') {
      try { dadosVeiculo = JSON.parse(veiculo); } catch(e) {}
    }
    if (!dadosVeiculo && req.body['veiculo[marca]']) {
      dadosVeiculo = {
        marca:  req.body['veiculo[marca]'],
        modelo: req.body['veiculo[modelo]'],
        ano:    req.body['veiculo[ano]'],
        cor:    req.body['veiculo[cor]'],
        placa:  req.body['veiculo[placa]']
      };
    }

    const dominiosPermitidos = (process.env.EMAIL_DOMINIOS || '@unibrasil.com.br')
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

    const { rows: existentes } = await db.query(
      'SELECT id FROM usuarios WHERE email = $1 OR matricula = $2',
      [emailNorm, matricula.trim()]
    );
    if (existentes.length > 0) {
      return res.status(409).json({ success: false, error: 'E-mail ou matrícula já cadastrados' });
    }

    let diaEadVal = null;
    if (dia_ead !== undefined && dia_ead !== null && dia_ead !== '') {
      diaEadVal = parseInt(dia_ead, 10);
      if (isNaN(diaEadVal) || diaEadVal < 0 || diaEadVal > 6) {
        return res.status(400).json({ success: false, error: 'dia_ead deve ser entre 0 e 6' });
      }
    }

    // Processa arquivos de documentos
    let cnh_url = null;
    let identidade_url = null;
    const baseUrl = process.env.API_URL || `${req.protocol}://${req.get('host')}`;

    if (req.files) {
      if (req.files.cnh && req.files.cnh[0]) {
        cnh_url = `${baseUrl}/uploads/documentos/${req.files.cnh[0].filename}`;
      }
      if (req.files.identidade && req.files.identidade[0]) {
        identidade_url = `${baseUrl}/uploads/documentos/${req.files.identidade[0].filename}`;
      }
    }

    const senhaHash = await bcrypt.hash(senha, BCRYPT_ROUNDS);

    const client = await db.connect();
    try {
      await client.query('BEGIN');

      const resUser = await client.query(
        `INSERT INTO usuarios (nome, email, matricula, senha_hash, telefone, curso, dia_ead, perfil_tipo, genero, cnh_url, identidade_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING id, nome, email, matricula, curso, dia_ead, perfil_tipo, genero, criado_em, status_verificacao, is_admin`,
        [
          nome.trim(), 
          emailNorm, 
          matricula.trim(), 
          senhaHash, 
          telefone || null, 
          curso || null, 
          diaEadVal, 
          perfil_tipo || 'misto', 
          genero || null,
          cnh_url,
          identidade_url
        ]
      );

      const novoUsuario = resUser.rows[0];

      if ((perfil_tipo === 'motorista' || perfil_tipo === 'misto') && dadosVeiculo && dadosVeiculo.marca && dadosVeiculo.placa) {
        await client.query(
          `INSERT INTO veiculos (usuario_id, marca, modelo, ano, cor, placa)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [novoUsuario.id, dadosVeiculo.marca.trim(), dadosVeiculo.modelo.trim(), parseInt(dadosVeiculo.ano), dadosVeiculo.cor.trim(), dadosVeiculo.placa.trim()]
        );
      }

      await client.query('COMMIT');

      const token = jwt.sign(
        { id: novoUsuario.id, email: novoUsuario.email, nome: novoUsuario.nome, perfil_tipo: novoUsuario.perfil_tipo, is_admin: novoUsuario.is_admin },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        success: true,
        data: {
          token,
          usuario: {
            id:                 novoUsuario.id,
            nome:               novoUsuario.nome,
            email:              novoUsuario.email,
            curso:              novoUsuario.curso,
            dia_ead:            novoUsuario.dia_ead,
            perfil_tipo:        novoUsuario.perfil_tipo,
            genero:             novoUsuario.genero,
            status_verificacao: novoUsuario.status_verificacao,
            is_admin:           novoUsuario.is_admin
          },
          message: 'Usuário cadastrado com sucesso'
        }
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/usuarios/recuperar-senha
 */
const recuperarSenha = async (req, res, next) => {
  try {
    const { email } = req.body;
    const emailNorm = email.toLowerCase().trim();

    // 1. Validar se o e-mail existe
    const { rows } = await db.query('SELECT id, nome FROM usuarios WHERE email = $1 AND ativo = true', [emailNorm]);
    
    // Para evitar user enumeration, sempre retornamos sucesso
    const successResponse = () => res.json({ 
      success: true, 
      data: { message: 'Se o e-mail informado estiver cadastrado, você receberá as instruções de recuperação em instantes.' }
    });

    if (rows.length === 0) {
      return successResponse();
    }

    const usuario = rows[0];

    // 2. Gerar um token seguro (32 bytes = 64 hex chars)
    const token = crypto.randomBytes(32).toString('hex');
    
    // 3. Salvar o hash do token no banco (Segurança: se o DB vazar, o token original não é exposto)
    // Usamos bcrypt para seguir a recomendação do usuário
    const tokenHash = await bcrypt.hash(token, 10);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos

    await db.query(
      'INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [usuario.id, tokenHash, expiresAt]
    );

    // 4. Chamar o mailService para enviar o link
    const resetLink = `${process.env.FRONTEND_URL}/reset-password.html?token=${token}&email=${encodeURIComponent(emailNorm)}`;
    
    // Enviamos o e-mail de forma assíncrona para não travar a resposta da API
    mailService.sendResetEmail(emailNorm, resetLink).catch(err => {
      console.error(`[RecuperarSenha] Falha ao enviar e-mail para ${emailNorm}:`, err);
    });

    return successResponse();
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/usuarios/conta
 */
const deletarConta = async (req, res, next) => {
  try {
    const usuario_id = req.usuario.id;
    await db.query('DELETE FROM usuarios WHERE id = $1', [usuario_id]);
    res.json({ success: true, data: { message: 'Conta excluída com sucesso.' } });
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

    const credenciaisInvalidas = () =>
      res.status(401).json({ success: false, error: 'Credenciais inválidas' });

    if (rows.length === 0) return credenciaisInvalidas();

    const usuario = rows[0];
    const senhaOk = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaOk) return credenciaisInvalidas();

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, nome: usuario.nome, perfil_tipo: usuario.perfil_tipo, is_admin: usuario.is_admin },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      data: {
        token,
        usuario: {
          id:                 usuario.id,
          nome:               usuario.nome,
          email:              usuario.email,
          curso:              usuario.curso,
          avaliacao_media:  usuario.avaliacao_media,
          foto_url:         usuario.foto_url,
          dia_ead:          usuario.dia_ead,
          perfil_tipo:      usuario.perfil_tipo,
          genero:           usuario.genero,
          status_verificacao: usuario.status_verificacao,
          is_admin:           usuario.is_admin,
          forcar_reset:       usuario.forcar_reset
        },
      },
    });
    } catch (err) {
    next(err);
    }
    };

    /**
    * GET /api/usuarios/:id
    */
    const buscarPorId = async (req, res, next) => {
    try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ success: false, error: 'ID inválido' });
    }

    const { rows } = await db.query(
      `SELECT id, nome, email, curso, telefone, foto_url, dia_ead, perfil_tipo,
              avaliacao_media, total_avaliacoes, criado_em, genero, status_verificacao, is_admin
       FROM usuarios
       WHERE id = $1 AND ativo = true`,
      [id]
    );


    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
    }

    const { rows: rowsMotorista } = await db.query(
      `SELECT COUNT(*) AS total
       FROM caronas
       WHERE motorista_id = $1 AND status IN ('concluida','ativa','em_andamento')`,
      [id]
    );

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
 */
const atualizarPerfil = async (req, res, next) => {
  try {
    const id = req.usuario.id;
    const { 
      nome, telefone, curso, dia_ead, perfil_tipo, genero
    } = req.body;
    let { foto_url } = req.body;

    if (req.file) {
      const baseUrl = process.env.API_URL || `${req.protocol}://${req.get('host')}`;
      foto_url = `${baseUrl}/uploads/profiles/${req.file.filename}`;
    }

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
         nome                   = COALESCE($1, nome),
         telefone               = COALESCE($2, telefone),
         curso                  = COALESCE($3, curso),
         foto_url               = COALESCE($4, foto_url),
         dia_ead                = COALESCE($5, dia_ead),
         perfil_tipo            = COALESCE($6, perfil_tipo),
         genero                 = COALESCE($7, genero),
         atualizado_em          = NOW()
       WHERE id = $8
       RETURNING id, nome, email, curso, telefone, foto_url, dia_ead, perfil_tipo, genero`,
      [
        nome?.trim() || null, 
        telefone?.trim() || null, 
        curso?.trim() || null, 
        foto_url || null, 
        diaEadVal !== undefined ? diaEadVal : null,
        perfil_tipo || null, 
        genero || null,
        id
      ]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/usuarios/senha
 */
const atualizarSenha = async (req, res, next) => {
  try {
    const id = req.usuario.id;
    const { senha } = req.body;

    console.log(`[Auth] Tentativa de atualização de senha para usuário ID: ${id}`);

    if (!senha || senha.length < 8) {
      return res.status(400).json({ success: false, error: 'A senha deve ter no mínimo 8 caracteres' });
    }

    const senhaHash = await bcrypt.hash(senha, BCRYPT_ROUNDS);

    await db.query(
      'UPDATE usuarios SET senha_hash = $1, forcar_reset = false, atualizado_em = NOW() WHERE id = $2',
      [senhaHash, id]
    );

    console.log(`[Auth] Senha atualizada com sucesso para usuário ID: ${id}`);

    res.json({ success: true, data: { message: 'Senha atualizada com sucesso' } });
  } catch (err) {
    console.error(`[Auth] Erro ao atualizar senha para usuário ID: ${req.usuario?.id}:`, err);
    next(err);
  }
};

/**
 * POST /api/usuarios/redefinir-senha
 */
const redefinirSenha = async (req, res, next) => {
  try {
    const { email, token, novaSenha } = req.body;

    if (!novaSenha || novaSenha.length < 8) {
      return res.status(400).json({ success: false, error: 'A nova senha deve ter no mínimo 8 caracteres' });
    }

    const emailNorm = email.toLowerCase().trim();

    // 1. Buscar usuário
    const { rows: userRows } = await db.query('SELECT id FROM usuarios WHERE email = $1 AND ativo = true', [emailNorm]);
    if (userRows.length === 0) {
      return res.status(400).json({ success: false, error: 'Solicitação inválida ou expirada.' });
    }
    const usuarioId = userRows[0].id;

    // 2. Buscar tokens válidos para este usuário
    const { rows: tokenRows } = await db.query(
      'SELECT id, token FROM password_resets WHERE user_id = $1 AND expires_at > NOW() ORDER BY created_at DESC',
      [usuarioId]
    );

    if (tokenRows.length === 0) {
      return res.status(400).json({ success: false, error: 'O link de recuperação expirou ou é inválido.' });
    }

    // 3. Verificar se o token fornecido bate com algum hash no banco
    let tokenValido = null;
    for (const row of tokenRows) {
      const match = await bcrypt.compare(token, row.token);
      if (match) {
        tokenValido = row;
        break;
      }
    }

    if (!tokenValido) {
      return res.status(400).json({ success: false, error: 'O link de recuperação é inválido.' });
    }

    // 4. Atualizar a senha
    const senhaHash = await bcrypt.hash(novaSenha, BCRYPT_ROUNDS);
    
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        'UPDATE usuarios SET senha_hash = $1, forcar_reset = false, atualizado_em = NOW() WHERE id = $2',
        [senhaHash, usuarioId]
      );

      // 5. Deletar todos os tokens de reset do usuário (invalidar outros links antigos)
      await client.query('DELETE FROM password_resets WHERE user_id = $1', [usuarioId]);

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    res.json({ success: true, data: { message: 'Senha redefinida com sucesso! Você já pode fazer login.' } });
  } catch (err) {
    next(err);
  }
};

module.exports = { cadastrar, login, buscarPorId, atualizarPerfil, deletarConta, recuperarSenha, atualizarSenha, redefinirSenha };
