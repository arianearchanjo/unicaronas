# Documentação de Segurança 🛡️

O UniCaronas implementa múltiplas camadas de proteção para garantir a integridade dos dados e a privacidade dos usuários acadêmicos.

## 1. Autenticação e Autorização
-   **JWT (JSON Web Token):** Utilizado para persistência de sessão sem estado no servidor. O token contém o `id` e `perfil_tipo` do usuário.
-   **Bcrypt:** Todas as senhas são criptografadas antes de serem salvas no banco de dados. Nunca armazenamos senhas em texto plano.
-   **Proteção de Rotas:** O middleware `auth.js` intercepta requisições a endpoints privados, validando a assinatura do token.
-   **RBAC (Role-Based Access Control):** Algumas rotas são restritas pelo perfil do usuário (ex: apenas Admins podem acessar `/api/admin`).

## 2. Proteção de Infraestrutura (Middleware)
-   **Helmet.js:** Configurado para definir headers HTTP de segurança (X-Content-Type-Options, X-Frame-Options, etc).
-   **CORS:** Restringe quais origens podem consumir a API. Atualmente configurado como curinga (`*`) para facilitar testes, mas deve ser restrito em produção.
-   **Sanitização:** O uso de `pg` com parâmetros (`$1`, `$2`) em todas as consultas SQL previne ataques de **SQL Injection**.

## 3. Segurança de Uploads
-   **Multer:** O sistema valida o tipo de arquivo recebido para evitar a execução de scripts maliciosos enviados como fotos.
-   **Isolamento:** Arquivos de upload são servidos de forma estática, mas sem permissão de execução no servidor.

## 4. Validações de Domínio
O sistema implementa uma camada de segurança social através do `verificarDominioEmail.js`, que impede que pessoas externas à universidade se cadastrem, mitigando o risco de contas falsas.

## 5. Vulnerabilidades Identificadas e Recomendações

| Vulnerabilidade | Impacto | Recomendação |
| :--- | :--- | :--- |
| **Falta de Rate Limiting** | Médio | Implementar `express-rate-limit` para evitar ataques de força bruta no login. |
| **CORS Permissivo** | Baixo | Alterar `origin: '*'` para o domínio real do frontend em produção. |
| **Exposição de Tokens** | Médio | Mudar o armazenamento de `localStorage` para `HttpOnly Cookies` para prevenir ataques XSS. |
| **Falta de CSRF Protection** | Médio | Implementar tokens CSRF para rotas que alteram estado (POST/PATCH/DELETE). |

## 6. Procedimento de Auditoria
Logs de erro são salvos na tabela `relatorios_erro` sempre que ocorre uma falha crítica no sistema, permitindo que administradores auditem tentativas de abuso ou bugs de segurança.
