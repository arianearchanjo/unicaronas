const cron = require('node-cron');
const nodemailer = require('nodemailer');
const pool = require('../../config/database');

/**
 * Configuração do transportador de e-mail usando variáveis de ambiente.
 */
function getTransporter() {
  const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS } = process.env;

  if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASS) {
    console.warn('[Job Email] Configurações de e-mail incompletas no .env. Job de e-mail semanal desativado.');
    return null;
  }

  return nodemailer.createTransport({
    host: EMAIL_HOST,
    port: parseInt(EMAIL_PORT || 587),
    secure: EMAIL_PORT == 465,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS
    }
  });
}

/**
 * Gera o template HTML do e-mail semanal.
 */
function gerarTemplateEmail(usuario, caronas) {
  const itensTabela = caronas.map(c => `
    <tr style="border-bottom: 1px solid #333;">
      <td style="padding: 10px;">${new Date(c.horario_partida).toLocaleDateString('pt-BR')} ${new Date(c.horario_partida).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</td>
      <td style="padding: 10px;">${c.origem} → ${c.destino}</td>
      <td style="padding: 10px;">${c.papel.charAt(0).toUpperCase() + c.papel.slice(1)}</td>
      <td style="padding: 10px;">R$ ${parseFloat(c.valor_cobrado).toFixed(2)}</td>
    </tr>
  `).join('');

  return `
    <div style="background-color: #0a0a0f; color: #f0f0f5; font-family: sans-serif; padding: 20px; border-radius: 8px;">
      <h2 style="color: #6c63ff;">Olá, ${usuario.nome}!</h2>
      <p>Confira seu resumo de caronas para a próxima semana:</p>
      
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <thead>
          <tr style="background-color: #1a1a2e; color: #6c63ff;">
            <th style="padding: 10px; text-align: left;">Data/Hora</th>
            <th style="padding: 10px; text-align: left;">Itinerário</th>
            <th style="padding: 10px; text-align: left;">Papel</th>
            <th style="padding: 10px; text-align: left;">Valor</th>
          </tr>
        </thead>
        <tbody>
          ${itensTabela}
        </tbody>
      </table>

      <p style="margin-top: 30px; font-size: 0.9em; color: #aaa;">
        Desejamos a você ótimas viagens!
      </p>
      <hr style="border: 0; border-top: 1px solid #333; margin: 20px 0;">
      <p style="font-size: 0.8em; color: #777; text-align: center;">
        Para cancelar estas notificações, acesse seu perfil no UniCaronas.
      </p>
    </div>
  `;
}

/**
 * Processa o envio de e-mails para todos os usuários ativos com caronas agendadas.
 */
async function processarEmailsSemanais() {
  const transporter = getTransporter();
  if (!transporter) return;

  try {
    const { rows: usuarios } = await pool.query("SELECT id, nome, email FROM usuarios WHERE status = 'ativo'");

    for (const usuario of usuarios) {
      const queryCaronas = `
        SELECT c.*, 'motorista' as papel FROM caronas c
        WHERE c.motorista_id = $1 AND c.status = 'ativa' 
          AND c.horario_partida BETWEEN NOW() AND NOW() + INTERVAL '7 days'
        UNION ALL
        SELECT c.*, 'passageiro' as papel FROM caronas c
        JOIN solicitacoes_carona s ON s.carona_id = c.id
        WHERE s.passageiro_id = $1 AND s.status = 'aceita' AND c.status = 'ativa'
          AND c.horario_partida BETWEEN NOW() AND NOW() + INTERVAL '7 days'
        ORDER BY horario_partida ASC
      `;
      const { rows: caronas } = await pool.query(queryCaronas, [usuario.id]);

      if (caronas.length > 0) {
        const mailOptions = {
          from: process.env.EMAIL_FROM || '"UniCaronas" <no-reply@unicaronas.com>',
          to: usuario.email,
          subject: 'Resumo Semanal de Caronas - UniCaronas',
          html: gerarTemplateEmail(usuario, caronas)
        };

        await transporter.sendMail(mailOptions);
      }
    }
    console.log('[Job Email] E-mails semanais enviados com sucesso.');
  } catch (err) {
    console.error('Erro no job de e-mail semanal:', err);
  }
}

function iniciarJobEmailSemanal() {
  // Toda segunda-feira às 8h: '0 8 * * 1'
  cron.schedule('0 8 * * 1', () => {
    console.log('[Job] Iniciando envio de e-mails semanais...');
    processarEmailsSemanais();
  });
}

module.exports = { iniciarJobEmailSemanal };
