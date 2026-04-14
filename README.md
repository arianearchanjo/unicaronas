# UniCaronas

Sistema web de caronas universitárias — conecta estudantes da mesma instituição para compartilhar trajetos de forma segura e econômica.

---

## Funcionalidades

- **Autenticação Segura**: Login e cadastro com validação de e-mail institucional.
- **Dashboard Inteligente**: Visão geral com estatísticas de caronas disponíveis, viagens agendadas e avaliação média.
- **Busca Avançada**: Filtros por origem, destino, data e preço máximo.
- **Criação de Carona**: Sugestão automática de preço baseada na distância (R$ 0,30/km) e suporte a **caronas recorrentes** (semanais).
- **Mapa Interativo**: Visualização do trajeto com marcadores de origem e destino via Leaflet.js.
- **Gestão de Vagas**: Sistema de solicitação com aprovação ou recusa pelo motorista e atualização automática de vagas.
- **Chat em Tempo Real**: Conversa integrada entre motorista e passageiro para combinar detalhes.
- **Pagamentos Flexíveis**: Suporte a PIX, Cartão e Dinheiro com cálculo automático de taxa da plataforma (10%).
- **Perfil do Usuário**: Upload de foto, histórico de viagens concluídas e sistema de avaliações com estrelas.
- **Internacionalização**: Suporte completo a Português (PT), Inglês (EN) e Espanhol (ES).
- **Design Responsivo**: Interface moderna e otimizada para dispositivos móveis e desktop.

---

## Tecnologias

| Camada | Tecnologia | Versão |
|--------|------------|--------|
| Frontend | HTML5, CSS3, JavaScript Vanilla | — |
| Backend | Node.js | ^18.0.0 |
| Framework Web | Express | ^4.19.2 |
| Banco de Dados | PostgreSQL | ^14.0.0 |
| Autenticação | JSON Web Token (JWT) | ^9.0.2 |
| Mapas | Leaflet.js | 1.9.4 |
| Estilização | Google Fonts (DM Sans, DM Mono) | — |

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

### 2. Criar o banco de dados

Execute no terminal:

```bash
psql -U postgres -c "CREATE DATABASE unicaronas;"
```

Depois crie as tabelas e insira os dados de teste:

```bash
# Entrar na pasta do banco
cd unicaronas/database

# Criar tabelas
psql -U postgres -d unicaronas -f schema.sql

# Inserir dados de teste
psql -U postgres -d unicaronas -f data.sql
```

### 3. Configurar as variáveis de ambiente

Crie o arquivo `.env` na pasta `backend`:

```bash
cd ../backend
cp .env.example .env
```

Edite o `.env` com suas credenciais:

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `PORT` | Porta do servidor | `3000` |
| `NODE_ENV` | Ambiente de execução | `development` |
| `DB_HOST` | Host do banco | `localhost` |
| `DB_PORT` | Porta do banco | `5432` |
| `DB_NAME` | Nome do banco | `unicaronas` |
| `DB_USER` | Usuário do banco | `postgres` |
| `DB_PASSWORD` | Senha do banco | `suasenha` |
| `JWT_SECRET` | Segredo para o token | `texto_secreto_aqui` |
| `FRONTEND_URL` | URL do Live Server | `http://localhost:5500` |
| `EMAIL_DOMINIOS`| Domínios permitidos | `@uni.edu.br,@universidade.edu.br` |
| `CUSTO_POR_KM` | Valor base da carona | `0.30` |
| `TAXA_PLATAFORMA_PERCENT` | Taxa do sistema | `10` |

### 4. Iniciar o Backend

```bash
npm install
npm run dev
```

### 5. Iniciar o Frontend

Com o backend rodando, abra o VSCode e execute o arquivo `frontend/pages/login.html` com o **Live Server**.

---

## Estrutura do projeto

