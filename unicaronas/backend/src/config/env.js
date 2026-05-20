// backend/src/config/env.js
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Lista de variáveis críticas que devem estar presentes em produção.
 */
const requiredEnvVars = [
  'JWT_SECRET',
  'FRONTEND_URL',
  'MAIL_PASS'
];

/**
 * Validação rigorosa das variáveis de ambiente.
 */
const validateEnv = () => {
  if (isProduction) {
    const missing = requiredEnvVars.filter(key => !process.env[key]);

    // Validação específica para Banco de Dados (URL ou Senha individual)
    if (!process.env.DATABASE_URL && !process.env.DB_PASSWORD) {
      missing.push('DATABASE_URL (ou DB_PASSWORD)');
    }

    if (missing.length > 0) {
      console.error('\x1b[31m%s\x1b[0m', ' [CRITICAL ERROR] Falha na configuração de Produção:');
      console.error('\x1b[31m%s\x1b[0m', ` As seguintes variáveis de ambiente são obrigatórias: ${missing.join(', ')}`);
      console.error('\x1b[33m%s\x1b[0m', ' Verifique o arquivo .env ou as configurações do seu provedor de cloud.');
      process.exit(1);
    }
  }
};

// Executa a validação imediatamente
validateEnv();

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3000,
  JWT_SECRET: process.env.JWT_SECRET,
  FRONTEND_URL: process.env.FRONTEND_URL,
  isProduction
};
