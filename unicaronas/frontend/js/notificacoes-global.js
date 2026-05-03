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

            // Polling a cada 60 segundos
            setInterval(() => this.recarregar(), 60000);
        },

        injectStyles: function() {
            const style = document.createElement('style');
            style.textContent = `
                #uc-notif-container {
                    position: relative;
                    display: inline-flex;
                    align-items: center;
                    margin-right: 15px;
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
                    top: 2px;
                    right: 2px;
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
                }
                #uc-notif-panel {
                    position: absolute;
                    top: 100%;
                    right: 0;
                    width: 320px;
                    background: var(--surface);
                    border: 1px solid var(--border);
                    border-radius: 8px;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.5);
                    z-index: 300;
                    display: none;
                    flex-direction: column;
                    margin-top: 10px;
                    max-height: 400px;
                }
                #uc-notif-panel.open { display: flex; }
                .uc-notif-header {
                    padding: 12px 15px;
                    border-bottom: 1px solid var(--border);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .uc-notif-header h3 { margin: 0; font-size: 16px; color: var(--text); }
                .uc-notif-mark-all {
                    font-size: 12px;
                    color: var(--accent);
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 0;
                }
                .uc-notif-list {
                    overflow-y: auto;
                    flex: 1;
                }
                .uc-notif-item {
                    padding: 12px 15px;
                    border-bottom: 1px solid var(--border);
                    cursor: pointer;
                    transition: background 0.2s;
                    display: flex;
                    gap: 12px;
                }
                .uc-notif-item:hover { background: rgba(255,255,255,0.05); }
                .uc-notif-item.nao-lida { border-left: 3px solid var(--accent); background: rgba(108, 99, 255, 0.05); }
                .uc-notif-icon {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                .uc-notif-icon.info { background: #6c63ff22; color: #6c63ff; }
                .uc-notif-icon.success { background: #2ecc7122; color: #2ecc71; }
                .uc-notif-icon.warning { background: #f1c40f22; color: #f1c40f; }
                .uc-notif-content { flex: 1; min-width: 0; }
                .uc-notif-title { font-weight: bold; font-size: 14px; margin-bottom: 4px; color: var(--text); }
                .uc-notif-msg { font-size: 13px; color: #aaa; margin-bottom: 4px; line-height: 1.4; }
                .uc-notif-time { font-size: 11px; color: #666; }
                .uc-notif-empty { padding: 30px; text-align: center; color: #666; font-size: 14px; }
            `;
            document.head.appendChild(style);
        },

        createElements: function() {
            const navbarContainer = document.querySelector('.navbar .container');
            if (!navbarContainer) return;

            const logoutBtn = document.getElementById('btn-logout');
            
            const container = document.createElement('div');
            container.id = 'uc-notif-container';
            container.innerHTML = `
                <button id="uc-notif-btn" title="Notificações">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                    <span id="uc-notif-badge">0</span>
                </button>
                <div id="uc-notif-panel">
                    <div class="uc-notif-header">
                        <h3>Notificações</h3>
                        <button class="uc-notif-mark-all">Marcar todas como lidas</button>
                    </div>
                    <div class="uc-notif-list" id="uc-notif-list">
                        <!-- Itens aqui -->
                    </div>
                </div>
            `;

            if (logoutBtn) {
                navbarContainer.insertBefore(container, logoutBtn.parentNode === navbarContainer ? logoutBtn : logoutBtn.closest('li'));
            } else {
                navbarContainer.appendChild(container);
            }
        },

        addEventListeners: function() {
            const btn = document.getElementById('uc-notif-btn');
            const panel = document.getElementById('uc-notif-panel');
            const markAll = document.querySelector('.uc-notif-mark-all');

            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                isOpen = !isOpen;
                panel.classList.toggle('open', isOpen);
            });

            document.addEventListener('click', () => {
                if (isOpen) {
                    isOpen = false;
                    panel.classList.remove('open');
                }
            });

            panel.addEventListener('click', (e) => e.stopPropagation());

            markAll.addEventListener('click', async () => {
                try {
                    await api.marcarTodasNotif();
                    await this.recarregar();
                } catch (err) {
                    console.error('Erro ao marcar todas como lidas:', err);
                }
            });
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
                const iconClass = this.getIconClass(n.tipo);
                const timeStr = this.formatarTempoRelativo(n.criado_em);
                return `
                    <div class="uc-notif-item ${n.lida ? '' : 'nao-lida'}" data-id="${n.id}">
                        <div class="uc-notif-icon ${iconClass}">
                            ${this.getIconSvg(n.tipo)}
                        </div>
                        <div class="uc-notif-content">
                            <div class="uc-notif-title">${n.titulo}</div>
                            <div class="uc-notif-msg">${n.mensagem}</div>
                            <div class="uc-notif-time">${timeStr}</div>
                        </div>
                    </div>
                `;
            }).join('');

            list.querySelectorAll('.uc-notif-item').forEach(item => {
                item.addEventListener('click', async () => {
                    const id = item.dataset.id;
                    const notif = notificacoes.find(n => n.id == id);
                    
                    try {
                        if (!notif.lida) {
                            await api.marcarNotificacao(id);
                        }
                        
                        if (notif.referencia_tipo === 'carona' && notif.referencia_id) {
                            window.location.href = `carona.html?id=${notif.referencia_id}`;
                        } else {
                            await this.recarregar();
                        }
                    } catch (err) {
                        console.error('Erro ao processar clique na notificação:', err);
                    }
                });
            });
        },

        getIconClass: function(tipo) {
            if (tipo === 'solicitacao_aceita') return 'success';
            if (tipo === 'solicitacao_recusada') return 'warning';
            return 'info';
        },

        getIconSvg: function(tipo) {
            if (tipo === 'solicitacao_aceita') {
                return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
            }
            if (tipo === 'solicitacao_recusada') {
                return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
            }
            return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
        },

        formatarTempoRelativo: function(dataIso) {
            const agora = new Date();
            const data = new Date(dataIso);
            const difSeg = Math.floor((agora - data) / 1000);

            if (difSeg < 60) return 'agora há pouco';
            if (difSeg < 3600) return `há ${Math.floor(difSeg / 60)} min`;
            if (difSeg < 86400) return `há ${Math.floor(difSeg / 3600)} horas`;
            if (difSeg < 172800) return 'ontem';
            return data.toLocaleDateString('pt-BR');
        }
    };

    window.UCNotif = UCNotif;

    document.addEventListener('DOMContentLoaded', () => {
        UCNotif.init();
    });

})();
