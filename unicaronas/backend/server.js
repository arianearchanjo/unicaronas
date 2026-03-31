/*
// =============================================================
// UniCaronas — server.js
// =============================================================
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
require('dotenv').config();

const usuariosRoutes   = require('./src/routes/usuarios');
const caronasRoutes    = require('./src/routes/caronas');
const mensagensRoutes  = require('./src/routes/mensagens');
const pagamentosRoutes = require('./src/routes/pagamentos');
const avaliacoesRoutes = require('./src/routes/avaliacoes');
const errorHandler     = require('./src/middleware/errorHandler');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware globais ──────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Rota de health check ────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Rotas da API ────────────────────────────────────────────
app.use('/api/usuarios',   usuariosRoutes);
app.use('/api/caronas',    caronasRoutes);
app.use('/api/mensagens',  mensagensRoutes);
app.use('/api/pagamentos', pagamentosRoutes);
app.use('/api/avaliacoes', avaliacoesRoutes);

// ── Rota 404 ────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Rota não encontrada' });
});

// ── Error handler global ────────────────────────────────────
app.use(errorHandler);

// ── Iniciar servidor ────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ UniCaronas API rodando em http://localhost:${PORT}`);
});

module.exports = app;
*/

// =============================================================
// UniCaronas — server.js
// =============================================================
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
require('dotenv').config();

const usuariosRoutes   = require('./src/routes/usuarios');
const caronasRoutes    = require('./src/routes/caronas');
const mensagensRoutes  = require('./src/routes/mensagens');
const pagamentosRoutes = require('./src/routes/pagamentos');
const avaliacoesRoutes = require('./src/routes/avaliacoes');
const errorHandler     = require('./src/middleware/errorHandler');

const app  = express();
const PORT = process.env.PORT || 3000;

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

// ── Rota de health check ────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Rotas da API ────────────────────────────────────────────
app.use('/api/usuarios',   usuariosRoutes);
app.use('/api/caronas',    caronasRoutes);
app.use('/api/mensagens',  mensagensRoutes);
app.use('/api/pagamentos', pagamentosRoutes);
app.use('/api/avaliacoes', avaliacoesRoutes);

// ── Rota 404 ────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Rota não encontrada' });
});

// ── Error handler global ────────────────────────────────────
app.use(errorHandler);

// ── Iniciar servidor ────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ UniCaronas API rodando em http://localhost:${PORT}`);
});

module.exports = app;