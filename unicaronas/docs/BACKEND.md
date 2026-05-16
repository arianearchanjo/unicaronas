# Documentação do Backend ⚙️

O backend do UniCaronas é uma API robusta construída em Node.js, projetada para ser escalável, segura e fácil de manter.

## 1. Estrutura Interna (`backend/src/`)

### 1.1. Controllers (`/controllers`)
Os controllers são responsáveis por receber a requisição, validar a lógica de alto nível e interagir com o banco de dados ou serviços.
-   `usuariosController.js`: Fluxos de auth, perfil e documentos.
-   `caronasController.js`: CRUD de caronas, filtros de busca e gestão de vagas.
-   `pagamentosController.js`: Geração de Pix e registro de transações.
-   `adminController.js`: Moderação de usuários e auditoria de erros.

### 1.2. Middlewares (`/middleware`)
Interceptores que garantem a integridade das requisições:
-   `auth.js`: Valida o JWT e injeta `req.usuario`. Contém o helper `adminOnly`.
-   `validacao.js`: Validação de esquema usando um helper customizado (simplificado, similar ao express-validator).
-   `upload.js`: Configuração do **Multer** para armazenamento de fotos e documentos em `backend/uploads/`.
-   `errorHandler.js`: Captura erros globais e retorna um JSON padronizado, evitando vazamento de stack traces em produção.
-   `verificarDominio.js`: Restringe o cadastro a domínios de email universitários.

### 1.3. Services (`/services`)
Lógica de negócio que atravessa múltiplos controllers ou requer processamento assíncrono:
-   `notificacoesService.js`: Abstração para criar registros na tabela `notificacoes`.
-   `listaEsperaService.js`: Contém a função `processarListaEspera` que verifica caronas com vagas liberadas e notifica o próximo da fila.

### 1.4. Jobs (`/jobs`)
Tarefas agendadas que rodam independentemente de requisições:
-   `lembretes.js`: Utiliza `node-cron` para enviar alertas de caronas próximas (ex: 1 hora antes da partida).

### 1.5. Utils (`/utils`)
Funções utilitárias puras:
-   `pix.js`: Gerador de payload Pix EMV (BR Code) sem dependências externas.
-   `precificacao.js`: Algoritmo de cálculo de valor sugerido baseado em KM e taxas da plataforma.

## 2. Tecnologias e Bibliotecas Core
-   **Express:** Framework web.
-   **pg (node-postgres):** Driver para PostgreSQL com suporte a pool de conexões.
-   **jsonwebtoken:** Implementação de tokens JWT.
-   **bcrypt:** Hashing de senhas.
-   **multer:** Processamento de multipart/form-data (uploads).
-   **node-cron:** Agendador de tarefas.
-   **helmet:** Proteção de headers HTTP.

## 3. Configuração de Variáveis de Ambiente (.env)
O sistema depende das seguintes chaves:
-   `DATABASE_URL`: String de conexão com o Postgres.
-   `JWT_SECRET`: Chave mestra para assinatura dos tokens.
-   `PIX_CHAVE`, `PIX_NOME`: Configurações do recebedor oficial da plataforma.
-   `EMAIL_USER`, `EMAIL_PASS`: Credenciais para envio de lembretes (SMTP).

## 4. Tratamento de Erros
O backend utiliza um padrão de "Next Error":
```javascript
try {
  // lógica
} catch (err) {
  next(err); // Capturado pelo errorHandler.js
}
```
Isso garante que todas as falhas retornem:
```json
{ "success": false, "error": "Mensagem amigável" }
```
