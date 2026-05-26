import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendConfirmacionCorreo({ nombre, correo, token }) {
  const base = process.env.FRONTEND_URL || 'http://localhost:5173';
  const url = `${base}/confirmar-correo?token=${token}`;

  await transporter.sendMail({
    from: `"ANUNZA" <${process.env.EMAIL_USER}>`,
    to: correo,
    subject: 'Confirma tu correo en ANUNZA',
    html: `
      <!DOCTYPE html>
      <html lang="es">
      <head><meta charset="UTF-8"/></head>
      <body style="margin:0;padding:0;background:#f5f2ff;font-family:sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f2ff;padding:40px 0;">
          <tr><td align="center">
            <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(79,70,229,.10);">
              <tr>
                <td style="background:#4f46e5;padding:32px 40px;text-align:center;">
                  <span style="font-size:28px;font-weight:900;color:#fff;letter-spacing:1px;">
                    ANUN<span style="color:#c4b5fd;">ZA</span>
                  </span>
                </td>
              </tr>
              <tr>
                <td style="padding:36px 40px 28px;">
                  <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#1e1b4b;">
                    Hola, ${nombre} 👋
                  </p>
                  <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
                    Gracias por registrarte en <strong>ANUNZA</strong>. Para activar tu cuenta y empezar a conectar con personas y servicios cerca de ti, confirma tu correo haciendo clic en el botón:
                  </p>
                  <div style="text-align:center;margin:28px 0;">
                    <a href="${url}" style="background:#4f46e5;color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:15px;font-weight:700;display:inline-block;">
                      Confirmar mi correo
                    </a>
                  </div>
                  <p style="margin:0 0 8px;font-size:13px;color:#6b7280;line-height:1.5;">
                    Si el botón no funciona, copia y pega este enlace en tu navegador:
                  </p>
                  <p style="margin:0 0 24px;font-size:12px;color:#4f46e5;word-break:break-all;">${url}</p>
                  <p style="margin:0;font-size:13px;color:#9ca3af;">
                    Este enlace expira en <strong>24 horas</strong>. Si no te registraste en ANUNZA, ignora este correo.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="background:#f9fafb;padding:18px 40px;text-align:center;border-top:1px solid #e5e7eb;">
                  <p style="margin:0;font-size:12px;color:#9ca3af;">
                    ANUNZA · DALATEC · Santander de Quilichao, Cauca – Colombia<br/>
                    <a href="mailto:privacidad.anunza@gmail.com" style="color:#6b7280;">privacidad.anunza@gmail.com</a>
                  </p>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  });
}
