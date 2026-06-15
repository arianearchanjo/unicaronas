-- Seed minimo para producao — apenas administradores
TRUNCATE usuarios, veiculos, caronas, solicitacoes_carona, mensagens_chat, pagamentos, avaliacoes, lista_espera, notificacoes RESTART IDENTITY CASCADE;

INSERT INTO usuarios (nome, email, matricula, senha_hash, telefone, curso, dia_ead, avaliacao_media, total_avaliacoes, genero, status_verificacao, is_admin, forcar_reset, perfil_tipo) VALUES
  ('Ariane', 'ariane@unicaronas.divas.com', 'ADM-001', '$2b$10$ruzTwjg7IDakql7r9IEHO.qxCdI2LrwPt5TbXC0SaduEJKxzQw8yW', NULL, 'Administracao', NULL, 5.0, 0, 'F', 'aprovado', true, true, 'misto'),
  ('Pedro', 'pedro@unicaronas.divas.com', 'ADM-002', '$2b$10$ruzTwjg7IDakql7r9IEHO.qxCdI2LrwPt5TbXC0SaduEJKxzQw8yW', NULL, 'Administracao', NULL, 5.0, 0, 'M', 'aprovado', true, true, 'misto'),
  ('Matheus', 'matheus@unicaronas.divas.com', 'ADM-003', '$2b$10$ruzTwjg7IDakql7r9IEHO.qxCdI2LrwPt5TbXC0SaduEJKxzQw8yW', NULL, 'Administracao', NULL, 5.0, 0, 'M', 'aprovado', true, true, 'misto'),
  ('Rafael', 'rafael@unicaronas.divas.com', 'ADM-004', '$2b$10$ruzTwjg7IDakql7r9IEHO.qxCdI2LrwPt5TbXC0SaduEJKxzQw8yW', NULL, 'Administracao', NULL, 5.0, 0, 'M', 'aprovado', true, true, 'misto');
