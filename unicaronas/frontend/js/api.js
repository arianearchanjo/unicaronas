/**
 * UniCaronas — cliente de API e utilitários compartilhados
 * Compatível com uso direto em browser (sem bundler/módulos ES).
 */

const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000/api'
  : '/api';

// ─── CSRF ─────────────────────────────────────────────────────────────────────

let cachedCsrfToken = null;

async function getCsrfToken() {
  if (cachedCsrfToken) return cachedCsrfToken;
  try {
    const res = await fetch(`${API_URL}/csrf-token`, { credentials: 'include' });
    const data = await res.json();
    cachedCsrfToken = data.csrfToken;
    return cachedCsrfToken;
  } catch (e) {
    console.error('Erro ao buscar token CSRF:', e);
    return null;
  }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

const getUser   = () => JSON.parse(localStorage.getItem('unicaronas_user') || 'null');
const setUser   = (u) => localStorage.setItem('unicaronas_user', JSON.stringify(u));
const clearUser = () => localStorage.removeItem('unicaronas_user');
const isLogado  = () => !!getUser();

// Modificado para chamar o endpoint de logout do backend
const logout = async () => {
  try {
    await api.logout();
  } catch (e) {
    console.error('Erro ao fazer logout no servidor:', e);
  } finally {
    clearUser();
    window.location.href = 'login.html';
  }
};

// Redireciona se não estiver logado (nome original mantido)
const protegerRota = () => {
  if (!isLogado()) {
    window.location.href = 'login.html';
    return false;
  }
  aplicarRegrasPerfil();
  return true;
};

const aplicarRegrasPerfil = () => {
  const u = getUser();
  if (!u) return;

  const tipo = u.perfil_tipo || 'misto';

  // Regras para Passageiro (estudante)
  if (tipo === 'estudante') {
    document.querySelectorAll('.role-motorista, #nav-oferecer-wrap, #nav-gerenciar-wrap').forEach(el => el.style.display = 'none');
  }
  
  // Regras para Motorista
  if (tipo === 'motorista') {
    document.querySelectorAll('.role-passageiro, #nav-buscar-wrap').forEach(el => el.style.display = 'none');
  }

  // Se for misto, garante que tudo apareça (exceto se houver lógica específica)
  if (tipo === 'misto') {
    document.querySelectorAll('#nav-oferecer-wrap, #nav-gerenciar-wrap, #nav-buscar-wrap').forEach(el => el.style.display = 'block');
  }

  // Proteção de acesso direto a páginas proibidas
  const path = window.location.pathname;
  if (tipo === 'estudante' && (path.includes('criar-carona.html') || path.includes('gerenciar-caronas.html'))) {
    window.location.href = 'dashboard.html';
  }
  if (tipo === 'motorista' && path.includes('buscar.html')) {
    window.location.href = 'dashboard.html';
  }
};

// ─── Requisição base ───────────────────────────────────────────────────────────

const request = async (path, options = {}) => {
  const headers = { ...options.headers };

  // Só define Content-Type se houver corpo e não for FormData
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  
  // CSRF Protection para métodos mutantes
  if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(options.method?.toUpperCase())) {
    const csrfToken = await getCsrfToken();
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }
  }

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, { 
      ...options, 
      headers,
      credentials: 'include'
    });
  } catch (e) {
    console.error(`[API Error] ${options.method || 'GET'} ${path}:`, e);
    const errorMsg = typeof t !== 'undefined' ? t('error-network') : 'Não foi possível conectar ao servidor. Verifique sua conexão.';
    // Evita múltiplos alertas iguais em curto intervalo
    if (!window._lastAlertTime || Date.now() - window._lastAlertTime > 2000) {
      showAlert(errorMsg, 'error');
      window._lastAlertTime = Date.now();
    }
    throw new Error(errorMsg);
  }

  // Se o servidor retornar 401, limpa o usuário e desloga (sessão expirada)
  if (response.status === 401 && !path.includes('/login')) {
    const errorMsg = typeof t !== 'undefined' ? t('error-session-expired') : 'Sua sessão expirou.';
    showAlert(errorMsg, 'error');
    clearUser();
    setTimeout(() => window.location.href = 'login.html', 2000);
    return;
  }

  const data = await response.json();

  if (!response.ok) {
    let msg = data.error;

    // Mapeamento de erros por status se não houver mensagem do servidor
    if (!msg) {
      if (response.status === 403) msg = typeof t !== 'undefined' ? t('error-unauthorized') : 'Acesso negado.';
      else if (response.status === 404) msg = typeof t !== 'undefined' ? t('error-not-found') : 'Não encontrado.';
      else if (response.status >= 500) msg = typeof t !== 'undefined' ? t('error-server') : 'Erro interno no servidor.';
      else msg = typeof t !== 'undefined' ? t('error-unexpected') : 'Erro inesperado.';
    }

    showAlert(msg, 'error');
    throw new Error(msg);
  }

  return data;
};

