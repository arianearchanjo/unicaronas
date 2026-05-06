const cron = require('node-cron');
const nodemailer = require('nodemailer');
const pool = require('../../config/database');

/**
 * Configuração do transportador de e-mail usando variáveis de ambiente.
 */
function getTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn('[Job Email] Configurações SMTP incompletas no .env. Job de e-mail semanal desativado.');
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT || 587),
    secure: SMTP_PORT == 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });
}

/**
 * Gera o template HTML do e-mail semanal.
 */
function gerarTemplateEmail(usuario, caronas) {
  const itensTabela = caronas.map(c => `
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 12px;">${c.origem} → ${c.destino}</td>
      <td style="padding: 12px;">${new Date(c.horario_partida).toLocaleString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
      <td style="padding: 12px;">${c.motorista_nome}</td>
      <td style="padding: 12px;">R$ ${parseFloat(c.valor_cobrado).toFixed(2)}</td>
    </tr>
  `).join('');

  return `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
      <div style="background-color: #6c63ff; padding: 20px; text-align: center; color: white;">
        <h1 style="margin: 0;">UniCaronas</h1>
        <p style="margin: 5px 0 0;">Seu resumo semanal de caronas</p>
      </div>
      
      <div style="padding: 20px;">
        <p>Olá, <strong>${usuario.nome}</strong>!</p>
        <p>Encontramos algumas caronas disponíveis nesta semana para a sua rota preferida (<strong>${usuario.rota_preferida_origem} → ${usuario.rota_preferida_destino}</strong>):</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px;">
          <thead>
            <tr style="background-color: #f8f9fa; border-bottom: 2px solid #6c63ff;">
              <th style="padding: 12px; text-align: left;">Rota</th>
              <th style="padding: 12px; text-align: left;">Horário</th>
              <th style="padding: 12px; text-align: left;">Motorista</th>
              <th style="padding: 12px; text-align: left;">Valor</th>
            </tr>
          </thead>
          <tbody>
            ${itensTabela}
          </tbody>
        </table>

        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5500'}/pages/buscar.html" 
             style="background-color: #6c63ff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            Ver todas as caronas
          </a>
        </div>
      </div>

      <div style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #777;">
        <p>Você recebeu este e-mail porque cadastrou uma rota preferida no UniCaronas.</p>
        <p>Deseja parar de receber estes e-mails? <a href="${process.env.FRONTEND_URL || 'http://localhost:5500'}/pages/perfil.html" style="color: #6c63ff;">Desativar resumo semanal</a>.</p>
        <p>&copy; 2026 UniCaronas</p>
      </div>
    </div>
  `;
}

/**
 * Processa o envio de e-mails para usuários com rota preferida e matching de caronas.
 */
async function processarEmailsSemanais() {
  const transporter = getTransporter();
  if (!transporter) return;

  try {
    const queryUsuarios = `
      SELECT id, nome, email, rota_preferida_origem, rota_preferida_destino 
      FROM usuarios 
      WHERE receber_email_semanal = true 
        AND rota_preferida_origem IS NOT NULL 
        AND rota_preferida_destino IS NOT NULL
        AND status = 'ativo'
    `;
    const { rows: usuarios } = await pool.query(queryUsuarios);

    for (const usuario of usuarios) {
      const queryCaronas = `
        SELECT c.*, u.nome AS motorista_nome 
        FROM caronas c
        JOIN usuarios u ON u.id = c.motorista_id
        WHERE c.status = 'ativa' 
          AND c.vagas_disponiveis > 0
          AND c.horario_partida BETWEEN NOW() AND NOW() + INTERVAL '7 days'
          AND (LOWER(c.origem) LIKE LOWER($1) OR LOWER(c.itinerario) LIKE LOWER($1))
          AND (LOWER(c.destino) LIKE LOWER($2) OR LOWER(c.itinerario) LIKE LOWER($2))
        ORDER BY c.horario_partida ASC
        LIMIT 10
      `;
      const { rows: caronas } = await pool.query(queryCaronas, [`%${usuario.rota_preferida_origem}%`, `%${usuario.rota_preferida_destino}%`]);

      if (caronas.length > 0) {
        const mailOptions = {
          from: process.env.EMAIL_FROM || '"UniCaronas" <contato@unicaronas.com>',
          to: usuario.email,
          subject: 'Resumo Semanal de Caronas - UniCaronas',
          html: gerarTemplateEmail(usuario, caronas)
        };

        await transporter.sendMail(mailOptions);
      }
    }
    console.log('[Job Email] E-mails semanais processados.');
  } catch (err) {
    console.error('Erro no job de e-mail semanal:', err);
  }
}

function iniciarJobEmailSemanal() {
  // Toda segunda-feira às 07h00: '0 7 * * 1'
  cron.schedule('0 7 * * 1', () => {
    console.log('[Job] Iniciando envio de e-mails semanais...');
    processarEmailsSemanais();
  });
}

module.exports = { iniciarJobEmailSemanal, processarEmailsSemanais };
