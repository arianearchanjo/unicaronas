# Guia de Setup e Instalação 🛠️

Siga estas instruções para configurar o ambiente de desenvolvimento do UniCaronas.

## 1. Pré-requisitos
-   **Node.js** (v18 ou superior)
-   **PostgreSQL** (v14 ou superior)
-   **NPM** ou **Yarn**

## 2. Configuração do Banco de Dados
1.  Crie um banco de dados chamado `unicaronas`.
2.  Importe o schema inicial:
    ```bash
    psql -U seu_usuario -d unicaronas -f database/schema.sql
    psql -U seu_usuario -d unicaronas -f database/data.sql
    ```

## 3. Instalação do Backend
1.  Navegue até a pasta do backend:
    ```bash
    cd backend
    ```
2.  Instale as dependências:
    ```bash
    npm install
    ```
3.  Configure as variáveis de ambiente:
    -   Copie o arquivo `.env.example` para `.env`.
    -   Preencha as informações de conexão com o banco e o `JWT_SECRET`.
    ```env
    PORT=3000
    DATABASE_URL=postgres://usuario:senha@localhost:5432/unicaronas
    JWT_SECRET=sua_chave_secreta_aqui
    PIX_CHAVE=financeiro@unicaronas.com.br
    ```

## 4. Execução do Sistema

### Rodando o Backend
```bash
# Modo desenvolvimento (com auto-reload)
npm run dev

# Modo produção
npm start
```

### Rodando o Frontend
Como o frontend é baseado em arquivos estáticos, você pode:
1.  Abrir o arquivo `frontend/index.html` diretamente no navegador.
2.  **Recomendado:** Utilizar a extensão "Live Server" do VS Code para servir os arquivos e evitar problemas de CORS com o protocolo `file://`.

## 5. Scripts Úteis
-   `npm run migrate`: Aplica as migrações SQL pendentes (via `backend/migrate.js`).
-   `node reset-db.js`: Limpa e recria todas as tabelas (CUIDADO: Apaga todos os dados).

## 6. Troubleshooting (Problemas Comuns)

### Erro de CORS
Se o frontend não conseguir acessar a API:
-   Verifique se o `API_URL` em `frontend/js/api.js` aponta para o endereço correto do backend.
-   Certifique-se de que o backend está rodando e o middleware CORS está habilitado em `server.js`.

### Erro de Conexão com Banco
-   Verifique se o serviço do PostgreSQL está ativo.
-   Confirme se a string de conexão no `.env` está correta.

### Uploads não aparecem
-   Certifique-se de que a pasta `backend/uploads` existe e o servidor tem permissão de escrita nela.
