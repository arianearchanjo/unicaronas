# Documentação do Frontend 🎨

O frontend do UniCaronas é desenvolvido com tecnologias web padrão (Vanilla JS, HTML5, CSS3), focado em performance e compatibilidade sem a necessidade de frameworks complexos.

## 1. Estrutura de Arquivos
-   `index.html`: Landing page e ponto de entrada.
-   `pages/`: Contém as telas principais do sistema.
-   `js/`: Scripts de lógica e integração.
    -   `api.js`: Cliente de API centralizado.
    -   `i18n.js`: Sistema de internacionalização (PT, EN, ES).
    -   `theme.js`: Gerenciamento de tema (Claro/Escuro).
    -   `navbar.js`: Controle da navegação dinâmica baseada no perfil.
-   `css/`: Arquivos de estilo.
    -   `style.css`: Estilos globais e componentes.

## 2. Mapeamento de Páginas

| Página | Descrição | APIs Utilizadas |
| :--- | :--- | :--- |
| `login.html` | Autenticação de usuários. | `POST /usuarios/login` |
| `cadastro.html` | Registro de novos usuários e upload de docs. | `POST /usuarios` |
| `dashboard.html` | Resumo de atividades, notificações e atalhos. | `GET /notificacoes`, `GET /caronas/solicitacoes/pendentes` |
| `buscar.html` | Pesquisa de caronas com filtros. | `GET /caronas` |
| `criar-carona.html` | Formulário para motoristas oferecerem vagas. | `POST /caronas`, `GET /veiculos` |
| `gerenciar-caronas.html` | Gestão de solicitações e caronas oferecidas. | `GET /caronas/:id/solicitacoes`, `PATCH /caronas/solicitacoes/:id` |
| `carona.html` | Detalhes de uma carona específica e chat. | `GET /caronas/:id`, `POST /caronas/:id/solicitar` |
| `mensagens.html` | Inbox de conversas e chat geral. | `GET /mensagens/conversas`, `GET /mensagens/:id` |
| `perfil.html` | Edição de dados, veículos e histórico. | `GET /usuarios/:id`, `PATCH /usuarios/perfil` |
| `pagamento.html` | Interface para pagamento via Pix. | `GET /pagamentos/pix/:id`, `POST /pagamentos` |
| `admin.html` | Painel de controle para administradores. | `GET /admin/usuarios/pendentes` |

## 3. Lógica de Interface (UI Logic)

### 3.1. Proteção de Rotas e Perfis
A função `protegerRota()` em `api.js` é executada em quase todas as páginas:
-   Verifica se o Token JWT existe.
-   Redireciona para `login.html` se não autenticado.
-   **Regras por Perfil:**
    -   **Estudante:** Esconde menus de "Oferecer Carona" e "Gerenciar".
    -   **Motorista:** Esconde o menu "Buscar Carona".
    -   **Misto:** Exibe todas as opções.

### 3.2. Polling Global
Para simular tempo real, o sistema utiliza `setInterval` em `api.js` para atualizar badges de:
-   Mensagens não lidas (a cada 10s).
-   Notificações novas (a cada 20s).
-   Solicitações pendentes para motoristas (a cada 30s).

### 3.3. Internacionalização (i18n)
O script `i18n.js` mapeia chaves de texto para três idiomas. A troca de idioma reflete instantaneamente em elementos com o atributo `data-i18n`.

## 4. Componentes Reutilizáveis (JS/CSS)
-   **Autocomplete:** Implementado em `autocomplete.js` para campos de endereço (origem/destino).
-   **Badges de Notificação:** Elementos flutuantes na Navbar vinculados ao estado da API.
-   **Sistema de Alertas:** Função `showAlert()` para mensagens de feedback persistentes ou temporárias.
-   **Estrelas de Avaliação:** Função `renderEstrelas()` para converter notas numéricas em ícones visuais.
