// =============================================================
// UniCaronas — server.js
// =============================================================
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const path    = require('path');
require('dotenv').config();

const usuariosRoutes   = require('./src/routes/usuarios');
const caronasRoutes    = require('./src/routes/caronas');
const mensagensRoutes  = require('./src/routes/mensagens');
const pagamentosRoutes = require('./src/routes/pagamentos');
const avaliacoesRoutes = require('./src/routes/avaliacoes');
const veiculoRoutes    = require('./src/routes/veiculoRoutes');
const notificacoesRoutes = require('./src/routes/notificacoes');
const adminRoutes      = require('./src/routes/admin');
const errorHandler     = require('./src/middleware/errorHandler');
const { processarListaEspera } = require('./src/services/listaEsperaService');

const app  = express();
const PORT = process.env.PORT || 3000;

// Job para processar lista de espera a cada 60 segundos
setInterval(processarListaEspera, 60000);

// ── CORS explícito (resolve problemas com Live Server / file://) ──
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // responde preflight em todas as rotas

// ── Helmet (depois do CORS para não conflitar) ──────────────
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Servir arquivos estáticos (uploads) ─────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Rota de health check ────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Rotas da API ────────────────────────────────────────────
app.use('/api/usuarios',     usuariosRoutes);
app.use('/api/caronas',      caronasRoutes);
app.use('/api/mensagens',    mensagensRoutes);
app.use('/api/pagamentos',   pagamentosRoutes);
app.use('/api/avaliacoes',   avaliacoesRoutes);
app.use('/api/veiculos',     veiculoRoutes);
app.use('/api/notificacoes', notificacoesRoutes);
app.use('/api/admin',        adminRoutes);

// ── Rota 404 ────────────────────────────────────────────────
app.use((req, res) => {
  console.warn(`[404] Rota não encontrada: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ success: false, error: 'Rota não encontrada' });
});

// ── Error handler global ────────────────────────────────────
app.use(errorHandler);

// ── Iniciar servidor ────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`UniCaronas API rodando em http://localhost:${PORT}`);

  // Iniciar Jobs agendados
  const { iniciarJobLembretes } = require('./src/jobs/lembretes');
  iniciarJobLembretes();
});

module.exports = app;