```
unicaronas/
├── backend/
│   ├── config/
│   │   └── database.js          # Configuração do Pool do PostgreSQL
│   ├── src/
│   │   ├── controllers/         # Lógica de negócio (Caronas, Usuários, etc)
│   │   ├── middleware/          # Auth JWT, Upload (Multer), Validação
│   │   ├── routes/              # Definição dos endpoints da API
│   │   └── utils/               # Utilitário de precificação por distância
│   ├── uploads/                 # Armazenamento de fotos de perfil
│   ├── server.js                # Ponto de entrada (Express + Middlewares)
│   └── package.json             # Dependências e scripts (start, dev)
├── database/
│   ├── schema.sql               # Estrutura das tabelas e triggers
│   └── data.sql                 # Dados de semente para teste
├── docs/                        # Documentação técnica (sprints e resultados)
│   ├── sprints/                 # Planejamento, requisitos e design
│   └── resultados-sprint/       # Relatórios e entregáveis (pitch, etc)
├── frontend/
│   ├── css/
│   │   └── style.css            # Design System, Layout Desktop e Mobile
│   ├── js/
│   │   ├── api.js               # Cliente de API e polling de notificações
│   │   ├── chat-global.js       # Widget de chat global (polling 5s)
│   │   ├── i18n.js              # Sistema de tradução (PT/EN/ES)
│   │   └── perfil.js            # Lógica de renderização do perfil
│   └── pages/                   # Telas da aplicação (HTML Vanilla)
│       ├── login.html           # Acesso ao sistema
│       ├── dashboard.html       # Painel principal do usuário
│       ├── buscar.html          # Busca com grade de resultados
│       ├── carona.html          # Detalhes, Mapa e Chat lateral
│       ├── perfil.html          # Perfil, Histórico e Avaliações
│       └── pagamento.html       # Checkout de reserva
└── README.md
```

---

## Rotas da API

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| **Usuários** | | | |
| POST | `/api/usuarios` | Não | Cadastrar novo usuário |
| POST | `/api/usuarios/login` | Não | Autenticação |
| GET | `/api/usuarios/:id` | Sim | Ver perfil de um usuário |
| PATCH | `/api/usuarios/perfil` | Sim | Atualizar dados e foto |
| **Caronas** | | | |
| GET | `/api/caronas` | Não | Listar caronas com filtros |
| POST | `/api/caronas` | Sim | Criar carona (normal ou semanal) |
| GET | `/api/caronas/:id` | Não | Detalhes da carona |
| GET | `/api/caronas/historico/:uid`| Sim | Histórico de caronas concluídas |
| PATCH | `/api/caronas/:id/concluir` | Sim | Finalizar viagem |
| **Solicitações** | | | |
| POST | `/api/caronas/:id/solicitar` | Sim | Pedir vaga em carona |
| GET | `/api/caronas/:id/solicitacoes`| Sim | Listar pedidos (para motorista) |
| PATCH | `/api/caronas/solicitacoes/:id`| Sim | Aceitar/Recusar pedido |
| GET | `/api/caronas/solicitacoes/pendentes`| Sim | Contagem de novos pedidos |
| **Chat & Mensagens** | | | |
| POST | `/api/mensagens` | Sim | Enviar mensagem |
| GET | `/api/mensagens/:sid` | Sim | Histórico da conversa |
| GET | `/api/mensagens/nao-lidas` | Sim | Contagem de mensagens novas |
| **Avaliações & Pagamento** | | | |
| POST | `/api/avaliacoes` | Sim | Avaliar motorista ou passageiro |
| GET | `/api/avaliacoes/:uid` | Não | Ver avaliações de um usuário |
| POST | `/api/pagamentos` | Sim | Processar pagamento da vaga |

---

## Problemas comuns

- **Erro de CORS**: Certifique-se que o `FRONTEND_URL` no `.env` corresponde exatamente à URL do Live Server (incluindo a porta).
- **Token Expirado**: Se receber erro 401, faça logout e login novamente para renovar o token JWT.
- **Geocodificação no Mapa**: O mapa utiliza Nominatim. Se o endereço não for encontrado, o mapa será ocultado silenciosamente.
- **Porta em Uso**: Se a porta 3000 estiver ocupada, altere a `PORT` no `.env` e a `API_URL` em `frontend/js/api.js`.

---

## Time

| Nome | Função |
|------|--------|
| **Ariane Archanjo** | Product Owner |
| **Matheus Sizanoski** | Scrum Master |
| **Pedro Kafka** | Dev Frontend |
| **Rafael Machado** | Dev Backend |

---

Projeto acadêmico — Engenharia de Software
