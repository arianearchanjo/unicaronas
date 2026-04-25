-- UniCaronas - Migração Lista de Espera (Sprint 5)

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_lista_espera') THEN
        CREATE TYPE status_lista_espera AS ENUM ('aguardando', 'notificado', 'expirado', 'convertido');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS lista_espera (
    id SERIAL PRIMARY KEY,
    carona_id INTEGER NOT NULL REFERENCES caronas(id) ON DELETE CASCADE,
    passageiro_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    posicao SERIAL, -- Simplificação: ordem de inserção
    status status_lista_espera DEFAULT 'aguardando',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(carona_id, passageiro_id)
);

CREATE INDEX IF NOT EXISTS idx_lista_espera_carona ON lista_espera (carona_id);
CREATE INDEX IF NOT EXISTS idx_lista_espera_status ON lista_espera (status);
