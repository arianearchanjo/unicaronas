# 🎓 Apresentação do Projeto: UniCaronas
**Sistema de Carona Solidária Universitária**

---

## 📝 1. O Problema
O transporte universitário enfrenta desafios como:
- **Custo elevado:** Combustível e manutenção para quem vai sozinho.
- **Insegurança:** Falta de confiança em caronas informais.
- **Impacto Ambiental:** Excesso de veículos com apenas uma pessoa.
- **Dificuldade de Comunicação:** Grupos de WhatsApp que se perdem no volume de mensagens.

## 🚀 2. A Solução: UniCaronas
Uma plataforma centralizada que conecta motoristas e passageiros da mesma instituição, garantindo:
- **Economia:** Divisão justa de custos baseada na distância.
- **Segurança:** Acesso restrito a e-mails institucionais e perfis avaliados.
- **Agilidade:** Chat integrado e mapas em tempo real.
- **Acessibilidade:** Interface multilíngue (Português, Inglês e Espanhol).

---

## 🛠️ 3. Arquitetura Técnica (Stack)
O projeto foi desenvolvido focando em performance e simplicidade de manutenção:

- **Frontend:** HTML5, CSS3 (Vanilla) e JavaScript Puro. 
  - *Destaque:* Uso de **Web Components** e estados locais para uma experiência de SPA (Single Page Application) sem frameworks pesados.
- **Backend:** Node.js com Express.
  - *Destaque:* Arquitetura RESTful com autenticação via **JWT (JSON Web Token)**.
- **Banco de Dados:** PostgreSQL.
  - *Destaque:* Sistema de triggers para atualização automática de médias de avaliação e contagem de vagas.

---

## ✨ 4. Funcionalidades de Destaque (Diferenciais)

### 🗺️ Inteligência Geoespacial
- **Autocomplete de Endereços:** Integração com a API do Nominatim para garantir que apenas endereços reais sejam cadastrados.
- **Mapas Interativos:** Visualização de rotas com Leaflet.js, facilitando o encontro entre motorista e passageiro.

### 📊 Dashboard Dinâmico
- A interface se adapta ao papel do usuário. Motoristas veem ferramentas de gestão; passageiros veem ferramentas de busca.

### 💬 Comunicação em Tempo Real
- Chat global integrado que permite combinar detalhes sem sair da plataforma, com sistema de notificações e leitura.

### ⚙️ Engenharia de Software (Qualidade)
- **Automação de Migrations:** Scripts que atualizam o banco de dados dos colaboradores automaticamente ao iniciar o projeto (`npm run migrate`).
- **Precificação Justa:** Algoritmo que sugere valores baseados na distância e preço do combustível.

---

## 📈 5. Status do Projeto (MVP)
Atualmente, o sistema cobre todo o "Caminho Feliz":
1. **Cadastro/Login** (com validação de e-mail institucional).
2. **Criação de Carona** (com suporte a caronas recorrentes/semanais).
3. **Busca Avançada** (por filtros de data, preço e local).
4. **Solicitação e Aprovação** (fluxo completo de notificações).
5. **Chat e Ajustes** (comunicação direta).
6. **Pagamento e Conclusão** (simulação de checkout e taxa da plataforma).
7. **Avaliação Mutua** (sistema de estrelas que gera a reputação do usuário).

---

## 👥 6. Equipe
- **Ariane Archanjo** — Scrum Master
- **Matheus Sizanoski** — Fullstack Developer
- **Pedro Kafka** — Fullstack Developer
- **Rafael Machado** — Product Owner

---
*UniCaronas — A tecnologia aproximando quem estuda perto.*
