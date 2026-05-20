# Documentação da API 🚀

Esta API segue os princípios REST, utilizando JSON para entrada e saída de dados.

**Base URL:** `http://localhost:3000/api`

---

## 1. Módulo: Usuários (`/usuarios`)

### 1.1. Cadastrar Usuário
`POST /`
- **Desc:** Cria uma nova conta. Suporta upload de documentos (CNH e Identidade).
- **Body:** `FormData` (nome, email, matricula, senha, perfil_tipo, genero, cnh, identidade).
- **Regra:** Email deve pertencer a domínios acadêmicos autorizados.

### 1.2. Login
`POST /login`
- **Desc:** Autentica o usuário e retorna o Token JWT.
- **Body:** `{ email, senha }`
- **Response:** `{ success: true, token, user: { ... } }`

### 1.3. Perfil do Usuário
`GET /:id`
- **Auth:** Sim.
- **Desc:** Retorna dados públicos/privados de um perfil.

### 1.4. Atualizar Perfil
`PATCH /perfil`
- **Auth:** Sim.
- **Desc:** Atualiza nome, telefone, curso ou foto de perfil.
- **Body:** `FormData` ou `JSON`.

---

## 2. Módulo: Caronas (`/caronas`)

### 2.1. Listar Caronas
`GET /`
- **Desc:** Busca caronas ativas.
- **Query Params:** `origem`, `destino`, `data`, `motorista_id`, `preco_max`.

### 2.2. Criar Carona
`POST /`
- **Auth:** Sim.
- **Desc:** Oferta uma nova carona. Se `recorrente: true`, cria caronas para as próximas 3 semanas.
- **Body:** `{ origem, destino, ponto_encontro, horario_partida, vagas_totais, valor_cobrado, ... }`

### 2.3. Solicitar Vaga
`POST /:id/solicitar`
- **Auth:** Sim.
- **Desc:** Passageiro solicita entrar na carona.

### 2.4. Entrar na Lista de Espera
`POST /:id/espera`
- **Auth:** Sim.
- **Desc:** Se a carona estiver lotada, o usuário entra na fila.

---

## 3. Módulo: Mensagens e Chat (`/mensagens`)

### 3.1. Enviar Mensagem
`POST /`
- **Auth:** Sim.
- **Body:** `{ solicitacao_id, conteudo, tipo_conversa }`

### 3.2. Listar Conversas (Inbox)
`GET /conversas`
- **Auth:** Sim.
- **Desc:** Retorna a lista de chats ativos do usuário.

### 3.3. Indicador de Digitação
`POST /digitando`
- **Desc:** Notifica que o usuário está digitando em uma conversa.

---

## 4. Módulo: Financeiro (`/pagamentos`)

### 4.1. Gerar Pix
`GET /pix/:solicitacao_id`
- **Auth:** Sim.
- **Desc:** Retorna o payload BR Code para pagamento da carona via Pix.

### 4.2. Registrar Pagamento
`POST /`
- **Auth:** Sim.
- **Body:** `{ solicitacao_id, metodo }`
- **Metodos:** `pix`, `cartao_credito`, `dinheiro`.

---

## 5. Módulo: Admin (`/admin`)

### 5.1. Listar Usuários Pendentes
`GET /usuarios/pendentes`
- **Auth:** Admin Only.
- **Desc:** Lista usuários aguardando aprovação de documentos.

### 5.2. Verificar Documento
`PATCH /usuarios/:id/verificar`
- **Auth:** Admin Only.
- **Body:** `{ status }` (aprovado/rejeitado).

---

## Códigos de Erro Comuns
- `400 Bad Request`: Parâmetros inválidos ou faltantes.
- `401 Unauthorized`: Token ausente ou inválido.
- `403 Forbidden`: Usuário não tem permissão (ex: motorista tentando buscar carona).
- `404 Not Found`: Recurso não localizado.
- `409 Conflict`: Ação duplicada (ex: solicitar carona já solicitada).
- `422 Unprocessable Entity`: Erro de regra de negócio (ex: criar carona no dia EAD).
