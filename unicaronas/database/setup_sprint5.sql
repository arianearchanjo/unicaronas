-- UniCaronas — Setup Sprint 5 (Correção de Acentos e Dados)
SET client_encoding = 'UTF8';

-- Limpeza
TRUNCATE usuarios, veiculos, caronas, solicitacoes_carona, mensagens_chat, pagamentos, avaliacoes, lista_espera, notificacoes RESTART IDENTITY CASCADE;

-- Usuários
INSERT INTO usuarios (nome, email, matricula, senha_hash, telefone, curso, dia_ead, avaliacao_media, total_avaliacoes, genero, status_verificacao, is_admin, forcar_reset, perfil_tipo) VALUES
  ('Ana Silva',    'ana.silva@unibrasil.com.br',    '2021001', '$2b$10$ruzTwjg7IDakql7r9IEHO.qxCdI2LrwPt5TbXC0SaduEJKxzQw8yW', '(41) 99001-0001', 'Engenharia de Software', 5, 4.8, 12, 'F', 'aprovado', false, false, 'motorista'),
  ('Carlos Lima',  'carlos.lima@unibrasil.com.br',  '2021002', '$2b$10$ruzTwjg7IDakql7r9IEHO.qxCdI2LrwPt5TbXC0SaduEJKxzQw8yW', '(41) 99001-0002', 'Farmácia',  NULL, 4.5,  8, 'M', 'pendente', false, false, 'estudante'),
  ('Julia Santos', 'julia.santos@unibrasil.com.br', '2020003', '$2b$10$ruzTwjg7IDakql7r9IEHO.qxCdI2LrwPt5TbXC0SaduEJKxzQw8yW', '(41) 99001-0003', 'Enfermagem', 4, 4.9, 20, 'F', 'aprovado', false, false, 'motorista'),
  ('João Costa',  'joao.costa@unibrasil.com.br',  '2022004', '$2b$10$ruzTwjg7IDakql7r9IEHO.qxCdI2LrwPt5TbXC0SaduEJKxzQw8yW', '(41) 99001-0004', 'Direito', NULL, 3.0,  1, 'M', 'pendente', false, false, 'estudante'),
  ('Ariane', 'ariane@unicaronas.divas.com', 'ADM-001', '$2b$10$ruzTwjg7IDakql7r9IEHO.qxCdI2LrwPt5TbXC0SaduEJKxzQw8yW', NULL, 'Administração', NULL, 5.0, 0, 'F', 'aprovado', true, true, 'misto'),
  ('Pedro', 'pedro@unicaronas.divas.com', 'ADM-002', '$2b$10$ruzTwjg7IDakql7r9IEHO.qxCdI2LrwPt5TbXC0SaduEJKxzQw8yW', NULL, 'Administração', NULL, 5.0, 0, 'M', 'aprovado', true, true, 'misto'),
  ('Matheus', 'matheus@unicaronas.divas.com', 'ADM-003', '$2b$10$ruzTwjg7IDakql7r9IEHO.qxCdI2LrwPt5TbXC0SaduEJKxzQw8yW', NULL, 'Administração', NULL, 5.0, 0, 'M', 'aprovado', true, true, 'misto'),
  ('Rafael', 'rafael@unicaronas.divas.com', 'ADM-004', '$2b$10$ruzTwjg7IDakql7r9IEHO.qxCdI2LrwPt5TbXC0SaduEJKxzQw8yW', NULL, 'Administração', NULL, 5.0, 0, 'M', 'aprovado', true, true, 'misto');


-- Veículos
INSERT INTO veiculos (usuario_id, marca, modelo, ano, cor, placa) VALUES
  (1, 'Fiat', 'Argo', 2020, 'Prata', 'ABC-1234'),
  (3, 'Chevrolet', 'Onix', 2019, 'Branco', 'XYZ-9876');

-- Caronas
INSERT INTO caronas (motorista_id, veiculo_id, origem, destino, ponto_encontro, horario_partida, vagas_totais, vagas_disponiveis, valor_cobrado, status, genero_preferencia) VALUES
  (1, 1, 'Batel', 'UniBrasil', 'Bloco 1', NOW() + INTERVAL '1 day', 3, 2, 9.00, 'ativa', 'todos'),
  -- LOTADA (para lista de espera)
  (1, 1, 'Portão', 'UniBrasil', 'Portaria', NOW() + INTERVAL '1 day 5 hours', 2, 0, 8.00, 'ativa', 'todos'),
  -- SÓ MULHERES
  (3, 2, 'Jardim das Américas', 'UniBrasil', 'Bloco 2', NOW() + INTERVAL '2 days', 3, 3, 5.00, 'ativa', 'somente_mulheres');

-- Preencher carona lotada
INSERT INTO solicitacoes_carona (carona_id, passageiro_id, status) VALUES (2, 2, 'aceita'), (2, 4, 'aceita');
