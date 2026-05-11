/**
 * UniCaronas — chat-global.js
 * Chat em tempo real global com polling a cada 5s.
 * Acessível em qualquer página da aplicação.
 */

(function () {
  'use strict';

  // ── Estado ──────────────────────────────────────────────────────────────────
  const STATE = {
    conversas: [],       // [{ solicitacao_id, titulo, unread, mensagens[] }]
    ativa: null,         // id da conversa aberta
    aberto: false,
    pollingId: null,
    typingPollingId: null,
    lastTypingSent: 0,
    inicializado: false,
    usuario: null,
  };

  // ── Constantes ───────────────────────────────────────────────────────────────
  const POLL_INTERVAL = 3000;
  const STORAGE_KEY   = 'unicaronas_chat_aberto';

  // ── Inicialização ────────────────────────────────────────────────────────────
  function init() {
    if (STATE.inicializado) return;
    STATE.usuario = getUser();
    if (!STATE.usuario || !isLogado()) return;

    injetarHTML();
    injetarCSS();
    bindEventos();
    carregarConversas();
    iniciarPolling();
    STATE.inicializado = true;

    // Restaurar estado aberto
    if (localStorage.getItem(STORAGE_KEY) === '1') {
      setTimeout(() => abrirChat(), 300);
    }
  }

  // ── HTML do Widget ───────────────────────────────────────────────────────────
  function injetarHTML() {
    const div = document.createElement('div');
    div.id = 'uc-chat-root';
    div.innerHTML = `
      <!-- Botão flutuante -->
      <button id="uc-chat-fab" aria-label="Abrir chat" title="Chat">
        <svg id="uc-fab-icon-chat" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <svg id="uc-fab-icon-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="display:none">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
        <span id="uc-badge" class="uc-badge" style="display:none">0</span>
      </button>

      <!-- Painel do chat -->
      <div id="uc-chat-panel" class="uc-panel" aria-label="Chat" role="dialog" style="display:none">
        <!-- Header -->
        <div class="uc-panel-header">
          <div id="uc-panel-title" class="uc-panel-title">
            <span id="uc-title-text">Mensagens</span>
            <span id="uc-status-dot" class="uc-status-dot"></span>
          </div>
          <div style="display:flex;gap:.4rem">
            <button id="uc-btn-back" class="uc-icon-btn" title="Voltar" style="display:none" aria-label="Voltar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <button id="uc-btn-minimize" class="uc-icon-btn" title="Minimizar" aria-label="Minimizar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" width="16" height="16">
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Lista de conversas -->
        <div id="uc-lista-conversas" class="uc-screen" style="position:relative;">
          <div id="uc-conversas-inner" style="flex:1; overflow-y:auto; padding-bottom: 50px;">
            <div class="uc-loading">
              <div class="uc-spinner"></div>
            </div>
          </div>
          <div style="position:absolute; bottom:0; left:0; width:100%; padding:0.5rem; background: var(--surface); border-top: 1px solid var(--border);">
            <button class="btn btn-ghost btn-sm btn-full" onclick="window.location.href='mensagens.html'" style="color: var(--accent); font-weight: 600; display:flex; align-items:center; justify-content:center; gap:0.5rem;">
              Ver histórico completo
            </button>
          </div>
        </div>

        <!-- Tela de mensagens -->
        <div id="uc-tela-msgs" class="uc-screen" style="display:none;flex-direction:column">
          <div id="uc-msgs-container" class="uc-msgs"></div>
          <div id="uc-typing-indicator" style="display:none; padding: 0.2rem 1rem; font-size: 0.75rem; color: var(--text-3); font-style: italic;">
            alguém está digitando...
          </div>
          <div class="uc-input-wrap">
            <input id="uc-input" class="uc-input" type="text" placeholder="Digite uma mensagem..." autocomplete="off" maxlength="1000">
            <button id="uc-btn-send" class="uc-btn-send" aria-label="Enviar">
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(div);
  }

  // ── CSS injetado ─────────────────────────────────────────────────────────────
  function injetarCSS() {
    if (document.getElementById('uc-chat-style')) return;
    const style = document.createElement('style');
    style.id = 'uc-chat-style';
    style.textContent = `
      /* ── FAB ───────────────────────────────────── */
      #uc-chat-fab {
        position: fixed;
        bottom: 1.75rem;
        right: 1.75rem;
        z-index: 9998;
        width: 54px;
        height: 54px;
        border-radius: 50%;
        background: var(--accent, #6c63ff);
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 24px rgba(108,99,255,.45);
        transition: transform .2s, box-shadow .2s, background .2s;
        color: #fff;
      }
      #uc-chat-fab:hover {
        transform: scale(1.08);
        box-shadow: 0 6px 32px rgba(108,99,255,.6);
        background: var(--accent-2, #8b84ff);
      }
      #uc-chat-fab:active { transform: scale(.95); }
      #uc-chat-fab svg { width: 22px; height: 22px; }

      /* Badge de não lidos */
      .uc-badge {
        position: absolute;
        top: -3px;
        right: -3px;
        background: #ff5c5c;
        color: #fff;
        font-size: .65rem;
        font-weight: 800;
        width: 19px;
        height: 19px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: var(--font, sans-serif);
        letter-spacing: 0;
        border: 2px solid var(--bg, #0a0a0f);
        animation: uc-pop .25s ease;
      }
      @keyframes uc-pop {
        0%   { transform: scale(0); }
        70%  { transform: scale(1.2); }
        100% { transform: scale(1); }
      }

      /* ── Painel ────────────────────────────────── */
      .uc-panel {
        position: fixed;
        bottom: calc(1.75rem + 54px + .75rem);
        right: 1.75rem;
        z-index: 9999;
        width: 340px;
        max-height: 520px;
        background: var(--surface, #1c1c25);
        border: 1px solid var(--border, #2a2a38);
        border-radius: 18px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        box-shadow: 0 16px 56px rgba(0,0,0,.7), 0 0 0 1px rgba(108,99,255,.08);
        animation: uc-slide-up .22s cubic-bezier(.34,1.56,.64,1);
      }
      @keyframes uc-slide-up {
        from { opacity: 0; transform: translateY(20px) scale(.96); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
      }

      /* Header */
      .uc-panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: .9rem 1rem .9rem 1.1rem;
        border-bottom: 1px solid var(--border, #2a2a38);
        background: var(--surface, #1c1c25);
        flex-shrink: 0;
      }
      .uc-panel-title {
        display: flex;
        align-items: center;
        gap: .5rem;
        font-size: .88rem;
        font-weight: 700;
        color: var(--text, #f0f0f5);
        font-family: var(--font, sans-serif);
        letter-spacing: -.2px;
      }
      .uc-status-dot {
        width: 7px; height: 7px;
        border-radius: 50%;
        background: var(--green, #22d3a0);
        animation: uc-pulse 2s infinite;
        flex-shrink: 0;
      }
      @keyframes uc-pulse {
        0%, 100% { opacity: 1; }
        50%       { opacity: .45; }
      }
      .uc-icon-btn {
        background: transparent;
        border: none;
        cursor: pointer;
        color: var(--text-3, #55556a);
        padding: .3rem;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background .15s, color .15s;
        line-height: 1;
      }
      .uc-icon-btn:hover {
        background: var(--bg-3, #16161e);
        color: var(--text, #f0f0f5);
      }

      /* Screens */
      .uc-screen {
        flex: 1;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        min-height: 0;
      }

      /* Lista de conversas */
      #uc-conversas-inner {
        overflow-y: auto;
        flex: 1;
      }
      #uc-conversas-inner::-webkit-scrollbar { width: 4px; }
      #uc-conversas-inner::-webkit-scrollbar-track { background: transparent; }
      #uc-conversas-inner::-webkit-scrollbar-thumb { background: var(--border, #2a2a38); border-radius: 4px; }

      .uc-conversa-item {
        display: flex;
        align-items: center;
        gap: .75rem;
        padding: .85rem 1.1rem;
        cursor: pointer;
        transition: background .15s;
        border-bottom: 1px solid var(--border, #2a2a38);
        position: relative;
      }
      .uc-conversa-item:last-child { border-bottom: none; }
      .uc-conversa-item:hover { background: var(--bg-3, #16161e); }

      .uc-conv-avatar {
        width: 38px; height: 38px;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--accent, #6c63ff), #22d3a0);
        color: #fff;
        display: flex; align-items: center; justify-content: center;
        font-size: .78rem; font-weight: 700;
        font-family: var(--font-mono, monospace);
        flex-shrink: 0;
        text-transform: uppercase;
      }
      .uc-conv-info { flex: 1; min-width: 0; }
      .uc-conv-titulo {
        font-size: .85rem; font-weight: 600;
        color: var(--text, #f0f0f5);
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        font-family: var(--font, sans-serif);
        line-height: 1.3;
      }
      .uc-conv-preview {
        font-size: .76rem;
        color: var(--text-3, #55556a);
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        font-family: var(--font, sans-serif);
        margin-top: .1rem;
      }
      .uc-conv-unread {
        background: var(--accent, #6c63ff);
        color: #fff;
        font-size: .65rem; font-weight: 800;
        width: 18px; height: 18px;
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0;
        font-family: var(--font, sans-serif);
      }

      /* Mensagens */
      .uc-msgs {
        flex: 1;
        overflow-y: auto;
        padding: .85rem 1rem;
        display: flex;
        flex-direction: column;
        gap: .6rem;
        background: var(--bg-2, #111118);
        min-height: 0;
      }
      .uc-msgs::-webkit-scrollbar { width: 4px; }
      .uc-msgs::-webkit-scrollbar-track { background: transparent; }
      .uc-msgs::-webkit-scrollbar-thumb { background: var(--border, #2a2a38); border-radius: 4px; }

      .uc-msg { display: flex; flex-direction: column; max-width: 78%; }
      .uc-msg.uc-msg-eu { align-self: flex-end; align-items: flex-end; }
      .uc-msg.uc-msg-outro { align-self: flex-start; align-items: flex-start; }

      .uc-msg-nome {
        font-size: .68rem;
        color: var(--text-3, #55556a);
        margin-bottom: .2rem;
        font-family: var(--font, sans-serif);
        font-weight: 600;
        letter-spacing: .02em;
      }
      .uc-msg-bubble {
        padding: .55rem .85rem;
        border-radius: 12px;
        font-size: .84rem;
        line-height: 1.5;
        word-break: break-word;
        font-family: var(--font, sans-serif);
      }
      .uc-msg-eu .uc-msg-bubble {
        background: var(--accent, #6c63ff);
        color: #fff;
        border-bottom-right-radius: 4px;
      }
      .uc-msg-outro .uc-msg-bubble {
        background: var(--surface-2, #22222c);
        color: var(--text, #f0f0f5);
        border: 1px solid var(--border, #2a2a38);
        border-bottom-left-radius: 4px;
      }
      .uc-msg-hora {
        font-size: .65rem;
        color: var(--text-3, #55556a);
        margin-top: .2rem;
        font-family: var(--font-mono, monospace);
      }

      /* Input */
      .uc-input-wrap {
        display: flex;
        gap: .5rem;
        padding: .7rem .85rem;
        border-top: 1px solid var(--border, #2a2a38);
        background: var(--surface, #1c1c25);
        flex-shrink: 0;
      }
      .uc-input {
        flex: 1;
        background: var(--bg-3, #16161e);
        border: 1px solid var(--border, #2a2a38);
        border-radius: 8px;
        color: var(--text, #f0f0f5);
        font-family: var(--font, sans-serif);
        font-size: .85rem;
        padding: .5rem .75rem;
        outline: none;
        transition: border-color .2s;
        min-width: 0;
      }
      .uc-input::placeholder { color: var(--text-3, #55556a); }
      .uc-input:focus { border-color: var(--accent, #6c63ff); }

      .uc-btn-send {
        background: var(--accent, #6c63ff);
        border: none;
        border-radius: 8px;
        width: 36px; height: 36px;
        display: flex; align-items: center; justify-content: center;
        cursor: pointer;
        color: #fff;
        transition: background .15s, transform .15s;
        flex-shrink: 0;
      }
      .uc-btn-send:hover { background: var(--accent-2, #8b84ff); }
      .uc-btn-send:active { transform: scale(.92); }

      /* Loading */
      .uc-loading {
        display: flex; justify-content: center;
        padding: 2rem 0;
      }
      .uc-spinner {
        width: 24px; height: 24px;
        border: 2px solid var(--border, #2a2a38);
        border-top-color: var(--accent, #6c63ff);
        border-radius: 50%;
        animation: uc-spin .7s linear infinite;
      }
      @keyframes uc-spin { to { transform: rotate(360deg); } }

      /* Vazio */
      .uc-empty {
        text-align: center;
        padding: 2.5rem 1.5rem;
        color: var(--text-3, #55556a);
        font-family: var(--font, sans-serif);
        font-size: .84rem;
        line-height: 1.6;
      }
      .uc-empty strong {
        display: block;
        color: var(--text-2, #a0a0b8);
        font-size: .9rem;
        margin-bottom: .4rem;
      }

      /* Data separador */
      .uc-date-sep {
        text-align: center;
        font-size: .68rem;
        color: var(--text-3, #55556a);
        font-family: var(--font-mono, monospace);
        margin: .4rem 0;
        position: relative;
      }
      .uc-date-sep::before, .uc-date-sep::after {
        content: '';
        display: inline-block;
        width: 28px; height: 1px;
        background: var(--border, #2a2a38);
        vertical-align: middle; margin: 0 .5rem;
      }

      /* Nova mensagem indicator */
      .uc-new-indicator {
        display: flex; align-items: center; gap: .5rem;
        font-size: .7rem; color: var(--accent, #6c63ff);
        font-family: var(--font, sans-serif); font-weight: 700;
        letter-spacing: .05em; text-transform: uppercase;
        margin: .4rem 0;
      }
      .uc-new-indicator::before, .uc-new-indicator::after {
        content: ''; flex: 1; height: 1px;
        background: rgba(108,99,255,.3);
      }

      /* Animação de entrada de mensagem */
      @keyframes uc-msg-in {
        from { opacity: 0; transform: translateY(6px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .uc-msg-new { animation: uc-msg-in .2s ease; }

      /* Mobile */
      @media (max-width: 480px) {
        .uc-panel {
          right: .75rem;
          left: .75rem;
          width: auto;
          bottom: calc(1.25rem + 54px + .6rem);
          max-height: 420px;
        }
        #uc-chat-fab {
          bottom: 1.25rem;
          right: 1.25rem;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // ── Eventos ──────────────────────────────────────────────────────────────────
  function bindEventos() {
    document.getElementById('uc-chat-fab').addEventListener('click', toggleChat);
    document.getElementById('uc-btn-minimize').addEventListener('click', fecharChat);
    document.getElementById('uc-btn-back').addEventListener('click', voltarLista);
    document.getElementById('uc-btn-send').addEventListener('click', enviarMensagem);
    
    const input = document.getElementById('uc-input');
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        enviarMensagem();
      }
    });

    // US21 - Detectar digitação
    input.addEventListener('input', () => {
      const agora = Date.now();
      if (STATE.ativa && agora - STATE.lastTypingSent > 2000) {
        STATE.lastTypingSent = agora;
        fetchAPI('/mensagens/digitando', {
          method: 'POST',
          body: JSON.stringify({ solicitacao_id: STATE.ativa })
        }).catch(() => {});
      }
    });
  }

  // ── Toggle ───────────────────────────────────────────────────────────────────
  function toggleChat() {
    STATE.aberto ? fecharChat() : abrirChat();
  }

  function abrirChat() {
    STATE.aberto = true;
    localStorage.setItem(STORAGE_KEY, '1');
    const panel = document.getElementById('uc-chat-panel');
    panel.style.display = 'flex';
    // Recriar animação
    panel.style.animation = 'none';
    panel.offsetHeight; // reflow
    panel.style.animation = '';
    document.getElementById('uc-fab-icon-chat').style.display = 'none';
    document.getElementById('uc-fab-icon-close').style.display = '';
    renderConversas();
  }

  function fecharChat() {
    STATE.aberto = false;
    STATE.ativa = null;
    localStorage.removeItem(STORAGE_KEY);
    document.getElementById('uc-chat-panel').style.display = 'none';
    document.getElementById('uc-fab-icon-chat').style.display = '';
    document.getElementById('uc-fab-icon-close').style.display = 'none';
    mostrarTela('lista');
  }

  // ── Navegação entre telas ────────────────────────────────────────────────────
  function mostrarTela(qual) {
    const lista = document.getElementById('uc-lista-conversas');
    const msgs  = document.getElementById('uc-tela-msgs');
    const btnBack = document.getElementById('uc-btn-back');
    const titleEl = document.getElementById('uc-title-text');

    if (qual === 'lista') {
      lista.style.display = '';
      msgs.style.display  = 'none';
      btnBack.style.display = 'none';
      titleEl.textContent = 'Mensagens';
    } else {
      lista.style.display = 'none';
      msgs.style.display  = 'flex';
      btnBack.style.display = '';
      const conv = STATE.conversas.find(c => c.solicitacao_id === STATE.ativa);
      if (conv) titleEl.textContent = conv.titulo;
    }
  }

  function voltarLista() {
    STATE.ativa = null;
    mostrarTela('lista');
    renderConversas();
  }

  // ── Dados: carregar conversas ─────────────────────────────────────────────────
  async function carregarConversas() {
    if (!isLogado()) return;
    try {
      const usuario = STATE.usuario;
      // Busca caronas ativas do usuário como motorista
      const [resMotorista, resPassageiro] = await Promise.all([
        fetchAPI(`/caronas?motorista_id=${usuario.id}`),
        fetchAPI('/caronas'),
      ]);

      const todasCaronas  = resMotorista.data || [];
      const caronasPublicas = resPassageiro.data || [];

      // Busca solicitações aceitas como passageiro
      const solicitacoesPassageiro = await buscarSolicitacoesPassageiro(caronasPublicas, usuario.id);

      // Busca solicitações aceitas de cada carona do motorista
      const solicitacoesMotorista = await buscarSolicitacoesMotorista(todasCaronas);

      // Consolida conversas
      const novas = [
        ...solicitacoesMotorista,
        ...solicitacoesPassageiro,
      ];

      // Atualiza estado, preservando contagem de não lidos
      for (const conv of novas) {
        const existente = STATE.conversas.find(c => c.solicitacao_id === conv.solicitacao_id);
        conv.mensagens = existente ? existente.mensagens : [];
        conv.unread    = existente ? existente.unread    : 0;
      }
      STATE.conversas = novas;

      // Busca mensagens de todas as conversas (sem marcar como lidas)
      await atualizarMensagens();

    } catch (err) {
      console.error('[UniCaronas Chat] Erro ao carregar conversas:', err.message);
    }
  }

  async function buscarSolicitacoesPassageiro(caronas, userId) {
    const convs = [];
    for (const carona of caronas) {
      try {
        const res = await fetchAPI(`/caronas/${carona.id}/minha-solicitacao`);
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
  }

  async function buscarSolicitacoesMotorista(caronas) {
    const convs = [];
    for (const carona of caronas) {
      try {
        const res = await fetchAPI(`/caronas/${carona.id}/solicitacoes`);
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
  }

  // ── Polling de mensagens ──────────────────────────────────────────────────────
  async function atualizarMensagens() {
    let totalNaoLidas = 0;

    for (const conv of STATE.conversas) {
      try {
        const res = await fetchAPI(`/mensagens/${conv.solicitacao_id}`);
        const novas = res.data || [];

        // Conta mensagens novas não lidas (de outra pessoa, que não estamos vendo agora)
        const prevCount = conv.mensagens.length;
        const estaVendo = STATE.aberto && STATE.ativa === conv.solicitacao_id;

        if (novas.length > prevCount && prevCount > 0 && !estaVendo) {
          const novasMsg = novas.slice(prevCount);
          const naoMinhas = novasMsg.filter(m => m.remetente_id !== STATE.usuario.id);
          conv.unread = (conv.unread || 0) + naoMinhas.length;
        }
        if (estaVendo) conv.unread = 0;

        conv.mensagens = novas;
        conv.preview   = novas.length > 0 ? novas[novas.length - 1].conteudo : '';

        totalNaoLidas += conv.unread || 0;
      } catch (_) {}
    }

    atualizarBadge(totalNaoLidas);

    // Atualizar tela se estiver aberto
    if (STATE.aberto) {
      if (STATE.ativa !== null) {
        renderMensagensAtual();
      } else {
        renderConversas();
      }
    }
  }

  // ── Polling ──────────────────────────────────────────────────────────────────
  function iniciarPolling() {
    if (STATE.pollingId) clearInterval(STATE.pollingId);
    STATE.pollingId = setInterval(async () => {
      await atualizarMensagens();
    }, POLL_INTERVAL);

    // Polling de digitação (apenas se chat aberto e conversa ativa)
    if (STATE.typingPollingId) clearInterval(STATE.typingPollingId);
    STATE.typingPollingId = setInterval(async () => {
      if (STATE.aberto && STATE.ativa) {
        try {
          const res = await fetchAPI(`/mensagens/${STATE.ativa}/digitando`);
          const indicator = document.getElementById('uc-typing-indicator');
          if (res.typing) {
            indicator.style.display = 'block';
          } else {
            indicator.style.display = 'none';
          }
        } catch (_) {}
      }
    }, 2000);

    // Recarregar lista completa a cada 30s
    setInterval(carregarConversas, 30000);
  }

  // ── Render: badge ─────────────────────────────────────────────────────────────
  function atualizarBadge(total) {
    const badge = document.getElementById('uc-badge');
    if (total > 0) {
      badge.textContent = total > 99 ? '99+' : total;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }

  // ── Render: lista de conversas ────────────────────────────────────────────────
  function renderConversas() {
    const inner = document.getElementById('uc-conversas-inner');
    if (STATE.conversas.length === 0) {
      inner.innerHTML = `
        <div class="uc-empty">
          <strong>Nenhuma conversa ainda</strong>
          Conversas aparecem quando você tem caronas aceitas.
        </div>`;
      return;
    }

    inner.innerHTML = STATE.conversas.map(conv => {
      const ini = iniciais(conv.outraPessoa || conv.titulo);
      const preview = conv.preview ? truncar(conv.preview, 38) : 'Sem mensagens';
      const unreadHtml = conv.unread > 0
        ? `<span class="uc-conv-unread">${conv.unread}</span>`
        : '';
      return `
        <div class="uc-conversa-item" data-sid="${conv.solicitacao_id}" role="button" tabindex="0">
          <div class="uc-conv-avatar">${ini}</div>
          <div class="uc-conv-info">
            <div class="uc-conv-titulo">${esc(conv.titulo)}</div>
            <div class="uc-conv-preview">${esc(conv.subtitulo || preview)}</div>
          </div>
          ${unreadHtml}
        </div>`;
    }).join('');

    // Bind clicks
    inner.querySelectorAll('.uc-conversa-item').forEach(el => {
      const sid = parseInt(el.dataset.sid, 10);
      el.addEventListener('click', () => abrirConversa(sid));
      el.addEventListener('keydown', (e) => { if (e.key === 'Enter') abrirConversa(sid); });
    });
  }

  // ── Abrir conversa ────────────────────────────────────────────────────────────
  function abrirConversa(solicitacaoId) {
    STATE.ativa = solicitacaoId;
    const conv = STATE.conversas.find(c => c.solicitacao_id === solicitacaoId);
    if (conv) conv.unread = 0;
    atualizarBadge(STATE.conversas.reduce((sum, c) => sum + (c.unread || 0), 0));
    mostrarTela('msgs');
    renderMensagensAtual();
    document.getElementById('uc-input').focus();
  }

  // ── Render: mensagens ─────────────────────────────────────────────────────────
  function renderMensagensAtual() {
    const conv = STATE.conversas.find(c => c.solicitacao_id === STATE.ativa);
    if (!conv) return;

    const container = document.getElementById('uc-msgs-container');
    const prevCount = container.querySelectorAll('.uc-msg').length;
    const msgs = conv.mensagens;

    if (msgs.length === 0) {
      container.innerHTML = `
        <div class="uc-empty" style="margin:auto">
          <strong>Início da conversa</strong>
          Envie uma mensagem para começar.
        </div>`;
      return;
    }

    // Re-render completo se muda (simples e eficiente para este volume)
    const scrolledToBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 60;

    let html = '';
    let lastDate = '';

    msgs.forEach((m, idx) => {
      const eu = m.remetente_id === STATE.usuario.id;
      const cls = eu ? 'uc-msg-eu' : 'uc-msg-outro';
      const hora = formatarHora(m.enviado_em);
      const data = formatarDataSep(m.enviado_em);
      const isNew = idx >= prevCount;

      if (data !== lastDate) {
        html += `<div class="uc-date-sep">${data}</div>`;
        lastDate = data;
      }
      if (isNew && prevCount > 0) {
        html += `<div class="uc-new-indicator">novas</div>`;
      }

      html += `
        <div class="uc-msg ${cls}${isNew ? ' uc-msg-new' : ''}">
          ${!eu ? `<div class="uc-msg-nome">${esc(m.remetente_nome || conv.outraPessoa)}</div>` : ''}
          <div class="uc-msg-bubble">${esc(m.conteudo)}</div>
          <div class="uc-msg-hora">${hora}</div>
        </div>`;
    });

    container.innerHTML = html;
    if (scrolledToBottom || msgs.length <= 10) {
      container.scrollTop = container.scrollHeight;
    }
  }

  // ── Enviar mensagem ───────────────────────────────────────────────────────────
  async function enviarMensagem() {
    const input = document.getElementById('uc-input');
    const txt   = input.value.trim();
    if (!txt || !STATE.ativa) return;

    input.value = '';
    input.disabled = true;

    try {
      await fetchAPI('/mensagens', {
        method: 'POST',
        body: JSON.stringify({ solicitacao_id: STATE.ativa, conteudo: txt }),
      });

      // Atualiza imediatamente
      const conv = STATE.conversas.find(c => c.solicitacao_id === STATE.ativa);
      if (conv) {
        const res = await fetchAPI(`/mensagens/${STATE.ativa}`);
        conv.mensagens = res.data || [];
        conv.preview   = txt;
        renderMensagensAtual();
      }
    } catch (err) {
      console.error('[UniCaronas Chat] Erro ao enviar:', err.message);
      input.value = txt; // Devolve texto em caso de erro
    } finally {
      input.disabled = false;
      input.focus();
    }
  }

  // ── Fetch helper ─────────────────────────────────────────────────────────────
  async function fetchAPI(path, options = {}) {
    const API_URL = (typeof window.API_URL !== 'undefined')
      ? window.API_URL
      : 'http://localhost:3000/api';

    const token = localStorage.getItem('unicaronas_token');
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_URL}${path}`, { ...options, headers });
    if (res.status === 401) {
      pararPolling();
      return { data: [] };
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  }

  function pararPolling() {
    if (STATE.pollingId) clearInterval(STATE.pollingId);
  }

  // ── Utilitários ───────────────────────────────────────────────────────────────
  function getUser() {
    try { return JSON.parse(localStorage.getItem('unicaronas_user') || 'null'); } catch { return null; }
  }
  function isLogado() { return !!localStorage.getItem('unicaronas_token'); }

  function iniciais(nome) {
    return (nome || '?').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  }
  function truncar(str, max) {
    return str.length > max ? str.slice(0, max) + '…' : str;
  }
  function esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  function formatarHora(iso) {
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
  function formatarDataSep(iso) {
    const d   = new Date(iso);
    const hoje = new Date();
    const ontem = new Date(hoje); ontem.setDate(ontem.getDate() - 1);
    if (d.toDateString() === hoje.toDateString()) return 'hoje';
    if (d.toDateString() === ontem.toDateString()) return 'ontem';
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  }

  // ── Iniciar chat direto após aceitar solicitação ──────────────────────────────
  /**
   * Abre o chat para uma solicitação específica.
   * Se a conversa ainda não estiver na lista local (ex: acabou de ser aceita),
   * busca os dados na API, adiciona à lista e abre diretamente.
   *
   * @param {number} solicitacaoId  - ID da solicitacao_carona
   * @param {object} [meta]         - Dados opcionais para evitar fetch extra
   *   @param {string} meta.titulo       - Ex: "Batel → Campus Norte"
   *   @param {string} meta.outraPessoa  - Nome do outro participante
   *   @param {string} meta.subtitulo    - Ex: "Passageiro: João"
   */
  async function iniciarChatComSolicitacao(solicitacaoId, meta = {}) {
    const sid = parseInt(solicitacaoId, 10);
    if (isNaN(sid) || sid <= 0) return;

    // Garante que o widget está inicializado
    if (!STATE.inicializado) init();

    // Verifica se já existe na lista local
    let conv = STATE.conversas.find(c => c.solicitacao_id === sid);

    if (!conv) {
      // Cria entrada na lista com os metadados fornecidos
      conv = {
        solicitacao_id: sid,
        titulo:     meta.titulo      || 'Conversa',
        subtitulo:  meta.subtitulo   || '',
        outraPessoa: meta.outraPessoa || 'Usuário',
        mensagens:  [],
        unread:     0,
        preview:    '',
      };
      STATE.conversas.unshift(conv); // Coloca no topo da lista
    }

    // Busca mensagens imediatamente
    try {
      const res = await fetchAPI(`/mensagens/${sid}`);
      conv.mensagens = res.data || [];
      conv.preview   = conv.mensagens.length > 0
        ? conv.mensagens[conv.mensagens.length - 1].conteudo
        : '';
    } catch (_) {}

    // Abre o painel e navega direto para a conversa
    if (!STATE.aberto) abrirChat();
    abrirConversa(sid);
  }

  // ── Expor API pública ─────────────────────────────────────────────────────────
  window.UCChat = {
    init,
    abrirConversa,
    abrirChat,
    fecharChat,
    estaAberto: () => STATE.aberto,
    getChatAtivo: () => STATE.ativa,
    recarregar: carregarConversas,
    iniciarChat: iniciarChatComSolicitacao,
  };

  // ── Auto-init quando DOM estiver pronto ──────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // Aguarda scripts de autenticação carregarem
    setTimeout(init, 200);
  }

})();