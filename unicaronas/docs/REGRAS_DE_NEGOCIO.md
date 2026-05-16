# Regras de Negócio 📋

Este documento descreve as políticas, restrições e cálculos que governam o comportamento do UniCaronas.

## 1. Perfis de Usuário e Permissões

O sistema possui três perfis principais definidos no campo `perfil_tipo`:

-   **Estudante (Passageiro):**
    -   Pode buscar e solicitar caronas.
    -   Pode avaliar motoristas.
    -   **Restrição:** Não pode cadastrar veículos nem criar caronas.
-   **Motorista:**
    -   Pode criar e gerenciar suas caronas.
    -   Pode avaliar passageiros.
    -   **Restrição:** Não pode buscar caronas de outros motoristas.
-   **Misto:**
    -   Possui todas as permissões de ambos os perfis acima.
-   **Admin (`is_admin: true`):**
    -   Pode aprovar/rejeitar documentos de novos usuários.
    -   Pode visualizar relatórios de erro do sistema.

## 2. Regras para Criação de Caronas

Para garantir a segurança e a organização, as seguintes regras são validadas no `caronasController.js`:

-   **Horário:** A partida deve ser obrigatoriamente no futuro.
-   **Limitação Semestral:** Só é permitido criar caronas para o semestre letivo atual (até 30/06 ou 31/12).
-   **Dia EAD:** Se o usuário tiver um "Dia EAD" configurado em seu perfil, o sistema impede a criação de caronas nesse dia da semana.
-   **Gênero:** Motoristas que se identificam como Masculino não podem criar caronas exclusivas para mulheres.
-   **Recorrência:** Ao marcar uma carona como recorrente, o sistema gera automaticamente cópias para as próximas 3 semanas (respeitando a regra do dia EAD).

## 3. Algoritmo de Precificação

O UniCaronas utiliza uma fórmula baseada no custo estimado de deslocamento:

-   **Preço Gasolina (Ref):** R$ 5,50
-   **Consumo Médio (Ref):** 10 km/litro
-   **Taxa da Plataforma:** 10% do valor por passageiro.
-   **Cálculo:** `((distancia_km / 10) * 5.50) / 4` + 10% de taxa.
-   **Flexibilidade:** O motorista recebe uma sugestão baseada na fórmula, mas pode definir o `valor_cobrado` manualmente.

## 4. Política de Pagamentos

-   **Modelo:** Pré-pago ou Pós-pago (conforme conclusão). O sistema exige que a carona seja marcada como "Concluída" pelo motorista antes que o pagamento seja formalmente registrado.
-   **Pix:** O pagamento via Pix é feito para uma chave central da plataforma (operador). O repasse ao motorista é um processo offline/manual nesta versão.
-   **Taxas:** O valor que o passageiro paga inclui a taxa da plataforma; o motorista recebe o valor líquido após a dedução.

## 5. Validação de Cadastro

-   **Domínios Autorizados:** O cadastro é restrito a emails com extensões específicas (ex: `@unifacear.edu.br`, `@ufpr.br`).
-   **Documentação:** O status inicial de todo novo usuário é `pendente`. Ele só pode utilizar os recursos core do sistema após um administrador aprovar seus documentos (CNH/Identidade).
