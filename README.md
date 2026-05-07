# UniCaronas 🚗💨

**Conectando estudantes para trajetos seguros, econômicos e sustentáveis.**

O UniCaronas é uma plataforma desenvolvida para facilitar a carona solidária entre estudantes universitários, promovendo a sustentabilidade, a economia e a integração da comunidade acadêmica.

---

## ✨ Funcionalidades Principais

- **👤 Perfil Personalizado**: Escolha seu papel como **Passageiro**, **Motorista** ou **Misto**.
- **📊 Dashboard Inteligente**: Mensagens dinâmicas baseadas no seu perfil (Encontre caronas ou Ofereça caronas).
- **🚗 Cadastro de Veículo Integrado**: Motoristas registram seus veículos para maior agilidade.
- **🔍 Busca com Filtros**: Encontre caronas por origem, destino, data e preço.
- **💬 Chat em Tempo Real**: Combine detalhes diretamente com o motorista.
- **📍 Mapas Interativos**: Visualização de rotas via Leaflet.js.
- **💳 Pagamento e Taxas**: Suporte a múltiplos métodos (incluindo PIX e Stripe) com cálculo automático da taxa (10%).
- **🌐 Internacionalização**: Interface adaptável para múltiplos idiomas (i18n).

---

## 🛠️ Tecnologias Utilizadas

| Camada | Tecnologia |
|--------|------------|
| **Frontend** | HTML5, CSS3, JavaScript Vanilla |
| **Backend** | Node.js (Express) |
| **Banco de Dados** | PostgreSQL |
| **Segurança** | JWT e Bcrypt |
| **Mapas** | Leaflet.js |

---

## 📂 Estrutura de Pastas

```
unicaronas/
├── backend/             # API REST (Node/Express)
│   ├── src/controllers/ # Lógica do sistema
│   ├── src/routes/      # Caminhos da API
│   └── uploads/         # Fotos de perfil
├── database/            # Scripts do Banco (Schema e Dados)
├── frontend/            # Interface Visual
│   ├── js/              # Inteligência do Frontend e Tradução
│   ├── css/             # Estilos Visuais
│   └── pages/           # As telas do sistema (HTML)
└── docs/                # Documentação do projeto
```

---

## 🚀 Como Começar

Para instruções detalhadas de como configurar o ambiente e rodar o projeto localmente, consulte o nosso:

👉 [**Guia de Sobrevivência**](./unicaronas/docs/GUIA_SOBREVIVENCIA.md)

---

## 👥 Equipe de Desenvolvimento

- **Ariane Archanjo** — *Scrum Master*
- **Matheus Sizanoski** — *Fullstack Developer*
- **Pedro Kafka** — *Fullstack Developer*
- **Rafael Machado** — *Product Owner*

---

## ⚙️ Variáveis de Ambiente (.env)

Para o funcionamento completo das US19, US20 e US21, as seguintes variáveis devem ser configuradas no `/backend/.env`:

```env
# E-mail (US20 — Job Semanal)
SMTP_HOST=smtp.exemplo.com
SMTP_PORT=587
SMTP_USER=seu_email@exemplo.com
SMTP_PASS=sua_senha_ou_app_password
EMAIL_FROM="UniCaronas" <contato@exemplo.com>

# Frontend
FRONTEND_URL=http://localhost:5500
```

---
*Sprint 6 concluída com sucesso — Auditoria Técnica Finalizada*
*Projeto acadêmico para o curso de Engenharia de Software — 2026*
