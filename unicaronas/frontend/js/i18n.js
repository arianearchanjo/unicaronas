/**
 * UniCaronas — i18n.js
 * Sistema de internacionalização e correções de acentuação.
 */

const translations = {
  pt: {
    // Navbar
    'nav-dashboard': 'Painel',
    'nav-buscar': 'Buscar carona',
    'nav-oferecer': 'Oferecer carona',
    'nav-gerenciar': 'Gerenciar caronas',
    'nav-mensagens': 'Mensagens',
    'nav-perfil': 'Perfil',
    'nav-sair': 'Sair',
    
    // Dashboard
    'welcome-loading': 'Carregando...',
    'welcome-morning': 'Bom dia',
    'welcome-afternoon': 'Boa tarde',
    'welcome-evening': 'Boa noite',
    'sub-welcome': 'encontre ou ofereça uma carona',
    'sub-welcome-passenger': 'encontre uma carona',
    'sub-welcome-driver': 'ofereça uma carona',
    'stat-avail-rides': 'Caronas disponíveis',
    'stat-my-rides': 'Minhas caronas',
    'stat-my-rating': 'Minha avaliação',
    'btn-search-ride': 'Buscar carona',
    'btn-offer-ride': 'Oferecer carona',
    'label-rides-now': 'Caronas disponíveis agora',
    'label-my-requests': 'Solicitações nas suas caronas',
    'empty-rides': 'Nenhuma carona disponível no momento.',
    'error-rides': 'Erro ao carregar caronas. Verifique se o servidor está rodando.',
    'of': 'de',
    'pay': 'Pagar',
    
    // Carona Card / Detalhes
    'card-time': 'Horário',
    'card-vagas': 'Vagas',
    'card-vagas-avail': 'disponíveis',
    'card-dist': 'Distância',
    'card-price-per-person': 'Por pessoa',
    'card-details': 'Ver detalhes',
    'ride-details-title': 'Detalhes da viagem',
    'ride-label-driver': 'Motorista',
    'ride-label-value': 'Valor por passageiro',
    'ride-btn-request': 'Solicitar vaga',
    'ride-status-confirmed': 'Vaga confirmada',
    'ride-btn-rate-driver': 'Avaliar Motorista',
    'ride-status-waiting': 'Aguardando resposta',
    'ride-btn-finish': 'Concluir carona',
    'ride-status-finished': 'Viagem finalizada',
    'ride-chat-title': 'Conversa',
    'ride-chat-placeholder': 'Digite uma mensagem...',
    'ride-chat-send': 'Enviar',
    'ride-modal-rate-title': 'Avaliar Usuário',
    'ride-label-rating': 'Sua nota',
    'ride-label-comment': 'Comentário (opcional)',
    'ride-placeholder-comment': 'Como foi a experiência?',
    'ride-btn-send-rating': 'Enviar Avaliação',
    
    // Perfil
    'profile-title': 'Perfil',
    'profile-member-since': 'Membro desde',
    'profile-edit': 'Editar perfil',
    'profile-stats-driver': 'Caronas como motorista',
    'profile-stats-passenger': 'Caronas como passageiro',
    'profile-stats-rating': 'Avaliação média',
    'profile-evaluations': 'Avaliações recebidas',
    'profile-no-evaluations': 'Nenhuma avaliação ainda',
    'profile-evaluations-sub': 'As avaliações recebidas após caronas aparecerão aqui.',
    'modal-edit-title': 'Editar perfil',
    'label-full-name': 'Nome completo',
    'label-phone': 'Telefone',
    'label-course': 'Curso',
    'label-photo': 'Foto de perfil',
    'btn-choose-image': 'Escolher imagem',
    'file-no-selected': 'Nenhum arquivo selecionado',
    'file-formats': 'Formatos aceitos: JPEG, PNG, WEBP (máx 2MB)',
    'btn-cancel': 'Cancelar',
    'btn-save-changes': 'Salvar alterações',
    
    // Buscar
    'search-title': 'Buscar Carona',
    'search-sub': 'Encontre pessoas indo para o mesmo destino que você',
    'filter-origin': 'Origem',
    'filter-destination': 'Destino',
    'filter-date': 'Data',
    'filter-all-origins': 'Todas as origens',
    'filter-all-destinations': 'Todos os destinos',
    'btn-filter': 'Filtrar',
    
    // Criar Carona
    'create-title': 'Oferecer Carona',
    'create-sub': 'Ajude a comunidade e economize no trajeto',
    'label-origin': 'Ponto de partida',
    'label-destination': 'Destino final',
    'label-datetime': 'Data e Horário',
    'label-vagas': 'Vagas disponíveis',
    'label-value': 'Valor da contribuição',
    'label-obs': 'Observações (opcional)',
    'btn-publish': 'Publicar carona',
    
    // Login / Cadastro
    'login-title': 'Bem-vindo de volta',
    'login-sub': 'Acesse sua conta para continuar',
    'label-email': 'E-mail institucional',
    'label-password': 'Senha',
    'btn-login': 'Entrar',
    'login-no-account': 'Não tem uma conta?',
    'login-create-account': 'Criar conta agora',
    'register-title': 'Criar conta',
    'register-sub': 'Junte-se à maior rede de caronas universitárias',
    'label-matricula': 'Matrícula',
    'btn-register': 'Cadastrar',
    'register-has-account': 'Já tem uma conta?',
    'register-login-now': 'Fazer login',
  },
  en: {
    // Navbar
    'nav-dashboard': 'Dashboard',
    'nav-buscar': 'Search ride',
    'nav-oferecer': 'Offer ride',
    'nav-gerenciar': 'Manage rides',
    'nav-perfil': 'Profile',
    'nav-sair': 'Logout',
    
    // Dashboard
    'welcome-loading': 'Loading...',
    'welcome-morning': 'Good morning',
    'welcome-afternoon': 'Good afternoon',
    'welcome-evening': 'Good evening',
    'sub-welcome': 'Find or offer a ride',
    'sub-welcome-passenger': 'Find a ride',
    'sub-welcome-driver': 'Offer a ride',
    'stat-avail-rides': 'Available rides',
    'stat-my-rides': 'My rides',
    'stat-my-rating': 'My rating',
    'btn-search-ride': 'Search ride',
    'btn-offer-ride': 'Offer ride',
    'label-rides-now': 'Available rides now',
    'label-my-requests': 'Requests in your rides',
    'empty-rides': 'No rides available at the moment.',
    'error-rides': 'Error loading rides. Check if the server is running.',
    
    // Carona Card / Detalhes
    'card-time': 'Time',
    'card-vagas': 'Seats',
    'card-vagas-avail': 'available',
    'card-dist': 'Distance',
    'card-price-per-person': 'Per person',
    'card-details': 'View details',
    'ride-details-title': 'Trip details',
    'ride-label-driver': 'Driver',
    'ride-label-value': 'Value per passenger',
    'ride-btn-request': 'Request seat',
    'ride-status-confirmed': 'Seat confirmed',
    'ride-btn-rate-driver': 'Rate Driver',
    'ride-status-waiting': 'Waiting for response',
    'ride-btn-finish': 'Finish ride',
    'ride-status-finished': 'Trip finished',
    'ride-chat-title': 'Chat',
    'ride-chat-placeholder': 'Type a message...',
    'ride-chat-send': 'Send',
    'ride-modal-rate-title': 'Rate User',
    'ride-label-rating': 'Your rating',
    'ride-label-comment': 'Comment (optional)',
    'ride-placeholder-comment': 'How was the experience?',
    'ride-btn-send-rating': 'Send Rating',
    
    // Profile
    'profile-title': 'Profile',
    'profile-member-since': 'Member since',
    'profile-edit': 'Edit profile',
    'profile-stats-driver': 'Rides as driver',
    'profile-stats-passenger': 'Rides as passenger',
    'profile-stats-rating': 'Average rating',
    'profile-evaluations': 'Evaluations received',
    'profile-no-evaluations': 'No evaluations yet',
    'profile-evaluations-sub': 'Evaluations received after rides will appear here.',
    'modal-edit-title': 'Edit profile',
    'label-full-name': 'Full name',
    'label-phone': 'Phone',
    'label-course': 'Course',
    'label-photo': 'Profile photo',
    'btn-choose-image': 'Choose image',
    'file-no-selected': 'No file selected',
    'file-formats': 'Accepted formats: JPEG, PNG, WEBP (max 2MB)',
    'btn-cancel': 'Cancel',
    'btn-save-changes': 'Save changes',
    
    // Search
    'search-title': 'Search Ride',
    'search-sub': 'Find people going to the same destination as you',
    'filter-origin': 'Origin',
    'filter-destination': 'Destination',
    'filter-date': 'Date',
    'filter-all-origins': 'All origins',
    'filter-all-destinations': 'All destinations',
    'btn-filter': 'Filter',
    
    // Create Ride
    'create-title': 'Offer Ride',
    'create-sub': 'Help the community and save on the way',
    'label-origin': 'Starting point',
    'label-destination': 'Final destination',
    'label-datetime': 'Date and Time',
    'label-vagas': 'Available seats',
    'label-value': 'Contribution value',
    'label-obs': 'Observations (optional)',
    'btn-publish': 'Publish ride',
    
    // Login / Register
    'login-title': 'Welcome back',
    'login-sub': 'Access your account to continue',
    'label-email': 'Institutional email',
    'label-password': 'Password',
    'btn-login': 'Login',
    'login-no-account': 'Don\'t have an account?',
    'login-create-account': 'Create account now',
    'register-title': 'Create account',
    'register-sub': 'Join the largest university ride network',
    'label-matricula': 'Student ID',
    'btn-register': 'Register',
    'register-has-account': 'Already have an account?',
    'register-login-now': 'Login now',
  },
  es: {
    // Navbar
    'nav-dashboard': 'Panel',
    'nav-buscar': 'Buscar viaje',
    'nav-oferecer': 'Oferecer viaje',
    'nav-gerenciar': 'Gestionar viajes',
    'nav-perfil': 'Perfil',
    'nav-sair': 'Salir',
    
    // Dashboard
    'welcome-loading': 'Cargando...',
    'welcome-morning': 'Buenos días',
    'welcome-afternoon': 'Buenas tardes',
    'welcome-evening': 'Buenas noches',
    'sub-welcome': 'Encuentra u ofrece un viaje',
    'sub-welcome-passenger': 'Encuentra un viaje',
    'sub-welcome-driver': 'Ofrece un viaje',
    'stat-avail-rides': 'Viajes disponíveis',
    'stat-my-rides': 'Mis viajes',
    'stat-my-rating': 'Mi calificación',
    'btn-search-ride': 'Buscar viaje',
    'btn-offer-ride': 'Ofrecer viaje',
    'label-rides-now': 'Viajes disponibles ahora',
    'label-my-requests': 'Solicitudes en tus viajes',
    'empty-rides': 'No hay viajes disponíveis por el momento.',
    'error-rides': 'Error al cargar los viajes. Comprueba si el servidor está funcionando.',
    
    // Carona Card / Detalhes
    'card-time': 'Horario',
    'card-vagas': 'Plazas',
    'card-vagas-avail': 'disponibles',
    'card-dist': 'Distancia',
    'card-price-per-person': 'Por persona',
    'card-details': 'Ver detalles',
    'ride-details-title': 'Detalles del viaje',
    'ride-label-driver': 'Conductor',
    'ride-label-value': 'Valor por pasajero',
    'ride-btn-request': 'Solicitar plaza',
    'ride-status-confirmed': 'Plaza confirmada',
    'ride-btn-rate-driver': 'Calificar Conductor',
    'ride-status-waiting': 'Esperando respuesta',
    'ride-btn-finish': 'Finalizar viaje',
    'ride-status-finished': 'Viaje finalizado',
    'ride-chat-title': 'Conversación',
    'ride-chat-placeholder': 'Escribe un mensaje...',
    'ride-chat-send': 'Enviar',
    'ride-modal-rate-title': 'Calificar Usuario',
    'ride-label-rating': 'Tu nota',
    'ride-label-comment': 'Comentario (opcional)',
    'ride-placeholder-comment': '¿Cómo fue la experiencia?',
    'ride-btn-send-rating': 'Enviar Calificación',
    
    // Perfil
    'profile-title': 'Perfil',
    'profile-member-since': 'Miembro desde',
    'profile-edit': 'Editar perfil',
    'profile-stats-driver': 'Viajes como conductor',
    'profile-stats-passenger': 'Viajes como pasajero',
    'profile-stats-rating': 'Calificación media',
    'profile-evaluations': 'Calificaciones recibidas',
    'profile-no-evaluations': 'Ninguna calificación aún',
    'profile-evaluations-sub': 'Las calificaciones recibidas después de los viajes aparecerán aquí.',
    'modal-edit-title': 'Editar perfil',
    'label-full-name': 'Nombre completo',
    'label-phone': 'Teléfono',
    'label-course': 'Curso',
    'label-photo': 'Foto de perfil',
    'btn-choose-image': 'Elegir imagem',
    'file-no-selected': 'Ningún arquivo seleccionado',
    'file-formats': 'Formatos aceptados: JPEG, PNG, WEBP (máx 2MB)',
    'btn-cancel': 'Cancelar',
    'btn-save-changes': 'Guardar câmbios',
    
    // Buscar
    'search-title': 'Buscar Viaje',
    'search-sub': 'Encuentra personas que vayan al mismo destino que tú',
    'filter-origin': 'Origen',
    'filter-destination': 'Destino',
    'filter-date': 'Fecha',
    'filter-all-origins': 'Todos los orígenes',
    'filter-all-destinations': 'Todos los destinos',
    'btn-filter': 'Filtrar',
    
    // Criar Carona
    'create-title': 'Ofrecer Viaje',
    'create-sub': 'Ayuda a la comunidad y ahorra en el trayecto',
    'label-origin': 'Punto de partida',
    'label-destination': 'Destino final',
    'label-datetime': 'Fecha y Hora',
    'label-vagas': 'Plazas disponibles',
    'label-value': 'Valor de la contribución',
    'label-obs': 'Observaciones (opcional)',
    'btn-publish': 'Publicar viaje',
    
    // Login / Registro
    'login-title': 'Bienvenido de nuevo',
    'login-sub': 'Accede a tu cuenta para continuar',
    'label-email': 'Correo institucional',
    'label-password': 'Contraseña',
    'btn-login': 'Entrar',
    'login-no-account': '¿No tienes una cuenta?',
    'login-create-account': 'Crear cuenta ahora',
    'register-title': 'Crear cuenta',
    'register-sub': 'Únete a la mayor rede de viajes universitarios',
    'label-matricula': 'Matrícula',
    'btn-register': 'Registrarse',
    'register-has-account': '¿Ya tienes una cuenta?',
    'register-login-now': 'Iniciar sesión',
  }
};

