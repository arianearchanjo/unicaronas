// backend/src/utils/precificacao.js

/**
 * Calcula o valor sugerido de uma carona baseado em custos reais.
 * 
 * Fórmula:
 *   custo_viagem = (distancia_km / km_por_litro) * preco_gasolina
 *   valor_base   = custo_viagem / 4 (assume motorista + 3 passageiros para dividir o custo)
 *   taxa         = valor_base * (porcentagem_plataforma / 100)
 *   valor_sugerido = valor_base + taxa
 */
const calcularValorSugerido = (distancia_km) => {
  const precoGasolina = parseFloat(process.env.GAS_PRICE || '5.50');
  const kmPorLitro    = parseFloat(process.env.KM_PER_LITER || '10');
  const taxaPercent   = parseFloat(process.env.TAXA_PLATAFORMA_PERCENT || '10') / 100;
  
  if (!distancia_km || distancia_km <= 0) return 0;

  // Custo total de combustível para a viagem
  const custoCombustivelTotal = (distancia_km / kmPorLitro) * precoGasolina;
  
  // Dividir por 4 (1 motorista + 3 passageiros) para sugerir um valor que cubra o custo
  // entre os ocupantes do carro.
  const valorBasePorPassageiro = custoCombustivelTotal / 4;
  
  // Adiciona a margem/taxa da plataforma
  const valorComTaxa = valorBasePorPassageiro * (1 + taxaPercent);

  return Math.round(valorComTaxa * 100) / 100; // arredondar para 2 casas
};

/**
 * Calcula a taxa da plataforma e o repasse ao motorista.
 *
 * @param {number} valorTotal - Valor total pago pelo passageiro
 * @returns {{ taxa: number, repasse: number }}
 */
const calcularTaxa = (valorTotal) => {
  const taxaPercent = parseFloat(process.env.TAXA_PLATAFORMA_PERCENT || '10') / 100;
  const taxa        = Math.round(valorTotal * taxaPercent * 100) / 100;
  const repasse     = Math.round((valorTotal - taxa) * 100) / 100;
  return { taxa, repasse };
};

module.exports = { calcularValorSugerido, calcularTaxa };
