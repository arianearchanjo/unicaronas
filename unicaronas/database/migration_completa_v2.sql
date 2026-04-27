-- Migration Corretiva Completa
-- Execute este script para garantir que todas as colunas novas existem

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS cnh_url VARCHAR(255);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS identidade_url VARCHAR(255);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS status_verificacao VARCHAR(20) DEFAULT 'pendente' 
  CHECK (status_verificacao IN ('pendente', 'aprovado', 'rejeitado'));
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_usuarios_status_verificacao ON usuarios (status_verificacao);
CREATE INDEX IF NOT EXISTS idx_usuarios_is_admin ON usuarios (is_admin);
