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
    const [resU, resAv, resHis] = await Promise.all([
      api.perfil(perfilId),
      api.avaliacoes(perfilId),
      api.getHistorico(perfilId)
    ]);

    renderPerfil(resU.data, ehProprio);
    renderStats(resU.data);
    renderAvaliacoes(resAv.data);
    renderHistorico(resHis.data);
    if (ehProprio) initEdicao(resU.data);

  } catch (err) {
    console.error('Erro ao carregar perfil:', err);
    if (/token/i.test(err.message)) { logout(); return; }
    showAlert(err.message || (currentLang === 'pt' ? 'Erro ao carregar perfil' : 'Error loading profile'), 'error');
  } finally {
    setLoader(false);
  }
});

// ── Perfil ────────────────────────────────────────────────────────────────────

function renderPerfil(u, ehProprio) {
  atualizarAvatar('perfil-avatar', u.foto_url, u.nome);
  setText('perfil-nome',   u.nome);
  setText('perfil-curso',  u.curso  || (currentLang === 'pt' ? 'Curso não informado' : 'Course not informed'));
  setText('perfil-email',  u.email);
  setText('perfil-membro', t('profile-member-since') + ' ' + formatarDataCurta(u.criado_em));
  
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
  if (ehProprio) { 
    btn.removeAttribute('hidden'); 
    btn.onclick = abrirModal; 
  } else {
    btn.setAttribute('hidden', '');
  }
}

// ── Stats ─────────────────────────────────────────────────────────────────────

function renderStats(u) {
  setText('stat-motorista',  u.total_caronas_motorista  ?? '0');
  setText('stat-passageiro', u.total_caronas_passageiro ?? '0');
  const media = Number(u.avaliacao_media || 0).toFixed(1);
  setText('stat-nota', media);
  document.getElementById('stat-estrelas').innerHTML = renderEstrelas(media, u.total_avaliacoes);
}

// ── Avaliações ────────────────────────────────────────────────────────────────

function renderAvaliacoes(lista) {
  const container = document.getElementById('lista-avaliacoes');
  const vazio     = document.getElementById('avaliacoes-vazio');

  if (!lista || lista.length === 0) {
    vazio.style.display     = 'block';
    container.style.display = 'none';
    return;
  }
  vazio.style.display     = 'none';
  container.style.display = 'block';
  container.innerHTML = lista.map(cardAvaliacao).join('');
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
        <div class="avaliacao-nota">${renderEstrelas(av.nota)}</div>
      </div>
      ${comentario}
      <div class="avaliacao-rota">
        <span class="badge badge-accent">Carona</span>
        <span class="avaliacao-rota-texto">${av.origem} para ${av.destino}</span>
        <span class="avaliacao-rota-data">${formatarData(av.horario_partida)}</span>
      </div>
    </div>`;
}

// ── Histórico ────────────────────────────────────────────────────────────────

function renderHistorico(lista) {
  const container = document.getElementById('historico-lista');
  const vazio     = document.getElementById('historico-vazio');
  if (!container) return;

  if (!lista || lista.length === 0) {
    vazio.style.display = 'block';
    container.innerHTML = '';
    return;
  }

  vazio.style.display = 'none';
  container.innerHTML = lista.map(c => `
    <div class="info-row" style="padding: 1.25rem 0; border-bottom: 1px solid var(--border);">
      <div style="flex: 1; min-width: 0; padding-right: 1rem;">
        <strong style="color: var(--text); display: block; margin-bottom: 4px; font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          ${c.origem} <span style="color: var(--accent-2); margin: 0 4px;">→</span> ${c.destino}
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
}

// ── Modal Edição ──────────────────────────────────────────────────────────────

function initEdicao(u) {
  document.getElementById('edit-nome').value     = u.nome     || '';
  document.getElementById('edit-telefone').value = u.telefone || '';
  document.getElementById('edit-curso').value    = u.curso    || '';
  document.getElementById('edit-dia-ead').value  = (u.dia_ead !== null && u.dia_ead !== undefined) ? u.dia_ead : '';
  
  const radio = document.querySelector(`input[name="edit-perfil-tipo"][value="${u.perfil_tipo}"]`);
  if (radio) radio.checked = true;

  atualizarPreviewFoto(u.foto_url, u.nome);

  document.getElementById('edit-foto').onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => atualizarPreviewFoto(event.target.result, u.nome);
      reader.readAsDataURL(file);
    }
  };

  document.getElementById('modal-fechar').onclick = fecharModal;
  document.getElementById('form-editar-perfil').onsubmit = async (e) => {
    e.preventDefault();
    await salvarPerfil();
  };
}

function abrirModal() {
  document.getElementById('modal-editar').removeAttribute('hidden');
  document.body.style.overflow = 'hidden';
}

function fecharModal() {
  document.getElementById('modal-editar').setAttribute('hidden', '');
  document.body.style.overflow = '';
}

async function salvarPerfil() {
  const btn  = document.querySelector('#form-editar-perfil [type="submit"]');
  const nome = document.getElementById('edit-nome').value.trim();
  const perfilTipo = document.querySelector('input[name="edit-perfil-tipo"]:checked')?.value;

  if (!nome || nome.length < 2) {
    showAlert('O nome deve ter pelo menos 2 caracteres', 'error', 'alert-modal');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Salvando...';

  try {
    const formData = new FormData();
    formData.append('nome', nome);
    formData.append('telefone', document.getElementById('edit-telefone').value.trim());
    formData.append('curso', document.getElementById('edit-curso').value.trim());
    formData.append('dia_ead', document.getElementById('edit-dia-ead').value);
    formData.append('perfil_tipo', perfilTipo);
    
    const inputFoto = document.getElementById('edit-foto');
    if (inputFoto.files && inputFoto.files[0]) {
      formData.append('foto', inputFoto.files[0]);
    }

    const res = await api.atualizarPerfil(formData);

    // Sincroniza localStorage com os novos dados
    const updatedUser = { ...getUser(), ...res.data };
    setUser(updatedUser);
    
    // Atualiza interface
    renderPerfil(res.data, true);
    fecharModal();
    showAlert('Perfil atualizado com sucesso', 'success');
  } catch (err) {
    showAlert(err.message || 'Erro ao salvar', 'error', 'alert-modal');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Salvar alterações';
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function setLoader(ativo) {
  document.getElementById('perfil-loader').style.display  = ativo ? 'flex'  : 'none';
  document.getElementById('perfil-conteudo').style.display = ativo ? 'none' : 'block';
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