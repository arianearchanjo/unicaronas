/**
 * UniCaronas — chat-ui.js
 * Funções de renderização DOM para o chat.
 */

const ChatUI = {
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