let currentLang = localStorage.getItem('unicaronas_lang') || 'pt';

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('unicaronas_lang', lang);
  applyTranslations();
  updateLangSelector();
}

function t(key) {
  return (translations[currentLang] && translations[currentLang][key]) || key;
}

function applyTranslations() {
  const elements = document.querySelectorAll('[data-i18n]');
  elements.forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[currentLang] && translations[currentLang][key]) {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = translations[currentLang][key];
      } else {
        el.textContent = translations[currentLang][key];
      }
    }
  });
  
  // Disparar um evento customizado para scripts que precisam atualizar conteúdo dinâmico
  window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: currentLang } }));
}

function updateLangSelector() {
  const selector = document.getElementById('lang-selector');
  if (selector) selector.value = currentLang;
}

// Inserção automática do seletor na navbar ou em local fixo
function injectLangSelector() {
  let parent = document.querySelector('.navbar .container');
  let isFixed = false;
  
  if (!parent) {
    // Se não houver navbar, cria um container fixo no topo direito
    parent = document.createElement('div');
    parent.id = 'lang-selector-fixed';
    parent.style.position = 'fixed';
    parent.style.top = '1rem';
    parent.style.right = '1rem';
    parent.style.zIndex = '1000';
    parent.style.display = 'flex';
    parent.style.background = 'var(--surface)';
    parent.style.padding = '0.4rem';
    parent.style.borderRadius = 'var(--radius-sm)';
    parent.style.border = '1px solid var(--border)';
    document.body.appendChild(parent);
    isFixed = true;
  }
  
  // Verifica se já existe
  if (document.getElementById('lang-selector-container')) return;
  
  const container = document.createElement('div');
  container.id = 'lang-selector-container';
  container.style.display = 'flex';
  container.style.alignItems = 'center';
  container.style.gap = '0.5rem';
  if (!isFixed) container.style.marginLeft = '1rem';
  
  const select = document.createElement('select');
  select.id = 'lang-selector';
  select.className = 'form-control';
  select.style.padding = '0.2rem 0.5rem';
  select.style.fontSize = '0.75rem';
  select.style.width = 'auto';
  select.style.background = 'var(--bg-2)';
  select.style.border = 'none';
  select.style.color = 'var(--text)';
  
  const options = [
    { value: 'pt', label: 'PT' },
    { value: 'en', label: 'EN' },
    { value: 'es', label: 'ES' }
  ];
  
  options.forEach(opt => {
    const o = document.createElement('option');
    o.value = opt.value;
    o.textContent = opt.label;
    select.appendChild(o);
  });
  
  select.value = currentLang;
  select.addEventListener('change', (e) => setLanguage(e.target.value));
  
  container.appendChild(select);
  
  if (isFixed) {
    parent.appendChild(container);
  } else {
    // Insere antes do botão de logout se ele existir, ou no final da container
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
      parent.insertBefore(container, btnLogout);
    } else {
      parent.appendChild(container);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  injectLangSelector();
  applyTranslations();
});