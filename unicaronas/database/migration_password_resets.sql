-- Migration para Recuperação de Senha
CREATE TABLE IF NOT EXISTS password_resets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índice para busca rápida de tokens e limpeza posterior
CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token);
CREATE INDEX IF NOT EXISTS idx_password_resets_expires_at ON password_resets(expires_at);

/*
Explicação: Por que usar uma tabela separada?
1. Separação de Responsabilidades: A tabela 'usuarios' deve conter dados de perfil estáveis. Tokens de reset são temporários e de uso único.
2. Segurança: Isolar tokens em uma tabela separada facilita a aplicação de políticas de limpeza (cron jobs) e auditoria específica sem afetar a tabela principal.
3. Escalabilidade: Se um usuário solicitar vários resets, podemos manter o histórico ou simplesmente gerenciar o estado sem adicionar múltiplas colunas nulas na tabela de usuários.
4. Performance: Mantém a tabela de usuários "limpa" e com índices menores.
*/
