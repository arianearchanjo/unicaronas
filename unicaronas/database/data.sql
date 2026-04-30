-- =============================================================
-- UniCaronas — Dados de Teste (seed) - Sprint 5 Final
-- =============================================================
-- ATENÇÃO: Senhas estão em hash bcrypt de "senha123"

-- Limpeza para garantir integridade no reset
TRUNCATE usuarios, veiculos, caronas, solicitacoes_carona, mensagens_chat, pagamentos, avaliacoes, lista_espera, notificacoes RESTART IDENTITY CASCADE;

-- 1. USUÁRIOS (com campo genero)
INSERT INTO usuarios (nome, email, matricula, senha_hash, telefone, curso, dia_ead, avaliacao_media, total_avaliacoes, genero) VALUES
  ('Ana Silva',    'ana.silva@unibrasil.com.br',    '2021001', '$2b$10$ruzTwjg7IDakql7r9IEHO.qxCdI2LrwPt5TbXC0SaduEJKxzQw8yW', '(41) 99001-0001', 'Engenharia de Software', 5, 4.8, 12, 'F'),
  ('Carlos Lima',  'carlos.lima@unibrasil.com.br',  '2021002', '$2b$10$ruzTwjg7IDakql7r9IEHO.qxCdI2LrwPt5TbXC0SaduEJKxzQw8yW', '(41) 99001-0002', 'Farmácia',  NULL, 4.5,  8, 'M'),
  ('Julia Santos', 'julia.santos@unibrasil.com.br', '2020003', '$2b$10$ruzTwjg7IDakql7r9IEHO.qxCdI2LrwPt5TbXC0SaduEJKxzQw8yW', '(41) 99001-0003', 'Enfermagem', 4, 4.9, 20, 'F'),
  ('João Costa',  'joao.costa@unibrasil.com.br',  '2022004', '$2b$10$ruzTwjg7IDakql7r9IEHO.qxCdI2LrwPt5TbXC0SaduEJKxzQw8yW', '(41) 99001-0004', 'Direito', NULL, 3.0,  1, 'M'),
  ('Mariana Rocha','mariana.rocha@unibrasil.com.br','2021005', '$2b$10$ruzTwjg7IDakql7r9IEHO.qxCdI2LrwPt5TbXC0SaduEJKxzQw8yW', '(41) 99001-0005', 'Psicologia',  NULL, 4.2,  5, 'F');

-- 2. VEÍCULOS
INSERT INTO veiculos (usuario_id, marca, modelo, ano, cor, placa) VALUES
  (1, 'Fiat', 'Argo', 2020, 'Prata', 'ABC-1234'),
  (3, 'Chevrolet', 'Onix', 2019, 'Branco', 'XYZ-9876'),
  (5, 'Volkswagen', 'Tracker', 2022, 'Preto', 'DEF-5678');

-- 3. CARONAS (com genero_preferencia)
INSERT INTO caronas (motorista_id, veiculo_id, origem, destino, ponto_encontro, ponto_encontro_detalhes, horario_partida, vagas_totais, vagas_disponiveis, valor_sugerido, valor_cobrado, distancia_km, status, recorrente, genero_preferencia) VALUES
  -- Caronas ativas normais
  (1, 1, 'Bairro Batel, Curitiba',    'UniBrasil', 'Bloco 1', 'Entrada principal', NOW() + INTERVAL '1 day 2 hours', 3, 2, 9.00,  9.00, 30.0, 'ativa', false, 'todos'),
  (3, 2, 'Centro, Curitiba',          'UniBrasil', 'Bloco 4', 'Perto da lanchonete', NOW() + INTERVAL '1 day 3 hours', 2, 1, 6.00,  7.00, 20.0, 'ativa', false, 'todos'),
  
  -- Carona LOTADA para testar Lista de Espera (ID 3)
  (1, 1, 'Bairro Portão, Curitiba',   'UniBrasil', 'Portaria', 'Em frente ao totem', NOW() + INTERVAL '1 day 5 hours', 2, 0, 8.00,  8.00, 25.0, 'ativa', false, 'todos'),

  -- Carona "SÓ MULHERES" (ID 4)
  (3, 2, 'Jardim das Américas',       'UniBrasil', 'Bloco 2', 'Saída lateral', NOW() + INTERVAL '2 days 2 hours', 3, 3, 5.00,  5.00, 15.0, 'ativa', false, 'somente_mulheres'),

  -- Caronas concluídas
  (1, 1, 'Bairro Batel, Curitiba',    'UniBrasil', 'Bloco 1', NULL, NOW() - INTERVAL '2 days', 3, 0, 9.00,  9.00, 30.0, 'concluida', false, 'todos');

-- 4. SOLICITAÇÕES
INSERT INTO solicitacoes_carona (carona_id, passageiro_id, status) VALUES  
  (1, 2, 'aceita'),
  (2, 4, 'pendente'),
  (3, 2, 'aceita'), -- Preenchendo a carona lotada
  (3, 4, 'aceita'), -- Preenchendo a carona lotada
  (5, 3, 'aceita');

-- 5. AVALIAÇÕES
INSERT INTO avaliacoes (solicitacao_id, avaliador_id, avaliado_id, nota, comentario) VALUES
  (1, 2, 1, 5, 'Ana é uma excelente motorista! Muito pontual.'),
  (1, 1, 2, 4, 'Carlos foi um ótimo passageiro, educado e pontual.');

-- 6. MENSAGENS
INSERT INTO mensagens_chat (solicitacao_id, remetente_id, conteudo) VALUES
  (1, 2, 'Oi Ana! Vi que você tem vaga, posso entrar na carona?'),
  (1, 1, 'Claro Carlos! Vou te pegar na Praça Oswaldo Cruz às 7h15.'),
  (1, 2, 'Perfeito, estarei lá! Obrigado.');

-- 7. PAGAMENTOS
INSERT INTO pagamentos (solicitacao_id, valor_total, taxa_plataforma, valor_motorista, status, metodo, pago_em) VALUES
  (1, 9.00, 0.90, 8.10, 'pago', 'pix', NOW() - INTERVAL '1 day');
