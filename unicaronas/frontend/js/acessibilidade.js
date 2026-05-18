/**
 * UniCaronas — acessibilidade.js
 * Widget de Acessibilidade com persistência e VLibras.
 * Autor: Ariane Archanjo
 */

const Acessibilidade = (() => {
  'use strict';

  const DEFAULTS = {
    tamanhoFonte: 100,
    altoContraste: false,
    escalaCinza: false,
    linksSublinhados: false,
    fonteDislexia: false,
    espacamentoTexto: false,
    cursorGrande: false,
    pausarAnimacoes: false,
    leitorAtivo: false,
  };

  const STORAGE_KEY = 'unicaronas_acess_prefs';
  let prefs = {};
  let painelAberto = false;
  let leitorHandler = null;

  function salvar() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }

  function carregar() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      prefs = { ...DEFAULTS, ...saved };
    } catch {
      prefs = { ...DEFAULTS };
    }
  }

  function aplicar() {
    const html = document.documentElement;
    html.style.fontSize = `${prefs.tamanhoFonte}%`;
    
    html.classList.toggle('uc-alto-contraste', prefs.altoContraste);
    html.classList.toggle('uc-escala-cinza', prefs.escalaCinza);
    html.classList.toggle('uc-links-sublinhados', prefs.linksSublinhados);
    html.classList.toggle('uc-fonte-dislexia', prefs.fonteDislexia);
    html.classList.toggle('uc-espacamento-texto', prefs.espacamentoTexto);
    html.classList.toggle('uc-cursor-grande', prefs.cursorGrande);
    html.classList.toggle('uc-pausar-animacoes', prefs.pausarAnimacoes);

    if (prefs.leitorAtivo) ativarLeitor();
    else desativarLeitor();

    sincronizarPainel();
  }

  // ── Leitor de Página ────────────────────────────────────────────────────────
  function ativarLeitor() {
    if (leitorHandler) return;
    leitorHandler = (e) => {
      // Evita ler o próprio widget
      if (e.target.closest('#uc-widget-acessibilidade')) return;

      const texto = e.target.innerText || e.target.alt || e.target.ariaLabel;
      if (texto && texto.trim().length > 1) {
        pararLeitura();
        const utterance = new SpeechSynthesisUtterance(texto.trim());
        utterance.lang = 'pt-BR';
        utterance.rate = 1;
        window.speechSynthesis.speak(utterance);
      }
    };
    document.addEventListener('mouseover', leitorHandler);
    document.addEventListener('focusin', leitorHandler);
  }

  function desativarLeitor() {
    if (!leitorHandler) return;
    pararLeitura();
    document.removeEventListener('mouseover', leitorHandler);
    document.removeEventListener('focusin', leitorHandler);
    leitorHandler = null;
  }

  function pararLeitura() {
    window.speechSynthesis.cancel();
  }

  function pausarLeitura() {
    window.speechSynthesis.pause();
  }

  function retomarLeitura() {
    window.speechSynthesis.resume();
  }

  // ── UI Widget ───────────────────────────────────────────────────────────────
  function renderizar() {
    if (document.getElementById('uc-widget-acessibilidade')) return;

    const div = document.createElement('div');
    div.id = 'uc-widget-acessibilidade';
    div.setAttribute('role', 'region');
    div.setAttribute('aria-label', 'Opções de Acessibilidade');

    div.innerHTML = `
      <button id="uc-btn-fab" aria-expanded="false" aria-controls="uc-panel" aria-label="Abrir menu de acessibilidade" title="Acessibilidade">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
      </button>

      <div id="uc-panel" class="uc-panel" hidden>
        <div class="uc-panel-header">
          <span>Acessibilidade</span>
          <button id="uc-btn-close" aria-label="Fechar painel">&times;</button>
        </div>
        <div class="uc-panel-body">
          <div class="uc-control-group">
            <span class="uc-label">Tamanho do Texto</span>
            <div class="uc-font-row">
              <button id="uc-f-down" aria-label="Diminuir fonte">A-</button>
              <span id="uc-f-val">100%</span>
              <button id="uc-f-up" aria-label="Aumentar fonte">A+</button>
              <button id="uc-f-reset" aria-label="Resetar fonte">↺</button>
            </div>
          </div>

          <div class="uc-toggles">
            <label class="uc-toggle"><input type="checkbox" id="uc-t-contrast"> <span class="uc-t-box"></span> Alto Contraste</label>
            <label class="uc-toggle"><input type="checkbox" id="uc-t-gray"> <span class="uc-t-box"></span> Escala de Cinza</label>
            <label class="uc-toggle"><input type="checkbox" id="uc-t-links"> <span class="uc-t-box"></span> Destacar Links</label>
            <label class="uc-toggle"><input type="checkbox" id="uc-t-dislexia"> <span class="uc-t-box"></span> Fonte p/ Dislexia</label>
            <label class="uc-toggle"><input type="checkbox" id="uc-t-space"> <span class="uc-t-box"></span> Espaçamento</label>
            <label class="uc-toggle"><input type="checkbox" id="uc-t-cursor"> <span class="uc-t-box"></span> Cursor Grande</label>
            <label class="uc-toggle"><input type="checkbox" id="uc-t-anim"> <span class="uc-t-box"></span> Parar Animações</label>
          </div>

          <div class="uc-control-group">
            <span class="uc-label">Leitor de Página</span>
            <label class="uc-toggle"><input type="checkbox" id="uc-t-reader"> <span class="uc-t-box"></span> Ativar Leitor (Hover)</label>
            <div class="uc-reader-btns">
              <button id="uc-r-stop" class="uc-btn-s">Parar Áudio</button>
              <button id="uc-r-pause" class="uc-btn-s">Pausar/Retomar</button>
            </div>
          </div>

          <button id="uc-btn-reset-all" class="uc-btn-reset">Restaurar Padrões</button>
        </div>
      </div>
    `;

    document.body.appendChild(div);
    vincularEventos();
  }

  function vincularEventos() {
    const get = (id) => document.getElementById(id);

    get('uc-btn-fab').onclick = togglePainel;
    get('uc-btn-close').onclick = fecharPainel;

    get('uc-f-up').onclick = () => { if (prefs.tamanhoFonte < 200) { prefs.tamanhoFonte += 10; salvar(); aplicar(); } };
    get('uc-f-down').onclick = () => { if (prefs.tamanhoFonte > 70) { prefs.tamanhoFonte -= 10; salvar(); aplicar(); } };
    get('uc-f-reset').onclick = () => { prefs.tamanhoFonte = 100; salvar(); aplicar(); };

    const mappings = {
      'uc-t-contrast': 'altoContraste',
      'uc-t-gray': 'escalaCinza',
      'uc-t-links': 'linksSublinhados',
      'uc-t-dislexia': 'fonteDislexia',
      'uc-t-space': 'espacamentoTexto',
      'uc-t-cursor': 'cursorGrande',
      'uc-t-anim': 'pausarAnimacoes',
      'uc-t-reader': 'leitorAtivo',
    };

    Object.entries(mappings).forEach(([id, pref]) => {
      get(id).onchange = (e) => {
        prefs[pref] = e.target.checked;
        salvar();
        aplicar();
      };
    });

    get('uc-r-stop').onclick = pararLeitura;
    get('uc-r-pause').onclick = () => {
      if (window.speechSynthesis.paused) retomarLeitura();
      else pausarLeitura();
    };

    get('uc-btn-reset-all').onclick = () => {
      prefs = { ...DEFAULTS };
      salvar();
      aplicar();
    };

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && painelAberto) fecharPainel();
    });
  }

  function togglePainel() { painelAberto ? fecharPainel() : abrirPainel(); }
  function abrirPainel() {
    painelAberto = true;
    const p = document.getElementById('uc-panel');
    p.removeAttribute('hidden');
    document.getElementById('uc-btn-fab').setAttribute('aria-expanded', 'true');
    document.getElementById('uc-btn-close').focus();
  }
  function fecharPainel() {
    painelAberto = false;
    document.getElementById('uc-panel').setAttribute('hidden', '');
    document.getElementById('uc-btn-fab').setAttribute('aria-expanded', 'false');
  }

  function sincronizarPainel() {
    const get = (id) => document.getElementById(id);
    if (!get('uc-panel')) return;

    get('uc-f-val').textContent = `${prefs.tamanhoFonte}%`;
    get('uc-t-contrast').checked = prefs.altoContraste;
    get('uc-t-gray').checked = prefs.escalaCinza;
    get('uc-t-links').checked = prefs.linksSublinhados;
    get('uc-t-dislexia').checked = prefs.fonteDislexia;
    get('uc-t-space').checked = prefs.espacamentoTexto;
    get('uc-t-cursor').checked = prefs.cursorGrande;
    get('uc-t-anim').checked = prefs.pausarAnimacoes;
    get('uc-t-reader').checked = prefs.leitorAtivo;
  }

  function init() {
    carregar();
    renderizar();
    aplicar();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { init };
})();
