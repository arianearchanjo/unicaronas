-- UniCaronas - Migração Preferência de Gênero (Sprint 5)

ALTER TABLE caronas ADD COLUMN IF NOT EXISTS genero_preferencia VARCHAR(20) DEFAULT 'todos';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS genero VARCHAR(1) CHECK (genero IN ('M', 'F') OR genero IS NULL);
