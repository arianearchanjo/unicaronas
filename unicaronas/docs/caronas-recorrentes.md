# User Story: Caronas Recorrentes Semanais

**Como** estudante com grade horária fixa,
**Eu quero** cadastrar caronas que se repetem semanalmente,
**Para que** eu não precise cadastrar manualmente a mesma carona todos os dias.

---

## Critérios de Aceitação (AC)

### AC1: Cadastro de Recorrência
**Dado que** eu estou criando uma carona,
**Quando** eu marcar a opção "Repetir semanalmente",
**Então** o sistema deve gerar automaticamente instâncias desta carona para as próximas 3 semanas no mesmo dia e horário.

### AC2: Bloqueio por Dia EAD
**Dado que** minha turma/curso possui um dia de aula EAD (Ensino a Distância) cadastrado no meu perfil,
**Quando** o sistema tentar gerar uma carona recorrente que caia nesse dia,
**Então** aquela instância específica não deve ser criada, e o sistema deve me informar quais datas foram puladas.

### AC3: Cancelamento de Instância Única
**Dado que** eu tenho uma série de caronas recorrentes,
**Quando** eu cancelar apenas uma data específica (ex: feriado),
**Então** as demais caronas da série (semanas anteriores ou posteriores) devem permanecer ativas.

---

## Regras de Negócio (RN)

1. **Limite de Antecedência:** O sistema gera caronas recorrentes com no máximo 3 semanas de antecedência para evitar "poluição" na busca e garantir que o motorista ainda terá disponibilidade.
2. **Sincronização de Dados:** Alterações em uma instância (ex: mudar o ponto de encontro de uma segunda-feira específica) não afetam as outras instâncias da série, a menos que uma funcionalidade de "Alterar todos" seja explicitamente utilizada (não implementado atualmente).
3. **Validação de Semestre:** Não é permitido criar caronas (mesmo recorrentes) fora do intervalo do semestre acadêmico atual.
4. **Dia EAD:** O campo `dia_ead` no perfil do usuário é numérico (0=Domingo, 1=Segunda, etc.). A validação deve comparar `horario_partida.getDay()` com `usuario.dia_ead`.

---

## Notas Técnicas
- **Tabela `caronas`:** Coluna `recorrente` (boolean) identifica se a carona faz parte de uma série.
- **Logica de Criação:** Implementada no `caronasController.js` dentro do método `criar`.
- **Desafio:** Atualmente as instâncias são independentes após a criação. Não há um `serie_id` para agrupar caronas recorrentes, dificultando o cancelamento em massa.
