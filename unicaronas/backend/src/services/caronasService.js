const db = require('../../config/database');
const { calcularValorSugerido } = require('../utils/precificacao');
const notificacoesService = require('./notificacoesService');

const caronasService = {
  async criar(dados, motorista_id) {
    const {
      origem, destino, horario_partida, vagas_totais,
      valor_cobrado, distancia_km, observacoes, recorrente,
      veiculo_id, ponto_encontro, ponto_encontro_detalhes, itinerario,
      genero_preferencia
    } = dados;

    if (!ponto_encontro || !ponto_encontro.trim()) {
      throw { status: 400, message: 'O ponto de encontro é obrigatório.', code: 'VALOR_INVALIDO' };
    }

    if (veiculo_id) {
      const { rows: veiculos } = await db.query('SELECT id FROM veiculos WHERE id = $1 AND usuario_id = $2', [veiculo_id, motorista_id]);
      if (veiculos.length === 0) {
        throw { status: 400, message: 'Veículo inválido ou não pertence ao usuário.', code: 'VEICULO_INVALIDO' };
      }
    }

    const { rows: userRows } = await db.query('SELECT dia_ead, genero FROM usuarios WHERE id = $1', [motorista_id]);
    const { dia_ead, genero: motorista_genero } = userRows[0] || {};

    if (genero_preferencia === 'somente_mulheres' && motorista_genero !== 'F') {
      throw { status: 400, message: 'Apenas motoristas do gênero feminino podem criar caronas exclusivas para mulheres.', code: 'GENERO_NAO_AUTORIZADO' };
    }

    const horario = new Date(horario_partida);
    if (isNaN(horario.getTime()) || horario <= new Date()) {
      throw { status: 400, message: 'Horário de partida inválido ou no passado.', code: 'HORARIO_INVALIDO' };
    }

    if (dia_ead !== null && horario.getDay() === dia_ead) {
      throw { status: 422, message: "Você não pode criar uma carona neste dia pois é o seu dia EAD.", code: 'DIA_EAD' };
    }

    const vagas = parseInt(vagas_totais, 10);
    const valor = parseFloat(valor_cobrado);
    const distancia = distancia_km ? parseFloat(distancia_km) : null;
    const valor_sugerido = distancia ? calcularValorSugerido(distancia) : null;

    const { rows } = await db.query(
      `INSERT INTO caronas
         (motorista_id, veiculo_id, origem, destino, ponto_encontro, ponto_encontro_detalhes, horario_partida, vagas_totais, vagas_disponiveis,
          valor_sugerido, valor_cobrado, distancia_km, observacoes, recorrente, itinerario, genero_preferencia)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [
        motorista_id, veiculo_id || null, origem.trim(), destino.trim(), ponto_encontro.trim(),
        ponto_encontro_detalhes?.trim() || null, horario_partida, vagas, valor_sugerido,
        valor, distancia, observacoes?.trim() || null, recorrente || false, itinerario?.trim() || null,
        genero_preferencia || 'todos'
      ]
    );

    return rows[0];
  },

  async buscarPorId(id) {
    const { rows } = await db.query(
      `SELECT c.*, u.nome as motorista_nome, u.foto_url as motorista_foto,
              v.marca, v.modelo, v.placa, v.cor
       FROM caronas c
       JOIN usuarios u ON c.motorista_id = u.id
       LEFT JOIN veiculos v ON c.veiculo_id = v.id
       WHERE c.id = $1`,
      [id]
    );
    if (rows.length === 0) throw { status: 404, message: 'Carona não encontrada', code: 'NAO_ENCONTRADO' };

    const { rows: passageiros } = await db.query(
      `SELECT u.id, u.nome, u.foto_url, s.status
       FROM solicitacoes_carona s
       JOIN usuarios u ON s.passageiro_id = u.id
       WHERE s.carona_id = $1 AND s.status = 'aceita'`,
      [id]
    );

    return { ...rows[0], passageiros };
  },

  async concluir(id, motorista_id) {
    const { rows } = await db.query(
      'UPDATE caronas SET status = \'concluida\', atualizado_em = NOW() WHERE id = $1 AND motorista_id = $2 RETURNING *',
      [id, motorista_id]
    );
    if (rows.length === 0) throw { status: 404, message: 'Carona não encontrada ou não autorizada', code: 'NAO_AUTORIZADO' };
    return rows[0];
  }
};

module.exports = caronasService;
