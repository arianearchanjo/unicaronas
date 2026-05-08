-- US19 Central de Notificações
DROP TABLE IF EXISTS notificacoes CASCADE;

CREATE TABLE notificacoes (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id),
    carona_id INTEGER REFERENCES caronas(id),
    tipo VARCHAR(20) CHECK (tipo IN ('solicitacao', 'mensagem', 'cancelamento', 'lembrete')),
    conteudo TEXT NOT NULL,
    lida BOOLEAN DEFAULT FALSE,
    criado_em TIMESTAMP DEFAULT NOW()
);
