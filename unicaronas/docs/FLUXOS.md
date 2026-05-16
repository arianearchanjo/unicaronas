# Fluxos do Sistema 🔄

Este documento ilustra os principais fluxos operacionais do UniCaronas através de diagramas de sequência.

## 1. Fluxo de Autenticação e Cadastro
O cadastro exige o upload de documentos que serão validados posteriormente por um administrador.

```mermaid
sequenceDiagram
    participant U as Usuário
    participant F as Frontend
    participant B as Backend
    participant D as Banco/S3

    U->>F: Preenche Cadastro + Upload CNH
    F->>B: POST /api/usuarios (FormData)
    B->>D: Salva Documento e Usuário (pendente)
    B-->>F: 201 Created
    F-->>U: "Cadastro realizado! Aguarde aprovação."
    
    Note over B,D: Admin aprova usuário...
    
    U->>F: Login (Email/Senha)
    F->>B: POST /api/usuarios/login
    B->>B: Valida Hash Senha
    B-->>F: 200 OK + JWT Token
    F->>F: Salva Token no localStorage
```

## 2. Fluxo de Carona: Da Oferta ao Pagamento

```mermaid
sequenceDiagram
    participant M as Motorista
    participant P as Passageiro
    participant B as Backend
    
    M->>B: Criar Carona (Origem/Destino/Valor)
    B-->>M: Carona Ativa
    
    P->>B: Buscar Carona
    B-->>P: Lista resultados
    
    P->>B: Solicitar Vaga
    B->>M: Notificação: Nova Solicitação
    
    M->>B: Aceitar Solicitação
    B->>B: Decrementa Vagas
    B->>P: Notificação: Solicitação Aceita
    
    Note over M,P: Viagem Ocorre...
    
    M->>B: Concluir Carona
    B->>P: Habilita Botão "Pagar"
    
    P->>B: GET /api/pagamentos/pix/:id
    B-->>P: Payload Pix (Copia e Cola)
    P->>B: POST /api/pagamentos (Confirmação)
    B-->>P: Pagamento Registrado
```

## 3. Fluxo de Lista de Espera
Quando uma carona está lotada, o sistema gerencia uma fila automática.

```mermaid
sequenceDiagram
    participant P as Passageiro
    participant B as Backend
    participant J as Job (Background)

    P->>B: Solicitar Vaga (Carona Lotada)
    B-->>P: 400 Erro: Sem Vagas
    P->>B: Entrar na Lista de Espera
    B->>B: INSERT INTO lista_espera
    
    Note over B: Outro passageiro cancela a vaga...
    
    Loop a cada 60s
        J->>B: processarListaEspera()
        B->>B: Identifica vaga livre
        B->>P: Envia Notificação: "Vaga disponível! Você tem 5 min."
    end
```

## 4. Fluxo de Mensagens (Chat)
O chat utiliza **Polling** para garantir que as mensagens cheguem a ambos os lados.

```mermaid
sequenceDiagram
    participant A as Usuário A
    participant B as Backend
    participant C as Usuário B

    A->>B: POST /api/mensagens (Conteúdo)
    B->>B: Salva Mensagem
    
    Loop a cada 10s
        C->>B: GET /api/mensagens/nao-lidas
        B-->>C: { count: 1 }
        C->>B: GET /api/mensagens/:id
        B-->>C: [Lista de Mensagens Novas]
    end
```
