/**
 * UniCaronas — perfil.js
 */

document.addEventListener('DOMContentLoaded', async () => {
  if (!protegerRota()) return;

  const usuarioLogado = getUser();
  const idParam  = getParam('id');
  const perfilId = idParam ? parseInt(idParam, 10) : parseInt(usuarioLogado.id, 10);
  const ehProprio = perfilId === parseInt(usuarioLogado.id, 10);

  if (isNaN(perfilId) || perfilId <= 0) {
    setLoader(false);
    showAlert(currentLang === 'pt' ? 'ID de usuário inválido' : 'Invalid user ID', 'error');
    return;
  }

  setLoader(true);

  try {
    const [resU, resAv, resHis, resEco] = await Promise.all([
      api.perfil(perfilId),
      api.avaliacoes(perfilId),
      api.getHistorico(perfilId),
      api.getEcoStats(perfilId)
    ]);

    renderPerfil(resU.data, ehProprio);
    renderStats(resU.data);
    renderEcoStats(resEco.data);
    renderAvaliacoes(resAv.data);
    renderHistorico(resHis.data);
    
    // Novas funcionalidades de gamificação
    renderCompletude(resU.data, ehProprio);
    renderBadges(resU.data);
    
    if (ehProprio) {
      initEdicao(resU.data);
      if (resU.data.perfil_tipo !== 'estudante') {
        const secaoVeiculos = document.getElementById('secao-veiculos');
        if (secaoVeiculos) secaoVeiculos.style.display = 'block';
        carregarVeiculos();
        initFormVeiculo();
      }
    }
    
    if (typeof lucide !== 'undefined') lucide.createIcons();

  } catch (err) {
    console.error('Erro ao carregar perfil:', err);
    if (/token/i.test(err.message)) { logout(); return; }
    showAlert(err.message || (currentLang === 'pt' ? 'Erro ao carregar perfil' : 'Error loading profile'), 'error');
  } finally {
    setLoader(false);
  }
});

function renderEcoStats(eco) {
  setText('eco-km', (eco.km_total || 0) + ' km');
  setText('eco-co2', (eco.co2_evitado_kg || 0) + ' kg');
  setText('eco-economia', formatarMoeda(eco.economia_reais || 0));
}

// ── Perfil ────────────────────────────────────────────────────────────────────

function renderPerfil(u, ehProprio) {
  atualizarAvatar('perfil-avatar', u.foto_url, u.nome);
  setText('perfil-nome',   u.nome);
  
  // Debug para identificar troca de usuário
  console.log('[UniCaronas] Visualizando Perfil:', { id: u.id, nome: u.nome, is_admin: u.is_admin });
  console.log('[UniCaronas] Usuário Logado:', getUser());

  setText('perfil-curso',  u.curso  || (currentLang === 'pt' ? 'Curso não informado' : 'Course not informed'));
  setText('perfil-email',  u.email);
  setText('perfil-membro', t('profile-member-since') + ' ' + formatarDataCurta(u.criado_em));
  
  // Renderiza o badge de verificação (definido no perfil.html)
  if (window.renderBadgeVerificacao) {
    window.renderBadgeVerificacao(u);
  }

  const badge = document.getElementById('perfil-tipo-badge');
  if (badge) {
    const tipos = {
      'estudante': { label: 'Passageiro', color: 'badge-blue' },
      'motorista': { label: 'Motorista', color: 'badge-green' },
      'misto':     { label: 'Misto', color: 'badge-accent' }
    };
    const tInfo = tipos[u.perfil_tipo] || tipos['misto'];
    badge.innerHTML = `<span class="badge ${tInfo.color}">${tInfo.label}</span>`;
  }

  document.title = u.nome + ' — UniCaronas';

  const btn = document.getElementById('btn-editar-perfil');
  const btnDel = document.getElementById('btn-deletar-conta');
  if (ehProprio) { 
    if (btn) {
        btn.removeAttribute('hidden'); 
        btn.onclick = abrirModal; 
    }
    if (btnDel) {
      btnDel.removeAttribute('hidden');
      btnDel.onclick = confirmarExclusao;
    }
  } else {
    if (btn) btn.setAttribute('hidden', '');
    if (btnDel) btnDel.setAttribute('hidden', '');
  }
}

async function confirmarExclusao() {
  const msg = currentLang === 'pt' 
    ? 'TEM CERTEZA? Esta ação é irreversível e excluirá todos os seus dados, caronas e mensagens.' 
    : 'ARE YOU SURE? This action is irreversible and will delete all your data, rides, and messages.';
  
  if (confirm(msg)) {
    try {
      await api.deletarConta();
      showAlert(currentLang === 'pt' ? 'Conta excluída com sucesso.' : 'Account deleted successfully.', 'success');
      setTimeout(() => logout(), 2000);
    } catch (err) {
      showAlert(err.message || (currentLang === 'pt' ? 'Erro ao excluir conta' : 'Error deleting account'), 'error');
    }
  }
}

