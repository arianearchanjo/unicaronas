const usuariosService = require('../services/usuariosService');
const db = require('../../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const login = async (req, res, next) => {
  try {
    const { email, senha } = req.body;
    const { rows } = await db.query('SELECT * FROM usuarios WHERE email = $1', [email.toLowerCase()]);
    
    if (rows.length === 0 || !(await bcrypt.compare(senha, rows[0].senha_hash))) {
      return res.status(401).json({ success: false, error: 'Credenciais inválidas', code: 'AUTENTICACAO_FALHOU' });
    }

    const usuario = rows[0];
    const token = jwt.sign({ id: usuario.id, email: usuario.email, is_admin: usuario.is_admin }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

    res.json({ success: true, data: { token, usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil_tipo: usuario.perfil_tipo, email_verificado: usuario.email_verificado } } });
  } catch (err) {
    next(err);
  }
};

const cadastrar = async (req, res, next) => {
  try {
    const baseUrl = process.env.API_URL || `${req.protocol}://${req.get('host')}`;
    const novoUsuario = await usuariosService.cadastrar(req.body, req.files, baseUrl);
    res.status(201).json({ success: true, data: novoUsuario });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, error: err.message, code: err.code });
    next(err);
  }
};

const verificarEmail = async (req, res, next) => {
  try {
    const { email, token } = req.body;
    const resultado = await usuariosService.verificarEmail(email, token);
    res.json({ success: true, data: resultado });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, error: err.message, code: err.code });
    next(err);
  }
};

const reenviarToken = async (req, res, next) => {
  try {
    const { email } = req.body;
    const resultado = await usuariosService.reenviarToken(email);
    res.json({ success: true, data: resultado });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, error: err.message, code: err.code });
    next(err);
  }
};

const buscarPorId = async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT id, nome, email, matricula, telefone, foto_url, curso, dia_ead, perfil_tipo, avaliacao_media, total_avaliacoes, genero, status_verificacao, is_admin, email_verificado, instituicao_nome FROM usuarios WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, error: 'Usuário não encontrado', code: 'NAO_ENCONTRADO' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

const atualizarPerfil = async (req, res, next) => {
  try {
    const { nome, telefone, curso, perfil_tipo, genero } = req.body;
    const id = req.usuario.id;
    let foto_url = undefined;

    if (req.file) {
      const baseUrl = process.env.API_URL || `${req.protocol}://${req.get('host')}`;
      foto_url = `${baseUrl}/uploads/profiles/${req.file.filename}`;
    }

    const { rows } = await db.query(
      `UPDATE usuarios 
       SET nome = COALESCE($1, nome), 
           telefone = COALESCE($2, telefone), 
           curso = COALESCE($3, curso), 
           perfil_tipo = COALESCE($4, perfil_tipo), 
           genero = COALESCE($5, genero),
           foto_url = COALESCE($6, foto_url),
           atualizado_em = NOW()
       WHERE id = $7 RETURNING *`,
      [nome, telefone, curso, perfil_tipo, genero, foto_url, id]
    );

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

const ecoStats = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const stats = await usuariosService.getEcoStats(id);
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
};

const recuperarSenha = async (req, res, next) => {
  // Implementação simplificada mantendo compatibilidade
  res.status(501).json({ success: false, error: 'Não implementado nesta refatoração' });
};

const redefinirSenha = async (req, res, next) => {
  res.status(501).json({ success: false, error: 'Não implementado nesta refatoração' });
};

const atualizarSenha = async (req, res, next) => {
  try {
    const { senha_atual, nova_senha } = req.body;
    const { rows } = await db.query('SELECT senha_hash FROM usuarios WHERE id = $1', [req.usuario.id]);
    
    if (!(await bcrypt.compare(senha_atual, rows[0].senha_hash))) {
      return res.status(401).json({ success: false, error: 'Senha atual incorreta', code: 'SENHA_INVALIDA' });
    }

    const novaHash = await bcrypt.hash(nova_senha, 12);
    await db.query('UPDATE usuarios SET senha_hash = $1 WHERE id = $2', [novaHash, req.usuario.id]);
    res.json({ success: true, data: { mensagem: 'Senha atualizada com sucesso' } });
  } catch (err) {
    next(err);
  }
};

const deletarConta = async (req, res, next) => {
  try {
    await db.query('DELETE FROM usuarios WHERE id = $1', [req.usuario.id]);
    res.json({ success: true, data: { mensagem: 'Conta removida com sucesso' } });
  } catch (err) {
    next(err);
  }
};

module.exports = { cadastrar, login, buscarPorId, atualizarPerfil, ecoStats, verificarEmail, reenviarToken, recuperarSenha, redefinirSenha, atualizarSenha, deletarConta };
