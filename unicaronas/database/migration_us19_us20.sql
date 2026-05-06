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

-- US20 E-mail de Resumo Semanal
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS rota_preferida_origem VARCHAR(100);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS rota_preferida_destino VARCHAR(100);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS receber_email_semanal BOOLEAN DEFAULT TRUE;
