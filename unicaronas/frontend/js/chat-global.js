/**
 * UniCaronas — chat-global.js
 * Orquestrador do chat modularizado.
 * Depende de: chat-state.js, chat-api.js, chat-ui.js, chat-polling.js
 */

const ChatGlobal = (() => {
  'use strict';

  // ── Inicialização ────────────────────────────────────────────────────────────
  function init() {
    if (ChatState.inicializado) return;
    
    // getUser e isLogado são globais de api.js
    ChatState.usuario = typeof getUser === 'function' ? getUser() : null;
    if (!ChatState.usuario || (typeof isLogado === 'function' && !isLogado())) return;

    ChatUI.injetarHTML();
    ChatUI.injetarCSS();
    bindEventos();
    
    carregarConversas();
    ChatPolling.iniciar();
    
    ChatState.inicializado = true;

    // Restaurar estado aberto
    if (localStorage.getItem(ChatState.STORAGE_KEY) === '1') {
      setTimeout(() => abrirChat(), 300);
    }
  }

  // ── Eventos ──────────────────────────────────────────────────────────────────
  function bindEventos() {
    const fab = document.getElementById('uc-chat-fab');
    if (fab) fab.addEventListener('click', toggleChat);
    
    const min = document.getElementById('uc-btn-minimize');
    if (min) min.addEventListener('click', fecharChat);
    
    const back = document.getElementById('uc-btn-back');
    if (back) back.addEventListener('click', voltarLista);
    
    const send = document.getElementById('uc-btn-send');
    if (send) send.addEventListener('click', enviarMensagem);
    
    const input = document.getElementById('uc-input');
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          enviarMensagem();
        }
      });

      // US21 - Detectar digitação
      input.addEventListener('input', () => {
        const agora = Date.now();
        if (ChatState.ativa && agora - ChatState.lastTypingSent > 2000) {
          ChatState.lastTypingSent = agora;
          ChatAPI.reportarDigitando(ChatState.ativa).catch(() => {});
        }
      });
    }
  }

  // ── Handlers ─────────────────────────────────────────────────────────────────
  function toggleChat() {
    ChatState.aberto ? fecharChat() : abrirChat();
  }

  function abrirChat() {
    ChatState.aberto = true;
    localStorage.setItem(ChatState.STORAGE_KEY, '1');
    
    const panel = document.getElementById('uc-chat-panel');
    if (panel) {
      panel.style.display = 'flex';
      panel.style.animation = 'none';
      panel.offsetHeight; // reflow
      panel.style.animation = '';
    }
    
    const fabIcon = document.getElementById('uc-fab-icon-chat');
    if (fabIcon) fabIcon.style.display = 'none';
    
    const closeIcon = document.getElementById('uc-fab-icon-close');
    if (closeIcon) closeIcon.style.display = '';
    
    ChatUI.renderizarConversas(ChatState.conversas);
    bindClicksConversas();
  }

  function fecharChat() {
    ChatState.aberto = false;
    ChatState.ativa = null;
    localStorage.removeItem(ChatState.STORAGE_KEY);
    
    const panel = document.getElementById('uc-chat-panel');
    if (panel) panel.style.display = 'none';
    
    const fabIcon = document.getElementById('uc-fab-icon-chat');
    if (fabIcon) fabIcon.style.display = '';
    
    const closeIcon = document.getElementById('uc-fab-icon-close');
    if (closeIcon) closeIcon.style.display = 'none';
    
    ChatUI.mostrarTela('lista');
  }

  function voltarLista() {
    ChatState.ativa = null;
    ChatUI.mostrarTela('lista');
    ChatUI.renderizarConversas(ChatState.conversas);
    bindClicksConversas();
  }

  function bindClicksConversas() {
    const inner = document.getElementById('uc-conversas-inner');
    if (!inner) return;
    inner.querySelectorAll('.uc-conversa-item').forEach(el => {
      const sid = parseInt(el.dataset.sid, 10);
      el.addEventListener('click', () => abrirConversa(sid));
      el.addEventListener('keydown', (e) => { if (e.key === 'Enter') abrirConversa(sid); });
    });
  }

  function abrirConversa(solicitacaoId) {
    ChatState.ativa = solicitacaoId;
    const conv = ChatState.getConversaAtiva();
    if (conv) conv.unread = 0;
    
    ChatUI.atualizarBadge(ChatState.getTotalUnread());
    ChatUI.mostrarTela('msgs');
    atualizarMensagens();
    
    const input = document.getElementById('uc-input');
    if (input) input.focus();
  }

  // ── Lógica de Dados ──────────────────────────────────────────────────────────
  async function carregarConversas() {
    const novas = await ChatAPI.buscarConversas();
    
    // Atualiza estado, preservando mensagens carregadas localmente se possível
    for (const conv of novas) {
      const existente = ChatState.conversas.find(c => c.solicitacao_id === conv.solicitacao_id);
      conv.mensagens = existente ? existente.mensagens : [];
      conv.unread    = existente ? existente.unread    : 0;
    }
    ChatState.conversas = novas;
    
    await atualizarMensagens();
  }

  async function atualizarMensagens() {
    let totalNaoLidas = 0;

    for (const conv of ChatState.conversas) {
      try {
        const res = await ChatAPI.buscarMensagens(conv.solicitacao_id);
        const novas = res.data || [];

        const prevCount = conv.mensagens.length;
        const estaVendo = ChatState.aberto && ChatState.ativa === conv.solicitacao_id;

        if (novas.length > prevCount && prevCount > 0 && !estaVendo) {
          const novasMsg = novas.slice(prevCount);
          const naoMinhas = novasMsg.filter(m => m.remetente_id !== ChatState.usuario.id);
          conv.unread = (conv.unread || 0) + naoMinhas.length;
        }
        if (estaVendo) conv.unread = 0;

        conv.mensagens = novas;
        conv.preview   = novas.length > 0 ? novas[novas.length - 1].conteudo : '';
        totalNaoLidas += conv.unread || 0;
      } catch (_) {}
    }

    ChatUI.atualizarBadge(totalNaoLidas);

    if (ChatState.aberto) {
      if (ChatState.ativa !== null) {
        ChatUI.renderizarMensagens(ChatState.getConversaAtiva()?.mensagens || [], ChatState.ativa);
      } else {
        ChatUI.renderizarConversas(ChatState.conversas);
        bindClicksConversas();
      }
    }
  }

  async function enviarMensagem() {
    const input = document.getElementById('uc-input');
    if (!input) return;
    const txt = input.value.trim();
    if (!txt || !ChatState.ativa) return;

    input.value = '';
    input.disabled = true;

    try {
      await ChatAPI.enviarMensagem(ChatState.ativa, txt);
      // Atualiza imediatamente a conversa ativa
      const res = await ChatAPI.buscarMensagens(ChatState.ativa);
      const conv = ChatState.getConversaAtiva();
      if (conv) {
        conv.mensagens = res.data || [];
        conv.preview   = txt;
        ChatUI.renderizarMensagens(conv.mensagens, ChatState.ativa);
      }
    } catch (err) {
      console.error('[ChatGlobal] Erro ao enviar:', err.message);
      input.value = txt; 
    } finally {
      input.disabled = false;
      input.focus();
    }
  }

  async function iniciarChatComSolicitacao(solicitacaoId, meta = {}) {
    const sid = parseInt(solicitacaoId, 10);
    if (isNaN(sid) || sid <= 0) return;

    if (!ChatState.inicializado) init();

    let conv = ChatState.conversas.find(c => c.solicitacao_id === sid);
    if (!conv) {
      conv = {
        solicitacao_id: sid,
        titulo:     meta.titulo      || 'Conversa',
        subtitulo:  meta.subtitulo   || '',
        outraPessoa: meta.outraPessoa || 'Usuário',
        mensagens:  [],
        unread:     0,
        preview:    '',
      };
      ChatState.conversas.unshift(conv);
    }

    try {
      const res = await ChatAPI.buscarMensagens(sid);
      conv.mensagens = res.data || [];
      conv.preview   = conv.mensagens.length > 0 ? conv.mensagens[conv.mensagens.length - 1].conteudo : '';
    } catch (_) {}

    if (!ChatState.aberto) abrirChat();
    abrirConversa(sid);
  }

  // ── Expor API pública ─────────────────────────────────────────────────────────
  window.UCChat = {
    init,
    abrirConversa,
    abrirChat,
    fecharChat,
    estaAberto: () => ChatState.aberto,
    getChatAtivo: () => ChatState.ativa,
    recarregar: carregarConversas,
    iniciarChat: iniciarChatComSolicitacao,
  };

  // ── Auto-init ────────────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 200);
  }

  return { carregarConversas, atualizarMensagens };

})();
