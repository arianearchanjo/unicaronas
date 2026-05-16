# UniCaronas — Documentação Técnica 🚗🎓

Bem-vindo à documentação oficial do **UniCaronas**, um sistema de caronas universitárias projetado para facilitar o transporte compartilhado entre estudantes e professores, otimizando custos e promovendo a integração acadêmica.

## 📌 Visão Geral
O UniCaronas é uma plataforma completa (Web) que permite aos usuários oferecerem ou buscarem caronas dentro da comunidade universitária. O sistema gerencia desde o cadastro de veículos e definição de rotas até o processamento de pagamentos via Pix e avaliações mútuas.

## 🛠️ Stack Tecnológica Identificada
- **Backend:** Node.js com Express.js
- **Banco de Dados:** PostgreSQL 14+
- **Frontend:** Vanilla JavaScript (ES6+), HTML5, CSS3
- **Autenticação:** JSON Web Token (JWT) com Bcrypt para hashing de senhas
- **Comunicação:** REST API (JSON)
- **Jobs/Processamento:** Node-cron e `setInterval` para tarefas em background
- **Outros:** Multer (Uploads), Helmet (Segurança), Nodemailer (E-mails)

## 🏗️ Arquitetura Resumida
O projeto segue uma arquitetura **Monolítica Modular**:
- **Frontend Separado:** Consome a API via Fetch.
- **Backend Organizado por Camadas:**
  - `routes/`: Definição dos endpoints.
  - `controllers/`: Lógica de controle e orquestração.
  - `services/`: Regras de negócio complexas e integrações.
  - `middleware/`: Autenticação, validação e tratamento de erros.
  - `utils/`: Funções utilitárias (Pix, precificação, etc).

## 🗂️ Índice da Documentação
Navegue pelos documentos detalhados abaixo:

1.  [**Arquitetura do Sistema**](ARQUITETURA.md) — Visão técnica detalhada e diagramas.
2.  [**Banco de Dados**](BANCO_DE_DADOS.md) — Schema, MER e regras de banco.
3.  [**Documentação da API**](API.md) — Guia completo de endpoints (estilo Swagger).
4.  [**Frontend**](FRONTEND.md) — Mapeamento de páginas, componentes e fluxos.
5.  [**Backend**](BACKEND.md) — Estrutura interna, controllers e middlewares.
6.  [**Fluxos do Sistema**](FLUXOS.md) — Diagramas de sequência e fluxos lógicos.
7.  [**Regras de Negócio**](REGRAS_DE_NEGOCIO.md) — Políticas, permissões e cálculos.
8.  [**Segurança**](SEGURANCA.md) — Implementação de proteção e autenticação.
9.  [**Setup e Instalação**](SETUP.md) — Como rodar o projeto localmente.
10. [**Status da Sprint Final**](SPRINT_STATUS.md) — O que está pronto e o que falta.
11. [**Roadmap Técnico**](ROADMAP_FINAL.md) — Próximos passos e backlog.

## 🚀 Resumo das Funcionalidades
- **Gestão de Usuários:** Cadastro, Login, Perfil e Verificação de Identidade (Admin).
- **Caronas:** Criação (recorrente ou única), busca com filtros, itinerários e preferência de gênero.
- **Interatividade:** Chat em tempo real (polling), indicadores de digitação e notificações.
- **Financeiro:** Cálculo automático de custos, geração de QR Code Pix e histórico de pagamentos.
- **Confiança:** Sistema de avaliações com média de estrelas e comentários.
- **Admin:** Painel para aprovação de documentos e monitoramento de erros do sistema.

---
*Documentação gerada automaticamente para o encerramento do Sprint Final.*
