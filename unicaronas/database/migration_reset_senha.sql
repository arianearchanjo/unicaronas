-- Migration para Reset de Senha Obrigatório
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS forcar_reset BOOLEAN DEFAULT false;

-- Admins devem resetar a senha no primeiro login
UPDATE usuarios SET forcar_reset = true WHERE is_admin = true;
