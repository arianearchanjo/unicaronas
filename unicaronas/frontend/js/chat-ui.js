/**
 * UniCaronas — chat-ui.js
 * Funções de renderização DOM para o chat.
 */

const ChatUI = {
  injetarHTML() {
    if (document.getElementById('uc-chat-wrapper')) return;

    const div = document.createElement('div');
    div.id = 'uc-chat-wrapper';
    div.innerHTML = `
      <button id="uc-chat-fab" class="uc-chat-fab" aria-label="Abrir chat">
        <div id="uc-badge" class="uc-badge" style="display: none;">0</div>
        <svg id="uc-fab-icon-chat" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
        <svg id="uc-fab-icon-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: none;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>

      <div id="uc-chat-panel" class="uc-chat-panel" style="display: none;">
        <div class="uc-chat-header">
          <div class="uc-header-left">
            <button id="uc-btn-back" class="uc-btn-header" style="display: none;" title="Voltar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            </button>
            <span id="uc-title-text" class="uc-title">Mensagens</span>
          </div>
          <button id="uc-btn-minimize" class="uc-btn-header" title="Minimizar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="12" x2="6" y2="12"></line></svg>
          </button>
        </div>

        <div id="uc-lista-conversas" class="uc-panel-body">
          <div id="uc-conversas-inner"></div>
        </div>

        <div id="uc-tela-msgs" class="uc-panel-body" style="display: none; flex-direction: column;">
          <div id="uc-msgs-container" class="uc-msgs-container"></div>
          <div class="uc-chat-input-area">
            <input type="text" id="uc-input" placeholder="Digite uma mensagem..." autocomplete="off">
            <button id="uc-btn-send" class="uc-btn-send">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(div);
  },

  injetarCSS() {
    if (document.getElementById('uc-chat-styles')) return;
    const style = document.createElement('style');
    style.id = 'uc-chat-styles';
    style.textContent = `
      .uc-chat-fab { position: fixed; bottom: 25px; right: 25px; width: 56px; height: 56px; border-radius: 50%; background: var(--accent, #6c63ff); color: #fff; border: none; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 9999; display: flex; align-items: center; justify-content: center; transition: transform 0.2s; }
      .uc-chat-fab:hover { transform: scale(1.05); }
      .uc-chat-fab svg { width: 24px; height: 24px; }
      .uc-badge { position: absolute; top: -5px; right: -5px; background: #ff4757; color: #fff; font-size: 11px; font-weight: 700; min-width: 20px; height: 20px; border-radius: 10px; display: flex; align-items: center; justify-content: center; padding: 0 4px; border: 2px solid var(--bg, #0a0a0f); }
      
      .uc-chat-panel { position: fixed; bottom: 95px; right: 25px; width: 340px; height: 500px; background: var(--surface, #1c1c25); border: 1px solid var(--border, #2a2a38); border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.4); z-index: 9998; display: flex; flex-direction: column; overflow: hidden; animation: ucFadeUp 0.3s ease-out; }
      @keyframes ucFadeUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
      
      .uc-chat-header { padding: 0.75rem 1rem; background: var(--accent, #6c63ff); color: #fff; display: flex; justify-content: space-between; align-items: center; }
      .uc-header-left { display: flex; align-items: center; gap: 0.5rem; }
      .uc-title { font-weight: 700; font-size: 0.95rem; }
      .uc-btn-header { background: transparent; border: none; color: #fff; cursor: pointer; display: flex; align-items: center; padding: 4px; border-radius: 4px; opacity: 0.9; }
      .uc-btn-header:hover { background: rgba(255,255,255,0.1); opacity: 1; }
      .uc-btn-header svg { width: 20px; height: 20px; }
      
      .uc-panel-body { flex: 1; overflow-y: auto; display: flex; flex-direction: column; }
      .uc-conversa-item { padding: 1rem; border-bottom: 1px solid var(--border, #2a2a38); display: flex; align-items: center; gap: 0.75rem; cursor: pointer; transition: background 0.2s; }
      .uc-conversa-item:hover { background: var(--bg-2, #111118); }
      .uc-conv-avatar { width: 42px; height: 42px; border-radius: 50%; background: var(--accent-glow, rgba(108,99,255,0.2)); color: var(--accent-2, #8b84ff); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.9rem; flex-shrink: 0; }
      .uc-conv-info { flex: 1; min-width: 0; }
      .uc-conv-titulo { font-weight: 600; font-size: 0.88rem; color: var(--text, #f0f0f5); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px; }
      .uc-conv-preview { font-size: 0.78rem; color: var(--text-3, #55556a); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .uc-conv-unread { background: var(--accent, #6c63ff); color: #fff; font-size: 10px; font-weight: 700; min-width: 18px; height: 18px; border-radius: 9px; display: flex; align-items: center; justify-content: center; padding: 0 4px; }
      
      .uc-msgs-container { flex: 1; overflow-y: auto; padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem; background: var(--bg-2, #111118); }
      .uc-msg { max-width: 80%; display: flex; flex-direction: column; }
      .uc-msg-eu { align-self: flex-end; }
      .uc-msg-outro { align-self: flex-start; }
      .uc-msg-nome { font-size: 0.65rem; color: var(--text-3, #55556a); margin-bottom: 2px; font-weight: 600; }
      .uc-msg-bubble { padding: 0.6rem 0.85rem; border-radius: 12px; font-size: 0.85rem; line-height: 1.4; color: var(--text, #f0f0f5); background: var(--surface, #1c1c25); border: 1px solid var(--border, #2a2a38); }
      .uc-msg-eu .uc-msg-bubble { background: var(--accent, #6c63ff); border-color: transparent; color: #fff; border-bottom-right-radius: 2px; }
      .uc-msg-outro .uc-msg-bubble { border-bottom-left-radius: 2px; }
      .uc-msg-hora { font-size: 0.65rem; color: var(--text-3, #55556a); margin-top: 3px; font-family: var(--font-mono, monospace); }
      .uc-msg-eu .uc-msg-hora { text-align: right; }
      
      .uc-date-sep { text-align: center; margin: 1rem 0; position: relative; font-size: 0.68rem; color: var(--text-3, #55556a); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
      .uc-empty { text-align: center; padding: 3rem 1.5rem; color: var(--text-3, #55556a); display: flex; flex-direction: column; gap: 0.5rem; }
      .uc-empty strong { color: var(--text-2, #a0a0b8); }
      
      .uc-chat-input-area { padding: 0.75rem 1rem; background: var(--surface, #1c1c25); border-top: 1px solid var(--border, #2a2a38); display: flex; gap: 0.5rem; }
      .uc-chat-input-area input { flex: 1; background: var(--bg-3, #16161e); border: 1px solid var(--border, #2a2a38); border-radius: 20px; padding: 0.5rem 1rem; color: var(--text, #f0f0f5); font-size: 0.85rem; outline: none; }
      .uc-chat-input-area input:focus { border-color: var(--accent, #6c63ff); }
      .uc-btn-send { background: var(--accent, #6c63ff); color: #fff; border: none; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; flex-shrink: 0; }
      .uc-btn-send:hover { transform: scale(1.1); }
      .uc-btn-send svg { width: 18px; height: 18px; }
      
      @media (max-width: 480px) {
        .uc-chat-panel { width: calc(100vw - 20px); height: calc(100vh - 120px); right: 10px; bottom: 85px; }
      }
    `;
    document.head.appendChild(style);
  },

  renderizarConversas(conversas) {
    const inner = document.getElementById('uc-conversas-inner');
    if (!inner) return;

    if (conversas.length === 0) {
      inner.innerHTML = `
        <div class="uc-empty">
          <strong>Nenhuma conversa ainda</strong>
          Conversas aparecem quando você tem caronas aceitas.
        </div>`;
      return;
    }

    inner.innerHTML = conversas.map(conv => {
      const ini = this.iniciais(conv.outraPessoa || conv.titulo);
      const preview = conv.preview ? this.truncar(conv.preview, 38) : 'Sem mensagens';
      const unreadHtml = conv.unread > 0
        ? `<span class="uc-conv-unread">${conv.unread}</span>`
        : '';
      return `
        <div class="uc-conversa-item" data-sid="${conv.solicitacao_id}" role="button" tabindex="0">
          <div class="uc-conv-avatar">${ini}</div>
          <div class="uc-conv-info">
            <div class="uc-conv-titulo">${this.esc(conv.titulo)}</div>
            <div class="uc-conv-preview">${this.esc(conv.subtitulo || preview)}</div>
          </div>
          ${unreadHtml}
        </div>`;
    }).join('');

    // Re-bind de eventos é feito pelo ChatGlobal (orquestrador)
  },

  renderizarMensagens(mensagens, ativaId) {
    const container = document.getElementById('uc-msgs-container');
    if (!container) return;

    const conv = ChatState.conversas.find(c => c.solicitacao_id === ativaId);
    if (!conv) return;

    const prevCount = container.querySelectorAll('.uc-msg').length;
    const scrolledToBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 60;

    if (mensagens.length === 0) {
      container.innerHTML = `
        <div class="uc-empty" style="margin:auto">
          <strong>Início da conversa</strong>
          Envie uma mensagem para começar.
        </div>`;
      return;
    }

    let html = '';
    let lastDate = '';

    mensagens.forEach((m, idx) => {
      const eu = m.remetente_id === ChatState.usuario.id;
      const cls = eu ? 'uc-msg-eu' : 'uc-msg-outro';
      const hora = this.formatarHora(m.enviado_em);
      const data = this.formatarDataSep(m.enviado_em);
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
          ${!eu ? `<div class="uc-msg-nome">${this.esc(m.remetente_nome || conv.outraPessoa)}</div>` : ''}
          <div class="uc-msg-bubble">${this.esc(m.conteudo)}</div>
          <div class="uc-msg-hora">${hora}</div>
        </div>`;
    });

    container.innerHTML = html;
    if (scrolledToBottom || mensagens.length <= 10) {
      container.scrollTop = container.scrollHeight;
    }
  },

  atualizarBadge(total) {
    const badge = document.getElementById('uc-badge');
    if (!badge) return;
    if (total > 0) {
      badge.textContent = total > 99 ? '99+' : total;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  },

  mostrarTela(qual) {
    const lista = document.getElementById('uc-lista-conversas');
    const msgs  = document.getElementById('uc-tela-msgs');
    const btnBack = document.getElementById('uc-btn-back');
    const titleEl = document.getElementById('uc-title-text');

    if (qual === 'lista') {
      if (lista) lista.style.display = '';
      if (msgs) msgs.style.display  = 'none';
      if (btnBack) btnBack.style.display = 'none';
      if (titleEl) titleEl.textContent = 'Mensagens';
    } else {
      if (lista) lista.style.display = 'none';
      if (msgs) msgs.style.display  = 'flex';
      if (btnBack) btnBack.style.display = '';
      const conv = ChatState.getConversaAtiva();
      if (conv && titleEl) titleEl.textContent = conv.titulo;
    }
  },

  // Helpers de formatação
  iniciais(nome) {
    return (nome || '?').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  },
  truncar(str, max) {
    return str.length > max ? str.slice(0, max) + '…' : str;
  },
  esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },
  formatarHora(iso) {
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  },
  formatarDataSep(iso) {
    const d   = new Date(iso);
    const hoje = new Date();
    const ontem = new Date(hoje); ontem.setDate(ontem.getDate() - 1);
    if (d.toDateString() === hoje.toDateString()) return 'hoje';
    if (d.toDateString() === ontem.toDateString()) return 'ontem';
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  }
};