// ─── Endpoints ─────────────────────────────────────────────────────────────────

const api = {
  cadastrar:       (body) => request('/usuarios', { 
    method: 'POST', 
    body: body instanceof FormData ? body : JSON.stringify(body) 
  }),
  login:           (body) => request('/usuarios/login', { method: 'POST', body: JSON.stringify(body) }),
  logout:          ()     => request('/usuarios/logout', { method: 'POST' }),
  recuperarSenha:  (body) => request('/usuarios/recuperar-senha', { method: 'POST', body: JSON.stringify(body) }),
  redefinirSenha:  (body) => request('/usuarios/redefinir-senha', { method: 'POST', body: JSON.stringify(body) }),
  perfil:          (id)   => request(`/usuarios/${id}`),
  atualizarPerfil: (body) => request('/usuarios/perfil', { 
    method: 'PATCH', 
    body: body instanceof FormData ? body : JSON.stringify(body) 
  }),
  deletarConta:    ()     => request('/usuarios/conta', { method: 'DELETE' }),
  atualizarSenha:  (body) => request('/usuarios/senha', { method: 'PATCH', body: JSON.stringify(body) }),
  getEcoStats:     (id)   => request(`/usuarios/${id}/eco-stats`),

  listarCaronas: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''))
    ).toString();
    return request(`/caronas${qs ? '?' + qs : ''}`);
  },
  solicitacoesPendentes: () => request('/caronas/solicitacoes/pendentes'),
  getHistorico: (uid) => request(`/caronas/historico/${uid}`),
  solicitacoesCarona: (caronaId) => request(`/caronas/${caronaId}/solicitacoes`),
  criarCarona:          (body)       => request('/caronas', { method: 'POST', body: JSON.stringify(body) }),
  buscarCarona:         (id)         => request(`/caronas/${id}`),
  solicitarVaga:        (id)         => request(`/caronas/${id}/solicitar`, { method: 'POST' }),
  concluirCarona:       (id)         => request(`/caronas/${id}/concluir`, { method: 'PATCH' }),
  cancelarCarona:       (id, justificativa) => request(`/caronas/${id}/cancelar`, { 
    method: 'PATCH', 
    body: JSON.stringify({ justificativa }) 
  }),
  minhaSolicitacao:     (id)         => request(`/caronas/${id}/minha-solicitacao`),
  responderSolicitacao: (id, status) => request(`/caronas/solicitacoes/${id}`, {
    method: 'PATCH', body: JSON.stringify({ status }),
  }),
  entrarListaEspera:    (id)         => request(`/caronas/${id}/espera`, { method: 'POST' }),

  listarNotificacoes:   ()    => request('/notificacoes'),
  marcarNotificacao:    (id)  => request(`/notificacoes/${id}/lida`, { method: 'PATCH' }),
  marcarTodasNotif:     ()    => request('/notificacoes/todas', { method: 'PATCH' }),

  enviarMensagem:      (body) => request('/mensagens', { method: 'POST', body: JSON.stringify(body) }),
  listarMensagens:     (id, isUser = false)  => request(`/mensagens/${id}${isUser ? '?is_user=true' : ''}`),
  listarConversas:     ()     => request('/mensagens/conversas'),
  contagemNaoLidas:    ()     => request('/mensagens/nao-lidas'),

  // US21 - Indicador de digitação
  setDigitando: (solicitacao_id) => request('/mensagens/digitando', { 
    method: 'POST', 
    body: JSON.stringify({ solicitacao_id }) 
  }),
  getDigitando: (sid) => request(`/mensagens/${sid}/digitando`),

  pagar:               (body) => request('/pagamentos', { method: 'POST', body: JSON.stringify(body) }),
  historicoPagamentos: ()     => request('/pagamentos/historico'),

  avaliar:    (body) => request('/avaliacoes', { method: 'POST', body: JSON.stringify(body) }),
  avaliacoes: (uid)  => request(`/avaliacoes/${uid}`),

  // Veículos
  cadastrarVeiculo: (body) => request('/veiculos', { method: 'POST', body: JSON.stringify(body) }),
  listarVeiculos:   ()     => request('/veiculos'),
  atualizarVeiculo: (id, body) => request(`/veiculos/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deletarVeiculo:   (id)   => request(`/veiculos/${id}`, { method: 'DELETE' }),

  // Admin
  adminListarPendentes: () => request('/admin/usuarios/pendentes'),
  adminVerificarUsuario: (id, status) => request(`/admin/usuarios/${id}/verificar`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  }),
  reportarErro: (descricao) => request('/admin/erros', {
    method: 'POST',
    body: JSON.stringify({ descricao })
  }),
  adminListarErros: () => request('/admin/erros'),
  adminAtualizarErro: (id, status) => request(`/admin/erros/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  }),
};

