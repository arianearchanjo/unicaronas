-- Migration: Sistema de Notificações v2
-- Data: 2026-05-03

DROP TABLE IF EXISTS notificacoes;

CREATE TABLE notificacoes (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    mensagem TEXT NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- 'nova_solicitacao', 'solicitacao_aceita', 'solicitacao_recusada', 'lembrete_viagem', etc.
    lida BOOLEAN DEFAULT FALSE,
    referencia_id INTEGER, -- ID da carona ou outro objeto relacionado
    referencia_tipo VARCHAR(50), -- 'carona', 'pagamento', etc.
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notificacoes_usuario_lida ON notificacoes(usuario_id, lida);
