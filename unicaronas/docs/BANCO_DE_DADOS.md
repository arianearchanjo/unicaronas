# Banco de Dados 🗄️

Este documento detalha o modelo de dados, relacionamentos e regras de integridade do UniCaronas.

## 1. Modelo de Entidade e Relacionamento (MER)

```mermaid
erDiagram
    USUARIOS ||--o{ VEICULOS : possui
    USUARIOS ||--o{ CARONAS : motorista
    USUARIOS ||--o{ SOLICITACOES_CARONA : passageiro
    USUARIOS ||--o{ MENSAGENS_CHAT : envia
    USUARIOS ||--o{ NOTIFICACOES : recebe
    USUARIOS ||--o{ AVALIACOES : avalia
    USUARIOS ||--o{ LISTA_ESPERA : entra
    
    VEICULOS ||--o{ CARONAS : usado_em

    CARONAS ||--o{ SOLICITACOES_CARONA : tem
    CARONAS ||--o{ LISTA_ESPERA : aguardando

    SOLICITACOES_CARONA ||--o{ MENSAGENS_CHAT : conversa
    SOLICITACOES_CARONA ||--o1 PAGAMENTOS : gera
    SOLICITACOES_CARONA ||--o{ AVALIACOES : referenciada_em
```

## 2. Dicionário de Tabelas

### 2.1. `usuarios`
Armazena todos os usuários (estudantes, motoristas e admins).
-   `id`: SERIAL PK.
-   `nome`: VARCHAR(100).
-   `email`: VARCHAR(150) UNIQUE.
-   `matricula`: VARCHAR(20) UNIQUE.
-   `senha_hash`: VARCHAR(255).
-   `perfil_tipo`: ENUM ('estudante', 'motorista', 'misto').
-   `status_verificacao`: ENUM ('pendente', 'aprovado', 'rejeitado').
-   `is_admin`: BOOLEAN (acesso ao painel administrativo).

### 2.2. `veiculos`
Cadastro de veículos dos motoristas.
-   `usuario_id`: FK -> usuarios.id.
-   `marca`, `modelo`, `ano`, `cor`, `placa`: Informações do veículo.

### 2.3. `caronas`
Entidade central que define a oferta de transporte.
-   `motorista_id`: FK -> usuarios.id.
-   `origem`, `destino`, `ponto_encontro`: Localizações.
-   `horario_partida`: TIMESTAMP.
-   `vagas_disponiveis`: INT (decrementado automaticamente).
-   `status`: ENUM ('ativa', 'em_andamento', 'concluida', 'cancelada').
-   `genero_preferencia`: ENUM ('todos', 'somente_mulheres').

### 2.4. `solicitacoes_carona`
Vínculo entre passageiro e carona.
-   `carona_id`: FK -> caronas.id.
-   `passageiro_id`: FK -> usuarios.id.
-   `status`: ENUM ('pendente', 'aceita', 'recusada', 'cancelada').

### 2.5. `pagamentos`
Registro financeiro da transação.
-   `solicitacao_id`: FK -> solicitacoes_carona.id (UNIQUE).
-   `valor_total`, `taxa_plataforma`, `valor_motorista`: Valores financeiros.
-   `status`: ENUM ('pendente', 'pago', 'repassado', 'estornado').
-   `referencia_externa`: TXID do Pix.

### 2.6. `mensagens_chat`
Histórico de conversas.
-   `tipo_conversa`: ENUM ('carona', 'geral').
-   `contexto_id`: Referência à carona ou nulo.

## 3. Regras de Negócio Implementadas (Triggers/Functions)

-   **`atualizar_avaliacao_media()`:** Sempre que uma nova avaliação é inserida, a função recalcula a `avaliacao_media` e o `total_avaliacoes` do usuário avaliado na tabela `usuarios`.
-   **`atualizar_vagas_carona()`:**
    -   Ao mudar o status de uma solicitação para 'aceita', o campo `vagas_disponiveis` da carona é decrementado.
    -   Ao mudar para 'cancelada' ou 'recusada' (se já estava aceita), o campo é incrementado de volta.

## 4. Scripts e Migrações
Os arquivos de schema estão localizados na pasta `database/`:
-   `schema.sql`: Estrutura completa atualizada (v2.0).
-   `data.sql`: Dados iniciais para teste (seeds).
-   `migration_*.sql`: Arquivos de alteração incremental aplicados durante o desenvolvimento das Sprints.

Para aplicar o banco do zero:
```bash
# No PostgreSQL
psql -U usuario -d unicaronas -f schema.sql
psql -U usuario -d unicaronas -f data.sql
```
