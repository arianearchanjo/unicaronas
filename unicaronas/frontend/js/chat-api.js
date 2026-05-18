/**
 * UniCaronas — chat-api.js
 * Todas as chamadas fetch relacionadas ao chat.
 */

const ChatAPI = {
  async fetchAPI(path, options = {}) {
    const API_URL = (typeof window.API_URL !== 'undefined')
      ? window.API_URL
      : 'http://localhost:3000/api';

    const headers = { 'Content-Type': 'application/json', ...options.headers };
    
    // CSRF Protection para métodos mutantes
    if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(options.method?.toUpperCase())) {
      // getCsrfToken é global em api.js
      if (typeof getCsrfToken === 'function') {
        const csrfToken = await getCsrfToken();
        if (csrfToken) headers['X-CSRF-Token'] = csrfToken;
      }
    }

    const res = await fetch(`${API_URL}${path}`, { 
      ...options, 
      headers,
      credentials: 'include' // Envia cookies JWT e CSRF
    });

    if (res.status === 401) {
      if (typeof ChatPolling !== 'undefined') ChatPolling.parar();
      return { data: [] };
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  },

  async buscarConversas() {
    if (typeof isLogado === 'function' && !isLogado()) return [];
    
    const usuario = ChatState.usuario;
    try {
      const [resMotorista, resPassageiro] = await Promise.all([
        this.fetchAPI(`/caronas?motorista_id=${usuario.id}`),
        this.fetchAPI('/caronas'),
      ]);

      const todasCaronas = resMotorista.data || [];
      const caronasPublicas = resPassageiro.data || [];

      const solicitacoesPassageiro = await this.buscarSolicitacoesPassageiro(caronasPublicas, usuario.id);
      const solicitacoesMotorista = await this.buscarSolicitacoesMotorista(todasCaronas);

      return [...solicitacoesMotorista, ...solicitacoesPassageiro];
    } catch (err) {
      console.error('[ChatAPI] Erro ao buscar conversas:', err);
      return [];
    }
  },

  async buscarSolicitacoesPassageiro(caronas, userId) {
    const convs = [];
    for (const carona of caronas) {
      try {
        const res = await this.fetchAPI(`/caronas/${carona.id}/minha-solicitacao`);
        const sol = res.data;
        if (sol && sol.status === 'aceita' && sol.passageiro_id === userId) {
          convs.push({
            solicitacao_id: sol.id,
            titulo: `${carona.origem.split(',')[0]} → ${carona.destino.split(',')[0]}`,
            subtitulo: `Motorista: ${carona.motorista_nome}`,
            outraPessoa: carona.motorista_nome,
            mensagens: [],
            unread: 0,
          });
        }
      } catch (_) {}
    }
    return convs;
  },

  async buscarSolicitacoesMotorista(caronas) {
    const convs = [];
    for (const carona of caronas) {
      try {
        const res = await this.fetchAPI(`/caronas/${carona.id}/solicitacoes`);
        const aceitas = (res.data || []).filter(s => s.status === 'aceita');
        for (const sol of aceitas) {
          convs.push({
            solicitacao_id: sol.id,
            titulo: `${carona.origem.split(',')[0]} → ${carona.destino.split(',')[0]}`,
            subtitulo: `Passageiro: ${sol.passageiro_nome}`,
            outraPessoa: sol.passageiro_nome,
            mensagens: [],
            unread: 0,
          });
        }
      } catch (_) {}
    }
    return convs;
  },

  async buscarMensagens(solicitacaoId) {
    return this.fetchAPI(`/mensagens/${solicitacaoId}`);
  },

  async enviarMensagem(solicitacaoId, texto) {
    return this.fetchAPI('/mensagens', {
      method: 'POST',
      body: JSON.stringify({ solicitacao_id: solicitacaoId, conteudo: texto }),
    });
  },

  async reportarDigitando(solicitacaoId) {
    return this.fetchAPI('/mensagens/digitando', {
      method: 'POST',
      body: JSON.stringify({ solicitacao_id: solicitacaoId })
    });
  },

  async verificarDigitando(solicitacaoId) {
    return this.fetchAPI(`/mensagens/${solicitacaoId}/digitando`);
  }
};
