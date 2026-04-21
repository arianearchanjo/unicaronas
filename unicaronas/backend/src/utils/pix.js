/**
 * unicaronas/backend/src/utils/pix.js
 *
 * Gerador de Payload Pix BR Code (padrão EMV — Banco Central do Brasil)
 * Funciona sem nenhuma dependência externa.
 *
 * Spec: Manual de Padrões para Iniciação do Pix — BACEN
 * https://www.bcb.gov.br/content/estabilidadefinanceira/pix/Regulamento_Pix/II_ManualdePadroesparaaIniciacaodoPix-versao3.pdf
 */

/**
 * Calcula o CRC-16/CCITT-FALSE de uma string.
 * Polinômio: 0x1021 — usado pelo padrão EMV Pix.
 */
function crc16(str) {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc <<= 1;
      }
      crc &= 0xFFFF;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Formata um campo TLV (Tag-Length-Value) do padrão EMV.
 * @param {string} id    - ID do campo (2 dígitos)
 * @param {string} value - Valor do campo
 */
function campo(id, value) {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

/**
 * Gera o payload Pix Copia e Cola (BR Code) para uma chave Pix.
 *
 * @param {object} params
 * @param {string} params.chave       - Chave Pix (CPF, email, telefone ou aleatória)
 * @param {string} params.nome        - Nome do recebedor (max 25 chars)
 * @param {string} params.cidade      - Cidade do recebedor (max 15 chars)
 * @param {number} params.valor       - Valor em reais (ex: 12.50)
 * @param {string} [params.txid]      - ID da transação (max 25 chars, sem espaços)
 * @param {string} [params.descricao] - Descrição (max 72 chars)
 *
 * @returns {string} Payload Pix pronto para gerar QR Code
 */
function gerarPayloadPix({ chave, nome, cidade, valor, txid = '***', descricao = '' }) {
  const nomeSanitizado   = nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').substring(0, 25);
  const cidadeSanitizada = cidade.normalize('NFD').replace(/[\u0300-\u036f]/g, '').substring(0, 15);
  const txidSanitizado   = (txid === '***' ? '***' : txid.replace(/\s/g, '').substring(0, 25)) || '***';

  const payloadFormatIndicator = campo('00', '01');

  const merchantAccountInfo = campo(
    '26',
    campo('00', 'BR.GOV.BCB.PIX') +
    campo('01', chave) +
    (descricao ? campo('02', descricao.substring(0, 72)) : '')
  );

  const merchantCategoryCode = campo('52', '0000');
  const transactionCurrency  = campo('53', '986');
  const transactionAmount    = valor > 0 ? campo('54', valor.toFixed(2)) : '';
  const countryCode          = campo('58', 'BR');
  const merchantName         = campo('59', nomeSanitizado);
  const merchantCity         = campo('60', cidadeSanitizada);
  const additionalData       = campo('62', campo('05', txidSanitizado));

  const payloadSemCRC =
    payloadFormatIndicator +
    merchantAccountInfo +
    merchantCategoryCode +
    transactionCurrency +
    transactionAmount +
    countryCode +
    merchantName +
    merchantCity +
    additionalData +
    '6304';

  return payloadSemCRC + crc16(payloadSemCRC);
}

/**
 * Gera um TXID único para a transação UniCaronas.
 * Padrão: UC + timestamp base36 + 8 chars aleatórios (max 25 chars)
 */
function gerarTxId() {
  const ts   = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `UC${ts}${rand}`.substring(0, 25);
}

module.exports = { gerarPayloadPix, gerarTxId, crc16 };