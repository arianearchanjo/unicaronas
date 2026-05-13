# Guia de Configuração: Recuperação de Senha via E-mail

Este documento descreve o processo de configuração, funcionamento e validação do sistema de recuperação de senha do UniCaronas, utilizando **Node.js**, **Nodemailer** e o servidor SMTP do **Gmail**.

---

## 1. Configuração de 'Senha de App' no Google

O Gmail não permite mais o uso da senha convencional da conta para conexões SMTP externas por motivos de segurança. É obrigatório o uso de uma "Senha de App".

### Passo a Passo:
1. Acesse sua [Conta do Google](https://myaccount.google.com/).
2. No menu lateral, clique em **Segurança**.
3. Em "Como você faz login no Google", ative a **Verificação em duas etapas** (se ainda não estiver ativa).
4. Após ativar, clique novamente em **Verificação em duas etapas**.
5. Role até o final da página e clique em **Senhas de app**.
6. No campo "Nome do app", digite `UniCaronas` (ou qualquer nome de sua preferência).
7. Clique em **Criar**.
8. O Google exibirá um código de **16 dígitos** em um quadro amarelo. 
   - **Importante:** Copie este código imediatamente. Ele não será mostrado novamente.

---

## 2. Configuração do Ambiente (.env)

No diretório `/backend`, localize ou crie o arquivo `.env`. Adicione as seguintes variáveis, substituindo pelos seus dados:

| Variável | Descrição | Exemplo/Valor |
| :--- | :--- | :--- |
| `MAIL_HOST` | Servidor SMTP do Gmail | `smtp.gmail.com` |
| `MAIL_PORT` | Porta para conexão | `587` |
| `MAIL_USER` | Seu e-mail completo do Gmail | `seu-usuario@gmail.com` |
| `MAIL_PASS` | A senha de app de 16 dígitos | `abcd efgh ijkl mnop` |

> **Nota:** Ao colar a `MAIL_PASS`, certifique-se de que não há espaços extras antes ou depois do código. O Gmail aceita o código com ou sem os espaços internos, mas o ideal é remover os espaços para evitar erros de caractere invisível.

---

## 3. Fluxo do Sistema

O processo de recuperação de senha está dividido em duas frentes principais:

### 3.1. Geração de Token (`usuariosController.js`)
Quando o usuário solicita a recuperação:
1. O sistema verifica se o e-mail existe na base de dados.
2. É gerado um token aleatório seguro usando a biblioteca `crypto`.
3. O **hash** desse token (via `bcrypt`) é salvo na tabela `password_resets` com uma validade de **30 minutos**.
4. Um link é construído contendo o token original e o e-mail do usuário.

### 3.2. Disparo de E-mail (`mailService.js`)
O serviço de e-mail utiliza o **Nodemailer**:
- **Transporter:** Configura a conexão com o Gmail usando as variáveis de ambiente.
- **Template:** Monta o corpo do e-mail em HTML com um botão de ação que redireciona o usuário para a página de redefinição no frontend.
- **Envio Assíncrono:** O disparo é feito em segundo plano para não atrasar a resposta da API ao usuário.

---

## 4. Troubleshooting (Resolução de Problemas)

Se o e-mail não estiver chegando, verifique os seguintes pontos:

### Monitoramento de Logs
Verifique o terminal onde o backend está rodando. O `mailService.js` possui logs específicos:
- `[MailService] E-mail de reset enviado para: ...` (Sucesso)
- `[MailService] Erro ao enviar e-mail: ...` (Falha - Verifique as credenciais no `.env`)

### Portas SMTP
- **Porta 587:** É a padrão para TLS/STARTTLS. Recomendada para a maioria das aplicações.
- **Porta 465:** Utilizada para SSL direto. Se optar por esta porta, o código no `mailService.js` ajustará automaticamente a propriedade `secure: true`.

### Caixa de SPAM
Como o e-mail é enviado por um servidor SMTP e não por uma ferramenta de marketing consolidada, ele pode ser classificado como SPAM pelo Gmail ou Outlook. Sempre oriente o usuário a verificar a pasta de Lixo Eletrônico.

---

## 5. Segurança

- **Proteção de Credenciais:** O arquivo `.env` contém dados sensíveis (sua senha de app). **NUNCA** envie o arquivo `.env` para repositórios públicos (GitHub, GitLab, etc). Certifique-se de que ele está listado no seu `.gitignore`.
- **Hashing de Tokens:** O sistema não armazena o token de recuperação em texto puro no banco de dados. Utilizamos `bcrypt` para garantir que, mesmo em caso de vazamento da base de dados, os links de recuperação ativos permaneçam seguros.
- **User Enumeration:** A API está configurada para retornar a mesma mensagem de sucesso, independentemente de o e-mail existir ou não na base, dificultando que invasores descubram e-mails cadastrados no sistema.

---
*Documento gerado por Gemini CLI em Maio de 2026.*
