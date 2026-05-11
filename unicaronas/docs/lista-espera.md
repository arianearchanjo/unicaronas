# User Story: Gestão de Lista de Espera em Caronas Lotadas

**Como** passageiro interessado em uma carona lotada,
**Eu quero** entrar em uma lista de espera,
**Para que** eu seja notificado caso uma vaga seja liberada e eu possa garantir meu lugar.

---

## Critérios de Aceitação (AC)

### AC1: Entrada na Lista de Espera
**Dado que** uma carona atingiu o limite máximo de vagas (`vagas_disponiveis = 0`),
**Quando** eu clicar em "Entrar na Lista de Espera",
**Então** o sistema deve registrar minha solicitação com status `aguardando` e me confirmar a entrada na fila.

### AC2: Notificação de Vaga Liberada
**Dado que** eu estou na lista de espera com status `aguardando`,
**Quando** um passageiro confirmado cancelar sua participação ou o motorista aumentar o número de vagas,
**Então** o sistema deve me notificar imediatamente (via notificação interna/push) e alterar meu status para `notificado`.

### AC3: Janela de Oportunidade (Timeout)
**Dado que** recebi uma notificação de vaga liberada,
**Quando** passarem 30 minutos sem que eu realize a solicitação formal da carona,
**Então** meu status na lista de espera deve mudar para `expirado` e a vaga deve ser oferecida ao próximo da fila.

### AC4: Conversão de Status
**Dado que** recebi uma notificação de vaga liberada,
**Quando** eu solicitar a carona dentro do prazo de 30 minutos,
**Então** meu status na lista de espera deve mudar para `convertido` e o motorista deve receber minha solicitação para aprovação.

---

## Regras de Negócio (RN)

1. **Prioridade por Ordem de Chegada:** A lista de espera deve seguir rigorosamente a ordem cronológica de entrada (`id` ou `criado_em`).
2. **Limite de Notificações Simultâneas:** O sistema deve notificar apenas o número de pessoas equivalente às vagas liberadas. Ex: Se 1 vaga abriu, apenas o 1º da fila é notificado. Se ele expirar, o 2º é notificado.
3. **Impedimento de Duplicidade:** Um usuário não pode entrar na lista de espera se já estiver confirmado na carona ou se já possuir uma solicitação pendente.
4. **Validação de Janela (Timeout):**
   - O job de verificação deve rodar em intervalos curtos (ex: a cada 1 ou 5 minutos).
   - O campo `atualizado_em` (ou `criado_em` no momento da notificação) deve ser usado para calcular os 30 minutos de tolerância.
5. **Impacto no Banco de Dados:**
   - Ao expirar (`status = 'expirado'`), o registro permanece para histórico, mas a posição na fila é invalidada.
   - Ao converter (`status = 'convertido'`), o fluxo segue para a tabela `solicitacoes_carona`.

---

## Notas Técnicas
- **Tabela:** `lista_espera`
- **Estados (Enum):** `aguardando`, `notificado`, `expirado`, `convertido`.
- **Serviço Responsável:** `listaEsperaService.js` (processamento de background).
