-- =============================================================
-- UniCaronas — Schema do Banco de Dados
-- PostgreSQL 14+
-- =============================================================

-- Limpar schema anterior (cuidado em produção)
DROP TABLE IF EXISTS avaliacoes CASCADE;
DROP TABLE IF EXISTS pagamentos CASCADE;
DROP TABLE IF EXISTS mensagens_chat CASCADE;
DROP TABLE IF EXISTS solicitacoes_carona CASCADE;
DROP TABLE IF EXISTS caronas CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

-- =============================================================
-- TABELA: usuarios
-- =============================================================
CREATE TABLE usuarios (
  id               SERIAL PRIMARY KEY,
  nome             VARCHAR(100)  NOT NULL,
  email            VARCHAR(150)  NOT NULL UNIQUE,
  matricula        VARCHAR(20)   NOT NULL UNIQUE,
  senha_hash       VARCHAR(255)  NOT NULL,
  telefone         VARCHAR(20),
  foto_url         VARCHAR(255),
  curso            VARCHAR(100),
  avaliacao_media  DECIMAL(2,1)  NOT NULL DEFAULT 0.0,
  total_avaliacoes INT           NOT NULL DEFAULT 0,
  ativo            BOOLEAN       NOT NULL DEFAULT true,
  criado_em        TIMESTAMP     NOT NULL DEFAULT NOW(),
  atualizado_em    TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_usuarios_email     ON usuarios (email);
CREATE INDEX idx_usuarios_matricula ON usuarios (matricula);

-- =============================================================
-- TABELA: caronas
-- =============================================================
CREATE TABLE caronas (
  id                 SERIAL PRIMARY KEY,
  motorista_id       INT           NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  origem             VARCHAR(200)  NOT NULL,
  destino            VARCHAR(200)  NOT NULL,
  horario_partida    TIMESTAMP     NOT NULL,
  vagas_totais       INT           NOT NULL CHECK (vagas_totais > 0),
  vagas_disponiveis  INT           NOT NULL CHECK (vagas_disponiveis >= 0),
  valor_sugerido     DECIMAL(10,2),
  valor_cobrado      DECIMAL(10,2) NOT NULL CHECK (valor_cobrado >= 0),
  distancia_km       DECIMAL(10,2),
  observacoes        TEXT,
  recorrente         BOOLEAN       NOT NULL DEFAULT false,
  status             VARCHAR(20)   NOT NULL DEFAULT 'ativa'
                     CHECK (status IN ('ativa','em_andamento','concluida','cancelada')),
  criado_em          TIMESTAMP     NOT NULL DEFAULT NOW(),
  atualizado_em      TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_caronas_motorista ON caronas (motorista_id);
CREATE INDEX idx_caronas_status    ON caronas (status);
CREATE INDEX idx_caronas_horario   ON caronas (horario_partida);

-- =============================================================
-- TABELA: solicitacoes_carona
-- =============================================================
CREATE TABLE solicitacoes_carona (
  id            SERIAL PRIMARY KEY,
  carona_id     INT         NOT NULL REFERENCES caronas(id) ON DELETE CASCADE,
  passageiro_id INT         NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  status        VARCHAR(20) NOT NULL DEFAULT 'pendente'
                CHECK (status IN ('pendente','aceita','recusada','cancelada')),
  criado_em     TIMESTAMP   NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMP   NOT NULL DEFAULT NOW(),
  UNIQUE (carona_id, passageiro_id)
);

CREATE INDEX idx_solicitacoes_carona     ON solicitacoes_carona (carona_id);
CREATE INDEX idx_solicitacoes_passageiro ON solicitacoes_carona (passageiro_id);

-- =============================================================
-- TABELA: mensagens_chat
-- =============================================================
CREATE TABLE mensagens_chat (
  id              SERIAL PRIMARY KEY,
  solicitacao_id  INT       NOT NULL REFERENCES solicitacoes_carona(id) ON DELETE CASCADE,
  remetente_id    INT       NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  conteudo        TEXT      NOT NULL,
  lida            BOOLEAN   NOT NULL DEFAULT false,
  enviado_em      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mensagens_solicitacao ON mensagens_chat (solicitacao_id);
CREATE INDEX idx_mensagens_remetente   ON mensagens_chat (remetente_id);

-- =============================================================
-- TABELA: pagamentos
-- =============================================================
CREATE TABLE pagamentos (
  id                  SERIAL PRIMARY KEY,
  solicitacao_id      INT           NOT NULL UNIQUE REFERENCES solicitacoes_carona(id),
  valor_total         DECIMAL(10,2) NOT NULL CHECK (valor_total > 0),
  taxa_plataforma     DECIMAL(10,2) NOT NULL CHECK (taxa_plataforma >= 0),
  valor_motorista     DECIMAL(10,2) NOT NULL CHECK (valor_motorista >= 0),
  status              VARCHAR(20)   NOT NULL DEFAULT 'pendente'
                      CHECK (status IN ('pendente','pago','repassado','estornado')),
  metodo              VARCHAR(50),
  referencia_externa  VARCHAR(100),
  pago_em             TIMESTAMP,
  repassado_em        TIMESTAMP,
  criado_em           TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- =============================================================
-- TABELA: avaliacoes
-- =============================================================
CREATE TABLE avaliacoes (
  id              SERIAL PRIMARY KEY,
  solicitacao_id  INT       NOT NULL REFERENCES solicitacoes_carona(id),
  avaliador_id    INT       NOT NULL REFERENCES usuarios(id),
  avaliado_id     INT       NOT NULL REFERENCES usuarios(id),
  nota            INT       NOT NULL CHECK (nota BETWEEN 1 AND 5),
  comentario      TEXT,
  criado_em       TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (solicitacao_id, avaliador_id)
);

CREATE INDEX idx_avaliacoes_avaliado ON avaliacoes (avaliado_id);

-- =============================================================
-- FUNÇÃO: atualizar media de avaliacao
-- =============================================================
CREATE OR REPLACE FUNCTION atualizar_avaliacao_media()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE usuarios
  SET
    avaliacao_media  = (SELECT AVG(nota)   FROM avaliacoes WHERE avaliado_id = NEW.avaliado_id),
    total_avaliacoes = (SELECT COUNT(*)    FROM avaliacoes WHERE avaliado_id = NEW.avaliado_id),
    atualizado_em    = NOW()
  WHERE id = NEW.avaliado_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_avaliacao_media
AFTER INSERT ON avaliacoes
FOR EACH ROW EXECUTE FUNCTION atualizar_avaliacao_media();

-- =============================================================
-- FUNÇÃO: atualizar vagas ao aceitar solicitação
-- =============================================================
CREATE OR REPLACE FUNCTION atualizar_vagas_carona()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'aceita' AND OLD.status = 'pendente' THEN
    UPDATE caronas
    SET vagas_disponiveis = vagas_disponiveis - 1,
        atualizado_em     = NOW()
    WHERE id = NEW.carona_id;
  END IF;

  IF NEW.status IN ('recusada','cancelada') AND OLD.status = 'aceita' THEN
    UPDATE caronas
    SET vagas_disponiveis = vagas_disponiveis + 1,
        atualizado_em     = NOW()
    WHERE id = NEW.carona_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_vagas_carona
AFTER UPDATE ON solicitacoes_carona
FOR EACH ROW EXECUTE FUNCTION atualizar_vagas_carona();
