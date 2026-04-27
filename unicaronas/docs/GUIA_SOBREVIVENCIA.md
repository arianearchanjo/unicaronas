# 🆘 GUIA DE SOBREVIVÊNCIA (LEIA ISSO SE O PROJETO NÃO FUNCIONA)

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

### 🔄 Resetando o Banco (Zerar e Recomeçar)
Se o seu banco de dados está bagunçado ou você quer limpar tudo e usar os dados de exemplo, siga estes passos:

1. **Limpar e recriar tabelas:** (Na pasta `unicaronas/database`)
   ```bash
   psql -U postgres -d unicaronas -f schema.sql
   ```
2. **Aplicar atualizações (Importante):** (Na pasta `unicaronas/backend`)
   ```bash
   npm run migrate
   ```
3. **Inserir dados de exemplo:** (Na pasta `unicaronas/database`)
   ```bash
   psql -U postgres -d unicaronas -f data.sql
   ```

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
