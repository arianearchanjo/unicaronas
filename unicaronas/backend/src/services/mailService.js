const nodemailer = require('nodemailer');

/**
 * Configuração do transporte SMTP utilizando variáveis de ambiente.
 * Suporta TLS (587) e SSL (465).
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10),
  secure: process.env.SMTP_PORT == 465, // true para 465 (SSL), false para 587 (TLS/STARTTLS)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    // Garante que a conexão não falhe em ambientes de dev com certificados self-signed
    rejectUnauthorized: process.env.NODE_ENV === 'production'
  }
});

/**
 * Validação da conexão SMTP ao carregar o módulo.
 */
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ [SMTP] Erro de autenticação ou conexão:', error.message);
  } else {
    if (process.env.NODE_ENV !== 'production') {
      console.log('✅ [SMTP] Servidor de e-mail pronto para envios.');
    }
  }
});

/**
 * Função assíncrona para envio de e-mails robusta.
 * @param {Object} options - { to, subject, html }
 * @returns {Promise} - Resultado do envio do Nodemailer
 */
const sendEmail = async ({ to, subject, html }) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || `"UniCaronas" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    // Log detalhado para depuração em desenvolvimento
    console.error('❌ [SMTP] Falha crítica no envio:', {
      code: error.code,
      command: error.command,
      response: error.response,
      message: error.message
    });
    
    throw new Error('Serviço de e-mail temporariamente indisponível.');
  }
};

/**
 * Helpers específicos para fluxos da plataforma (utilizam a função genérica sendEmail)
 */
const sendResetEmail = async (to, link) => {
  return sendEmail({
    to,
    subject: 'Recuperação de Senha - UniCaronas',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <h2 style="color: #007bff; text-align: center;">UniCaronas</h2>
        <p>Olá,</p>
        <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
        <p>Clique no botão abaixo para criar uma nova senha. Este link é válido por <strong>30 minutos</strong>.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${link}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Redefinir Senha</a>
        </div>
        <p>Se você não solicitou isso, ignore este e-mail.</p>
      </div>
    `
  });
};

const sendVerificationEmail = async (to, token) => {
  return sendEmail({
    to,
    subject: 'Confirme seu e-mail — UniCaronas',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <h2 style="color: #007bff; text-align: center;">UniCaronas</h2>
        <p>Seu código de verificação é:</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #007bff; background: #f4f4f4; padding: 10px 20px; border-radius: 5px;">${token}</span>
        </div>
        <p>Este código é válido por <strong>15 minutos</strong>.</p>
      </div>
    `
  });
};

module.exports = {
  sendEmail,
  sendResetEmail,
  sendVerificationEmail
};
