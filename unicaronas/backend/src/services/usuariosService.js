const db = require('../../config/database');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const mailService = require('./mailService');
const domains = require('../config/domains.json');

const BCRYPT_ROUNDS = 12;

const usuariosService = {
  async cadastrar(dados, files, baseUrl) {
    const { nome, email, matricula, senha, telefone, curso, dia_ead, perfil_tipo, veiculo, genero } = dados;
    const emailNorm = email.toLowerCase();
    const dominio = emailNorm.split('@')[1];

    if (!domains.includes(dominio)) {
      throw { status: 400, message: "Use seu e-mail institucional.", code: "DOMINIO_INVALIDO" };
    }

    const { rows: existentes } = await db.query(
      'SELECT id FROM usuarios WHERE email = $1 OR matricula = $2',
      [emailNorm, matricula.trim()]
    );
    if (existentes.length > 0) {
      throw { status: 409, message: 'E-mail ou matrícula já cadastrados', code: "CONTA_EXISTENTE" };
    }

    const senhaHash = await bcrypt.hash(senha, BCRYPT_ROUNDS);
    
    let cnh_url = null;
    let identidade_url = null;
    if (files) {
      if (files.cnh && files.cnh[0]) cnh_url = `${baseUrl}/uploads/documentos/${files.cnh[0].filename}`;
      if (files.identidade && files.identidade[0]) identidade_url = `${baseUrl}/uploads/documentos/${files.identidade[0].filename}`;
    }

    const client = await db.connect();
    try {
      await client.query('BEGIN');

      const resUser = await client.query(
        `INSERT INTO usuarios (nome, email, matricula, senha_hash, telefone, curso, dia_ead, perfil_tipo, genero, cnh_url, identidade_url, instituicao_nome)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING id, nome, email, matricula, curso, dia_ead, perfil_tipo, genero, criado_em, status_verificacao, is_admin`,
        [nome.trim(), emailNorm, matricula.trim(), senhaHash, telefone || null, curso || null, dia_ead || null, perfil_tipo || 'misto', genero || null, cnh_url, identidade_url, dominio]
      );

      const novoUsuario = resUser.rows[0];

      // Token de verificação
      const token = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await client.query(
        'INSERT INTO verification_tokens (usuario_id, token, expires_at) VALUES ($1, $2, $3)',
        [novoUsuario.id, token, expiresAt]
      );

      await mailService.sendVerificationEmail(emailNorm, token);

      await client.query('COMMIT');
      return novoUsuario;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async verificarEmail(email, token) {
    const { rows } = await db.query(
      `SELECT vt.*, u.id as user_id, u.email as user_email
       FROM verification_tokens vt
       JOIN usuarios u ON u.id = vt.usuario_id
       WHERE u.email = $1 AND vt.token = $2 AND vt.used = FALSE AND vt.expires_at > NOW()`,
      [email.toLowerCase(), token]
    );

    if (rows.length === 0) {
      throw { status: 400, message: "Token inválido ou expirado.", code: "TOKEN_INVALIDO" };
    }

    const verification = rows[0];
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      await client.query('UPDATE verification_tokens SET used = TRUE WHERE id = $1', [verification.id]);
      await client.query('UPDATE usuarios SET email_verificado = TRUE WHERE id = $1', [verification.user_id]);
      await client.query('COMMIT');
      return { mensagem: "E-mail verificado com sucesso." };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async reenviarToken(email) {
    const { rows } = await db.query('SELECT id, email FROM usuarios WHERE email = $1', [email.toLowerCase()]);
    if (rows.length === 0) {
      throw { status: 404, message: "Usuário não encontrado.", code: "USUARIO_NAO_ENCONTRADO" };
    }

    const usuario = rows[0];
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const client = await db.connect();
    try {
      await client.query('BEGIN');
      await client.query('UPDATE verification_tokens SET used = TRUE WHERE usuario_id = $1', [usuario.id]);
      await client.query('INSERT INTO verification_tokens (usuario_id, token, expires_at) VALUES ($1, $2, $3)', [usuario.id, token, expiresAt]);
      await mailService.sendVerificationEmail(usuario.email, token);
      await client.query('COMMIT');
      return { mensagem: "Novo token enviado." };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async getEcoStats(usuario_id) {
    const { rows: caronas } = await db.query(
      `SELECT c.distancia_km, c.motorista_id, s.passageiro_id
       FROM caronas c
       LEFT JOIN solicitacoes_carona s ON s.carona_id = c.id AND s.status = 'aceita'
       WHERE c.status = 'concluida' AND (c.motorista_id = $1 OR s.passageiro_id = $1)`,
      [usuario_id]
    );

    let km_total = 0;
    caronas.forEach(c => {
      km_total += parseFloat(c.distancia_km || 0);
    });

    return {
      km_total: parseFloat(km_total.toFixed(2)),
      co2_evitado_kg: parseFloat((km_total * 0.12).toFixed(2)),
      economia_reais: parseFloat((km_total * 0.70).toFixed(2))
    };
  }
};

module.exports = usuariosService;
