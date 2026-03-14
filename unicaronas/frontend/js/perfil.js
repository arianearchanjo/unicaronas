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
    showAlert('ID de usuario invalido', 'error');
    return;
  }

  setLoader(true);

  try {
    const [resU, resAv] = await Promise.all([
      api.perfil(perfilId),
      api.avaliacoes(perfilId),
    ]);

    renderPerfil(resU.data, ehProprio);
    renderStats(resU.data);
    renderAvaliacoes(resAv.data);
    if (ehProprio) initEdicao(resU.data);

  } catch (err) {
    if (/token/i.test(err.message)) { logout(); return; }
    showAlert(err.message || 'Erro ao carregar perfil', 'error');
  } finally {
    setLoader(false);
  }
});

// ── Perfil ────────────────────────────────────────────────────────────────────

function renderPerfil(u, ehProprio) {
  atualizarAvatar('perfil-avatar', u.foto_url, u.nome);
  setText('perfil-nome',   u.nome);
  setText('perfil-curso',  u.curso  || 'Curso nao informado');
  setText('perfil-email',  u.email);
  setText('perfil-membro', 'Membro desde ' + formatarDataCurta(u.criado_em));
  document.title = u.nome + ' — UniCaronas';

  const btn = document.getElementById('btn-editar-perfil');
  if (ehProprio) { btn.removeAttribute('hidden'); btn.addEventListener('click', abrirModal); }
  else btn.setAttribute('hidden', '');
}

// ── Stats ─────────────────────────────────────────────────────────────────────

function renderStats(u) {
  setText('stat-motorista',  u.total_caronas_motorista  ?? '—');
  setText('stat-passageiro', u.total_caronas_passageiro ?? '—');
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
  const nome = av.avaliador_nome || 'Usuario';
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

// ── Modal ─────────────────────────────────────────────────────────────────────

function initEdicao(u) {
  document.getElementById('edit-nome').value     = u.nome     || '';
  document.getElementById('edit-telefone').value = u.telefone || '';
  document.getElementById('edit-curso').value    = u.curso    || '';
  document.getElementById('edit-foto').value     = u.foto_url || '';

  // Preview inicial
  atualizarPreviewFoto(u.foto_url, u.nome);

  // Preview ao digitar URL
  document.getElementById('edit-foto').addEventListener('input', (e) => {
    atualizarPreviewFoto(e.target.value.trim(), document.getElementById('edit-nome').value || getUser()?.nome);
  });

  document.getElementById('modal-fechar').addEventListener('click', fecharModal);
  document.getElementById('modal-editar').addEventListener('click', (e) => {
    if (e.target === document.getElementById('modal-editar')) fecharModal();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fecharModal(); });
  document.getElementById('form-editar-perfil').addEventListener('submit', async (e) => {
    e.preventDefault();
    await salvarPerfil();
  });
}

function abrirModal() {
  document.getElementById('modal-editar').removeAttribute('hidden');
  document.getElementById('edit-nome').focus();
  document.body.style.overflow = 'hidden';
}

function fecharModal() {
  document.getElementById('modal-editar').setAttribute('hidden', '');
  document.getElementById('alert-modal').innerHTML = '';
  document.body.style.overflow = '';
}

async function salvarPerfil() {
  const btn  = document.querySelector('#form-editar-perfil [type="submit"]');
  const nome = document.getElementById('edit-nome').value.trim();

  if (!nome || nome.length < 2) {
    showAlert('O nome deve ter pelo menos 2 caracteres', 'error', 'alert-modal');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Salvando...';

  try {
    const res = await api.atualizarPerfil({
      nome,
      telefone: document.getElementById('edit-telefone').value.trim() || undefined,
      curso:    document.getElementById('edit-curso').value.trim()    || undefined,
      foto_url: document.getElementById('edit-foto').value.trim()     || undefined,
    });

    setUser({ ...getUser(), nome: res.data.nome, foto_url: res.data.foto_url });
    setText('perfil-nome',  res.data.nome);
    setText('perfil-curso', res.data.curso || 'Curso nao informado');
    atualizarAvatar('perfil-avatar', res.data.foto_url, res.data.nome);

    fecharModal();
    showAlert('Perfil atualizado com sucesso', 'success');
  } catch (err) {
    showAlert(err.message || 'Erro ao salvar', 'error', 'alert-modal');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Salvar alteracoes';
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
  const box      = document.getElementById('foto-preview-box');
  const inicBox  = document.getElementById('foto-preview-iniciais');
  if (!box) return;

  if (url) {
    box.innerHTML = `<img src="${url}" alt="Preview" style="width:100%;height:100%;object-fit:cover;"
      onerror="this.parentElement.innerHTML='<span class=\\'foto-preview-iniciais\\'>${iniciais(nome)}</span>'">`;
  } else {
    box.innerHTML = `<span class="foto-preview-iniciais">${iniciais(nome || '?')}</span>`;
  }
}