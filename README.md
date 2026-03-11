# UniCaronas

Sistema web de caronas universitárias — conecta estudantes da mesma instituição para compartilhar trajetos de forma segura e econômica.

---

## Tecnologias

| Camada | Tecnologia |
|--------|------------|
| Frontend | HTML5, CSS3, JavaScript |
| Backend | Node.js + Express |
| Banco de dados | PostgreSQL |
| Autenticação | JWT |

---

## Pré-requisitos

Antes de começar, instale:

- [Node.js](https://nodejs.org) — versão 18 ou superior
- [PostgreSQL](https://www.postgresql.org/download/) — versão 14 ou superior
- [Git](https://git-scm.com/)
- Extensão **Live Server** no VSCode (de Ritwick Dey)

---

## Como rodar o projeto

### 1. Clonar o repositório

```bash
git clone https://github.com/seu-usuario/unicaronas.git
cd unicaronas
```

---

### 2. Criar o banco de dados

Abra o terminal e execute:

```bash
psql -U postgres -c "CREATE DATABASE unicaronas;"
```

Se o `psql` não for reconhecido no Windows, use o caminho completo:

```powershell
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -c "CREATE DATABASE unicaronas;"
```

> Substitua `17` pelo número da versão do PostgreSQL instalada na sua máquina. Para descobrir, abra o pgAdmin ou verifique em `C:\Program Files\PostgreSQL\`.

Depois crie as tabelas e insira os dados de teste:

```bash
# Entrar na pasta do banco
cd unicaronas/database

# Criar tabelas
psql -U postgres -d unicaronas -f schema.sql

# Inserir dados de teste
psql -U postgres -d unicaronas -f data.sql
```

---

### 3. Configurar as variáveis de ambiente

Entre na pasta do backend e copie o arquivo de exemplo:

```bash
cd unicaronas/backend
cp .env.example .env
```

Abra o arquivo `.env` e preencha com suas informações:

```env
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=unicaronas
DB_USER=postgres
DB_PASSWORD=sua_senha_do_postgres_aqui

JWT_SECRET=qualquer_texto_longo_e_secreto_aqui

FRONTEND_URL=http://127.0.0.1:5500

EMAIL_DOMINIOS=@seudominio.edu.br
```

> Em `EMAIL_DOMINIOS`, coloque o domínio do e-mail da sua universidade. Para aceitar mais de um, separe por vírgula: `@uni.edu.br,@universidade.com.br`

---

### 4. Instalar dependências e iniciar o backend

Ainda dentro da pasta `backend`:

```bash
npm install
npm run dev
```

Se tudo estiver certo, você verá no terminal:

```
UniCaronas API rodando em http://localhost:3000
Conectado ao PostgreSQL
```

Para confirmar que a API está no ar, acesse no navegador:

```
http://localhost:3000/health
```

Deve retornar `{"status":"ok", ...}`.

> Para parar o servidor: `Ctrl + C`

---

### 5. Abrir o frontend

Com o backend rodando, abra o VSCode e clique com o botão direito no arquivo:

```
unicaronas/frontend/pages/login.html
```

Selecione **"Open with Live Server"**.

O navegador vai abrir em `http://127.0.0.1:5500/...` com a tela de login.

> Não abra o arquivo HTML diretamente pelo explorador de arquivos. Use sempre o Live Server para evitar erros de CORS.

---

## Estrutura do projeto

```
unicaronas/
├── backend/
│   ├── config/
│   │   └── database.js          # Conexão com o PostgreSQL
│   ├── src/
│   │   ├── controllers/         # Lógica de cada funcionalidade
│   │   ├── middleware/          # Autenticação JWT, tratamento de erros
│   │   ├── routes/              # Definição das rotas da API
│   │   └── utils/               # Algoritmo de sugestão de preço
│   ├── .env                     # Variáveis de ambiente (não subir no Git)
│   ├── .env.example             # Modelo do .env
│   ├── package.json
│   └── server.js                # Ponto de entrada do servidor
├── database/
│   ├── schema.sql               # Criação das tabelas
│   └── data.sql                 # Dados de teste
├── docs/
│   ├── requirements/            # Script 0, user stories, backlog
│   ├── design/                  # Arquitetura, modelo de dados, telas
│   ├── reports/                 # Relatórios de sprint
│   └── presentations/           # Roteiro de apresentação
├── frontend/
│   ├── css/
│   │   └── style.css            # Estilos globais
│   ├── js/
│   │   └── api.js               # Comunicação com a API
│   └── pages/
│       ├── login.html
│       ├── cadastro.html
│       ├── dashboard.html
│       ├── buscar.html
│       ├── criar-carona.html
│       └── carona.html
└── README.md
```

---

## Rotas da API

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/usuarios` | Cadastrar usuário |
| POST | `/api/usuarios/login` | Login |
| GET | `/api/usuarios/:id` | Perfil do usuário |
| GET | `/api/caronas` | Listar caronas disponíveis |
| POST | `/api/caronas` | Criar carona |
| GET | `/api/caronas/:id` | Detalhes de uma carona |
| POST | `/api/caronas/:id/solicitar` | Solicitar vaga |
| PATCH | `/api/caronas/solicitacoes/:id` | Aceitar ou recusar solicitação |
| POST | `/api/mensagens` | Enviar mensagem no chat |
| GET | `/api/mensagens/:solicitacao_id` | Histórico do chat |
| POST | `/api/pagamentos` | Realizar pagamento |
| POST | `/api/avaliacoes` | Avaliar usuário |

---

## Problemas comuns

**`psql` não reconhecido no Windows**
Adicione `C:\Program Files\PostgreSQL\17\bin` nas variáveis de ambiente do sistema (PATH), ou use o caminho completo para executar o psql.

**"Failed to fetch" no frontend**
Verifique se o backend está rodando (`npm run dev`) e se o `FRONTEND_URL` no `.env` está como `http://127.0.0.1:5500`.

**Erro de e-mail inválido no cadastro**
O domínio do e-mail precisa estar listado em `EMAIL_DOMINIOS` no `.env`.

**Porta 3000 já em uso**
Altere `PORT=3001` no `.env` e atualize a variável `API_URL` em `frontend/js/api.js` para `http://localhost:3001/api`.

---

## Documentação

- [Script 0 — Ideia do projeto](docs/requirements/script0.md)
- [User Stories](docs/requirements/user-stories.md)
- [Product Backlog e Sprints](docs/requirements/backlog.md)
- [Arquitetura do sistema](docs/design/architecture.md)
- [Modelo de dados](docs/design/data-model.md)
- [Fluxos de tela](docs/design/screens.md)
- [Roteiro de apresentação](docs/presentations/pitch.md)

---

## Time

| Nome | Função |
|------|--------|
| — | Product Owner |
| — | Scrum Master |
| — | Dev Frontend |
| — | Dev Backend |

---

Projeto acadêmico — Engenharia de Software
