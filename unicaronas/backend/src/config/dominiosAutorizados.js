/**
 * Lista de domínios de e-mail autorizados para cadastro no UniCaronas.
 * Adicione aqui os domínios das universidades parceiras.
 */
const dominiosAutorizados = [
  'usp.br',
  'unicamp.br',
  'unesp.br',
  'fatec.sp.gov.br',
  'unifesp.br',
  'ufscar.br',
  'ita.br',
  'unibrasil.com.br',
  'pucpr.com.br',
];

const dominioAdmin = 'unicaronas.divas.com.br';

module.exports = {
  dominiosAutorizados,
  dominioAdmin
};