// Polling global para badges
if (isLogado()) {
  setInterval(async () => {
    try {
      const res = await api.contagemNaoLidas();
      const badge = document.getElementById('nav-chat-badge');
      if (badge) {
        if (res.count > 0) {
          badge.textContent = res.count;
          badge.style.display = 'block';
        } else {
          badge.style.display = 'none';
        }
      }
    } catch (e) {}
  }, 10000);

  setInterval(async () => {
    try {
      const res = await api.solicitacoesPendentes();
      const badge = document.getElementById('nav-painel-badge');
      if (badge) {
        if (res.count > 0) {
          badge.textContent = res.count;
          badge.style.display = 'inline-flex';
        } else {
          badge.style.display = 'none';
        }
      }
    } catch (e) {}
  }, 30000);

  setInterval(async () => {
    try {
      const res = await api.listarNotificacoes();
      const naoLidas = res.data.filter(n => !n.lida).length;
      const badge = document.getElementById('nav-notificacoes-badge');
      if (badge) {
        if (naoLidas > 0) {
          badge.textContent = naoLidas;
          badge.style.display = 'inline-flex';
        } else {
          badge.style.display = 'none';
        }
      }
    } catch (e) {}
  }, 20000);
}

// ─── Utilitários ──────────────────────────────────────────────────────────────

const showAlert = (msg, tipo = 'success', containerId = 'alert-container') => {
  const el = document.getElementById(containerId);
  if (!el) return;

  let icone = '';
  if (tipo === 'error' || tipo === 'danger') {
    icone = `<svg class="icone-erro" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zm-7-4a1 1 0 10-2 0v3a1 1 0 002 0V6zm-1 7a1 1 0 100 2 1 1 0 000-2z" clip-rule="evenodd"/>
    </svg>`;
  } else if (tipo === 'success') {
    icone = `<svg class="icone-sucesso" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
    </svg>`;
  }

  el.innerHTML = `
    <div class="mensagem-${(tipo === 'error' || tipo === 'danger') ? 'erro' : 'sucesso'}" role="${(tipo === 'error' || tipo === 'danger') ? 'alert' : 'status'}" aria-live="polite">
      ${icone}
      ${msg}
    </div>
  `;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  setTimeout(() => { el.innerHTML = ''; }, 5000);
};

const formatarData = (iso) => {
  if (!iso) return 'Data não disponível';
  const data = new Date(iso);
  return isNaN(data.getTime()) ? 'Data inválida' : data.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
};

const formatarDataCurta = (iso) => {
  if (!iso) return 'Data não disponível';
  const data = new Date(iso);
  return isNaN(data.getTime()) ? 'Data inválida' : data.toLocaleDateString('pt-BR', { dateStyle: 'long' });
};

const formatarDataLonga = (iso) => {
  if (!iso) return 'Data não disponível';
  const data = new Date(iso);
  if (isNaN(data.getTime())) return 'Data inválida';
  return data.toLocaleString('pt-BR', { 
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', 
    hour: '2-digit', minute: '2-digit' 
  }).replace(',', ' às');
};

const formatarMoeda = (v) =>
  Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const calcularValorSugerido = (distancia_km) => {
  const precoGasolina = 5.50; // valor médio
  const kmPorLitro    = 10;   // consumo médio
  const taxaPercent   = 0.10; // 10%
  
  if (!distancia_km || distancia_km <= 0) return 0;

  const custoCombustivelTotal = (distancia_km / kmPorLitro) * precoGasolina;
  const valorBasePorPassageiro = custoCombustivelTotal / 4;
  const valorComTaxa = valorBasePorPassageiro * (1 + taxaPercent);

  return Math.round(valorComTaxa * 100) / 100;
};

const iniciais = (nome) =>
  nome?.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase() || '?';

const renderEstrelas = (nota, total) => {
  const n = Math.round(Number(nota) * 2) / 2;
  let html = `<span class="estrelas" aria-label="${nota} de 5 estrelas">`;
  for (let i = 1; i <= 5; i++) {
    if (i <= n)           html += '<span class="estrela estrela-cheia"></span>';
    else if (i - 0.5 ===n) html += '<span class="estrela estrela-meia"></span>';
    else                   html += '<span class="estrela estrela-vazia"></span>';
  }
  html += '</span>';
  if (total !== undefined) html += `<span class="estrelas-total">(${total})</span>`;
  return html;
};

const getParam = (nome) => new URLSearchParams(window.location.search).get(nome);
