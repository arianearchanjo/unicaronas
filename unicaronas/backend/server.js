// =============================================================
// UniCaronas — server.js
// =============================================================
// Carrega e valida variáveis de ambiente primeiro
const { isProduction, PORT } = require('./src/config/env');

// ── Supressão de Logs em Produção ───────────────────────────
if (isProduction) {
  // Salva o original caso queira usar em logs específicos
  const originalLog = console.log;
  const originalWarn = console.warn;

  console.log = () => {}; // Silencia logs comuns
  console.debug = () => {}; // Silencia debugs
  
  // Avisos podem ser mantidos ou redirecionados para o erro
  console.warn = (...args) => {
    // Exemplo: redirecionar avisos críticos para o stderr em produção
    // console.error('[WARN]', ...args); 
  };
  
  // console.error permanece ativo para diagnósticos de falhas
}

const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const cookieParser = require('cookie-parser');
const path    = require('path');

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

// Job para processar lista de espera a cada 60 segundos
setInterval(processarListaEspera, 60000);

// ── CORS Restrito (Produção vs Desenvolvimento) ──────────
const corsOptions = {
  origin: (origin, callback) => {
    const isProduction = process.env.NODE_ENV === 'production';
    const frontendUrl = process.env.FRONTEND_URL;

    // Permitir requisições sem 'origin' (como Postman ou chamadas entre servidores)
    if (!origin) return callback(null, true);

    // Em desenvolvimento, permitimos origens locais comuns
    if (!isProduction) {
      return callback(null, true);
    }

    // Em produção, validamos contra a FRONTEND_URL definida
    if (frontendUrl && origin === frontendUrl) {
      return callback(null, true);
    }

    // Bloqueia qualquer outra origem em produção
    console.warn(`[CORS] Bloqueado: ${origin}`);
    return callback(new Error('Acesso não permitido por política de CORS'), false);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // responde preflight em todas as rotas

app.use(cookieParser());

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
