(function() {
    'use strict';

    let isOpen = false;
    let notificacoes = [];

    const UCNotif = {
        init: async function() {
            if (!isLogado()) return;

            this.injectStyles();
            this.createElements();
            this.addEventListeners();
            await this.recarregar();

            // Polling a cada 10 segundos
            setInterval(() => this.recarregar(), 10000);
        },

        injectStyles: function() {
            const style = document.createElement('style');
            style.textContent = `
                #uc-notif-container {
                    position: relative;
                    display: inline-flex;
                    align-items: center;
                    margin-right: 1rem;
                }
                #uc-notif-btn {
                    background: transparent;
                    border: none;
                    color: var(--text);
                    cursor: pointer;
                    position: relative;
                    padding: 8px;
                    display: flex;
                    transition: color 0.2s;
                }
                #uc-notif-btn:hover { color: var(--accent); }
                #uc-notif-badge {
                    position: absolute;
                    top: 4px;
                    right: 4px;
                    background: #ff4757;
                    color: white;
                    font-size: 10px;
                    font-weight: bold;
                    min-width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    display: none;
                    align-items: center;
                    justify-content: center;
                    padding: 0 4px;
                    border: 2px solid var(--surface);
                }
                #uc-notif-panel {
                    position: fixed;
                    top: 0;
                    right: -350px;
                    width: 350px;
                    height: 100vh;
                    background: var(--surface);
                    border-left: 1px solid var(--border);
                    box-shadow: -5px 0 25px rgba(0,0,0,0.3);
                    z-index: 10000;
                    transition: right 0.3s ease;
                    display: flex;
                    flex-direction: column;
                }
                #uc-notif-panel.open { right: 0; }
                .uc-notif-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: rgba(0,0,0,0.5);
                    backdrop-filter: blur(2px);
                    z-index: 9999;
                    display: none;
                }
                .uc-notif-overlay.open { display: block; }
                .uc-notif-header {
                    padding: 1.5rem;
                    border-bottom: 1px solid var(--border);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .uc-notif-header h3 { margin: 0; font-size: 1.25rem; color: var(--text); }
                .uc-notif-close {
                    background: none;
                    border: none;
                    color: var(--text-2);
                    cursor: pointer;
                    font-size: 1.5rem;
                }
                .uc-notif-list {
                    overflow-y: auto;
                    flex: 1;
                }
                .uc-notif-item {
                    padding: 1rem 1.5rem;
                    border-bottom: 1px solid var(--border);
                    cursor: pointer;
                    transition: background 0.2s;
                    display: flex;
                    gap: 1rem;
                    position: relative;
                }
                .uc-notif-item:hover { background: rgba(255,255,255,0.03); }
                .uc-notif-item.nao-lida::before {
                    content: '';
                    position: absolute;
                    left: 0;
                    top: 0;
                    bottom: 0;
                    width: 4px;
                    background: var(--accent);
                }
                .uc-notif-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    background: var(--border);
                    color: var(--text-2);
                }
                .uc-notif-icon.solicitacao { background: rgba(108, 99, 255, 0.1); color: #6c63ff; }
                .uc-notif-icon.mensagem { background: rgba(46, 204, 113, 0.1); color: #2ecc71; }
                .uc-notif-icon.cancelamento { background: rgba(231, 76, 60, 0.1); color: #e74c3c; }
                .uc-notif-icon.lembrete { background: rgba(241, 196, 15, 0.1); color: #f1c40f; }
                .uc-notif-content { flex: 1; min-width: 0; }
                .uc-notif-msg { font-size: 0.9rem; color: var(--text); margin-bottom: 0.25rem; line-height: 1.4; }
                .uc-notif-time { font-size: 0.75rem; color: var(--text-2); }
                .uc-notif-empty { padding: 3rem 1.5rem; text-align: center; color: var(--text-2); }
            `;
            document.head.appendChild(style);
        },

        createElements: function() {
            const actions = document.querySelector('.navbar-actions');
            if (!actions) return;

            // Inserir antes do dropdown do usuário
            const userDropdown = document.getElementById('user-dropdown');
            
            const btnWrap = document.createElement('div');
            btnWrap.id = 'uc-notif-container';
            btnWrap.innerHTML = `
                <button id="uc-notif-btn" aria-label="Notificações">
                    <i data-lucide="bell"></i>
                    <span id="uc-notif-badge">0</span>
                </button>
            `;

            if (userDropdown) {
                actions.insertBefore(btnWrap, userDropdown);
            } else {
                actions.appendChild(btnWrap);
            }

            // Criar painel e overlay no body
            const overlay = document.createElement('div');
            overlay.className = 'uc-notif-overlay';
            overlay.id = 'uc-notif-overlay';
            
            const panel = document.createElement('div');
            panel.id = 'uc-notif-panel';
            panel.innerHTML = `
                <div class="uc-notif-header">
                    <h3>Notificações</h3>
                    <button class="uc-notif-close">&times;</button>
                </div>
                <div class="uc-notif-list" id="uc-notif-list"></div>
            `;

            document.body.appendChild(overlay);
            document.body.appendChild(panel);

            if (typeof lucide !== 'undefined') lucide.createIcons();
        },

        addEventListeners: function() {
            const btn = document.getElementById('uc-notif-btn');
            const panel = document.getElementById('uc-notif-panel');
            const overlay = document.getElementById('uc-notif-overlay');
            const close = panel.querySelector('.uc-notif-close');

            const togglePanel = async (open) => {
                isOpen = open;
                panel.classList.toggle('open', isOpen);
                overlay.classList.toggle('open', isOpen);
                
                if (isOpen) {
                    await api.marcarTodasNotif();
                    await this.recarregar();
                }
            };

            btn.addEventListener('click', () => togglePanel(true));
            close.addEventListener('click', () => togglePanel(false));
            overlay.addEventListener('click', () => togglePanel(false));
        },

        recarregar: async function() {
            try {
                const res = await api.listarNotificacoes();
                notificacoes = res.data || [];
                this.renderizar();
            } catch (err) {
                console.error('Erro ao carregar notificações:', err);
            }
        },

        renderizar: function() {
            const list = document.getElementById('uc-notif-list');
            const badge = document.getElementById('uc-notif-badge');
            
            const naoLidas = notificacoes.filter(n => !n.lida).length;
            if (naoLidas > 0) {
                badge.textContent = naoLidas;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }

            if (notificacoes.length === 0) {
                list.innerHTML = '<div class="uc-notif-empty">Nenhuma notificação por enquanto.</div>';
                return;
            }

            list.innerHTML = notificacoes.map(n => {
                const timeStr = this.formatarTempoRelativo(n.criado_em);
                const icon = this.getIconLucide(n.tipo);
                return `
                    <div class="uc-notif-item ${n.lida ? '' : 'nao-lida'}" data-id="${n.id}" data-carona-id="${n.carona_id}">
                        <div class="uc-notif-icon ${n.tipo}">
                            <i data-lucide="${icon}"></i>
                        </div>
                        <div class="uc-notif-content">
                            <div class="uc-notif-msg">${n.conteudo}</div>
                            <div class="uc-notif-time">${timeStr}</div>
                        </div>
                    </div>
                `;
            }).join('');

            if (typeof lucide !== 'undefined') lucide.createIcons();

            list.querySelectorAll('.uc-notif-item').forEach(item => {
                item.addEventListener('click', () => {
                    const caronaId = item.dataset.caronaId;
                    if (caronaId && caronaId !== 'null') {
                        window.location.href = `carona.html?id=${caronaId}`;
                    }
                });
            });
        },

        getIconLucide: function(tipo) {
            switch(tipo) {
                case 'solicitacao': return 'user-plus';
                case 'mensagem': return 'message-circle';
                case 'cancelamento': return 'x-circle';
                case 'lembrete': return 'clock';
                default: return 'bell';
            }
        },

        formatarTempoRelativo: function(dataIso) {
            const agora = new Date();
            const data = new Date(dataIso);
            const difSeg = Math.floor((agora - data) / 1000);

            if (difSeg < 60) return 'há poucos segundos';
            if (difSeg < 3600) return `há ${Math.floor(difSeg / 60)} min`;
            if (difSeg < 86400) return `há ${Math.floor(difSeg / 3600)} horas`;
            if (difSeg < 172800) return 'ontem';
            return data.toLocaleDateString('pt-BR');
        }
    };

    window.UCNotif = UCNotif;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => UCNotif.init());
    } else {
        UCNotif.init();
    }

})();
