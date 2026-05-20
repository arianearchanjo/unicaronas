# Status da Sprint Final 🏁

Este documento apresenta uma análise crítica e técnica do estado real do projeto UniCaronas.

## ✅ Funcionalidades Concluídas
-   **Sistema de Autenticação:** JWT robusto com hashing Bcrypt e proteção de rotas.
-   **Gestão de Perfis:** Upload de fotos e documentos funcionando.
-   **Fluxo de Caronas:** Ciclo completo (Criar -> Solicitar -> Aceitar -> Concluir).
-   **Motor de Precificação:** Cálculo automático baseado em distância km.
-   **Avaliações:** Sistema de 1 a 5 estrelas com gatilhos em banco de dados para média automática.
-   **Chat & Notificações:** Funcional via Polling (HTTP).
-   **Internacionalização:** Suporte a 3 idiomas (PT, EN, ES) em toda a interface.
-   **Financeiro:** Gerador de payload Pix EMV funcional e integrado.
-   **Lista de Espera:** Lógica de fila e processamento via Job de background.

## ⚠️ Funcionalidades Parciais
-   **Pagamentos:** A "verificação" do pagamento é baseada na confiança do usuário (não há integração com Webhook de bancos para confirmar o recebimento real do Pix).
-   **Chat:** O uso de Polling (10s) gera uma experiência de "atraso".
-   **Recorrência:** Implementada para apenas 3 semanas; falta uma interface para gerenciar a série completa de caronas recorrentes.
-   **Admin:** O painel permite verificação de usuários, mas carece de métricas e gráficos de uso.

## ❌ Funcionalidades Pendentes
-   **Recuperação de Senha:** Rota existe no backend, mas o envio real de email (SMTP) precisa de configuração de credenciais válidas no `.env`.
-   **Integração com Mapas:** Atualmente as localizações são apenas texto; falta visualização em mapa (Google Maps/Leaflet).
-   **Exportação de Dados:** Relatórios financeiros para motoristas em PDF/Excel.

## 🧱 Débitos Técnicos
-   **Frontend:** Uso extensivo de JavaScript Vanilla em arquivos muito grandes (ex: `chat-global.js`). Recomenda-se modularização futura ou adoção de um framework (React/Vue).
-   **Segurança:** Falta de `rate-limiting` nas rotas de login e API pública.
-   **Logs:** Console logs excessivos em ambiente de desenvolvimento que podem expor dados em produção.

## 🔧 Melhorias Arquiteturais Recomendadas
-   **WebSockets:** Substituir o Polling por Socket.io para chat e notificações instantâneas.
-   **ORM:** Migrar de SQL puro para um ORM (Prisma/Sequelize) para facilitar manutenções futuras no schema.
-   **Testes:** Cobertura de testes unitários é baixa; focar em testar os controllers de Carona e Pagamento.

## 🚨 Riscos Técnicos
-   **Concorrência na Lista de Espera:** Se dois usuários tentarem converter a vaga ao mesmo tempo no exato segundo do Job, pode haver uma condição de corrida (Race Condition).
-   **Uploads:** Armazenamento local de arquivos. Se o servidor for reiniciado em ambientes como Heroku (sem persistent storage), as fotos serão perdidas. Recomenda-se AWS S3.
