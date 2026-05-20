// =============================================================
// UniCaronas — server.js
// =============================================================
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const path    = require('path');
const morgan  = require('morgan');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');
require('dotenv').config();

const logger = require('./src/utils/logger');
const usuariosRoutes   = require('./src/routes/usuarios');
const caronasRoutes    = require('./src/routes/caronas');
const mensagensRoutes  = require('./src/routes/mensagens');
const pagamentosRoutes = require('./src/routes/pagamentos');
const avaliacoesRoutes = require('./src/routes/avaliacoes');
const veiculoRoutes    = require('./src/routes/veiculoRoutes');
const notificacoesRoutes = require('./src/routes/notificacoes');
const adminRoutes      = require('./src/routes/admin');
const errorHandler     = require('./src/middleware/errorHandler');
const { apiLimiter }   = require('./src/middleware/rateLimiter');
const { processarListaEspera } = require('./src/services/listaEsperaService');

const app  = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Confiar em proxies (necessário para express-rate-limit em produção)
app.set('trust proxy', 1);

// ── Logging (Morgan) ────────────────────────────────────────
if (isProduction) {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// Job para processar lista de espera a cada 60 segundos
setInterval(processarListaEspera, 60000);

// ── Middleware Base ─────────────────────────────────────────
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Rate Limiting Global ─────────────────────────────────────
app.use('/api', apiLimiter);

// ── CSRF Protection ─────────────────────────────────────────
const csrfProtection = csrf({ cookie: true });
app.use(csrfProtection);

// Endpoint para o frontend obter o token CSRF
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// ── CORS explícito ──────────────────────────────────────────
const corsOptions = {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  credentials: true,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ── Helmet (depois do CORS para não conflitar) ──────────────
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

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
  logger.warn(`[404] Rota não encontrada: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ success: false, error: 'Rota não encontrada' });
});

// ── Error handler global ────────────────────────────────────
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({ success: false, error: 'Token CSRF inválido ou ausente.' });
  }
  next(err);
});
app.use(errorHandler);

// ── Iniciar servidor ────────────────────────────────────────
app.listen(PORT, () => {
  logger.log(`UniCaronas API rodando em http://localhost:${PORT}`);

  // Iniciar Jobs agendados
  const { iniciarJobLembretes } = require('./src/jobs/lembretes');
  iniciarJobLembretes();
});

module.exports = app;
