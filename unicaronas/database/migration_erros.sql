-- Migration para Relatórios de Erro
CREATE TABLE IF NOT EXISTS relatorios_erro (
  id          SERIAL PRIMARY KEY,
  usuario_id  INT REFERENCES usuarios(id) ON DELETE SET NULL,
  descricao   TEXT NOT NULL,
  status      VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_analise', 'resolvido')),
  criado_em   TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_erros_status ON relatorios_erro (status);
