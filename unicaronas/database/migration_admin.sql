-- Migration para Perfil de Administrador
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Atualizar possíveis usuários existentes do domínio admin (opcional)
UPDATE usuarios SET is_admin = true WHERE email LIKE '%@unicaronas.divas.com';
