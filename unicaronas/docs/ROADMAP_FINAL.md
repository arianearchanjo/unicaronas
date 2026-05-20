# Roadmap Técnico: Sprint Final 🚀

Este documento define as prioridades técnicas e o backlog de melhorias para a conclusão do projeto UniCaronas.

## 1. Prioridades Críticas (Imediato)
-   **Validação Real de Pagamentos:** Desenvolver um simulador de Webhook ou integração com API de bancos (ex: Gerencianet/EFI) para confirmar o recebimento do Pix automaticamente.
    -   **Impacto:** Alto (Segurança Financeira)
    -   **Dificuldade:** Alta
-   **Configuração de SMTP:** Finalizar a integração com serviço de email (SendGrid/Mailtrap) para habilitar a recuperação de senha e notificações por email.
    -   **Impacto:** Alto (UX/Acesso)
    -   **Dificuldade:** Baixa

## 2. Prioridades Altas (Melhoria de Experiência)
-   **Migração para WebSockets:** Substituir o polling atual pelo Socket.io no Chat e Notificações para entregar uma experiência de tempo real.
    -   **Impacto:** Alto (UX/Performance)
    -   **Dificuldade:** Média
-   **Integração com Leaflet/OpenStreetMap:** Adicionar visualização de rota e pontos de encontro em mapas interativos no frontend.
    -   **Impacto:** Médio (Utilidade)
    -   **Dificuldade:** Média

## 3. Prioridades Médias (Refatoração e Estabilidade)
-   **Rate Limiting:** Adicionar proteção contra força bruta em rotas críticas.
-   **Modularização do Frontend:** Quebrar os arquivos de lógica globais em módulos menores e mais fáceis de testar.
-   **Testes Unitários:** Atingir ao menos 40% de cobertura nos controllers do backend.

## 4. Prioridades Baixas (Otimizações)
-   **PWA (Progressive Web App):** Adicionar manifest e service workers para permitir que o sistema seja instalado no celular.
-   **Dashboard Admin Avançado:** Adicionar gráficos de caronas por curso e horários de pico.

---

## 📈 Tabela de Backlog Técnico

| Tarefa | Prioridade | Dificuldade | Dependências |
| :--- | :--- | :--- | :--- |
| Validação de Pagamento | Crítica | Alta | Conta em API de Pagamentos |
| Configurar Nodemailer | Crítica | Baixa | Servidor SMTP |
| Implementar WebSockets | Alta | Média | Alteração na `server.js` |
| Mapas Interativos | Alta | Média | Leaflet JS |
| Rate Limiting | Média | Baixa | `express-rate-limit` |
| Testes Automatizados | Média | Alta | Jest / Supertest |
| Suporte a PWA | Baixa | Baixa | Manifest.json |

---
*Este roadmap deve ser revisado semanalmente durante o Sprint final.*
