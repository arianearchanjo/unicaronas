# UniCaronas 🚗💨

**Conectando estudantes para trajetos seguros, econômicos e sustentáveis.**

---

## 🆘 GUIA DE SOBREVIVÊNCIA (LEIA ISSO SE O PROJETO NÃO FUNCIONA)

Se você acabou de puxar o projeto e nada funciona, a culpa provavelmente é sua (ou do seu ambiente). Siga estes passos **EXATAMENTE** na ordem:

### 1. Banco de Dados (PostgreSQL)
Muitos erros ocorrem porque o banco de dados não existe ou está vazio.
1. Certifique-se de que o PostgreSQL está **RODANDO** no seu computador.
2. Abra o seu terminal (ou pgAdmin) e execute:
   ```sql
   CREATE DATABASE unicaronas;
   ```
3. Navegue até a pasta `unicaronas/database` e execute os scripts na ordem:
   ```bash
   psql -U postgres -d unicaronas -f schema.sql
   psql -U postgres -d unicaronas -f data.sql
   ```
   *Dica: Se você não sabe usar o terminal para isso, abra os arquivos .sql no seu editor de banco de dados e execute o conteúdo.*

### 2. Configuração do Backend (A parte que todo mundo esquece)
O backend não adivinha suas configurações.
1. Entre na pasta `unicaronas/backend`.
2. Execute o comando: `npm install` (Isso instala as dependências. Sem isso, nada feito).
3. **CRIE UM ARQUIVO CHAMADO `.env`** dentro da pasta `backend`.
4. Copie o conteúdo do arquivo `.env.example` para dentro do seu novo `.env`.
5. No seu `.env`, coloque a **SUA SENHA** do PostgreSQL na linha `DB_PASSWORD=suasenha`.

### 3. Rodando o Servidor (COM ATUALIZAÇÃO AUTOMÁTICA)
Ainda na pasta `backend`, execute:
```bash
npm run dev
```
**O que acontece agora?**
- O sistema vai rodar o script de migração (`npm run migrate`) **SOZINHO**.
- Ele vai criar as colunas novas, tabelas de veículos e chats que estiverem nos arquivos `migration_*.sql`.
- Se aparecer `🎉 Tudo pronto! O banco de dados está atualizado.`, você não precisa fazer mais nada no PostgreSQL.
- Se o servidor rodar e aparecer `✅ UniCaronas API rodando em http://localhost:3000`, parabéns! Você conseguiu.

### 4. Rodando o Frontend
1. Não tente abrir os arquivos HTML direto no navegador clicando neles. **NÃO FUNCIONA.**
2. Use a extensão **Live Server** do VSCode.
3. Abra a pasta `unicaronas/frontend` no VSCode.
4. Clique com o botão direito em `pages/login.html` e selecione **"Open with Live Server"**.
5. O frontend deve abrir em `http://127.0.0.1:5500` (ou porta similar).

---

## ✨ Funcionalidades Principais

- **👤 Perfil Personalizado**: Escolha seu papel como **Passageiro**, **Motorista** ou **Misto**.
- **📊 Dashboard Inteligente**: Mensagens dinâmicas baseadas no seu perfil (Encontre caronas ou Ofereça caronas).
- **🚗 Cadastro de Veículo Integrado**: Motoristas registram seus veículos para maior agilidade.
- **🔍 Busca com Filtros**: Encontre caronas por origem, destino, data e preço.
- **💬 Chat em Tempo Real**: Combine detalhes diretamente com o motorista.
- **📍 Mapas Interativos**: Visualização de rotas via Leaflet.js.
- **💳 Pagamento e Taxas**: Suporte a múltiplos métodos com cálculo automático da taxa (10%).
- **🌐 Internacionalização**: Interface em Português, Inglês e Espanhol.

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

## 👥 Equipe de Desenvolvimento

- **Ariane Archanjo** — *Scrum Master*
- **Matheus Sizanoski** — *Fullstack Developer*
- **Pedro Kafka** — *Fullstack Developer*
- **Rafael Machado** — *Product Owner*

---
*Projeto acadêmico para o curso de Engenharia de Software — 2026*
