-- Migration para Verificação de Documentos
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS cnh_url VARCHAR(255);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS identidade_url VARCHAR(255);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS status_verificacao VARCHAR(20) DEFAULT 'pendente' 
  CHECK (status_verificacao IN ('pendente', 'aprovado', 'rejeitado'));

-- Índice para busca por status
CREATE INDEX IF NOT EXISTS idx_usuarios_status_verificacao ON usuarios (status_verificacao);
