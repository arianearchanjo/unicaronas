# User Story: Preferência de Gênero e Segurança

**Como** usuário do sistema (motorista ou passageiro),
**Eu quero** definir ou filtrar caronas por preferência de gênero,
**Para que** eu me sinta mais seguro(a) e confortável durante o trajeto acadêmico.

---

## Critérios de Aceitação (AC)

### AC1: Criação de Carona Exclusiva (Feminino)
**Dado que** eu sou uma motorista do gênero feminino (`genero = 'F'`),
**Quando** eu criar uma nova carona,
**Então** o sistema deve me permitir selecionar a opção "Somente Mulheres".

### AC2: Restrição de Criação (Masculino)
**Dado que** eu sou um motorista do gênero masculino (`genero = 'M'`),
**Quando** eu tentar criar uma carona com a preferência "Somente Mulheres",
**Então** o sistema deve bloquear a ação e exibir uma mensagem de erro informando que esta opção é exclusiva para motoristas mulheres.

### AC3: Visibilidade na Busca
**Dado que** eu sou um passageiro do gênero masculino,
**Quando** eu buscar por caronas disponíveis,
**Então** o sistema não deve exibir caronas marcadas como "Somente Mulheres".

### AC4: Bloqueio de Solicitação
**Dado que** um usuário do gênero masculino tenta acessar o link direto de uma carona "Somente Mulheres",
**Quando** ele tentar "Solicitar Carona",
**Então** o sistema deve impedir a solicitação e informar o motivo da restrição.

---

## Regras de Negócio (RN)

1. **Precedência do Gênero do Usuário:** O sistema deve validar o gênero do usuário baseado no cadastro oficial (matricula/documento).
2. **Opções de Preferência:** As caronas podem ter as preferências: `todos` (padrão) ou `somente_mulheres`.
3. **Imutabilidade da Preferência:** Uma vez criada a carona com uma preferência de gênero, ela não pode ser alterada se já houver solicitações (pendentes ou aceitas).
4. **Visibilidade de Perfil:** O gênero do motorista e dos passageiros já confirmados deve estar visível no detalhe da carona para auxiliar na decisão de outros usuários.

---

## Notas Técnicas
- **Tabela `usuarios`:** Coluna `genero` (`M`, `F`).
- **Tabela `caronas`:** Coluna `genero_preferencia` (`todos`, `somente_mulheres`).
- **Endpoints impactados:** `POST /api/caronas` (validação na criação), `GET /api/caronas` (filtro na listagem), `POST /api/caronas/:id/solicitar` (validação na solicitação).
