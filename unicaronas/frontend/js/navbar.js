/**
 * UniCaronas — navbar.js
 * Componente de navegação dinâmico com controle de perfil.
 */

const Navbar = {
  render() {
    const usuario = typeof getUser === 'function' ? getUser() : null;
    const isPublicPage = !usuario || window.location.pathname.includes('login.html') || window.location.pathname.includes('cadastro.html');
    const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';

    const html = `
      <nav class="navbar" aria-label="Navegação principal">
        <div class="container">
          <button class="navbar-toggle" onclick="Navbar.toggleMobileMenu()" aria-label="Abrir menu">
            <span></span><span></span><span></span>
          </button>
          
          <a href="${isPublicPage ? 'login.html' : 'dashboard.html'}" class="navbar-brand-wrap" aria-label="UniCaronas Home">
            <div class="navbar-brand-img"></div>
            <div class="navbar-brand-text">Uni<span>Caronas</span></div>
          </a>
          
          ${!isPublicPage ? this.getLinks(usuario, currentPage) : ''}
          
          <div class="navbar-actions" style="display: flex; align-items: center; gap: 0.5rem;">
            ${isPublicPage ? this.getLangButtons() + `<button class="theme-toggle" id="theme-toggle-btn" onclick="toggleTheme()" aria-label="Alternar tema"></button>` : ''}
            ${!isPublicPage ? this.getUserDropdown(usuario) : ''}
          </div>
        </div>
      </nav>
    `;

    const placeholder = document.getElementById('navbar-placeholder');
    if (placeholder) {
      placeholder.innerHTML = html;
      if (typeof applyTranslations === 'function') applyTranslations();
      this.initDropdownListeners();
      
      // Atualiza o ícone do tema se o botão existir
      if (typeof updateThemeIcon === 'function') updateThemeIcon();

      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  },

  getUserDropdown(usuario) {
    const nome = usuario?.nome || 'Usuário';
    const email = usuario?.email || 'usuario@unibrasil.com.br';
    const inicial = nome.charAt(0).toUpperCase();
    const lang = typeof currentLang !== 'undefined' ? currentLang : 'pt';

    return `
      <div class="user-dropdown" id="user-dropdown">
        <div class="avatar-trigger" id="avatar-trigger" title="${nome}">
          ${inicial}
        </div>
        <div class="dropdown-menu">
          <div class="menu-header">
            <div class="header-avatar">${inicial}</div>
            <div class="header-info">
              <span class="header-name">${nome}</span>
              <span class="header-email">${email}</span>
            </div>
          </div>
          
          <div class="menu-list">
            ${usuario?.is_admin ? `
              <a href="admin.html" class="menu-item" style="color: var(--accent); font-weight: 600;">
                <i data-lucide="shield-check" style="width: 16px; height: 16px; margin-right: 0.5rem; opacity: 1;"></i>
                <span>Painel Admin</span>
              </a>
              <div class="menu-divider"></div>
            ` : ''}
            <a href="perfil.html?id=${usuario?.id}" class="menu-item">
              <i data-lucide="user" style="width: 16px; height: 16px; margin-right: 0.5rem; opacity: 0.8;"></i>
              <span data-i18n="nav-meu-perfil">Meu perfil</span>
            </a>
            <a href="gerenciar-caronas.html" class="menu-item">
              <i data-lucide="settings" style="width: 16px; height: 16px; margin-right: 0.5rem; opacity: 0.8;"></i>
              <span data-i18n="nav-minhas-caronas">Minhas caronas</span>
            </a>
            <a href="reportar-erro.html" class="menu-item" style="border-top: 1px solid var(--border); margin-top: 0.5rem; color: var(--text-2);">
              <i data-lucide="bug" style="width: 16px; height: 16px; margin-right: 0.5rem; opacity: 0.8;"></i>
              <span data-i18n="report-title">Reportar erro</span>
            </a>
            <div class="menu-divider"></div>
            
            <div class="menu-settings-row" style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0.75rem; gap: 0.5rem;">
              <button class="theme-toggle" onclick="toggleTheme()" style="flex: 1; height: 36px;" aria-label="Alternar tema">
                <!-- O ícone será inserido pelo theme.js -->
              </button>
              
              <div class="lang-dropdown" style="flex: 1;">
                <button class="lang-toggle" style="width: 100%; height: 36px; justify-content: center;">
                  ${lang.toUpperCase()}
                </button>
                <div class="lang-menu" style="right: 0; bottom: 100%; top: auto; margin-bottom: 0.5rem;">
                  <button class="lang-item" onclick="setLanguage('pt')">PT</button>
                  <button class="lang-item" onclick="setLanguage('en')">EN</button>
                  <button class="lang-item" onclick="setLanguage('es')">ES</button>
                </div>
              </div>
            </div>

            <div class="menu-divider"></div>
            <button class="menu-item logout" onclick="logout()">
              <i data-lucide="log-out" style="width: 16px; height: 16px; margin-right: 0.5rem; opacity: 0.8;"></i>
              <span data-i18n="nav-sair">Sair</span>
            </button>
          </div>
        </div>
      </div>
    `;
  },

  initDropdownListeners() {
    const dropdown = document.getElementById('user-dropdown');
    const trigger = document.getElementById('avatar-trigger');

    if (!trigger || !dropdown) return;

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target)) {
        dropdown.classList.remove('active');
      }
    });
  },

  getLinks(usuario, currentPage) {
    const tipo = usuario?.perfil_tipo || 'misto';
    const ehAdmin = usuario?.is_admin;

    // Se for admin, mostra apenas os links de gestão
    if (ehAdmin) {
      const adminLinks = [
        { id: 'admin.html', label: 'Verificações', show: true },
        { id: 'admin-erros.html', label: 'Relatórios de Erro', show: true }
      ];
      return `
        <ul class="navbar-links" role="list">
          ${adminLinks.map(l => `
            <li>
              <a href="${l.id}" class="${currentPage === l.id ? 'active' : ''}">${l.label}</a>
            </li>
          `).join('')}
        </ul>
      `;
    }

    const links = [
      { id: 'dashboard.html', label: 'nav-dashboard', show: true, badge: true },
      { id: 'buscar.html', label: 'nav-buscar', show: tipo !== 'motorista' },
      { id: 'criar-carona.html', label: 'nav-oferecer', show: tipo !== 'estudante' },
      { id: 'gerenciar-caronas.html', label: 'nav-gerenciar', show: tipo !== 'estudante' }
    ];

    return `
      <ul class="navbar-links" role="list">
        ${links.filter(l => l.show).map(l => `
          <li>
            <a href="${l.id}" 
               class="${currentPage === l.id ? 'active' : ''}" 
               ${currentPage === l.id ? 'aria-current="page"' : ''} 
               data-i18n="${l.label}">
               ${t(l.label)}
               ${l.badge ? `<span id="nav-painel-badge" class="nav-badge" style="display: none;">0</span>` : ''}
            </a>
          </li>
        `).join('')}
      </ul>
    `;
  },

  getLangButtons() {
    const lang = typeof currentLang !== 'undefined' ? currentLang : 'pt';
    const labels = { pt: 'PT', en: 'EN', es: 'ES' };
    
    return `
      <div class="lang-dropdown">
        <button class="lang-toggle" aria-haspopup="true" aria-expanded="false">
          ${labels[lang] || 'PT'}
        </button>
        <div class="lang-menu" role="menu">
          <button class="lang-item ${lang === 'pt' ? 'active' : ''}" onclick="setLanguage('pt')" role="menuitem">Português (PT)</button>
          <button class="lang-item ${lang === 'en' ? 'active' : ''}" onclick="setLanguage('en')" role="menuitem">English (EN)</button>
          <button class="lang-item ${lang === 'es' ? 'active' : ''}" onclick="setLanguage('es')" role="menuitem">Español (ES)</button>
        </div>
      </div>
    `;
  },

  toggleMobileMenu() {
    const menu = document.querySelector('.navbar-links');
    if (menu) menu.classList.toggle('active');
  }
};

// Inicializa a navbar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  Navbar.render();
  
  // Re-renderizar se o idioma mudar (opcional, applyTranslations geralmente resolve)
  window.addEventListener('languageChanged', () => Navbar.render());
});
