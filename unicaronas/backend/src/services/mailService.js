const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  secure: process.env.MAIL_PORT == 465, // true para 465, false para outras portas
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

/**
 * Envia e-mail de recuperação de senha
 * @param {string} to - E-mail do destinatário
 * @param {string} link - Link com o token de reset
 */
const sendResetEmail = async (to, link) => {
  const mailOptions = {
    from: `"UniCaronas" <${process.env.MAIL_USER}>`,
    to: to,
    subject: 'Recuperação de Senha - UniCaronas',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <h2 style="color: #007bff; text-align: center;">UniCaronas</h2>
        <p>Olá,</p>
        <p>Recebemos uma solicitação para redefinir a senha da sua conta no <strong>UniCaronas</strong>.</p>
        <p>Clique no botão abaixo para criar uma nova senha. Este link é válido por <strong>30 minutos</strong>.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${link}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Redefinir Senha</a>
        </div>
        <p>Se você não solicitou isso, ignore este e-mail.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #777; text-align: center;">
          Este é um e-mail automático, por favor não responda.
        </p>
      </div>
    `,
  };
  try {
    await transporter.sendMail(mailOptions);
    console.log(`[MailService] E-mail de reset enviado para: ${to}`);
  } catch (error) {
    console.error('[MailService] Erro ao enviar e-mail:', error);
    throw new Error('Não foi possível enviar o e-mail de recuperação.');
  }
};

module.exports = {
  sendResetEmail,
};
