import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";

if (!process.env.MAILERSEND_API_KEY) {
  throw new Error("MAILERSEND_API_KEY environment variable must be set");
}

const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY,
});

interface SendPasswordResetEmailParams {
  to: string;
  code: string;
  username: string;
}

export async function sendPasswordResetEmail(params: SendPasswordResetEmailParams): Promise<boolean> {
  try {
    const sentFrom = new Sender("noreply@trial-z3m5jgrk0z3l7qrx.mlsender.net", "ToGo - Recuperação de Senha");
    const recipients = [new Recipient(params.to, params.username)];

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setSubject("ToGo - Código de Recuperação de Senha")
      .setHtml(`
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #22c55e; margin: 0;">ToGo</h1>
            <p style="color: #666; margin: 5px 0;">Plataforma de Descoberta de Lugares</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
            <h2 style="color: #333; margin-top: 0;">Recuperação de Senha</h2>
            <p style="color: #666; line-height: 1.6;">
              Olá, <strong>${params.username}</strong>!
            </p>
            <p style="color: #666; line-height: 1.6;">
              Você solicitou a redefinição da sua senha no ToGo. Use o código abaixo para criar uma nova senha:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <span style="background: #22c55e; color: white; font-size: 32px; font-weight: bold; padding: 15px 30px; border-radius: 8px; letter-spacing: 5px; display: inline-block;">
                ${params.code}
              </span>
            </div>
            
            <p style="color: #666; line-height: 1.6;">
              Este código é válido por <strong>15 minutos</strong> e pode ser usado apenas uma vez.
            </p>
            
            <p style="color: #666; line-height: 1.6;">
              Se você não solicitou esta redefinição, ignore este email. Sua senha permanecerá inalterada.
            </p>
          </div>
          
          <div style="text-align: center; color: #999; font-size: 14px;">
            <p>Este é um email automático, não responda.</p>
            <p>&copy; 2025 ToGo - Todos os direitos reservados</p>
          </div>
        </div>
      `)
      .setText(`
        ToGo - Recuperação de Senha
        
        Olá, ${params.username}!
        
        Você solicitou a redefinição da sua senha no ToGo.
        Use o código abaixo para criar uma nova senha:
        
        Código: ${params.code}
        
        Este código é válido por 15 minutos e pode ser usado apenas uma vez.
        
        Se você não solicitou esta redefinição, ignore este email.
        
        ToGo - Plataforma de Descoberta de Lugares
      `);

    await mailerSend.email.send(emailParams);
    return true;
  } catch (error) {
    console.error('MailerSend email error:', error);
    return false;
  }
}