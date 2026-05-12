// backend/src/controllers/mensagensDigitandoController.js

// Cache em memória: { "solicitacao_id": { "usuario_id": timestamp } }
const typingCache = {};

// Limpeza automática a cada 10 segundos
setInterval(() => {
  const agora = Date.now();
  for (const sid in typingCache) {
    for (const uid in typingCache[sid]) {
      if (agora - typingCache[sid][uid] > 3000) {
        delete typingCache[sid][uid];
      }
    }
    if (Object.keys(typingCache[sid]).length === 0) {
      delete typingCache[sid];
    }
  }
}, 10000);

/**
 * POST /api/mensagens/digitando
 * Informa que o usuário está digitando em uma conversa
 */
const setTyping = (req, res) => {
  const { solicitacao_id } = req.body;
  const usuario_id = req.usuario.id;

  if (!solicitacao_id) {
    return res.status(400).json({ success: false, error: 'solicitacao_id é obrigatório' });
  }

  if (!typingCache[solicitacao_id]) {
    typingCache[solicitacao_id] = {};
  }

  typingCache[solicitacao_id][usuario_id] = Date.now();
  
  res.json({ success: true });
};

/**
 * GET /api/mensagens/:sid/digitando
 * Retorna quem está digitando na conversa (exceto o próprio usuário)
 */
const getTyping = (req, res) => {
  const { sid } = req.params;
  const usuario_id = req.usuario.id;
  const agora = Date.now();

  if (!typingCache[sid]) {
    return res.json({ success: true, typing: false });
  }

  const typingUsers = [];
  for (const uid in typingCache[sid]) {
    if (parseInt(uid) !== usuario_id && agora - typingCache[sid][uid] <= 3000) {
      typingUsers.push(parseInt(uid));
    }
  }

  res.json({ 
    success: true, 
    data: {
      typing: typingUsers.length > 0,
      users: typingUsers 
    }
  });
};

module.exports = { setTyping, getTyping };
