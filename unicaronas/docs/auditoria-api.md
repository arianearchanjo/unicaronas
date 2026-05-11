# Auditoria de Padronização da API — UniCaronas

Este documento detalha as inconsistências encontradas nos contratos de resposta JSON da API, comparando o estado atual com o contrato padrão estabelecido:
`{ "success": boolean, "data": object|array, "error": string|object }`

## Mapeamento de Inconsistências

| Arquivo | Linha | Estrutura Atual | Problema Detectado |
| :--- | :--- | :--- | :--- |
| `adminController.js` | 51 | `{ success, message, data }` | Campo extra `message` |
| `adminController.js` | 79 | `{ success, message }` | Campo extra `message` (deve ser `data`) |
| `adminController.js` | 117 | `{ success, message }` | Campo extra `message` (deve ser `data`) |
| `caronasController.js` | 345 | `{ sucess, error }` | Erro de digitação na chave `sucess` (falta um 'c') |
| `caronasController.js` | 584 | `{ success, data, message }` | Campo extra `message` |
| `listaEsperaController.js` | 56-57 | `{ success, dados, mensagem }` | Chaves em português (`dados`, `mensagem`) |
| `mensagensController.js` | 174 | `{ success, count }` | Campo extra `count` (deve estar dentro de `data`) |
| `mensagensDigitandoController.js` | 52 | `{ success, typing }` | Campo extra `typing` (deve estar dentro de `data`) |
| `mensagensDigitandoController.js` | 62 | `{ success, typing, users }` | Campos extras fora do wrapper `data` |
| `notificacoesController.js` | 54 | `{ success, message, data }` | Campo extra `message` |
| `pagamentosController.js` | 179 | `{ success, data, resumo }` | Campo extra `resumo` (deve estar dentro de `data`) |
| `usuariosController.js` | 114 | `{ success, message, data }` | Campo extra `message` |
| `usuariosController.js` | 157 | `{ success, message }` | Campo extra `message` (deve ser `data`) |
| `usuariosController.js` | 171 | `{ success, message }` | Campo extra `message` (deve ser `data`) |
| `usuariosController.js` | 361 | `{ success, message }` | Campo extra `message` (deve ser `data`) |
| `veiculoController.js` | 94 | `{ success, message }` | Campo extra `message` (deve ser `data`) |

## Backlog de Correção

### Prioridade 1: Erros de Digitação e Chaves em Português (Crítico)
*   **Ação:** Corrigir `sucess` para `success` em `caronasController.js:345`.
*   **Ação:** Renomear `dados` para `data` e `mensagem` para `data` ou `error` (conforme o caso) em `listaEsperaController.js`.

### Prioridade 2: Campos Extras e Quebra de Wrapper
*   **Ação:** Mover campos como `count`, `typing`, `users`, `resumo` e `total_nao_lidas` para dentro do objeto `data`.
*   **Ação:** Padronizar o uso de `message` como `data` (quando for uma confirmação de sucesso) ou removê-la se a informação já estiver contida no status ou no objeto `data`.

### Prioridade 3: Padronização Global
*   **Ação:** Revisar todos os controllers para garantir que, mesmo em respostas simples (ex: `setTyping`), o objeto retornado sempre contenha as chaves `success`, `data` e `error`, mesmo que algumas sejam `null`.
