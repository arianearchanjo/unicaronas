// backend/src/utils/precificacao.js

/**
 * Calcula o valor sugerido de uma carona baseado na distância.
 *
 * Fórmula:
 *   valor_sugerido = distancia_km × custo_por_km
 *
 * O custo_por_km padrão é R$0,30 mas pode ser configurado via
 * variável de ambiente CUSTO_POR_KM.
 *
 * @param {number} distancia_km - Distância estimada do trajeto em km
 * @returns {number} Valor sugerido em reais, arredondado para 2 casas decimais
 *
 * @example
 * calcularValorSugerido(30)  // → 9.00
 * calcularValorSugerido(20)  // → 6.00
 * calcularValorSugerido(15)  // → 4.50
 */
const calcularValorSugerido = (distancia_km) => {
  const custoPorKm = parseFloat(process.env.CUSTO_POR_KM || '0.30');
  const valor = distancia_km * custoPorKm;
  return Math.round(valor * 100) / 100; // arredondar para 2 casas
};

/**
 * Calcula a taxa da plataforma e o repasse ao motorista.
 *
 * Taxa padrão: 10% (configurável via TAXA_PLATAFORMA_PERCENT)
 *
 * @param {number} valorTotal - Valor total pago pelo passageiro
 * @returns {{ taxa: number, repasse: number }}
 *
 * @example
 * calcularTaxa(10.00) // → { taxa: 1.00, repasse: 9.00 }
 */
const calcularTaxa = (valorTotal) => {
  const taxaPercent = parseFloat(process.env.TAXA_PLATAFORMA_PERCENT || '10') / 100;
  const taxa        = Math.round(valorTotal * taxaPercent * 100) / 100;
  const repasse     = Math.round((valorTotal - taxa) * 100) / 100;
  return { taxa, repasse };
};

module.exports = { calcularValorSugerido, calcularTaxa };