// ── Stats ─────────────────────────────────────────────────────────────────────

function renderStats(u) {
  setText('stat-motorista',  u.total_caronas_motorista  ?? '0');
  setText('stat-passageiro', u.total_caronas_passageiro ?? '0');
  const media = Number(u.avaliacao_media || 0).toFixed(1);
  setText('stat-nota', media);
  const estrelasEl = document.getElementById('stat-estrelas');
  if (estrelasEl) {
      estrelasEl.innerHTML = renderEstrelasLucide(media, u.total_avaliacoes);
  }
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ── Avaliações ────────────────────────────────────────────────────────────────

function renderAvaliacoes(lista) {
  const container = document.getElementById('lista-avaliacoes');
  const vazio     = document.getElementById('avaliacoes-vazio');

  if (!container) return;

  if (!lista || lista.length === 0) {
    if (vazio) vazio.style.display = 'block';
    container.style.display = 'none';
    return;
  }
  if (vazio) vazio.style.display = 'none';
  container.style.display = 'block';
  container.innerHTML = lista.map(cardAvaliacao).join('');
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function cardAvaliacao(av) {
  const nome = av.avaliador_nome || 'Usuário';
  const avatar = av.avaliador_foto
    ? `<img src="${av.avaliador_foto}" alt="${nome}" class="avaliacao-foto">`
    : `<span class="avaliacao-iniciais">${iniciais(nome)}</span>`;

  const comentario = av.comentario
    ? `<p class="avaliacao-comentario">${av.comentario}</p>` : '';

  return `
    <div class="card avaliacao-card">
      <div class="avaliacao-header">
        <div class="avaliacao-avatar">${avatar}</div>
        <div class="avaliacao-meta">
          <strong class="avaliacao-nome">${nome}</strong>
          <span class="avaliacao-data">${formatarData(av.criado_em)}</span>
        </div>
        <div class="avaliacao-nota">${renderEstrelasLucide(av.nota)}</div>
      </div>
      ${comentario}
      <div class="avaliacao-rota">
        <span class="badge badge-accent">Carona</span>
        <span class="avaliacao-rota-texto">${av.origem} <i data-lucide="arrow-right" style="width: 12px; height: 12px; vertical-align: middle;"></i> ${av.destino}</span>
        <span class="avaliacao-rota-data">${formatarData(av.horario_partida)}</span>
      </div>
    </div>`;
}

function renderEstrelasLucide(nota, total = null) {
  const n = parseFloat(nota);
  let html = '<div class="estrelas" style="display: flex; gap: 2px; align-items: center;">';
  for (let i = 1; i <= 5; i++) {
    if (n >= i) {
      html += '<i data-lucide="star" style="width: 14px; height: 14px; fill: var(--amber); color: var(--amber);"></i>';
    } else if (n >= i - 0.5) {
      html += '<i data-lucide="star-half" style="width: 14px; height: 14px; fill: var(--amber); color: var(--amber);"></i>';
    } else {
      html += '<i data-lucide="star" style="width: 14px; height: 14px; color: var(--border-2);"></i>';
    }
  }
  if (total !== null) {
    html += `<span class="estrelas-total">(${total})</span>`;
  }
  html += '</div>';
  return html;
}

// ── Histórico ────────────────────────────────────────────────────────────────

function renderHistorico(lista) {
  const container = document.getElementById('historico-lista');
  const vazio     = document.getElementById('historico-vazio');
  if (!container) return;

  if (!lista || lista.length === 0) {
    if (vazio) vazio.style.display = 'block';
    container.innerHTML = '';
    return;
  }

  if (vazio) vazio.style.display = 'none';
  container.innerHTML = lista.map(c => `
    <div class="info-row" style="padding: 1.25rem 0; border-bottom: 1px solid var(--border);">
      <div style="flex: 1; min-width: 0; padding-right: 1rem;">
        <strong style="color: var(--text); display: block; margin-bottom: 4px; font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          ${c.origem} <i data-lucide="arrow-right" style="width: 14px; height: 14px; color: var(--accent-2); vertical-align: middle; margin: 0 4px;"></i> ${c.destino}
        </strong>
        <small style="color: var(--text-3); font-family: var(--font-mono); font-size: 0.75rem;">
          ${formatarDataLonga(c.horario_partida)}
        </small>
      </div>
      <div style="text-align: right; flex-shrink: 0;">
        <span class="badge-role ${c.papel === 'motorista' ? 'badge-motorista' : 'badge-passageiro'}" style="display: inline-block; margin-bottom: 6px;">
          ${c.papel === 'motorista' ? (currentLang === 'pt' ? 'Motorista' : 'Driver') : (currentLang === 'pt' ? 'Passageiro' : 'Passenger')}
        </span>
        <div style="font-weight: 700; color: var(--text); font-variant-numeric: tabular-nums; font-size: 1.1rem;">
          ${formatarMoeda(c.valor_cobrado)}
        </div>
      </div>
    </div>
  `).join('');
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ── Modal Edição ──────────────────────────────────────────────────────────────

function initEdicao(u) {
  const inputNome = document.getElementById('edit-nome');
  const inputTelefone = document.getElementById('edit-telefone');
  const inputCurso = document.getElementById('edit-curso');
  const inputDiaEad = document.getElementById('edit-dia-ead');
  const inputGenero = document.getElementById('edit-genero');
  const inputFoto = document.getElementById('edit-foto');

  if (inputNome) inputNome.value = u.nome || '';
  if (inputTelefone) inputTelefone.value = u.telefone || '';
  if (inputCurso) inputCurso.value = u.curso || '';
  if (inputDiaEad) inputDiaEad.value = (u.dia_ead !== null && u.dia_ead !== undefined) ? u.dia_ead : '';
  if (inputGenero) inputGenero.value = u.genero || '';
  
  const radio = document.querySelector(`input[name="edit-perfil-tipo"][value="${u.perfil_tipo}"]`);
  if (radio) radio.checked = true;

  atualizarPreviewFoto(u.foto_url, u.nome);

  if (inputFoto) {
    inputFoto.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => atualizarPreviewFoto(event.target.result, u.nome);
          reader.readAsDataURL(file);
        }
      };
  }

  const btnFechar = document.getElementById('modal-fechar');
  if (btnFechar) btnFechar.onclick = fecharModal;

  const formEditar = document.getElementById('form-editar-perfil');
  if (formEditar) {
    formEditar.onsubmit = async (e) => {
        e.preventDefault();
        await salvarPerfil();
      };
  }
}

function abrirModal() {
  const modal = document.getElementById('modal-editar');
  if (modal) {
      modal.removeAttribute('hidden');
      document.body.style.overflow = 'hidden';
  }
}

function fecharModal() {
  const modal = document.getElementById('modal-editar');
  if (modal) {
      modal.setAttribute('hidden', '');
      document.body.style.overflow = '';
  }
}

async function salvarPerfil() {
  const btn  = document.querySelector('#form-editar-perfil [type="submit"]');
  const nome = document.getElementById('edit-nome')?.value.trim();
  const perfilTipo = document.querySelector('input[name="edit-perfil-tipo"]:checked')?.value;

  if (!nome || nome.length < 2) {
    showAlert('O nome deve ter pelo menos 2 caracteres', 'error', 'alert-modal');
    return;
  }

  if (btn) {
      btn.disabled = true;
      btn.textContent = 'Salvando...';
  }

  try {
    const formData = new FormData();
    formData.append('nome', nome);
    formData.append('telefone', document.getElementById('edit-telefone')?.value.trim() || '');
    formData.append('curso', document.getElementById('edit-curso')?.value.trim() || '');
    formData.append('genero', document.getElementById('edit-genero')?.value || '');
    formData.append('dia_ead', document.getElementById('edit-dia-ead')?.value || '');
    formData.append('perfil_tipo', perfilTipo || 'misto');
    
    const inputFoto = document.getElementById('edit-foto');
    if (inputFoto && inputFoto.files && inputFoto.files[0]) {
      formData.append('foto', inputFoto.files[0]);
    }

    const res = await api.atualizarPerfil(formData);

    // Sincroniza localStorage com os novos dados
    const updatedUser = { ...getUser(), ...res.data };
    setUser(updatedUser);
    
    // Atualiza interface
    renderPerfil(res.data, true);
    renderCompletude(res.data, true); // Atualiza barra de progresso
    
    fecharModal();
    
    // Feedback visual aprimorado
    const msgSuccess = currentLang === 'pt' ? 'Alterações salvas com sucesso!' : 'Changes saved successfully!';
    showAlert(msgSuccess, 'success');
    
    // Rolar para o topo para ver o alerta se necessário
    window.scrollTo({ top: 0, behavior: 'smooth' });

  } catch (err) {
    const msgError = err.message || (currentLang === 'pt' ? 'Erro ao salvar alterações' : 'Error saving changes');
    showAlert(msgError, 'error', 'alert-modal');
  } finally {
    if (btn) {
        btn.disabled = false;
        btn.textContent = 'Salvar alterações';
    }
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function setLoader(ativo) {
  const loader = document.getElementById('perfil-loader');
  const conteudo = document.getElementById('perfil-conteudo');
  if (loader) loader.style.display  = ativo ? 'flex'  : 'none';
  if (conteudo) conteudo.style.display = ativo ? 'none' : 'block';
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function atualizarAvatar(elId, fotoUrl, nome) {
  const el = document.getElementById(elId);
  if (!el) return;
  if (fotoUrl) {
    el.innerHTML = `<img src="${fotoUrl}" alt="Foto de ${nome}" class="perfil-foto">`;
  } else {
    el.innerHTML = `<span class="perfil-iniciais">${iniciais(nome)}</span>`;
  }
}

function atualizarPreviewFoto(url, nome) {
  const box = document.getElementById('foto-preview-box');
  if (!box) return;
  if (url) {
    box.innerHTML = `<img src="${url}" alt="Preview" style="width:100%;height:100%;object-fit:cover;">`;
  } else {
    box.innerHTML = `<span class="foto-preview-iniciais">${iniciais(nome)}</span>`;
  }
}

// ── Veículos ──────────────────────────────────────────────────────────────────

async function carregarVeiculos() {
  const container = document.getElementById('lista-veiculos');
  if (!container) return;
  try {
    const res = await api.listarVeiculos();
    if (res.data.length === 0) {
      container.innerHTML = '<p class="text-muted" style="font-size: 0.9rem;">Nenhum veículo cadastrado.</p>';
      return;
    }
    container.innerHTML = res.data.map(v => `
      <div class="card" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem;">
        <div>
          <strong>${v.marca} ${v.modelo}</strong> (${v.ano})
          <div style="font-size: 0.85rem; color: var(--text-3); font-family: var(--font-mono);">Placa: ${v.placa} | Cor: ${v.cor}</div>
        </div>
        <button class="btn btn-danger btn-sm" onclick="removerVeiculo(${v.id})">Remover</button>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<p class="text-muted" style="color: var(--red);">${err.message}</p>`;
  }
}

function initFormVeiculo() {
  const form = document.getElementById('form-veiculo');
  if (!form) return;
  form.onsubmit = async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;
    try {
      const payload = {
        marca: document.getElementById('veiculo-marca').value,
        modelo: document.getElementById('veiculo-modelo').value,
        ano: document.getElementById('veiculo-ano').value,
        cor: document.getElementById('veiculo-cor').value,
        placa: document.getElementById('veiculo-placa').value,
      };
      await api.cadastrarVeiculo(payload);
      showAlert('Veículo cadastrado!', 'success');
      form.reset();
      carregarVeiculos();
    } catch (err) {
      showAlert(err.message, 'error');
    } finally {
      if (btn) btn.disabled = false;
    }
  };
}

async function removerVeiculo(id) {
  if (!confirm('Deseja realmente remover este veículo?')) return;
  try {
    await api.deletarVeiculo(id);
    showAlert('Veículo removido!', 'success');
    carregarVeiculos();
  } catch (err) {
    showAlert(err.message, 'error');
  }
}

// ── Gamificação ──────────────────────────────────────────────────────────────

function renderCompletude(u, ehProprio) {
  const wrap = document.getElementById('wrap-completude');
  const bar  = document.getElementById('bar-completude');
  const txt  = document.getElementById('txt-completude');
  
  if (!wrap || !ehProprio) return;
  wrap.style.display = 'block';

  let pontos = 0;
  if (u.foto_url) pontos += 20;
  if (u.telefone) pontos += 15;
  if (u.curso)    pontos += 15;
  if (u.genero)   pontos += 10;
  if (u.dia_ead !== null && u.dia_ead !== undefined && u.dia_ead !== '') pontos += 10;
  
  if (u.perfil_tipo === 'estudante') {
    if (parseInt(u.total_caronas_passageiro || 0) > 0) pontos += 30;
  } else {
    if (u.status_verificacao === 'aprovado') pontos += 30;
  }

  bar.style.width = pontos + '%';
  txt.textContent = pontos + '%';
}

function renderBadges(u) {
  const activate = (id) => document.getElementById(id)?.classList.add('active');
  
  // 1. Pioneiro (Criado há mais de 30 dias ou ID baixo)
  // Como é um sistema novo, vamos considerar ID < 10 como pioneiro
  if (u.id <= 10) activate('badge-pioneiro');
  
  // 2. Verificado
  if (u.status_verificacao === 'aprovado') activate('badge-verificado');
  
  // 3. Top Motorista
  if (u.perfil_tipo !== 'estudante' && parseFloat(u.avaliacao_media || 0) >= 4.5 && parseInt(u.total_caronas_motorista || 0) >= 5) {
    activate('badge-top-driver');
  }
  
  // 4. Passageiro Ouro
  if (parseInt(u.total_caronas_passageiro || 0) >= 10) activate('badge-passageiro-ouro');
  
  // 5. Eco-Amigo (Total de caronas > 20)
  const total = parseInt(u.total_caronas_motorista || 0) + parseInt(u.total_caronas_passageiro || 0);
  if (total >= 20) activate('badge-eco');
}
